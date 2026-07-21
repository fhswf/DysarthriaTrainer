from __future__ import with_statement
import asyncio
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from alembic import context
import os
from dotenv import load_dotenv
from logging.config import fileConfig
import logging

load_dotenv()
logger = logging.getLogger(__name__)

# The Alembic Config object provides access to the values within the .ini file in use.
config = context.config

# Interpret the config file (alembic.ini) for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def get_url():
    database_url = os.getenv("DATABASE_URL")
    logger.debug(f"Database URL: {database_url}")
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable not set!")
    return database_url


config.set_main_option("sqlalchemy.url", get_url())

from src.infrastructure.persistence.sqla.models.base import Base
from src.infrastructure.persistence.sqla.models import *

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    logger.info("Running migrations offline")
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online():
    logger.debug("Running migrations online")
    connectable = create_async_engine(get_url(), future=True, echo=True)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run():
    if context.is_offline_mode():
        run_migrations_offline()
    else:
        asyncio.run(run_migrations_online())


run()
