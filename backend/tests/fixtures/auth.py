"""
Authentication fixtures for testing.

Provides authentication tokens and helpers for integration tests.
"""

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from tests.fixtures.roles import base_roles
from tests.fixtures.users import test_users


@pytest_asyncio.fixture
async def admin_token(test_users: dict, db_session: AsyncSession) -> str:
    """
    Provide admin authentication token.
    
    Returns a mock Bearer token for admin user.
    For now, returns a simple format that can be validated later.
    TODO: Replace with real JWT token generation.
    
    Args:
        test_users: Test users fixture
        db_session: Database session
    
    Returns:
        str: Bearer token string
    """
    admin = test_users["admin"]
    return f"Bearer test_token_admin_{admin.id}"


@pytest_asyncio.fixture
async def therapist_token(test_users: dict, db_session: AsyncSession) -> str:
    """
    Provide therapist authentication token.
    
    Returns a mock Bearer token for therapist user.
    TODO: Replace with real JWT token generation.
    
    Args:
        test_users: Test users fixture
        db_session: Database session
    
    Returns:
        str: Bearer token string
    """
    therapist = test_users["therapist"]
    return f"Bearer test_token_therapist_{therapist.id}"


@pytest_asyncio.fixture
async def regular_user_token(test_users: dict, db_session: AsyncSession) -> str:
    """
    Provide regular user authentication token.
    
    Returns a mock Bearer token for regular user.
    TODO: Replace with real JWT token generation.
    
    Args:
        test_users: Test users fixture
        db_session: Database session
    
    Returns:
        str: Bearer token string
    """
    user = test_users["user"]
    return f"Bearer test_token_user_{user.id}"


@pytest_asyncio.fixture
async def patient_token(test_users: dict, db_session: AsyncSession) -> str:
    """
    Provide patient authentication token.
    
    Uses the regular user as patient for RBAC tests.
    TODO: Replace with real JWT token generation.
    
    Args:
        test_users: Test users fixture
        db_session: Database session
    
    Returns:
        str: Bearer token string
    """
    # Use regular user as patient
    user = test_users["user"]
    return f"Bearer test_token_patient_{user.id}"


def get_user_id_from_token(token: str) -> UUID:
    """
    Extract user ID from mock token.
    
    This is a helper for tests that need to extract the user ID
    from the test token format.
    
    Args:
        token: Bearer token string
    
    Returns:
        UUID: User ID extracted from token
    """
    # Token format: "Bearer test_token_{role}_{uuid}"
    parts = token.split("_")
    if len(parts) >= 4:
        from uuid import UUID
        return UUID(parts[-1])
    raise ValueError(f"Invalid token format: {token}")
