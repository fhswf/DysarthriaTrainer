"""
Local filesystem storage backend implementation.

This module provides a concrete implementation of IStorageBackend
that stores files on the local filesystem.
"""

import aiofiles
import aiofiles.os
from pathlib import Path
from typing import override

from src.core.ports.storage import IStorageBackend
from src.core.exceptions.exercise_exceptions import StorageError


class LocalFileStorage(IStorageBackend):
    """
    Local filesystem storage backend.
    
    Stores files in a directory structure on the local filesystem.
    Suitable for development and single-server deployments.
    
    Attributes:
        _base_path: Root directory for file storage
        _base_url: Base URL prefix for accessing files
    """

    def __init__(self, base_path: str, base_url: str = "/media"):
        """
        Initialize local file storage.
        
        Args:
            base_path: Absolute path to storage root directory
            base_url: Base URL for serving files (e.g., "/media")
        """
        self._base_path = Path(base_path)
        self._base_url = base_url.rstrip("/")
        
        # Create base directory if it doesn't exist
        self._base_path.mkdir(parents=True, exist_ok=True)

    @override
    async def save_file(self, path: str, content: bytes) -> None:
        """Save file to local filesystem."""
        try:
            full_path = self._base_path / path
            
            # Create parent directories if needed
            full_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write file asynchronously
            async with aiofiles.open(full_path, "wb") as f:
                await f.write(content)
                
        except OSError as e:
            raise StorageError(f"Failed to save file '{path}': {e}") from e

    @override
    async def read_file(self, path: str) -> bytes:
        """Read file from local filesystem."""
        full_path = self._base_path / path
        
        if not full_path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        
        try:
            async with aiofiles.open(full_path, "rb") as f:
                return await f.read()
        except OSError as e:
            raise StorageError(f"Failed to read file '{path}': {e}") from e

    @override
    async def delete_file(self, path: str) -> bool:
        """Delete file from local filesystem."""
        full_path = self._base_path / path
        
        if not full_path.exists():
            return False
        
        try:
            await aiofiles.os.remove(full_path)
            
            # Try to remove empty parent directories
            try:
                parent = full_path.parent
                while parent != self._base_path:
                    if not any(parent.iterdir()):
                        parent.rmdir()
                        parent = parent.parent
                    else:
                        break
            except OSError:
                # Ignore errors when cleaning up directories
                pass
            
            return True
            
        except OSError as e:
            raise StorageError(f"Failed to delete file '{path}': {e}") from e

    @override
    async def file_exists(self, path: str) -> bool:
        """Check if file exists on local filesystem."""
        full_path = self._base_path / path
        return full_path.exists() and full_path.is_file()

    @override
    def get_file_url(self, path: str) -> str:
        """Get URL for accessing file."""
        return f"{self._base_url}/{path}"

    @override
    async def get_file_size(self, path: str) -> int:
        """Get file size in bytes."""
        full_path = self._base_path / path
        
        if not full_path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        
        return full_path.stat().st_size

    @override
    async def get_file_by_id(self, file_id: str, media_repo) -> bytes:
        """
        Get file content by media file ID.
        
        Args:
            file_id: Media file UUID as string
            media_repo: IMediaFileRepository instance
            
        Returns:
            File content as bytes
            
        Raises:
            FileNotFoundError: If file not found in database or storage
            StorageError: If file cannot be read
        """
        from uuid import UUID
        
        # Convert string ID to UUID
        file_uuid = UUID(file_id)
        
        # Get media file metadata from repository
        media_file = await media_repo.get_by_id(file_uuid)
        if not media_file:
            raise FileNotFoundError(f"Media file not found in database: {file_id}")
        
        # Read file content using storage path
        return await self.read_file(media_file.storage_path)
