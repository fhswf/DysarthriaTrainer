"""
Domain entity for Role.
"""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class Role:
    """
    Role entity representing a user role in the system.
    
    Attributes:
        id: Unique identifier
        name: Role name (e.g., 'admin', 'therapist', 'user', 'guest')
        display_name: Human-readable role name
        description: Role description
        is_system_role: Whether this role is built-in and cannot be deleted
        created_at: Creation timestamp
        updated_at: Last update timestamp
        permissions: List of permission names associated with this role
    """
    
    id: UUID
    name: str
    display_name: str
    description: str
    is_system_role: bool = False
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    permissions: list[str] = field(default_factory=list)
    
    def has_permission(self, permission: str) -> bool:
        """Check if this role has a specific permission."""
        return permission in self.permissions
    
    def add_permission(self, permission: str) -> None:
        """Add a permission to this role."""
        if permission not in self.permissions:
            self.permissions.append(permission)
    
    def remove_permission(self, permission: str) -> None:
        """Remove a permission from this role."""
        if permission in self.permissions:
            self.permissions.remove(permission)
