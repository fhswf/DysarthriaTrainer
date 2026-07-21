"""
Unit tests for ExerciseService.

Tests service business logic with mocked repositories.
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID, uuid4

import pytest

from src.application.services.exercise_service import ExerciseService
from src.core.entities.exercise import Exercise
from src.core.entities.exercise_category import ExerciseCategory
from src.core.entities.exercise_item import ExerciseItem
from src.core.entities.exercise_instructions import ExerciseInstructions
from src.core.enums.exercise_enums import DifficultyLevel, ExerciseItemType
from src.core.exceptions.exercise_exceptions import (
    ExerciseCategoryNotFoundError,
    ExerciseNotFoundError,
    ExerciseItemNotFoundError,
)


@pytest.fixture
def mock_category_repo():
    """Create mock category repository."""
    return AsyncMock()


@pytest.fixture
def mock_exercise_repo():
    """Create mock exercise repository."""
    return AsyncMock()


@pytest.fixture
def mock_item_repo():
    """Create mock exercise item repository."""
    return AsyncMock()


@pytest.fixture
def exercise_service(
    mock_category_repo, mock_exercise_repo, mock_item_repo
):
    """Create ExerciseService with mocked dependencies."""
    return ExerciseService(
        category_repository=mock_category_repo,
        exercise_repository=mock_exercise_repo,
        item_repository=mock_item_repo,
    )


class TestCategoryManagement:
    """Test category management methods."""
    
    @pytest.mark.asyncio
    async def test_create_category_success(self, exercise_service, mock_category_repo):
        """Test creating a category successfully."""
        # Arrange
        category_id = uuid4()
        created_at = datetime.now(timezone.utc)
        
        expected_category = ExerciseCategory(
            id=category_id,
            name="Lippen-Training",
            slug="lippen-training",
            description="Übungen für Lippenmuskulatur",
            icon_url=None,
            display_order=0,
            created_at=created_at,
            updated_at=created_at,
        )
        
        # Mock slug doesn't exist
        mock_category_repo.get_by_slug.return_value = None
        mock_category_repo.add.return_value = expected_category
        
        # Act
        result = await exercise_service.create_category(
            name="Lippen-Training",
            slug="lippen-training",
            description="Übungen für Lippenmuskulatur",
        )
        
        # Assert
        assert result.id == category_id
        assert result.name == "Lippen-Training"
        assert result.slug == "lippen-training"
        mock_category_repo.get_by_slug.assert_called_once_with("lippen-training")
        mock_category_repo.add.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_category_by_id_success(self, exercise_service, mock_category_repo):
        """Test retrieving a category by ID."""
        # Arrange
        category_id = uuid4()
        expected_category = ExerciseCategory(
            id=category_id,
            name="Lippen-Training",
            slug="lippen-training",
            description=None,
            icon_url=None,
            display_order=0,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        mock_category_repo.get_by_id.return_value = expected_category
        
        # Act
        result = await exercise_service.get_category_by_id(category_id)
        
        # Assert
        assert result.id == category_id
        assert result.name == "Lippen-Training"
        mock_category_repo.get_by_id.assert_called_once_with(category_id)
    
    @pytest.mark.asyncio
    async def test_get_category_by_id_not_found(
        self, exercise_service, mock_category_repo
    ):
        """Test retrieving a non-existent category raises error."""
        # Arrange
        category_id = uuid4()
        mock_category_repo.get_by_id.return_value = None
        
        # Act & Assert
        with pytest.raises(ExerciseCategoryNotFoundError):
            await exercise_service.get_category_by_id(category_id)
    
    @pytest.mark.asyncio
    async def test_get_all_categories(self, exercise_service, mock_category_repo):
        """Test getting all categories."""
        # Arrange
        categories = [
            ExerciseCategory(
                id=uuid4(),
                name="Category 1",
                slug="category-1",
                description=None,
                icon_url=None,
                display_order=0,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            ),
            ExerciseCategory(
                id=uuid4(),
                name="Category 2",
                slug="category-2",
                description=None,
                icon_url=None,
                display_order=1,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            ),
        ]
        
        # Mock the paginated method to return tuple (categories, count)
        mock_category_repo.get_active_categories_paginated.return_value = (categories, len(categories))
        
        # Act
        result, count = await exercise_service.get_all_categories()
        
        # Assert
        assert len(result) == 2
        assert count == 2
        assert result[0].name == "Category 1"
        assert result[1].name == "Category 2"
        mock_category_repo.get_active_categories_paginated.assert_called_once_with(
            offset=0,
            limit=50,
            search=None,
        )


class TestExerciseManagement:
    """Test exercise management methods."""
    
    @pytest.mark.asyncio
    async def test_create_exercise_success(
        self, exercise_service, mock_exercise_repo, mock_category_repo
    ):
        """Test creating an exercise successfully."""
        # Arrange
        category_id = uuid4()
        exercise_id = uuid4()
        
        # Mock category exists
        mock_category_repo.get_by_id.return_value = ExerciseCategory(
            id=category_id,
            name="Test Category",
            slug="test-category",
            description=None,
            icon_url=None,
            display_order=0,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        # Mock code is unique
        mock_exercise_repo.get_by_code.return_value = None
        
        expected_exercise = Exercise(
            id=exercise_id,
            category_id=category_id,
            code="LT001",
            title="Test Exercise",
            subtitle=None,
            scope=None,
            difficulty_level=DifficultyLevel.BEGINNER,
            estimated_duration_minutes=5,
            display_order=0,
            version=1,
            is_active=True,
            superseded_by=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            created_by=None,
            deleted_at=None,
            deleted_by=None,
        )
        
        mock_exercise_repo.add.return_value = expected_exercise
        
        # Act
        result = await exercise_service.create_exercise(
            category_id=category_id,
            code="LT001",
            title="Test Exercise",
            difficulty_level=DifficultyLevel.BEGINNER,
            estimated_duration_minutes=5,
        )
        
        # Assert
        assert result.id == exercise_id
        assert result.code == "LT001"
        assert result.title == "Test Exercise"
        mock_exercise_repo.add.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_create_exercise_category_not_found(
        self, exercise_service, mock_exercise_repo, mock_category_repo
    ):
        """Test creating exercise with non-existent category raises error."""
        # Arrange
        category_id = uuid4()
        mock_category_repo.get_by_id.return_value = None
        
        # Act & Assert
        with pytest.raises(ExerciseCategoryNotFoundError):
            await exercise_service.create_exercise(
                category_id=category_id,
                code="LT001",
                title="Test Exercise",
                difficulty_level=DifficultyLevel.BEGINNER,
            )
    
    @pytest.mark.asyncio
    async def test_create_exercise_code_already_exists(
        self, exercise_service, mock_exercise_repo, mock_category_repo
    ):
        """Test creating exercise with duplicate code raises error."""
        # Arrange
        category_id = uuid4()
        
        # Mock category exists
        mock_category_repo.get_by_id.return_value = ExerciseCategory(
            id=category_id,
            name="Test Category",
            slug="test-category",
            description=None,
            icon_url=None,
            display_order=0,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        # Mock code already exists
        mock_exercise_repo.get_by_code.return_value = Exercise(
            id=uuid4(),
            category_id=category_id,
            code="LT001",
            title="Existing Exercise",
            subtitle=None,
            scope=None,
            difficulty_level=DifficultyLevel.BEGINNER,
            estimated_duration_minutes=5,
            display_order=0,
            version=1,
            is_active=True,
            superseded_by=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            created_by=None,
            deleted_at=None,
            deleted_by=None,
        )
        
        # Act & Assert
        with pytest.raises(ValueError, match="Exercise with code 'LT001' already exists"):
            await exercise_service.create_exercise(
                category_id=category_id,
                code="LT001",
                title="New Exercise",
                difficulty_level=DifficultyLevel.BEGINNER,
            )
    
    @pytest.mark.asyncio
    async def test_get_exercise_by_id(self, exercise_service, mock_exercise_repo):
        """Test retrieving exercise by ID."""
        # Arrange
        exercise_id = uuid4()
        expected_exercise = Exercise(
            id=exercise_id,
            category_id=uuid4(),
            code="LT001",
            title="Test Exercise",
            subtitle=None,
            scope=None,
            difficulty_level=DifficultyLevel.BEGINNER,
            estimated_duration_minutes=5,
            display_order=0,
            version=1,
            is_active=True,
            superseded_by=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            created_by=None,
            deleted_at=None,
            deleted_by=None,
        )
        
        mock_exercise_repo.get_by_id.return_value = expected_exercise
        
        # Act
        result = await exercise_service.get_exercise_by_id(exercise_id)
        
        # Assert
        assert result.id == exercise_id
        assert result.code == "LT001"
        mock_exercise_repo.get_by_id.assert_called_once_with(exercise_id)
    
    @pytest.mark.asyncio
    async def test_get_exercise_by_id_not_found(
        self, exercise_service, mock_exercise_repo
    ):
        """Test retrieving non-existent exercise raises error."""
        # Arrange
        exercise_id = uuid4()
        mock_exercise_repo.get_by_id.return_value = None
        
        # Act & Assert
        with pytest.raises(ExerciseNotFoundError):
            await exercise_service.get_exercise_by_id(exercise_id)


class TestExerciseItemManagement:
    """Test exercise item management methods."""
    
    @pytest.mark.asyncio
    async def test_add_item_to_exercise_success(
        self, exercise_service, mock_item_repo, mock_exercise_repo
    ):
        """Test adding an exercise item successfully."""
        # Arrange
        exercise_id = uuid4()
        item_id = uuid4()
        
        # Mock exercise exists
        mock_exercise_repo.get_by_id.return_value = Exercise(
            id=exercise_id,
            category_id=uuid4(),
            code="LT001",
            title="Test Exercise",
            subtitle=None,
            scope=None,
            difficulty_level=DifficultyLevel.BEGINNER,
            estimated_duration_minutes=5,
            display_order=0,
            version=1,
            is_active=True,
            superseded_by=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            created_by=None,
            deleted_at=None,
            deleted_by=None,
        )
        
        expected_item = ExerciseItem(
            id=item_id,
            exercise_id=exercise_id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={"instruction": "Test movement"},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        mock_item_repo.add.return_value = expected_item
        
        # Act
        result = await exercise_service.add_item_to_exercise(
            exercise_id=exercise_id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={"instruction": "Test movement"},
        )
        
        # Assert
        assert result.id == item_id
        assert result.exercise_id == exercise_id
        assert result.item_type == ExerciseItemType.MOVEMENT
        mock_item_repo.add.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_add_item_exercise_not_found(
        self, exercise_service, mock_item_repo, mock_exercise_repo
    ):
        """Test adding item for non-existent exercise raises error."""
        # Arrange
        exercise_id = uuid4()
        mock_exercise_repo.get_by_id.return_value = None
        
        # Act & Assert
        with pytest.raises(ExerciseNotFoundError):
            await exercise_service.add_item_to_exercise(
                exercise_id=exercise_id,
                item_type=ExerciseItemType.MOVEMENT,
                display_order=0,
            )
    
    @pytest.mark.asyncio
    async def test_get_exercise_items(self, exercise_service, mock_item_repo):
        """Test getting all items for an exercise."""
        # Arrange
        exercise_id = uuid4()
        items = [
            ExerciseItem(
                id=uuid4(),
                exercise_id=exercise_id,
                item_type=ExerciseItemType.MOVEMENT,
                display_order=0,
                repetitions=3,
                duration_seconds=5,
                metadata={},
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            ),
            ExerciseItem(
                id=uuid4(),
                exercise_id=exercise_id,
                item_type=ExerciseItemType.SPEECH_PRACTICE,
                display_order=1,
                repetitions=None,
                duration_seconds=None,
                metadata={"text": "Test"},
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            ),
        ]
        
        mock_item_repo.get_by_exercise_id.return_value = items
        mock_item_repo.get_by_exercise.return_value = items
        
        # Act
        result = await exercise_service.get_exercise_items(exercise_id)
        
        # Assert
        assert len(result) == 2
        assert result[0].item_type == ExerciseItemType.MOVEMENT
        assert result[1].item_type == ExerciseItemType.SPEECH_PRACTICE
        mock_item_repo.get_by_exercise.assert_called_once_with(exercise_id, None)

    @pytest.mark.asyncio
    async def test_get_exercise_item_by_id_success(
        self, exercise_service, mock_item_repo
    ):
        """Test retrieving an exercise item by ID successfully."""
        # Arrange
        item_id = uuid4()
        exercise_id = uuid4()
        
        expected_item = ExerciseItem(
            id=item_id,
            exercise_id=exercise_id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={"instruction": "Test movement"},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        mock_item_repo.get_by_id.return_value = expected_item
        
        # Act
        result = await exercise_service.get_exercise_item_by_id(item_id)
        
        # Assert
        assert result.id == item_id
        assert result.exercise_id == exercise_id
        assert result.item_type == ExerciseItemType.MOVEMENT
        mock_item_repo.get_by_id.assert_called_once_with(item_id)

    @pytest.mark.asyncio
    async def test_get_exercise_item_by_id_not_found(
        self, exercise_service, mock_item_repo
    ):
        """Test retrieving non-existent exercise item raises error."""
        # Arrange
        item_id = uuid4()
        mock_item_repo.get_by_id.return_value = None
        
        # Act & Assert
        with pytest.raises(ExerciseItemNotFoundError):
            await exercise_service.get_exercise_item_by_id(item_id)

    @pytest.mark.asyncio
    async def test_update_exercise_item_success(
        self, exercise_service, mock_item_repo
    ):
        """Test updating an exercise item successfully."""
        # Arrange
        item_id = uuid4()
        exercise_id = uuid4()
        
        existing_item = ExerciseItem(
            id=item_id,
            exercise_id=exercise_id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={"instruction": "Old instruction"},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        updated_item = ExerciseItem(
            id=item_id,
            exercise_id=exercise_id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=1,
            repetitions=5,
            duration_seconds=10,
            metadata={"instruction": "New instruction"},
            created_at=existing_item.created_at,
            updated_at=datetime.now(timezone.utc),
        )
        
        mock_item_repo.get_by_id.return_value = existing_item
        mock_item_repo.update.return_value = updated_item
        
        # Act
        result = await exercise_service.update_exercise_item(
            item_id=item_id,
            display_order=1,
            repetitions=5,
            duration_seconds=10,
            metadata={"instruction": "New instruction"},
        )
        
        # Assert
        assert result.id == item_id
        assert result.display_order == 1
        assert result.repetitions == 5
        assert result.duration_seconds == 10
        assert result.metadata["instruction"] == "New instruction"
        mock_item_repo.get_by_id.assert_called_once_with(item_id)
        mock_item_repo.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_exercise_item_with_type_change(
        self, exercise_service, mock_item_repo
    ):
        """Test updating exercise item with type change."""
        # Arrange
        item_id = uuid4()
        exercise_id = uuid4()
        
        existing_item = ExerciseItem(
            id=item_id,
            exercise_id=exercise_id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={"instruction": "Movement"},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        updated_item = ExerciseItem(
            id=item_id,
            exercise_id=exercise_id,
            item_type=ExerciseItemType.SPEECH_PRACTICE,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={"text": "Papa", "phonetic_target": "/p/"},
            created_at=existing_item.created_at,
            updated_at=datetime.now(timezone.utc),
        )
        
        mock_item_repo.get_by_id.return_value = existing_item
        mock_item_repo.update.return_value = updated_item
        
        # Act
        result = await exercise_service.update_exercise_item(
            item_id=item_id,
            item_type="speech_practice",
            metadata={"text": "Papa", "phonetic_target": "/p/"},
        )
        
        # Assert
        assert result.item_type == ExerciseItemType.SPEECH_PRACTICE
        assert result.metadata["text"] == "Papa"
        mock_item_repo.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_exercise_item_not_found(
        self, exercise_service, mock_item_repo
    ):
        """Test updating non-existent item raises error."""
        # Arrange
        item_id = uuid4()
        mock_item_repo.get_by_id.return_value = None
        
        # Act & Assert
        with pytest.raises(ExerciseItemNotFoundError):
            await exercise_service.update_exercise_item(
                item_id=item_id,
                display_order=1,
            )

    @pytest.mark.asyncio
    async def test_update_exercise_item_invalid_type(
        self, exercise_service, mock_item_repo
    ):
        """Test updating item with invalid type raises error."""
        # Arrange
        item_id = uuid4()
        exercise_id = uuid4()
        
        existing_item = ExerciseItem(
            id=item_id,
            exercise_id=exercise_id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        mock_item_repo.get_by_id.return_value = existing_item
        
        # Act & Assert
        from src.core.exceptions.exercise_exceptions import InvalidExerciseTypeError
        with pytest.raises(InvalidExerciseTypeError):
            await exercise_service.update_exercise_item(
                item_id=item_id,
                item_type="invalid_type",
            )

    # ==================== Instruction-Item Association Tests ====================

    @pytest.mark.asyncio
    async def test_add_item_with_instruction_id(
        self, exercise_service, mock_item_repo, mock_exercise_repo
    ):
        """Test adding an exercise item with instruction_id."""
        # Arrange
        exercise_id = uuid4()
        item_id = uuid4()
        instruction_id = uuid4()
        
        # Mock exercise exists
        mock_exercise_repo.get_by_id.return_value = Exercise(
            id=exercise_id,
            category_id=uuid4(),
            code="LT001",
            title="Test Exercise",
            subtitle=None,
            scope=None,
            difficulty_level=DifficultyLevel.BEGINNER,
            estimated_duration_minutes=5,
            display_order=0,
            version=1,
            is_active=True,
            superseded_by=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            created_by=None,
            deleted_at=None,
            deleted_by=None,
        )
        
        expected_item = ExerciseItem(
            id=item_id,
            exercise_id=exercise_id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={"instruction": "Test movement"},
            instruction_id=instruction_id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        mock_item_repo.add.return_value = expected_item
        
        # Act
        result = await exercise_service.add_item_to_exercise(
            exercise_id=exercise_id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={"instruction": "Test movement"},
            instruction_id=instruction_id,
        )
        
        # Assert
        assert result.id == item_id
        assert result.instruction_id == instruction_id
        mock_item_repo.add.assert_called_once()
        # Verify the ExerciseItem passed to add had instruction_id
        call_args = mock_item_repo.add.call_args
        created_item = call_args[0][0]
        assert created_item.instruction_id == instruction_id

    @pytest.mark.asyncio
    async def test_update_item_with_instruction_id(
        self, exercise_service, mock_item_repo
    ):
        """Test updating an item to add instruction_id."""
        # Arrange
        item_id = uuid4()
        exercise_id = uuid4()
        instruction_id = uuid4()
        
        existing_item = ExerciseItem(
            id=item_id,
            exercise_id=exercise_id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={"instruction": "Old instruction"},
            instruction_id=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        updated_item = ExerciseItem(
            id=item_id,
            exercise_id=exercise_id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={"instruction": "Old instruction"},
            instruction_id=instruction_id,
            created_at=existing_item.created_at,
            updated_at=datetime.now(timezone.utc),
        )
        
        mock_item_repo.get_by_id.return_value = existing_item
        mock_item_repo.update.return_value = updated_item
        
        # Act
        result = await exercise_service.update_exercise_item(
            item_id=item_id,
            instruction_id=instruction_id,
            _update_instruction_id=True,  # Flag to update instruction_id
        )
        
        # Assert
        assert result.instruction_id == instruction_id
        mock_item_repo.update.assert_called_once()
        # Verify the updated item had instruction_id
        call_args = mock_item_repo.update.call_args
        updated_item_arg = call_args[0][0]
        assert updated_item_arg.instruction_id == instruction_id

    @pytest.mark.asyncio
    async def test_update_item_clear_instruction_id(
        self, exercise_service, mock_item_repo
    ):
        """Test updating an item to clear instruction_id."""
        # Arrange
        item_id = uuid4()
        exercise_id = uuid4()
        instruction_id = uuid4()
        
        existing_item = ExerciseItem(
            id=item_id,
            exercise_id=exercise_id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={},
            instruction_id=instruction_id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        updated_item = ExerciseItem(
            id=item_id,
            exercise_id=exercise_id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={},
            instruction_id=None,
            created_at=existing_item.created_at,
            updated_at=datetime.now(timezone.utc),
        )
        
        mock_item_repo.get_by_id.return_value = existing_item
        mock_item_repo.update.return_value = updated_item
        
        # Act
        result = await exercise_service.update_exercise_item(
            item_id=item_id,
            instruction_id=None,
        )
        
        # Assert
        assert result.instruction_id is None
        mock_item_repo.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_attach_instruction_to_item_success(
        self, exercise_service, mock_item_repo
    ):
        """Test attaching an instruction to an item."""
        # Arrange
        item_id = uuid4()
        exercise_id = uuid4()
        instruction_id = uuid4()
        
        existing_item = ExerciseItem(
            id=item_id,
            exercise_id=exercise_id,
            item_type=ExerciseItemType.SPEECH_PRACTICE,
            display_order=0,
            repetitions=None,
            duration_seconds=None,
            metadata={"text": "Test"},
            instruction_id=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        updated_item = ExerciseItem(
            id=item_id,
            exercise_id=exercise_id,
            item_type=ExerciseItemType.SPEECH_PRACTICE,
            display_order=0,
            repetitions=None,
            duration_seconds=None,
            metadata={"text": "Test"},
            instruction_id=instruction_id,
            created_at=existing_item.created_at,
            updated_at=datetime.now(timezone.utc),
        )
        
        mock_item_repo.get_by_id.return_value = existing_item
        mock_item_repo.update.return_value = updated_item
        
        # Act
        result = await exercise_service.attach_instruction_to_item(
            item_id=item_id,
            instruction_id=instruction_id,
        )
        
        # Assert
        assert result.id == item_id
        assert result.instruction_id == instruction_id
        mock_item_repo.get_by_id.assert_called_once_with(item_id)
        mock_item_repo.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_attach_instruction_item_not_found(
        self, exercise_service, mock_item_repo
    ):
        """Test attaching instruction to non-existent item raises error."""
        # Arrange
        item_id = uuid4()
        instruction_id = uuid4()
        mock_item_repo.get_by_id.return_value = None
        
        # Act & Assert
        with pytest.raises(ExerciseItemNotFoundError):
            await exercise_service.attach_instruction_to_item(
                item_id=item_id,
                instruction_id=instruction_id,
            )

    @pytest.mark.asyncio
    async def test_detach_instruction_from_item_success(
        self, exercise_service, mock_item_repo
    ):
        """Test detaching an instruction from an item."""
        # Arrange
        item_id = uuid4()
        exercise_id = uuid4()
        instruction_id = uuid4()
        
        existing_item = ExerciseItem(
            id=item_id,
            exercise_id=exercise_id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={},
            instruction_id=instruction_id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        updated_item = ExerciseItem(
            id=item_id,
            exercise_id=exercise_id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={},
            instruction_id=None,
            created_at=existing_item.created_at,
            updated_at=datetime.now(timezone.utc),
        )
        
        mock_item_repo.get_by_id.return_value = existing_item
        mock_item_repo.update.return_value = updated_item
        
        # Act
        result = await exercise_service.detach_instruction_from_item(item_id=item_id)
        
        # Assert
        assert result.id == item_id
        assert result.instruction_id is None
        mock_item_repo.get_by_id.assert_called_once_with(item_id)
        mock_item_repo.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_detach_instruction_item_not_found(
        self, exercise_service, mock_item_repo
    ):
        """Test detaching instruction from non-existent item raises error."""
        # Arrange
        item_id = uuid4()
        mock_item_repo.get_by_id.return_value = None
        
        # Act & Assert
        with pytest.raises(ExerciseItemNotFoundError):
            await exercise_service.detach_instruction_from_item(item_id=item_id)
