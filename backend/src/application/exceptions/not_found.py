"""Application-level not found exceptions for practice sessions and exercise results."""

from uuid import UUID
from src.core.exceptions.entity_not_found import NotFoundError


class PracticeSessionNotFoundError(NotFoundError):
    """Raised when a practice session is not found."""
    
    def __init__(self, identifier: str | UUID):
        """
        Args:
            identifier: Practice session ID
        """
        super().__init__("PracticeSession", identifier)


class ExerciseResultNotFoundError(NotFoundError):
    """Raised when an exercise result is not found."""
    
    def __init__(self, identifier: str | UUID):
        """
        Args:
            identifier: Exercise result ID
        """
        super().__init__("ExerciseResult", identifier)
