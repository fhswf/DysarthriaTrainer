"""
SQLAlchemy model for ExerciseInstructions.
"""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.persistence.sqla.models.base import Base


class ExerciseInstructionsModel(Base):
    """
    Database model for language-specific exercise instructions.
    
    Contains hints, explanations, safety notes, and optional media.
    """
    
    __tablename__ = "exercise_instructions"
    
    # Core fields
    exercise_id: Mapped[UUID] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="de", index=True)
    
    # Content fields
    hint_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    explanation_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    safety_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    audio_instruction_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    
    # Ordering
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    
    # Relationships
    exercise: Mapped["ExerciseModel"] = relationship(
        "ExerciseModel",
        back_populates="instructions",
        foreign_keys=[exercise_id]
    )
    
    items: Mapped[list["ExerciseItemModel"]] = relationship(
        "ExerciseItemModel",
        back_populates="instruction",
        foreign_keys="[ExerciseItemModel.instruction_id]"
    )
    
    # Table constraints - one instruction per language per exercise
    __table_args__ = (
        UniqueConstraint("exercise_id", "language", name="exercise_instructions_unique"),
    )
    
    def __repr__(self) -> str:
        return f"<ExerciseInstructionsModel(id={self.id!r}, exercise_id={self.exercise_id!r}, language={self.language!r}, display_order={self.display_order})>"
