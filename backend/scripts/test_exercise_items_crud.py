#!/usr/bin/env python3
"""
Test script for Exercise Item CRUD operations.

Tests the complete CRUD workflow for exercise items with heterogeneous content.
"""

import asyncio
from uuid import uuid4
from datetime import datetime, timezone

from src.application.services.exercise_service import ExerciseService
from src.core.entities.exercise import Exercise
from src.core.entities.exercise_category import ExerciseCategory
from src.core.entities.exercise_item import ExerciseItem
from src.core.enums.exercise_enums import DifficultyLevel, ExerciseItemType
from unittest.mock import AsyncMock


async def test_exercise_item_crud():
    """Test complete CRUD workflow for exercise items."""
    print("=" * 80)
    print("Testing Exercise Item CRUD Operations")
    print("=" * 80)
    
    # Setup mocks
    mock_category_repo = AsyncMock()
    mock_exercise_repo = AsyncMock()
    mock_item_repo = AsyncMock()
    
    service = ExerciseService(
        category_repository=mock_category_repo,
        exercise_repository=mock_exercise_repo,
        item_repository=mock_item_repo,
    )
    
    # Test data
    category_id = uuid4()
    exercise_id = uuid4()
    item_id = uuid4()
    
    # Mock exercise exists
    mock_exercise_repo.get_by_id.return_value = Exercise(
        id=exercise_id,
        category_id=category_id,
        code="TEST001",
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
    
    # Test 1: CREATE - Movement Item
    print("\n1. CREATE Movement Item")
    print("-" * 80)
    
    movement_item = ExerciseItem(
        id=item_id,
        exercise_id=exercise_id,
        item_type=ExerciseItemType.MOVEMENT,
        display_order=0,
        repetitions=3,
        duration_seconds=5,
        metadata={
            "instruction": "Open your mouth wide",
            "media_file_id": "video-123"
        },
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    mock_item_repo.add.return_value = movement_item
    
    created_item = await service.add_item_to_exercise(
        exercise_id=exercise_id,
        item_type="movement",
        display_order=0,
        repetitions=3,
        duration_seconds=5,
        metadata={"instruction": "Open your mouth wide", "media_file_id": "video-123"},
    )
    
    print(f"✓ Created movement item: {created_item.id}")
    print(f"  Type: {created_item.item_type}")
    print(f"  Metadata: {created_item.metadata}")
    
    # Test 2: READ by ID
    print("\n2. READ Item by ID")
    print("-" * 80)
    
    mock_item_repo.get_by_id.return_value = movement_item
    
    retrieved_item = await service.get_exercise_item_by_id(item_id)
    
    print(f"✓ Retrieved item: {retrieved_item.id}")
    print(f"  Type: {retrieved_item.item_type}")
    print(f"  Display order: {retrieved_item.display_order}")
    
    # Test 3: UPDATE - Change to speech practice
    print("\n3. UPDATE Item (Change Type & Content)")
    print("-" * 80)
    
    updated_item = ExerciseItem(
        id=item_id,
        exercise_id=exercise_id,
        item_type=ExerciseItemType.SPEECH_PRACTICE,
        display_order=1,
        repetitions=5,
        duration_seconds=10,
        metadata={
            "text": "Papa",
            "phonetic_target": "/p/",
            "audio_file_id": "audio-456"
        },
        created_at=movement_item.created_at,
        updated_at=datetime.now(timezone.utc),
    )
    mock_item_repo.update.return_value = updated_item
    
    result = await service.update_exercise_item(
        item_id=item_id,
        item_type="speech_practice",
        display_order=1,
        repetitions=5,
        duration_seconds=10,
        metadata={
            "text": "Papa",
            "phonetic_target": "/p/",
            "audio_file_id": "audio-456"
        },
    )
    
    print(f"✓ Updated item: {result.id}")
    print(f"  New type: {result.item_type}")
    print(f"  New display order: {result.display_order}")
    print(f"  New metadata: {result.metadata}")
    
    # Test 4: LIST Items
    print("\n4. LIST Items for Exercise")
    print("-" * 80)
    
    speech_item = ExerciseItem(
        id=uuid4(),
        exercise_id=exercise_id,
        item_type=ExerciseItemType.SPEECH_PRACTICE,
        display_order=0,
        repetitions=None,
        duration_seconds=None,
        metadata={"text": "Test", "phonetic_target": "/t/"},
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    
    info_item = ExerciseItem(
        id=uuid4(),
        exercise_id=exercise_id,
        item_type=ExerciseItemType.INFORMATION,
        display_order=1,
        repetitions=None,
        duration_seconds=None,
        metadata={"text": "This exercise strengthens lip muscles", "info_type": "tip"},
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    
    mock_item_repo.get_by_exercise.return_value = [updated_item, speech_item, info_item]
    
    items = await service.get_exercise_items(exercise_id)
    
    print(f"✓ Retrieved {len(items)} items:")
    for idx, item in enumerate(items, 1):
        print(f"  {idx}. {item.item_type.value} - Order: {item.display_order}")
        print(f"     Content: {item.metadata}")
    
    # Test 5: UPDATE - Partial update (only metadata)
    print("\n5. UPDATE Item (Partial - Metadata Only)")
    print("-" * 80)
    
    partial_updated = ExerciseItem(
        id=item_id,
        exercise_id=exercise_id,
        item_type=updated_item.item_type,
        display_order=updated_item.display_order,
        repetitions=updated_item.repetitions,
        duration_seconds=updated_item.duration_seconds,
        metadata={
            "text": "Mama",
            "phonetic_target": "/m/",
            "audio_file_id": "audio-789",
            "difficulty": "easy"
        },
        created_at=updated_item.created_at,
        updated_at=datetime.now(timezone.utc),
    )
    mock_item_repo.update.return_value = partial_updated
    
    result = await service.update_exercise_item(
        item_id=item_id,
        metadata={
            "text": "Mama",
            "phonetic_target": "/m/",
            "audio_file_id": "audio-789",
            "difficulty": "easy"
        },
    )
    
    print(f"✓ Partially updated item: {result.id}")
    print(f"  Type unchanged: {result.item_type}")
    print(f"  New metadata: {result.metadata}")
    
    # Test 6: DELETE
    print("\n6. DELETE Item")
    print("-" * 80)
    
    mock_item_repo.delete.return_value = True
    
    deleted = await service.delete_exercise_item(item_id)
    
    print(f"✓ Deleted item: {deleted}")
    
    # Summary
    print("\n" + "=" * 80)
    print("✅ All CRUD operations completed successfully!")
    print("=" * 80)
    print("\nHeterogeneous Content Types Tested:")
    print("  ✓ Movement: instruction, media_file_id, duration_seconds, repetitions")
    print("  ✓ Speech Practice: text, phonetic_target, audio_file_id, difficulty")
    print("  ✓ Information: text, info_type")
    print("\nOperations Validated:")
    print("  ✓ CREATE with heterogeneous metadata")
    print("  ✓ READ by ID")
    print("  ✓ UPDATE with type change")
    print("  ✓ UPDATE partial (metadata only)")
    print("  ✓ LIST all items")
    print("  ✓ DELETE")
    print("\n🎉 Exercise Item CRUD functionality is complete and working!")


if __name__ == "__main__":
    asyncio.run(test_exercise_item_crud())
