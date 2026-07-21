"""Application-level business rule violation exceptions."""

from src.core.exceptions.base import DomainError


class BusinessRuleViolationError(DomainError):
    """Base exception for business rule violations."""
    
    def __init__(self, message: str):
        """
        Args:
            message: Description of the business rule violation
        """
        self.message = message
        super().__init__(message)


class SessionAlreadyCompletedError(BusinessRuleViolationError):
    """Raised when attempting to modify a completed practice session."""
    
    def __init__(self, session_id: str):
        """
        Args:
            session_id: ID of the completed session
        """
        super().__init__(
            f"Cannot modify practice session {session_id} because it is already completed"
        )


class SessionAlreadyAbandonedError(BusinessRuleViolationError):
    """Raised when attempting to modify an abandoned practice session."""
    
    def __init__(self, session_id: str):
        """
        Args:
            session_id: ID of the abandoned session
        """
        super().__init__(
            f"Cannot modify practice session {session_id} because it has been abandoned"
        )


class InvalidSessionStateTransitionError(BusinessRuleViolationError):
    """Raised when attempting an invalid session state transition."""
    
    def __init__(self, current_state: str, attempted_action: str):
        """
        Args:
            current_state: Current state of the session
            attempted_action: Action that was attempted
        """
        super().__init__(
            f"Cannot {attempted_action} a session in {current_state} state"
        )


class AudioSegmentOutOfBoundsError(BusinessRuleViolationError):
    """Raised when audio segment timestamps are invalid."""
    
    def __init__(self, start_ms: int, end_ms: int, recording_duration_ms: int):
        """
        Args:
            start_ms: Segment start timestamp
            end_ms: Segment end timestamp
            recording_duration_ms: Total recording duration
        """
        super().__init__(
            f"Audio segment ({start_ms}ms - {end_ms}ms) exceeds recording duration ({recording_duration_ms}ms)"
        )


class InvalidIterationNumberError(BusinessRuleViolationError):
    """Raised when iteration number is invalid."""
    
    def __init__(self, iteration_number: int):
        """
        Args:
            iteration_number: Invalid iteration number
        """
        super().__init__(
            f"Iteration number must be positive, got {iteration_number}"
        )
