"""
Practice Session Entity

Core domain entity representing an exercise practice session with continuous
audio recording support.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4


class SessionStatus(Enum):
    """Session status enumeration."""
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


@dataclass
class PracticeSession:
    """
    Core entity representing an exercise practice session.
    
    A practice session tracks a user's progression through an exercise,
    supporting continuous audio recording of the entire session.
    
    Attributes:
        id: Unique session identifier
        user_id: ID of the user performing the exercise
        exercise_id: ID of the exercise being practiced
        started_at: When the session began
        completed_at: When the session was completed (if applicable)
        status: Current status (in_progress, completed, abandoned)
        total_items: Total number of items in the exercise
        completed_items: Number of items completed so far
        session_audio_file_id: ID of the continuous recording audio file
        recording_started_at: When recording started
        recording_duration_ms: Total recording duration in milliseconds
        metadata: Additional session metadata (device info, app version, etc.)
        created_at: Entity creation timestamp
        updated_at: Entity last update timestamp
    """
    
    # Required fields
    user_id: UUID
    exercise_id: UUID
    
    # Auto-generated fields
    id: UUID = field(default_factory=uuid4)
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Status fields
    status: SessionStatus = SessionStatus.IN_PROGRESS
    completed_at: Optional[datetime] = None
    
    # Item tracking
    total_items: int = 0
    completed_items: int = 0
    
    # Recording fields
    session_audio_file_id: Optional[UUID] = None
    recording_started_at: Optional[datetime] = None
    recording_duration_ms: Optional[int] = None
    
    # Metadata
    metadata: dict = field(default_factory=dict)
    
    def __post_init__(self):
        """Validate entity after initialization."""
        self._validate()
    
    def _validate(self) -> None:
        """Validate entity invariants."""
        if self.total_items < 0:
            raise ValueError("total_items cannot be negative")
        
        if self.completed_items < 0:
            raise ValueError("completed_items cannot be negative")
        
        if self.completed_items > self.total_items:
            raise ValueError("completed_items cannot exceed total_items")
        
        if self.recording_duration_ms is not None and self.recording_duration_ms < 0:
            raise ValueError("recording_duration_ms cannot be negative")
    
    # Domain Methods
    
    def start_recording(self, timestamp: Optional[datetime] = None) -> None:
        """
        Mark recording as started.
        
        Args:
            timestamp: Recording start timestamp (defaults to now)
            
        Raises:
            ValueError: If session is not in progress or recording already started
        """
        if not self.is_in_progress():
            raise ValueError("Cannot start recording on a non-active session")
        
        if self.recording_started_at is not None:
            raise ValueError("Recording has already been started")
        
        self.recording_started_at = timestamp or datetime.now(timezone.utc)
        self._touch()
    
    def complete(self,
                 audio_file_id: Optional[UUID] = None,
                 recording_duration_ms: Optional[int] = None) -> None:
        """
        Mark session as completed.
        
        Args:
            audio_file_id: ID of the final audio file
            recording_duration_ms: Total recording duration in milliseconds
            
        Raises:
            ValueError: If session is not in progress or already completed
        """
        if not self.is_in_progress():
            raise ValueError("Cannot complete a non-active session")
        
        self.status = SessionStatus.COMPLETED
        self.completed_at = datetime.now(timezone.utc)
        
        if audio_file_id is not None:
            self.session_audio_file_id = audio_file_id
        
        if recording_duration_ms is not None:
            if recording_duration_ms < 0:
                raise ValueError("recording_duration_ms cannot be negative")
            self.recording_duration_ms = recording_duration_ms
        
        self._touch()
    
    def abandon(self) -> None:
        """Mark session as abandoned."""
        if not self.is_in_progress():
            raise ValueError("Cannot abandon a non-active session")
        
        self.status = SessionStatus.ABANDONED
        self.completed_at = datetime.now(timezone.utc)
        self._touch()
    
    def increment_completed_items(self) -> None:
        """Increment the count of completed items."""
        if self.completed_items >= self.total_items:
            raise ValueError("Cannot increment beyond total_items")
        
        self.completed_items += 1
        self._touch()
    
    def attach_audio_file(self, audio_file_id: UUID, duration_ms: int) -> None:
        """
        Attach the session's audio file.
        
        Args:
            audio_file_id: ID of the audio file
            duration_ms: Duration in milliseconds
            
        Raises:
            ValueError: If duration is negative
        """
        if duration_ms < 0:
            raise ValueError("duration_ms cannot be negative")
        
        self.session_audio_file_id = audio_file_id
        self.recording_duration_ms = duration_ms
        self._touch()
    
    def is_in_progress(self) -> bool:
        """Check if session is currently active."""
        return self.status == SessionStatus.IN_PROGRESS
    
    def is_completed(self) -> bool:
        """Check if session is completed."""
        return self.status == SessionStatus.COMPLETED
    
    def is_abandoned(self) -> bool:
        """Check if session was abandoned."""
        return self.status == SessionStatus.ABANDONED
    
    def has_recording(self) -> bool:
        """Check if session has an audio recording."""
        return self.session_audio_file_id is not None
    
    def get_completion_percentage(self) -> float:
        """Calculate session completion percentage."""
        if self.total_items == 0:
            return 0.0
        return (self.completed_items / self.total_items) * 100
    
    def _touch(self) -> None:
        """Update the updated_at timestamp."""
        self.updated_at = datetime.now(timezone.utc)
