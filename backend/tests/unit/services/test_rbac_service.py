"""
Unit tests for RBACService.

Tests role-based access control operations including:
- Permission checking with wildcard support
- Role management
- Permission management
- User-role assignments
- Role-permission assignments
"""

import pytest
from uuid import uuid4
from unittest.mock import AsyncMock, Mock

from src.application.services.rbac_service import RBACService
from src.core.entities.role import Role
from src.core.entities.permission import Permission
from src.core.exceptions.auth import (
    RoleNotFoundError,
    PermissionNotFoundError,
    InsufficientPermissionsError,
)
from src.core.ports.repositories import IRoleRepository, IPermissionRepository


class TestRBACServicePermissionChecking:
    """Tests for permission checking functionality."""

    @pytest.fixture
    def mock_role_repository(self) -> AsyncMock:
        return AsyncMock(spec=IRoleRepository)

    @pytest.fixture
    def mock_permission_repository(self) -> AsyncMock:
        return AsyncMock(spec=IPermissionRepository)

    @pytest.fixture
    def rbac_service(
        self,
        mock_role_repository: AsyncMock,
        mock_permission_repository: AsyncMock,
    ) -> RBACService:
        return RBACService(
            role_repository=mock_role_repository,
            permission_repository=mock_permission_repository,
        )

    @pytest.mark.asyncio
    async def test_check_permission_exact_match(
        self,
        rbac_service: RBACService,
        mock_permission_repository: AsyncMock,
    ):
        """Should grant access when user has exact permission."""
        # Arrange
        user_id = uuid4()
        permission_name = "users:read"
        
        mock_permission_repository.user_has_permission.return_value = True

        # Act
        result = await rbac_service.check_permission(user_id, permission_name)

        # Assert
        assert result is True
        mock_permission_repository.user_has_permission.assert_called_once_with(user_id, permission_name)

    @pytest.mark.asyncio
    async def test_check_permission_wildcard_action(
        self,
        rbac_service: RBACService,
        mock_permission_repository: AsyncMock,
    ):
        """Should grant access when user has wildcard action permission."""
        # Arrange
        user_id = uuid4()
        permission_name = "users:delete"
        
        # Service calls user_has_permission which handles wildcard matching
        mock_permission_repository.user_has_permission.return_value = True

        # Act
        result = await rbac_service.check_permission(user_id, permission_name)

        # Assert
        assert result is True

    @pytest.mark.asyncio
    async def test_check_permission_wildcard_resource(
        self,
        rbac_service: RBACService,
        mock_permission_repository: AsyncMock,
    ):
        """Should grant access when user has wildcard resource permission."""
        # Arrange
        user_id = uuid4()
        permission_name = "exercises:read"
        
        # Service calls user_has_permission which handles wildcard matching
        mock_permission_repository.user_has_permission.return_value = True

        # Act
        result = await rbac_service.check_permission(user_id, permission_name)

        # Assert
        assert result is True

    @pytest.mark.asyncio
    async def test_check_permission_super_admin(
        self,
        rbac_service: RBACService,
        mock_permission_repository: AsyncMock,
    ):
        """Should grant access when user has super admin permission (*:*)."""
        # Arrange
        user_id = uuid4()
        permission_name = "anything:anything"
        
        # Service calls user_has_permission which handles wildcard matching
        mock_permission_repository.user_has_permission.return_value = True

        # Act
        result = await rbac_service.check_permission(user_id, permission_name)

        # Assert
        assert result is True

    @pytest.mark.asyncio
    async def test_check_permission_denied(
        self,
        rbac_service: RBACService,
        mock_permission_repository: AsyncMock,
    ):
        """Should deny access when user lacks required permission."""
        # Arrange
        user_id = uuid4()
        permission_name = "users:delete"
        
        mock_permission_repository.user_has_permission.return_value = False

        # Act
        result = await rbac_service.check_permission(user_id, permission_name, raise_exception=False)

        # Assert
        assert result is False

    @pytest.mark.asyncio
    async def test_check_permission_denied_raises_exception(
        self,
        rbac_service: RBACService,
        mock_permission_repository: AsyncMock,
    ):
        """Should raise InsufficientPermissionsError when raise_exception=True."""
        # Arrange
        user_id = uuid4()
        permission_name = "users:delete"
        mock_permission_repository.user_has_permission.return_value = False

        # Act & Assert
        with pytest.raises(InsufficientPermissionsError) as exc_info:
            await rbac_service.check_permission(user_id, permission_name, raise_exception=True)
        
        assert permission_name in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_check_all_permissions_success(
        self,
        rbac_service: RBACService,
        mock_permission_repository: AsyncMock,
    ):
        """Should grant access when user has all required permissions."""
        # Arrange
        user_id = uuid4()
        required_permissions = ["users:read", "users:write"]
        
        # Mock to return True for both permissions
        mock_permission_repository.user_has_permission.return_value = True

        # Act
        result = await rbac_service.check_all_permissions(user_id, required_permissions)

        # Assert
        assert result is True
        assert mock_permission_repository.user_has_permission.call_count == 2

    @pytest.mark.asyncio
    async def test_check_all_permissions_missing_one(
        self,
        rbac_service: RBACService,
        mock_permission_repository: AsyncMock,
    ):
        """Should deny access when user is missing one required permission."""
        # Arrange
        user_id = uuid4()
        required_permissions = ["users:read", "users:write", "users:delete"]
        
        # Mock to return True for first two, False for delete
        def side_effect(user_id, permission_name):
            return permission_name != "users:delete"
        
        mock_permission_repository.user_has_permission.side_effect = side_effect

        # Act
        result = await rbac_service.check_all_permissions(
            user_id, required_permissions, raise_exception=False
        )

        # Assert
        assert result is False

    @pytest.mark.asyncio
    async def test_check_any_permission_success(
        self,
        rbac_service: RBACService,
        mock_permission_repository: AsyncMock,
    ):
        """Should grant access when user has at least one required permission."""
        # Arrange
        user_id = uuid4()
        required_permissions = ["users:read", "admin:all"]
        
        # Mock to return True for first permission
        def side_effect(user_id, permission_name):
            return permission_name == "users:read"
        
        mock_permission_repository.user_has_permission.side_effect = side_effect

        # Act
        result = await rbac_service.check_any_permission(user_id, required_permissions)

        # Assert
        assert result is True

    @pytest.mark.asyncio
    async def test_check_any_permission_none_found(
        self,
        rbac_service: RBACService,
        mock_permission_repository: AsyncMock,
    ):
        """Should deny access when user has none of the required permissions."""
        # Arrange
        user_id = uuid4()
        required_permissions = ["users:write", "admin:all"]
        
        # Mock to return False for all permissions
        mock_permission_repository.user_has_permission.return_value = False

        # Act
        result = await rbac_service.check_any_permission(
            user_id, required_permissions, raise_exception=False
        )

        # Assert
        assert result is False


