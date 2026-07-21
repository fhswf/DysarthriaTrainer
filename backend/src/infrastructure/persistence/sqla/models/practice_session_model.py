"""
SQLAlchemy model for Practice Sessions
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import Column, String, Integer, ForeignKey, TIMESTAMP, Index, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.infrastructure.persistence.sqla.models.base import Base


class PracticeSessionModel(Base):
    """SQLAlchemy model for practice_sessions table."""
    
    __tablename__ = "practice_sessions"
    
    # Primary Key
    id = Column(PGUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    
    # Foreign Keys
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(PGUUID(as_uuid=True), ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)
    
    # Session Timestamps
    started_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    completed_at = Column(TIMESTAMP(timezone=True))
    
    # Status
    status = Column(String(20), nullable=False, default="in_progress")
    
    # Item Tracking
    total_items = Column(Integer, nullable=False, default=0)
    completed_items = Column(Integer, nullable=False, default=0)
    
    # Recording Fields
    session_audio_file_id = Column(PGUUID(as_uuid=True), ForeignKey("media_files.id", ondelete="SET NULL"))
    recording_started_at = Column(TIMESTAMP(timezone=True))
    recording_duration_ms = Column(Integer)
    
    # Session Metadata (stored as JSONB)
    session_metadata = Column(JSONB, default={})
    
    # Audit
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="practice_sessions", foreign_keys=[user_id])
    exercise = relationship("ExerciseModel", back_populates="practice_sessions", foreign_keys=[exercise_id])
    results = relationship("ExerciseResultModel", back_populates="session", cascade="all, delete-orphan")
    session_audio = relationship("MediaFileModel", foreign_keys=[session_audio_file_id])
    
    # Indexes
    __table_args__ = (
        Index('idx_practice_sessions_user_id', 'user_id'),
        Index('idx_practice_sessions_exercise_id', 'exercise_id'),
        Index('idx_practice_sessions_started_at', 'started_at'),
        Index('idx_practice_sessions_status', 'status'),
        Index('idx_practice_sessions_user_status', 'user_id', 'status'),
        CheckConstraint(
            "status IN ('in_progress', 'completed', 'abandoned')",
            name='chk_practice_sessions_status'
        ),
        CheckConstraint(
            "completed_items >= 0 AND completed_items <= total_items",
            name='chk_practice_sessions_completed_items'
        ),
    )
    
    def __repr__(self) -> str:
        return f"<PracticeSessionModel(id={self.id}, user_id={self.user_id}, status={self.status})>"
