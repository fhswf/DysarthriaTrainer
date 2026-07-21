"""
Unit tests for AuthService.

Tests all authentication operations including:
- User registration with email verification
- Login with account lockout protection
- Token refresh with rotation
- Email verification
- Password reset flow
"""

import pytest
from datetime import datetime, timedelta, timezone
from uuid import uuid4, UUID
from unittest.mock import AsyncMock, Mock, MagicMock

from src.application.services.auth_service import AuthService
from src.core.entities.user import User
from src.core.entities.role import Role
from src.core.entities.refresh_token import RefreshToken
from src.core.entities.security_event import SecurityEvent
from src.core.enums.security import SecurityEventType, TokenType
from src.core.exceptions.auth import (
    AccountLockedError,
    EmailAlreadyExistsError,
    EmailNotVerifiedError,
    InvalidCredentialsError,
    InvalidResetTokenError,
    TokenExpiredError,
    TokenInvalidError,
    TokenRevokedError,
    UsernameAlreadyExistsError,
    WeakPasswordError,
)
from src.core.exceptions.entity_not_found import UserNotFoundError
from src.core.ports.repositories import (
    IUserRepository,
    IRefreshTokenRepository,
    ISecurityEventRepository,
    IRoleRepository,
)
from src.core.ports.jwt_handler import IJWTHandler
from src.core.ports.security.password_hasher import IPasswordHasher


