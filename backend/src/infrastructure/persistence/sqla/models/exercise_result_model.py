"""
SQLAlchemy model for Exercise Results
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import Column, String, Integer, Text, DECIMAL, ForeignKey, TIMESTAMP, Index, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.infrastructure.persistence.sqla.models.base import Base


class ExerciseResultModel(Base):
    """SQLAlchemy model for exercise_results table."""
    
    __tablename__ = "exercise_results"
    
    # Primary Key
    id = Column(PGUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    
    # Foreign Keys
    practice_session_id = Column(PGUUID(as_uuid=True), ForeignKey("practice_sessions.id", ondelete="CASCADE"), nullable=False)
    exercise_item_id = Column(PGUUID(as_uuid=True), ForeignKey("exercise_items.id", ondelete="CASCADE"), nullable=False)
    
    # Timestamps
    started_at = Column(TIMESTAMP(timezone=True), nullable=False)
    completed_at = Column(TIMESTAMP(timezone=True), nullable=False)
    
    # Iteration Support
    iteration_number = Column(Integer, nullable=False, default=1)
    
    # Calculated Fields
    duration_ms = Column(Integer, nullable=False, default=0)
    
    # Audio Segment Fields
    audio_file_id = Column(PGUUID(as_uuid=True), ForeignKey("media_files.id", ondelete="SET NULL"))
    audio_segment_start_ms = Column(Integer)
    audio_segment_end_ms = Column(Integer)
    audio_duration_ms = Column(Integer)
    
    # Analysis Fields
    transcription = Column(Text)
    transcription_confidence = Column(DECIMAL(5, 4))
    phoneme_analysis = Column(JSONB)
    audio_quality_metrics = Column(JSONB)
    analysis_parameters = Column(JSONB, default={})
    evaluation_results = Column(JSONB, default={})
    
    # Processing
    processing_status = Column(String(20), nullable=False, default="pending")
    processing_error = Column(Text)
    
    # Audit
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    session = relationship("PracticeSessionModel", back_populates="results", foreign_keys=[practice_session_id])
    exercise_item = relationship("ExerciseItemModel", back_populates="results", foreign_keys=[exercise_item_id])
    audio_file = relationship("MediaFileModel", foreign_keys=[audio_file_id])
    
    # Indexes
    __table_args__ = (
        Index('idx_exercise_results_session_id', 'practice_session_id'),
        Index('idx_exercise_results_item_id', 'exercise_item_id'),
        Index('idx_exercise_results_status', 'processing_status'),
        Index('idx_exercise_results_started_at', 'started_at'),
        Index('idx_exercise_results_session_item', 'practice_session_id', 'exercise_item_id'),
        Index('idx_exercise_results_session_iteration', 'practice_session_id', 'exercise_item_id', 'iteration_number'),
        # JSONB Indexes for query performance
        Index('idx_exercise_results_evaluation_scores', 'evaluation_results', postgresql_using='gin'),
        CheckConstraint(
            "processing_status IN ('pending', 'processing', 'completed', 'failed')",
            name='chk_exercise_results_status'
        ),
        CheckConstraint(
            "iteration_number >= 1",
            name='chk_exercise_results_iteration'
        ),
        CheckConstraint(
            "transcription_confidence IS NULL OR (transcription_confidence >= 0 AND transcription_confidence <= 1)",
            name='chk_exercise_results_confidence'
        ),
        CheckConstraint(
            "duration_ms >= 0",
            name='chk_exercise_results_duration'
        ),
        CheckConstraint(
            "audio_segment_start_ms IS NULL OR audio_segment_start_ms >= 0",
            name='chk_exercise_results_audio_start'
        ),
        CheckConstraint(
            "audio_segment_end_ms IS NULL OR audio_segment_end_ms >= 0",
            name='chk_exercise_results_audio_end'
        ),
        CheckConstraint(
            "(audio_segment_start_ms IS NULL AND audio_segment_end_ms IS NULL) OR "
            "(audio_segment_start_ms IS NOT NULL AND audio_segment_end_ms IS NOT NULL AND audio_segment_end_ms > audio_segment_start_ms)",
            name='chk_exercise_results_audio_segments'
        ),
    )
    
    def __repr__(self) -> str:
        return f"<ExerciseResultModel(id={self.id}, session_id={self.practice_session_id}, status={self.processing_status})>"
