"""
Authentication endpoints for user registration, login, and token management.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from src.api.dependencies import get_auth_service, get_current_user, get_role_repository
from src.core.entities.user import User
from src.core.ports.repositories.role_repository import IRoleRepository
from src.api.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    EmailVerificationRequest,
    ChangePasswordRequest,
    LoginResponse,
    TokenResponse,
    UserResponse,
    MessageResponse,
)
from src.application.services.auth_service import AuthService
from src.configurations.settings import settings
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


def create_auth_router() -> APIRouter:
    """Create and configure the authentication router."""
    
    router = APIRouter(prefix="/auth", tags=["Authentication"])
    
    @router.post(
        "/register",
        response_model=UserResponse,
        status_code=status.HTTP_201_CREATED,
        summary="Register a new user",
        description="Create a new user account with email verification",
    )
    async def register(
        request: Request,
        data: RegisterRequest,
        auth_service: Annotated[AuthService, Depends(get_auth_service)],
    ) -> UserResponse:
        """
        Register a new user account.
        
        - **email**: User's email address (must be unique)
        - **username**: Username (must be unique, 3-50 characters)
        - **password**: Password (minimum 8 characters)
        - **full_name**: Optional full name
        
        Returns the created user information.
        An email verification link will be sent to the provided email address.
        """
        try:
            user = await auth_service.register(
                email=data.email,
                username=data.username,
                password=data.password,
                full_name=data.full_name,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )
            
            return UserResponse.model_validate(user)
        
        except EmailAlreadyExistsError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )
        except UsernameAlreadyExistsError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )
        except WeakPasswordError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
    
    @router.post(
        "/login",
        response_model=LoginResponse,
        summary="Login user",
        description="Authenticate user and receive access and refresh tokens",
    )
    async def login(
        request: Request,
        data: LoginRequest,
        auth_service: Annotated[AuthService, Depends(get_auth_service)],
        role_repo: Annotated["IRoleRepository", Depends(get_role_repository)],
    ) -> LoginResponse:
        """
        Authenticate user and receive tokens.
        
        - **email**: User's email address
        - **password**: User's password
        - **device_info**: Optional device information for session tracking
        
        Returns access token, refresh token, and user information.
        """
        try:
            access_token, refresh_token, user = await auth_service.login(
                email=data.email,
                password=data.password,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
                device_info=data.device_info,
            )
            
            # Fetch user roles for response
            user_roles = await role_repo.get_user_roles(user.id)
            role_names = [role.name for role in user_roles]
            
            return LoginResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="bearer",
                expires_in=settings.jwt.access_token_expire_minutes * 60,
                user=UserResponse(
                    id=user.id,
                    email=user.email,
                    username=user.username,
                    full_name=user.full_name,
                    email_verified=user.email_verified,
                    created_at=user.created_at,
                    last_login=user.last_login,
                    roles=role_names
                ),
            )
        
        except InvalidCredentialsError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e),
                headers={"WWW-Authenticate": "Bearer"},
            )
        except AccountLockedError as e:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=str(e),
            )
        except EmailNotVerifiedError as e:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(e),
            )
    
    @router.post(
        "/logout",
        response_model=MessageResponse,
        summary="Logout user",
        description="Revoke the refresh token",
    )
    async def logout(
        request: Request,
        data: RefreshTokenRequest,
        auth_service: Annotated[AuthService, Depends(get_auth_service)],
    ) -> MessageResponse:
        """
        Logout user by revoking the refresh token.
        
        - **refresh_token**: The refresh token to revoke
        
        Returns a success message.
        """
        try:
            await auth_service.logout(
                refresh_token=data.refresh_token,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )
            
            return MessageResponse(message="Logout successful")
        
        except TokenInvalidError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
    
    @router.post(
        "/refresh",
        response_model=TokenResponse,
        summary="Refresh access token",
        description="Get a new access token using a valid refresh token",
    )
    async def refresh_token(
        request: Request,
        data: RefreshTokenRequest,
        auth_service: Annotated[AuthService, Depends(get_auth_service)],
    ) -> TokenResponse:
        """
        Refresh the access token.
        
        - **refresh_token**: Valid refresh token
        
        Returns new access and refresh tokens.
        The old refresh token will be revoked.
        """
        try:
            access_token, new_refresh_token = await auth_service.refresh_access_token(
                refresh_token=data.refresh_token,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )
            
            return TokenResponse(
                access_token=access_token,
                refresh_token=new_refresh_token,
                token_type="bearer",
                expires_in=settings.jwt.access_token_expire_minutes * 60,
            )
        
        except TokenExpiredError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e),
                headers={"WWW-Authenticate": "Bearer"},
            )
        except TokenInvalidError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
        except TokenRevokedError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e),
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @router.post(
        "/verify-email",
        response_model=UserResponse,
        summary="Verify email address",
        description="Verify user's email address using the verification token",
    )
    async def verify_email(
        data: EmailVerificationRequest,
        auth_service: Annotated[AuthService, Depends(get_auth_service)],
    ) -> UserResponse:
        """
        Verify email address.
        
        - **token**: Email verification token sent to user's email
        
        Returns the updated user information.
        """
        try:
            user = await auth_service.verify_email(token=data.token)
            
            return UserResponse.model_validate(user)
        
        except InvalidResetTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
    
    @router.post(
        "/password-reset/request",
        response_model=MessageResponse,
        summary="Request password reset",
        description="Request a password reset link to be sent to email",
    )
    async def request_password_reset(
        request: Request,
        data: PasswordResetRequest,
        auth_service: Annotated[AuthService, Depends(get_auth_service)],
    ) -> MessageResponse:
        """
        Request password reset.
        
        - **email**: User's email address
        
        Returns a success message (always, even if email doesn't exist for security).
        An email with a reset link will be sent if the email exists.
        """
        await auth_service.request_password_reset(
            email=data.email,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        
        return MessageResponse(
            message="If the email exists, a password reset link has been sent"
        )
    
    @router.post(
        "/password-reset/confirm",
        response_model=UserResponse,
        summary="Confirm password reset",
        description="Reset password using the reset token",
    )
    async def confirm_password_reset(
        data: PasswordResetConfirm,
        auth_service: Annotated[AuthService, Depends(get_auth_service)],
    ) -> UserResponse:
        """
        Confirm password reset.
        
        - **token**: Password reset token from email
        - **new_password**: New password (minimum 8 characters)
        
        Returns the updated user information.
        All existing sessions will be invalidated.
        """
        try:
            user = await auth_service.reset_password(
                token=data.token,
                new_password=data.new_password,
            )
            
            return UserResponse.model_validate(user)
        
        except InvalidResetTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
        except WeakPasswordError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
    
    @router.post(
        "/change-password",
        response_model=MessageResponse,
        summary="Change password",
        description="Change password for authenticated user",
    )
    async def change_password(
        request: Request,
        data: ChangePasswordRequest,
        current_user: Annotated[User, Depends(get_current_user)],
        auth_service: Annotated[AuthService, Depends(get_auth_service)],
    ) -> MessageResponse:
        """
        Change password for authenticated user.
        
        Requires valid JWT token in Authorization header.
        
        - **current_password**: Current password for verification
        - **new_password**: New password (minimum 8 characters)
        
        Returns success message.
        All existing sessions will be invalidated (user must re-login).
        
        Raises:
            401 Unauthorized: If current password is incorrect
            400 Bad Request: If new password is weak
        """
        try:
            await auth_service.change_password(
                user_id=current_user.id,
                current_password=data.current_password,
                new_password=data.new_password,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )
            
            return MessageResponse(
                message="Password changed successfully. Please log in again with your new password."
            )
        
        except InvalidCredentialsError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(e),
            )
        except WeakPasswordError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
    
    return router