class TestRBACServiceRoleManagement:
    """Tests for role management operations."""

    @pytest.fixture
    def mock_role_repository(self) -> AsyncMock:
        return AsyncMock(spec=IRoleRepository)

    @pytest.fixture
    def mock_permission_repository(self) -> AsyncMock:
        return AsyncMock(spec=IPermissionRepository)

    @pytest.fixture
    def rbac_service(
        self,
        mock_role_repository: AsyncMock,
        mock_permission_repository: AsyncMock,
    ) -> RBACService:
        return RBACService(
            role_repository=mock_role_repository,
            permission_repository=mock_permission_repository,
        )

    @pytest.mark.asyncio
    async def test_get_role_found(
        self,
        rbac_service: RBACService,
        mock_role_repository: AsyncMock,
    ):
        """Should return role when found by ID."""
        # Arrange
        role_id = uuid4()
        expected_role = Role(
            id=role_id,
            name="admin",
            display_name="Administrator",
            description="Administrator role",
        )
        mock_role_repository.get_by_id.return_value = expected_role

        # Act
        role = await rbac_service.get_role(role_id)

        # Assert
        assert role == expected_role
        mock_role_repository.get_by_id.assert_called_once_with(role_id)

    @pytest.mark.asyncio
    async def test_get_role_not_found(
        self,
        rbac_service: RBACService,
        mock_role_repository: AsyncMock,
    ):
        """Should return None when role doesn't exist."""
        # Arrange
        role_id = uuid4()
        mock_role_repository.get_by_id.return_value = None

        # Act
        role = await rbac_service.get_role(role_id)

        # Assert
        assert role is None

    @pytest.mark.asyncio
    async def test_get_role_by_name_found(
        self,
        rbac_service: RBACService,
        mock_role_repository: AsyncMock,
    ):
        """Should return role when found by name."""
        # Arrange
        role_name = "admin"
        expected_role = Role(
            id=uuid4(),
            name=role_name,
            display_name="Administrator",
            description="Administrator",
        )
        mock_role_repository.get_by_name.return_value = expected_role

        # Act
        role = await rbac_service.get_role_by_name(role_name)

        # Assert
        assert role == expected_role
        mock_role_repository.get_by_name.assert_called_once_with(role_name)

    @pytest.mark.asyncio
    async def test_create_role_success(
        self,
        rbac_service: RBACService,
        mock_role_repository: AsyncMock,
    ):
        """Should successfully create a new role."""
        # Arrange
        name = "moderator"
        display_name = "Moderator"
        description = "Moderator role"
        
        created_role = Role(
            id=uuid4(),
            name=name,
            display_name=display_name,
            description=description,
        )
        mock_role_repository.create.return_value = created_role

        # Act
        role = await rbac_service.create_role(name, display_name, description)

        # Assert
        assert role.name == name
        assert role.display_name == display_name
        assert role.description == description
        mock_role_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_all_roles(
        self,
        rbac_service: RBACService,
        mock_role_repository: AsyncMock,
    ):
        """Should return list of all roles."""
        # Arrange
        roles = [
            Role(id=uuid4(), name="admin", display_name="Admin", description="Admin"),
            Role(id=uuid4(), name="user", display_name="User", description="User"),
        ]
        mock_role_repository.get_all.return_value = roles

        # Act
        result = await rbac_service.get_all_roles()

        # Assert
        assert len(result) == 2
        assert result == roles
        mock_role_repository.get_all.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_user_roles(
        self,
        rbac_service: RBACService,
        mock_role_repository: AsyncMock,
    ):
        """Should return list of user's roles."""
        # Arrange
        user_id = uuid4()
        user_roles = [
            Role(id=uuid4(), name="user", display_name="User", description="User"),
            Role(id=uuid4(), name="therapist", display_name="Therapist", description="Therapist"),
        ]
        mock_role_repository.get_user_roles.return_value = user_roles

        # Act
        result = await rbac_service.get_user_roles(user_id)

        # Assert
        assert len(result) == 2
        assert result == user_roles
        mock_role_repository.get_user_roles.assert_called_once_with(user_id)

    @pytest.mark.asyncio
    async def test_delete_role_success(
        self,
        rbac_service: RBACService,
        mock_role_repository: AsyncMock,
    ):
        """Should successfully delete a role."""
        # Arrange
        role_id = uuid4()
        role = Role(
            id=role_id,
            name="custom-role",
            display_name="Custom Role",
            description="A custom role",
            is_system_role=False,
        )
        mock_role_repository.get_by_id.return_value = role
        mock_role_repository.delete.return_value = True

        # Act
        result = await rbac_service.delete_role(role_id)

        # Assert
        assert result is True
        mock_role_repository.get_by_id.assert_called_once_with(role_id)
        mock_role_repository.delete.assert_called_once_with(role_id)


