from redis import asyncio as aioredis
from app.config import settings

redis_client = aioredis.from_url(
    str(settings.redis_url),
    decode_responses=True,
)

async def get_redis_client():
    return redis_client