class TestAuthServiceRegister:
    """Tests for user registration."""

    @pytest.fixture
    def mock_user_repository(self) -> AsyncMock:
        repo = AsyncMock(spec=IUserRepository)
        return repo

    @pytest.fixture
    def mock_refresh_token_repository(self) -> AsyncMock:
        return AsyncMock(spec=IRefreshTokenRepository)

    @pytest.fixture
    def mock_security_event_repository(self) -> AsyncMock:
        return AsyncMock(spec=ISecurityEventRepository)

    @pytest.fixture
    def mock_role_repository(self) -> AsyncMock:
        return AsyncMock(spec=IRoleRepository)

    @pytest.fixture
    def mock_jwt_handler(self) -> Mock:
        return Mock(spec=IJWTHandler)

    @pytest.fixture
    def mock_password_hasher(self) -> Mock:
        hasher = Mock(spec=IPasswordHasher)
        hasher.hash_password.return_value = "hashed_password_123"
        return hasher

    @pytest.fixture
    def auth_service(
        self,
        mock_user_repository: AsyncMock,
        mock_refresh_token_repository: AsyncMock,
        mock_security_event_repository: AsyncMock,
        mock_role_repository: AsyncMock,
        mock_jwt_handler: Mock,
        mock_password_hasher: Mock,
    ) -> AuthService:
        return AuthService(
            user_repository=mock_user_repository,
            refresh_token_repository=mock_refresh_token_repository,
            security_event_repository=mock_security_event_repository,
            role_repository=mock_role_repository,
            jwt_handler=mock_jwt_handler,
            password_hasher=mock_password_hasher,
        )

    @pytest.mark.asyncio
    async def test_register_success(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
        mock_role_repository: AsyncMock,
        mock_security_event_repository: AsyncMock,
        mock_password_hasher: Mock,
    ):
        """Should successfully register a new user with email verification token."""
        # Arrange
        email = "newuser@example.com"
        username = "newuser"
        password = "SecurePass123!"
        full_name = "New User"

        mock_user_repository.get_by_email.return_value = None
        mock_user_repository.exists_by_username.return_value = False
        
        default_role = Role(
            id=uuid4(),
            name="user",
            display_name="User",
            description="Default user role"
        )
        mock_role_repository.get_by_name.return_value = default_role
        
        # Mock the add method to return the created user
        async def mock_add(user: User) -> User:
            return user
        mock_user_repository.add.side_effect = mock_add
        mock_security_event_repository.create.return_value = None

        # Act
        user = await auth_service.register(
            email=email,
            username=username,
            password=password,
            full_name=full_name,
        )

        # Assert
        assert user.email == email
        assert user.username == username
        assert user.full_name == full_name
        assert user.hashed_password == "hashed_password_123"
        assert user.email_verified is False
        assert user.email_verification_token is not None
        assert user.email_verification_sent_at is not None
        # disabled can be None by default, not False

        mock_user_repository.get_by_email.assert_called_once_with(email)
        mock_user_repository.exists_by_username.assert_called_once_with(username)
        mock_password_hasher.hash_password.assert_called_once_with(password)
        mock_role_repository.get_by_name.assert_called_once_with("user")
        mock_user_repository.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_register_duplicate_email(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
    ):
        """Should raise EmailAlreadyExistsError when email is already registered."""
        # Arrange
        email = "existing@example.com"
        existing_user = User(
            id=uuid4(),
            email=email,
            username="existing",
            hashed_password="hash",
        )
        mock_user_repository.get_by_email.return_value = existing_user

        # Act & Assert
        with pytest.raises(EmailAlreadyExistsError) as exc_info:
            await auth_service.register(
                email=email,
                username="newuser",
                password="Password123!",
            )

        assert email in str(exc_info.value)
        mock_user_repository.get_by_email.assert_called_once_with(email)

    @pytest.mark.asyncio
    async def test_register_duplicate_username(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
    ):
        """Should raise UsernameAlreadyExistsError when username is taken."""
        # Arrange
        username = "existinguser"
        mock_user_repository.get_by_email.return_value = None
        mock_user_repository.exists_by_username.return_value = True

        # Act & Assert
        with pytest.raises(UsernameAlreadyExistsError) as exc_info:
            await auth_service.register(
                email="new@example.com",
                username=username,
                password="Password123!",
            )

        assert username in str(exc_info.value)
        mock_user_repository.exists_by_username.assert_called_once_with(username)

    @pytest.mark.asyncio
    async def test_register_weak_password(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
    ):
        """Should raise WeakPasswordError when password doesn't meet requirements."""
        # Arrange
        mock_user_repository.get_by_email.return_value = None
        mock_user_repository.exists_by_username.return_value = False

        # Act & Assert - password too short
        with pytest.raises(WeakPasswordError) as exc_info:
            await auth_service.register(
                email="new@example.com",
                username="newuser",
                password="short",
            )
        assert "at least 8 characters" in str(exc_info.value)

        # Act & Assert - no uppercase
        with pytest.raises(WeakPasswordError):
            await auth_service.register(
                email="new@example.com",
                username="newuser",
                password="nouppercase123!",
            )

        # Act & Assert - no digit
        with pytest.raises(WeakPasswordError):
            await auth_service.register(
                email="new@example.com",
                username="newuser",
                password="NoDigits!",
            )

        # Note: Special character requirement depends on configuration
        # Testing it would require mocking settings


