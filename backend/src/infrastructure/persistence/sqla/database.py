from typing import Callable, Generator, AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    async_sessionmaker,
    create_async_engine,
)

from src.core.ports.utils.disposable_protocol import IDisposable
from src.core.ports.utils.logger_protocol import ILogger


class Database(IDisposable):

    def __init__(self, db_url: str, logger: Optional[ILogger] = None) -> None:
        self._engine: AsyncEngine = create_async_engine(str(db_url), echo=True)
        self._session_factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
            bind=self._engine, class_=AsyncSession,
            autoflush=False, expire_on_commit=False,
        )
        self._logger: Optional[ILogger] = logger
        self._disposed: bool = False
        if self._logger:
            self._logger.info("Database engine and session factory created.")

    async def session(self) -> AsyncGenerator[AsyncSession, None]:
        async with self._session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception as e:
                if self._logger:
                    self._logger.exception(f"Session rollback! EX={e}")
                await session.rollback()
                raise
            finally:
                await session.close()

    async def dispose(self, disposing: bool = False) -> None:
        if self._disposed:
            return
        await self._engine.dispose(close=True)
        self._disposed = True
        self._logger.info("Database engine disposed.")
