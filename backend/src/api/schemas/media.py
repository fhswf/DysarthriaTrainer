"""
Pydantic schemas for media file API requests and responses.

These schemas define the data transfer objects (DTOs) for media file uploads,
downloads, search operations, and analytics.
"""

from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_validator,
)


# ============================================================================
# Media File Upload Schemas
# ============================================================================


class MediaFileUpload(BaseModel):
    """Request schema for media file upload metadata."""

    file_type: Annotated[
        str, StringConstraints(pattern=r"^(image|audio|video)$")
    ] = Field(..., description="Type of media file")
    mime_type: Annotated[str, StringConstraints(min_length=1, max_length=100)]
    file_size: int = Field(..., gt=0, description="File size in bytes")
    original_filename: Annotated[str, StringConstraints(min_length=1, max_length=255)]
    description: str | None = None
    alt_text: str | None = Field(
        None, description="Alternative text for accessibility (images)"
    )
    duration_seconds: int | None = Field(
        None, ge=0, description="Duration for audio/video files"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "file_type": "image",
                    "mime_type": "image/jpeg",
                    "file_size": 524288,
                    "original_filename": "lip_exercise.jpg",
                    "description": "Demonstration of lip pressing exercise",
                    "alt_text": "Person pressing lips together firmly",
                },
                {
                    "file_type": "audio",
                    "mime_type": "audio/mpeg",
                    "file_size": 2097152,
                    "original_filename": "pronunciation_papa.mp3",
                    "description": "Pronunciation example for 'Papa'",
                    "duration_seconds": 12,
                },
            ]
        }
    )


# ============================================================================
# Media File Response Schemas
# ============================================================================


class MediaFileResponse(BaseModel):
    """Response schema for a media file."""

    id: UUID
    file_type: str
    mime_type: str
    file_size_bytes: int
    original_filename: str
    storage_path: str
    cdn_url: str | None = None
    thumbnail_url: str | None = None
    duration_seconds: int | None = None
    width: int | None = None
    height: int | None = None
    created_at: datetime
    created_by: UUID | None = None

    model_config = ConfigDict(from_attributes=True)


class MediaFileDetailResponse(MediaFileResponse):
    """Detailed response schema with additional metadata."""

    file_size_mb: float = Field(..., description="File size in megabytes")
    is_orphaned: bool = Field(
        ..., description="Whether file is referenced by any exercise item"
    )

    @staticmethod
    def from_media_file(media_file: MediaFileResponse, is_orphaned: bool = False) -> "MediaFileDetailResponse":
        """Create detail response from basic response."""
        return MediaFileDetailResponse(
            **media_file.model_dump(),
            file_size_mb=round(media_file.file_size_bytes / (1024 * 1024), 2),
            is_orphaned=is_orphaned,
        )


class MediaFileListResponse(BaseModel):
    """Response schema for paginated list of media files."""

    files: list[MediaFileResponse]
    total: int
    page: int
    page_size: int
    has_next: bool
    has_previous: bool


# ============================================================================
# Media File Search/Filter Schemas
# ============================================================================


