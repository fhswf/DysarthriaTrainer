"""Exceptions for when entities are not found."""

from uuid import UUID
from src.core.exceptions.base import DomainError


class NotFoundError(DomainError):
    """Base exception for entity not found errors."""
    
    def __init__(self, entity_name: str, identifier: str | UUID):
        """
        Args:
            entity_name: Name of the entity type (e.g., 'User')
            identifier: ID or unique identifier of the entity
        """
        self.entity_name = entity_name
        self.identifier = identifier
        message = f"{entity_name} with id '{identifier}' not found"
        super().__init__(message)


class UserNotFoundError(NotFoundError):
    """Raised when a user is not found."""
    
    def __init__(self, identifier: str | UUID):
        """
        Args:
            identifier: User ID or username
        """
        super().__init__("User", identifier)
