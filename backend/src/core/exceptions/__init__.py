"""Domain exceptions for the core layer."""

from src.core.exceptions.base import DomainError, ValidationError
from src.core.exceptions.entity_not_found import NotFoundError, UserNotFoundError
from src.core.exceptions.entity_already_exists import AlreadyExistsError, UserAlreadyExistsError
from src.core.exceptions.user import UsernameAlreadyExistsError

__all__ = [
    # Base exceptions
    "DomainError",
    "ValidationError",
    # Not found errors
    "NotFoundError",
    "UserNotFoundError",
    # Already exists errors
    "AlreadyExistsError",
    "UserAlreadyExistsError",
    "UsernameAlreadyExistsError",
]