class TestAuthServiceLogin:
    """Tests for user login."""

    @pytest.fixture
    def mock_user_repository(self) -> AsyncMock:
        return AsyncMock(spec=IUserRepository)

    @pytest.fixture
    def mock_refresh_token_repository(self) -> AsyncMock:
        return AsyncMock(spec=IRefreshTokenRepository)

    @pytest.fixture
    def mock_security_event_repository(self) -> AsyncMock:
        return AsyncMock(spec=ISecurityEventRepository)

    @pytest.fixture
    def mock_role_repository(self) -> AsyncMock:
        return AsyncMock(spec=IRoleRepository)

    @pytest.fixture
    def mock_jwt_handler(self) -> Mock:
        handler = Mock(spec=IJWTHandler)
        handler.create_access_token.return_value = "access_token_abc"
        handler.create_refresh_token.return_value = ("refresh_token_xyz", "jti_123")
        handler.hash_token.return_value = "token_hash_123"
        return handler

    @pytest.fixture
    def mock_password_hasher(self) -> Mock:
        return Mock(spec=IPasswordHasher)

    @pytest.fixture
    def auth_service(
        self,
        mock_user_repository: AsyncMock,
        mock_refresh_token_repository: AsyncMock,
        mock_security_event_repository: AsyncMock,
        mock_role_repository: AsyncMock,
        mock_jwt_handler: Mock,
        mock_password_hasher: Mock,
    ) -> AuthService:
        return AuthService(
            user_repository=mock_user_repository,
            refresh_token_repository=mock_refresh_token_repository,
            security_event_repository=mock_security_event_repository,
            role_repository=mock_role_repository,
            jwt_handler=mock_jwt_handler,
            password_hasher=mock_password_hasher,
        )

    @pytest.mark.asyncio
    async def test_login_success(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
        mock_password_hasher: Mock,
        mock_jwt_handler: Mock,
        mock_refresh_token_repository: AsyncMock,
        mock_security_event_repository: AsyncMock,
        mock_role_repository: AsyncMock,
    ):
        """Should successfully authenticate user and return tokens."""
        # Arrange
        email = "user@example.com"
        password = "Password123!"
        user_id = uuid4()

        user = User(
            id=user_id,
            email=email,
            username="testuser",
            hashed_password="hashed_password",
            email_verified=True,
            disabled=False,
            failed_login_attempts=0,
        )
        
        # Mock role with permissions
        role = Role(
            id=uuid4(),
            name="user",
            display_name="User",
            description="User role",
            permissions=["users:read"],
        )
        
        mock_user_repository.get_by_email.return_value = user
        mock_password_hasher.verify_password.return_value = True
        mock_role_repository.get_user_roles.return_value = [role]
        mock_refresh_token_repository.create.return_value = None
        mock_security_event_repository.create.return_value = None

        # Act
        access_token, refresh_token, returned_user = await auth_service.login(
            email=email,
            password=password,
            ip_address="127.0.0.1",
        )

        # Assert
        assert access_token == "access_token_abc"
        assert refresh_token == "refresh_token_xyz"
        assert returned_user.id == user_id
        assert returned_user.email == email

        mock_user_repository.get_by_email.assert_called_once_with(email)
        mock_password_hasher.verify_password.assert_called_once_with(password, "hashed_password")
        mock_role_repository.get_user_roles.assert_called_once_with(user_id)
        mock_jwt_handler.create_access_token.assert_called_once()
        mock_jwt_handler.create_refresh_token.assert_called_once()
        mock_refresh_token_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_login_invalid_email(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
        mock_security_event_repository: AsyncMock,
    ):
        """Should raise InvalidCredentialsError for non-existent email."""
        # Arrange
        mock_user_repository.get_by_email.return_value = None

        # Act & Assert
        with pytest.raises(InvalidCredentialsError):
            await auth_service.login(
                email="nonexistent@example.com",
                password="password",
                ip_address="127.0.0.1",
            )

    @pytest.mark.asyncio
    async def test_login_wrong_password(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
        mock_password_hasher: Mock,
        mock_security_event_repository: AsyncMock,
    ):
        """Should raise InvalidCredentialsError for wrong password and increment failed attempts."""
        # Arrange
        user = User(
            id=uuid4(),
            email="user@example.com",
            username="testuser",
            hashed_password="hashed_password",
            email_verified=True,
            failed_login_attempts=0,
        )
        mock_user_repository.get_by_email.return_value = user
        mock_password_hasher.verify_password.return_value = False
        mock_user_repository.update.return_value = user

        # Act & Assert
        with pytest.raises(InvalidCredentialsError):
            await auth_service.login(
                email="user@example.com",
                password="wrongpassword",
                ip_address="127.0.0.1",
            )

        # Verify failed_login_attempts was incremented
        mock_user_repository.update.assert_called_once()
        updated_user = mock_user_repository.update.call_args[0][0]
        assert updated_user.failed_login_attempts == 1

    @pytest.mark.asyncio
    async def test_login_email_not_verified(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
        mock_password_hasher: Mock,
    ):
        """Should raise EmailNotVerifiedError when email is not verified."""
        # Arrange
        user = User(
            id=uuid4(),
            email="user@example.com",
            username="testuser",
            hashed_password="hashed_password",
            email_verified=False,  # Not verified
        )
        mock_user_repository.get_by_email.return_value = user
        mock_password_hasher.verify_password.return_value = True

        # Act & Assert
        with pytest.raises(EmailNotVerifiedError):
            await auth_service.login(
                email="user@example.com",
                password="Password123!",
                ip_address="127.0.0.1",
            )

    @pytest.mark.asyncio
    async def test_login_account_locked(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
        mock_password_hasher: Mock,
    ):
        """Should raise AccountLockedError when account is locked."""
        # Arrange
        locked_until = datetime.now(timezone.utc) + timedelta(minutes=30)
        user = User(
            id=uuid4(),
            email="user@example.com",
            username="testuser",
            hashed_password="hashed_password",
            email_verified=True,
            failed_login_attempts=5,
            locked_until=locked_until,
        )
        mock_user_repository.get_by_email.return_value = user
        mock_password_hasher.verify_password.return_value = True

        # Act & Assert
        with pytest.raises(AccountLockedError):
            await auth_service.login(
                email="user@example.com",
                password="Password123!",
                ip_address="127.0.0.1",
            )

    @pytest.mark.asyncio
    async def test_login_locks_account_after_max_attempts(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
        mock_password_hasher: Mock,
    ):
        """Should lock account after reaching max failed login attempts."""
        # Arrange
        user = User(
            id=uuid4(),
            email="user@example.com",
            username="testuser",
            hashed_password="hashed_password",
            email_verified=True,
            failed_login_attempts=4,  # One away from max (5)
        )
        mock_user_repository.get_by_email.return_value = user
        mock_password_hasher.verify_password.return_value = False
        mock_user_repository.update.return_value = user

        # Act & Assert
        with pytest.raises(InvalidCredentialsError):
            await auth_service.login(
                email="user@example.com",
                password="wrongpassword",
                ip_address="127.0.0.1",
            )

        # Verify account was locked
        mock_user_repository.update.assert_called_once()
        updated_user = mock_user_repository.update.call_args[0][0]
        assert updated_user.failed_login_attempts == 5
        assert updated_user.locked_until is not None
        assert updated_user.locked_until > datetime.now(timezone.utc)


