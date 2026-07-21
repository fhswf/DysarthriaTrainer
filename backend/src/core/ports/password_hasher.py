"""
Password hashing interface.
"""

from abc import ABC, abstractmethod


class IPasswordHasher(ABC):
    """Interface for password hashing operations."""
    
    @abstractmethod
    def hash_password(self, password: str) -> str:
        """
        Hash a password.
        
        Args:
            password: Plain text password
            
        Returns:
            Hashed password string
        """
        pass
    
    @abstractmethod
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """
        Verify a password against a hash.
        
        Args:
            password: Plain text password to verify
            hashed_password: Hashed password to compare against
            
        Returns:
            True if password matches hash, False otherwise
        """
        pass
    
    @abstractmethod
    def needs_rehash(self, hashed_password: str) -> bool:
        """
        Check if a hashed password needs to be rehashed (e.g., due to updated settings).
        
        Args:
            hashed_password: Hashed password to check
            
        Returns:
            True if password should be rehashed, False otherwise
        """
        pass
