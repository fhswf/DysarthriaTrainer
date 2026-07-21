"""
SQLAlchemy model for MediaFile.
"""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import BigInteger, CheckConstraint, DateTime, Integer, String, JSON
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.persistence.sqla.models.base import Base


class MediaFileModel(Base):
    """
    Database model for media files (images, audio, video).
    
    Provides centralized file management with metadata tracking.
    """
    
    __tablename__ = "media_files"
    
    # Core fields
    file_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(512), nullable=False)
    cdn_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    
    # File metadata
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)  # For audio/video
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)  # For images/videos
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)  # For images/videos
    file_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    # Timestamps and audit
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    created_by: Mapped[UUID | None] = mapped_column(String, nullable=True, index=True)
    
    # Table constraints
    __table_args__ = (
        CheckConstraint(
            "file_type IN ('image', 'audio', 'video')",
            name="media_files_type_check"
        ),
    )
    
    def __repr__(self) -> str:
        return f"<MediaFileModel(id={self.id!r}, type={self.file_type!r}, filename={self.original_filename!r})>"
