"""
SQLAlchemy model for ExerciseItem.
"""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.persistence.sqla.models.base import Base


class ExerciseItemModel(Base):
    """
    Database model for individual exercise items.
    
    Can represent movements, speech practice, or informational content.
    Items can either belong to an exercise (exercise_id set) or exist in the library (exercise_id null, is_library_item true).
    """
    
    __tablename__ = "exercise_items"
    
    # Core fields
    exercise_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"),
        nullable=True,  # Changed from False to support library items
        index=True
    )
    item_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_library_item: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    
    # Optional fields
    instruction_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("exercise_instructions.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    repetitions: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    item_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
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
    exercise: Mapped["ExerciseModel | None"] = relationship(
        "ExerciseModel",
        back_populates="items",
        foreign_keys=[exercise_id]
    )
    
    instruction: Mapped["ExerciseInstructionsModel | None"] = relationship(
        "ExerciseInstructionsModel",
        back_populates="items",
        foreign_keys=[instruction_id]
    )
    
    contents: Mapped[list["ExerciseItemContentModel"]] = relationship(
        "ExerciseItemContentModel",
        back_populates="item",
        cascade="all, delete-orphan",
        foreign_keys="[ExerciseItemContentModel.item_id]"
    )
    
    results: Mapped[list["ExerciseResultModel"]] = relationship(
        "ExerciseResultModel",
        back_populates="exercise_item",
        cascade="all, delete-orphan"
    )
    
    # Constraints
    __table_args__ = (
        # Library items must have exercise_id = NULL, non-library items must have exercise_id set
        CheckConstraint(
            "(is_library_item = true AND exercise_id IS NULL) OR (is_library_item = false AND exercise_id IS NOT NULL)",
            name="exercise_items_library_check"
        ),
        CheckConstraint(
            "item_type IN ('minimal_pair', 'word', 'sentence', 'breathing', 'vocalization', 'articulation', 'rhythm', 'intonation', 'movement', 'speech_practice', 'information')",
            name="exercise_items_type_check"
        ),
    )
    
    def __repr__(self) -> str:
        return f"<ExerciseItemModel(id={self.id!r}, exercise_id={self.exercise_id!r}, type={self.item_type!r})>"
