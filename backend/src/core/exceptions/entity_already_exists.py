"""Exceptions for when entities already exist."""

from src.core.exceptions.base import DomainError


class AlreadyExistsError(DomainError):
    """Base exception for entity already exists errors."""
    
    def __init__(self, entity_name: str, field: str, value: str):
        """
        Args:
            entity_name: Name of the entity type (e.g., 'User')
            field: Field that has the duplicate value (e.g., 'email')
            value: The duplicate value
        """
        self.entity_name = entity_name
        self.field = field
        self.value = value
        message = f"{entity_name} with {field} '{value}' already exists"
        super().__init__(message)


class UserAlreadyExistsError(AlreadyExistsError):
    """Raised when a user with the same identifier already exists."""
    
    def __init__(self, field: str, value: str):
        """
        Args:
            field: Field that has the duplicate value (e.g., 'username', 'email')
            value: The duplicate value
        """
        super().__init__("User", field, value)