class TestAuthServiceTokenRefresh:
    """Tests for token refresh."""

    @pytest.fixture
    def mock_user_repository(self) -> AsyncMock:
        return AsyncMock(spec=IUserRepository)

    @pytest.fixture
    def mock_refresh_token_repository(self) -> AsyncMock:
        return AsyncMock(spec=IRefreshTokenRepository)

    @pytest.fixture
    def mock_security_event_repository(self) -> AsyncMock:
        return AsyncMock(spec=ISecurityEventRepository)

    @pytest.fixture
    def mock_role_repository(self) -> AsyncMock:
        return AsyncMock(spec=IRoleRepository)

    @pytest.fixture
    def mock_jwt_handler(self) -> Mock:
        handler = Mock(spec=IJWTHandler)
        handler.verify_refresh_token.return_value = {
            "sub": str(uuid4()),
            "jti": "jti_old_123",
            "exp": (datetime.now(timezone.utc) + timedelta(days=1)).timestamp(),
        }
        handler.create_access_token.return_value = "new_access_token"
        handler.create_refresh_token.return_value = ("new_refresh_token", "new_jti")
        handler.hash_token.return_value = "token_hash_123"
        return handler

    @pytest.fixture
    def mock_password_hasher(self) -> Mock:
        return Mock(spec=IPasswordHasher)

    @pytest.fixture
    def auth_service(
        self,
        mock_user_repository: AsyncMock,
        mock_refresh_token_repository: AsyncMock,
        mock_security_event_repository: AsyncMock,
        mock_role_repository: AsyncMock,
        mock_jwt_handler: Mock,
        mock_password_hasher: Mock,
    ) -> AuthService:
        return AuthService(
            user_repository=mock_user_repository,
            refresh_token_repository=mock_refresh_token_repository,
            security_event_repository=mock_security_event_repository,
            role_repository=mock_role_repository,
            jwt_handler=mock_jwt_handler,
            password_hasher=mock_password_hasher,
        )

    @pytest.mark.asyncio
    async def test_refresh_token_success(
        self,
        auth_service: AuthService,
        mock_jwt_handler: Mock,
        mock_refresh_token_repository: AsyncMock,
        mock_user_repository: AsyncMock,
        mock_role_repository: AsyncMock,
        mock_security_event_repository: AsyncMock,
    ):
        """Should successfully refresh access token with token rotation."""
        # Arrange
        old_refresh_token = "old_refresh_token"
        user_id = uuid4()
        jti_old = "jti_old_123"
        
        mock_jwt_handler.verify_refresh_token.return_value = {
            "sub": str(user_id),
            "jti": jti_old,
            "exp": (datetime.now(timezone.utc) + timedelta(days=1)).timestamp(),
        }
        
        mock_refresh_token_repository.is_valid.return_value = True
        mock_refresh_token_repository.create.return_value = None
        mock_refresh_token_repository.revoke.return_value = True
        mock_security_event_repository.create.return_value = None
        
        user = User(
            id=user_id,
            email="user@example.com",
            username="testuser",
            hashed_password="hash",
        )
        mock_user_repository.get_by_id.return_value = user
        
        # Mock role with permissions
        role = Role(
            id=uuid4(),
            name="user",
            display_name="User",
            description="User role",
            permissions=["users:read"],
        )
        mock_role_repository.get_user_roles.return_value = [role]

        # Act
        new_access_token, new_refresh_token = await auth_service.refresh_access_token(old_refresh_token)

        # Assert
        assert new_access_token == "new_access_token"
        assert new_refresh_token == "new_refresh_token"

        mock_jwt_handler.verify_refresh_token.assert_called_once_with(old_refresh_token)
        mock_refresh_token_repository.is_valid.assert_called_once_with(jti_old)
        mock_user_repository.get_by_id.assert_called_once_with(user_id)
        mock_role_repository.get_user_roles.assert_called_once_with(user_id)
        mock_refresh_token_repository.revoke.assert_called_once()

    @pytest.mark.asyncio
    async def test_refresh_token_expired(
        self,
        auth_service: AuthService,
        mock_jwt_handler: Mock,
    ):
        """Should raise TokenExpiredError when refresh token is expired."""
        # Arrange
        mock_jwt_handler.verify_refresh_token.side_effect = TokenExpiredError("Token expired")

        # Act & Assert
        with pytest.raises(TokenExpiredError):
            await auth_service.refresh_access_token("expired_token")

    @pytest.mark.asyncio
    async def test_refresh_token_revoked(
        self,
        auth_service: AuthService,
        mock_jwt_handler: Mock,
        mock_refresh_token_repository: AsyncMock,
    ):
        """Should raise TokenRevokedError when refresh token was revoked."""
        # Arrange
        user_id = uuid4()
        jti = "jti_123"
        mock_jwt_handler.verify_refresh_token.return_value = {
            "sub": str(user_id),
            "jti": jti,
        }
        
        mock_refresh_token_repository.is_valid.return_value = False  # Token was revoked

        # Act & Assert
        with pytest.raises(TokenRevokedError):
            await auth_service.refresh_access_token("revoked_token")


