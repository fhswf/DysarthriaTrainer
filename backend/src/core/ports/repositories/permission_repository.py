"""
Repository interface for Permission entity.
"""

from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from src.core.entities.permission import Permission


class IPermissionRepository(ABC):
    """Interface for Permission repository operations."""
    
    @abstractmethod
    async def create(self, permission: Permission) -> Permission:
        """
        Create a new permission.
        
        Args:
            permission: Permission entity to create
            
        Returns:
            Created Permission entity
        """
        pass
    
    @abstractmethod
    async def get_by_id(self, permission_id: UUID) -> Optional[Permission]:
        """
        Get a permission by ID.
        
        Args:
            permission_id: Permission ID to search for
            
        Returns:
            Permission entity if found, None otherwise
        """
        pass
    
    @abstractmethod
    async def get_by_name(self, name: str) -> Optional[Permission]:
        """
        Get a permission by name.
        
        Args:
            name: Permission name to search for (e.g., 'users:read')
            
        Returns:
            Permission entity if found, None otherwise
        """
        pass
    
    @abstractmethod
    async def get_all(self) -> list[Permission]:
        """
        Get all permissions.
        
        Returns:
            List of all Permission entities
        """
        pass
    
    @abstractmethod
    async def get_by_resource(self, resource: str) -> list[Permission]:
        """
        Get all permissions for a specific resource.
        
        Args:
            resource: Resource name (e.g., 'users', 'exercises')
            
        Returns:
            List of Permission entities for the resource
        """
        pass
    
    @abstractmethod
    async def get_role_permissions(self, role_id: UUID) -> list[Permission]:
        """
        Get all permissions assigned to a role.
        
        Args:
            role_id: Role ID to search for
            
        Returns:
            List of Permission entities assigned to the role
        """
        pass
    
    @abstractmethod
    async def get_user_permissions(self, user_id: UUID) -> list[Permission]:
        """
        Get all permissions assigned to a user (via their roles).
        
        Args:
            user_id: User ID to search for
            
        Returns:
            List of Permission entities assigned to the user
        """
        pass
    
    @abstractmethod
    async def update(self, permission: Permission) -> Permission:
        """
        Update an existing permission.
        
        Args:
            permission: Permission entity with updated data
            
        Returns:
            Updated Permission entity
        """
        pass
    
    @abstractmethod
    async def delete(self, permission_id: UUID) -> bool:
        """
        Delete a permission.
        
        Args:
            permission_id: Permission ID to delete
            
        Returns:
            True if permission was deleted, False if not found
        """
        pass
    
    @abstractmethod
    async def user_has_permission(self, user_id: UUID, permission_name: str) -> bool:
        """
        Check if a user has a specific permission.
        
        Args:
            user_id: User ID to check
            permission_name: Permission name to check (e.g., 'users:read')
            
        Returns:
            True if user has the permission, False otherwise
        """
        pass
