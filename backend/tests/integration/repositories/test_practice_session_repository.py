"""
Integration tests for PracticeSessionRepository
"""

import pytest
from datetime import datetime, timezone
from uuid import uuid4

from src.core.entities.practice_session import PracticeSession, SessionStatus
from src.infrastructure.persistence.sqla.repositories.practice_session_repository import PracticeSessionRepository
from src.infrastructure.persistence.sqla.models.user import User
from src.infrastructure.persistence.sqla.models.exercise_model import ExerciseModel
from src.infrastructure.persistence.sqla.models.exercise_category_model import ExerciseCategoryModel


@pytest.mark.asyncio
class TestPracticeSessionRepository:
    """Integration tests for PracticeSessionRepository."""
    
    async def test_create_session(self, db_session, test_user, test_exercise):
        """Test creating a practice session."""
        # Arrange
        repo = PracticeSessionRepository(db_session)
        session = PracticeSession(
            id=uuid4(),
            user_id=test_user.id,
            exercise_id=test_exercise.id,
            started_at=datetime.now(timezone.utc),
            completed_at=None,
            status=SessionStatus.IN_PROGRESS,
            total_items=5,
            completed_items=0,
            session_audio_file_id=None,
            recording_started_at=None,
            recording_duration_ms=None,
            metadata={},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        # Act
        created = await repo.create(session)
        
        # Assert
        assert created.id == session.id
        assert created.user_id == test_user.id
        assert created.exercise_id == test_exercise.id
        assert created.status == SessionStatus.IN_PROGRESS
        assert created.total_items == 5
        assert created.completed_items == 0
    
    async def test_find_by_id(self, db_session, test_user, test_exercise):
        """Test finding session by ID."""
        # Arrange
        repo = PracticeSessionRepository(db_session)
        session = PracticeSession(
            id=uuid4(),
            user_id=test_user.id,
            exercise_id=test_exercise.id,
            started_at=datetime.now(timezone.utc),
            completed_at=None,
            status=SessionStatus.IN_PROGRESS,
            total_items=3,
            completed_items=0,
            session_audio_file_id=None,
            recording_started_at=None,
            recording_duration_ms=None,
            metadata={},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        await repo.create(session)
        
        # Act
        found = await repo.find_by_id(session.id)
        
        # Assert
        assert found is not None
        assert found.id == session.id
        assert found.user_id == test_user.id
        assert found.exercise_id == test_exercise.id
    
    async def test_find_by_id_not_found(self, db_session):
        """Test finding session with non-existent ID returns None."""
        # Arrange
        repo = PracticeSessionRepository(db_session)
        non_existent_id = uuid4()
        
        # Act
        found = await repo.find_by_id(non_existent_id)
        
        # Assert
        assert found is None
    
    async def test_update_session(self, db_session, test_user, test_exercise):
        """Test updating a practice session."""
        # Arrange
        repo = PracticeSessionRepository(db_session)
        session = PracticeSession(
            id=uuid4(),
            user_id=test_user.id,
            exercise_id=test_exercise.id,
            started_at=datetime.now(timezone.utc),
            completed_at=None,
            status=SessionStatus.IN_PROGRESS,
            total_items=5,
            completed_items=0,
            session_audio_file_id=None,
            recording_started_at=None,
            recording_duration_ms=None,
            metadata={},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        created = await repo.create(session)
        
        # Act
        created.completed_items = 3
        created.status = SessionStatus.COMPLETED
        created.completed_at = datetime.now(timezone.utc)
        updated = await repo.update(created)
        
        # Assert
        assert updated.completed_items == 3
        assert updated.status == SessionStatus.COMPLETED
        assert updated.completed_at is not None
    
    async def test_find_by_user(self, db_session, test_user, test_exercise):
        """Test finding sessions by user."""
        # Arrange
        repo = PracticeSessionRepository(db_session)
        
        # Create multiple sessions
        session1 = PracticeSession(
            id=uuid4(),
            user_id=test_user.id,
            exercise_id=test_exercise.id,
            started_at=datetime.now(timezone.utc),
            completed_at=None,
            status=SessionStatus.IN_PROGRESS,
            total_items=5,
            completed_items=2,
            session_audio_file_id=None,
            recording_started_at=None,
            recording_duration_ms=None,
            metadata={},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        session2 = PracticeSession(
            id=uuid4(),
            user_id=test_user.id,
            exercise_id=test_exercise.id,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            status=SessionStatus.COMPLETED,
            total_items=3,
            completed_items=3,
            session_audio_file_id=None,
            recording_started_at=None,
            recording_duration_ms=None,
            metadata={},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        await repo.create(session1)
        await repo.create(session2)
        
        # Act
        all_sessions = await repo.find_by_user(test_user.id)
        in_progress = await repo.find_by_user(test_user.id, status=SessionStatus.IN_PROGRESS)
        completed = await repo.find_by_user(test_user.id, status=SessionStatus.COMPLETED)
        
        # Assert
        assert len(all_sessions) == 2
        assert len(in_progress) == 1
        assert len(completed) == 1
        assert in_progress[0].status == SessionStatus.IN_PROGRESS
        assert completed[0].status == SessionStatus.COMPLETED
    
    async def test_find_by_exercise(self, db_session, test_user, test_exercise):
        """Test finding sessions by exercise."""
        # Arrange
        repo = PracticeSessionRepository(db_session)
        
        # Create sessions
        session1 = PracticeSession(
            id=uuid4(),
            user_id=test_user.id,
            exercise_id=test_exercise.id,
            started_at=datetime.now(timezone.utc),
            completed_at=None,
            status=SessionStatus.IN_PROGRESS,
            total_items=5,
            completed_items=0,
            session_audio_file_id=None,
            recording_started_at=None,
            recording_duration_ms=None,
            metadata={},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        await repo.create(session1)
        
        # Act
        sessions = await repo.find_by_exercise(test_exercise.id)
        
        # Assert
        assert len(sessions) >= 1
        assert sessions[0].exercise_id == test_exercise.id
    
    async def test_count_by_user(self, db_session, test_user, test_exercise):
        """Test counting sessions by user."""
        # Arrange
        repo = PracticeSessionRepository(db_session)
        
        # Create sessions with different statuses
        session1 = PracticeSession(
            id=uuid4(),
            user_id=test_user.id,
            exercise_id=test_exercise.id,
            started_at=datetime.now(timezone.utc),
            completed_at=None,
            status=SessionStatus.IN_PROGRESS,
            total_items=5,
            completed_items=0,
            session_audio_file_id=None,
            recording_started_at=None,
            recording_duration_ms=None,
            metadata={},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        session2 = PracticeSession(
            id=uuid4(),
            user_id=test_user.id,
            exercise_id=test_exercise.id,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            status=SessionStatus.COMPLETED,
            total_items=3,
            completed_items=3,
            session_audio_file_id=None,
            recording_started_at=None,
            recording_duration_ms=None,
            metadata={},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        await repo.create(session1)
        await repo.create(session2)
        
        # Act
        total_count = await repo.count_by_user(test_user.id)
        in_progress_count = await repo.count_by_user(test_user.id, status=SessionStatus.IN_PROGRESS)
        completed_count = await repo.count_by_user(test_user.id, status=SessionStatus.COMPLETED)
        
        # Assert
        assert total_count == 2
        assert in_progress_count == 1
        assert completed_count == 1
    
    async def test_delete_session(self, db_session, test_user, test_exercise):
        """Test deleting a practice session."""
        # Arrange
        repo = PracticeSessionRepository(db_session)
        session = PracticeSession(
            id=uuid4(),
            user_id=test_user.id,
            exercise_id=test_exercise.id,
            started_at=datetime.now(timezone.utc),
            completed_at=None,
            status=SessionStatus.IN_PROGRESS,
            total_items=5,
            completed_items=0,
            session_audio_file_id=None,
            recording_started_at=None,
            recording_duration_ms=None,
            metadata={},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        created = await repo.create(session)
        
        # Act
        deleted = await repo.delete(created.id)
        found = await repo.find_by_id(created.id)
        
        # Assert
        assert deleted is True
        assert found is None
    
    async def test_delete_non_existent_session(self, db_session):
        """Test deleting non-existent session returns False."""
        # Arrange
        repo = PracticeSessionRepository(db_session)
        non_existent_id = uuid4()
        
        # Act
        deleted = await repo.delete(non_existent_id)
        
        # Assert
        assert deleted is False
    
    async def test_pagination(self, db_session, test_user, test_exercise):
        """Test pagination in find_by_user."""
        # Arrange
        repo = PracticeSessionRepository(db_session)
        
        # Create 5 sessions
        for i in range(5):
            session = PracticeSession(
                id=uuid4(),
                user_id=test_user.id,
                exercise_id=test_exercise.id,
                started_at=datetime.now(timezone.utc),
                completed_at=None,
                status=SessionStatus.IN_PROGRESS,
                total_items=5,
                completed_items=i,
                session_audio_file_id=None,
                recording_started_at=None,
                recording_duration_ms=None,
                metadata={},
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            await repo.create(session)
        
        # Act
        page1 = await repo.find_by_user(test_user.id, limit=2, offset=0)
        page2 = await repo.find_by_user(test_user.id, limit=2, offset=2)
        
        # Assert
        assert len(page1) == 2
        assert len(page2) == 2
        assert page1[0].id != page2[0].id
