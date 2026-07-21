#!/usr/bin/env python3
"""
Seed script for RBAC (Roles and Permissions).

This script populates the database with default roles and permissions.
Run this after initial migration to set up the authentication system.

Usage:
    docker compose exec backend python scripts/seed_rbac.py
"""
import asyncio
import sys
from pathlib import Path
from uuid import uuid4

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from datetime import datetime, timezone

from src.configurations.settings import settings
from src.infrastructure.persistence.sqla.models import Role, Permission, role_permissions


# Default roles
DEFAULT_ROLES = [
    {
        "name": "admin",
        "display_name": "Administrator",
        "description": "Full system access with all permissions",
        "is_system_role": True,
    },
    {
        "name": "therapist",
        "display_name": "Speech Therapist",
        "description": "Manage exercises and view user progress",
        "is_system_role": True,
    },
    {
        "name": "user",
        "display_name": "User",
        "description": "Access exercises and view own progress",
        "is_system_role": True,
    },
    {
        "name": "guest",
        "display_name": "Guest",
        "description": "Limited read-only access",
        "is_system_role": True,
    },
]

# Default permissions
DEFAULT_PERMISSIONS = [
    # User permissions
    {"name": "users:read", "resource": "users", "action": "read", "description": "View user profiles"},
    {"name": "users:write", "resource": "users", "action": "write", "description": "Update user profiles"},
    {"name": "users:delete", "resource": "users", "action": "delete", "description": "Delete users"},
    {"name": "users:manage_roles", "resource": "users", "action": "manage_roles", "description": "Assign roles to users"},
    
    # Exercise permissions
    {"name": "exercises:read", "resource": "exercises", "action": "read", "description": "View exercises"},
    {"name": "exercises:write", "resource": "exercises", "action": "write", "description": "Create/update exercises"},
    {"name": "exercises:delete", "resource": "exercises", "action": "delete", "description": "Delete exercises"},
    {"name": "exercises:publish", "resource": "exercises", "action": "publish", "description": "Publish exercises"},
    
    # Analytics permissions
    {"name": "analytics:read", "resource": "analytics", "action": "read", "description": "View analytics"},
    {"name": "analytics:export", "resource": "analytics", "action": "export", "description": "Export reports"},
    
    # System permissions
    {"name": "system:config", "resource": "system", "action": "config", "description": "System configuration"},
    {"name": "system:audit", "resource": "system", "action": "audit", "description": "View audit logs"},
]

# Role-Permission mappings
ROLE_PERMISSIONS = {
    "admin": [
        # Admin gets all permissions
        "users:read", "users:write", "users:delete", "users:manage_roles",
        "exercises:read", "exercises:write", "exercises:delete", "exercises:publish",
        "analytics:read", "analytics:export",
        "system:config", "system:audit",
    ],
    "therapist": [
        "users:read",
        "exercises:read", "exercises:write", "exercises:delete", "exercises:publish",
        "analytics:read", "analytics:export",
    ],
    "user": [
        "users:read",  # Own profile only (enforced at service layer)
        "exercises:read",
        "analytics:read",  # Own analytics only (enforced at service layer)
    ],
    "guest": [
        "exercises:read",  # Public exercises only (enforced at service layer)
    ],
}


async def seed_rbac():
    """Seed roles and permissions into the database."""
    # Create async engine
    engine = create_async_engine(str(settings.database_url), echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            print("\n" + "="*60)
            print("Starting RBAC Seed Script")
            print("="*60 + "\n")
            
            # 1. Seed Roles
            print("📋 Seeding Roles...")
            role_map = {}
            
            for role_data in DEFAULT_ROLES:
                # Check if role already exists
                result = await session.execute(
                    select(Role).where(Role.name == role_data["name"])
                )
                existing_role = result.scalar_one_or_none()
                
                if existing_role:
                    print(f"  ✓ Role '{role_data['name']}' already exists (ID: {existing_role.id})")
                    role_map[role_data["name"]] = existing_role
                else:
                    new_role = Role(
                        id=uuid4(),
                        name=role_data["name"],
                        display_name=role_data["display_name"],
                        description=role_data["description"],
                        is_system_role=role_data["is_system_role"],
                        created_at=datetime.now(timezone.utc),
                        updated_at=datetime.now(timezone.utc),
                    )
                    session.add(new_role)
                    await session.flush()
                    role_map[role_data["name"]] = new_role
                    print(f"  ✓ Created role '{role_data['name']}' (ID: {new_role.id})")
            
            print(f"\n✅ Roles seeded: {len(role_map)}\n")
            
            # 2. Seed Permissions
            print("🔐 Seeding Permissions...")
            permission_map = {}
            
            for perm_data in DEFAULT_PERMISSIONS:
                # Check if permission already exists
                result = await session.execute(
                    select(Permission).where(Permission.name == perm_data["name"])
                )
                existing_perm = result.scalar_one_or_none()
                
                if existing_perm:
                    print(f"  ✓ Permission '{perm_data['name']}' already exists (ID: {existing_perm.id})")
                    permission_map[perm_data["name"]] = existing_perm
                else:
                    new_perm = Permission(
                        id=uuid4(),
                        name=perm_data["name"],
                        resource=perm_data["resource"],
                        action=perm_data["action"],
                        description=perm_data["description"],
                        created_at=datetime.now(timezone.utc),
                    )
                    session.add(new_perm)
                    await session.flush()
                    permission_map[perm_data["name"]] = new_perm
                    print(f"  ✓ Created permission '{perm_data['name']}' (ID: {new_perm.id})")
            
            print(f"\n✅ Permissions seeded: {len(permission_map)}\n")
            
            # 3. Assign Permissions to Roles
            print("🔗 Assigning Permissions to Roles...")
            
            for role_name, perm_names in ROLE_PERMISSIONS.items():
                role = role_map[role_name]
                print(f"\n  Role: {role_name}")
                
                for perm_name in perm_names:
                    permission = permission_map[perm_name]
                    
                    # Check if assignment already exists
                    result = await session.execute(
                        select(role_permissions).where(
                            role_permissions.c.role_id == role.id,
                            role_permissions.c.permission_id == permission.id
                        )
                    )
                    existing = result.first()
                    
                    if existing:
                        print(f"    ✓ Already has '{perm_name}'")
                    else:
                        # Insert into junction table
                        await session.execute(
                            role_permissions.insert().values(
                                role_id=role.id,
                                permission_id=permission.id,
                                granted_at=datetime.now(timezone.utc),
                            )
                        )
                        print(f"    ✓ Granted '{perm_name}'")
            
            # Commit all changes
            await session.commit()
            
            print("\n" + "="*60)
            print("✅ RBAC Seed Complete!")
            print("="*60)
            print(f"\nSummary:")
            print(f"  - Roles: {len(role_map)}")
            print(f"  - Permissions: {len(permission_map)}")
            print(f"  - Role-Permission assignments: {sum(len(p) for p in ROLE_PERMISSIONS.values())}")
            print()
            
        except Exception as e:
            await session.rollback()
            print(f"\n❌ Error seeding RBAC: {e}")
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_rbac())
