"""
Integration tests for media file upload endpoints.

Tests the complete HTTP request/response cycle including:
- File upload (image, audio, video)
- File retrieval by ID
- File deletion
- Bulk operations
- Storage analytics
- File validation
- Error handling
"""

import pytest
import io
from uuid import uuid4
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.main import app
from tests.fixtures.auth import admin_token, therapist_token, regular_user_token
from tests.fixtures.users import test_users
from tests.fixtures.roles import base_roles


pytestmark = pytest.mark.asyncio


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
async def client():
    """Create async test client."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


# Token fixtures imported from tests.fixtures.auth


def create_test_image_file() -> bytes:
    """Create a minimal valid JPEG file for testing."""
    # Minimal JPEG header + data
    return bytes([
        0xFF, 0xD8, 0xFF, 0xE0,  # JPEG SOI and APP0
        0x00, 0x10,              # APP0 length
        0x4A, 0x46, 0x49, 0x46, 0x00,  # "JFIF\0"
        0x01, 0x01,              # Version 1.1
        0x00,                    # Density units
        0x00, 0x01, 0x00, 0x01,  # X/Y density
        0x00, 0x00,              # Thumbnail dimensions
        0xFF, 0xD9               # JPEG EOI
    ]) + b'\x00' * 100  # Add some padding


def create_test_audio_file() -> bytes:
    """Create a minimal MP3 file for testing."""
    # MP3 sync word and minimal frame header
    return bytes([
        0xFF, 0xFB,  # MP3 sync + MPEG1 Layer 3
        0x90, 0x00,  # Bitrate/sample rate
    ]) + b'\x00' * 200


# ============================================================================
# Test: Media Upload
# ============================================================================

class TestMediaUpload:
    """Test media file upload functionality."""

    async def test_upload_image_success(self, client: AsyncClient, admin_token: str):
        """Should upload image file successfully."""
        image_data = create_test_image_file()
        
        response = await client.post(
            "/api/v1/media/upload",
            files={"file": ("test_image.jpg", image_data, "image/jpeg")},
            data={
                "description": "Test image",
                "alt_text": "A test image",
            },
            # headers={"Authorization": f"Bearer {admin_token}"},  # Uncomment when auth is ready
        )
        
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["file_type"] == "image"
        assert data["mime_type"] == "image/jpeg"
        assert data["original_filename"] == "test_image.jpg"
        assert data["file_size"] > 0

    async def test_upload_audio_success(self, client: AsyncClient, therapist_token: str):
        """Should upload audio file successfully."""
        audio_data = create_test_audio_file()
        
        response = await client.post(
            "/api/v1/media/upload",
            files={"file": ("pronunciation.mp3", audio_data, "audio/mpeg")},
            data={
                "description": "Pronunciation example",
                "duration_seconds": "10",
            },
            # headers={"Authorization": f"Bearer {therapist_token}"},
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["file_type"] == "audio"
        assert data["mime_type"] == "audio/mpeg"

    async def test_upload_no_file_fails(self, client: AsyncClient):
        """Should fail when no file is provided."""
        response = await client.post(
            "/api/v1/media/upload",
            data={"description": "No file"},
        )
        
        assert response.status_code == 422  # Validation error

    async def test_upload_invalid_mime_type_fails(self, client: AsyncClient):
        """Should fail with unsupported MIME type."""
        response = await client.post(
            "/api/v1/media/upload",
            files={"file": ("test.txt", b"text content", "text/plain")},
        )
        
        assert response.status_code == 400
        assert "Unsupported MIME type" in response.json()["detail"]

    async def test_upload_file_too_large_fails(self, client: AsyncClient):
        """Should fail when file exceeds size limit."""
        # Create a file larger than 10MB limit for images
        large_image = b'\xFF\xD8\xFF\xE0' + b'\x00' * (11 * 1024 * 1024)
        
        response = await client.post(
            "/api/v1/media/upload",
            files={"file": ("large.jpg", large_image, "image/jpeg")},
        )
        
        assert response.status_code == 400
        assert "exceeds maximum" in response.json()["detail"]


# ============================================================================
# Test: Media Retrieval
# ============================================================================

class TestMediaRetrieval:
    """Test media file retrieval functionality."""

    @pytest.fixture
    async def uploaded_file_id(self, client: AsyncClient) -> str:
        """Upload a file and return its ID."""
        image_data = create_test_image_file()
        response = await client.post(
            "/api/v1/media/upload",
            files={"file": ("test.jpg", image_data, "image/jpeg")},
        )
        assert response.status_code == 201
        return response.json()["id"]

    async def test_get_file_by_id_success(
        self, 
        client: AsyncClient, 
        uploaded_file_id: str
    ):
        """Should retrieve file metadata by ID."""
        response = await client.get(f"/api/v1/media/{uploaded_file_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == uploaded_file_id
        assert "file_size_mb" in data
        assert "is_orphaned" in data

    async def test_get_nonexistent_file_fails(self, client: AsyncClient):
        """Should return 404 for nonexistent file."""
        fake_id = str(uuid4())
        response = await client.get(f"/api/v1/media/{fake_id}")
        
        assert response.status_code == 404

    async def test_list_all_files(self, client: AsyncClient, uploaded_file_id: str):
        """Should list all media files."""
        response = await client.get("/api/v1/media/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

    async def test_list_files_filtered_by_type(self, client: AsyncClient):
        """Should filter files by type."""
        # Upload image
        image_data = create_test_image_file()
        await client.post(
            "/api/v1/media/upload",
            files={"file": ("test.jpg", image_data, "image/jpeg")},
        )
        
        # Upload audio
        audio_data = create_test_audio_file()
        await client.post(
            "/api/v1/media/upload",
            files={"file": ("test.mp3", audio_data, "audio/mpeg")},
        )
        
        # Filter by image type
        response = await client.get("/api/v1/media/?file_type=image")
        assert response.status_code == 200
        data = response.json()
        assert all(f["file_type"] == "image" for f in data)


# ============================================================================
# Test: Media Deletion
# ============================================================================

class TestMediaDeletion:
    """Test media file deletion functionality."""

    @pytest.fixture
    async def uploaded_file_id(self, client: AsyncClient) -> str:
        """Upload a file and return its ID."""
        image_data = create_test_image_file()
        response = await client.post(
            "/api/v1/media/upload",
            files={"file": ("test.jpg", image_data, "image/jpeg")},
        )
        return response.json()["id"]

    async def test_delete_file_success(
        self, 
        client: AsyncClient, 
        uploaded_file_id: str,
        # admin_token: str,  # Uncomment when auth is ready
    ):
        """Should delete file successfully."""
        response = await client.delete(
            f"/api/v1/media/{uploaded_file_id}",
            # headers={"Authorization": f"Bearer {admin_token}"},
        )
        
        assert response.status_code == 204

        # Verify file is deleted
        get_response = await client.get(f"/api/v1/media/{uploaded_file_id}")
        assert get_response.status_code == 404

    async def test_delete_nonexistent_file_fails(self, client: AsyncClient):
        """Should return 404 when deleting nonexistent file."""
        fake_id = str(uuid4())
        response = await client.delete(f"/api/v1/media/{fake_id}")
        
        assert response.status_code == 404

    async def test_bulk_delete_files(self, client: AsyncClient):
        """Should delete multiple files at once."""
        # Upload multiple files
        file_ids = []
        for i in range(3):
            image_data = create_test_image_file()
            response = await client.post(
                "/api/v1/media/upload",
                files={"file": (f"test{i}.jpg", image_data, "image/jpeg")},
            )
            file_ids.append(response.json()["id"])
        
        # Bulk delete
        response = await client.post(
            "/api/v1/media/bulk-delete",
            json={"file_ids": file_ids},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["deleted_count"] == 3
        assert data["failed_count"] == 0


# ============================================================================
# Test: Storage Analytics
# ============================================================================

class TestStorageAnalytics:
    """Test storage analytics endpoints."""

    async def test_get_storage_stats(self, client: AsyncClient):
        """Should return storage statistics."""
        # Upload some files first
        image_data = create_test_image_file()
        await client.post(
            "/api/v1/media/upload",
            files={"file": ("test.jpg", image_data, "image/jpeg")},
        )
        
        response = await client.get("/api/v1/media/stats/storage")
        
        assert response.status_code == 200
        data = response.json()
        assert "total_bytes" in data
        assert "total_mb" in data
        assert "total_gb" in data

    async def test_list_orphaned_files(self, client: AsyncClient):
        """Should list files not referenced by exercises."""
        response = await client.get("/api/v1/media/orphaned")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)


# ============================================================================
# Test: Error Handling
# ============================================================================

class TestMediaErrorHandling:
    """Test error handling and validation."""

    async def test_invalid_file_type_parameter(self, client: AsyncClient):
        """Should reject invalid file_type filter."""
        response = await client.get("/api/v1/media/?file_type=invalid")
        
        assert response.status_code == 400

    async def test_missing_filename_fails(self, client: AsyncClient):
        """Should fail when filename is missing."""
        response = await client.post(
            "/api/v1/media/upload",
            files={"file": ("", b"content", "image/jpeg")},
        )
        
        assert response.status_code == 400

    async def test_bulk_delete_empty_list_fails(self, client: AsyncClient):
        """Should fail when bulk delete has no file IDs."""
        response = await client.post(
            "/api/v1/media/bulk-delete",
            json={"file_ids": []},
        )
        
        assert response.status_code == 422  # Validation error
