"""
Media Service for managing media files (images, audio, video).
"""

from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4

from src.application.services.base_service import BaseService
from src.core.entities.media_file import MediaFile
from src.core.enums.exercise_enums import MediaFileType
from src.core.exceptions.exercise_exceptions import (
    MediaFileNotFoundError,
    MediaFileValidationError,
    InvalidMediaFileTypeError,
)
from src.core.ports.repositories.media_file import IMediaFileRepository
from src.core.ports.storage import IStorageBackend


class MediaService(BaseService):
    """Service for media file management operations."""

    # File type validation
    ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/aac", "audio/webm", "audio/x-m4a"}
    ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/ogg"}

    # File size limits (in bytes)
    MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
    MAX_AUDIO_SIZE = 50 * 1024 * 1024  # 50 MB
    MAX_VIDEO_SIZE = 200 * 1024 * 1024  # 200 MB

    def __init__(
        self,
        media_repository: IMediaFileRepository,
        storage_backend: IStorageBackend,
        cdn_base_url: str | None = None,
    ):
        self._media_repo = media_repository
        self._storage = storage_backend
        self._cdn_base_url = cdn_base_url

    # ==================== File Upload & Management ====================

    async def upload_file(
        self,
        file_content: bytes,
        original_filename: str,
        mime_type: str,
        created_by: str | None = None,
        width: int | None = None,
        height: int | None = None,
        duration_seconds: int | None = None,
        metadata: dict | None = None,
    ) -> MediaFile:
        """Upload a new media file."""
        # Determine file type
        file_type = self._get_file_type_from_mime(mime_type)
        
        # Validate file type and size
        self._validate_file(file_content, mime_type, file_type)

        # Generate unique storage path
        file_id = uuid4()
        storage_path = self._generate_storage_path(file_id, file_type, original_filename)

        # Save file to storage backend
        await self._storage.save_file(storage_path, file_content)
        
        # Generate CDN URL or use storage URL
        cdn_url = None
        if self._cdn_base_url:
            cdn_url = f"{self._cdn_base_url}/{storage_path}"
        else:
            cdn_url = self._storage.get_file_url(storage_path)

        # Create media file entity
        media_file = MediaFile(
            id=file_id,
            file_type=MediaFileType(file_type),
            mime_type=mime_type,
            original_filename=original_filename,
            storage_path=str(storage_path),
            cdn_url=cdn_url,
            file_size_bytes=len(file_content),
            duration_seconds=duration_seconds,
            width=width,
            height=height,
            metadata=metadata,
            created_at=datetime.now(timezone.utc),
            created_by=UUID(created_by) if created_by else None,
        )

        return await self._media_repo.add(media_file)

    async def get_file_by_id(self, file_id: UUID) -> MediaFile:
        """Get media file by ID."""
        media_file = await self._media_repo.get_by_id(file_id)
        if not media_file:
            raise MediaFileNotFoundError(f"Media file {file_id} not found")
        return media_file

    async def get_file_by_storage_path(self, storage_path: str) -> MediaFile:
        """Get media file by storage path."""
        media_file = await self._media_repo.get_by_storage_path(storage_path)
        if not media_file:
            raise MediaFileNotFoundError(f"Media file at path '{storage_path}' not found")
        return media_file

    async def get_file_content(self, file_id: UUID) -> tuple[bytes, str, str]:
        """
        Get file content for download.
        
        Args:
            file_id: Media file ID
            
        Returns:
            Tuple of (content, mime_type, filename)
            
        Raises:
            MediaFileNotFoundError: If file not found in database
            FileNotFoundError: If physical file not found in storage
        """
        media_file = await self.get_file_by_id(file_id)
        content = await self._storage.read_file(media_file.storage_path)
        return content, media_file.mime_type, media_file.original_filename

    async def get_files_by_type(self, file_type: str) -> list[MediaFile]:
        """Get all files of a specific type."""
        valid_types = ["image", "audio", "video"]
        if file_type not in valid_types:
            raise InvalidMediaFileTypeError(f"Invalid file type: {file_type}")
        return await self._media_repo.get_by_type(file_type)

    async def get_files_by_user(self, user_id: str) -> list[MediaFile]:
        """Get all files uploaded by a user."""
        return await self._media_repo.get_by_created_by(user_id)

    async def search_files(
        self,
        file_type: str | None = None,
        mime_type: str | None = None,
        created_by: str | None = None,
        min_size: int | None = None,
        max_size: int | None = None,
    ) -> list[MediaFile]:
        """Search files with multiple filters."""
        return await self._media_repo.search_files(
            file_type=file_type,
            mime_type=mime_type,
            created_by=created_by,
            min_size=min_size,
            max_size=max_size,
        )

    async def delete_file(self, file_id: UUID) -> bool:
        """Delete a media file."""
        # Get file metadata first
        media_file = await self.get_file_by_id(file_id)
        
        # Delete physical file from storage
        await self._storage.delete_file(media_file.storage_path)
        
        # Delete database record
        return await self._media_repo.delete(file_id)

    async def bulk_delete_files(self, file_ids: list[UUID]) -> int:
        """Delete multiple files at once."""
        # Get all files first
        files_to_delete = []
        for file_id in file_ids:
            try:
                media_file = await self.get_file_by_id(file_id)
                files_to_delete.append(media_file)
            except MediaFileNotFoundError:
                # Skip files that don't exist
                continue
        
        # Delete physical files
        for file in files_to_delete:
            try:
                await self._storage.delete_file(file.storage_path)
            except Exception:
                # Log error but continue with other deletions
                pass
        
        # Delete database records
        return await self._media_repo.bulk_delete(file_ids)

    # ==================== Storage Analytics ====================

    async def get_total_storage_used(self, user_id: str | None = None) -> dict:
        """Get total storage usage statistics."""
        total_bytes = await self._media_repo.get_total_storage_used(user_id)
        
        return {
            "total_bytes": total_bytes,
            "total_mb": round(total_bytes / (1024 * 1024), 2),
            "total_gb": round(total_bytes / (1024 * 1024 * 1024), 2),
            "user_id": user_id,
        }

    async def get_orphaned_files(self) -> list[MediaFile]:
        """Get files not referenced by any exercise content."""
        return await self._media_repo.get_orphaned_files()

    async def cleanup_orphaned_files(self) -> int:
        """Delete orphaned files to free up storage."""
        orphaned = await self.get_orphaned_files()
        if not orphaned:
            return 0
        
        orphaned_ids = [file.id for file in orphaned]
        return await self.bulk_delete_files(orphaned_ids)

    # ==================== Validation & Helpers ====================

    def _get_file_type_from_mime(self, mime_type: str) -> str:
        """Determine file type from MIME type."""
        if mime_type in self.ALLOWED_IMAGE_TYPES:
            return "image"
        elif mime_type in self.ALLOWED_AUDIO_TYPES:
            return "audio"
        elif mime_type in self.ALLOWED_VIDEO_TYPES:
            return "video"
        else:
            raise InvalidMediaFileTypeError(f"Unsupported MIME type: {mime_type}")

    def _validate_file(self, file_content: bytes, mime_type: str, file_type: str) -> None:
        """Validate file size and type."""
        file_size = len(file_content)

        # Check MIME type
        if file_type == "image":
            if mime_type not in self.ALLOWED_IMAGE_TYPES:
                raise MediaFileValidationError("upload", f"Invalid image type: {mime_type}")
            if file_size > self.MAX_IMAGE_SIZE:
                raise MediaFileValidationError(
                    "upload",
                    f"Image size {file_size} exceeds maximum {self.MAX_IMAGE_SIZE}"
                )

        elif file_type == "audio":
            if mime_type not in self.ALLOWED_AUDIO_TYPES:
                raise MediaFileValidationError("upload", f"Invalid audio type: {mime_type}")
            if file_size > self.MAX_AUDIO_SIZE:
                raise MediaFileValidationError(
                    "upload",
                    f"Audio size {file_size} exceeds maximum {self.MAX_AUDIO_SIZE}"
                )

        elif file_type == "video":
            if mime_type not in self.ALLOWED_VIDEO_TYPES:
                raise MediaFileValidationError("upload", f"Invalid video type: {mime_type}")
            if file_size > self.MAX_VIDEO_SIZE:
                raise MediaFileValidationError(
                    "upload",
                    f"Video size {file_size} exceeds maximum {self.MAX_VIDEO_SIZE}"
                )

    def _generate_storage_path(self, file_id: UUID, file_type: str, original_filename: str) -> str:
        """Generate a unique storage path for the file."""
        # Extract file extension
        extension = Path(original_filename).suffix.lower()
        if not extension:
            # Default extensions by type
            default_extensions = {
                "image": ".jpg",
                "audio": ".mp3",
                "video": ".mp4",
            }
            extension = default_extensions.get(file_type, "")

        # Create path: media/type/year/month/uuid.ext
        now = datetime.now(timezone.utc)
        year = now.strftime("%Y")
        month = now.strftime("%m")
        
        return f"{file_type}/{year}/{month}/{file_id}{extension}"

    async def generate_thumbnail(self, file_id: UUID) -> str | None:
        """Generate thumbnail for video or image."""
        # TODO: Implement thumbnail generation
        # This would use a library like Pillow for images or ffmpeg for videos
        return None
