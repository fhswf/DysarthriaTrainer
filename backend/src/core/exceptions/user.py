"""User-specific domain exceptions.

This module contains exceptions specific to user operations.
For backward compatibility, UsernameAlreadyExistsError is kept but delegates
to the standardized UserAlreadyExistsError.
"""

from src.core.exceptions.entity_already_exists import UserAlreadyExistsError as _UserAlreadyExistsError


class UsernameAlreadyExistsError(_UserAlreadyExistsError):
    """Raised when a username already exists.
    
    This is a convenience exception that wraps UserAlreadyExistsError
    with the 'username' field specified.
    """
    
    def __init__(self, username: str) -> None:
        """
        Args:
            username: The username that already exists
        """
        super().__init__("username", username)
