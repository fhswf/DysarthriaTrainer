"""
Audio processing exceptions.

Core layer exceptions for audio analysis and preprocessing operations.
"""

from src.core.exceptions.base import DomainException


class AudioProcessingError(DomainException):
    """
    Exception raised when audio processing operations fail.
    
    Examples:
    - Noise reduction failure
    - Quality metric calculation error
    - Format conversion error
    - Invalid audio data
    """
    
    def __init__(self, message: str = "Audio processing failed"):
        super().__init__(message)
        self.message = message
