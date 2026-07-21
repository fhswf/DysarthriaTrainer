"""
Unit tests for AudioAnalysisResult domain entity.

Tests pure domain logic without external dependencies.
"""

from datetime import datetime

import pytest

from core.entities.audio_analysis import AudioAnalysisResult, QualityMetrics


class TestQualityMetrics:
    """Test suite for QualityMetrics dataclass."""
    
    def test_acceptable_quality_high_snr(self):
        """Quality metrics with high SNR should be acceptable."""
        metrics = QualityMetrics(
            snr_db=20.0,
            rms_energy=0.5,
            clipping_detected=False,
            spectral_flatness=0.3,
        )
        assert metrics.is_acceptable() is True
    
    def test_unacceptable_quality_low_snr(self):
        """Quality metrics with low SNR should be unacceptable."""
        metrics = QualityMetrics(
            snr_db=5.0,  # Below 10dB threshold
            rms_energy=0.5,
            clipping_detected=False,
        )
        assert metrics.is_acceptable() is False
    
    def test_unacceptable_quality_clipping(self):
        """Quality metrics with clipping should be unacceptable."""
        metrics = QualityMetrics(
            snr_db=20.0,
            rms_energy=0.5,
            clipping_detected=True,  # Clipping detected
        )
        assert metrics.is_acceptable() is False
    
    def test_unacceptable_quality_low_energy(self):
        """Quality metrics with low RMS energy should be unacceptable."""
        metrics = QualityMetrics(
            snr_db=20.0,
            rms_energy=0.005,  # Below 0.01 threshold
            clipping_detected=False,
        )
        assert metrics.is_acceptable() is False
    
    def test_acceptable_quality_none_values(self):
        """Quality metrics with None values should be acceptable if no issues."""
        metrics = QualityMetrics(
            snr_db=None,
            rms_energy=None,
            clipping_detected=False,
        )
        assert metrics.is_acceptable() is True


class TestAudioAnalysisResult:
    """Test suite for AudioAnalysisResult domain entity."""
    
    def test_create_basic_result(self):
        """Should create basic audio analysis result."""
        metrics = QualityMetrics(snr_db=15.0, rms_energy=0.3)
        result = AudioAnalysisResult(
            transcription="Hallo Welt",
            quality_metrics=metrics,
        )
        
        assert result.transcription == "Hallo Welt"
        assert result.quality_metrics.snr_db == 15.0
        assert result.language == "de"  # Default language
        assert isinstance(result.timestamp, datetime)
    
    def test_has_warnings_empty(self):
        """Should return False when no warnings exist."""
        metrics = QualityMetrics()
        result = AudioAnalysisResult(
            transcription="Test",
            quality_metrics=metrics,
        )
        assert result.has_warnings() is False
    
    def test_has_warnings_with_warnings(self):
        """Should return True when warnings exist."""
        metrics = QualityMetrics()
        result = AudioAnalysisResult(
            transcription="Test",
            quality_metrics=metrics,
            warnings=["Low audio quality"],
        )
        assert result.has_warnings() is True
    
    def test_add_warning(self):
        """Should add warning to result."""
        metrics = QualityMetrics()
        result = AudioAnalysisResult(
            transcription="Test",
            quality_metrics=metrics,
        )
        
        result.add_warning("Clipping detected")
        assert len(result.warnings) == 1
        assert "Clipping detected" in result.warnings
    
    def test_add_duplicate_warning(self):
        """Should not add duplicate warnings."""
        metrics = QualityMetrics()
        result = AudioAnalysisResult(
            transcription="Test",
            quality_metrics=metrics,
        )
        
        result.add_warning("Clipping detected")
        result.add_warning("Clipping detected")  # Duplicate
        assert len(result.warnings) == 1
    
    def test_is_high_quality_good_audio_and_confidence(self):
        """Should return True for high quality audio and transcription."""
        metrics = QualityMetrics(
            snr_db=20.0,
            rms_energy=0.5,
            clipping_detected=False,
        )
        result = AudioAnalysisResult(
            transcription="Test",
            quality_metrics=metrics,
            confidence=0.95,
        )
        assert result.is_high_quality() is True
    
    def test_is_high_quality_poor_audio(self):
        """Should return False for poor audio quality."""
        metrics = QualityMetrics(
            snr_db=5.0,  # Low SNR
            rms_energy=0.5,
            clipping_detected=False,
        )
        result = AudioAnalysisResult(
            transcription="Test",
            quality_metrics=metrics,
            confidence=0.95,
        )
        assert result.is_high_quality() is False
    
    def test_is_high_quality_low_confidence(self):
        """Should return False for low transcription confidence."""
        metrics = QualityMetrics(
            snr_db=20.0,
            rms_energy=0.5,
            clipping_detected=False,
        )
        result = AudioAnalysisResult(
            transcription="Test",
            quality_metrics=metrics,
            confidence=0.5,  # Low confidence
        )
        assert result.is_high_quality() is False
    
    def test_is_high_quality_no_confidence(self):
        """Should return True when confidence is None (not evaluated)."""
        metrics = QualityMetrics(
            snr_db=20.0,
            rms_energy=0.5,
            clipping_detected=False,
        )
        result = AudioAnalysisResult(
            transcription="Test",
            quality_metrics=metrics,
            confidence=None,
        )
        assert result.is_high_quality() is True
    
    def test_custom_language(self):
        """Should support custom language setting."""
        metrics = QualityMetrics()
        result = AudioAnalysisResult(
            transcription="Hello World",
            quality_metrics=metrics,
            language="en",
        )
        assert result.language == "en"
    
    def test_processing_time_tracking(self):
        """Should track processing time."""
        metrics = QualityMetrics()
        result = AudioAnalysisResult(
            transcription="Test",
            quality_metrics=metrics,
            processing_time_ms=125.5,
        )
        assert result.processing_time_ms == 125.5
