"""
SQLAlchemy implementation of SecurityEvent repository.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select, delete, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.entities.security_event import SecurityEvent as SecurityEventEntity
from src.core.ports.repositories.security_event_repository import ISecurityEventRepository
from src.infrastructure.persistence.sqla.models.security_event import SecurityEvent as SecurityEventModel


class SecurityEventRepository(ISecurityEventRepository):
    """SQLAlchemy implementation of SecurityEvent repository."""
    
    def __init__(self, session: AsyncSession):
        self._session = session
    
    async def create(self, security_event: SecurityEventEntity) -> SecurityEventEntity:
        """Create a new security event."""
        model = SecurityEventModel(
            id=security_event.id,
            user_id=security_event.user_id,
            event_type=security_event.event_type,
            ip_address=security_event.ip_address,
            user_agent=security_event.user_agent,
            success=security_event.success,
            event_metadata=security_event.event_metadata,
            created_at=security_event.created_at,
        )
        
        self._session.add(model)
        await self._session.flush()
        
        return self._to_entity(model)
    
    async def get_by_id(self, event_id: UUID) -> Optional[SecurityEventEntity]:
        """Get a security event by ID."""
        result = await self._session.execute(
            select(SecurityEventModel).where(SecurityEventModel.id == event_id)
        )
        model = result.scalar_one_or_none()
        
        return self._to_entity(model) if model else None
    
    async def get_by_user_id(
        self,
        user_id: UUID,
        limit: int = 100,
        offset: int = 0
    ) -> list[SecurityEventEntity]:
        """Get security events for a specific user."""
        result = await self._session.execute(
            select(SecurityEventModel)
            .where(SecurityEventModel.user_id == user_id)
            .order_by(SecurityEventModel.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        models = result.scalars().all()
        
        return [self._to_entity(model) for model in models]
    
    async def get_by_event_type(
        self,
        event_type: str,
        limit: int = 100,
        offset: int = 0
    ) -> list[SecurityEventEntity]:
        """Get security events by type."""
        result = await self._session.execute(
            select(SecurityEventModel)
            .where(SecurityEventModel.event_type == event_type)
            .order_by(SecurityEventModel.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        models = result.scalars().all()
        
        return [self._to_entity(model) for model in models]
    
    async def get_failed_login_attempts(
        self,
        ip_address: str,
        since: datetime
    ) -> int:
        """Count failed login attempts from an IP address since a specific time."""
        result = await self._session.execute(
            select(func.count(SecurityEventModel.id))
            .where(
                and_(
                    SecurityEventModel.event_type == "login_failed",
                    SecurityEventModel.ip_address == ip_address,
                    SecurityEventModel.created_at >= since,
                )
            )
        )
        
        return result.scalar_one()
    
    async def get_recent_events(
        self,
        limit: int = 100,
        offset: int = 0,
        user_id: Optional[UUID] = None,
        event_type: Optional[str] = None,
        success: Optional[bool] = None
    ) -> list[SecurityEventEntity]:
        """Get recent security events with optional filtering."""
        query = select(SecurityEventModel)
        
        filters = []
        if user_id is not None:
            filters.append(SecurityEventModel.user_id == user_id)
        if event_type is not None:
            filters.append(SecurityEventModel.event_type == event_type)
        if success is not None:
            filters.append(SecurityEventModel.success == success)
        
        if filters:
            query = query.where(and_(*filters))
        
        query = query.order_by(SecurityEventModel.created_at.desc()).limit(limit).offset(offset)
        
        result = await self._session.execute(query)
        models = result.scalars().all()
        
        return [self._to_entity(model) for model in models]
    
    async def delete_old_events(self, older_than: datetime) -> int:
        """Delete security events older than a specific date."""
        result = await self._session.execute(
            delete(SecurityEventModel).where(SecurityEventModel.created_at < older_than)
        )
        
        return result.rowcount
    
    def _to_entity(self, model: SecurityEventModel) -> SecurityEventEntity:
        """Convert SQLAlchemy model to domain entity."""
        return SecurityEventEntity(
            id=model.id,
            user_id=model.user_id,
            event_type=model.event_type,
            ip_address=model.ip_address,
            user_agent=model.user_agent,
            success=model.success,
            event_metadata=model.event_metadata,
            created_at=model.created_at,
        )
