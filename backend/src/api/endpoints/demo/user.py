from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, status, HTTPException, Form

from src.api.dependencies import get_logger, get_user_service
from src.api.schemas.user import UserIn, UserOut
from src.core.entities.user import User
from src.core.ports import ILogger
from src.core.ports.services import IUserService
from src.core.exceptions.user import UsernameAlreadyExistsError

router = APIRouter(prefix="/user_service")

# https://fastapi.tiangolo.com/tutorial/extra-models/
# https://fastapi.tiangolo.com/tutorial/request-form-models/
# https://fastapi.tiangolo.com/tutorial/dependencies/


@router.post("/create_user", status_code=status.HTTP_201_CREATED, response_model=UserOut)
async def create_test_entity(
        user_data: Annotated[UserIn, Form()],
        logger: Annotated[ILogger, Depends(get_logger)],
        user_service: Annotated[IUserService, Depends(get_user_service)],
) -> UserOut:
    try:
        user_created: User = await user_service.create_user(
            user_data.username,
            user_data.password,
            user_data.email
        )
        logger.debug(f"Test user created: {user_created}")
        return UserOut(**user_created.model_dump(exclude={"hashed_password"}))
    except UsernameAlreadyExistsError as e:
        logger.error(f"User creation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error during user creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred. {e}"
        )


@router.get("/users/{user_id}", status_code=status.HTTP_200_OK)
async def get_user_by_id(
        user_id: UUID,
        user_service: Annotated[IUserService, Depends(get_user_service)],
) -> dict:
    user = await user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )
    return user.model_dump(exclude={"hashed_password"})


@router.get("/users/{user_email}", status_code=status.HTTP_200_OK)
async def get_user_by_email(
        user_email: UUID,
        user_service: Annotated[IUserService, Depends(get_user_service)],
) -> dict:
    user = await user_service.get_user_by_email(user_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email {user_email} not found."
        )
    return user.model_dump(exclude={"hashed_password"})


@router.get("/users", status_code=status.HTTP_200_OK)
async def get_users(
        user_service: Annotated[IUserService, Depends(get_user_service)],
) -> list[UserOut]:
    users = await user_service.get_users()
    return [UserOut(**user.model_dump(exclude={"hashed_password"})) for user in users]
