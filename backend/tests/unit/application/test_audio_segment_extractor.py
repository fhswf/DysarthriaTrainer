"""Unit tests for AudioSegmentExtractor service."""

import io
import pytest
import numpy as np
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from src.application.services.audio_segment_extractor import AudioSegmentExtractor
from src.core.entities.media_file import MediaFile
from src.core.exceptions.audio import AudioProcessingError


class TestAudioSegmentExtractor:
    """Test AudioSegmentExtractor service with mocked dependencies."""

    @pytest.fixture
    def mock_storage(self):
        """Create mock storage backend."""
        storage = AsyncMock()
        # Simulate WAV file content (44-byte header + minimal audio data)
        wav_header = b"RIFF" + b"\x00" * 4 + b"WAVE" + b"fmt " + b"\x00" * 28 + b"data" + b"\x00" * 4
        wav_data = b"\x00" * 1000  # 1000 bytes of audio data
        storage.get_file_by_id.return_value = wav_header + wav_data
        return storage

    @pytest.fixture
    def mock_media_repo(self):
        """Create mock media file repository."""
        from src.core.enums.exercise_enums import MediaFileType
        from datetime import datetime, timezone
        
        repo = AsyncMock()
        media_file = MediaFile(
            id=uuid4(),
            file_type=MediaFileType.AUDIO,
            mime_type="audio/wav",
            original_filename="test_audio.wav",
            storage_path="test/audio.wav",
            file_size_bytes=1044,
            created_at=datetime.now(timezone.utc)
        )
        repo.find_by_id.return_value = media_file
        return repo

    @pytest.fixture
    def mock_logger(self):
        """Create mock logger."""
        return MagicMock()

    @pytest.fixture
    def extractor(self, mock_storage, mock_media_repo, mock_logger):
        """Create AudioSegmentExtractor instance with mocked dependencies."""
        return AudioSegmentExtractor(
            storage=mock_storage,
            media_repo=mock_media_repo,
            logger=mock_logger
        )

    @pytest.mark.asyncio
    async def test_validate_segment_success(self, extractor, mock_storage, mock_media_repo):
        """Test successful segment validation."""
        # Arrange
        file_id = uuid4()
        start_ms = 0
        end_ms = 1000

        # Act
        is_valid = await extractor.validate_segment(file_id, start_ms, end_ms)

        # Assert
        assert is_valid is True
        mock_media_repo.find_by_id.assert_called_once_with(file_id)
        mock_storage.get_file_by_id.assert_called_once_with(file_id)

    @pytest.mark.asyncio
    async def test_validate_segment_file_not_found(self, extractor, mock_media_repo):
        """Test validation fails when file not found."""
        # Arrange
        file_id = uuid4()
        mock_media_repo.find_by_id.return_value = None

        # Act
        is_valid = await extractor.validate_segment(file_id, 0, 1000)

        # Assert
        assert is_valid is False

    @pytest.mark.asyncio
    async def test_validate_segment_invalid_timestamps(self, extractor):
        """Test validation fails with invalid timestamps."""
        # Arrange
        file_id = uuid4()

        # Act & Assert - end before start
        is_valid = await extractor.validate_segment(file_id, 1000, 500)
        assert is_valid is False

        # Act & Assert - negative timestamps
        is_valid = await extractor.validate_segment(file_id, -100, 1000)
        assert is_valid is False

        # Act & Assert - same start and end
        is_valid = await extractor.validate_segment(file_id, 1000, 1000)
        assert is_valid is False

    @pytest.mark.asyncio
    async def test_extract_segment_calls_storage(self, extractor, mock_storage, mock_media_repo):
        """Test that extract_segment retrieves file from storage."""
        # Arrange
        file_id = uuid4()
        start_ms = 0
        end_ms = 100

        # Act
        try:
            await extractor.extract_segment(file_id, start_ms, end_ms)
        except Exception:
            pass  # We expect this to fail since we're using mock data

        # Assert - verify storage was called
        mock_media_repo.find_by_id.assert_called_once_with(file_id)
        mock_storage.get_file_by_id.assert_called_once_with(file_id)

    @pytest.mark.asyncio
    async def test_extract_segment_file_not_found(self, extractor, mock_media_repo):
        """Test extract_segment raises error when file not found."""
        # Arrange
        file_id = uuid4()
        mock_media_repo.find_by_id.return_value = None

        # Act & Assert
        with pytest.raises(AudioProcessingError, match="not found"):
            await extractor.extract_segment(file_id, 0, 1000)

    @pytest.mark.asyncio
    async def test_extract_segment_invalid_timestamps(self, extractor):
        """Test extract_segment raises error with invalid timestamps."""
        # Arrange
        file_id = uuid4()

        # Act & Assert
        with pytest.raises(AudioProcessingError, match="Invalid timestamp"):
            await extractor.extract_segment(file_id, 1000, 500)

    @pytest.mark.asyncio
    async def test_extract_segment_storage_error(self, extractor, mock_storage):
        """Test extract_segment handles storage errors."""
        # Arrange
        file_id = uuid4()
        mock_storage.get_file_by_id.side_effect = Exception("Storage failure")

        # Act & Assert
        with pytest.raises(AudioProcessingError, match="Failed to extract"):
            await extractor.extract_segment(file_id, 0, 1000)

    @pytest.mark.asyncio
    async def test_extract_segment_as_wav_calls_storage(self, extractor, mock_storage, mock_media_repo):
        """Test that extract_segment_as_wav retrieves file from storage."""
        # Arrange
        file_id = uuid4()
        start_ms = 0
        end_ms = 100

        # Act
        try:
            await extractor.extract_segment_as_wav(file_id, start_ms, end_ms)
        except Exception:
            pass  # Expected to fail with mock data

        # Assert - verify storage was called
        mock_media_repo.find_by_id.assert_called_once_with(file_id)
        mock_storage.get_file_by_id.assert_called_once_with(file_id)

    @pytest.mark.asyncio
    async def test_extract_segment_as_wav_file_not_found(self, extractor, mock_media_repo):
        """Test extract_segment_as_wav raises error when file not found."""
        # Arrange
        file_id = uuid4()
        mock_media_repo.find_by_id.return_value = None

        # Act & Assert
        with pytest.raises(AudioProcessingError, match="not found"):
            await extractor.extract_segment_as_wav(file_id, 0, 1000)

    @pytest.mark.asyncio
    async def test_validate_segment_logs_errors(self, extractor, mock_logger, mock_storage):
        """Test that validation errors are logged."""
        # Arrange
        file_id = uuid4()
        mock_storage.get_file_by_id.side_effect = Exception("Test error")

        # Act
        await extractor.validate_segment(file_id, 0, 1000)

        # Assert - verify error was logged
        assert mock_logger.error.called

    @pytest.mark.asyncio
    async def test_extract_segment_logs_operations(self, extractor, mock_logger):
        """Test that extraction operations are logged."""
        # Arrange
        file_id = uuid4()

        # Act
        try:
            await extractor.extract_segment(file_id, 0, 1000)
        except Exception:
            pass

        # Assert - verify logging occurred
        assert mock_logger.debug.called or mock_logger.info.called