class TestRBACServicePermissionManagement:
    """Tests for permission management operations."""

    @pytest.fixture
    def mock_role_repository(self) -> AsyncMock:
        return AsyncMock(spec=IRoleRepository)

    @pytest.fixture
    def mock_permission_repository(self) -> AsyncMock:
        return AsyncMock(spec=IPermissionRepository)

    @pytest.fixture
    def rbac_service(
        self,
        mock_role_repository: AsyncMock,
        mock_permission_repository: AsyncMock,
    ) -> RBACService:
        return RBACService(
            role_repository=mock_role_repository,
            permission_repository=mock_permission_repository,
        )

    @pytest.mark.asyncio
    async def test_get_permission_found(
        self,
        rbac_service: RBACService,
        mock_permission_repository: AsyncMock,
    ):
        """Should return permission when found by ID."""
        # Arrange
        permission_id = uuid4()
        expected_permission = Permission(
            id=permission_id,
            name="users:read",
            resource="users",
            action="read",
            description="Read users",
        )
        mock_permission_repository.get_by_id.return_value = expected_permission

        # Act
        permission = await rbac_service.get_permission(permission_id)

        # Assert
        assert permission == expected_permission
        mock_permission_repository.get_by_id.assert_called_once_with(permission_id)

    @pytest.mark.asyncio
    async def test_get_permission_not_found(
        self,
        rbac_service: RBACService,
        mock_permission_repository: AsyncMock,
    ):
        """Should return None when permission doesn't exist."""
        # Arrange
        permission_id = uuid4()
        mock_permission_repository.get_by_id.return_value = None

        # Act
        permission = await rbac_service.get_permission(permission_id)

        # Assert
        assert permission is None

    @pytest.mark.asyncio
    async def test_create_permission_success(
        self,
        rbac_service: RBACService,
        mock_permission_repository: AsyncMock,
    ):
        """Should successfully create a new permission."""
        # Arrange
        name = "exercises:write"
        resource = "exercises"
        action = "write"
        description = "Write exercises"
        
        created_permission = Permission(
            id=uuid4(),
            name=name,
            resource=resource,
            action=action,
            description=description,
        )
        mock_permission_repository.create.return_value = created_permission

        # Act
        permission = await rbac_service.create_permission(name, resource, action, description)

        # Assert
        assert permission.name == name
        assert permission.resource == resource
        assert permission.action == action
        mock_permission_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_all_permissions(
        self,
        rbac_service: RBACService,
        mock_permission_repository: AsyncMock,
    ):
        """Should return list of all permissions."""
        # Arrange
        permissions = [
            Permission(id=uuid4(), name="users:read", resource="users", action="read", description="Read users"),
            Permission(id=uuid4(), name="users:write", resource="users", action="write", description="Write users"),
        ]
        mock_permission_repository.get_all.return_value = permissions

        # Act
        result = await rbac_service.get_all_permissions()

        # Assert
        assert len(result) == 2
        assert result == permissions
        mock_permission_repository.get_all.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_permissions_by_resource(
        self,
        rbac_service: RBACService,
        mock_permission_repository: AsyncMock,
    ):
        """Should return permissions filtered by resource."""
        # Arrange
        resource = "users"
        permissions = [
            Permission(id=uuid4(), name="users:read", resource=resource, action="read", description="Read users"),
            Permission(id=uuid4(), name="users:write", resource=resource, action="write", description="Write users"),
        ]
        mock_permission_repository.get_by_resource.return_value = permissions

        # Act
        result = await rbac_service.get_permissions_by_resource(resource)

        # Assert
        assert len(result) == 2
        mock_permission_repository.get_by_resource.assert_called_once_with(resource)


