"""
RBAC role fixtures for testing.

Provides standard test roles with appropriate permissions.
"""

import pytest_asyncio
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.entities.role import Role
from src.infrastructure.persistence.sqla.repositories.role_repository import RoleRepository


@pytest_asyncio.fixture
async def base_roles(db_session: AsyncSession) -> dict[str, Role]:
    """
    Create base RBAC roles for testing.
    
    Provides four standard roles with appropriate permissions:
    - super_admin: Full system access (wildcard)
    - admin: Administrative access
    - therapist: Therapist-specific permissions
    - user: Standard user permissions
    
    Args:
        db_session: Database session with automatic rollback
    
    Returns:
        dict[str, Role]: Mapping of role names to Role entities
    """
    role_repo = RoleRepository(db_session)
    
    # Define roles with permissions
    role_definitions = {
        "super_admin": {
            "display_name": "Super Administrator",
            "description": "Full system access with all permissions",
            "is_system_role": True,
            "permissions": ["*:*"],  # Wildcard permission
        },
        "admin": {
            "display_name": "Administrator",
            "description": "Administrative access to manage users and system settings",
            "is_system_role": True,
            "permissions": [
                "users:read",
                "users:write",
                "users:delete",
                "exercises:read",
                "exercises:write",
                "exercises:delete",
                "settings:read",
                "settings:write",
                "roles:read",
                "roles:write",
            ],
        },
        "therapist": {
            "display_name": "Therapist",
            "description": "Therapist role for managing patients and exercises",
            "is_system_role": False,
            "permissions": [
                "exercises:read",
                "exercises:write",
                "patients:read",
                "patients:write",
                "sessions:read",
                "sessions:write",
            ],
        },
        "user": {
            "display_name": "User",
            "description": "Standard user with basic permissions",
            "is_system_role": False,
            "permissions": [
                "exercises:read",
                "profile:read",
                "profile:write",
                "sessions:read",
            ],
        },
    }
    
    # Create role entities
    roles = {}
    for name, config in role_definitions.items():
        role = Role(
            id=uuid4(),
            name=name,
            display_name=config["display_name"],
            description=config["description"],
            is_system_role=config["is_system_role"],
            permissions=config["permissions"],
        )
        created_role = await role_repo.create(role)
        roles[name] = created_role
    
    return roles
