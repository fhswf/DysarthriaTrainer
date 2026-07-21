"""
Repository interface for Role entity.
"""

from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from src.core.entities.role import Role


class IRoleRepository(ABC):
    """Interface for Role repository operations."""
    
    @abstractmethod
    async def create(self, role: Role) -> Role:
        """
        Create a new role.
        
        Args:
            role: Role entity to create
            
        Returns:
            Created Role entity
        """
        pass
    
    @abstractmethod
    async def get_by_id(self, role_id: UUID) -> Optional[Role]:
        """
        Get a role by ID.
        
        Args:
            role_id: Role ID to search for
            
        Returns:
            Role entity if found, None otherwise
        """
        pass
    
    @abstractmethod
    async def get_by_name(self, name: str) -> Optional[Role]:
        """
        Get a role by name.
        
        Args:
            name: Role name to search for
            
        Returns:
            Role entity if found, None otherwise
        """
        pass
    
    @abstractmethod
    async def get_all(self) -> list[Role]:
        """
        Get all roles.
        
        Returns:
            List of all Role entities
        """
        pass
    
    @abstractmethod
    async def get_user_roles(self, user_id: UUID) -> list[Role]:
        """
        Get all roles assigned to a user.
        
        Args:
            user_id: User ID to search for
            
        Returns:
            List of Role entities assigned to the user
        """
        pass
    
    @abstractmethod
    async def update(self, role: Role) -> Role:
        """
        Update an existing role.
        
        Args:
            role: Role entity with updated data
            
        Returns:
            Updated Role entity
        """
        pass
    
    @abstractmethod
    async def delete(self, role_id: UUID) -> bool:
        """
        Delete a role.
        
        Args:
            role_id: Role ID to delete
            
        Returns:
            True if role was deleted, False if not found
        """
        pass
    
    @abstractmethod
    async def assign_to_user(self, user_id: UUID, role_id: UUID, assigned_by: Optional[UUID] = None) -> bool:
        """
        Assign a role to a user.
        
        Args:
            user_id: User ID to assign role to
            role_id: Role ID to assign
            assigned_by: Optional ID of user who performed the assignment
            
        Returns:
            True if role was assigned, False if already assigned
        """
        pass
    
    @abstractmethod
    async def remove_from_user(self, user_id: UUID, role_id: UUID) -> bool:
        """
        Remove a role from a user.
        
        Args:
            user_id: User ID to remove role from
            role_id: Role ID to remove
            
        Returns:
            True if role was removed, False if not assigned
        """
        pass
    
    @abstractmethod
    async def add_permission(self, role_id: UUID, permission_id: UUID) -> bool:
        """
        Add a permission to a role.
        
        Args:
            role_id: Role ID to add permission to
            permission_id: Permission ID to add
            
        Returns:
            True if permission was added, False if already exists
        """
        pass
    
    @abstractmethod
    async def remove_permission(self, role_id: UUID, permission_id: UUID) -> bool:
        """
        Remove a permission from a role.
        
        Args:
            role_id: Role ID to remove permission from
            permission_id: Permission ID to remove
            
        Returns:
            True if permission was removed, False if not assigned
        """
        pass
