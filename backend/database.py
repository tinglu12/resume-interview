from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from config import settings

# asyncpg doesn't accept sslmode/channel_binding query params — strip them
# and pass SSL via connect_args instead
def _clean_url(url: str) -> str:
    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    params.pop("sslmode", None)
    params.pop("channel_binding", None)
    clean = parsed._replace(query=urlencode({k: v[0] for k, v in params.items()}))
    return urlunparse(clean)

_url = _clean_url(settings.database_url)
_ssl = "require" if "neon.tech" in settings.database_url else None

engine = create_async_engine(
    _url,
    echo=False,
    connect_args={"ssl": _ssl} if _ssl else {},
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
