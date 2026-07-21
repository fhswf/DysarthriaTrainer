"""
Domain entity for Permission.
"""

from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class Permission:
    """
    Permission entity representing a specific access control permission.
    
    Attributes:
        id: Unique identifier
        name: Permission name in format 'resource:action' (e.g., 'users:read')
        resource: Resource being protected (e.g., 'users', 'exercises')
        action: Action being performed (e.g., 'read', 'write', 'delete')
        description: Permission description
        created_at: Creation timestamp
    """
    
    id: UUID
    name: str
    resource: str
    action: str
    description: str
    created_at: datetime = field(default_factory=datetime.now)
    
    @classmethod
    def from_string(cls, permission_str: str, description: str = "") -> "Permission":
        """
        Create a Permission from a string like 'users:read'.
        
        Args:
            permission_str: Permission string in format 'resource:action'
            description: Optional description
            
        Returns:
            Permission instance
            
        Raises:
            ValueError: If permission string is not in correct format
        """
        if ":" not in permission_str:
            raise ValueError(
                f"Invalid permission format: '{permission_str}'. "
                "Expected format: 'resource:action'"
            )
        
        resource, action = permission_str.split(":", 1)
        
        # Placeholder UUID - in real usage, this would come from DB
        from uuid import uuid4
        return cls(
            id=uuid4(),
            name=permission_str,
            resource=resource,
            action=action,
            description=description,
        )
    
    def matches(self, resource: str, action: str) -> bool:
        """
        Check if this permission matches a resource and action.
        
        Supports wildcard matching:
        - 'users:*' matches any action on users
        - '*:read' matches read on any resource
        - '*:*' matches everything
        """
        resource_match = self.resource == "*" or self.resource == resource
        action_match = self.action == "*" or self.action == action
        return resource_match and action_match
