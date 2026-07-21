"""
Authentication-related Pydantic schemas for API requests and responses.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


# ========== Request Schemas ==========

class RegisterRequest(BaseModel):
    """Request schema for user registration."""
    
    email: EmailStr = Field(..., description="User's email address")
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    password: str = Field(..., min_length=8, max_length=128, description="Password")
    full_name: Optional[str] = Field(None, max_length=100, description="Full name")
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Validate username format."""
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, underscores, and hyphens')
        return v
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "user@example.com",
                    "username": "john_doe",
                    "password": "SecurePass123!",
                    "full_name": "John Doe"
                }
            ]
        }
    }


class LoginRequest(BaseModel):
    """Request schema for user login."""
    
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="Password")
    device_info: Optional[str] = Field(None, max_length=200, description="Device information")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "user@example.com",
                    "password": "SecurePass123!",
                    "device_info": "Chrome on Windows 10"
                }
            ]
        }
    }


class RefreshTokenRequest(BaseModel):
    """Request schema for refreshing access token."""
    
    refresh_token: str = Field(..., description="Valid refresh token")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
                }
            ]
        }
    }


class PasswordResetRequest(BaseModel):
    """Request schema for password reset."""
    
    email: EmailStr = Field(..., description="User's email address")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "user@example.com"
                }
            ]
        }
    }


class PasswordResetConfirm(BaseModel):
    """Request schema for confirming password reset."""
    
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "token": "550e8400-e29b-41d4-a716-446655440000",
                    "new_password": "NewSecurePass123!"
                }
            ]
        }
    }


class EmailVerificationRequest(BaseModel):
    """Request schema for email verification."""
    
    token: str = Field(..., description="Email verification token")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "token": "550e8400-e29b-41d4-a716-446655440000"
                }
            ]
        }
    }


class ChangePasswordRequest(BaseModel):
    """Request schema for changing password (authenticated user)."""
    
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "current_password": "OldPassword123!",
                    "new_password": "NewSecurePass456!"
                }
            ]
        }
    }


# ========== Response Schemas ==========

class TokenResponse(BaseModel):
    """Response schema for token-based authentication."""
    
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiration time in seconds")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "token_type": "bearer",
                    "expires_in": 900
                }
            ]
        }
    }


class UserResponse(BaseModel):
    """Response schema for user information."""
    
    id: UUID
    email: str
    username: str
    full_name: Optional[str] = None
    email_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    roles: list[str] = []
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "email": "user@example.com",
                    "username": "john_doe",
                    "full_name": "John Doe",
                    "email_verified": True,
                    "created_at": "2025-11-12T10:30:00Z",
                    "last_login": "2025-11-12T15:45:00Z"
                }
            ]
        }
    }


class LoginResponse(BaseModel):
    """Response schema for successful login."""
    
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiration time in seconds")
    user: UserResponse = Field(..., description="User information")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "token_type": "bearer",
                    "expires_in": 900,
                    "user": {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "email": "user@example.com",
                        "username": "john_doe",
                        "full_name": "John Doe",
                        "email_verified": True,
                        "created_at": "2025-11-12T10:30:00Z",
                        "last_login": "2025-11-12T15:45:00Z"
                    }
                }
            ]
        }
    }


class MessageResponse(BaseModel):
    """Generic message response."""
    
    message: str = Field(..., description="Response message")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "message": "Operation completed successfully"
                }
            ]
        }
    }


class ErrorResponse(BaseModel):
    """Error response schema."""
    
    detail: str = Field(..., description="Error detail message")
    error_code: Optional[str] = Field(None, description="Application-specific error code")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "detail": "Invalid credentials",
                    "error_code": "AUTH_001"
                }
            ]
        }
    }
