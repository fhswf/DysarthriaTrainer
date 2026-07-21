from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, Result, Select, func, or_
from sqlalchemy.orm import selectinload, with_loader_criteria

from src.core.entities.exercise import Exercise
from src.core.entities.exercise_category import ExerciseCategory
from src.core.entities.exercise_item import ExerciseItem
from src.infrastructure.persistence.sqla.models.exercise_model import ExerciseModel
from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
from src.infrastructure.persistence.sqla.repositories.base import BaseRepository
from src.core.ports.repositories.exercise import IExerciseRepository


class ExerciseRepository(BaseRepository[ExerciseModel, Exercise], IExerciseRepository):
    """SQLAlchemy implementation of Exercise repository."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(ExerciseModel, session)

    async def get_by_code(self, code: str) -> Exercise | None:
        """Retrieve exercise by unique code."""
        stmt: Select = select(self._model).where(self._model.code == code)
        result: Result = await self._session.execute(stmt)
        entity_db: ExerciseModel | None = result.scalar_one_or_none()
        return self.to_domain(entity_db) if entity_db else None

    async def get_by_category(self, category_id: UUID) -> list[Exercise]:
        """Retrieve all exercises in a category."""
        stmt: Select = (
            select(self._model)
            .where(
                self._model.category_id == category_id,
                self._model.deleted_at.is_(None)
            )
            .order_by(self._model.display_order)
        )
        result: Result = await self._session.execute(stmt)
        entities_db = result.scalars().all()
        return [self.to_domain(entity_db) for entity_db in entities_db]

    async def get_active_exercises(self, category_id: UUID | None = None) -> list[Exercise]:
        """Retrieve active (non-superseded) exercises."""
        stmt: Select = (
            select(self._model)
            .where(
                self._model.is_active == True,
                self._model.deleted_at.is_(None)
            )
        )
        if category_id:
            stmt = stmt.where(self._model.category_id == category_id)
        
        stmt = stmt.order_by(self._model.display_order)
        result: Result = await self._session.execute(stmt)
        entities_db = result.scalars().all()
        return [self.to_domain(entity_db) for entity_db in entities_db]

    async def get_all_exercises_paginated(
        self,
        offset: int = 0,
        limit: int = 50,
        category_ids: list[UUID] | None = None,
        active_only: bool = True,
        search: str | None = None,
    ) -> tuple[list[Exercise], int]:
        """
        Get paginated list of exercises with optional filtering.
        
        Args:
            offset: Number of items to skip
            limit: Maximum items to return
            category_ids: Optional list of category IDs to filter by
            active_only: Only return active exercises
            search: Optional search term for title or code
            
        Returns:
            Tuple of (exercises, total_count)
        """
        # Base filters
        filters = [self._model.deleted_at.is_(None)]
        
        if active_only:
            filters.append(self._model.is_active == True)
        
        if category_ids:
            filters.append(self._model.category_id.in_(category_ids))
        
        if search:
            search_pattern = f"%{search}%"
            filters.append(
                or_(
                    self._model.title.ilike(search_pattern),
                    self._model.code.ilike(search_pattern),
                )
            )
        
        # Count query
        count_stmt = (
            select(func.count())
            .select_from(self._model)
            .where(*filters)
        )
        count_result = await self._session.execute(count_stmt)
        total_count = count_result.scalar() or 0
        
        # Data query
        stmt: Select = (
            select(self._model)
            .where(*filters)
            .order_by(self._model.display_order, self._model.code)
            .offset(offset)
            .limit(limit)
        )
        result: Result = await self._session.execute(stmt)
        entities_db = result.scalars().all()
        
        return [self.to_domain(entity_db) for entity_db in entities_db], total_count

    async def get_exercise_versions(self, code: str) -> list[Exercise]:
        """Retrieve all versions of an exercise by code."""
        stmt: Select = (
            select(self._model)
            .where(self._model.code == code)
            .order_by(self._model.version)
        )
        result: Result = await self._session.execute(stmt)
        entities_db = result.scalars().all()
        return [self.to_domain(entity_db) for entity_db in entities_db]

    async def get_with_instructions(self, exercise_id: UUID, language: str | None = None) -> Exercise | None:
        """Retrieve exercise with instructions eagerly loaded."""
        stmt: Select = (
            select(self._model)
            .options(
                selectinload(self._model.instructions),
                selectinload(self._model.category)
            )
            .where(self._model.id == exercise_id)
        )
        
        # Add language filtering if specified
        if language:
            from src.infrastructure.persistence.sqla.models.exercise_instructions_model import ExerciseInstructionsModel
            
            stmt = stmt.options(
                selectinload(self._model.instructions).where(
                    ExerciseInstructionsModel.language == language
                )
            )
        
        result: Result = await self._session.execute(stmt)
        entity_db: ExerciseModel | None = result.scalar_one_or_none()
        return self.to_domain(entity_db) if entity_db else None

    async def get_with_items(self, exercise_id: UUID, language: str | None = None) -> Exercise | None:
        """Retrieve exercise with items and content eagerly loaded."""
        stmt: Select = (
            select(self._model)
            .options(
                selectinload(self._model.items).selectinload(ExerciseItemModel.contents),
                selectinload(self._model.category)
            )
            .where(self._model.id == exercise_id)
        )
        
        # Add language filtering if specified
        if language:
            from src.infrastructure.persistence.sqla.models.exercise_item_content_model import ExerciseItemContentModel
            
            stmt = stmt.options(
                selectinload(self._model.items).selectinload(ExerciseItemModel.contents).where(
                    ExerciseItemContentModel.language == language
                )
            )
        
        result: Result = await self._session.execute(stmt)
        entity_db: ExerciseModel | None = result.scalar_one_or_none()
        return self.to_domain(entity_db) if entity_db else None

    async def get_complete(self, exercise_id: UUID, language: str | None = None) -> Exercise | None:
        """Retrieve exercise with all related data including contents."""
        from src.infrastructure.persistence.sqla.models.exercise_instructions_model import ExerciseInstructionsModel
        from src.infrastructure.persistence.sqla.models.exercise_item_content_model import ExerciseItemContentModel
        
        # Base query with eager loading
        stmt: Select = (
            select(self._model)
            .options(
                selectinload(self._model.category)
            )
            .where(self._model.id == exercise_id)
        )
        
        # Add language filtering if specified
        if language:
            stmt = stmt.options(
                with_loader_criteria(
                    ExerciseInstructionsModel,
                    ExerciseInstructionsModel.language == language
                ),
                with_loader_criteria(
                    ExerciseItemContentModel,
                    ExerciseItemContentModel.language == language
                ),
                selectinload(self._model.instructions),
                selectinload(self._model.items).selectinload(ExerciseItemModel.contents),
            )
        else:
            stmt = stmt.options(
                selectinload(self._model.instructions),
                selectinload(self._model.items).selectinload(ExerciseItemModel.contents),
            )
        
        result: Result = await self._session.execute(stmt)
        entity_db: ExerciseModel | None = result.scalar_one_or_none()
        return self.to_domain(entity_db) if entity_db else None

    def to_domain(self, entity: ExerciseModel) -> Exercise:
        """Convert ORM model to domain entity."""
        from src.core.entities.exercise_instructions import ExerciseInstructions
        from src.core.entities.exercise_item_content import ExerciseItemContent
        
        # Convert category if eagerly loaded
        category = None
        try:
            if hasattr(entity, 'category') and entity.category:
                category = ExerciseCategory(
                    id=entity.category.id,
                    name=entity.category.name,
                    slug=entity.category.slug,
                    description=entity.category.description,
                    icon_url=entity.category.icon_url,
                    display_order=entity.category.display_order,
                    deleted_at=entity.category.deleted_at,
                    deleted_by=entity.category.deleted_by,
                    created_at=entity.category.created_at,
                    updated_at=entity.category.updated_at,
                )
        except Exception:
            category = None
        
        # Convert instructions if eagerly loaded - return full objects
        instructions = []
        try:
            if hasattr(entity, 'instructions') and entity.instructions:
                for instruction in entity.instructions:
                    instructions.append(ExerciseInstructions(
                        id=instruction.id,
                        exercise_id=instruction.exercise_id,
                        language=instruction.language,
                        hint_text=instruction.hint_text,
                        explanation_text=instruction.explanation_text,
                        safety_notes=instruction.safety_notes,
                        audio_instruction_url=instruction.audio_instruction_url,
                        image_url=instruction.image_url,
                        display_order=instruction.display_order,
                        created_at=instruction.created_at,
                        updated_at=instruction.updated_at,
                    ))
        except Exception:
            instructions = []
        
        # Convert items with contents if eagerly loaded
        items = []
        try:
            if hasattr(entity, 'items') and entity.items:
                for item in entity.items:
                    # Convert item contents
                    contents = []
                    try:
                        if hasattr(item, 'contents') and item.contents:
                            for content in item.contents:
                                contents.append(ExerciseItemContent(
                                    id=content.id,
                                    item_id=content.item_id,
                                    language=content.language,
                                    text_content=content.text_content,
                                    demonstration_video_url=content.demonstration_video_url,
                                    image_url=content.image_url,
                                    phonetic_transcription=content.phonetic_transcription,
                                    audio_example_url=content.audio_example_url,
                                    difficulty=content.difficulty,
                                    info_type=content.info_type,
                                    created_at=content.created_at,
                                    updated_at=content.updated_at,
                                ))
                    except Exception:
                        contents = []
                    
                    domain_item = ExerciseItem(
                        id=item.id,
                        exercise_id=item.exercise_id,
                        item_type=item.item_type,
                        display_order=item.display_order,
                        repetitions=item.repetitions,
                        duration_seconds=item.duration_seconds,
                        metadata=item.item_metadata,
                        contents=contents,
                        created_at=item.created_at,
                        updated_at=item.updated_at,
                    )
                    items.append(domain_item)
        except Exception:
            items = []
        
        return Exercise(
            id=entity.id,
            category_id=entity.category_id,
            code=entity.code,
            title=entity.title,
            subtitle=entity.subtitle,
            scope=entity.scope,
            difficulty_level=entity.difficulty_level,
            estimated_duration_minutes=entity.estimated_duration_minutes,
            display_order=entity.display_order,
            version=entity.version,
            is_active=entity.is_active,
            superseded_by=entity.superseded_by,
            deleted_at=entity.deleted_at,
            deleted_by=entity.deleted_by,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            created_by=entity.created_by,
            # Relationship data
            instructions=instructions,
            category=category,
            items=items,
        )

    def to_orm(self, model: Exercise) -> ExerciseModel:
        """Convert domain entity to ORM model."""
        return ExerciseModel(
            id=model.id,
            category_id=model.category_id,
            code=model.code,
            title=model.title,
            subtitle=model.subtitle,
            scope=model.scope,
            difficulty_level=model.difficulty_level,
            estimated_duration_minutes=model.estimated_duration_minutes,
            display_order=model.display_order,
            version=model.version,
            is_active=model.is_active,
            superseded_by=model.superseded_by,
            deleted_at=model.deleted_at,
            deleted_by=model.deleted_by,
            created_at=model.created_at,
            updated_at=model.updated_at,
            created_by=model.created_by,
        )
