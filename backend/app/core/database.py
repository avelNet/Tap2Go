from sqlalchemy.ext.asyncio import create_async_engine
from app.config import settings

engine = create_async_engine(
    str(settings.database_url),
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db_session():
    async with AsyncSessionLocal() as session:
        yield session