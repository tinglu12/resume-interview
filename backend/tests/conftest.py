import os

# Point the app at a dedicated test database, not local dev or prod. Must be
# set before anything imports `config`/`database`/`main`, since Settings()
# is instantiated at module import time.
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5433/resume_interview_test",
)

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

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


@pytest.fixture
def test_user_id() -> str:
    return TEST_USER_ID
