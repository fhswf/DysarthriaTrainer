"""
Audio Analysis Domain Entity

This module defines the core domain entity for audio analysis results.
Part of the Core layer - contains pure domain logic with no external dependencies.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class QualityMetrics:
    """Audio quality metrics for preprocessing validation."""
    
    snr_db: Optional[float] = None  # Signal-to-Noise Ratio in dB
    rms_energy: Optional[float] = None  # Root Mean Square energy level
    clipping_detected: bool = False  # Whether audio clipping was detected
    spectral_flatness: Optional[float] = None  # Measure of noise-like vs tone-like
    
    def is_acceptable(self) -> bool:
        """
        Determine if audio quality meets minimum acceptable standards.
        
        Returns:
            bool: True if quality is acceptable, False otherwise
        """
        # SNR should be > 10dB for acceptable quality
        if self.snr_db is not None and self.snr_db < 10.0:
            return False
        
        # No clipping should be present
        if self.clipping_detected:
            return False
        
        # RMS energy should be in reasonable range (not too quiet)
        if self.rms_energy is not None and self.rms_energy < 0.01:
            return False
        
        return True


@dataclass
class AudioAnalysisResult:
    """
    Domain entity representing the complete result of audio analysis.
    
    This entity encapsulates:
    - Transcription text from speech recognition
    - Quality metrics from preprocessing
    - Processing warnings and metadata
    - Language detection information
    """
    
    transcription: str
    quality_metrics: QualityMetrics
    language: str = "de"  # Default to German for speech therapy
    confidence: Optional[float] = None  # Transcription confidence score
    processing_time_ms: Optional[float] = None  # Total processing duration
    warnings: list[str] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    def has_warnings(self) -> bool:
        """Check if analysis produced any warnings."""
        return len(self.warnings) > 0
    
    def is_high_quality(self) -> bool:
        """
        Determine if both transcription and audio quality are high.
        
        Returns:
            bool: True if quality and confidence are high, False otherwise
        """
        quality_ok = self.quality_metrics.is_acceptable()
        confidence_ok = self.confidence is None or self.confidence > 0.8
        return quality_ok and confidence_ok
    
    def add_warning(self, warning: str) -> None:
        """Add a processing warning to the result."""
        if warning not in self.warnings:
            self.warnings.append(warning)
