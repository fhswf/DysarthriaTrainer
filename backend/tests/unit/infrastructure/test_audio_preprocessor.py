"""
Unit tests for AudioPreprocessor infrastructure implementation.

Tests noise reduction, quality metrics calculation, and audio conversion.
"""

import io

import numpy as np
import pytest
import soundfile as sf

from infrastructure.inference.audio.audio_preprocessor import AudioPreprocessor
from core.entities.audio_analysis import QualityMetrics
from core.exceptions.audio import AudioProcessingError


class TestAudioPreprocessor:
    """Test suite for AudioPreprocessor."""
    
    @pytest.fixture
    def preprocessor(self):
        """Create AudioPreprocessor instance."""
        return AudioPreprocessor(target_sample_rate=16000, noise_reduction_strength=0.5)
    
    @pytest.mark.asyncio
    async def test_preprocess_clean_audio(self, preprocessor, audio_numpy_clean, sample_rate):
        """Should preprocess clean audio successfully."""
        processed, metrics = await preprocessor.preprocess(
            audio_numpy_clean,
            sample_rate,
            apply_noise_reduction=True
        )
        
        assert processed is not None
        assert len(processed) == len(audio_numpy_clean)
        assert isinstance(metrics, QualityMetrics)
        assert metrics.snr_db is not None
        assert metrics.rms_energy is not None
        assert not metrics.clipping_detected
    
    @pytest.mark.asyncio
    async def test_preprocess_without_noise_reduction(self, preprocessor, audio_numpy_clean, sample_rate):
        """Should preprocess audio without noise reduction."""
        processed, metrics = await preprocessor.preprocess(
            audio_numpy_clean,
            sample_rate,
            apply_noise_reduction=False
        )
        
        assert processed is not None
        assert isinstance(metrics, QualityMetrics)
    
    @pytest.mark.asyncio
    async def test_reduce_noise(self, preprocessor, audio_numpy_noisy, sample_rate):
        """Should reduce noise in audio."""
        reduced = await preprocessor.reduce_noise(audio_numpy_noisy, sample_rate)
        
        assert reduced is not None
        assert len(reduced) == len(audio_numpy_noisy)
        assert reduced.dtype == np.float32
    
    @pytest.mark.asyncio
    async def test_calculate_quality_metrics_clean(self, preprocessor, audio_numpy_clean, sample_rate):
        """Should calculate quality metrics for clean audio."""
        metrics = await preprocessor.calculate_quality_metrics(audio_numpy_clean, sample_rate)
        
        assert isinstance(metrics, QualityMetrics)
        assert metrics.snr_db is not None
        assert metrics.snr_db > 10  # Clean audio should have good SNR
        assert metrics.rms_energy is not None
        assert metrics.rms_energy > 0.01  # Should not be too quiet
        assert not metrics.clipping_detected
        assert metrics.spectral_flatness is not None
    
    @pytest.mark.asyncio
    async def test_calculate_quality_metrics_noisy(self, preprocessor, audio_numpy_noisy, sample_rate):
        """Should detect poor quality in noisy audio."""
        metrics = await preprocessor.calculate_quality_metrics(audio_numpy_noisy, sample_rate)
        
        assert isinstance(metrics, QualityMetrics)
        # Noisy audio typically has lower SNR and higher spectral flatness
        assert metrics.spectral_flatness is not None
        assert metrics.spectral_flatness > 0.3  # Noisy signals have higher flatness
    
    @pytest.mark.asyncio
    async def test_detect_clipping(self, preprocessor, sample_rate):
        """Should detect clipping in audio."""
        # Create audio with clipping
        t = np.linspace(0, 1, sample_rate)
        clipped_audio = np.clip(1.5 * np.sin(2 * np.pi * 200 * t), -1.0, 1.0).astype(np.float32)
        
        metrics = await preprocessor.calculate_quality_metrics(clipped_audio, sample_rate)
        
        assert metrics.clipping_detected is True
    
    @pytest.mark.asyncio
    async def test_detect_quiet_audio(self, preprocessor, sample_rate):
        """Should detect very quiet audio."""
        # Create very quiet audio
        t = np.linspace(0, 1, sample_rate)
        quiet_audio = (0.005 * np.sin(2 * np.pi * 200 * t)).astype(np.float32)
        
        metrics = await preprocessor.calculate_quality_metrics(quiet_audio, sample_rate)
        
        assert metrics.rms_energy is not None
        assert metrics.rms_energy < 0.01  # Very quiet
        assert not metrics.is_acceptable()  # Should be unacceptable
    
    @pytest.mark.asyncio
    async def test_convert_to_wav_from_wav(self, preprocessor, clean_speech_audio):
        """Should convert WAV bytes to numpy array."""
        samples = await preprocessor.convert_to_wav(clean_speech_audio, output_sample_rate=16000)
        
        assert isinstance(samples, np.ndarray)
        assert samples.dtype == np.float32
        assert len(samples) > 0
        assert np.max(np.abs(samples)) <= 1.0  # Normalized
    
    @pytest.mark.asyncio
    async def test_convert_resamples_audio(self, preprocessor):
        """Should resample audio to target sample rate."""
        # Create audio at 48kHz
        original_sr = 48000
        t = np.linspace(0, 1, original_sr)
        audio = (0.3 * np.sin(2 * np.pi * 200 * t)).astype(np.float32)
        
        # Convert to WAV bytes
        buffer = io.BytesIO()
        sf.write(buffer, audio, original_sr, format='WAV')
        buffer.seek(0)
        audio_bytes = buffer.read()
        
        # Convert and resample
        samples = await preprocessor.convert_to_wav(audio_bytes, output_sample_rate=16000)
        
        assert len(samples) == 16000  # 1 second at 16kHz
    
    @pytest.mark.asyncio
    async def test_convert_invalid_audio_raises_error(self, preprocessor):
        """Should raise AudioProcessingError for invalid audio data."""
        with pytest.raises(AudioProcessingError):
            await preprocessor.convert_to_wav(b"invalid audio data")
    
    @pytest.mark.asyncio
    async def test_preprocess_resamples_if_needed(self, preprocessor):
        """Should resample audio if sample rate differs from target."""
        # Create audio at different sample rate
        audio_44100 = np.random.randn(44100).astype(np.float32) * 0.1
        
        processed, metrics = await preprocessor.preprocess(
            audio_44100,
            sample_rate=44100,
            apply_noise_reduction=False
        )
        
        # Should be resampled to 16kHz
        assert len(processed) == 16000  # 1 second at target rate
    
    @pytest.mark.asyncio
    async def test_save_wav(self, preprocessor, audio_numpy_clean, sample_rate, tmp_path):
        """Should save audio to WAV file."""
        output_path = tmp_path / "test_output.wav"
        
        await preprocessor.save_wav(audio_numpy_clean, str(output_path), sample_rate)
        
        assert output_path.exists()
        
        # Verify saved audio
        loaded, loaded_sr = sf.read(output_path)
        assert loaded_sr == sample_rate
        assert len(loaded) == len(audio_numpy_clean)
