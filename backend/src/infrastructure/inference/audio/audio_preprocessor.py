"""
Audio Preprocessor Implementation

Infrastructure layer adapter implementing audio preprocessing operations.
Uses noisereduce, scipy, and librosa for audio processing.
"""

import io
from typing import Optional

import librosa
import numpy as np
import noisereduce as nr
import soundfile as sf
from numpy.typing import NDArray
from pydub import AudioSegment
from scipy import signal

from src.core.entities.audio_analysis import QualityMetrics
from src.core.exceptions.audio import AudioProcessingError
from src.core.ports.inference.audio_preprocessing import IAudioPreprocessor


class AudioPreprocessor(IAudioPreprocessor):
    """
    Audio preprocessing implementation using industry-standard libraries.
    
    Features:
    - Spectral subtraction noise reduction (noisereduce)
    - Quality metric calculation (SNR, RMS, clipping, spectral flatness)
    - Format conversion (any format → WAV 16kHz mono)
    """
    
    def __init__(
        self,
        target_sample_rate: int = 16000,
        noise_reduction_strength: float = 0.5,
    ):
        """
        Initialize audio preprocessor.
        
        Args:
            target_sample_rate: Target sample rate in Hz (default: 16000)
            noise_reduction_strength: Noise reduction strength 0.0-1.0 (default: 0.5)
        """
        self.target_sample_rate = target_sample_rate
        self.noise_reduction_strength = noise_reduction_strength
    
    async def preprocess(
        self,
        audio_data: NDArray[np.float32],
        sample_rate: int,
        apply_noise_reduction: bool = True,
    ) -> tuple[NDArray[np.float32], QualityMetrics]:
        """
        Preprocess audio data and calculate quality metrics.
        
        Args:
            audio_data: Raw audio samples as float32 array
            sample_rate: Sample rate in Hz
            apply_noise_reduction: Whether to apply noise reduction
            
        Returns:
            Tuple of (processed_audio, quality_metrics)
            
        Raises:
            AudioProcessingError: If preprocessing fails
        """
        try:
            # Resample if needed
            if sample_rate != self.target_sample_rate:
                audio_data = librosa.resample(
                    audio_data,
                    orig_sr=sample_rate,
                    target_sr=self.target_sample_rate,
                )
                sample_rate = self.target_sample_rate
            
            # Apply noise reduction if requested
            if apply_noise_reduction:
                audio_data = await self.reduce_noise(audio_data, sample_rate)
            
            # Calculate quality metrics
            metrics = await self.calculate_quality_metrics(audio_data, sample_rate)
            
            return audio_data, metrics
            
        except Exception as e:
            raise AudioProcessingError(f"Preprocessing failed: {str(e)}") from e
    
    async def reduce_noise(
        self,
        audio_data: NDArray[np.float32],
        sample_rate: int,
    ) -> NDArray[np.float32]:
        """
        Apply spectral subtraction noise reduction.
        
        Uses noisereduce library with stationary noise estimation.
        
        Args:
            audio_data: Raw audio samples
            sample_rate: Sample rate in Hz
            
        Returns:
            Noise-reduced audio samples
            
        Raises:
            AudioProcessingError: If noise reduction fails
        """
        try:
            # Apply spectral subtraction noise reduction
            # Use first 0.5 seconds as noise profile if audio is long enough
            reduced_audio = nr.reduce_noise(
                y=audio_data,
                sr=sample_rate,
                prop_decrease=self.noise_reduction_strength,
                stationary=True,
            )
            
            return reduced_audio.astype(np.float32)
            
        except Exception as e:
            raise AudioProcessingError(f"Noise reduction failed: {str(e)}") from e
    
    async def calculate_quality_metrics(
        self,
        audio_data: NDArray[np.float32],
        sample_rate: int,
    ) -> QualityMetrics:
        """
        Calculate comprehensive audio quality metrics.
        
        Metrics:
        - SNR (Signal-to-Noise Ratio): Measures signal quality vs noise
        - RMS Energy: Measures overall audio level
        - Clipping: Detects audio distortion from clipping
        - Spectral Flatness: Measures tone-like vs noise-like character
        
        Args:
            audio_data: Audio samples to analyze
            sample_rate: Sample rate in Hz
            
        Returns:
            QualityMetrics with calculated values
            
        Raises:
            AudioProcessingError: If metric calculation fails
        """
        try:
            # Calculate RMS energy
            rms_energy = float(np.sqrt(np.mean(audio_data**2)))
            
            # Detect clipping (values at or near ±1.0)
            clipping_threshold = 0.99
            clipping_detected = bool(
                np.any(np.abs(audio_data) >= clipping_threshold)
            )
            
            # Calculate Signal-to-Noise Ratio (SNR)
            snr_db = self._calculate_snr(audio_data, sample_rate)
            
            # Calculate spectral flatness
            spectral_flatness = self._calculate_spectral_flatness(
                audio_data, sample_rate
            )
            
            return QualityMetrics(
                snr_db=snr_db,
                rms_energy=rms_energy,
                clipping_detected=clipping_detected,
                spectral_flatness=spectral_flatness,
            )
            
        except Exception as e:
            raise AudioProcessingError(
                f"Quality metric calculation failed: {str(e)}"
            ) from e
    
    def _calculate_snr(
        self,
        audio_data: NDArray[np.float32],
        sample_rate: int,
    ) -> Optional[float]:
        """
        Calculate Signal-to-Noise Ratio in dB.
        
        Uses energy-based approach:
        1. Estimate noise from quietest segments
        2. Calculate signal energy from entire audio
        3. Compute ratio: 10 * log10(signal_energy / noise_energy)
        
        Args:
            audio_data: Audio samples
            sample_rate: Sample rate in Hz
            
        Returns:
            SNR in dB, or None if calculation fails
        """
        try:
            # Split audio into frames
            frame_length = int(0.1 * sample_rate)  # 100ms frames
            hop_length = frame_length // 2
            
            # Calculate energy per frame
            frames = librosa.util.frame(
                audio_data,
                frame_length=frame_length,
                hop_length=hop_length,
            )
            frame_energies = np.sum(frames**2, axis=0)
            
            # Estimate noise from quietest 10% of frames
            noise_threshold = np.percentile(frame_energies, 10)
            noise_frames = frames[:, frame_energies <= noise_threshold]
            
            if noise_frames.size == 0:
                return None
            
            # Calculate noise and signal energy
            noise_energy = np.mean(noise_frames**2)
            signal_energy = np.mean(audio_data**2)
            
            # Avoid division by zero
            if noise_energy < 1e-10:
                return None
            
            # Calculate SNR in dB
            snr = 10 * np.log10(signal_energy / noise_energy)
            return float(snr)
            
        except Exception:
            return None
    
    def _calculate_spectral_flatness(
        self,
        audio_data: NDArray[np.float32],
        sample_rate: int,
    ) -> Optional[float]:
        """
        Calculate spectral flatness (Wiener entropy).
        
        Spectral flatness measures how tone-like (low values) vs noise-like
        (high values) the audio is. Computed as geometric mean / arithmetic mean
        of power spectrum.
        
        Args:
            audio_data: Audio samples
            sample_rate: Sample rate in Hz
            
        Returns:
            Spectral flatness (0.0-1.0), or None if calculation fails
        """
        try:
            # Compute power spectral density
            frequencies, psd = signal.periodogram(audio_data, fs=sample_rate)
            
            # Avoid log of zero
            psd = psd + 1e-10
            
            # Calculate geometric mean and arithmetic mean
            geometric_mean = np.exp(np.mean(np.log(psd)))
            arithmetic_mean = np.mean(psd)
            
            # Spectral flatness = geometric_mean / arithmetic_mean
            flatness = geometric_mean / arithmetic_mean
            return float(flatness)
            
        except Exception:
            return None
    
    async def convert_to_wav(
        self,
        audio_data: bytes,
        output_sample_rate: int = 16000,
    ) -> NDArray[np.float32]:
        """
        Convert audio bytes to WAV format with specified sample rate.
        
        Supports any format readable by pydub (MP3, WAV, WebM, etc.)
        Output is always mono, float32, normalized to [-1.0, 1.0]
        
        Args:
            audio_data: Raw audio bytes in any format
            output_sample_rate: Target sample rate in Hz (default: 16000)
            
        Returns:
            Audio samples as float32 numpy array
            
        Raises:
            AudioProcessingError: If conversion fails
        """
        try:
            # Load audio using pydub (supports many formats)
            audio_segment = AudioSegment.from_file(
                io.BytesIO(audio_data),
            )
            
            # Convert to mono
            audio_segment = audio_segment.set_channels(1)
            
            # Resample to target sample rate
            audio_segment = audio_segment.set_frame_rate(output_sample_rate)
            
            # Convert to numpy array
            samples = np.array(audio_segment.get_array_of_samples(), dtype=np.float32)
            
            # Normalize to [-1.0, 1.0]
            max_value = float(2 ** (audio_segment.sample_width * 8 - 1))
            samples = samples / max_value
            
            return samples
            
        except Exception as e:
            raise AudioProcessingError(f"Audio conversion failed: {str(e)}") from e
    
    async def save_wav(
        self,
        audio_data: NDArray[np.float32],
        output_path: str,
        sample_rate: int = 16000,
    ) -> None:
        """
        Save audio samples to WAV file.
        
        Args:
            audio_data: Audio samples to save
            output_path: Output file path (.wav)
            sample_rate: Sample rate in Hz
            
        Raises:
            AudioProcessingError: If save operation fails
        """
        try:
            sf.write(output_path, audio_data, sample_rate)
        except Exception as e:
            raise AudioProcessingError(f"Failed to save WAV file: {str(e)}") from e
