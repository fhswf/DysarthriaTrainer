"""
Exercise category endpoints for managing categories.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.dependencies import get_exercise_service, require_role
from src.api.schemas.common import PaginatedResponse, MessageResponse
from src.api.schemas.exercise import (
    ExerciseCategoryCreate,
    ExerciseCategoryUpdate,
    ExerciseCategoryResponse,
    ExerciseCategoryReorder,
)
from src.application.services.exercise_service import ExerciseService
from src.core.exceptions.exercise_exceptions import (
    ExerciseCategoryNotFoundError,
)


def create_categories_router() -> APIRouter:
    """Create and configure the exercise categories router."""
    
    router = APIRouter(prefix="/categories", tags=["Exercise Categories"])
    
    @router.post(
        "",
        response_model=ExerciseCategoryResponse,
        status_code=status.HTTP_201_CREATED,
        summary="Create exercise category",
        description="Create a new exercise category (Admin/Therapist only)",
        dependencies=[Depends(require_role("admin", "therapist"))],
    )
    async def create_category(
        data: ExerciseCategoryCreate,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseCategoryResponse:
        """Create a new exercise category."""
        try:
            category = await service.create_category(
                name=data.name,
                slug=data.slug,
                description=data.description,
                display_order=data.display_order,
            )
            
            return ExerciseCategoryResponse.model_validate(category)
        
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )
    
    @router.get(
        "",
        response_model=PaginatedResponse[ExerciseCategoryResponse],
        summary="List all categories",
        description="Get paginated list of exercise categories",
    )
    async def list_categories(
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
        offset: int = Query(0, ge=0, description="Number of items to skip"),
        limit: int = Query(50, ge=1, le=100, description="Maximum items to return"),
        include_deleted: bool = Query(False, description="Include soft-deleted categories"),
        search: str | None = Query(None, description="Search term for name, slug, or description"),
    ) -> PaginatedResponse[ExerciseCategoryResponse]:
        """Get paginated list of exercise categories."""
        categories, count = await service.get_all_categories(
            offset=offset,
            limit=limit,
            include_deleted=include_deleted,
            search=search,
        )
        return PaginatedResponse(
            count=count,
            results=[ExerciseCategoryResponse.model_validate(c) for c in categories],
        )
    
    @router.get(
        "/{category_id}",
        response_model=ExerciseCategoryResponse,
        summary="Get category by ID",
        description="Get a specific exercise category",
    )
    async def get_category(
        category_id: UUID,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseCategoryResponse:
        """Get an exercise category by ID."""
        try:
            category = await service.get_category_by_id(category_id)
            return ExerciseCategoryResponse.model_validate(category)
        
        except ExerciseCategoryNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
    
    @router.get(
        "/slug/{slug}",
        response_model=ExerciseCategoryResponse,
        summary="Get category by slug",
        description="Get a specific exercise category by slug",
    )
    async def get_category_by_slug(
        slug: str,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseCategoryResponse:
        """Get an exercise category by slug."""
        try:
            category = await service.get_category_by_slug(slug)
            return ExerciseCategoryResponse.model_validate(category)
        
        except ExerciseCategoryNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
    
    @router.patch(
        "/{category_id}",
        response_model=ExerciseCategoryResponse,
        summary="Update category",
        description="Update an exercise category (Admin/Therapist only)",
        dependencies=[Depends(require_role("admin", "therapist"))],
    )
    async def update_category(
        category_id: UUID,
        data: ExerciseCategoryUpdate,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseCategoryResponse:
        """Update an exercise category."""
        try:
            # Build update dict with only provided fields
            update_data = data.model_dump(exclude_unset=True)
            
            category = await service.update_category(
                category_id=category_id,
                **update_data,
            )
            
            return ExerciseCategoryResponse.model_validate(category)
        
        except ExerciseCategoryNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )
    
    @router.post(
        "/reorder",
        response_model=MessageResponse,
        summary="Reorder categories",
        description="Reorder categories by providing ordered list of IDs (Admin/Therapist only)",
        dependencies=[Depends(require_role("admin", "therapist"))],
    )
    async def reorder_categories(
        data: ExerciseCategoryReorder,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> MessageResponse:
        """Reorder categories."""
        await service.reorder_categories(category_ids=[str(id) for id in data.category_ids])
        return MessageResponse(message=f"Reordered {len(data.category_ids)} categories")
    
    @router.delete(
        "/{category_id}",
        response_model=MessageResponse,
        summary="Delete category",
        description="Soft-delete an exercise category (Admin only)",
        dependencies=[Depends(require_role("admin"))],
    )
    async def delete_category(
        category_id: UUID,
        deleted_by: UUID,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> MessageResponse:
        """Soft-delete an exercise category."""
        try:
            await service.delete_category(
                category_id=category_id,
                deleted_by=str(deleted_by),
            )
            
            return MessageResponse(message="Category deleted successfully")
        
        except ExerciseCategoryNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
    
    return router
