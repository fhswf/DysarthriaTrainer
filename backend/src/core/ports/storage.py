"""
Storage backend interface for media file operations.

This module defines the IStorageBackend interface for abstracting
file storage operations, enabling different implementations
(filesystem, S3, Azure, etc.) without changing business logic.
"""

from abc import ABC, abstractmethod


class IStorageBackend(ABC):
    """
    Interface for storage backends (filesystem, S3, Azure, etc.).
    
    Provides abstraction for file storage operations, allowing
    different implementations without changing business logic.
    This follows the Ports & Adapters (Hexagonal) architecture pattern.
    """

    @abstractmethod
    async def save_file(self, path: str, content: bytes) -> None:
        """
        Save file content to storage.
        
        Args:
            path: Relative storage path (e.g., "image/2024/11/uuid.jpg")
            content: File content as bytes
            
        Raises:
            StorageError: If file cannot be saved
        """
        ...

    @abstractmethod
    async def read_file(self, path: str) -> bytes:
        """
        Read file content from storage.
        
        Args:
            path: Relative storage path
            
        Returns:
            File content as bytes
            
        Raises:
            StorageError: If file cannot be read
            FileNotFoundError: If file does not exist
        """
        ...

    @abstractmethod
    async def delete_file(self, path: str) -> bool:
        """
        Delete file from storage.
        
        Args:
            path: Relative storage path
            
        Returns:
            True if file was deleted, False if file didn't exist
            
        Raises:
            StorageError: If deletion fails for reasons other than file not found
        """
        ...

    @abstractmethod
    async def file_exists(self, path: str) -> bool:
        """
        Check if file exists in storage.
        
        Args:
            path: Relative storage path
            
        Returns:
            True if file exists, False otherwise
        """
        ...

    @abstractmethod
    def get_file_url(self, path: str) -> str:
        """
        Get URL for accessing file.
        
        Args:
            path: Relative storage path
            
        Returns:
            Full URL to access the file (can be local or CDN URL)
        """
        ...

    @abstractmethod
    async def get_file_size(self, path: str) -> int:
        """
        Get file size in bytes.
        
        Args:
            path: Relative storage path
            
        Returns:
            File size in bytes
            
        Raises:
            StorageError: If size cannot be determined
            FileNotFoundError: If file does not exist
        """
        ...

    @abstractmethod
    async def get_file_by_id(self, file_id: str, media_repo) -> bytes:
        """
        Get file content by media file ID.
        
        This method retrieves the file path from the media file repository
        and returns the file content. Useful for accessing files by their
        database ID rather than storage path.
        
        Args:
            file_id: Media file UUID
            media_repo: Media file repository for path lookup
            
        Returns:
            File content as bytes
            
        Raises:
            FileNotFoundError: If media file not found in database or storage
            StorageError: If file cannot be read
        """
        ...
