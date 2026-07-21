"""
SQLAlchemy implementation of Role repository.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.entities.role import Role as RoleEntity
from src.core.ports.repositories.role_repository import IRoleRepository
from src.infrastructure.persistence.sqla.models.role import Role as RoleModel, user_roles
from src.infrastructure.persistence.sqla.models.permission import role_permissions


class RoleRepository(IRoleRepository):
    """SQLAlchemy implementation of Role repository."""
    
    def __init__(self, session: AsyncSession):
        self._session = session
    
    async def create(self, role: RoleEntity) -> RoleEntity:
        """Create a new role."""
        model = RoleModel(
            id=role.id,
            name=role.name,
            display_name=role.display_name,
            description=role.description,
            is_system_role=role.is_system_role,
            created_at=role.created_at,
            updated_at=role.updated_at,
        )
        
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model, ["permissions"])
        
        return self._to_entity(model)
    
    async def get_by_id(self, role_id: UUID) -> Optional[RoleEntity]:
        """Get a role by ID."""
        result = await self._session.execute(
            select(RoleModel)
            .options(selectinload(RoleModel.permissions))
            .where(RoleModel.id == role_id)
        )
        model = result.scalar_one_or_none()
        
        return self._to_entity(model) if model else None
    
    async def get_by_name(self, name: str) -> Optional[RoleEntity]:
        """Get a role by name."""
        result = await self._session.execute(
            select(RoleModel)
            .options(selectinload(RoleModel.permissions))
            .where(RoleModel.name == name)
        )
        model = result.scalar_one_or_none()
        
        return self._to_entity(model) if model else None
    
    async def get_all(self) -> list[RoleEntity]:
        """Get all roles."""
        result = await self._session.execute(
            select(RoleModel)
            .options(selectinload(RoleModel.permissions))
            .order_by(RoleModel.name)
        )
        models = result.scalars().all()
        
        return [self._to_entity(model) for model in models]
    
    async def get_user_roles(self, user_id: UUID) -> list[RoleEntity]:
        """Get all roles assigned to a user."""
        result = await self._session.execute(
            select(RoleModel)
            .options(selectinload(RoleModel.permissions))
            .join(user_roles, RoleModel.id == user_roles.c.role_id)
            .where(user_roles.c.user_id == user_id)
        )
        models = result.scalars().all()
        
        return [self._to_entity(model) for model in models]
    
    async def update(self, role: RoleEntity) -> RoleEntity:
        """Update an existing role."""
        result = await self._session.execute(
            select(RoleModel).where(RoleModel.id == role.id)
        )
        model = result.scalar_one()
        
        model.display_name = role.display_name
        model.description = role.description
        model.updated_at = datetime.now()
        
        await self._session.flush()
        await self._session.refresh(model, ["permissions"])
        
        return self._to_entity(model)
    
    async def delete(self, role_id: UUID) -> bool:
        """Delete a role."""
        result = await self._session.execute(
            delete(RoleModel).where(RoleModel.id == role_id)
        )
        
        return result.rowcount > 0
    
    async def assign_to_user(
        self,
        user_id: UUID,
        role_id: UUID,
        assigned_by: Optional[UUID] = None
    ) -> bool:
        """Assign a role to a user."""
        # Check if already assigned
        existing = await self._session.execute(
            select(user_roles).where(
                user_roles.c.user_id == user_id,
                user_roles.c.role_id == role_id,
            )
        )
        
        if existing.first() is not None:
            return False
        
        # Insert new assignment
        await self._session.execute(
            user_roles.insert().values(
                user_id=user_id,
                role_id=role_id,
                assigned_by=assigned_by,
                assigned_at=datetime.now(),
            )
        )
        
        return True
    
    async def remove_from_user(self, user_id: UUID, role_id: UUID) -> bool:
        """Remove a role from a user."""
        result = await self._session.execute(
            delete(user_roles).where(
                user_roles.c.user_id == user_id,
                user_roles.c.role_id == role_id,
            )
        )
        
        return result.rowcount > 0
    
    async def add_permission(self, role_id: UUID, permission_id: UUID) -> bool:
        """Add a permission to a role."""
        # Check if already assigned
        existing = await self._session.execute(
            select(role_permissions).where(
                role_permissions.c.role_id == role_id,
                role_permissions.c.permission_id == permission_id,
            )
        )
        
        if existing.first() is not None:
            return False
        
        # Insert new assignment
        await self._session.execute(
            role_permissions.insert().values(
                role_id=role_id,
                permission_id=permission_id,
                granted_at=datetime.now(),
            )
        )
        
        return True
    
    async def remove_permission(self, role_id: UUID, permission_id: UUID) -> bool:
        """Remove a permission from a role."""
        result = await self._session.execute(
            delete(role_permissions).where(
                role_permissions.c.role_id == role_id,
                role_permissions.c.permission_id == permission_id,
            )
        )
        
        return result.rowcount > 0
    
    def _to_entity(self, model: RoleModel) -> RoleEntity:
        """Convert SQLAlchemy model to domain entity."""
        return RoleEntity(
            id=model.id,
            name=model.name,
            display_name=model.display_name,
            description=model.description,
            is_system_role=model.is_system_role,
            created_at=model.created_at,
            updated_at=model.updated_at,
            permissions=[perm.name for perm in model.permissions],
        )
