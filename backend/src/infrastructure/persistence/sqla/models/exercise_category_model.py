"""
SQLAlchemy model for ExerciseCategory.
"""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.persistence.sqla.models.base import Base


class ExerciseCategoryModel(Base):
    """
    Database model for exercise categories.
    
    Represents hierarchical organization of exercises (e.g., "Gymnastik Sprechwerkzeuge").
    """
    
    __tablename__ = "exercise_categories"
    
    # Core fields
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    
    # Soft delete
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_by: Mapped[UUID | None] = mapped_column(String, nullable=True)
    
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
    exercises: Mapped[list["ExerciseModel"]] = relationship(
        "ExerciseModel",
        back_populates="category",
        cascade="all, delete-orphan",
        foreign_keys="[ExerciseModel.category_id]"
    )
    
    def __repr__(self) -> str:
        return f"<ExerciseCategoryModel(id={self.id!r}, name={self.name!r}, slug={self.slug!r})>"