class TestAuthServiceEmailVerification:
    """Tests for email verification."""

    @pytest.fixture
    def mock_user_repository(self) -> AsyncMock:
        # Not using spec= because interface doesn't define all methods used by service
        return AsyncMock()

    @pytest.fixture
    def mock_refresh_token_repository(self) -> AsyncMock:
        return AsyncMock(spec=IRefreshTokenRepository)

    @pytest.fixture
    def mock_security_event_repository(self) -> AsyncMock:
        return AsyncMock(spec=ISecurityEventRepository)

    @pytest.fixture
    def mock_role_repository(self) -> AsyncMock:
        return AsyncMock(spec=IRoleRepository)

    @pytest.fixture
    def mock_jwt_handler(self) -> Mock:
        return Mock(spec=IJWTHandler)

    @pytest.fixture
    def mock_password_hasher(self) -> Mock:
        return Mock(spec=IPasswordHasher)

    @pytest.fixture
    def auth_service(
        self,
        mock_user_repository: AsyncMock,
        mock_refresh_token_repository: AsyncMock,
        mock_security_event_repository: AsyncMock,
        mock_role_repository: AsyncMock,
        mock_jwt_handler: Mock,
        mock_password_hasher: Mock,
    ) -> AuthService:
        return AuthService(
            user_repository=mock_user_repository,
            refresh_token_repository=mock_refresh_token_repository,
            security_event_repository=mock_security_event_repository,
            role_repository=mock_role_repository,
            jwt_handler=mock_jwt_handler,
            password_hasher=mock_password_hasher,
        )

    @pytest.mark.asyncio
    async def test_verify_email_success(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
        mock_security_event_repository: AsyncMock,
    ):
        """Should successfully verify email with valid token."""
        # Arrange
        verification_token = "valid_token_abc123"
        user = User(
            id=uuid4(),
            email="user@example.com",
            username="testuser",
            hashed_password="hash",
            email_verified=False,
            email_verification_token=verification_token,
            email_verification_sent_at=datetime.now(timezone.utc) - timedelta(hours=1),
        )
        mock_user_repository.get_by_email_verification_token.return_value = user
        
        # Mock update to return updated user
        async def mock_update(u: User) -> User:
            return u
        mock_user_repository.update.side_effect = mock_update
        mock_security_event_repository.create.return_value = None

        # Act
        result = await auth_service.verify_email(verification_token)

        # Assert
        assert result.email_verified is True
        assert result.email_verification_token is None

        mock_user_repository.get_by_email_verification_token.assert_called_once_with(verification_token)
        mock_user_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_verify_email_invalid_token(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
    ):
        """Should raise InvalidResetTokenError for invalid token."""
        # Arrange
        mock_user_repository.get_by_email_verification_token.return_value = None

        # Act & Assert
        with pytest.raises(InvalidResetTokenError):
            await auth_service.verify_email("invalid_token")

    @pytest.mark.asyncio
    async def test_verify_email_expired_token(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
    ):
        """Should raise InvalidResetTokenError for expired token (>24h)."""
        # Arrange
        verification_token = "expired_token"
        user = User(
            id=uuid4(),
            email="user@example.com",
            username="testuser",
            hashed_password="hash",
            email_verified=False,
            email_verification_token=verification_token,
            email_verification_sent_at=datetime.now(timezone.utc) - timedelta(hours=25),  # Expired
        )
        mock_user_repository.get_by_email_verification_token.return_value = user

        # Act & Assert
        with pytest.raises(InvalidResetTokenError) as exc_info:
            await auth_service.verify_email(verification_token)
        
        assert "expired" in str(exc_info.value).lower()