class TestRBACServiceRolePermissionAssignment:
    """Tests for role-permission assignment operations."""

    @pytest.fixture
    def mock_role_repository(self) -> AsyncMock:
        return AsyncMock(spec=IRoleRepository)

    @pytest.fixture
    def mock_permission_repository(self) -> AsyncMock:
        return AsyncMock(spec=IPermissionRepository)

    @pytest.fixture
    def rbac_service(
        self,
        mock_role_repository: AsyncMock,
        mock_permission_repository: AsyncMock,
    ) -> RBACService:
        return RBACService(
            role_repository=mock_role_repository,
            permission_repository=mock_permission_repository,
        )

    @pytest.mark.asyncio
    async def test_add_permission_to_role_success(
        self,
        rbac_service: RBACService,
        mock_role_repository: AsyncMock,
    ):
        """Should successfully add permission to role."""
        # Arrange
        role_id = uuid4()
        permission_id = uuid4()

        # Act
        await rbac_service.add_permission_to_role(role_id, permission_id)

        # Assert
        mock_role_repository.add_permission.assert_called_once_with(role_id, permission_id)

    @pytest.mark.asyncio
    async def test_remove_permission_from_role_success(
        self,
        rbac_service: RBACService,
        mock_role_repository: AsyncMock,
    ):
        """Should successfully remove permission from role."""
        # Arrange
        role_id = uuid4()
        permission_id = uuid4()

        # Act
        await rbac_service.remove_permission_from_role(role_id, permission_id)

        # Assert
        mock_role_repository.remove_permission.assert_called_once_with(
            role_id, permission_id
        )

    @pytest.mark.asyncio
    async def test_get_role_permissions(
        self,
        rbac_service: RBACService,
        mock_permission_repository: AsyncMock,
    ):
        """Should return list of permissions for a role."""
        # Arrange
        role_id = uuid4()
        permissions = [
            Permission(id=uuid4(), name="users:read", resource="users", action="read", description="Read users"),
            Permission(id=uuid4(), name="users:write", resource="users", action="write", description="Write users"),
        ]
        mock_permission_repository.get_role_permissions.return_value = permissions

        # Act
        result = await rbac_service.get_role_permissions(role_id)

        # Assert
        assert len(result) == 2
        assert result == permissions
        mock_permission_repository.get_role_permissions.assert_called_once_with(role_id)


