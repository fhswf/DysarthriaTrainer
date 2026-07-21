"""
Audio Segment Extractor Service

Extracts time-based segments from audio files for individual result analysis.
Supports various audio formats (WebM, MP4, WAV, etc.) and converts to
standardized format for AI model processing.
"""

# Standard library
import io
from uuid import UUID

# Third-party
import numpy as np
import soundfile as sf
from numpy.typing import NDArray
from pydub import AudioSegment

# Local imports
from src.core.exceptions.audio import AudioProcessingError
from src.core.ports.repositories.media_file import IMediaFileRepository
from src.core.ports.storage import IStorageBackend
from src.core.ports.utils.logger_protocol import ILogger


class AudioSegmentExtractor:
    """
    Service for extracting audio segments from full session recordings.
    
    Features:
    - Load audio from storage (WebM, MP4, WAV, etc.)
    - Extract segment by timestamp
    - Convert to WAV format
    - Return as bytes or numpy array
    
    This service is part of the Application Layer and orchestrates
    the extraction workflow using infrastructure ports.
    """
    
    def __init__(
        self,
        storage: IStorageBackend,
        media_repo: IMediaFileRepository,
        logger: ILogger,
    ):
        """
        Initialize audio segment extractor.
        
        Args:
            storage: Storage backend for file access
            media_repo: Repository for media file metadata
            logger: Logger instance
        """
        self._storage = storage
        self._media_repo = media_repo
        self._logger = logger
    
    async def extract_segment(
        self,
        audio_file_id: UUID,
        start_ms: int,
        end_ms: int,
        output_sample_rate: int = 16000,
    ) -> NDArray[np.float32]:
        """
        Extract audio segment and return as numpy array.
        
        Args:
            audio_file_id: ID of the stored audio file
            start_ms: Start timestamp in milliseconds
            end_ms: End timestamp in milliseconds
            output_sample_rate: Target sample rate (default: 16000)
            
        Returns:
            Audio samples as float32 numpy array normalized to [-1.0, 1.0]
            
        Raises:
            AudioProcessingError: If extraction fails
            FileNotFoundError: If audio file not found
        """
        try:
            # Validate timestamps
            if start_ms < 0 or end_ms < 0:
                raise ValueError("Timestamps cannot be negative")
            
            if end_ms <= start_ms:
                raise ValueError("end_ms must be greater than start_ms")
            
            # Retrieve audio file from storage
            self._logger.info(f"Loading audio file: {audio_file_id}")
            audio_bytes = await self._storage.get_file_by_id(
                str(audio_file_id),
                self._media_repo
            )
            
            # Load audio using pydub (supports many formats)
            self._logger.info(f"Extracting segment: {start_ms}ms - {end_ms}ms")
            audio_segment = AudioSegment.from_file(
                io.BytesIO(audio_bytes),
            )
            
            # Extract segment by timestamp
            segment = audio_segment[start_ms:end_ms]
            
            # Convert to mono
            segment = segment.set_channels(1)
            
            # Resample to target sample rate
            segment = segment.set_frame_rate(output_sample_rate)
            
            # Convert to numpy array
            samples = np.array(segment.get_array_of_samples(), dtype=np.float32)
            
            # Normalize to [-1.0, 1.0]
            max_value = float(2 ** (segment.sample_width * 8 - 1))
            samples = samples / max_value
            
            duration_sec = len(samples) / output_sample_rate
            self._logger.info(
                f"Extracted segment: {len(samples)} samples, "
                f"{duration_sec:.2f}s duration"
            )
            
            return samples
            
        except FileNotFoundError:
            # Re-raise file not found errors
            raise
            
        except ValueError as e:
            # Re-raise validation errors
            self._logger.error(f"Invalid segment parameters: {str(e)}")
            raise AudioProcessingError(f"Invalid parameters: {str(e)}") from e
            
        except Exception as e:
            self._logger.error(f"Segment extraction failed: {str(e)}")
            raise AudioProcessingError(
                f"Failed to extract audio segment: {str(e)}"
            ) from e
    
    async def extract_segment_as_wav(
        self,
        audio_file_id: UUID,
        start_ms: int,
        end_ms: int,
        output_sample_rate: int = 16000,
    ) -> bytes:
        """
        Extract audio segment and return as WAV bytes.
        
        Useful for:
        - Saving extracted segments
        - Sending to external services
        - Debugging and validation
        
        Args:
            audio_file_id: ID of the stored audio file
            start_ms: Start timestamp in milliseconds
            end_ms: End timestamp in milliseconds
            output_sample_rate: Target sample rate (default: 16000)
            
        Returns:
            WAV file as bytes
            
        Raises:
            AudioProcessingError: If extraction fails
            FileNotFoundError: If audio file not found
        """
        try:
            # Extract as numpy array
            samples = await self.extract_segment(
                audio_file_id,
                start_ms,
                end_ms,
                output_sample_rate,
            )
            
            # Convert to WAV bytes using soundfile
            wav_buffer = io.BytesIO()
            sf.write(wav_buffer, samples, output_sample_rate, format='WAV')
            wav_buffer.seek(0)
            
            return wav_buffer.read()
            
        except (AudioProcessingError, FileNotFoundError):
            # Re-raise these exceptions
            raise
            
        except Exception as e:
            self._logger.error(f"WAV conversion failed: {str(e)}")
            raise AudioProcessingError(
                f"Failed to convert segment to WAV: {str(e)}"
            ) from e
    
    async def validate_segment(
        self,
        audio_file_id: UUID,
        start_ms: int,
        end_ms: int,
    ) -> dict:
        """
        Validate that a segment can be extracted without actually extracting it.
        
        Checks:
        - Audio file exists
        - Timestamps are valid
        - Segment duration is reasonable
        
        Args:
            audio_file_id: ID of the stored audio file
            start_ms: Start timestamp in milliseconds
            end_ms: End timestamp in milliseconds
            
        Returns:
            Validation result with metadata:
            {
                "valid": bool,
                "error": str | None,
                "duration_ms": int | None,
                "file_exists": bool,
            }
        """
        try:
            # Validate timestamps
            if start_ms < 0 or end_ms < 0:
                return {
                    "valid": False,
                    "error": "Timestamps cannot be negative",
                    "duration_ms": None,
                    "file_exists": False,
                }
            
            if end_ms <= start_ms:
                return {
                    "valid": False,
                    "error": "end_ms must be greater than start_ms",
                    "duration_ms": None,
                    "file_exists": False,
                }
            
            # Check file exists
            media_file = await self._media_repo.get_by_id(audio_file_id)
            if not media_file:
                return {
                    "valid": False,
                    "error": f"Media file not found: {audio_file_id}",
                    "duration_ms": None,
                    "file_exists": False,
                }
            
            # Calculate duration
            duration_ms = end_ms - start_ms
            
            return {
                "valid": True,
                "error": None,
                "duration_ms": duration_ms,
                "file_exists": True,
            }
            
        except Exception as e:
            self._logger.error(f"Validation failed: {str(e)}")
            return {
                "valid": False,
                "error": str(e),
                "duration_ms": None,
                "file_exists": False,
            }
