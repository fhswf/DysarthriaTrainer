from abc import ABC, abstractmethod
from uuid import UUID

from src.core.ports.repositories.base import IRepository
from src.core.entities.media_file import MediaFile


class IMediaFileRepository(IRepository[MediaFile], ABC):
    """Repository interface for MediaFile aggregate."""

    @abstractmethod
    async def get_by_type(self, file_type: str) -> list[MediaFile]:
        """Retrieve all files of a specific type.
        
        Args:
            file_type: Type of files (image, audio, video)
            
        Returns:
            List of media files
        """
        ...

    @abstractmethod
    async def get_by_created_by(self, user_id: str) -> list[MediaFile]:
        """Retrieve all files uploaded by a specific user.
        
        Args:
            user_id: User ID who created the files
            
        Returns:
            List of media files
        """
        ...

    @abstractmethod
    async def get_by_storage_path(self, storage_path: str) -> MediaFile | None:
        """Retrieve file by storage path.
        
        Args:
            storage_path: File storage path
            
        Returns:
            Media file if found, None otherwise
        """
        ...

    @abstractmethod
    async def search_files(
        self,
        file_type: str | None = None,
        mime_type: str | None = None,
        created_by: str | None = None,
        min_size: int | None = None,
        max_size: int | None = None,
    ) -> list[MediaFile]:
        """Search files with multiple filters.
        
        Args:
            file_type: Optional file type filter
            mime_type: Optional MIME type filter
            created_by: Optional creator filter
            min_size: Optional minimum file size in bytes
            max_size: Optional maximum file size in bytes
            
        Returns:
            List of matching media files
        """
        ...

    @abstractmethod
    async def get_orphaned_files(self) -> list[MediaFile]:
        """Find media files not referenced by any exercise content.
        
        Returns:
            List of orphaned media files
        """
        ...

    @abstractmethod
    async def get_total_storage_used(self, created_by: str | None = None) -> int:
        """Calculate total storage used in bytes.
        
        Args:
            created_by: Optional user filter
            
        Returns:
            Total storage in bytes
        """
        ...

    @abstractmethod
    async def bulk_delete(self, file_ids: list[UUID]) -> int:
        """Delete multiple files at once.
        
        Args:
            file_ids: List of file IDs to delete
            
        Returns:
            Number of files deleted
        """
        ...
