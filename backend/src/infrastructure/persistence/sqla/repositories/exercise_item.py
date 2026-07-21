from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, Result, Select, update, delete
from sqlalchemy.orm import selectinload

from src.core.entities.exercise_item import ExerciseItem
from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
from src.infrastructure.persistence.sqla.repositories.base import BaseRepository
from src.core.ports.repositories.exercise_item import IExerciseItemRepository


class ExerciseItemRepository(BaseRepository[ExerciseItemModel, ExerciseItem], IExerciseItemRepository):
    """SQLAlchemy implementation of ExerciseItem repository."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(ExerciseItemModel, session)

    async def get_by_exercise(self, exercise_id: UUID, language: str | None = None) -> list[ExerciseItem]:
        """Retrieve all items for an exercise ordered by display_order."""
        stmt: Select = (
            select(self._model)
            .options(
                selectinload(self._model.contents),
                selectinload(self._model.instruction)
            )
            .where(self._model.exercise_id == exercise_id)
            .order_by(self._model.display_order)
        )
        result: Result = await self._session.execute(stmt)
        entities_db = result.scalars().all()
        return [self.to_domain(entity_db) for entity_db in entities_db]

    async def get_by_type(self, exercise_id: UUID, item_type: str) -> list[ExerciseItem]:
        """Retrieve items of a specific type for an exercise."""
        stmt: Select = (
            select(self._model)
            .where(
                self._model.exercise_id == exercise_id,
                self._model.item_type == item_type
            )
            .order_by(self._model.display_order)
        )
        result: Result = await self._session.execute(stmt)
        entities_db = result.scalars().all()
        return [self.to_domain(entity_db) for entity_db in entities_db]

    async def get_with_content(self, item_id: UUID, language: str | None = None) -> ExerciseItem | None:
        """Retrieve item with content and instruction eagerly loaded."""
        stmt: Select = (
            select(self._model)
            .options(
                selectinload(self._model.contents),
                selectinload(self._model.instruction)
            )
            .where(self._model.id == item_id)
        )
        result: Result = await self._session.execute(stmt)
        entity_db: ExerciseItemModel | None = result.scalar_one_or_none()
        return self.to_domain(entity_db) if entity_db else None

    async def reorder_items(self, exercise_id: UUID, item_ids: list[UUID]) -> bool:
        """Update display_order for multiple items within an exercise."""
        try:
            for index, item_id in enumerate(item_ids):
                stmt = (
                    update(self._model)
                    .where(
                        self._model.id == item_id,
                        self._model.exercise_id == exercise_id
                    )
                    .values(display_order=index, updated_at=datetime.now(timezone.utc))
                )
                await self._session.execute(stmt)
            await self._session.commit()
            return True
        except Exception:
            await self._session.rollback()
            return False

    async def bulk_create(self, items: list[ExerciseItem]) -> list[ExerciseItem]:
        """Create multiple items at once."""
        items_db = [self.to_orm(item) for item in items]
        self._session.add_all(items_db)
        await self._session.commit()
        for item_db in items_db:
            await self._session.refresh(item_db)
        return [self.to_domain(item_db) for item_db in items_db]

    async def delete_by_exercise(self, exercise_id: UUID) -> int:
        """Delete all items for an exercise."""
        stmt = delete(self._model).where(self._model.exercise_id == exercise_id)
        result = await self._session.execute(stmt)
        await self._session.commit()
        return result.rowcount

    def to_domain(self, entity: ExerciseItemModel) -> ExerciseItem:
        """Convert ORM model to domain entity."""
        from sqlalchemy import inspect
        from src.core.entities.exercise_instructions import ExerciseInstructions
        from src.core.entities.exercise_item_content import ExerciseItemContent
        
        item = ExerciseItem(
            id=entity.id,
            exercise_id=entity.exercise_id,
            is_library_item=entity.is_library_item,
            item_type=entity.item_type,
            display_order=entity.display_order,
            instruction_id=entity.instruction_id,
            repetitions=entity.repetitions,
            duration_seconds=entity.duration_seconds,
            metadata=entity.item_metadata,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )
        
        # Check if relationships are loaded without triggering lazy load
        insp = inspect(entity)
        
        # Map instruction if loaded
        if 'instruction' in insp.unloaded:
            pass  # Not loaded, skip
        elif entity.instruction:
            item.instruction = ExerciseInstructions(
                id=entity.instruction.id,
                exercise_id=entity.instruction.exercise_id,
                language=entity.instruction.language,
                hint_text=entity.instruction.hint_text,
                explanation_text=entity.instruction.explanation_text,
                safety_notes=entity.instruction.safety_notes,
                audio_instruction_url=entity.instruction.audio_instruction_url,
                image_url=entity.instruction.image_url,
                created_at=entity.instruction.created_at,
                updated_at=entity.instruction.updated_at,
            )
        
        # Map contents if loaded
        if 'contents' in insp.unloaded:
            pass  # Not loaded, skip
        elif entity.contents:
            item.contents = [
                ExerciseItemContent(
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
                )
                for content in entity.contents
            ]
        
        return item

    def to_orm(self, model: ExerciseItem) -> ExerciseItemModel:
        """Convert domain entity to ORM model."""
        return ExerciseItemModel(
            id=model.id,
            exercise_id=model.exercise_id,
            is_library_item=model.is_library_item,
            item_type=model.item_type,
            display_order=model.display_order,
            instruction_id=model.instruction_id,
            repetitions=model.repetitions,
            duration_seconds=model.duration_seconds,
            item_metadata=model.metadata,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    async def get_library_items(
        self, 
        item_type: str | None = None,
        language: str | None = None,
        limit: int = 50,
        offset: int = 0
    ) -> tuple[list[ExerciseItem], int]:
        """Retrieve library items with pagination."""
        # Count query
        count_stmt: Select = (
            select(self._model)
            .where(self._model.is_library_item == True)
        )
        if item_type:
            count_stmt = count_stmt.where(self._model.item_type == item_type)
        
        count_result = await self._session.execute(count_stmt)
        total = len(count_result.scalars().all())
        
        # Data query
        stmt: Select = (
            select(self._model)
            .options(
                selectinload(self._model.contents),
                selectinload(self._model.instruction)
            )
            .where(self._model.is_library_item == True)
        )
        if item_type:
            stmt = stmt.where(self._model.item_type == item_type)
        
        stmt = stmt.order_by(self._model.created_at.desc()).limit(limit).offset(offset)
        
        result: Result = await self._session.execute(stmt)
        entities_db = result.scalars().all()
        items = [self.to_domain(entity_db) for entity_db in entities_db]
        
        return items, total

    async def get_library_item_with_content(self, item_id: UUID, language: str | None = None) -> ExerciseItem | None:
        """Retrieve library item with content eagerly loaded."""
        stmt: Select = (
            select(self._model)
            .options(
                selectinload(self._model.contents),
                selectinload(self._model.instruction)
            )
            .where(
                self._model.id == item_id,
                self._model.is_library_item == True
            )
        )
        result: Result = await self._session.execute(stmt)
        entity_db: ExerciseItemModel | None = result.scalar_one_or_none()
        return self.to_domain(entity_db) if entity_db else None

    async def create_library_item(self, item: ExerciseItem) -> ExerciseItem:
        """Create a standalone library item."""
        if not item.is_library_item:
            raise ValueError("Item must have is_library_item=True")
        if item.exercise_id is not None:
            raise ValueError("Library item cannot have exercise_id")
        
        item_db = self.to_orm(item)
        item_db.is_library_item = True
        self._session.add(item_db)
        await self._session.commit()
        await self._session.refresh(item_db)
        return self.to_domain(item_db)

    async def duplicate_item(self, item_id: UUID, as_library_item: bool = False, target_exercise_id: UUID | None = None) -> ExerciseItem:
        """Duplicate an existing item with all content."""
        from src.infrastructure.persistence.sqla.models.exercise_item_content_model import ExerciseItemContentModel
        from uuid import uuid4
        
        # Get original item with content
        stmt: Select = (
            select(self._model)
            .options(
                selectinload(self._model.contents),
                selectinload(self._model.instruction)
            )
            .where(self._model.id == item_id)
        )
        result: Result = await self._session.execute(stmt)
        original: ExerciseItemModel | None = result.scalar_one_or_none()
        
        if not original:
            from src.core.exceptions.exercise_exceptions import ExerciseItemNotFoundError
            raise ExerciseItemNotFoundError(f"Item {item_id} not found")
        
        # Create new item
        new_item = ExerciseItemModel(
            id=uuid4(),
            exercise_id=None if as_library_item else (target_exercise_id or original.exercise_id),
            item_type=original.item_type,
            display_order=original.display_order,
            instruction_id=original.instruction_id,
            repetitions=original.repetitions,
            duration_seconds=original.duration_seconds,
            item_metadata=original.item_metadata,
            is_library_item=as_library_item,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self._session.add(new_item)
        
        # Duplicate content
        for content in original.contents:
            new_content = ExerciseItemContentModel(
                item_id=new_item.id,
                language=content.language,
                text_content=content.text_content,
                demonstration_video_url=content.demonstration_video_url,
                image_url=content.image_url,
                phonetic_transcription=content.phonetic_transcription,
                audio_example_url=content.audio_example_url,
                difficulty=content.difficulty,
                info_type=content.info_type,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            self._session.add(new_content)
        
        await self._session.commit()
        await self._session.refresh(new_item)
        return self.to_domain(new_item)

    async def attach_library_item_to_exercise(
        self, 
        library_item_id: UUID, 
        exercise_id: UUID,
        display_order: int | None = None
    ) -> ExerciseItem:
        """Attach a library item to an exercise by creating a linked copy."""
        # Verify it's a library item
        library_item = await self.get_library_item_with_content(library_item_id)
        if not library_item:
            from src.core.exceptions.exercise_exceptions import ExerciseItemNotFoundError
            raise ExerciseItemNotFoundError(f"Library item {library_item_id} not found")
        
        # Get max display order if not provided
        if display_order is None:
            max_order_stmt = (
                select(self._model.display_order)
                .where(self._model.exercise_id == exercise_id)
                .order_by(self._model.display_order.desc())
                .limit(1)
            )
            result = await self._session.execute(max_order_stmt)
            max_order = result.scalar_one_or_none()
            display_order = (max_order + 1) if max_order is not None else 0
        
        # Create copy linked to exercise
        from src.infrastructure.persistence.sqla.models.exercise_item_content_model import ExerciseItemContentModel
        from uuid import uuid4
        
        stmt: Select = (
            select(self._model)
            .options(selectinload(self._model.contents))
            .where(self._model.id == library_item_id)
        )
        result: Result = await self._session.execute(stmt)
        original: ExerciseItemModel = result.scalar_one()
        
        new_item = ExerciseItemModel(
            id=uuid4(),
            exercise_id=exercise_id,
            item_type=original.item_type,
            display_order=display_order,
            instruction_id=original.instruction_id,
            repetitions=original.repetitions,
            duration_seconds=original.duration_seconds,
            item_metadata=original.item_metadata,
            is_library_item=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        self._session.add(new_item)
        
        # Copy content
        for content in original.contents:
            new_content = ExerciseItemContentModel(
                item_id=new_item.id,
                language=content.language,
                text_content=content.text_content,
                demonstration_video_url=content.demonstration_video_url,
                image_url=content.image_url,
                phonetic_transcription=content.phonetic_transcription,
                audio_example_url=content.audio_example_url,
                difficulty=content.difficulty,
                info_type=content.info_type,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            self._session.add(new_content)
        
        await self._session.commit()
        await self._session.refresh(new_item)
        return self.to_domain(new_item)
