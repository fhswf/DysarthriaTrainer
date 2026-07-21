"""
Domain entity for SecurityEvent.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID


@dataclass
class SecurityEvent:
    """
    SecurityEvent entity for audit logging of security-related events.
    
    Attributes:
        id: Unique identifier
        user_id: User who triggered this event (None for anonymous)
        event_type: Type of security event (e.g., 'login_success', 'login_failed')
        ip_address: IP address that triggered this event
        user_agent: User agent that triggered this event
        success: Whether the event was successful
        event_metadata: Additional event-specific data (JSON)
        created_at: When this event occurred
    """
    
    id: UUID
    event_type: str
    ip_address: str
    success: bool
    user_id: Optional[UUID] = None
    user_agent: Optional[str] = None
    event_metadata: Optional[dict] = None
    created_at: datetime = field(default_factory=datetime.now)
    
    @classmethod
    def login_success(
        cls,
        user_id: UUID,
        ip_address: str,
        user_agent: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> "SecurityEvent":
        """Create a successful login event."""
        from uuid import uuid4
        return cls(
            id=uuid4(),
            user_id=user_id,
            event_type="login_success",
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            event_metadata=metadata,
        )
    
    @classmethod
    def login_failed(
        cls,
        ip_address: str,
        user_agent: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> "SecurityEvent":
        """Create a failed login event."""
        from uuid import uuid4
        return cls(
            id=uuid4(),
            event_type="login_failed",
            ip_address=ip_address,
            user_agent=user_agent,
            success=False,
            event_metadata=metadata,
        )
    
    @classmethod
    def password_reset_requested(
        cls,
        user_id: UUID,
        ip_address: str,
        user_agent: Optional[str] = None
    ) -> "SecurityEvent":
        """Create a password reset requested event."""
        from uuid import uuid4
        return cls(
            id=uuid4(),
            user_id=user_id,
            event_type="password_reset_requested",
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
        )
    
    @classmethod
    def account_locked(
        cls,
        user_id: UUID,
        ip_address: str,
        user_agent: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> "SecurityEvent":
        """Create an account locked event."""
        from uuid import uuid4
        return cls(
            id=uuid4(),
            user_id=user_id,
            event_type="account_locked",
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            event_metadata=metadata,
        )
