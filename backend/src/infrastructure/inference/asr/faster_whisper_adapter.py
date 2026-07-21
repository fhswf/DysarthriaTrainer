"""
Faster Whisper ASR Adapter

Infrastructure layer adapter for efficient Whisper-based speech recognition.
Uses faster-whisper library (CTranslate2) for optimized inference.
"""

import io
from typing import Optional

import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel
from numpy.typing import NDArray

from src.core.ports.inference.asr import IASRService
from src.core.ports.utils.logger_protocol import ILogger


class FasterWhisperAdapter(IASRService):
    """
    Faster Whisper implementation using CTranslate2 for optimized inference.
    
    Features:
    - 4x faster than OpenAI Whisper
    - Lower memory usage
    - Supports beam search and temperature sampling
    - Language detection
    """
    
    def __init__(
        self,
        logger: ILogger,
        model_size: str = "base",
        device: str = "cpu",
        compute_type: str = "int8",
        language: Optional[str] = "de",
    ):
        """
        Initialize Faster Whisper adapter.
        
        Args:
            logger: Logger instance
            model_size: Model size (tiny, base, small, medium, large-v3)
            device: Device to use (cpu, cuda)
            compute_type: Compute type (int8, float16, float32)
            language: Target language (de, en, None for auto-detect)
        """
        self._logger = logger
        self._model_size = model_size
        self._device = device
        self._language = language
        
        # Load model
        self._logger.info(
            f"Loading Faster Whisper model: {model_size} on {device} ({compute_type})"
        )
        self._model = WhisperModel(
            model_size,
            device=device,
            compute_type=compute_type,
        )
        self._logger.info("Faster Whisper model loaded successfully")
    
    async def transcribe(
        self,
        data: bytes,
        language: Optional[str] = None,
        task: str = "transcribe",
    ) -> str:
        """
        Transcribe audio bytes to text.
        
        Args:
            data: Audio bytes (any format readable by soundfile)
            language: Target language (overrides default)
            task: Task type ("transcribe" or "translate")
            
        Returns:
            Transcribed text
            
        Raises:
            Exception: If transcription fails
        """
        try:
            # Load audio from bytes
            audio, sample_rate = sf.read(io.BytesIO(data))
            
            # Convert to mono if stereo
            if len(audio.shape) > 1:
                audio = audio.mean(axis=1)
            
            # Ensure float32
            audio = audio.astype(np.float32)
            
            # Transcribe
            segments, info = self._model.transcribe(
                audio,
                language=language or self._language,
                task=task,
                beam_size=5,
                vad_filter=True,  # Voice Activity Detection
                vad_parameters={
                    "threshold": 0.5,
                    "min_speech_duration_ms": 250,
                    "min_silence_duration_ms": 100,
                },
            )
            
            # Combine segments
            text = " ".join([segment.text for segment in segments]).strip()
            
            self._logger.info(
                f"Transcription complete: {len(text)} chars, "
                f"language={info.language} (prob={info.language_probability:.2f})"
            )
            
            return text
            
        except Exception as e:
            self._logger.error(f"Transcription failed: {str(e)}")
            raise
    
    async def transcribe_with_confidence(
        self,
        data: bytes,
        language: Optional[str] = None,
    ) -> tuple[str, float]:
        """
        Transcribe audio and return text with average confidence score.
        
        Args:
            data: Audio bytes
            language: Target language (overrides default)
            
        Returns:
            Tuple of (transcribed_text, average_confidence)
        """
        try:
            # Load audio
            audio, sample_rate = sf.read(io.BytesIO(data))
            if len(audio.shape) > 1:
                audio = audio.mean(axis=1)
            audio = audio.astype(np.float32)
            
            # Transcribe
            segments, info = self._model.transcribe(
                audio,
                language=language or self._language,
                beam_size=5,
                vad_filter=True,
            )
            
            # Collect segments and compute average confidence
            text_parts = []
            confidences = []
            
            for segment in segments:
                text_parts.append(segment.text)
                # Average word-level probabilities for segment confidence
                if hasattr(segment, "words"):
                    word_probs = [w.probability for w in segment.words]
                    if word_probs:
                        confidences.append(np.mean(word_probs))
            
            text = " ".join(text_parts).strip()
            avg_confidence = float(np.mean(confidences)) if confidences else 0.0
            
            self._logger.info(
                f"Transcription: {len(text)} chars, confidence={avg_confidence:.2f}"
            )
            
            return text, avg_confidence
            
        except Exception as e:
            self._logger.error(f"Transcription with confidence failed: {str(e)}")
            raise
    
    async def transcribe_numpy(
        self,
        audio_data: NDArray[np.float32],
        language: Optional[str] = None,
    ) -> str:
        """
        Transcribe audio from numpy array.
        
        Args:
            audio_data: Audio samples as float32 numpy array
            language: Target language (overrides default)
            
        Returns:
            Transcribed text
        """
        try:
            segments, info = self._model.transcribe(
                audio_data,
                language=language or self._language,
                beam_size=5,
                vad_filter=True,
            )
            
            text = " ".join([segment.text for segment in segments]).strip()
            return text
            
        except Exception as e:
            self._logger.error(f"NumPy transcription failed: {str(e)}")
            raise
