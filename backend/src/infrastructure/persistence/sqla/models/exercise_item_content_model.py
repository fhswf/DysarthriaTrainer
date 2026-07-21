"""
SQLAlchemy model for ExerciseItemContent.
"""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.infrastructure.persistence.sqla.models.base import Base


class ExerciseItemContentModel(Base):
    """
    Database model for language-specific exercise item content.
    
    Polymorphic structure supporting movements, speech practice, and information.
    """
    
    __tablename__ = "exercise_item_contents"
    
    # Core fields
    item_id: Mapped[UUID] = mapped_column(
        ForeignKey("exercise_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="de", index=True)
    
    # Common field
    text_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Movement-specific fields
    demonstration_video_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    
    # Speech practice-specific fields
    phonetic_transcription: Mapped[str | None] = mapped_column(String(255), nullable=True)
    audio_example_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    difficulty: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Information-specific fields
    info_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
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
    item: Mapped["ExerciseItemModel"] = relationship(
        "ExerciseItemModel",
        back_populates="contents",
        foreign_keys=[item_id]
    )
    
    # Table constraints - one content per language per item
    __table_args__ = (
        UniqueConstraint("item_id", "language", name="exercise_item_contents_unique"),
    )
    
    def __repr__(self) -> str:
        return f"<ExerciseItemContentModel(id={self.id!r}, item_id={self.item_id!r}, language={self.language!r})>"
