"""
JWT Handler interface for token operations.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional
from uuid import UUID


class IJWTHandler(ABC):
    """Interface for JWT token generation and validation."""
    
    @abstractmethod
    def create_access_token(
        self,
        user_id: UUID,
        email: str,
        roles: list[str],
        permissions: list[str],
        expires_delta: int | None = None
    ) -> str:
        """
        Create a JWT access token.
        
        Args:
            user_id: User's unique identifier
            email: User's email address
            roles: List of role names assigned to the user
            permissions: List of permission names the user has
            expires_delta: Optional custom expiration time in seconds
            
        Returns:
            Encoded JWT access token string
        """
        pass
    
    @abstractmethod
    def create_refresh_token(
        self,
        user_id: UUID,
        expires_delta: int | None = None
    ) -> tuple[str, str]:
        """
        Create a JWT refresh token.
        
        Args:
            user_id: User's unique identifier
            expires_delta: Optional custom expiration time in seconds
            
        Returns:
            Tuple of (encoded JWT refresh token string, JTI)
        """
        pass
    
    @abstractmethod
    def verify_access_token(self, token: str) -> dict:
        """
        Verify and decode a JWT access token.
        
        Args:
            token: JWT token string to verify
            
        Returns:
            Decoded token payload as dictionary
            
        Raises:
            TokenExpiredError: If token has expired
            TokenInvalidError: If token is invalid or malformed
        """
        pass
    
    @abstractmethod
    def verify_refresh_token(self, token: str) -> dict:
        """
        Verify and decode a JWT refresh token.
        
        Args:
            token: JWT token string to verify
            
        Returns:
            Decoded token payload as dictionary
            
        Raises:
            TokenExpiredError: If token has expired
            TokenInvalidError: If token is invalid or malformed
        """
        pass
    
    @abstractmethod
    def decode_token(self, token: str, verify: bool = True) -> dict:
        """
        Decode a JWT token without verification (for inspection).
        
        Args:
            token: JWT token string to decode
            verify: Whether to verify the token signature
            
        Returns:
            Decoded token payload as dictionary
            
        Raises:
            TokenInvalidError: If token is malformed
        """
        pass
    
    @abstractmethod
    def get_token_expiry(self, token: str) -> datetime:
        """
        Get the expiration time of a token.
        
        Args:
            token: JWT token string
            
        Returns:
            Expiration datetime
            
        Raises:
            TokenInvalidError: If token is malformed
        """
        pass
    
    @abstractmethod
    def is_token_expired(self, token: str) -> bool:
        """
        Check if a token has expired.
        
        Args:
            token: JWT token string
            
        Returns:
            True if token has expired, False otherwise
        """
        pass
    
    @abstractmethod
    def extract_user_id(self, token: str) -> UUID:
        """
        Extract user ID from a token.
        
        Args:
            token: JWT token string
            
        Returns:
            User ID from token
            
        Raises:
            TokenInvalidError: If token is malformed or missing user_id
        """
        pass
    
    @abstractmethod
    def extract_jti(self, token: str) -> str:
        """
        Extract JTI (JWT ID) from a token.
        
        Args:
            token: JWT token string
            
        Returns:
            JTI from token
            
        Raises:
            TokenInvalidError: If token is malformed or missing jti
        """
        pass
    
    @abstractmethod
    def hash_token(self, token: str) -> str:
        """
        Create a hash of a token for secure storage.
        
        Args:
            token: JWT token string to hash
            
        Returns:
            Hashed token string
        """
        pass
