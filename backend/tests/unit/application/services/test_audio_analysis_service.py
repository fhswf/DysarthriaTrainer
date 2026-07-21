"""
Unit tests for AudioAnalysisService application service.

Tests orchestration of preprocessing, transcription, and quality warnings.
"""

from unittest.mock import AsyncMock, Mock

import numpy as np
import pytest

from application.services.audio_analysis_service import AudioAnalysisService
from core.entities.audio_analysis import AudioAnalysisResult, QualityMetrics
from core.enums.audio import QualityWarningType
from core.ports.audio import IAudioPreprocessor
from core.ports.inference import IASRService
from common.logging_utils.logger import ILogger


class TestAudioAnalysisService:
    """Test suite for AudioAnalysisService."""
    
    @pytest.fixture
    def mock_preprocessor(self):
        """Create mock audio preprocessor."""
        preprocessor = Mock(spec=IAudioPreprocessor)
        preprocessor.convert_to_wav = AsyncMock(return_value=np.random.randn(16000).astype(np.float32) * 0.1)
        preprocessor.preprocess = AsyncMock(return_value=(
            np.random.randn(16000).astype(np.float32) * 0.1,
            QualityMetrics(snr_db=20.0, rms_energy=0.05, clipping_detected=False, spectral_flatness=0.3)
        ))
        preprocessor.calculate_quality_metrics = AsyncMock(return_value=QualityMetrics(
            snr_db=20.0,
            rms_energy=0.05,
            clipping_detected=False,
            spectral_flatness=0.3
        ))
        return preprocessor
    
    @pytest.fixture
    def mock_asr_service(self):
        """Create mock ASR service."""
        asr = Mock(spec=IASRService)
        asr.transcribe = AsyncMock(return_value={
            "text": "Test transcription",
            "language": "de",
            "confidence": 0.95
        })
        return asr
    
    @pytest.fixture
    def mock_logger(self):
        """Create mock logger."""
        logger = Mock(spec=ILogger)
        logger.info = Mock()
        logger.error = Mock()
        logger.warning = Mock()
        return logger
    
    @pytest.fixture
    def service(self, mock_preprocessor, mock_asr_service, mock_logger):
        """Create AudioAnalysisService instance."""
        return AudioAnalysisService(
            preprocessor=mock_preprocessor,
            asr_service=mock_asr_service,
            logger=mock_logger
        )
    
    @pytest.mark.asyncio
    async def test_analyze_audio_success(self, service, clean_speech_audio, mock_preprocessor, mock_asr_service):
        """Should analyze audio successfully."""
        result = await service.analyze_audio(
            audio_data=clean_speech_audio,
            language="de",
            apply_noise_reduction=True
        )
        
        assert isinstance(result, AudioAnalysisResult)
        assert result.transcription == "Test transcription"
        assert result.language == "de"
        assert result.confidence == 0.95
        assert result.quality_metrics is not None
        assert result.processing_time_ms > 0
        
        # Verify preprocessor called
        mock_preprocessor.convert_to_wav.assert_called_once()
        mock_preprocessor.preprocess.assert_called_once()
        
        # Verify ASR called
        mock_asr_service.transcribe.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_analyze_audio_without_noise_reduction(self, service, clean_speech_audio, mock_preprocessor):
        """Should analyze audio without noise reduction."""
        result = await service.analyze_audio(
            audio_data=clean_speech_audio,
            language="de",
            apply_noise_reduction=False
        )
        
        assert isinstance(result, AudioAnalysisResult)
        
        # Verify preprocess called with correct flag
        call_args = mock_preprocessor.preprocess.call_args
        assert call_args[1]["apply_noise_reduction"] is False
    
    @pytest.mark.asyncio
    async def test_analyze_audio_stream_success(self, service, audio_numpy_clean, mock_preprocessor, mock_asr_service):
        """Should analyze audio stream successfully."""
        result = await service.analyze_audio_stream(
            audio_numpy=audio_numpy_clean,
            sample_rate=16000,
            language="de",
            apply_noise_reduction=True
        )
        
        assert isinstance(result, AudioAnalysisResult)
        assert result.transcription == "Test transcription"
        
        # Should skip convert_to_wav for stream
        mock_preprocessor.convert_to_wav.assert_not_called()
        
        # Should call preprocess
        mock_preprocessor.preprocess.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_calculate_quality_only(self, service, clean_speech_audio, mock_preprocessor, mock_asr_service):
        """Should calculate quality without transcription."""
        result = await service.calculate_quality_only(audio_data=clean_speech_audio)
        
        assert isinstance(result, AudioAnalysisResult)
        assert result.transcription == ""  # No transcription
        assert result.quality_metrics is not None
        
        # Should convert and calculate metrics
        mock_preprocessor.convert_to_wav.assert_called_once()
        mock_preprocessor.calculate_quality_metrics.assert_called_once()
        
        # Should NOT call ASR
        mock_asr_service.transcribe.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_add_quality_warnings_low_snr_critical(self, service):
        """Should add critical warning for very low SNR."""
        metrics = QualityMetrics(snr_db=8.0, rms_energy=0.05, clipping_detected=False, spectral_flatness=0.3)
        result = AudioAnalysisResult(
            transcription="Test",
            quality_metrics=metrics,
            warnings=[],
            language="de",
            confidence=0.9,
            processing_time_ms=100
        )
        
        service._add_quality_warnings(result)
        
        assert len(result.warnings) == 1
        assert result.warnings[0].type == QualityWarningType.LOW_SNR
        assert result.warnings[0].severity == "critical"
        assert "sehr niedrig" in result.warnings[0].message.lower()
    
    @pytest.mark.asyncio
    async def test_add_quality_warnings_low_snr_warning(self, service):
        """Should add warning for moderately low SNR."""
        metrics = QualityMetrics(snr_db=12.0, rms_energy=0.05, clipping_detected=False, spectral_flatness=0.3)
        result = AudioAnalysisResult(
            transcription="Test",
            quality_metrics=metrics,
            warnings=[],
            language="de",
            confidence=0.9,
            processing_time_ms=100
        )
        
        service._add_quality_warnings(result)
        
        assert len(result.warnings) == 1
        assert result.warnings[0].type == QualityWarningType.LOW_SNR
        assert result.warnings[0].severity == "warning"
        assert "niedrig" in result.warnings[0].message.lower()
    
    @pytest.mark.asyncio
    async def test_add_quality_warnings_clipping(self, service):
        """Should add critical warning for clipping."""
        metrics = QualityMetrics(snr_db=20.0, rms_energy=0.05, clipping_detected=True, spectral_flatness=0.3)
        result = AudioAnalysisResult(
            transcription="Test",
            quality_metrics=metrics,
            warnings=[],
            language="de",
            confidence=0.9,
            processing_time_ms=100
        )
        
        service._add_quality_warnings(result)
        
        assert any(w.type == QualityWarningType.CLIPPING_DETECTED for w in result.warnings)
        clipping_warning = next(w for w in result.warnings if w.type == QualityWarningType.CLIPPING_DETECTED)
        assert clipping_warning.severity == "critical"
        assert "verzerrung" in clipping_warning.message.lower()
    
    @pytest.mark.asyncio
    async def test_add_quality_warnings_low_energy(self, service):
        """Should add warning for low energy."""
        metrics = QualityMetrics(snr_db=20.0, rms_energy=0.015, clipping_detected=False, spectral_flatness=0.3)
        result = AudioAnalysisResult(
            transcription="Test",
            quality_metrics=metrics,
            warnings=[],
            language="de",
            confidence=0.9,
            processing_time_ms=100
        )
        
        service._add_quality_warnings(result)
        
        assert any(w.type == QualityWarningType.LOW_ENERGY for w in result.warnings)
        energy_warning = next(w for w in result.warnings if w.type == QualityWarningType.LOW_ENERGY)
        assert energy_warning.severity == "warning"
        assert "lautstärke" in energy_warning.message.lower()
    
    @pytest.mark.asyncio
    async def test_add_quality_warnings_high_noise(self, service):
        """Should add warning for high spectral flatness (noise)."""
        metrics = QualityMetrics(snr_db=20.0, rms_energy=0.05, clipping_detected=False, spectral_flatness=0.6)
        result = AudioAnalysisResult(
            transcription="Test",
            quality_metrics=metrics,
            warnings=[],
            language="de",
            confidence=0.9,
            processing_time_ms=100
        )
        
        service._add_quality_warnings(result)
        
        assert any(w.type == QualityWarningType.HIGH_NOISE for w in result.warnings)
        noise_warning = next(w for w in result.warnings if w.type == QualityWarningType.HIGH_NOISE)
        assert noise_warning.severity == "warning"
        assert "rauschen" in noise_warning.message.lower()
    
    @pytest.mark.asyncio
    async def test_add_quality_warnings_multiple(self, service):
        """Should add multiple warnings for poor quality audio."""
        metrics = QualityMetrics(snr_db=8.0, rms_energy=0.015, clipping_detected=True, spectral_flatness=0.6)
        result = AudioAnalysisResult(
            transcription="Test",
            quality_metrics=metrics,
            warnings=[],
            language="de",
            confidence=0.9,
            processing_time_ms=100
        )
        
        service._add_quality_warnings(result)
        
        # Should have warnings for: low SNR, clipping, low energy, high noise
        assert len(result.warnings) == 4
        warning_types = {w.type for w in result.warnings}
        assert QualityWarningType.LOW_SNR in warning_types
        assert QualityWarningType.CLIPPING_DETECTED in warning_types
        assert QualityWarningType.LOW_ENERGY in warning_types
        assert QualityWarningType.HIGH_NOISE in warning_types
    
    @pytest.mark.asyncio
    async def test_quality_ok_assessment(self, service, clean_speech_audio, mock_preprocessor):
        """Should correctly assess quality_ok flag."""
        # Set up good quality metrics
        mock_preprocessor.preprocess.return_value = (
            np.random.randn(16000).astype(np.float32) * 0.1,
            QualityMetrics(snr_db=20.0, rms_energy=0.05, clipping_detected=False, spectral_flatness=0.3)
        )
        
        result = await service.analyze_audio(
            audio_data=clean_speech_audio,
            language="de",
            apply_noise_reduction=True
        )
        
        assert result.is_acceptable() is True
        assert len(result.warnings) == 0
    
    @pytest.mark.asyncio
    async def test_quality_not_ok_assessment(self, service, clean_speech_audio, mock_preprocessor):
        """Should correctly assess quality_ok=False for poor audio."""
        # Set up poor quality metrics
        mock_preprocessor.preprocess.return_value = (
            np.random.randn(16000).astype(np.float32) * 0.1,
            QualityMetrics(snr_db=5.0, rms_energy=0.005, clipping_detected=True, spectral_flatness=0.7)
        )
        
        result = await service.analyze_audio(
            audio_data=clean_speech_audio,
            language="de",
            apply_noise_reduction=True
        )
        
        assert result.is_acceptable() is False
        assert len(result.warnings) > 0
    
    @pytest.mark.asyncio
    async def test_high_quality_assessment(self, service, clean_speech_audio, mock_preprocessor, mock_asr_service):
        """Should correctly identify high quality recordings."""
        # Set up excellent quality + high confidence
        mock_preprocessor.preprocess.return_value = (
            np.random.randn(16000).astype(np.float32) * 0.1,
            QualityMetrics(snr_db=25.0, rms_energy=0.1, clipping_detected=False, spectral_flatness=0.2)
        )
        mock_asr_service.transcribe.return_value = {
            "text": "Test",
            "language": "de",
            "confidence": 0.95
        }
        
        result = await service.analyze_audio(
            audio_data=clean_speech_audio,
            language="de",
            apply_noise_reduction=True
        )
        
        assert result.is_high_quality() is True