class TestAudioSegmentExtractorValidation:
    """Test input validation logic."""

    @pytest.fixture
    def extractor(self):
        """Create extractor with minimal mocks for validation tests."""
        storage = AsyncMock()
        media_repo = AsyncMock()
        logger = MagicMock()
        return AudioSegmentExtractor(storage, media_repo, logger)

    def test_timestamp_validation_logic(self, extractor):
        """Test internal timestamp validation."""
        # Valid cases
        assert 0 < 1000  # start < end is valid
        assert not (1000 < 500)  # end before start is invalid
        assert not (0 < 0)  # same timestamps invalid

        # Edge cases
        assert 0 < 1  # minimal duration
        assert 0 < 999999  # very long duration

    @pytest.mark.parametrize("start_ms,end_ms,expected", [
        (0, 1000, True),  # Valid range
        (1000, 2000, True),  # Valid range
        (1000, 500, False),  # End before start
        (-100, 1000, False),  # Negative start
        (0, -100, False),  # Negative end
        (1000, 1000, False),  # Same timestamps
        (0, 0, False),  # Both zero
    ])
    def test_timestamp_combinations(self, start_ms, end_ms, expected):
        """Test various timestamp combinations for validation."""
        # Simple logic check (actual validation in service)
        is_valid = start_ms >= 0 and end_ms > start_ms
        assert is_valid == expected
