from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from src.api.dependencies import get_user_service, get_current_user, get_role_repository
from src.api.schemas.user import UserIn, UserOut, UserUpdateRequest
from src.core.ports.services.user import IUserService
from src.core.ports.repositories.role_repository import IRoleRepository
from src.core.entities.user import User
from src.core.exceptions.user import UsernameAlreadyExistsError
from src.core.exceptions.entity_not_found import UserNotFoundError


def create_user_router() -> APIRouter:
    """Create and configure the user router."""
    router = APIRouter(prefix="/users", tags=["Users"])

    @router.post(
        "/",
        status_code=status.HTTP_201_CREATED,
        response_model=UserOut,
        summary="Create a new user",
        description="Create a new user account with username, email, and password"
    )
    async def create_user(
        user_data: UserIn,
        user_service: Annotated[IUserService, Depends(get_user_service)]
    ) -> UserOut:
        """Create a new user account.
        
        - **username**: Unique username (4-20 characters)
        - **password**: User password
        - **email**: Valid email address
        - **full_name**: User's full name (optional)
        
        Raises:
            409 Conflict: If username already exists
        """
        try:
            user = await user_service.create_user(
                username=user_data.username,
                password=user_data.password,
                email=user_data.email
            )
            return UserOut(
                username=user.username,
                email=user.email,
                full_name=user.full_name
            )
        except UsernameAlreadyExistsError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )

    @router.get(
        "/me",
        response_model=UserOut,
        summary="Get current user profile",
        description="Get the authenticated user's profile information"
    )
    async def get_current_user_profile(
        current_user: Annotated[User, Depends(get_current_user)],
        role_repo: Annotated[IRoleRepository, Depends(get_role_repository)]
    ) -> UserOut:
        """Get current authenticated user's profile.
        
        Requires valid JWT token in Authorization header.
        
        Returns:
            Current user's profile information with roles
        """
        # Fetch user roles from repository
        role_entities = await role_repo.get_user_roles(current_user.id)
        roles = [role.name for role in role_entities]
        
        return UserOut(
            username=current_user.username,
            email=current_user.email,
            full_name=current_user.full_name,
            roles=roles
        )
    
    @router.put(
        "/me",
        response_model=UserOut,
        summary="Update current user profile",
        description="Update the authenticated user's profile information"
    )
    async def update_current_user_profile(
        updates: UserUpdateRequest,
        current_user: Annotated[User, Depends(get_current_user)],
        user_service: Annotated[IUserService, Depends(get_user_service)]
    ) -> UserOut:
        """Update current authenticated user's profile.
        
        Requires valid JWT token in Authorization header.
        
        Args:
            updates: Profile fields to update (currently only full_name)
            
        Returns:
            Updated user profile information
        """
        # Update only the provided fields
        update_data = updates.model_dump(exclude_unset=True)
        
        if update_data:
            user = await user_service.update_user(current_user.id, **update_data)
        else:
            user = current_user
        
        return UserOut(
            username=user.username,
            email=user.email,
            full_name=user.full_name
        )

    @router.get(
        "/{user_id}",
        response_model=UserOut,
        summary="Get user by ID",
        description="Retrieve a user by their unique ID"
    )
    async def get_user(
        user_id: UUID,
        user_service: Annotated[IUserService, Depends(get_user_service)]
    ) -> UserOut:
        """Retrieve a user by their ID.
        
        Args:
            user_id: UUID of the user to retrieve
            
        Returns:
            User information
            
        Raises:
            404 Not Found: If user does not exist
        """
        user = await user_service.get_user_by_id(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id {user_id} not found"
            )
        
        return UserOut(
            username=user.username,
            email=user.email,
            full_name=user.full_name
        )

    @router.get(
        "/",
        response_model=list[UserOut],
        summary="Get all users",
        description="Retrieve a list of all users"
    )
    async def get_users(
        user_service: Annotated[IUserService, Depends(get_user_service)]
    ) -> list[UserOut]:
        """Retrieve all users.
        
        Returns:
            List of all users
        """
        users = await user_service.get_users()
        return [
            UserOut(
                username=user.username,
                email=user.email,
                full_name=user.full_name
            )
            for user in users
        ]

    @router.patch(
        "/{user_id}",
        response_model=UserOut,
        summary="Update user",
        description="Update user information (email, full_name, etc.)"
    )
    async def update_user(
        user_id: UUID,
        updates: dict,
        user_service: Annotated[IUserService, Depends(get_user_service)]
    ) -> UserOut:
        """Update a user's information.
        
        Args:
            user_id: UUID of the user to update
            updates: Dictionary of fields to update
            
        Returns:
            Updated user information
            
        Raises:
            404 Not Found: If user does not exist
        """
        try:
            user = await user_service.update_user(user_id, **updates)
            return UserOut(
                username=user.username,
                email=user.email,
                full_name=user.full_name
            )
        except UserNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )

    @router.delete(
        "/{user_id}",
        status_code=status.HTTP_204_NO_CONTENT,
        summary="Delete user",
        description="Delete a user by their ID"
    )
    async def delete_user(
        user_id: UUID,
        user_service: Annotated[IUserService, Depends(get_user_service)]
    ):
        """Delete a user.
        
        Args:
            user_id: UUID of the user to delete
            
        Returns:
            No content on success
            
        Raises:
            404 Not Found: If user does not exist
        """
        result = await user_service.delete_user(user_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id {user_id} not found"
            )
        # No return needed for 204 No Content

    return router
