from abc import abstractmethod
from typing import overload, Protocol, runtime_checkable
import numpy as np

from src.core.value_objects.phoneme_recognition_result import PhonemeRecognitionResult


@runtime_checkable
class IPhonemeRecognitionService(Protocol):
    """Interface for phoneme recognition."""

    @abstractmethod
    async def predict(self, audio: np.ndarray, sampling_rate: int = 16_000) -> PhonemeRecognitionResult:
        """Predict phonemes from audio data."""
        ...
