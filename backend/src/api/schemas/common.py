"""
Common API schemas for pagination and generic responses.

These schemas are designed to work seamlessly with frontend components
like TableSetup that expect standardized pagination structures.
"""

from typing import Generic, TypeVar
from pydantic import BaseModel, Field

# Generic type variable for paginated responses
T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic paginated response schema.
    
    This schema matches the frontend TableSetup expectation:
    - count: Total number of items (for pagination UI)
    - results: Array of items for the current page
    
    Example:
        ```python
        from src.api.schemas.common import PaginatedResponse
        from src.api.schemas.exercise import ExerciseCategoryResponse
        
        @router.get("/categories", response_model=PaginatedResponse[ExerciseCategoryResponse])
        async def list_categories(
            offset: int = Query(0, ge=0),
            limit: int = Query(50, ge=1, le=100),
        ):
            categories, count = await service.get_all_categories(offset=offset, limit=limit)
            return PaginatedResponse(count=count, results=categories)
        ```
    
    Frontend usage (TableSetup):
        ```typescript
        const apiService = {
          list: async (params) => {
            const response = await api.get('/categories', { params });
            return response.data; // { count: number, results: T[] }
          }
        };
        ```
    """
    
    count: int = Field(
        ...,
        description="Total number of items across all pages",
        ge=0,
    )
    results: list[T] = Field(
        ...,
        description="Array of items for the current page",
    )
    
    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "examples": [
                {
                    "count": 42,
                    "results": [
                        {"id": "123", "name": "Item 1"},
                        {"id": "456", "name": "Item 2"},
                    ],
                }
            ]
        }


class MessageResponse(BaseModel):
    """Generic message response for operations without data payload."""
    
    message: str = Field(..., description="Success or informational message")
    
    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "examples": [
                {"message": "Operation completed successfully"}
            ]
        }


class ErrorResponse(BaseModel):
    """Generic error response."""
    
    detail: str = Field(..., description="Error message")
    
    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "examples": [
                {"detail": "Resource not found"}
            ]
        }
