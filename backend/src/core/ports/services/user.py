from abc import ABC, abstractmethod
from uuid import UUID

from src.core.entities.user import User
from src.core.exceptions.user import UsernameAlreadyExistsError


class IUserService(ABC):
    """Interface for user service operations."""
    
    @abstractmethod
    async def create_user(self, username: str, password: str, email: str) -> User:
        """Create a new user.
        
        Args:
            username: Unique username
            password: Plain text password (will be hashed)
            email: User's email address
            
        Returns:
            Created user entity
            
        Raises:
            UsernameAlreadyExistsError: If username already exists
        """
        ...
    
    @abstractmethod
    async def get_user_by_id(self, user_id: UUID) -> User | None:
        """Get user by ID.
        
        Args:
            user_id: User's UUID
            
        Returns:
            User if found, None otherwise
        """
        ...
    
    @abstractmethod
    async def get_user_by_email(self, email: str) -> User | None:
        """Get user by email.
        
        Args:
            email: User's email address
            
        Returns:
            User if found, None otherwise
        """
        ...
    
    @abstractmethod
    async def get_users(self) -> list[User]:
        """Get all users.
        
        Returns:
            List of all users
        """
        ...
    
    @abstractmethod
    async def update_user(self, user_id: UUID, **updates) -> User:
        """Update an existing user.
        
        Args:
            user_id: UUID of user to update
            **updates: Fields to update (email, full_name, etc.)
            
        Returns:
            Updated user entity
            
        Raises:
            UserNotFoundError: If user does not exist
        """
        ...
    
    @abstractmethod
    async def delete_user(self, user_id: UUID) -> bool:
        """Delete a user.
        
        Args:
            user_id: UUID of user to delete
            
        Returns:
            True if deleted, False if not found
        """
        ...
