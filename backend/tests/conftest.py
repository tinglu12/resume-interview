import os

# Point the app at a dedicated test database, not local dev or prod. Must be
# set before anything imports `config`/`database`/`main`, since Settings()
# is instantiated at module import time.
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5433/resume_interview_test",
)

import time

import pytest
import pytest_asyncio
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from httpx import ASGITransport, AsyncClient
from jose import jwk, jwt
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

import auth
import interview.models  # noqa: F401 - registers interview tables on Base.metadata
from auth import verify_clerk_token
from database import Base, get_db
from main import app

TEST_USER_ID = "test-user-123"


@pytest_asyncio.fixture(scope="session")
async def engine():
    test_engine = create_async_engine(os.environ["DATABASE_URL"])
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield test_engine
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine):
    """A session bound to a rolled-back-per-test outer transaction.

    App code (repositories) calls session.commit(); with
    join_transaction_mode="create_savepoint" those become savepoints nested
    inside the outer transaction, which we roll back at teardown so tests
    never leak data into each other.
    """
    async with engine.connect() as connection:
        await connection.begin()
        session = AsyncSession(
            bind=connection,
            join_transaction_mode="create_savepoint",
            expire_on_commit=False,
        )
        try:
            yield session
        finally:
            await session.close()
            await connection.rollback()


@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    async def override_verify_clerk_token():
        return TEST_USER_ID

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[verify_clerk_token] = override_verify_clerk_token

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def unauthenticated_client(db_session):
    """A client with the DB overridden but real Clerk auth still enforced."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def test_user_id() -> str:
    return TEST_USER_ID


@pytest.fixture(scope="session")
def rsa_keypair():
    """A real RSA keypair for building signed JWTs + a matching JWKS in auth tests."""
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    public_pem = (
        private_key.public_key()
        .public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        .decode()
    )
    return {"private_pem": private_pem, "public_pem": public_pem}


@pytest.fixture
def jwks(rsa_keypair):
    """A JWKS document (as Clerk would serve it) containing the test public key."""
    key_dict = jwk.construct(rsa_keypair["public_pem"], algorithm="RS256").to_dict()
    key_dict["kid"] = "test-kid"
    return {"keys": [key_dict]}


@pytest.fixture
def make_jwt(rsa_keypair):
    """Builds a signed JWT for auth tests. Pass claim/header overrides as kwargs."""

    def _make_jwt(*, sub: str = TEST_USER_ID, kid: str = "test-kid", exp: int | None = None, **extra_claims) -> str:
        claims = {"sub": sub, "exp": exp if exp is not None else int(time.time()) + 3600, **extra_claims}
        return jwt.encode(claims, rsa_keypair["private_pem"], algorithm="RS256", headers={"kid": kid})

    return _make_jwt


@pytest.fixture(autouse=True)
def _reset_jwks_cache():
    """auth._jwks_cache is a bare module global with no expiry — never let it leak across tests."""
    auth._jwks_cache = None
    yield
    auth._jwks_cache = None
