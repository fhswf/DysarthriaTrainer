"""
Media File domain entity.
"""

from datetime import datetime
from uuid import UUID

from src.core.entities.base import Entity
from src.core.enums.exercise_enums import MediaFileType


class MediaFile(Entity):
    """
    Represents a media file (image, audio, video) used in exercises.
    
    Provides centralized file management with metadata tracking.
    """
    
    file_type: MediaFileType
    mime_type: str
    original_filename: str
    storage_path: str
    cdn_url: str | None = None
    thumbnail_url: str | None = None
    
    file_size_bytes: int
    duration_seconds: int | None = None  # For audio/video
    width: int | None = None  # For images/videos
    height: int | None = None  # For images/videos
    
    metadata: dict | None = None  # JSONB for additional metadata (codec, bitrate, etc.)
    
    # Timestamps and audit
    created_at: datetime
    created_by: UUID | None = None
