"""
Authentication Service for user registration, login, and token management.
"""

from datetime import datetime, timedelta, timezone
from uuid import uuid4, UUID

from src.application.services.base_service import BaseService
from src.configurations.settings import settings
from src.core.entities.refresh_token import RefreshToken
from src.core.entities.security_event import SecurityEvent
from src.core.entities.user import User
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
from src.core.ports.jwt_handler import IJWTHandler
from src.core.ports.password_hasher import IPasswordHasher
from src.core.ports.repositories.refresh_token_repository import IRefreshTokenRepository
from src.core.ports.repositories.role_repository import IRoleRepository
from src.core.ports.repositories.security_event_repository import ISecurityEventRepository
from src.core.ports.repositories.user import IUserRepository


class AuthService(BaseService):
    """Service for authentication operations."""
    
    def __init__(
        self,
        user_repository: IUserRepository,
        refresh_token_repository: IRefreshTokenRepository,
        security_event_repository: ISecurityEventRepository,
        role_repository: IRoleRepository,
        jwt_handler: IJWTHandler,
        password_hasher: IPasswordHasher,
    ):
        self._user_repo = user_repository
        self._refresh_token_repo = refresh_token_repository
        self._security_event_repo = security_event_repository
        self._role_repo = role_repository
        self._jwt_handler = jwt_handler
        self._password_hasher = password_hasher
    
    async def register(
        self,
        email: str,
        username: str,
        password: str,
        full_name: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> User:
        """
        Register a new user.
        
        Args:
            email: User's email address
            username: User's username
            password: User's password
            full_name: Optional full name
            ip_address: IP address of registration request
            user_agent: User agent of registration request
            
        Returns:
            Created User entity
            
        Raises:
            EmailAlreadyExistsError: If email is already registered
            UsernameAlreadyExistsError: If username is already taken
            WeakPasswordError: If password doesn't meet requirements
        """
        # Check if email already exists
        existing_email = await self._user_repo.get_by_email(email)
        if existing_email:
            raise EmailAlreadyExistsError(email)
        
        # Check if username already exists
        if await self._user_repo.exists_by_username(username):
            raise UsernameAlreadyExistsError(username)
        
        # Validate password strength
        self._validate_password_strength(password)
        
        # Hash password
        hashed_password = self._password_hasher.hash_password(password)
        
        # Generate email verification token
        email_verification_token = str(uuid4())
        
        # Create user
        user = User(
            id=uuid4(),
            email=email,
            username=username,
            hashed_password=hashed_password,
            full_name=full_name,
            email_verified=False,
            email_verification_token=email_verification_token,
            email_verification_sent_at=datetime.now(timezone.utc),
            failed_login_attempts=0,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        # Save user
        created_user = await self._user_repo.add(user)
        
        # Assign default "user" role
        default_role = await self._role_repo.get_by_name("user")
        if default_role:
            await self._role_repo.assign_to_user(created_user.id, default_role.id)
        
        # Log security event
        event = SecurityEvent(
            id=uuid4(),
            user_id=created_user.id,
            event_type="registration_success",
            ip_address=ip_address or "unknown",
            user_agent=user_agent,
            success=True,
            event_metadata={"email": email, "username": username},
            created_at=datetime.now(timezone.utc),
        )
        await self._security_event_repo.create(event)
        
        # TODO: Send verification email
        
        return created_user
    
    async def login(
        self,
        email: str,
        password: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
        device_info: str | None = None,
    ) -> tuple[str, str, User]:
        """
        Authenticate user and generate tokens.
        
        Args:
            email: User's email address
            password: User's password
            ip_address: IP address of login request
            user_agent: User agent of login request
            device_info: Device information
            
        Returns:
            Tuple of (access_token, refresh_token, user)
            
        Raises:
            InvalidCredentialsError: If credentials are invalid
            AccountLockedError: If account is locked
            EmailNotVerifiedError: If email is not verified
        """
        # Get user by email
        user = await self._user_repo.get_by_email(email)
        
        if not user:
            # Log failed attempt
            await self._log_failed_login(email, ip_address, user_agent, "user_not_found")
            raise InvalidCredentialsError()
        
        # Check if account is locked
        if user.locked_until and user.locked_until > datetime.now(timezone.utc):
            await self._log_failed_login(email, ip_address, user_agent, "account_locked")
            raise AccountLockedError(locked_until=user.locked_until.isoformat())
        
        # Verify password
        if not self._password_hasher.verify_password(password, user.hashed_password):
            # Increment failed login attempts
            await self._handle_failed_login(user, ip_address, user_agent)
            raise InvalidCredentialsError()
        
        # Check if email is verified (optional based on settings)
        if settings.security.require_email_verification and not user.email_verified:
            raise EmailNotVerifiedError()
        
        # Reset failed login attempts
        if user.failed_login_attempts > 0:
            user.failed_login_attempts = 0
            user.locked_until = None
            await self._user_repo.update(user)
        
        # Update last login
        user.last_login = datetime.now(timezone.utc)
        await self._user_repo.update(user)
        
        # Get user roles and permissions
        roles = await self._role_repo.get_user_roles(user.id)
        role_names = [role.name for role in roles]
        
        # Collect all permissions from all roles
        permissions_set = set()
        for role in roles:
            permissions_set.update(role.permissions)
        permissions = list(permissions_set)
        
        # Generate tokens
        access_token = self._jwt_handler.create_access_token(
            user_id=user.id,
            email=user.email,
            roles=role_names,
            permissions=permissions,
        )
        
        refresh_token_str, refresh_token_jti = self._jwt_handler.create_refresh_token(
            user_id=user.id,
        )
        
        # Store refresh token
        refresh_token = RefreshToken(
            id=uuid4(),
            user_id=user.id,
            token_jti=refresh_token_jti,
            token_hash=self._jwt_handler.hash_token(refresh_token_str),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.jwt.refresh_token_expire_days),
            device_info=device_info,
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.now(timezone.utc),
        )
        await self._refresh_token_repo.create(refresh_token)
        
        # Log successful login
        event = SecurityEvent.login_success(
            user_id=user.id,
            ip_address=ip_address or "unknown",
            user_agent=user_agent,
            metadata={"device_info": device_info},
        )
        await self._security_event_repo.create(event)
        
        return access_token, refresh_token_str, user
    
    async def logout(
        self,
        refresh_token: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        """
        Logout user by revoking refresh token.
        
        Args:
            refresh_token: Refresh token to revoke
            ip_address: IP address of logout request
            user_agent: User agent of logout request
            
        Returns:
            True if logout was successful
            
        Raises:
            TokenInvalidError: If token is invalid
        """
        try:
            # Extract JTI from token
            jti = self._jwt_handler.extract_jti(refresh_token)
            user_id = self._jwt_handler.extract_user_id(refresh_token)
            
            # Revoke token
            revoked = await self._refresh_token_repo.revoke(jti)
            
            if revoked:
                # Log logout event
                event = SecurityEvent(
                    id=uuid4(),
                    user_id=user_id,
                    event_type="logout",
                    ip_address=ip_address or "unknown",
                    user_agent=user_agent,
                    success=True,
                    created_at=datetime.now(timezone.utc),
                )
                await self._security_event_repo.create(event)
            
            return revoked
        
        except Exception as e:
            raise TokenInvalidError(f"Failed to logout: {str(e)}")
    
    async def refresh_access_token(
        self,
        refresh_token: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[str, str]:
        """
        Generate new access and refresh tokens using a valid refresh token.
        
        Args:
            refresh_token: Current refresh token
            ip_address: IP address of refresh request
            user_agent: User agent of refresh request
            
        Returns:
            Tuple of (new_access_token, new_refresh_token)
            
        Raises:
            TokenExpiredError: If refresh token has expired
            TokenInvalidError: If refresh token is invalid
            TokenRevokedError: If refresh token has been revoked
        """
        # Verify refresh token
        try:
            payload = self._jwt_handler.verify_refresh_token(refresh_token)
        except TokenExpiredError:
            raise
        except Exception as e:
            raise TokenInvalidError(f"Invalid refresh token: {str(e)}")
        
        user_id = UUID(payload["sub"])
        jti = payload["jti"]
        
        # Check if token is valid in database
        is_valid = await self._refresh_token_repo.is_valid(jti)
        if not is_valid:
            raise TokenRevokedError()
        
        # Get user
        user = await self._user_repo.get_by_id(user_id)
        if not user:
            raise TokenInvalidError("User not found")
        
        # Get user roles and permissions
        roles = await self._role_repo.get_user_roles(user.id)
        role_names = [role.name for role in roles]
        
        permissions_set = set()
        for role in roles:
            permissions_set.update(role.permissions)
        permissions = list(permissions_set)
        
        # Generate new tokens
        new_access_token = self._jwt_handler.create_access_token(
            user_id=user.id,
            email=user.email,
            roles=role_names,
            permissions=permissions,
        )
        
        new_refresh_token_str, new_refresh_token_jti = self._jwt_handler.create_refresh_token(
            user_id=user.id,
        )
        
        # Revoke old token and store new one
        await self._refresh_token_repo.revoke(jti, replaced_by_jti=new_refresh_token_jti)
        
        new_refresh_token = RefreshToken(
            id=uuid4(),
            user_id=user.id,
            token_jti=new_refresh_token_jti,
            token_hash=self._jwt_handler.hash_token(new_refresh_token_str),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.jwt.refresh_token_expire_days),
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.now(timezone.utc),
        )
        await self._refresh_token_repo.create(new_refresh_token)
        
        # Log token refresh
        event = SecurityEvent(
            id=uuid4(),
            user_id=user.id,
            event_type="token_refresh_success",
            ip_address=ip_address or "unknown",
            user_agent=user_agent,
            success=True,
            created_at=datetime.now(timezone.utc),
        )
        await self._security_event_repo.create(event)
        
        return new_access_token, new_refresh_token_str
    
    async def verify_email(self, token: str) -> User:
        """
        Verify user's email address.
        
        Args:
            token: Email verification token
            
        Returns:
            Updated User entity
            
        Raises:
            InvalidResetTokenError: If token is invalid or expired
        """
        user = await self._user_repo.get_by_email_verification_token(token)
        
        if not user:
            raise InvalidResetTokenError("Invalid verification token")
        
        # Check if token has expired (24 hours)
        if user.email_verification_sent_at:
            expiry = user.email_verification_sent_at + timedelta(hours=24)
            if datetime.now(timezone.utc) > expiry:
                raise InvalidResetTokenError("Verification token has expired")
        
        # Mark email as verified
        user.email_verified = True
        user.email_verification_token = None
        user.email_verification_sent_at = None
        user.updated_at = datetime.now(timezone.utc)
        
        updated_user = await self._user_repo.update(user)
        
        # Log event
        event = SecurityEvent(
            id=uuid4(),
            user_id=user.id,
            event_type="email_verification_success",
            ip_address="unknown",
            success=True,
            created_at=datetime.now(timezone.utc),
        )
        await self._security_event_repo.create(event)
        
        return updated_user
    
    async def request_password_reset(
        self,
        email: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> bool:
        """
        Request password reset for a user.
        
        Args:
            email: User's email address
            ip_address: IP address of request
            user_agent: User agent of request
            
        Returns:
            True if request was processed (always returns True for security)
        """
        user = await self._user_repo.get_by_email(email)
        
        if user:
            # Generate password reset token
            reset_token = str(uuid4())
            
            user.password_reset_token = reset_token
            user.password_reset_sent_at = datetime.now(timezone.utc)
            user.updated_at = datetime.now(timezone.utc)
            
            await self._user_repo.update(user)
            
            # Log event
            event = SecurityEvent.password_reset_requested(
                user_id=user.id,
                ip_address=ip_address or "unknown",
                user_agent=user_agent,
            )
            await self._security_event_repo.create(event)
            
            # TODO: Send password reset email
        
        # Always return True for security (don't reveal if email exists)
        return True
    
    async def reset_password(self, token: str, new_password: str) -> User:
        """
        Reset user's password using reset token.
        
        Args:
            token: Password reset token
            new_password: New password
            
        Returns:
            Updated User entity
            
        Raises:
            InvalidResetTokenError: If token is invalid or expired
            WeakPasswordError: If new password doesn't meet requirements
        """
        user = await self._user_repo.get_by_password_reset_token(token)
        
        if not user:
            raise InvalidResetTokenError("Invalid reset token")
        
        # Check if token has expired (1 hour)
        if user.password_reset_sent_at:
            expiry = user.password_reset_sent_at + timedelta(hours=1)
            if datetime.now(timezone.utc) > expiry:
                raise InvalidResetTokenError("Reset token has expired")
        
        # Validate new password
        self._validate_password_strength(new_password)
        
        # Hash new password
        hashed_password = self._password_hasher.hash_password(new_password)
        
        # Update user
        user.hashed_password = hashed_password
        user.password_reset_token = None
        user.password_reset_sent_at = None
        user.last_password_change = datetime.now(timezone.utc)
        user.updated_at = datetime.now(timezone.utc)
        
        updated_user = await self._user_repo.update(user)
        
        # Revoke all refresh tokens for security
        await self._refresh_token_repo.revoke_all_for_user(user.id)
        
        # Log event
        event = SecurityEvent(
            id=uuid4(),
            user_id=user.id,
            event_type="password_reset_success",
            ip_address="unknown",
            success=True,
            created_at=datetime.now(timezone.utc),
        )
        await self._security_event_repo.create(event)
        
        return updated_user
    
    def _validate_password_strength(self, password: str) -> None:
        """Validate password meets strength requirements."""
        min_length = settings.password.min_length
        
        if len(password) < min_length:
            raise WeakPasswordError(f"Password must be at least {min_length} characters long")
        
        if settings.password.require_uppercase and not any(c.isupper() for c in password):
            raise WeakPasswordError("Password must contain at least one uppercase letter")
        
        if settings.password.require_lowercase and not any(c.islower() for c in password):
            raise WeakPasswordError("Password must contain at least one lowercase letter")
        
        if settings.password.require_digits and not any(c.isdigit() for c in password):
            raise WeakPasswordError("Password must contain at least one digit")
        
        if settings.password.require_special and not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            raise WeakPasswordError("Password must contain at least one special character")
    
    async def _handle_failed_login(
        self,
        user: User,
        ip_address: str | None,
        user_agent: str | None,
    ) -> None:
        """Handle failed login attempt."""
        user.failed_login_attempts += 1
        
        # Check if account should be locked
        if user.failed_login_attempts >= settings.security.max_failed_login_attempts:
            user.locked_until = datetime.now(timezone.utc) + timedelta(
                minutes=settings.security.account_lockout_duration_minutes
            )
            
            # Log account locked event
            event = SecurityEvent.account_locked(
                user_id=user.id,
                ip_address=ip_address or "unknown",
                user_agent=user_agent,
                metadata={"failed_attempts": user.failed_login_attempts},
            )
            await self._security_event_repo.create(event)
        
        await self._user_repo.update(user)
        
        # Log failed login
        await self._log_failed_login(
            user.email,
            ip_address,
            user_agent,
            "invalid_password",
            user_id=user.id,
        )
    
    async def _log_failed_login(
        self,
        email: str,
        ip_address: str | None,
        user_agent: str | None,
        reason: str,
        user_id: UUID | None = None,
    ) -> None:
        """Log failed login attempt."""
        event = SecurityEvent(
            id=uuid4(),
            user_id=user_id,
            event_type="login_failed",
            ip_address=ip_address or "unknown",
            user_agent=user_agent,
            success=False,
            event_metadata={"email": email, "reason": reason},
            created_at=datetime.now(timezone.utc),
        )
        await self._security_event_repo.create(event)
    
    async def change_password(
        self,
        user_id: UUID,
        current_password: str,
        new_password: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> User:
        """Change user password (requires current password).
        
        Args:
            user_id: ID of the user changing password
            current_password: Current password for verification
            new_password: New password to set
            ip_address: IP address of the request
            user_agent: User agent string
            
        Returns:
            Updated user entity
            
        Raises:
            UserNotFoundError: If user doesn't exist
            InvalidCredentialsError: If current password is incorrect
            WeakPasswordError: If new password doesn't meet requirements
        """
        # Get user
        user = await self._user_repo.get_by_id(user_id)
        if not user:
            raise UserNotFoundError(f"User with id {user_id} not found")
        
        # Verify current password
        if not self._password_hasher.verify_password(current_password, user.hashed_password):
            # Log failed attempt
            event = SecurityEvent(
                id=uuid4(),
                user_id=user.id,
                event_type="password_change_failed",
                ip_address=ip_address or "unknown",
                user_agent=user_agent,
                success=False,
                event_metadata={"reason": "invalid_current_password"},
                created_at=datetime.now(timezone.utc),
            )
            await self._security_event_repo.create(event)
            raise InvalidCredentialsError("Current password is incorrect")
        
        # Validate new password strength
        self._validate_password_strength(new_password)
        
        # Hash new password
        hashed_password = self._password_hasher.hash_password(new_password)
        
        # Update user
        user.hashed_password = hashed_password
        user.last_password_change = datetime.now(timezone.utc)
        await self._user_repo.update(user)
        
        # Revoke all refresh tokens (force re-login on all devices)
        await self._refresh_token_repo.revoke_all_for_user(user.id)
        
        # Log successful password change
        event = SecurityEvent.password_changed(
            user_id=user.id,
            ip_address=ip_address or "unknown",
            user_agent=user_agent,
            metadata={"tokens_revoked": True},
        )
        await self._security_event_repo.create(event)
        
        return user
