"""
Authentication and authorization related exceptions.
"""

from typing import Optional


class AuthenticationError(Exception):
    """Base exception for authentication errors."""
    
    def __init__(self, message: str = "Authentication failed"):
        self.message = message
        super().__init__(self.message)


class InvalidCredentialsError(AuthenticationError):
    """Raised when login credentials are invalid."""
    
    def __init__(self, message: str = "Invalid username or password"):
        super().__init__(message)


class AccountLockedError(AuthenticationError):
    """Raised when an account is temporarily locked due to failed login attempts."""
    
    def __init__(
        self,
        locked_until: Optional[str] = None,
        message: str = "Account is temporarily locked"
    ):
        self.locked_until = locked_until
        if locked_until:
            message = f"{message}. Please try again after {locked_until}"
        super().__init__(message)


class EmailNotVerifiedError(AuthenticationError):
    """Raised when trying to login with an unverified email."""
    
    def __init__(self, message: str = "Email address not verified"):
        super().__init__(message)


class TokenError(Exception):
    """Base exception for token-related errors."""
    
    def __init__(self, message: str = "Token error"):
        self.message = message
        super().__init__(self.message)


class TokenExpiredError(TokenError):
    """Raised when a token has expired."""
    
    def __init__(self, message: str = "Token has expired"):
        super().__init__(message)


class TokenInvalidError(TokenError):
    """Raised when a token is invalid or malformed."""
    
    def __init__(self, message: str = "Invalid token"):
        super().__init__(message)


class TokenRevokedError(TokenError):
    """Raised when trying to use a revoked token."""
    
    def __init__(self, message: str = "Token has been revoked"):
        super().__init__(message)


class AuthorizationError(Exception):
    """Base exception for authorization errors."""
    
    def __init__(self, message: str = "Authorization failed"):
        self.message = message
        super().__init__(self.message)


class InsufficientPermissionsError(AuthorizationError):
    """Raised when user lacks required permissions."""
    
    def __init__(
        self,
        required_permission: Optional[str] = None,
        message: str = "Insufficient permissions"
    ):
        self.required_permission = required_permission
        if required_permission:
            message = f"{message}. Required: {required_permission}"
        super().__init__(message)


class RoleNotFoundError(AuthorizationError):
    """Raised when a role is not found."""
    
    def __init__(self, role_name: str):
        self.role_name = role_name
        super().__init__(f"Role not found: {role_name}")


class PermissionNotFoundError(AuthorizationError):
    """Raised when a permission is not found."""
    
    def __init__(self, permission_name: str):
        self.permission_name = permission_name
        super().__init__(f"Permission not found: {permission_name}")


class RegistrationError(Exception):
    """Base exception for registration errors."""
    
    def __init__(self, message: str = "Registration failed"):
        self.message = message
        super().__init__(self.message)


class EmailAlreadyExistsError(RegistrationError):
    """Raised when trying to register with an email that already exists."""
    
    def __init__(self, email: str):
        self.email = email
        super().__init__(f"Email already registered: {email}")


class UsernameAlreadyExistsError(RegistrationError):
    """Raised when trying to register with a username that already exists."""
    
    def __init__(self, username: str):
        self.username = username
        super().__init__(f"Username already taken: {username}")


class WeakPasswordError(RegistrationError):
    """Raised when password doesn't meet strength requirements."""
    
    def __init__(self, reason: str = "Password is too weak"):
        self.reason = reason
        super().__init__(reason)


class PasswordResetError(Exception):
    """Base exception for password reset errors."""
    
    def __init__(self, message: str = "Password reset failed"):
        self.message = message
        super().__init__(self.message)


class InvalidResetTokenError(PasswordResetError):
    """Raised when password reset token is invalid or expired."""
    
    def __init__(self, message: str = "Invalid or expired password reset token"):
        super().__init__(message)


class RateLimitExceededError(Exception):
    """Raised when rate limit is exceeded."""
    
    def __init__(
        self,
        retry_after: Optional[int] = None,
        message: str = "Rate limit exceeded"
    ):
        self.retry_after = retry_after
        if retry_after:
            message = f"{message}. Please try again in {retry_after} seconds"
        super().__init__(message)
