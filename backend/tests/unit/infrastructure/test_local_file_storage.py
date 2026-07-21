"""Unit tests for LocalFileStorage implementation."""

import pytest
from pathlib import Path
import tempfile
import shutil

from src.infrastructure.storage.local_file_storage import LocalFileStorage
from src.core.exceptions.exercise_exceptions import StorageError


class TestLocalFileStorage:
    """Test local filesystem storage backend."""

    @pytest.fixture
    def temp_storage_path(self):
        """Create temporary directory for storage tests."""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir, ignore_errors=True)

    @pytest.fixture
    def storage(self, temp_storage_path):
        """Create LocalFileStorage instance with temporary directory."""
        return LocalFileStorage(
            base_path=temp_storage_path,
            base_url="/media"
        )

    @pytest.mark.asyncio
    async def test_save_file(self, storage, temp_storage_path):
        """Test saving a file to storage."""
        # Arrange
        test_content = b"Hello, World!"
        test_path = "test/2024/11/test.txt"
        
        # Act
        await storage.save_file(test_path, test_content)
        
        # Assert
        full_path = Path(temp_storage_path) / test_path
        assert full_path.exists()
        assert full_path.read_bytes() == test_content

    @pytest.mark.asyncio
    async def test_save_file_creates_directories(self, storage, temp_storage_path):
        """Test that saving creates parent directories."""
        # Arrange
        test_content = b"Test content"
        test_path = "nested/path/to/file.txt"
        
        # Act
        await storage.save_file(test_path, test_content)
        
        # Assert
        full_path = Path(temp_storage_path) / test_path
        assert full_path.exists()
        assert full_path.parent.exists()

    @pytest.mark.asyncio
    async def test_read_file(self, storage, temp_storage_path):
        """Test reading a file from storage."""
        # Arrange
        test_content = b"Test file content"
        test_path = "test/file.txt"
        await storage.save_file(test_path, test_content)
        
        # Act
        content = await storage.read_file(test_path)
        
        # Assert
        assert content == test_content

    @pytest.mark.asyncio
    async def test_read_file_not_found(self, storage):
        """Test reading a non-existent file raises FileNotFoundError."""
        # Act & Assert
        with pytest.raises(FileNotFoundError):
            await storage.read_file("nonexistent/file.txt")

    @pytest.mark.asyncio
    async def test_delete_file(self, storage, temp_storage_path):
        """Test deleting a file from storage."""
        # Arrange
        test_content = b"Delete me"
        test_path = "test/delete.txt"
        await storage.save_file(test_path, test_content)
        
        # Act
        result = await storage.delete_file(test_path)
        
        # Assert
        assert result is True
        full_path = Path(temp_storage_path) / test_path
        assert not full_path.exists()

    @pytest.mark.asyncio
    async def test_delete_nonexistent_file(self, storage):
        """Test deleting a non-existent file returns False."""
        # Act
        result = await storage.delete_file("nonexistent/file.txt")
        
        # Assert
        assert result is False

    @pytest.mark.asyncio
    async def test_file_exists(self, storage):
        """Test checking if file exists."""
        # Arrange
        test_content = b"Exists"
        test_path = "test/exists.txt"
        await storage.save_file(test_path, test_content)
        
        # Act & Assert
        assert await storage.file_exists(test_path) is True
        assert await storage.file_exists("nonexistent.txt") is False

    def test_get_file_url(self, storage):
        """Test getting file URL."""
        # Arrange
        test_path = "image/2024/11/test.jpg"
        
        # Act
        url = storage.get_file_url(test_path)
        
        # Assert
        assert url == "/media/image/2024/11/test.jpg"

    @pytest.mark.asyncio
    async def test_get_file_size(self, storage):
        """Test getting file size."""
        # Arrange
        test_content = b"Test content with some bytes"
        test_path = "test/size.txt"
        await storage.save_file(test_path, test_content)
        
        # Act
        size = await storage.get_file_size(test_path)
        
        # Assert
        assert size == len(test_content)

    @pytest.mark.asyncio
    async def test_get_file_size_not_found(self, storage):
        """Test getting size of non-existent file raises FileNotFoundError."""
        # Act & Assert
        with pytest.raises(FileNotFoundError):
            await storage.get_file_size("nonexistent.txt")

    @pytest.mark.asyncio
    async def test_delete_cleans_empty_directories(self, storage, temp_storage_path):
        """Test that deleting a file cleans up empty parent directories."""
        # Arrange
        test_content = b"Cleanup test"
        test_path = "deep/nested/path/file.txt"
        await storage.save_file(test_path, test_content)
        
        # Act
        await storage.delete_file(test_path)
        
        # Assert
        # File should be deleted
        full_path = Path(temp_storage_path) / test_path
        assert not full_path.exists()
        
        # Empty parent directories should be cleaned up
        parent = full_path.parent
        assert not parent.exists()
