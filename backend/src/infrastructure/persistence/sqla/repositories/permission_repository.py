"""
SQLAlchemy implementation of Permission repository.
"""

from typing import Optional
from uuid import UUID

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.entities.permission import Permission as PermissionEntity
from src.core.ports.repositories.permission_repository import IPermissionRepository
from src.infrastructure.persistence.sqla.models.permission import Permission as PermissionModel, role_permissions
from src.infrastructure.persistence.sqla.models.role import Role, user_roles


class PermissionRepository(IPermissionRepository):
    """SQLAlchemy implementation of Permission repository."""
    
    def __init__(self, session: AsyncSession):
        self._session = session
    
    async def create(self, permission: PermissionEntity) -> PermissionEntity:
        """Create a new permission."""
        model = PermissionModel(
            id=permission.id,
            name=permission.name,
            resource=permission.resource,
            action=permission.action,
            description=permission.description,
            created_at=permission.created_at,
        )
        
        self._session.add(model)
        await self._session.flush()
        
        return self._to_entity(model)
    
    async def get_by_id(self, permission_id: UUID) -> Optional[PermissionEntity]:
        """Get a permission by ID."""
        result = await self._session.execute(
            select(PermissionModel).where(PermissionModel.id == permission_id)
        )
        model = result.scalar_one_or_none()
        
        return self._to_entity(model) if model else None
    
    async def get_by_name(self, name: str) -> Optional[PermissionEntity]:
        """Get a permission by name."""
        result = await self._session.execute(
            select(PermissionModel).where(PermissionModel.name == name)
        )
        model = result.scalar_one_or_none()
        
        return self._to_entity(model) if model else None
    
    async def get_all(self) -> list[PermissionEntity]:
        """Get all permissions."""
        result = await self._session.execute(
            select(PermissionModel).order_by(PermissionModel.name)
        )
        models = result.scalars().all()
        
        return [self._to_entity(model) for model in models]
    
    async def get_by_resource(self, resource: str) -> list[PermissionEntity]:
        """Get all permissions for a specific resource."""
        result = await self._session.execute(
            select(PermissionModel)
            .where(PermissionModel.resource == resource)
            .order_by(PermissionModel.action)
        )
        models = result.scalars().all()
        
        return [self._to_entity(model) for model in models]
    
    async def get_role_permissions(self, role_id: UUID) -> list[PermissionEntity]:
        """Get all permissions assigned to a role."""
        result = await self._session.execute(
            select(PermissionModel)
            .join(role_permissions)
            .join(Role)
            .where(Role.id == role_id)
        )
        models = result.scalars().all()
        
        return [self._to_entity(model) for model in models]
    
    async def get_user_permissions(self, user_id: UUID) -> list[PermissionEntity]:
        """Get all permissions assigned to a user (via their roles)."""
        from src.infrastructure.persistence.sqla.models.user import User
        
        result = await self._session.execute(
            select(PermissionModel)
            .join(role_permissions)
            .join(Role)
            .join(user_roles)
            .join(User)
            .where(User.id == user_id)
            .distinct()
        )
        models = result.scalars().all()
        
        return [self._to_entity(model) for model in models]
    
    async def update(self, permission: PermissionEntity) -> PermissionEntity:
        """Update an existing permission."""
        result = await self._session.execute(
            select(PermissionModel).where(PermissionModel.id == permission.id)
        )
        model = result.scalar_one()
        
        model.description = permission.description
        
        await self._session.flush()
        
        return self._to_entity(model)
    
    async def delete(self, permission_id: UUID) -> bool:
        """Delete a permission."""
        result = await self._session.execute(
            delete(PermissionModel).where(PermissionModel.id == permission_id)
        )
        
        return result.rowcount > 0
    
    async def user_has_permission(self, user_id: UUID, permission_name: str) -> bool:
        """Check if a user has a specific permission."""
        from src.infrastructure.persistence.sqla.models.user import User
        
        result = await self._session.execute(
            select(PermissionModel)
            .join(role_permissions)
            .join(Role)
            .join(user_roles)
            .join(User)
            .where(
                User.id == user_id,
                PermissionModel.name == permission_name,
            )
        )
        
        return result.scalar_one_or_none() is not None
    
    def _to_entity(self, model: PermissionModel) -> PermissionEntity:
        """Convert SQLAlchemy model to domain entity."""
        return PermissionEntity(
            id=model.id,
            name=model.name,
            resource=model.resource,
            action=model.action,
            description=model.description,
            created_at=model.created_at,
        )
