"""
Audio Preprocessing Port (Interface)

This module defines the interface for audio preprocessing operations.
Part of the Core layer - defines contracts that Infrastructure layer must implement.
"""

from abc import ABC, abstractmethod
from typing import Optional

import numpy as np
from numpy.typing import NDArray

from src.core.entities.audio_analysis import QualityMetrics


class IAudioPreprocessor(ABC):
    """
    Interface for audio preprocessing operations.
    
    Implementations must provide:
    - Noise reduction
    - Quality metric calculation
    - Audio format conversion
    """
    
    @abstractmethod
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
            sample_rate: Sample rate in Hz (e.g., 16000)
            apply_noise_reduction: Whether to apply noise reduction
            
        Returns:
            Tuple of (processed_audio, quality_metrics)
            
        Raises:
            AudioProcessingError: If preprocessing fails
        """
        pass
    
    @abstractmethod
    async def reduce_noise(
        self,
        audio_data: NDArray[np.float32],
        sample_rate: int,
    ) -> NDArray[np.float32]:
        """
        Apply noise reduction to audio data.
        
        Args:
            audio_data: Raw audio samples
            sample_rate: Sample rate in Hz
            
        Returns:
            Noise-reduced audio samples
            
        Raises:
            AudioProcessingError: If noise reduction fails
        """
        pass
    
    @abstractmethod
    async def calculate_quality_metrics(
        self,
        audio_data: NDArray[np.float32],
        sample_rate: int,
    ) -> QualityMetrics:
        """
        Calculate quality metrics for audio data.
        
        Args:
            audio_data: Audio samples to analyze
            sample_rate: Sample rate in Hz
            
        Returns:
            QualityMetrics with SNR, RMS, clipping detection, etc.
            
        Raises:
            AudioProcessingError: If metric calculation fails
        """
        pass
    
    @abstractmethod
    async def convert_to_wav(
        self,
        audio_data: bytes,
        output_sample_rate: int = 16000,
    ) -> NDArray[np.float32]:
        """
        Convert audio bytes to WAV format with specified sample rate.
        
        Args:
            audio_data: Raw audio bytes (any format)
            output_sample_rate: Target sample rate in Hz
            
        Returns:
            Audio samples as float32 numpy array
            
        Raises:
            AudioProcessingError: If conversion fails
        """
        pass