class TestAuthServicePasswordReset:
    """Tests for password reset functionality."""

    @pytest.fixture
    def mock_user_repository(self) -> AsyncMock:
        # Not using spec= because interface doesn't define all methods used by service
        return AsyncMock()

    @pytest.fixture
    def mock_refresh_token_repository(self) -> AsyncMock:
        return AsyncMock()

    @pytest.fixture
    def mock_security_event_repository(self) -> AsyncMock:
        return AsyncMock(spec=ISecurityEventRepository)

    @pytest.fixture
    def mock_role_repository(self) -> AsyncMock:
        return AsyncMock(spec=IRoleRepository)

    @pytest.fixture
    def mock_jwt_handler(self) -> Mock:
        return Mock(spec=IJWTHandler)

    @pytest.fixture
    def mock_password_hasher(self) -> Mock:
        hasher = Mock(spec=IPasswordHasher)
        hasher.hash_password.return_value = "new_hashed_password"
        return hasher

    @pytest.fixture
    def auth_service(
        self,
        mock_user_repository: AsyncMock,
        mock_refresh_token_repository: AsyncMock,
        mock_security_event_repository: AsyncMock,
        mock_role_repository: AsyncMock,
        mock_jwt_handler: Mock,
        mock_password_hasher: Mock,
    ) -> AuthService:
        return AuthService(
            user_repository=mock_user_repository,
            refresh_token_repository=mock_refresh_token_repository,
            security_event_repository=mock_security_event_repository,
            role_repository=mock_role_repository,
            jwt_handler=mock_jwt_handler,
            password_hasher=mock_password_hasher,
        )

    @pytest.mark.asyncio
    async def test_request_password_reset_success(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
        mock_security_event_repository: AsyncMock,
    ):
        """Should successfully generate password reset token."""
        # Arrange
        email = "user@example.com"
        user = User(
            id=uuid4(),
            email=email,
            username="testuser",
            hashed_password="hash",
        )
        mock_user_repository.get_by_email.return_value = user
        
        # Mock update to return updated user
        async def mock_update(u: User) -> User:
            return u
        mock_user_repository.update.side_effect = mock_update
        mock_security_event_repository.create.return_value = None

        # Act
        result = await auth_service.request_password_reset(email)

        # Assert
        assert result is True
        mock_user_repository.get_by_email.assert_called_once_with(email)
        mock_user_repository.update.assert_called_once()
        
        updated_user = mock_user_repository.update.call_args[0][0]
        assert updated_user.password_reset_token is not None
        assert updated_user.password_reset_sent_at is not None

    @pytest.mark.asyncio
    async def test_request_password_reset_user_not_found(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
    ):
        """Should silently succeed for non-existent email (security measure)."""
        # Arrange
        mock_user_repository.get_by_email.return_value = None

        # Act - should not raise exception
        await auth_service.request_password_reset("nonexistent@example.com")

        # Assert
        mock_user_repository.get_by_email.assert_called_once()
        mock_user_repository.update.assert_not_called()

    @pytest.mark.asyncio
    async def test_reset_password_success(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
        mock_refresh_token_repository: AsyncMock,
        mock_security_event_repository: AsyncMock,
        mock_password_hasher: Mock,
    ):
        """Should successfully reset password with valid token."""
        # Arrange
        reset_token = "valid_reset_token"
        new_password = "NewSecure123!"
        
        user = User(
            id=uuid4(),
            email="user@example.com",
            username="testuser",
            hashed_password="old_hash",
            password_reset_token=reset_token,
            password_reset_sent_at=datetime.now(timezone.utc) - timedelta(minutes=30),
        )
        mock_user_repository.get_by_password_reset_token.return_value = user
        
        # Mock update to return updated user
        async def mock_update(u: User) -> User:
            return u
        mock_user_repository.update.side_effect = mock_update
        mock_refresh_token_repository.revoke_all_for_user.return_value = None
        mock_security_event_repository.create.return_value = None

        # Act
        result = await auth_service.reset_password(reset_token, new_password)

        # Assert
        assert result.hashed_password == "new_hashed_password"
        assert result.password_reset_token is None
        assert result.last_password_change is not None

        mock_password_hasher.hash_password.assert_called_once_with(new_password)
        mock_user_repository.get_by_password_reset_token.assert_called_once_with(reset_token)
        mock_user_repository.update.assert_called_once()
        mock_refresh_token_repository.revoke_all_for_user.assert_called_once_with(user.id)

    @pytest.mark.asyncio
    async def test_reset_password_invalid_token(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
    ):
        """Should raise InvalidResetTokenError for invalid token."""
        # Arrange
        mock_user_repository.get_by_password_reset_token.return_value = None

        # Act & Assert
        with pytest.raises(InvalidResetTokenError):
            await auth_service.reset_password("invalid_token", "NewPassword123!")

    @pytest.mark.asyncio
    async def test_reset_password_expired_token(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
    ):
        """Should raise InvalidResetTokenError for expired token (>1h)."""
        # Arrange
        reset_token = "expired_token"
        user = User(
            id=uuid4(),
            email="user@example.com",
            username="testuser",
            hashed_password="hash",
            password_reset_token=reset_token,
            password_reset_sent_at=datetime.now(timezone.utc) - timedelta(hours=2),  # Expired
        )
        mock_user_repository.get_by_password_reset_token.return_value = user

        # Act & Assert
        with pytest.raises(InvalidResetTokenError) as exc_info:
            await auth_service.reset_password(reset_token, "NewPassword123!")
        
        assert "expired" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_reset_password_weak_password(
        self,
        auth_service: AuthService,
        mock_user_repository: AsyncMock,
    ):
        """Should raise WeakPasswordError when new password is weak."""
        # Arrange
        reset_token = "valid_token"
        user = User(
            id=uuid4(),
            email="user@example.com",
            username="testuser",
            hashed_password="hash",
            password_reset_token=reset_token,
            password_reset_sent_at=datetime.now(timezone.utc),
        )
        mock_user_repository.get_by_password_reset_token.return_value = user

        # Act & Assert
        with pytest.raises(WeakPasswordError):
            await auth_service.reset_password(reset_token, "weak")


