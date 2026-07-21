"""
Role-Based Access Control Service for permission and role management.
"""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from src.application.services.base_service import BaseService
from src.core.entities.permission import Permission
from src.core.entities.role import Role
from src.core.exceptions.auth import (
    InsufficientPermissionsError,
    PermissionNotFoundError,
    RoleNotFoundError,
)
from src.core.ports.repositories.permission_repository import IPermissionRepository
from src.core.ports.repositories.role_repository import IRoleRepository


class RBACService(BaseService):
    """Service for role-based access control operations."""
    
    def __init__(
        self,
        role_repository: IRoleRepository,
        permission_repository: IPermissionRepository,
    ):
        self._role_repo = role_repository
        self._permission_repo = permission_repository
    
    # ========== Permission Checking ==========
    
    async def check_permission(
        self,
        user_id: UUID,
        permission_name: str,
        raise_exception: bool = True,
    ) -> bool:
        """
        Check if user has a specific permission.
        
        Args:
            user_id: User ID to check
            permission_name: Permission name (e.g., 'users:read')
            raise_exception: Whether to raise exception if permission denied
            
        Returns:
            True if user has permission, False otherwise
            
        Raises:
            InsufficientPermissionsError: If user lacks permission (when raise_exception=True)
        """
        has_permission = await self._permission_repo.user_has_permission(user_id, permission_name)
        
        if not has_permission and raise_exception:
            raise InsufficientPermissionsError(required_permission=permission_name)
        
        return has_permission
    
    async def check_any_permission(
        self,
        user_id: UUID,
        permission_names: list[str],
        raise_exception: bool = True,
    ) -> bool:
        """
        Check if user has any of the specified permissions.
        
        Args:
            user_id: User ID to check
            permission_names: List of permission names
            raise_exception: Whether to raise exception if all permissions denied
            
        Returns:
            True if user has at least one permission, False otherwise
            
        Raises:
            InsufficientPermissionsError: If user lacks all permissions (when raise_exception=True)
        """
        for permission_name in permission_names:
            if await self._permission_repo.user_has_permission(user_id, permission_name):
                return True
        
        if raise_exception:
            raise InsufficientPermissionsError(
                required_permission=f"One of: {', '.join(permission_names)}"
            )
        
        return False
    
    async def check_all_permissions(
        self,
        user_id: UUID,
        permission_names: list[str],
        raise_exception: bool = True,
    ) -> bool:
        """
        Check if user has all of the specified permissions.
        
        Args:
            user_id: User ID to check
            permission_names: List of permission names
            raise_exception: Whether to raise exception if any permission denied
            
        Returns:
            True if user has all permissions, False otherwise
            
        Raises:
            InsufficientPermissionsError: If user lacks any permission (when raise_exception=True)
        """
        for permission_name in permission_names:
            if not await self._permission_repo.user_has_permission(user_id, permission_name):
                if raise_exception:
                    raise InsufficientPermissionsError(required_permission=permission_name)
                return False
        
        return True
    
    async def get_user_permissions(self, user_id: UUID) -> list[Permission]:
        """
        Get all permissions for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            List of Permission entities
        """
        return await self._permission_repo.get_user_permissions(user_id)
    
    # ========== Role Management ==========
    
    async def get_role(self, role_id: UUID) -> Optional[Role]:
        """
        Get a role by ID.
        
        Args:
            role_id: Role ID
            
        Returns:
            Role entity if found, None otherwise
        """
        return await self._role_repo.get_by_id(role_id)
    
    async def get_role_by_name(self, name: str) -> Optional[Role]:
        """
        Get a role by name.
        
        Args:
            name: Role name
            
        Returns:
            Role entity if found, None otherwise
        """
        return await self._role_repo.get_by_name(name)
    
    async def get_all_roles(self) -> list[Role]:
        """
        Get all roles.
        
        Returns:
            List of all Role entities
        """
        return await self._role_repo.get_all()
    
    async def get_user_roles(self, user_id: UUID) -> list[Role]:
        """
        Get all roles assigned to a user.
        
        Args:
            user_id: User ID
            
        Returns:
            List of Role entities
        """
        return await self._role_repo.get_user_roles(user_id)
    
    async def create_role(
        self,
        name: str,
        display_name: str,
        description: str,
        is_system_role: bool = False,
    ) -> Role:
        """
        Create a new role.
        
        Args:
            name: Role name (unique identifier)
            display_name: Human-readable name
            description: Role description
            is_system_role: Whether this is a system role (cannot be deleted)
            
        Returns:
            Created Role entity
        """
        role = Role(
            id=uuid4(),
            name=name,
            display_name=display_name,
            description=description,
            is_system_role=is_system_role,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            permissions=[],
        )
        
        return await self._role_repo.create(role)
    
    async def update_role(
        self,
        role_id: UUID,
        display_name: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Role:
        """
        Update an existing role.
        
        Args:
            role_id: Role ID to update
            display_name: New display name
            description: New description
            
        Returns:
            Updated Role entity
            
        Raises:
            RoleNotFoundError: If role doesn't exist
        """
        role = await self._role_repo.get_by_id(role_id)
        if not role:
            raise RoleNotFoundError(str(role_id))
        
        if display_name is not None:
            role.display_name = display_name
        if description is not None:
            role.description = description
        
        role.updated_at = datetime.now(timezone.utc)
        
        return await self._role_repo.update(role)
    
    async def delete_role(self, role_id: UUID) -> bool:
        """
        Delete a role.
        
        Args:
            role_id: Role ID to delete
            
        Returns:
            True if role was deleted
            
        Raises:
            RoleNotFoundError: If role doesn't exist or is a system role
        """
        role = await self._role_repo.get_by_id(role_id)
        if not role:
            raise RoleNotFoundError(str(role_id))
        
        if role.is_system_role:
            raise RoleNotFoundError(f"Cannot delete system role: {role.name}")
        
        return await self._role_repo.delete(role_id)
    
    async def assign_role_to_user(
        self,
        user_id: UUID,
        role_id: UUID,
        assigned_by: Optional[UUID] = None,
    ) -> bool:
        """
        Assign a role to a user.
        
        Args:
            user_id: User ID
            role_id: Role ID
            assigned_by: Optional ID of user performing the assignment
            
        Returns:
            True if role was assigned, False if already assigned
            
        Raises:
            RoleNotFoundError: If role doesn't exist
        """
        role = await self._role_repo.get_by_id(role_id)
        if not role:
            raise RoleNotFoundError(str(role_id))
        
        return await self._role_repo.assign_to_user(user_id, role_id, assigned_by)
    
    async def remove_role_from_user(self, user_id: UUID, role_id: UUID) -> bool:
        """
        Remove a role from a user.
        
        Args:
            user_id: User ID
            role_id: Role ID
            
        Returns:
            True if role was removed, False if not assigned
        """
        return await self._role_repo.remove_from_user(user_id, role_id)
    
    async def user_has_role(self, user_id: UUID, role_name: str) -> bool:
        """
        Check if user has a specific role.
        
        Args:
            user_id: User ID
            role_name: Role name to check
            
        Returns:
            True if user has the role, False otherwise
        """
        user_roles = await self._role_repo.get_user_roles(user_id)
        return any(role.name == role_name for role in user_roles)
    
    async def user_has_any_role(self, user_id: UUID, role_names: list[str]) -> bool:
        """
        Check if user has any of the specified roles.
        
        Args:
            user_id: User ID
            role_names: List of role names to check
            
        Returns:
            True if user has at least one role, False otherwise
        """
        user_roles = await self._role_repo.get_user_roles(user_id)
        user_role_names = {role.name for role in user_roles}
        return any(role_name in user_role_names for role_name in role_names)
    
    # ========== Permission Management ==========
    
    async def get_permission(self, permission_id: UUID) -> Optional[Permission]:
        """
        Get a permission by ID.
        
        Args:
            permission_id: Permission ID
            
        Returns:
            Permission entity if found, None otherwise
        """
        return await self._permission_repo.get_by_id(permission_id)
    
    async def get_permission_by_name(self, name: str) -> Optional[Permission]:
        """
        Get a permission by name.
        
        Args:
            name: Permission name (e.g., 'users:read')
            
        Returns:
            Permission entity if found, None otherwise
        """
        return await self._permission_repo.get_by_name(name)
    
    async def get_all_permissions(self) -> list[Permission]:
        """
        Get all permissions.
        
        Returns:
            List of all Permission entities
        """
        return await self._permission_repo.get_all()
    
    async def get_permissions_by_resource(self, resource: str) -> list[Permission]:
        """
        Get all permissions for a specific resource.
        
        Args:
            resource: Resource name (e.g., 'users', 'exercises')
            
        Returns:
            List of Permission entities
        """
        return await self._permission_repo.get_by_resource(resource)
    
    async def get_role_permissions(self, role_id: UUID) -> list[Permission]:
        """
        Get all permissions for a role.
        
        Args:
            role_id: Role ID
            
        Returns:
            List of Permission entities
        """
        return await self._permission_repo.get_role_permissions(role_id)
    
    async def create_permission(
        self,
        name: str,
        resource: str,
        action: str,
        description: str,
    ) -> Permission:
        """
        Create a new permission.
        
        Args:
            name: Permission name (e.g., 'users:read')
            resource: Resource being protected
            action: Action being performed
            description: Permission description
            
        Returns:
            Created Permission entity
        """
        permission = Permission(
            id=uuid4(),
            name=name,
            resource=resource,
            action=action,
            description=description,
            created_at=datetime.now(timezone.utc),
        )
        
        return await self._permission_repo.create(permission)
    
    async def update_permission(
        self,
        permission_id: UUID,
        description: str,
    ) -> Permission:
        """
        Update a permission's description.
        
        Args:
            permission_id: Permission ID
            description: New description
            
        Returns:
            Updated Permission entity
            
        Raises:
            PermissionNotFoundError: If permission doesn't exist
        """
        permission = await self._permission_repo.get_by_id(permission_id)
        if not permission:
            raise PermissionNotFoundError(str(permission_id))
        
        permission.description = description
        
        return await self._permission_repo.update(permission)
    
    async def delete_permission(self, permission_id: UUID) -> bool:
        """
        Delete a permission.
        
        Args:
            permission_id: Permission ID
            
        Returns:
            True if permission was deleted
        """
        return await self._permission_repo.delete(permission_id)
    
    async def add_permission_to_role(
        self,
        role_id: UUID,
        permission_id: UUID,
    ) -> bool:
        """
        Add a permission to a role.
        
        Args:
            role_id: Role ID
            permission_id: Permission ID
            
        Returns:
            True if permission was added, False if already exists
            
        Raises:
            RoleNotFoundError: If role doesn't exist
            PermissionNotFoundError: If permission doesn't exist
        """
        role = await self._role_repo.get_by_id(role_id)
        if not role:
            raise RoleNotFoundError(str(role_id))
        
        permission = await self._permission_repo.get_by_id(permission_id)
        if not permission:
            raise PermissionNotFoundError(str(permission_id))
        
        return await self._role_repo.add_permission(role_id, permission_id)
    
    async def remove_permission_from_role(
        self,
        role_id: UUID,
        permission_id: UUID,
    ) -> bool:
        """
        Remove a permission from a role.
        
        Args:
            role_id: Role ID
            permission_id: Permission ID
            
        Returns:
            True if permission was removed, False if not assigned
        """
        return await self._role_repo.remove_permission(role_id, permission_id)
