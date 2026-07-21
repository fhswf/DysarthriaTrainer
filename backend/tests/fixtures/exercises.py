"""
Exercise and practice session fixtures for testing.

Provides test data for exercises, exercise items, practice sessions, and related entities.
"""

import pytest_asyncio
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.persistence.sqla.models.exercise_model import ExerciseModel
from src.infrastructure.persistence.sqla.models.exercise_category_model import ExerciseCategoryModel
from src.infrastructure.persistence.sqla.models.exercise_item_model import ExerciseItemModel
from src.infrastructure.persistence.sqla.models.exercise_instructions_model import ExerciseInstructionsModel
from src.core.entities.practice_session import PracticeSession, SessionStatus
from src.infrastructure.persistence.sqla.repositories.practice_session_repository import PracticeSessionRepository


@pytest_asyncio.fixture
async def test_exercise_category(db_session: AsyncSession) -> ExerciseCategoryModel:
    """
    Create a test exercise category.
    
    Args:
        db_session: Database session with automatic rollback
    
    Returns:
        ExerciseCategoryModel: Created category instance
    """
    category = ExerciseCategoryModel(
        id=uuid4(),
        name="Test Category",
        slug="test-category",
        description="A test category for integration tests",
        icon_url=None,
        display_order=1,
        deleted_at=None,
        deleted_by=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    db_session.add(category)
    await db_session.flush()
    
    return category


@pytest_asyncio.fixture
async def test_exercise(
    db_session: AsyncSession,
    test_exercise_category: ExerciseCategoryModel
) -> ExerciseModel:
    """
    Create a test exercise.
    
    Creates a simple exercise with basic properties for testing.
    
    Args:
        db_session: Database session with automatic rollback
        test_exercise_category: Exercise category
    
    Returns:
        ExerciseModel: Created exercise instance
    """
    exercise = ExerciseModel(
        id=uuid4(),
        category_id=test_exercise_category.id,
        code="TEST001",
        title="Test Exercise",
        subtitle="Test subtitle",
        scope=None,
        difficulty_level="beginner",
        estimated_duration_minutes=10,
        display_order=1,
        version=1,
        is_active=True,
        superseded_by=None,
        deleted_at=None,
        deleted_by=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        created_by=None
    )
    
    db_session.add(exercise)
    await db_session.flush()
    
    return exercise


@pytest_asyncio.fixture
async def test_exercise_item(
    db_session: AsyncSession,
    test_exercise: ExerciseModel
) -> ExerciseItemModel:
    """
    Create a test exercise item.
    
    Creates an exercise item associated with the test exercise.
    
    Args:
        db_session: Database session with automatic rollback
        test_exercise: Parent exercise
    
    Returns:
        ExerciseItemModel: Created exercise item instance
    """
    item = ExerciseItemModel(
        id=uuid4(),
        exercise_id=test_exercise.id,
        item_type="speech_practice",
        display_order=1,
        repetitions=3,
        duration_seconds=5,
        item_metadata={
            "test": True,
            "language": "German"
        },
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    db_session.add(item)
    await db_session.flush()
    
    return item


@pytest_asyncio.fixture
async def test_user(test_users: dict):
    """
    Extract a single test user from test_users dict.
    
    Args:
        test_users: Test users fixture dict
    
    Returns:
        User: Regular test user
    """
    return test_users["user"]


@pytest_asyncio.fixture
async def test_practice_session(
    db_session: AsyncSession,
    test_users: dict,
    test_exercise: ExerciseModel
) -> PracticeSession:
    """
    Create a test practice session.
    
    Creates a practice session in IN_PROGRESS status for testing.
    
    Args:
        db_session: Database session with automatic rollback
        test_users: Test users fixture
        test_exercise: Test exercise
    
    Returns:
        PracticeSession: Created practice session entity
    """
    repo = PracticeSessionRepository(db_session)
    
    session = PracticeSession(
        id=uuid4(),
        user_id=test_users["user"].id,
        exercise_id=test_exercise.id,
        status=SessionStatus.IN_PROGRESS,
        started_at=datetime.now(timezone.utc),
        completed_at=None,
        total_items=1,
        completed_items=0,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    created_session = await repo.create(session)
    return created_session


@pytest_asyncio.fixture
async def completed_practice_session(
    db_session: AsyncSession,
    test_users: dict,
    test_exercise: ExerciseModel
) -> PracticeSession:
    """
    Create a completed practice session.
    
    Creates a practice session in COMPLETED status for testing.
    
    Args:
        db_session: Database session with automatic rollback
        test_users: Test users fixture
        test_exercise: Test exercise
    
    Returns:
        PracticeSession: Created completed practice session entity
    """
    repo = PracticeSessionRepository(db_session)
    
    session = PracticeSession(
        id=uuid4(),
        user_id=test_users["user"].id,
        exercise_id=test_exercise.id,
        status=SessionStatus.COMPLETED,
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
        total_items=1,
        completed_items=1,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    created_session = await repo.create(session)
    return created_session


@pytest_asyncio.fixture
async def multiple_exercises(
    db_session: AsyncSession,
    test_exercise_category: ExerciseCategoryModel
) -> list[ExerciseModel]:
    """
    Create multiple test exercises with different properties.
    
    Useful for testing queries, filtering, and pagination.
    
    Args:
        db_session: Database session with automatic rollback
        test_exercise_category: Exercise category
    
    Returns:
        list[ExerciseModel]: List of created exercises
    """
    exercises = []
    
    for i in range(5):
        exercise = ExerciseModel(
            id=uuid4(),
            category_id=test_exercise_category.id,
            code=f"TEST{i+100:03d}",
            title=f"Test Exercise {i + 1}",
            subtitle=f"Subtitle {i + 1}",
            scope=None,
            difficulty_level=["beginner", "intermediate", "advanced"][i % 3],
            estimated_duration_minutes=10 + (i * 5),
            display_order=i + 1,
            version=1,
            is_active=True,
            superseded_by=None,
            deleted_at=None,
            deleted_by=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            created_by=None
        )
        db_session.add(exercise)
        exercises.append(exercise)
    
    await db_session.flush()
    return exercises


@pytest_asyncio.fixture
async def multiple_exercise_items(
    db_session: AsyncSession,
    test_exercise: ExerciseModel
) -> list[ExerciseItemModel]:
    """
    Create multiple exercise items for a single exercise.
    
    Useful for testing ordering, filtering, and batch operations.
    
    Args:
        db_session: Database session with automatic rollback
        test_exercise: Parent exercise
    
    Returns:
        list[ExerciseItemModel]: List of created exercise items
    """
    items = []
    
    for i in range(5):
        item = ExerciseItemModel(
            id=uuid4(),
            exercise_id=test_exercise.id,
            item_type="speech_practice",
            display_order=i + 1,
            repetitions=3 + i,
            duration_seconds=5 + i,
            item_metadata={"index": i, "test": True},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db_session.add(item)
        items.append(item)
    
    await db_session.flush()
    return items

@pytest_asyncio.fixture
async def test_instruction(
    db_session: AsyncSession,
    test_exercise: ExerciseModel
) -> ExerciseInstructionsModel:
    """
    Create a test exercise instruction.
    
    Creates an instruction associated with the test exercise.
    
    Args:
        db_session: Database session with automatic rollback
        test_exercise: Parent exercise
    
    Returns:
        ExerciseInstructionsModel: Created instruction instance
    """
    instruction = ExerciseInstructionsModel(
        id=uuid4(),
        exercise_id=test_exercise.id,
        language="de",
        hint_text="This is a test hint for testing instruction_id functionality",
        explanation_text="This is a detailed explanation of the instruction",
        safety_notes="Be careful when following these instructions",
        audio_instruction_url=None,
        image_url=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    
    db_session.add(instruction)
    await db_session.flush()
    
    return instruction