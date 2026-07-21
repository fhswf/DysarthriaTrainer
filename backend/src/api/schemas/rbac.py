"""
RBAC-related Pydantic schemas for API requests and responses.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ========== Request Schemas ==========

class RoleCreateRequest(BaseModel):
    """Request schema for creating a role."""
    
    name: str = Field(..., min_length=1, max_length=50, description="Role name")
    display_name: str = Field(..., min_length=1, max_length=100, description="Display name")
    description: str = Field(..., min_length=1, max_length=500, description="Role description")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "content_editor",
                    "display_name": "Content Editor",
                    "description": "Can create and edit content"
                }
            ]
        }
    }


class RoleUpdateRequest(BaseModel):
    """Request schema for updating a role."""
    
    display_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Display name")
    description: Optional[str] = Field(None, min_length=1, max_length=500, description="Role description")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "display_name": "Senior Content Editor",
                    "description": "Can create, edit, and publish content"
                }
            ]
        }
    }


class AssignRoleRequest(BaseModel):
    """Request schema for assigning a role to a user."""
    
    role_id: UUID = Field(..., description="Role ID to assign")
    user_id: UUID = Field(..., description="User ID to assign role to")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "role_id": "550e8400-e29b-41d4-a716-446655440000",
                    "user_id": "660e8400-e29b-41d4-a716-446655440000"
                }
            ]
        }
    }


class PermissionCreateRequest(BaseModel):
    """Request schema for creating a permission."""
    
    name: str = Field(..., min_length=1, max_length=100, description="Permission name (e.g., 'users:read')")
    resource: str = Field(..., min_length=1, max_length=50, description="Resource name")
    action: str = Field(..., min_length=1, max_length=50, description="Action name")
    description: str = Field(..., min_length=1, max_length=500, description="Permission description")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "content:publish",
                    "resource": "content",
                    "action": "publish",
                    "description": "Publish content to production"
                }
            ]
        }
    }


class PermissionUpdateRequest(BaseModel):
    """Request schema for updating a permission."""
    
    description: str = Field(..., min_length=1, max_length=500, description="Permission description")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "description": "Publish content to production with review"
                }
            ]
        }
    }


class AddPermissionToRoleRequest(BaseModel):
    """Request schema for adding a permission to a role."""
    
    permission_id: UUID = Field(..., description="Permission ID to add")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "permission_id": "550e8400-e29b-41d4-a716-446655440000"
                }
            ]
        }
    }


# ========== Response Schemas ==========

class PermissionResponse(BaseModel):
    """Response schema for permission information."""
    
    id: UUID
    name: str
    resource: str
    action: str
    description: str
    created_at: datetime
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "name": "users:read",
                    "resource": "users",
                    "action": "read",
                    "description": "View user profiles",
                    "created_at": "2025-11-12T10:00:00Z"
                }
            ]
        }
    }


class RoleResponse(BaseModel):
    """Response schema for role information."""
    
    id: UUID
    name: str
    display_name: str
    description: str
    is_system_role: bool
    permissions: list[str] = Field(default_factory=list, description="List of permission names")
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "name": "admin",
                    "display_name": "Administrator",
                    "description": "Full system access",
                    "is_system_role": True,
                    "permissions": ["users:read", "users:write", "users:delete"],
                    "created_at": "2025-11-12T10:00:00Z",
                    "updated_at": "2025-11-12T10:00:00Z"
                }
            ]
        }
    }


class UserPermissionsResponse(BaseModel):
    """Response schema for user's permissions."""
    
    user_id: UUID
    roles: list[str] = Field(..., description="List of role names")
    permissions: list[str] = Field(..., description="List of permission names")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "user_id": "550e8400-e29b-41d4-a716-446655440000",
                    "roles": ["user", "therapist"],
                    "permissions": ["exercises:read", "exercises:write", "analytics:read"]
                }
            ]
        }
    }
