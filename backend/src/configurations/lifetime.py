from contextlib import asynccontextmanager
from fastapi import FastAPI

from src.api.dependencies import get_db
from src.api.dependencies import get_logger, get_phoneme_service


@asynccontextmanager
async def application_lifetime(app: FastAPI):
    # Executed on application startup

    # Async initialization e.g. connect to database, initialize resources etc.
    db = get_db()

    # preload phoneme recognition model
    await get_phoneme_service().load_model()

    yield

    # Cleanup e.g. dispose database connections, close resources etc.
    await db.dispose(disposing=True)
