"""
Audio Analysis Service

Application layer service orchestrating audio preprocessing and transcription.
"""

import time
from typing import Optional

import numpy as np
from numpy.typing import NDArray

from src.core.entities.audio_analysis import AudioAnalysisResult
from src.core.exceptions.audio import AudioProcessingError
from src.core.ports.inference.asr import IASRService
from src.core.ports.inference.audio_preprocessing import IAudioPreprocessor
from src.core.ports.utils.logger_protocol import ILogger


class AudioAnalysisService:
    """
    Service for comprehensive audio analysis combining preprocessing and transcription.
    
    Workflow:
    1. Convert audio to WAV format (if needed)
    2. Apply noise reduction and preprocessing
    3. Calculate quality metrics
    4. Perform speech-to-text transcription
    5. Generate warnings based on quality
    6. Return complete analysis result
    """
    
    def __init__(
        self,
        preprocessor: IAudioPreprocessor,
        asr_service: IASRService,
        logger: ILogger,
    ):
        """
        Initialize audio analysis service.
        
        Args:
            preprocessor: Audio preprocessing implementation
            asr_service: Speech recognition service
            logger: Logger instance
        """
        self._preprocessor = preprocessor
        self._asr_service = asr_service
        self._logger = logger
    
    async def analyze_audio(
        self,
        audio_data: bytes,
        language: str = "de",
        apply_noise_reduction: bool = True,
    ) -> AudioAnalysisResult:
        """
        Perform complete audio analysis with preprocessing and transcription.
        
        Args:
            audio_data: Raw audio bytes in any format
            language: Target language for transcription (de, en)
            apply_noise_reduction: Whether to apply noise reduction
            
        Returns:
            AudioAnalysisResult with transcription, metrics, and warnings
            
        Raises:
            AudioProcessingError: If analysis fails
        """
        start_time = time.time()
        
        try:
            # Step 1: Convert to WAV format
            self._logger.info("Converting audio to WAV format")
            audio_samples = await self._preprocessor.convert_to_wav(audio_data)
            
            # Step 2: Preprocess and calculate quality metrics
            self._logger.info("Preprocessing audio and calculating quality metrics")
            processed_audio, quality_metrics = await self._preprocessor.preprocess(
                audio_samples,
                sample_rate=16000,
                apply_noise_reduction=apply_noise_reduction,
            )
            
            # Step 3: Transcribe audio
            self._logger.info("Transcribing audio to text")
            transcription = await self._asr_service.transcribe_numpy(
                processed_audio,
                language=language,
            )
            
            # Step 4: Calculate processing time
            processing_time_ms = (time.time() - start_time) * 1000
            
            # Step 5: Create result with warnings
            result = AudioAnalysisResult(
                transcription=transcription,
                quality_metrics=quality_metrics,
                language=language,
                processing_time_ms=processing_time_ms,
            )
            
            # Step 6: Generate quality warnings
            self._add_quality_warnings(result)
            
            self._logger.info(
                f"Audio analysis complete: {len(transcription)} chars, "
                f"{processing_time_ms:.0f}ms, {len(result.warnings)} warnings"
            )
            
            return result
            
        except Exception as e:
            self._logger.error(f"Audio analysis failed: {str(e)}")
            raise AudioProcessingError(f"Audio analysis failed: {str(e)}") from e
    
    async def analyze_audio_stream(
        self,
        audio_samples: NDArray[np.float32],
        sample_rate: int = 16000,
        language: str = "de",
        apply_noise_reduction: bool = True,
        skip_transcription: bool = False,
    ) -> AudioAnalysisResult:
        """
        Analyze audio from streaming source (already in numpy array format).
        
        Optimized for WebSocket streaming - skips conversion step.
        
        Args:
            audio_samples: Audio samples as float32 numpy array
            sample_rate: Sample rate in Hz
            language: Target language for transcription
            apply_noise_reduction: Whether to apply noise reduction
            skip_transcription: If True, only calculate quality metrics (faster)
            
        Returns:
            AudioAnalysisResult with transcription, metrics, and warnings
        """
        start_time = time.time()
        
        try:
            # Step 1: Preprocess and calculate quality metrics
            self._logger.info("Preprocessing streamed audio")
            processed_audio, quality_metrics = await self._preprocessor.preprocess(
                audio_samples,
                sample_rate=sample_rate,
                apply_noise_reduction=apply_noise_reduction,
            )
            
            # Step 2: Transcribe (only if enabled)
            transcription = ""
            if not skip_transcription:
                self._logger.info("Transcribing streamed audio")
                transcription = await self._asr_service.transcribe_numpy(
                    processed_audio,
                    language=language,
                )
            else:
                self._logger.info("Skipping transcription (quality metrics only)")
            
            # Step 3: Create result
            processing_time_ms = (time.time() - start_time) * 1000
            result = AudioAnalysisResult(
                transcription=transcription,
                quality_metrics=quality_metrics,
                language=language,
                processing_time_ms=processing_time_ms,
            )
            
            # Step 4: Add warnings
            self._add_quality_warnings(result)
            
            self._logger.info(f"Stream analysis complete: {processing_time_ms:.0f}ms")
            
            return result
            
        except Exception as e:
            self._logger.error(f"Stream analysis failed: {str(e)}")
            raise AudioProcessingError(f"Stream analysis failed: {str(e)}") from e
    
    async def calculate_quality_only(
        self,
        audio_data: bytes,
    ) -> AudioAnalysisResult:
        """
        Calculate quality metrics without transcription (faster).
        
        Useful for:
        - Pre-recording quality checks
        - Real-time quality monitoring
        - Quality validation before expensive transcription
        
        Args:
            audio_data: Raw audio bytes
            
        Returns:
            AudioAnalysisResult with empty transcription but quality metrics
        """
        start_time = time.time()
        
        try:
            # Convert to WAV
            audio_samples = await self._preprocessor.convert_to_wav(audio_data)
            
            # Calculate quality metrics only (no noise reduction)
            quality_metrics = await self._preprocessor.calculate_quality_metrics(
                audio_samples,
                sample_rate=16000,
            )
            
            processing_time_ms = (time.time() - start_time) * 1000
            
            # Create result with empty transcription
            result = AudioAnalysisResult(
                transcription="",
                quality_metrics=quality_metrics,
                processing_time_ms=processing_time_ms,
            )
            
            self._add_quality_warnings(result)
            
            return result
            
        except Exception as e:
            raise AudioProcessingError(
                f"Quality calculation failed: {str(e)}"
            ) from e
    
    def _add_quality_warnings(self, result: AudioAnalysisResult) -> None:
        """
        Add appropriate warnings based on quality metrics.
        
        Warning types:
        1. Low SNR: Signal-to-noise ratio below threshold
        2. Clipping: Audio distortion detected
        3. Low energy: Audio too quiet
        4. High noise: Spectral flatness indicates noisy recording
        
        Args:
            result: AudioAnalysisResult to add warnings to (modified in-place)
        """
        metrics = result.quality_metrics
        
        # Warning 1: Low SNR
        if metrics.snr_db is not None and metrics.snr_db < 15.0:
            if metrics.snr_db < 10.0:
                result.add_warning(
                    "Sehr schlechte Audioqualität: Hohes Hintergrundrauschen. "
                    "Bitte reduzieren Sie Umgebungsgeräusche."
                )
            else:
                result.add_warning(
                    "Mäßige Audioqualität: Hintergrundrauschen erkannt. "
                    "Für beste Ergebnisse in ruhiger Umgebung aufnehmen."
                )
        
        # Warning 2: Clipping detected
        if metrics.clipping_detected:
            result.add_warning(
                "Audio-Verzerrung erkannt (Clipping). "
                "Bitte reduzieren Sie die Mikrofon-Lautstärke oder den Abstand."
            )
        
        # Warning 3: Low energy (too quiet)
        if metrics.rms_energy is not None and metrics.rms_energy < 0.02:
            result.add_warning(
                "Audio zu leise. Bitte sprechen Sie lauter oder "
                "bewegen Sie sich näher zum Mikrofon."
            )
        
        # Warning 4: High spectral flatness (noisy)
        if metrics.spectral_flatness is not None and metrics.spectral_flatness > 0.5:
            result.add_warning(
                "Starkes Rauschen erkannt. Bitte verwenden Sie ein "
                "besseres Mikrofon oder reduzieren Sie Umgebungsgeräusche."
            )
