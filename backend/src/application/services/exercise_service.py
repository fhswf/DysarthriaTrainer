"""
Exercise Service for managing speech exercises, categories, and items.
"""

from datetime import datetime, timezone
from uuid import UUID, uuid4

from src.application.services.base_service import BaseService
from src.core.entities.exercise import Exercise
from src.core.entities.exercise_category import ExerciseCategory
from src.core.entities.exercise_instructions import ExerciseInstructions
from src.core.entities.exercise_item import ExerciseItem
from src.core.entities.exercise_item_content import ExerciseItemContent
from src.core.exceptions.exercise_exceptions import (
    ExerciseNotFoundError,
    ExerciseCategoryNotFoundError,
    ExerciseItemNotFoundError,
    InvalidExerciseTypeError,
    ExerciseVersionConflictError,
)
from src.core.ports.repositories.exercise import IExerciseRepository
from src.core.ports.repositories.exercise_category import IExerciseCategoryRepository
from src.core.ports.repositories.exercise_item import IExerciseItemRepository


class ExerciseService(BaseService):
    """Service for exercise management operations."""

    def __init__(
        self,
        exercise_repository: IExerciseRepository,
        category_repository: IExerciseCategoryRepository,
        item_repository: IExerciseItemRepository,
    ):
        self._exercise_repo = exercise_repository
        self._category_repo = category_repository
        self._item_repo = item_repository

    # ==================== Category Management ====================

    async def create_category(
        self,
        name: str,
        slug: str,
        description: str | None = None,
        icon_url: str | None = None,
        display_order: int = 0,
    ) -> ExerciseCategory:
        """Create a new exercise category."""
        # Check if slug already exists
        existing = await self._category_repo.get_by_slug(slug)
        if existing:
            raise ValueError(f"Category with slug '{slug}' already exists")

        category = ExerciseCategory(
            id=uuid4(),
            name=name,
            slug=slug,
            description=description,
            icon_url=icon_url,
            display_order=display_order,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        return await self._category_repo.add(category)

    async def get_category_by_id(self, category_id: UUID) -> ExerciseCategory:
        """Get category by ID."""
        category = await self._category_repo.get_by_id(category_id)
        if not category:
            raise ExerciseCategoryNotFoundError(f"Category {category_id} not found")
        return category

    async def get_category_by_slug(self, slug: str) -> ExerciseCategory:
        """Get category by slug."""
        category = await self._category_repo.get_by_slug(slug)
        if not category:
            raise ExerciseCategoryNotFoundError(f"Category with slug '{slug}' not found")
        return category

    async def get_all_categories(
        self,
        offset: int = 0,
        limit: int = 50,
        include_deleted: bool = False,
        search: str | None = None,
    ) -> tuple[list[ExerciseCategory], int]:
        """
        Get paginated categories.
        
        Returns:
            Tuple of (categories, total_count)
        """
        if include_deleted:
            return await self._category_repo.get_all_paginated(
                offset=offset,
                limit=limit,
                search=search,
            )
        return await self._category_repo.get_active_categories_paginated(
            offset=offset,
            limit=limit,
            search=search,
        )

    async def update_category(
        self,
        category_id: UUID,
        name: str | None = None,
        slug: str | None = None,
        description: str | None = None,
        icon_url: str | None = None,
        display_order: int | None = None,
    ) -> ExerciseCategory:
        """Update category details."""
        category = await self.get_category_by_id(category_id)

        if name is not None:
            category.name = name
        if slug is not None:
            # Check if new slug already exists (excluding current category)
            existing = await self._category_repo.get_by_slug(slug)
            if existing and existing.id != category_id:
                raise ValueError(f"Category with slug '{slug}' already exists")
            category.slug = slug
        if description is not None:
            category.description = description
        if icon_url is not None:
            category.icon_url = icon_url
        if display_order is not None:
            category.display_order = display_order

        category.updated_at = datetime.now(timezone.utc)
        return await self._category_repo.update(category)

    async def reorder_categories(self, category_ids: list[str]) -> bool:
        """Reorder categories by providing ordered list of IDs."""
        return await self._category_repo.reorder_categories(category_ids)

    async def delete_category(self, category_id: UUID, deleted_by: str) -> bool:
        """Soft delete a category."""
        category = await self.get_category_by_id(category_id)
        return await self._category_repo.soft_delete(str(category_id), deleted_by)

    # ==================== Exercise Management ====================

    async def create_exercise(
        self,
        category_id: UUID,
        code: str,
        title: str,
        difficulty_level: str,
        subtitle: str | None = None,
        scope: str | None = None,
        estimated_duration_minutes: int | None = None,
        display_order: int = 0,
        instructions: list[dict] | None = None,  # Full instruction objects
        items: list[dict] | None = None,  # Items with contents
        created_by: str | None = None,
    ) -> Exercise:
        """
        Create a new exercise with full associations.
        
        Args:
            instructions: List of instruction dicts with keys: language, hint_text, explanation_text, safety_notes, etc.
            items: List of item dicts with keys: item_type, display_order, repetitions, duration_seconds, item_metadata, contents
        """
        # Verify category exists
        await self.get_category_by_id(category_id)

        # Check if code already exists
        existing = await self._exercise_repo.get_by_code(code)
        if existing:
            raise ValueError(f"Exercise with code '{code}' already exists")

        # Validate difficulty level
        valid_levels = ["beginner", "intermediate", "advanced"]
        if difficulty_level not in valid_levels:
            raise InvalidExerciseTypeError(f"Invalid difficulty_level: {difficulty_level}")

        exercise = Exercise(
            id=uuid4(),
            category_id=category_id,
            code=code,
            title=title,
            subtitle=subtitle,
            scope=scope,
            difficulty_level=difficulty_level,
            estimated_duration_minutes=estimated_duration_minutes,
            display_order=display_order,
            version=1,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            created_by=created_by,
        )

        # Create the exercise first
        created_exercise = await self._exercise_repo.add(exercise)

        # Create instructions if provided (full objects, not string array)
        if instructions and len(instructions) > 0:
            await self._create_exercise_instructions_full(created_exercise.id, instructions)

        # Create items with contents if provided
        if items and len(items) > 0:
            await self._create_exercise_items_with_contents(created_exercise.id, items)

        return created_exercise

    async def _create_exercise_instructions_full(
        self,
        exercise_id: UUID,
        instructions: list[dict],
    ) -> None:
        """
        Create exercise instructions with full structure.
        
        Args:
            instructions: List of dicts with keys: language, hint_text, explanation_text, 
                         safety_notes, audio_instruction_url, image_url
        """
        from src.infrastructure.persistence.sqla.models.exercise_instructions_model import ExerciseInstructionsModel
        
        # Access the session through the repository
        session = self._exercise_repo._session
        
        # Create instruction records
        for instr_data in instructions:
            display_order = instr_data.get("display_order", 0)
            instruction_record = ExerciseInstructionsModel(
                id=uuid4(),
                exercise_id=exercise_id,
                language=instr_data.get("language", "de"),
                hint_text=instr_data.get("hint_text"),
                explanation_text=instr_data.get("explanation_text"),
                safety_notes=instr_data.get("safety_notes"),
                audio_instruction_url=instr_data.get("audio_instruction_url"),
                image_url=instr_data.get("image_url"),
                display_order=display_order,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(instruction_record)
        
        await session.flush()

    async def _create_exercise_instructions(
        self,
        exercise_id: UUID,
        instructions: list[str],
        language: str = "de",
    ) -> None:
        """
        Create exercise instructions from string array (backward compatibility).
        Deprecated: Use _create_exercise_instructions_full instead.
        """
        from src.infrastructure.persistence.sqla.models.exercise_instructions_model import ExerciseInstructionsModel
        
        # Access the session through the repository
        session = self._exercise_repo._session
        
        # Create instruction record with combined text
        combined_text = "\n".join(instructions)
        
        instruction_record = ExerciseInstructionsModel(
            id=uuid4(),
            exercise_id=exercise_id,
            language=language,
            hint_text=combined_text,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        session.add(instruction_record)
        await session.flush()

    async def _create_exercise_items_with_contents(
        self,
        exercise_id: UUID,
        items: list[dict],
    ) -> None:
        """
        Create exercise items with language-specific contents.
        
        Args:
            items: List of dicts with keys: item_type, display_order, repetitions, duration_seconds,
                  item_metadata, contents (list of content dicts)
        """
        from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
        from src.infrastructure.persistence.sqla.models.exercise_item_content_model import ExerciseItemContentModel
        
        # Access the session through the repository
        session = self._exercise_repo._session
        
        # Create item records
        for item_data in items:
            item_record = ExerciseItemModel(
                id=uuid4(),
                exercise_id=exercise_id,
                item_type=item_data["item_type"],
                display_order=item_data.get("display_order", 0),
                repetitions=item_data.get("repetitions"),
                duration_seconds=item_data.get("duration_seconds"),
                item_metadata=item_data.get("item_metadata"),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(item_record)
            await session.flush()  # Get item ID
            
            # Create contents (language-specific)
            contents = item_data.get("contents", [])
            if contents:
                for content_data in contents:
                    content_record = ExerciseItemContentModel(
                        id=uuid4(),
                        item_id=item_record.id,
                        language=content_data.get("language", "de"),
                        text_content=content_data.get("text_content"),
                        demonstration_video_url=content_data.get("demonstration_video_url"),
                        image_url=content_data.get("image_url"),
                        phonetic_transcription=content_data.get("phonetic_transcription"),
                        audio_example_url=content_data.get("audio_example_url"),
                        difficulty=content_data.get("difficulty"),
                        info_type=content_data.get("info_type"),
                        created_at=datetime.now(timezone.utc),
                        updated_at=datetime.now(timezone.utc),
                    )
                    session.add(content_record)
        
        await session.flush()

    async def _create_exercise_items(
        self,
        exercise_id: UUID,
        items: list[dict],
    ) -> None:
        """
        Create exercise items without contents (backward compatibility).
        Deprecated: Use _create_exercise_items_with_contents instead.
        """
        from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
        
        # Access the session through the repository
        session = self._exercise_repo._session
        
        # Create item records
        for item_data in items:
            item_record = ExerciseItemModel(
                id=uuid4(),
                exercise_id=exercise_id,
                item_type=item_data["item_type"],
                display_order=item_data.get("display_order", 0),
                repetitions=item_data.get("repetitions"),
                duration_seconds=item_data.get("duration_seconds"),
                item_metadata=item_data.get("metadata", {}),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(item_record)
        
        await session.flush()

    async def _replace_exercise_instructions(
        self,
        exercise_id: UUID,
        instructions: list[dict],
    ) -> None:
        """
        Replace all exercise instructions for the given exercise.
        
        Args:
            exercise_id: ID of the exercise
            instructions: List of dicts with keys: language, hint_text, explanation_text, 
                         preparation_text (or safety_notes), display_order
        """
        from src.infrastructure.persistence.sqla.models.exercise_instructions_model import ExerciseInstructionsModel
        from sqlalchemy import delete
        
        # Access the session through the repository
        session = self._exercise_repo._session
        
        # Delete existing instructions
        await session.execute(
            delete(ExerciseInstructionsModel).where(ExerciseInstructionsModel.exercise_id == exercise_id)
        )
        
        # Create new instructions
        await self._create_exercise_instructions_full(exercise_id, instructions)

    async def _replace_exercise_items(
        self,
        exercise_id: UUID,
        items: list[dict],
    ) -> None:
        """
        Replace all exercise items and their contents for the given exercise.
        Contents are cascade-deleted automatically when items are deleted.
        """
        from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
        from sqlalchemy import delete
        
        # Access the session through the repository
        session = self._exercise_repo._session
        
        # Delete existing items (cascade deletes contents automatically)
        await session.execute(
            delete(ExerciseItemModel).where(ExerciseItemModel.exercise_id == exercise_id)
        )
        
        # Create new items with contents
        await self._create_exercise_items_with_contents(exercise_id, items)

    async def get_exercise_by_id(
        self,
        exercise_id: UUID,
        load_instructions: bool = False,
        load_items: bool = False,
        language: str | None = None,
    ) -> Exercise:
        """Get exercise by ID with optional eager loading."""
        if load_instructions and load_items:
            exercise = await self._exercise_repo.get_complete(exercise_id, language)
        elif load_instructions:
            exercise = await self._exercise_repo.get_with_instructions(exercise_id, language)
        elif load_items:
            exercise = await self._exercise_repo.get_with_items(exercise_id, language)
        else:
            exercise = await self._exercise_repo.get_by_id(exercise_id)

        if not exercise:
            raise ExerciseNotFoundError(f"Exercise {exercise_id} not found")
        return exercise

    async def get_exercise_by_code(self, code: str) -> Exercise:
        """Get exercise by code."""
        exercise = await self._exercise_repo.get_by_code(code)
        if not exercise:
            raise ExerciseNotFoundError(f"Exercise with code '{code}' not found")
        return exercise

    async def get_exercises_by_category(
        self,
        category_id: UUID,
        active_only: bool = True,
    ) -> list[Exercise]:
        """Get all exercises in a category."""
        if active_only:
            return await self._exercise_repo.get_active_exercises(category_id)
        return await self._exercise_repo.get_by_category(category_id)

    async def get_all_exercises(
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
        return await self._exercise_repo.get_all_exercises_paginated(
            offset=offset,
            limit=limit,
            category_ids=category_ids,
            active_only=active_only,
            search=search,
        )

    async def get_exercise_versions(self, code: str) -> list[Exercise]:
        """Get all versions of an exercise."""
        versions = await self._exercise_repo.get_exercise_versions(code)
        if not versions:
            raise ExerciseNotFoundError(f"No exercise found with code '{code}'")
        return versions

    async def update_exercise(
        self,
        exercise_id: UUID,
        title: str | None = None,
        subtitle: str | None = None,
        scope: str | None = None,
        difficulty_level: str | None = None,
        estimated_duration_minutes: int | None = None,
        display_order: int | None = None,
        instructions: list[dict] | None = None,
        items: list[dict] | None = None,
    ) -> Exercise:
        """Update exercise details."""
        exercise = await self.get_exercise_by_id(exercise_id)

        if title is not None:
            exercise.title = title
        if subtitle is not None:
            exercise.subtitle = subtitle
        if scope is not None:
            exercise.scope = scope
        if difficulty_level is not None:
            valid_levels = ["beginner", "intermediate", "advanced"]
            if difficulty_level not in valid_levels:
                raise InvalidExerciseTypeError(f"Invalid difficulty level: {difficulty_level}")
            exercise.difficulty_level = difficulty_level
        if estimated_duration_minutes is not None:
            exercise.estimated_duration_minutes = estimated_duration_minutes
        if display_order is not None:
            exercise.display_order = display_order

        exercise.updated_at = datetime.now(timezone.utc)
        updated_exercise = await self._exercise_repo.update(exercise)

        # Handle instructions replacement if provided
        if instructions is not None:
            await self._replace_exercise_instructions(exercise_id, instructions)

        # Handle items replacement if provided
        if items is not None:
            await self._replace_exercise_items(exercise_id, items)

        return updated_exercise

    async def create_new_version(
        self,
        old_exercise_id: UUID,
        changes: dict,
        created_by: str | None = None,
    ) -> Exercise:
        """Create a new version of an exercise."""
        old_exercise = await self.get_exercise_by_id(old_exercise_id)

        # Create new version with incremented version number
        new_exercise = Exercise(
            id=uuid4(),
            category_id=old_exercise.category_id,
            code=old_exercise.code,
            title=changes.get("title", old_exercise.title),
            subtitle=changes.get("subtitle", old_exercise.subtitle),
            scope=changes.get("scope", old_exercise.scope),
            difficulty_level=changes.get("difficulty_level", old_exercise.difficulty_level),
            estimated_duration_minutes=changes.get("estimated_duration_minutes", old_exercise.estimated_duration_minutes),
            display_order=changes.get("display_order", old_exercise.display_order),
            version=old_exercise.version + 1,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            created_by=created_by,
        )

        # Save new version
        new_exercise = await self._exercise_repo.add(new_exercise)

        # Mark old version as superseded
        old_exercise.is_active = False
        old_exercise.superseded_by = new_exercise.id
        old_exercise.updated_at = datetime.now(timezone.utc)
        await self._exercise_repo.update(old_exercise)

        return new_exercise

    async def delete_exercise(self, exercise_id: UUID, deleted_by: str) -> bool:
        """Soft delete an exercise."""
        exercise = await self.get_exercise_by_id(exercise_id)
        exercise.deleted_at = datetime.now(timezone.utc)
        exercise.deleted_by = deleted_by
        exercise.updated_at = datetime.now(timezone.utc)
        await self._exercise_repo.update(exercise)
        return True

    # ==================== Exercise Item Management ====================

    async def add_item_to_exercise(
        self,
        exercise_id: UUID,
        item_type: str,
        display_order: int,
        instruction_id: UUID | None = None,
        repetitions: int | None = None,
        duration_seconds: int | None = None,
        metadata: dict | None = None,
    ) -> ExerciseItem:
        """Add an item to an exercise."""
        # Verify exercise exists
        await self.get_exercise_by_id(exercise_id)

        # Validate item type
        valid_types = ["movement", "speech_practice", "information"]
        if item_type not in valid_types:
            raise InvalidExerciseTypeError(f"Invalid item type: {item_type}")

        item = ExerciseItem(
            id=uuid4(),
            exercise_id=exercise_id,
            item_type=item_type,
            display_order=display_order,
            instruction_id=instruction_id,
            repetitions=repetitions,
            duration_seconds=duration_seconds,
            metadata=metadata,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        return await self._item_repo.add(item)

    async def get_exercise_item_by_id(self, item_id: UUID) -> ExerciseItem:
        """Get exercise item by ID."""
        item = await self._item_repo.get_by_id(item_id)
        if not item:
            raise ExerciseItemNotFoundError(f"Exercise item {item_id} not found")
        return item

    async def get_exercise_items(
        self,
        exercise_id: UUID,
        item_type: str | None = None,
        language: str | None = None,
    ) -> list[ExerciseItem]:
        """Get items for an exercise."""
        if item_type:
            return await self._item_repo.get_by_type(exercise_id, item_type)
        return await self._item_repo.get_by_exercise(exercise_id, language)

    async def get_all_exercise_items(self) -> list[ExerciseItem]:
        """Get all exercise items across all exercises."""
        return await self._item_repo.get_all()

    async def update_exercise_item(
        self,
        item_id: UUID,
        item_type: str | None = None,
        display_order: int | None = None,
        instruction_id: UUID | None = None,
        repetitions: int | None = None,
        duration_seconds: int | None = None,
        metadata: dict | None = None,
        _update_instruction_id: bool = False,  # Flag to indicate instruction_id should be updated
    ) -> ExerciseItem:
        """Update an exercise item.
        
        Note: To clear instruction_id, pass instruction_id=None with _update_instruction_id=True
        """
        # Get existing item
        item = await self.get_exercise_item_by_id(item_id)

        # Validate item type if provided
        if item_type is not None:
            valid_types = ["movement", "speech_practice", "information"]
            if item_type not in valid_types:
                raise InvalidExerciseTypeError(f"Invalid item type: {item_type}")
            item.item_type = item_type

        # Update fields
        if display_order is not None:
            item.display_order = display_order
        if _update_instruction_id:  # Only update if flag is set
            item.instruction_id = instruction_id
        if repetitions is not None:
            item.repetitions = repetitions
        if duration_seconds is not None:
            item.duration_seconds = duration_seconds
        if metadata is not None:
            item.metadata = metadata

        item.updated_at = datetime.now(timezone.utc)
        return await self._item_repo.update(item)

    async def reorder_exercise_items(
        self,
        exercise_id: UUID,
        item_ids: list[UUID],
    ) -> bool:
        """Reorder items within an exercise."""
        return await self._item_repo.reorder_items(exercise_id, item_ids)

    async def attach_instruction_to_item(
        self,
        item_id: UUID,
        instruction_id: UUID,
    ) -> ExerciseItem:
        """Attach an instruction to an exercise item."""
        # Get the item
        item = await self.get_exercise_item_by_id(item_id)
        
        # Update the instruction_id
        item.instruction_id = instruction_id
        item.updated_at = datetime.now(timezone.utc)
        
        return await self._item_repo.update(item)

    async def detach_instruction_from_item(self, item_id: UUID) -> ExerciseItem:
        """Remove the instruction from an exercise item."""
        # Get the item
        item = await self.get_exercise_item_by_id(item_id)
        
        # Clear the instruction_id
        item.instruction_id = None
        item.updated_at = datetime.now(timezone.utc)
        
        return await self._item_repo.update(item)

    async def delete_exercise_item(self, item_id: UUID) -> bool:
        """Delete an exercise item."""
        return await self._item_repo.delete(item_id)
    
    # ==================== Display Order Validation ====================
    
    async def validate_display_order_unique(
        self,
        exercise_id: UUID,
        display_order: int,
        exclude_instruction_id: UUID | None = None,
    ) -> bool:
        """
        Validate that display_order is unique within an exercise.
        
        Checks both exercise_items and exercise_instructions to ensure no conflicts.
        
        Args:
            exercise_id: Exercise to check within
            display_order: The display order value to check
            exclude_instruction_id: Instruction ID to exclude (for updates)
            
        Returns:
            True if display_order is unique, False if conflict exists
        """
        from sqlalchemy import select, or_
        from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
        from src.infrastructure.persistence.sqla.models.exercise_instructions_model import ExerciseInstructionsModel
        
        session = self._exercise_repo._session
        
        # Check if any item has this display_order
        item_stmt = select(ExerciseItemModel).where(
            ExerciseItemModel.exercise_id == exercise_id,
            ExerciseItemModel.display_order == display_order
        )
        item_result = await session.execute(item_stmt)
        if item_result.scalar_one_or_none():
            return False
        
        # Check if any instruction has this display_order (excluding current if updating)
        instruction_stmt = select(ExerciseInstructionsModel).where(
            ExerciseInstructionsModel.exercise_id == exercise_id,
            ExerciseInstructionsModel.display_order == display_order
        )
        if exclude_instruction_id:
            instruction_stmt = instruction_stmt.where(
                ExerciseInstructionsModel.id != exclude_instruction_id
            )
        instruction_result = await session.execute(instruction_stmt)
        if instruction_result.scalar_one_or_none():
            return False
        
        return True
    
    async def get_next_display_order(self, exercise_id: UUID) -> int:
        """
        Get the next available display_order for an exercise.
        
        Looks at both items and instructions to find the highest value.
        
        Args:
            exercise_id: Exercise to check
            
        Returns:
            Next available display_order (max + 1, or 0 if none exist)
        """
        from sqlalchemy import select, func
        from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
        from src.infrastructure.persistence.sqla.models.exercise_instructions_model import ExerciseInstructionsModel
        
        session = self._exercise_repo._session
        
        # Get max display_order from items
        item_stmt = select(func.max(ExerciseItemModel.display_order)).where(
            ExerciseItemModel.exercise_id == exercise_id
        )
        item_result = await session.execute(item_stmt)
        max_item_order = item_result.scalar() or -1
        
        # Get max display_order from instructions
        instruction_stmt = select(func.max(ExerciseInstructionsModel.display_order)).where(
            ExerciseInstructionsModel.exercise_id == exercise_id
        )
        instruction_result = await session.execute(instruction_stmt)
        max_instruction_order = instruction_result.scalar() or -1
        
        return max(max_item_order, max_instruction_order) + 1
    
    # ==================== Library Item Management ====================
    
    async def create_library_item(
        self,
        item_type: str,
        contents: list[dict],
        instruction_id: UUID | None = None,
        repetitions: int | None = None,
        duration_seconds: int | None = None,
        metadata: dict | None = None,
    ) -> ExerciseItem:
        """
        Create a standalone library item.
        
        Args:
            item_type: Type of item (movement, speech_practice, etc.)
            contents: List of content dicts (language, title, description, media_file_id, etc.)
            instruction_id: Optional instruction reference
            repetitions: Optional repetition count
            duration_seconds: Optional duration
            metadata: Optional metadata dict
            
        Returns:
            Created library item with contents
            
        Raises:
            ValueError: If validation fails
        """
        # Validate contents are provided
        print(f"DEBUG: create_library_item called with contents={contents}, len={len(contents) if contents else 0}")
        if not contents:
            raise ValueError("Library items must have at least one content item")
        
        # Create the library item entity
        item = ExerciseItem(
            id=uuid4(),
            exercise_id=None,  # Library items have no exercise
            is_library_item=True,
            item_type=item_type,
            display_order=0,  # Not relevant for library items
            instruction_id=instruction_id,
            repetitions=repetitions,
            duration_seconds=duration_seconds,
            metadata=metadata,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        # Note: We skip item.validate() here because contents will be added after item creation
        # The domain rule requires contents for library items, but we add them in the next step
        
        # Create via repository
        created_item = await self._item_repo.create_library_item(item)
        
        # Add contents
        content_entities = []
        for content_data in contents:
            content = ExerciseItemContent(
                id=uuid4(),
                item_id=created_item.id,
                language=content_data.get("language", "de"),
                text_content=content_data.get("text_content"),
                phonetic_transcription=content_data.get("phonetic_transcription"),
                audio_example_url=content_data.get("audio_example_url"),
                demonstration_video_url=content_data.get("demonstration_video_url"),
                image_url=content_data.get("image_url"),
                difficulty=content_data.get("difficulty"),
                info_type=content_data.get("info_type"),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            content_entities.append(content)
        
        # Bulk create contents (need to implement this in content repository)
        # For now, we'll add them individually via the session
        from src.infrastructure.persistence.sqla.models.exercise_item_content_model import ExerciseItemContentModel
        
        session = self._item_repo._session
        for content in content_entities:
            content_record = ExerciseItemContentModel(
                id=content.id,
                item_id=content.item_id,
                language=content.language,
                text_content=content.text_content,
                phonetic_transcription=content.phonetic_transcription,
                audio_example_url=content.audio_example_url,
                demonstration_video_url=content.demonstration_video_url,
                image_url=content.image_url,
                difficulty=content.difficulty,
                info_type=content.info_type,
                created_at=content.created_at,
                updated_at=content.updated_at,
            )
            session.add(content_record)
        
        await session.flush()
        
        # Return item with contents loaded
        return await self._item_repo.get_library_item_with_content(created_item.id)
    
    async def get_library_items(
        self,
        item_type: str | None = None,
        language: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[ExerciseItem], int]:
        """
        Get paginated library items.
        
        Args:
            item_type: Optional filter by item type
            language: Optional language filter for content
            limit: Max items per page
            offset: Number of items to skip
            
        Returns:
            Tuple of (items, total_count)
        """
        return await self._item_repo.get_library_items(
            item_type=item_type,
            language=language,
            limit=limit,
            offset=offset,
        )
    
    async def get_library_item_by_id(
        self,
        item_id: UUID,
        language: str | None = None,
    ) -> ExerciseItem:
        """
        Get library item by ID with contents.
        
        Args:
            item_id: Library item ID
            language: Optional language filter
            
        Returns:
            Library item with contents
            
        Raises:
            ExerciseItemNotFoundError: If not found or not a library item
        """
        item = await self._item_repo.get_library_item_with_content(item_id, language)
        if not item:
            raise ExerciseItemNotFoundError(f"Library item {item_id} not found")
        return item
    
    async def update_library_item(
        self,
        item_id: UUID,
        item_type: str | None = None,
        instruction_id: UUID | None = None,
        repetitions: int | None = None,
        duration_seconds: int | None = None,
        metadata: dict | None = None,
    ) -> ExerciseItem:
        """Update library item properties."""
        item = await self.get_library_item_by_id(item_id)
        
        if item_type is not None:
            item.item_type = item_type
        if instruction_id is not None:
            item.instruction_id = instruction_id
        if repetitions is not None:
            item.repetitions = repetitions
        if duration_seconds is not None:
            item.duration_seconds = duration_seconds
        if metadata is not None:
            item.metadata = metadata
        
        item.updated_at = datetime.now(timezone.utc)
        
        return await self._item_repo.update(item)
    
    async def delete_library_item(self, item_id: UUID) -> bool:
        """Delete a library item."""
        item = await self.get_library_item_by_id(item_id)
        return await self._item_repo.delete(item_id)
    
    async def duplicate_item(
        self,
        item_id: UUID,
        as_library_item: bool = False,
        target_exercise_id: UUID | None = None,
    ) -> ExerciseItem:
        """
        Duplicate an item with all its contents.
        
        Args:
            item_id: Source item ID
            as_library_item: If True, creates as library item
            target_exercise_id: Required if as_library_item=False
            
        Returns:
            Newly created duplicate
            
        Raises:
            ValueError: If validation fails
        """
        if not as_library_item and target_exercise_id is None:
            raise ValueError("target_exercise_id required when as_library_item=False")
        
        return await self._item_repo.duplicate_item(item_id, as_library_item, target_exercise_id)
    
    async def attach_library_item_to_exercise(
        self,
        library_item_id: UUID,
        exercise_id: UUID,
        display_order: int | None = None,
    ) -> ExerciseItem:
        """
        Attach a library item to an exercise by creating a linked copy.
        
        Args:
            library_item_id: Library item to attach
            exercise_id: Target exercise
            display_order: Optional display order (defaults to last)
            
        Returns:
            Newly created exercise item
        """
        # Verify exercise exists
        exercise = await self.get_exercise_by_id(exercise_id)
        
        # Get next display order if not provided
        if display_order is None:
            display_order = await self.get_next_display_order(exercise_id)
        
        return await self._item_repo.attach_library_item_to_exercise(
            library_item_id=library_item_id,
            exercise_id=exercise_id,
            display_order=display_order,
        )
    
    async def create_exercise_from_library_items(
        self,
        code: str,
        name: str,
        category_id: UUID,
        library_item_ids: list[UUID],
        description: str | None = None,
        difficulty: str = "medium",
        version: int = 1,
    ) -> Exercise:
        """
        Create a new exercise by composing library items.
        
        Args:
            code: Exercise code
            name: Exercise name (becomes title)
            category_id: Category ID
            library_item_ids: List of library item IDs to include
            description: Optional description (becomes subtitle)
            difficulty: Difficulty level (easy, medium, hard, etc.)
            version: Version number
            
        Returns:
            Created exercise with attached items
        """
        # Verify category exists
        await self.get_category_by_id(category_id)
        
        # Map difficulty levels from schema to domain
        difficulty_map = {
            "very_easy": "beginner",
            "easy": "beginner",
            "medium": "intermediate",
            "hard": "advanced",
            "very_hard": "advanced",
        }
        difficulty_level = difficulty_map.get(difficulty, "intermediate")
        
        # Create the exercise using proper field names
        exercise = await self.create_exercise(
            code=code,
            title=name,  # name -> title
            category_id=category_id,
            subtitle=description,  # description -> subtitle
            difficulty_level=difficulty_level,  # mapped difficulty
        )
        
        # Attach library items
        for order, library_item_id in enumerate(library_item_ids):
            await self.attach_library_item_to_exercise(
                library_item_id=library_item_id,
                exercise_id=exercise.id,
                display_order=order,
            )
        
        # Return complete exercise with items
        return await self.get_exercise_by_id(exercise.id, load_items=True)