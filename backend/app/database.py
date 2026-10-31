from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

Base = declarative_base()

engine = None
AsyncSessionLocal = None

if settings.database_url:
    engine = create_async_engine(
        settings.database_url,
        echo=settings.environment == "development",
        pool_pre_ping=True,
    )
    AsyncSessionLocal = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )


async def get_db():
    if AsyncSessionLocal is None:
        raise RuntimeError("Database not configured. Set DATABASE_URL.")
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()