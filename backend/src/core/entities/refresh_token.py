"""
Domain entity for RefreshToken.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID


@dataclass
class RefreshToken:
    """
    RefreshToken entity for managing JWT refresh tokens.
    
    Attributes:
        id: Unique identifier
        user_id: User who owns this token
        token_jti: JWT ID (jti claim) of the refresh token
        token_hash: Hashed version of the token for secure storage
        expires_at: When this token expires
        revoked: Whether this token has been revoked
        revoked_at: When this token was revoked
        replaced_by_jti: JTI of the token that replaced this one (for rotation)
        device_info: Information about the device that requested this token
        ip_address: IP address that requested this token
        user_agent: User agent that requested this token
        created_at: When this token was created
    """
    
    id: UUID
    user_id: UUID
    token_jti: str
    token_hash: str
    expires_at: datetime
    revoked: bool = False
    revoked_at: Optional[datetime] = None
    replaced_by_jti: Optional[str] = None
    device_info: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    
    def is_valid(self) -> bool:
        """Check if this token is still valid (not expired, not revoked)."""
        now = datetime.now()
        return not self.revoked and self.expires_at > now
    
    def revoke(self, replaced_by_jti: Optional[str] = None) -> None:
        """
        Revoke this token.
        
        Args:
            replaced_by_jti: JTI of the new token that replaces this one
        """
        self.revoked = True
        self.revoked_at = datetime.now()
        if replaced_by_jti:
            self.replaced_by_jti = replaced_by_jti
    
    def is_expired(self) -> bool:
        """Check if this token has expired."""
        return datetime.now() >= self.expires_at
