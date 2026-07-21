"""
Integration tests for ExerciseItemRepository - instruction_id functionality.

Tests repository mapping for instruction_id and eager loading of instructions.
"""

import pytest
from datetime import datetime, timezone
from uuid import uuid4

from src.core.entities.exercise_item import ExerciseItem
from src.core.entities.exercise_instructions import ExerciseInstructions
from src.core.enums.exercise_enums import ExerciseItemType
from src.infrastructure.persistence.sqla.repositories.exercise_item import ExerciseItemRepository
from src.infrastructure.persistence.sqla.models.exercise_instructions_model import ExerciseInstructionsModel


@pytest.mark.asyncio
class TestExerciseItemRepositoryInstructions:
    """Integration tests for ExerciseItemRepository instruction functionality."""
    
    async def test_create_item_with_instruction_id(
        self, db_session, test_exercise, test_instruction
    ):
        """Test creating an exercise item with instruction_id."""
        # Arrange
        repo = ExerciseItemRepository(db_session)
        item = ExerciseItem(
            id=uuid4(),
            exercise_id=test_exercise.id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={"test": True},
            instruction_id=test_instruction.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        # Act
        created = await repo.add(item)
        
        # Assert
        assert created.id == item.id
        assert created.instruction_id == test_instruction.id
        assert created.exercise_id == test_exercise.id
    
    async def test_create_item_without_instruction(
        self, db_session, test_exercise
    ):
        """Test creating an exercise item without instruction_id."""
        # Arrange
        repo = ExerciseItemRepository(db_session)
        item = ExerciseItem(
            id=uuid4(),
            exercise_id=test_exercise.id,
            item_type=ExerciseItemType.SPEECH_PRACTICE,
            display_order=1,
            repetitions=None,
            duration_seconds=None,
            metadata={"text": "Test"},
            instruction_id=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        # Act
        created = await repo.add(item)
        
        # Assert
        assert created.id == item.id
        assert created.instruction_id is None
    
    async def test_get_by_id_with_instruction(
        self, db_session, test_exercise, test_instruction
    ):
        """Test retrieving an item by ID includes instruction if loaded."""
        # Arrange
        repo = ExerciseItemRepository(db_session)
        item = ExerciseItem(
            id=uuid4(),
            exercise_id=test_exercise.id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={},
            instruction_id=test_instruction.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        await repo.add(item)
        
        # Act
        found = await repo.get_by_id(item.id)
        
        # Assert
        assert found is not None
        assert found.id == item.id
        assert found.instruction_id == test_instruction.id
        # Note: instruction entity may not be loaded without explicit eager loading
    
    async def test_get_by_exercise_with_instruction_eager_loading(
        self, db_session, test_exercise, test_instruction
    ):
        """Test get_by_exercise eager loads instructions."""
        # Arrange
        repo = ExerciseItemRepository(db_session)
        item1 = ExerciseItem(
            id=uuid4(),
            exercise_id=test_exercise.id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={},
            instruction_id=test_instruction.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        item2 = ExerciseItem(
            id=uuid4(),
            exercise_id=test_exercise.id,
            item_type=ExerciseItemType.SPEECH_PRACTICE,
            display_order=1,
            repetitions=None,
            duration_seconds=None,
            metadata={"text": "Test"},
            instruction_id=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        await repo.add(item1)
        await repo.add(item2)
        
        # Act
        items = await repo.get_by_exercise(test_exercise.id)
        
        # Assert
        assert len(items) == 2
        
        # Find items by display_order
        item_with_instruction = next(i for i in items if i.display_order == 0)
        item_without_instruction = next(i for i in items if i.display_order == 1)
        
        assert item_with_instruction.instruction_id == test_instruction.id
        assert item_with_instruction.instruction is not None
        assert item_with_instruction.instruction.id == test_instruction.id
        assert item_with_instruction.instruction.hint_text == test_instruction.hint_text
        
        assert item_without_instruction.instruction_id is None
        assert item_without_instruction.instruction is None
    
    async def test_update_item_add_instruction(
        self, db_session, test_exercise, test_instruction
    ):
        """Test updating an item to add instruction_id."""
        # Arrange
        repo = ExerciseItemRepository(db_session)
        item = ExerciseItem(
            id=uuid4(),
            exercise_id=test_exercise.id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={},
            instruction_id=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        created = await repo.add(item)
        
        # Act - Update with instruction_id
        created.instruction_id = test_instruction.id
        created.updated_at = datetime.now(timezone.utc)
        updated = await repo.update(created)
        
        # Assert
        assert updated.instruction_id == test_instruction.id
        
        # Verify it's persisted
        found = await repo.get_by_id(updated.id)
        assert found.instruction_id == test_instruction.id
    
    async def test_update_item_remove_instruction(
        self, db_session, test_exercise, test_instruction
    ):
        """Test updating an item to remove instruction_id."""
        # Arrange
        repo = ExerciseItemRepository(db_session)
        item = ExerciseItem(
            id=uuid4(),
            exercise_id=test_exercise.id,
            item_type=ExerciseItemType.SPEECH_PRACTICE,
            display_order=0,
            repetitions=None,
            duration_seconds=None,
            metadata={},
            instruction_id=test_instruction.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        created = await repo.add(item)
        
        # Act - Update to clear instruction_id
        created.instruction_id = None
        created.updated_at = datetime.now(timezone.utc)
        updated = await repo.update(created)
        
        # Assert
        assert updated.instruction_id is None
        
        # Verify it's persisted
        found = await repo.get_by_id(updated.id)
        assert found.instruction_id is None
    
    async def test_multiple_items_same_instruction(
        self, db_session, test_exercise, test_instruction
    ):
        """Test multiple items can reference the same instruction."""
        # Arrange
        repo = ExerciseItemRepository(db_session)
        item1 = ExerciseItem(
            id=uuid4(),
            exercise_id=test_exercise.id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=0,
            repetitions=3,
            duration_seconds=5,
            metadata={},
            instruction_id=test_instruction.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        item2 = ExerciseItem(
            id=uuid4(),
            exercise_id=test_exercise.id,
            item_type=ExerciseItemType.MOVEMENT,
            display_order=1,
            repetitions=5,
            duration_seconds=10,
            metadata={},
            instruction_id=test_instruction.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        # Act
        created1 = await repo.add(item1)
        created2 = await repo.add(item2)
        
        # Assert
        assert created1.instruction_id == test_instruction.id
        assert created2.instruction_id == test_instruction.id
        
        # Verify both items load the same instruction
        items = await repo.get_by_exercise(test_exercise.id)
        assert len(items) == 2
        assert all(i.instruction_id == test_instruction.id for i in items)
        assert all(i.instruction is not None for i in items)
        assert all(i.instruction.hint_text == test_instruction.hint_text for i in items)
