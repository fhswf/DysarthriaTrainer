"""
Unit tests for Practice Session entity
"""

import pytest
from datetime import datetime, timezone
from uuid import uuid4

from src.core.entities.practice_session import (
    PracticeSession,
    SessionStatus
)


def test_create_practice_session():
    """Test creating a practice session."""
    user_id = uuid4()
    exercise_id = uuid4()
    
    session = PracticeSession(
        user_id=user_id,
        exercise_id=exercise_id,
        total_items=5
    )
    
    assert session.id is not None
    assert session.user_id == user_id
    assert session.exercise_id == exercise_id
    assert session.status == SessionStatus.IN_PROGRESS
    assert session.total_items == 5
    assert session.completed_items == 0
    assert session.started_at is not None
    assert session.completed_at is None


def test_start_recording():
    """Test starting recording."""
    session = PracticeSession(
        user_id=uuid4(),
        exercise_id=uuid4()
    )
    
    session.start_recording()
    
    assert session.recording_started_at is not None


def test_cannot_start_recording_twice():
    """Test that recording cannot be started twice."""
    session = PracticeSession(
        user_id=uuid4(),
        exercise_id=uuid4()
    )
    
    session.start_recording()
    
    with pytest.raises(ValueError, match="already been started"):
        session.start_recording()


def test_complete_session():
    """Test completing a session."""
    audio_file_id = uuid4()
    session = PracticeSession(
        user_id=uuid4(),
        exercise_id=uuid4(),
        total_items=3
    )
    
    session.complete(
        audio_file_id=audio_file_id,
        recording_duration_ms=120000
    )
    
    assert session.status == SessionStatus.COMPLETED
    assert session.completed_at is not None
    assert session.session_audio_file_id == audio_file_id
    assert session.recording_duration_ms == 120000


def test_cannot_complete_twice():
    """Test that a session cannot be completed twice."""
    session = PracticeSession(
        user_id=uuid4(),
        exercise_id=uuid4()
    )
    
    session.complete()
    
    with pytest.raises(ValueError, match="non-active session"):
        session.complete()


def test_abandon_session():
    """Test abandoning a session."""
    session = PracticeSession(
        user_id=uuid4(),
        exercise_id=uuid4()
    )
    
    session.abandon()
    
    assert session.status == SessionStatus.ABANDONED
    assert session.completed_at is not None


def test_cannot_abandon_completed_session():
    """Test that completed session cannot be abandoned."""
    session = PracticeSession(
        user_id=uuid4(),
        exercise_id=uuid4()
    )
    
    session.complete()
    
    with pytest.raises(ValueError, match="non-active session"):
        session.abandon()


def test_increment_completed_items():
    """Test incrementing completed items."""
    session = PracticeSession(
        user_id=uuid4(),
        exercise_id=uuid4(),
        total_items=5
    )
    
    assert session.completed_items == 0
    
    session.increment_completed_items()
    assert session.completed_items == 1
    
    session.increment_completed_items()
    assert session.completed_items == 2


def test_cannot_exceed_total_items():
    """Test that completed_items cannot exceed total_items."""
    session = PracticeSession(
        user_id=uuid4(),
        exercise_id=uuid4(),
        total_items=2
    )
    
    session.increment_completed_items()
    session.increment_completed_items()
    
    with pytest.raises(ValueError, match="beyond total_items"):
        session.increment_completed_items()


def test_attach_audio_file():
    """Test attaching audio file."""
    audio_file_id = uuid4()
    session = PracticeSession(
        user_id=uuid4(),
        exercise_id=uuid4()
    )
    
    session.attach_audio_file(audio_file_id, 150000)
    
    assert session.session_audio_file_id == audio_file_id
    assert session.recording_duration_ms == 150000


def test_completion_percentage():
    """Test calculating completion percentage."""
    session = PracticeSession(
        user_id=uuid4(),
        exercise_id=uuid4(),
        total_items=10
    )
    
    assert session.get_completion_percentage() == 0.0
    
    for _ in range(5):
        session.increment_completed_items()
    
    assert session.get_completion_percentage() == 50.0
    
    for _ in range(5):
        session.increment_completed_items()
    
    assert session.get_completion_percentage() == 100.0


def test_completion_percentage_with_zero_items():
    """Test completion percentage with zero items."""
    session = PracticeSession(
        user_id=uuid4(),
        exercise_id=uuid4(),
        total_items=0
    )
    
    assert session.get_completion_percentage() == 0.0


def test_status_checks():
    """Test status check methods."""
    session = PracticeSession(
        user_id=uuid4(),
        exercise_id=uuid4()
    )
    
    assert session.is_in_progress() is True
    assert session.is_completed() is False
    assert session.is_abandoned() is False
    
    session.complete()
    
    assert session.is_in_progress() is False
    assert session.is_completed() is True
    assert session.is_abandoned() is False


def test_has_recording():
    """Test has_recording method."""
    session = PracticeSession(
        user_id=uuid4(),
        exercise_id=uuid4()
    )
    
    assert session.has_recording() is False
    
    session.attach_audio_file(uuid4(), 100000)
    
    assert session.has_recording() is True


def test_validation_negative_total_items():
    """Test validation rejects negative total_items."""
    with pytest.raises(ValueError, match="total_items cannot be negative"):
        PracticeSession(
            user_id=uuid4(),
            exercise_id=uuid4(),
            total_items=-1
        )


def test_validation_negative_completed_items():
    """Test validation rejects negative completed_items."""
    with pytest.raises(ValueError, match="completed_items cannot be negative"):
        PracticeSession(
            user_id=uuid4(),
            exercise_id=uuid4(),
            completed_items=-1
        )


def test_validation_completed_exceeds_total():
    """Test validation rejects completed_items > total_items."""
    with pytest.raises(ValueError, match="cannot exceed total_items"):
        PracticeSession(
            user_id=uuid4(),
            exercise_id=uuid4(),
            total_items=5,
            completed_items=10
        )


def test_validation_negative_recording_duration():
    """Test validation rejects negative recording_duration_ms."""
    session = PracticeSession(
        user_id=uuid4(),
        exercise_id=uuid4()
    )
    
    with pytest.raises(ValueError, match="recording_duration_ms cannot be negative"):
        session.complete(recording_duration_ms=-1000)


def test_updated_at_changes():
    """Test that updated_at timestamp changes on modifications."""
    session = PracticeSession(
        user_id=uuid4(),
        exercise_id=uuid4(),
        total_items=5
    )
    
    original_updated_at = session.updated_at
    
    # Small delay to ensure timestamp difference
    import time
    time.sleep(0.01)
    
    session.increment_completed_items()
    
    assert session.updated_at > original_updated_at
