class DomainException(Exception):
    """Base exceptions for the domain layer."""
    pass

class DomainError(Exception):
    """Base class for all domain errors."""
    pass


class ValidationError(DomainError):
    """Raised when domain validation fails."""
    pass