class MediaFileSearchRequest(BaseModel):
    """Request schema for searching media files."""

    file_type: Annotated[
        str, StringConstraints(pattern=r"^(image|audio|video)$")
    ] | None = None
    mime_type: str | None = None
    created_by: UUID | None = None
    min_size: int | None = Field(None, ge=0, description="Minimum file size in bytes")
    max_size: int | None = Field(None, ge=0, description="Maximum file size in bytes")
    min_duration: int | None = Field(
        None, ge=0, description="Minimum duration in seconds (audio/video)"
    )
    max_duration: int | None = Field(
        None, ge=0, description="Maximum duration in seconds (audio/video)"
    )
    filename_search: str | None = Field(
        None, description="Search term for original filename"
    )
    description_search: str | None = Field(None, description="Search term for description")
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Items per page")
    sort_by: Annotated[
        str,
        StringConstraints(pattern=r"^(created_at|file_size|original_filename)$"),
    ] = "created_at"
    sort_order: Annotated[str, StringConstraints(pattern=r"^(asc|desc)$")] = "desc"

    @field_validator("max_size")
    @classmethod
    def validate_max_size(cls, v: int | None, info) -> int | None:
        """Ensure max_size is greater than min_size if both provided."""
        min_size = info.data.get("min_size")
        if v is not None and min_size is not None and v < min_size:
            raise ValueError("max_size must be greater than min_size")
        return v

    @field_validator("max_duration")
    @classmethod
    def validate_max_duration(cls, v: int | None, info) -> int | None:
        """Ensure max_duration is greater than min_duration if both provided."""
        min_duration = info.data.get("min_duration")
        if v is not None and min_duration is not None and v < min_duration:
            raise ValueError("max_duration must be greater than min_duration")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "file_type": "audio",
                    "mime_type": "audio/mpeg",
                    "min_duration": 5,
                    "max_duration": 60,
                    "page": 1,
                    "page_size": 20,
                    "sort_by": "created_at",
                    "sort_order": "desc",
                }
            ]
        }
    )


# ============================================================================
# Storage Analytics Schemas
# ============================================================================


class StorageStatsResponse(BaseModel):
    """Response schema for storage statistics."""

    total_files: int
    total_size_bytes: int
    total_size_mb: float
    total_size_gb: float
    files_by_type: dict[str, int] = Field(
        ..., description="Count of files by type (image/audio/video)"
    )
    size_by_type_mb: dict[str, float] = Field(
        ..., description="Total size by type in MB"
    )
    orphaned_files_count: int = Field(
        ..., description="Number of files not referenced by any exercise"
    )
    orphaned_size_mb: float = Field(
        ..., description="Total size of orphaned files in MB"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "total_files": 127,
                    "total_size_bytes": 524288000,
                    "total_size_mb": 500.0,
                    "total_size_gb": 0.49,
                    "files_by_type": {"image": 45, "audio": 62, "video": 20},
                    "size_by_type_mb": {
                        "image": 120.5,
                        "audio": 245.3,
                        "video": 134.2,
                    },
                    "orphaned_files_count": 5,
                    "orphaned_size_mb": 12.8,
                }
            ]
        }
    )


class BulkDeleteRequest(BaseModel):
    """Request schema for bulk delete operations."""

    file_ids: list[UUID] = Field(..., description="List of file IDs to delete")

    @field_validator("file_ids")
    @classmethod
    def validate_file_ids(cls, v: list[UUID]) -> list[UUID]:
        """Ensure at least one file ID is provided."""
        if not v:
            raise ValueError("At least one file ID must be provided")
        if len(v) > 100:
            raise ValueError("Cannot delete more than 100 files at once")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "file_ids": [
                        "123e4567-e89b-12d3-a456-426614174000",
                        "223e4567-e89b-12d3-a456-426614174001",
                    ]
                }
            ]
        }
    )


class BulkDeleteResponse(BaseModel):
    """Response schema for bulk delete operations."""

    deleted_count: int
    failed_count: int
    errors: list[str] = Field(default_factory=list, description="Error messages for failed deletions")

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "deleted_count": 8,
                    "failed_count": 2,
                    "errors": [
                        "File 123e4567-e89b-12d3-a456-426614174000 not found",
                        "File 223e4567-e89b-12d3-a456-426614174001 is referenced by exercises",
                    ],
                }
            ]
        }
    )


class CleanupOrphanedResponse(BaseModel):
    """Response schema for orphaned files cleanup."""

    files_found: int
    files_deleted: int
    space_freed_mb: float
    errors: list[str] = Field(default_factory=list)

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "files_found": 12,
                    "files_deleted": 10,
                    "space_freed_mb": 45.7,
                    "errors": [
                        "Failed to delete file at storage/video/2024/01/abc123.mp4"
                    ],
                }
            ]
        }
    )