class TestRBACServiceUserRoleAssignment:
    """Tests for user-role assignment operations."""

    @pytest.fixture
    def mock_role_repository(self) -> AsyncMock:
        return AsyncMock(spec=IRoleRepository)

    @pytest.fixture
    def mock_permission_repository(self) -> AsyncMock:
        return AsyncMock(spec=IPermissionRepository)

    @pytest.fixture
    def rbac_service(
        self,
        mock_role_repository: AsyncMock,
        mock_permission_repository: AsyncMock,
    ) -> RBACService:
        return RBACService(
            role_repository=mock_role_repository,
            permission_repository=mock_permission_repository,
        )

    @pytest.mark.asyncio
    async def test_assign_role_to_user_success(
        self,
        rbac_service: RBACService,
        mock_role_repository: AsyncMock,
    ):
        """Should successfully assign role to user."""
        # Arrange
        user_id = uuid4()
        role_id = uuid4()
        assigned_by_id = uuid4()

        # Act
        await rbac_service.assign_role_to_user(user_id, role_id, assigned_by_id)

        # Assert
        mock_role_repository.assign_to_user.assert_called_once_with(
            user_id, role_id, assigned_by_id
        )

    @pytest.mark.asyncio
    async def test_remove_role_from_user_success(
        self,
        rbac_service: RBACService,
        mock_role_repository: AsyncMock,
    ):
        """Should successfully remove role from user."""
        # Arrange
        user_id = uuid4()
        role_id = uuid4()

        # Act
        await rbac_service.remove_role_from_user(user_id, role_id)

        # Assert
        mock_role_repository.remove_from_user.assert_called_once_with(user_id, role_id)
