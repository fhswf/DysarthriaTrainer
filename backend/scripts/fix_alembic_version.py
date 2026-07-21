"""Fix alembic version in database."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def fix():
    """Reset alembic version to previous migration."""
    from src.configurations.settings import get_settings
    settings = get_settings()
    
    engine = create_async_engine(settings.database_url)
    async with engine.begin() as conn:
        await conn.execute(text("UPDATE alembic_version SET version_num='92387befb4bb'"))
        print("✅ Fixed alembic_version to 92387befb4bb")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix())
