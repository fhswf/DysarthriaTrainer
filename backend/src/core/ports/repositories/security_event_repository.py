"""
Repository interface for SecurityEvent entity.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional
from uuid import UUID

from src.core.entities.security_event import SecurityEvent


class ISecurityEventRepository(ABC):
    """Interface for SecurityEvent repository operations."""
    
    @abstractmethod
    async def create(self, security_event: SecurityEvent) -> SecurityEvent:
        """
        Create a new security event.
        
        Args:
            security_event: SecurityEvent entity to create
            
        Returns:
            Created SecurityEvent entity
        """
        pass
    
    @abstractmethod
    async def get_by_id(self, event_id: UUID) -> Optional[SecurityEvent]:
        """
        Get a security event by ID.
        
        Args:
            event_id: Event ID to search for
            
        Returns:
            SecurityEvent entity if found, None otherwise
        """
        pass
    
    @abstractmethod
    async def get_by_user_id(
        self,
        user_id: UUID,
        limit: int = 100,
        offset: int = 0
    ) -> list[SecurityEvent]:
        """
        Get security events for a specific user.
        
        Args:
            user_id: User ID to search for
            limit: Maximum number of events to return
            offset: Number of events to skip
            
        Returns:
            List of SecurityEvent entities
        """
        pass
    
    @abstractmethod
    async def get_by_event_type(
        self,
        event_type: str,
        limit: int = 100,
        offset: int = 0
    ) -> list[SecurityEvent]:
        """
        Get security events by type.
        
        Args:
            event_type: Event type to search for
            limit: Maximum number of events to return
            offset: Number of events to skip
            
        Returns:
            List of SecurityEvent entities
        """
        pass
    
    @abstractmethod
    async def get_failed_login_attempts(
        self,
        ip_address: str,
        since: datetime
    ) -> int:
        """
        Count failed login attempts from an IP address since a specific time.
        
        Args:
            ip_address: IP address to check
            since: Only count attempts after this time
            
        Returns:
            Number of failed login attempts
        """
        pass
    
    @abstractmethod
    async def get_recent_events(
        self,
        limit: int = 100,
        offset: int = 0,
        user_id: Optional[UUID] = None,
        event_type: Optional[str] = None,
        success: Optional[bool] = None
    ) -> list[SecurityEvent]:
        """
        Get recent security events with optional filtering.
        
        Args:
            limit: Maximum number of events to return
            offset: Number of events to skip
            user_id: Optional user ID filter
            event_type: Optional event type filter
            success: Optional success status filter
            
        Returns:
            List of SecurityEvent entities
        """
        pass
    
    @abstractmethod
    async def delete_old_events(self, older_than: datetime) -> int:
        """
        Delete security events older than a specific date.
        
        Args:
            older_than: Delete events created before this time
            
        Returns:
            Number of events deleted
        """
        pass
