from typing import Sequence, Final
from uuid import UUID

from sqlalchemy import select, exists, Result, Select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.entities.base import Entity
from src.core.ports.repositories.base import IRepository
from src.infrastructure.persistence.sqla.models.base import Base


class BaseRepository[TOrm: Base, TDomain: Entity](IRepository[TDomain]):

    def __init__(
            self,
            model: type[TOrm],
            session: AsyncSession
            #mapper: IMapper[TOrm, TDomain]
    ) -> None:
        self._model: Final[type[TOrm]] = model
        self._session: Final[AsyncSession] = session
        #self._mapper = mapper

    async def get_by_id(self, id_: UUID) -> TDomain | None:
        entity_db: TOrm | None = await self._session.get(self._model, id_)  # (self._model, id_.value)
        return self.to_domain(entity_db) if entity_db else None

    async def get_all(self) -> list[TDomain]:
        stmt: Select = select(self._model)
        result: Result = await self._session.execute(stmt)
        entities_db: Sequence[TOrm] | None = result.scalars().all()
        return [self.to_domain(entity_db) for entity_db in entities_db]

    async def add(self, entity: TDomain) -> TDomain:
        """Add a new entity to the database."""
        entity_db: TOrm = self.to_orm(entity)
        self._session.add(entity_db)
        await self._session.commit()
        await self._session.refresh(entity_db)
        return self.to_domain(entity_db)

    async def update(self, entity: TDomain) -> TDomain:
        """Update an existing entity in the database."""
        entity_db: TOrm = self.to_orm(entity)
        merged = await self._session.merge(entity_db)
        await self._session.commit()
        await self._session.refresh(merged)
        return self.to_domain(merged)

    async def delete(self, id_: UUID) -> bool:
        """Delete an entity by ID. Returns True if deleted, False if not found."""
        entity_db: TOrm | None = await self._session.get(self._model, id_)
        if entity_db is None:
            return False
        await self._session.delete(entity_db)
        await self._session.commit()
        return True

    async def exists(self, id_: UUID) -> bool:
        stmt = select(self._model).filter_by(id=id_)  # (id=id_.value)
        result: Result = await self._session.execute(stmt)
        entity_db: TOrm | None = result.scalars().first()
        return self.to_domain(entity_db) is not None

    def to_domain(self, entity: TOrm) -> TDomain: ...

    def to_orm(self, model: TDomain) -> TOrm: ...
