"""
Test fixtures package.

Provides reusable test data fixtures for:
- Users (with different roles and states)
- Roles (RBAC roles)
- Permissions (RBAC permissions)
- Other test entities

Related:
- Issue #93: Test Database Infrastructure
"""

__all__ = [
    "base_roles",
    "test_users",
    "password_hasher",
]