class TestAuthServiceLogout:
    """Tests for user logout."""

    @pytest.fixture
    def mock_user_repository(self) -> AsyncMock:
        return AsyncMock(spec=IUserRepository)

    @pytest.fixture
    def mock_refresh_token_repository(self) -> AsyncMock:
        return AsyncMock(spec=IRefreshTokenRepository)

    @pytest.fixture
    def mock_security_event_repository(self) -> AsyncMock:
        return AsyncMock(spec=ISecurityEventRepository)

    @pytest.fixture
    def mock_role_repository(self) -> AsyncMock:
        return AsyncMock(spec=IRoleRepository)

    @pytest.fixture
    def mock_jwt_handler(self) -> Mock:
        handler = Mock(spec=IJWTHandler)
        handler.extract_jti.return_value = "jti_123"
        handler.extract_user_id.return_value = uuid4()
        return handler

    @pytest.fixture
    def mock_password_hasher(self) -> Mock:
        return Mock(spec=IPasswordHasher)

    @pytest.fixture
    def auth_service(
        self,
        mock_user_repository: AsyncMock,
        mock_refresh_token_repository: AsyncMock,
        mock_security_event_repository: AsyncMock,
        mock_role_repository: AsyncMock,
        mock_jwt_handler: Mock,
        mock_password_hasher: Mock,
    ) -> AuthService:
        return AuthService(
            user_repository=mock_user_repository,
            refresh_token_repository=mock_refresh_token_repository,
            security_event_repository=mock_security_event_repository,
            role_repository=mock_role_repository,
            jwt_handler=mock_jwt_handler,
            password_hasher=mock_password_hasher,
        )

    @pytest.mark.asyncio
    async def test_logout_success(
        self,
        auth_service: AuthService,
        mock_jwt_handler: Mock,
        mock_refresh_token_repository: AsyncMock,
        mock_security_event_repository: AsyncMock,
    ):
        """Should successfully revoke refresh token on logout."""
        # Arrange
        refresh_token = "refresh_token_abc"
        jti = "jti_123"
        user_id = uuid4()
        
        mock_jwt_handler.extract_jti.return_value = jti
        mock_jwt_handler.extract_user_id.return_value = user_id
        mock_refresh_token_repository.revoke.return_value = True
        mock_security_event_repository.create.return_value = None

        # Act
        result = await auth_service.logout(refresh_token, ip_address="127.0.0.1")

        # Assert
        assert result is True
        mock_jwt_handler.extract_jti.assert_called_once_with(refresh_token)
        mock_jwt_handler.extract_user_id.assert_called_once_with(refresh_token)
        mock_refresh_token_repository.revoke.assert_called_once_with(jti)
        mock_security_event_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_logout_invalid_token(
        self,
        auth_service: AuthService,
        mock_jwt_handler: Mock,
    ):
        """Should raise TokenInvalidError for malformed token."""
        # Arrange
        mock_jwt_handler.extract_jti.side_effect = Exception("Invalid token")

        # Act & Assert
        with pytest.raises(TokenInvalidError):
            await auth_service.logout("invalid_token", ip_address="127.0.0.1")
