from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, StringConstraints

ConstrainedStr = Annotated[str, StringConstraints(min_length=4, max_length=20)]


class UserIn(BaseModel):
    username: Annotated[str, ConstrainedStr]
    password: str
    email: EmailStr
    full_name: str | None = None


class UserOut(BaseModel):
    username: str
    email: EmailStr
    full_name: str | None = None
    roles: list[str] = []  # List of role names


class UserUpdateRequest(BaseModel):
    """Request schema for updating user profile."""
    
    full_name: str | None = None
    
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "full_name": "John Doe Updated"
                }
            ]
        }
    )
