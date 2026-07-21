"""
Security-related enums.
"""

from enum import Enum


class SecurityEventType(str, Enum):
    """Types of security events that can be logged."""
    
    # Authentication events
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    
    # Token events
    TOKEN_REFRESH_SUCCESS = "token_refresh_success"
    TOKEN_REFRESH_FAILED = "token_refresh_failed"
    TOKEN_REVOKED = "token_revoked"
    
    # Registration events
    REGISTRATION_SUCCESS = "registration_success"
    REGISTRATION_FAILED = "registration_failed"
    EMAIL_VERIFICATION_SUCCESS = "email_verification_success"
    EMAIL_VERIFICATION_FAILED = "email_verification_failed"
    
    # Password events
    PASSWORD_CHANGE_SUCCESS = "password_change_success"
    PASSWORD_CHANGE_FAILED = "password_change_failed"
    PASSWORD_RESET_REQUESTED = "password_reset_requested"
    PASSWORD_RESET_SUCCESS = "password_reset_success"
    PASSWORD_RESET_FAILED = "password_reset_failed"
    
    # Account security events
    ACCOUNT_LOCKED = "account_locked"
    ACCOUNT_UNLOCKED = "account_unlocked"
    TOO_MANY_FAILED_ATTEMPTS = "too_many_failed_attempts"
    
    # Permission events
    PERMISSION_DENIED = "permission_denied"
    ROLE_ASSIGNED = "role_assigned"
    ROLE_REMOVED = "role_removed"


class TokenType(str, Enum):
    """Types of authentication tokens."""
    
    ACCESS = "access"
    REFRESH = "refresh"
    EMAIL_VERIFICATION = "email_verification"
    PASSWORD_RESET = "password_reset"
