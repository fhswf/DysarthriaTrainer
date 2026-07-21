"""
Repository interface for RefreshToken entity.
"""

from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from src.core.entities.refresh_token import RefreshToken


class IRefreshTokenRepository(ABC):
    """Interface for RefreshToken repository operations."""
    
    @abstractmethod
    async def create(self, refresh_token: RefreshToken) -> RefreshToken:
        """
        Create a new refresh token.
        
        Args:
            refresh_token: RefreshToken entity to create
            
        Returns:
            Created RefreshToken entity
        """
        pass
    
    @abstractmethod
    async def get_by_jti(self, token_jti: str) -> Optional[RefreshToken]:
        """
        Get a refresh token by its JTI.
        
        Args:
            token_jti: JWT ID to search for
            
        Returns:
            RefreshToken entity if found, None otherwise
        """
        pass
    
    @abstractmethod
    async def get_by_user_id(self, user_id: UUID) -> list[RefreshToken]:
        """
        Get all refresh tokens for a user.
        
        Args:
            user_id: User ID to search for
            
        Returns:
            List of RefreshToken entities
        """
        pass
    
    @abstractmethod
    async def revoke(self, token_jti: str, replaced_by_jti: Optional[str] = None) -> bool:
        """
        Revoke a refresh token.
        
        Args:
            token_jti: JWT ID of token to revoke
            replaced_by_jti: Optional JTI of replacement token
            
        Returns:
            True if token was revoked, False if not found
        """
        pass
    
    @abstractmethod
    async def revoke_all_for_user(self, user_id: UUID) -> int:
        """
        Revoke all refresh tokens for a user.
        
        Args:
            user_id: User ID whose tokens should be revoked
            
        Returns:
            Number of tokens revoked
        """
        pass
    
    @abstractmethod
    async def delete_expired(self) -> int:
        """
        Delete all expired refresh tokens.
        
        Returns:
            Number of tokens deleted
        """
        pass
    
    @abstractmethod
    async def is_valid(self, token_jti: str) -> bool:
        """
        Check if a refresh token is valid (exists, not revoked, not expired).
        
        Args:
            token_jti: JWT ID to check
            
        Returns:
            True if token is valid, False otherwise
        """
        pass
