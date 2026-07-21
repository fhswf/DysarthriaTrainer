"""
SQLAlchemy model for Exercise.
"""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.persistence.sqla.models.base import Base


class ExerciseModel(Base):
    """
    Database model for exercises with versioning support.
    
    Represents a speech therapy exercise (e.g., "Für den Mund").
    """
    
    __tablename__ = "exercises"
    
    # Core fields
    category_id: Mapped[UUID] = mapped_column(
        ForeignKey("exercise_categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(255), nullable=True)
    scope: Mapped[str | None] = mapped_column(String(255), nullable=True)
    difficulty_level: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="beginner"
    )
    estimated_duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    
    # Versioning
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    superseded_by: Mapped[UUID | None] = mapped_column(
        ForeignKey("exercises.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Soft delete
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_by: Mapped[UUID | None] = mapped_column(String, nullable=True)
    
    # Timestamps and audit
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
    created_by: Mapped[UUID | None] = mapped_column(String, nullable=True)
    
    # Relationships
    category: Mapped["ExerciseCategoryModel"] = relationship(
        "ExerciseCategoryModel",
        back_populates="exercises",
        foreign_keys=[category_id]
    )
    
    instructions: Mapped[list["ExerciseInstructionsModel"]] = relationship(
        "ExerciseInstructionsModel",
        back_populates="exercise",
        cascade="all, delete-orphan",
        foreign_keys="[ExerciseInstructionsModel.exercise_id]",
        order_by="ExerciseInstructionsModel.display_order"
    )
    
    items: Mapped[list["ExerciseItemModel"]] = relationship(
        "ExerciseItemModel",
        back_populates="exercise",
        cascade="all, delete-orphan",
        order_by="ExerciseItemModel.display_order",
        foreign_keys="[ExerciseItemModel.exercise_id]"
    )
    
    practice_sessions: Mapped[list["PracticeSessionModel"]] = relationship(
        "PracticeSessionModel",
        back_populates="exercise",
        cascade="all, delete-orphan"
    )
    
    # Self-referential relationship for versioning
    superseded_version: Mapped["ExerciseModel | None"] = relationship(
        "ExerciseModel",
        remote_side="ExerciseModel.id",
        foreign_keys=[superseded_by]
    )
    
    # Table constraints
    __table_args__ = (
        CheckConstraint(
            "difficulty_level IN ('beginner', 'intermediate', 'advanced')",
            name="exercises_difficulty_check"
        ),
    )
    
    def __repr__(self) -> str:
        return f"<ExerciseModel(id={self.id!r}, code={self.code!r}, title={self.title!r}, version={self.version})>"
