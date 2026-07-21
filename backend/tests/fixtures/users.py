"""
User fixtures for testing.

Provides test users with different roles and states.
"""

import pytest_asyncio
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.entities.user import User
from src.infrastructure.persistence.sqla.models.user import User as UserModel
from src.infrastructure.persistence.sqla.repositories.user import UserRepository
from src.infrastructure.persistence.sqla.repositories.role_repository import RoleRepository
from src.infrastructure.security.password_hasher import BcryptPasswordHasher


@pytest_asyncio.fixture
async def password_hasher() -> BcryptPasswordHasher:
    """
    Provide password hasher for tests.
    
    Returns:
        BcryptPasswordHasher: Password hasher instance
    """
    return BcryptPasswordHasher()


@pytest_asyncio.fixture
async def test_users(
    db_session: AsyncSession,
    base_roles: dict,
    password_hasher: BcryptPasswordHasher
) -> dict[str, User]:
    """
    Create test users with different roles and states.
    
    Provides four test users:
    - admin: Verified admin user
    - therapist: Verified therapist user
    - user: Verified regular user
    - unverified: Unverified user (for email verification tests)
    
    All users have password: "[Username]Pass123!" (e.g., "AdminPass123!")
    
    Args:
        db_session: Database session with automatic rollback
        base_roles: RBAC roles fixture
        password_hasher: Password hasher instance
    
    Returns:
        dict[str, User]: Mapping of user types to User entities
    """
    user_repo = UserRepository(db_session)
    role_repo = RoleRepository(db_session)
    
    # Define test users
    user_definitions = {
        "admin": {
            "username": "admin_user",
            "email": "admin@test.com",
            "password": "AdminPass123!",
            "email_verified": True,
            "role": "admin",
        },
        "therapist": {
            "username": "therapist_user",
            "email": "therapist@test.com",
            "password": "TherapistPass123!",
            "email_verified": True,
            "role": "therapist",
        },
        "user": {
            "username": "regular_user",
            "email": "user@test.com",
            "password": "UserPass123!",
            "email_verified": True,
            "role": "user",
        },
        "unverified": {
            "username": "unverified_user",
            "email": "unverified@test.com",
            "password": "UnverifiedPass123!",
            "email_verified": False,
            "role": None,  # No role assigned
        },
    }
    
    # Create user entities
    users = {}
    for user_type, config in user_definitions.items():
        user = User(
            id=uuid4(),
            username=config["username"],
            email=config["email"],
            hashed_password=password_hasher.hash_password(config["password"]),
            email_verified=config["email_verified"],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        created_user = await user_repo.add(user)
        users[user_type] = created_user
    
    # Assign roles to verified users
    for user_type, config in user_definitions.items():
        if config["role"] and config["role"] in base_roles:
            await role_repo.assign_to_user(
                users[user_type].id,
                base_roles[config["role"]].id
            )
    
    return users
