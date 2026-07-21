from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, Result, Select, update, func
from sqlalchemy.orm import selectinload

from src.core.entities.exercise_category import ExerciseCategory
from src.infrastructure.persistence.sqla.models.exercise_category_model import ExerciseCategoryModel
from src.infrastructure.persistence.sqla.repositories.base import BaseRepository
from src.core.ports.repositories.exercise_category import IExerciseCategoryRepository


class ExerciseCategoryRepository(BaseRepository[ExerciseCategoryModel, ExerciseCategory], IExerciseCategoryRepository):
    """SQLAlchemy implementation of ExerciseCategory repository."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(ExerciseCategoryModel, session)

    async def get_by_slug(self, slug: str) -> ExerciseCategory | None:
        """Retrieve category by unique slug."""
        stmt: Select = select(self._model).where(
            self._model.slug == slug,
            self._model.deleted_at.is_(None)
        )
        result: Result = await self._session.execute(stmt)
        entity_db: ExerciseCategoryModel | None = result.scalar_one_or_none()
        return self.to_domain(entity_db) if entity_db else None

    async def get_active_categories(self) -> list[ExerciseCategory]:
        """Retrieve all non-deleted categories ordered by display_order."""
        stmt: Select = (
            select(self._model)
            .where(self._model.deleted_at.is_(None))
            .order_by(self._model.display_order)
        )
        result: Result = await self._session.execute(stmt)
        entities_db = result.scalars().all()
        return [self.to_domain(entity_db) for entity_db in entities_db]

    async def get_all_paginated(
        self,
        offset: int = 0,
        limit: int = 50,
        search: str | None = None,
    ) -> tuple[list[ExerciseCategory], int]:
        """Retrieve paginated categories (including deleted)."""
        # Build base query
        base_stmt = select(self._model)
        
        # Apply search filter if provided
        if search:
            search_term = f"%{search}%"
            base_stmt = base_stmt.where(
                (self._model.name.ilike(search_term)) |
                (self._model.slug.ilike(search_term)) |
                (self._model.description.ilike(search_term))
            )
        
        # Count query
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        count_result = await self._session.execute(count_stmt)
        total_count = count_result.scalar() or 0

        # Data query
        stmt: Select = (
            base_stmt
            .order_by(self._model.display_order)
            .offset(offset)
            .limit(limit)
        )
        result: Result = await self._session.execute(stmt)
        entities_db = result.scalars().all()
        categories = [self.to_domain(entity_db) for entity_db in entities_db]

        return categories, total_count

    async def get_active_categories_paginated(
        self,
        offset: int = 0,
        limit: int = 50,
        search: str | None = None,
    ) -> tuple[list[ExerciseCategory], int]:
        """Retrieve paginated non-deleted categories ordered by display_order."""
        # Build base query
        base_stmt = select(self._model).where(self._model.deleted_at.is_(None))
        
        # Apply search filter if provided
        if search:
            search_term = f"%{search}%"
            base_stmt = base_stmt.where(
                (self._model.name.ilike(search_term)) |
                (self._model.slug.ilike(search_term)) |
                (self._model.description.ilike(search_term))
            )
        
        # Count query
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        count_result = await self._session.execute(count_stmt)
        total_count = count_result.scalar() or 0

        # Data query
        stmt: Select = (
            base_stmt
            .order_by(self._model.display_order)
            .offset(offset)
            .limit(limit)
        )
        result: Result = await self._session.execute(stmt)
        entities_db = result.scalars().all()
        categories = [self.to_domain(entity_db) for entity_db in entities_db]

        return categories, total_count

    async def reorder_categories(self, category_ids: list[str]) -> bool:
        """Update display_order for multiple categories."""
        try:
            for index, category_id in enumerate(category_ids):
                stmt = (
                    update(self._model)
                    .where(self._model.id == UUID(category_id))
                    .values(display_order=index, updated_at=datetime.now(timezone.utc))
                )
                await self._session.execute(stmt)
            await self._session.commit()
            return True
        except Exception:
            await self._session.rollback()
            return False

    async def get_with_exercises(self, category_id: str, include_inactive: bool = False) -> ExerciseCategory | None:
        """Retrieve category with exercises eagerly loaded."""
        stmt: Select = (
            select(self._model)
            .options(selectinload(self._model.exercises))
            .where(self._model.id == UUID(category_id))
        )
        if not include_inactive:
            stmt = stmt.where(self._model.deleted_at.is_(None))
        
        result: Result = await self._session.execute(stmt)
        entity_db: ExerciseCategoryModel | None = result.scalar_one_or_none()
        return self.to_domain(entity_db) if entity_db else None

    async def soft_delete(self, category_id: str, deleted_by: str) -> bool:
        """Soft delete a category."""
        try:
            stmt = (
                update(self._model)
                .where(self._model.id == UUID(category_id))
                .values(
                    deleted_at=datetime.now(timezone.utc),
                    deleted_by=deleted_by,
                    updated_at=datetime.now(timezone.utc)
                )
            )
            result = await self._session.execute(stmt)
            await self._session.commit()
            return result.rowcount > 0
        except Exception:
            await self._session.rollback()
            return False

    def to_domain(self, entity: ExerciseCategoryModel) -> ExerciseCategory:
        """Convert ORM model to domain entity."""
        return ExerciseCategory(
            id=entity.id,
            name=entity.name,
            slug=entity.slug,
            description=entity.description,
            icon_url=entity.icon_url,
            display_order=entity.display_order,
            deleted_at=entity.deleted_at,
            deleted_by=entity.deleted_by,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    def to_orm(self, model: ExerciseCategory) -> ExerciseCategoryModel:
        """Convert domain entity to ORM model."""
        return ExerciseCategoryModel(
            id=model.id,
            name=model.name,
            slug=model.slug,
            description=model.description,
            icon_url=model.icon_url,
            display_order=model.display_order,
            deleted_at=model.deleted_at,
            deleted_by=model.deleted_by,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
