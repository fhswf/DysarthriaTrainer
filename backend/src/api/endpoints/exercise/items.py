"""
Exercise item endpoints for managing exercise items.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.dependencies import get_exercise_service, require_role
from src.api.schemas.exercise import (
    ExerciseItemCreate,
    ExerciseItemUpdate,
    ExerciseItemResponse,
    ExerciseItemReorder,
    ExerciseItemLibraryCreate,
    ExerciseItemLibraryUpdate,
    LibraryItemsListResponse,
    AttachLibraryItemRequest,
    DuplicateItemRequest,
    ExerciseFromItemsCreate,
    ExerciseResponse,
    MessageResponse,
)
from src.application.services.exercise_service import ExerciseService
from src.core.exceptions.exercise_exceptions import (
    ExerciseNotFoundError,
    ExerciseItemNotFoundError,
)


def create_items_router() -> APIRouter:
    """Create and configure the exercise items router."""
    
    router = APIRouter(prefix="/items", tags=["Exercise Items"])
    
    @router.post(
        "",
        response_model=ExerciseItemResponse,
        status_code=status.HTTP_201_CREATED,
        summary="Add item to exercise",
        description="Add a new item to an exercise (Admin/Therapist only)",
        dependencies=[Depends(require_role("admin", "therapist"))],
    )
    async def create_item(
        data: ExerciseItemCreate,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseItemResponse:
        """Add an item to an exercise."""
        try:
            item = await service.add_item_to_exercise(
                exercise_id=data.exercise_id,
                item_type=data.item_type,
                display_order=data.display_order,
                instruction_id=data.instruction_id,
                metadata=data.content,
            )
            
            return ExerciseItemResponse.model_validate(item)
        
        except ExerciseNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
    
    # ==================== Library Item Endpoints (must come before /{item_id}) ====================
    
    @router.post(
        "/library",
        response_model=ExerciseItemResponse,
        status_code=status.HTTP_201_CREATED,
        summary="Create library item",
        description="Create a standalone library item (Admin/Therapist only)",
        dependencies=[Depends(require_role("admin", "therapist"))],
    )
    async def create_library_item(
        data: ExerciseItemLibraryCreate,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseItemResponse:
        """Create a standalone library item."""
        try:
            item = await service.create_library_item(
                item_type=data.item_type,
                contents=[content.model_dump() for content in data.contents],
                instruction_id=data.instruction_id,
                repetitions=data.repetitions,
                duration_seconds=data.duration_seconds,
                metadata=data.metadata,
            )
            
            return ExerciseItemResponse.model_validate(item)
        
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
    
    @router.get(
        "/library",
        response_model=LibraryItemsListResponse,
        summary="List library items",
        description="Get paginated list of library items with optional filters",
    )
    async def list_library_items(
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
        item_type: str | None = Query(None, description="Filter by item type"),
        language: str | None = Query(None, description="Filter by language"),
        limit: int = Query(50, ge=1, le=100, description="Items per page"),
        offset: int = Query(0, ge=0, description="Number of items to skip"),
    ) -> LibraryItemsListResponse:
        """Get paginated library items."""
        items, total = await service.get_library_items(
            item_type=item_type,
            language=language,
            limit=limit,
            offset=offset,
        )
        
        return LibraryItemsListResponse(
            items=[ExerciseItemResponse.model_validate(item) for item in items],
            total=total,
            limit=limit,
            offset=offset,
        )
    
    @router.get(
        "/library/{item_id}",
        response_model=ExerciseItemResponse,
        summary="Get library item",
        description="Get a specific library item by ID",
    )
    async def get_library_item(
        item_id: UUID,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
        language: str | None = Query(None, description="Filter content by language"),
    ) -> ExerciseItemResponse:
        """Get a library item by ID."""
        try:
            item = await service.get_library_item_by_id(item_id, language)
            return ExerciseItemResponse.model_validate(item)
        
        except ExerciseItemNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
    
    @router.patch(
        "/library/{item_id}",
        response_model=ExerciseItemResponse,
        summary="Update library item",
        description="Update library item properties (Admin/Therapist only)",
        dependencies=[Depends(require_role("admin", "therapist"))],
    )
    async def update_library_item(
        item_id: UUID,
        data: ExerciseItemLibraryUpdate,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseItemResponse:
        """Update a library item."""
        try:
            item = await service.update_library_item(
                item_id=item_id,
                item_type=data.item_type,
                instruction_id=data.instruction_id,
                repetitions=data.repetitions,
                duration_seconds=data.duration_seconds,
                metadata=data.metadata,
            )
            
            return ExerciseItemResponse.model_validate(item)
        
        except ExerciseItemNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
    
    @router.delete(
        "/library/{item_id}",
        response_model=MessageResponse,
        summary="Delete library item",
        description="Delete a library item (Admin only)",
        dependencies=[Depends(require_role("admin"))],
    )
    async def delete_library_item(
        item_id: UUID,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> MessageResponse:
        """Delete a library item."""
        try:
            await service.delete_library_item(item_id)
            return MessageResponse(message="Library item deleted successfully")
        
        except ExerciseItemNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
    
    @router.post(
        "/library/{library_item_id}/attach",
        response_model=ExerciseItemResponse,
        status_code=status.HTTP_201_CREATED,
        summary="Attach library item to exercise",
        description="Create a linked copy of a library item in an exercise (Admin/Therapist only)",
        dependencies=[Depends(require_role("admin", "therapist"))],
    )
    async def attach_library_item(
        library_item_id: UUID,
        data: AttachLibraryItemRequest,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseItemResponse:
        """Attach a library item to an exercise."""
        try:
            item = await service.attach_library_item_to_exercise(
                library_item_id=library_item_id,
                exercise_id=data.exercise_id,
                display_order=data.display_order,
            )
            
            return ExerciseItemResponse.model_validate(item)
        
        except (ExerciseNotFoundError, ExerciseItemNotFoundError) as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
    
    # ==================== Generic Item Endpoints (/{item_id} must come after /library) ====================
    
    @router.get(
        "/{item_id}",
        response_model=ExerciseItemResponse,
        summary="Get exercise item by ID",
        description="Get a specific exercise item by its ID",
    )
    async def get_item(
        item_id: UUID,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseItemResponse:
        """Get a specific exercise item."""
        try:
            item = await service.get_exercise_item_by_id(item_id)
            return ExerciseItemResponse.model_validate(item)
        
        except ExerciseItemNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
    
    @router.get(
        "",
        response_model=list[ExerciseItemResponse],
        summary="Get exercise items",
        description="Get all items for a specific exercise, or all items if exercise_id is not provided",
    )
    async def list_items(
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
        exercise_id: UUID | None = Query(None, description="Exercise ID (optional - returns all items if not provided)"),
        item_type: str | None = Query(None, description="Filter by item type"),
        language: str | None = Query(None, description="Filter by language"),
    ) -> list[ExerciseItemResponse]:
        """Get items for an exercise, or all items if exercise_id is not provided."""
        try:
            # If exercise_id is not provided, get all items
            if exercise_id is None:
                items = await service.get_all_exercise_items()
            else:
                items = await service.get_exercise_items(
                    exercise_id=exercise_id,
                    item_type=item_type,
                    language=language,
                )
            return [ExerciseItemResponse.model_validate(item) for item in items]
        
        except ExerciseNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
    
    @router.put(
        "/{item_id}",
        response_model=ExerciseItemResponse,
        summary="Update exercise item",
        description="Update an exercise item (Admin/Therapist only)",
        dependencies=[Depends(require_role("admin", "therapist"))],
    )
    async def update_item(
        item_id: UUID,
        data: ExerciseItemUpdate,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseItemResponse:
        """Update an exercise item."""
        try:
            # Build update kwargs - use model_dump to distinguish between None and unset
            update_kwargs = {}
            data_dict = data.model_dump(exclude_unset=True)
            
            if "item_type" in data_dict:
                update_kwargs["item_type"] = data_dict["item_type"]
            if "display_order" in data_dict:
                update_kwargs["display_order"] = data_dict["display_order"]
            if "instruction_id" in data_dict:
                update_kwargs["instruction_id"] = data_dict["instruction_id"]
                update_kwargs["_update_instruction_id"] = True  # Signal to update even if None
            if "content" in data_dict:
                update_kwargs["metadata"] = data_dict["content"]
            
            item = await service.update_exercise_item(
                item_id=item_id,
                **update_kwargs,
            )
            
            return ExerciseItemResponse.model_validate(item)
        
        except ExerciseItemNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
    
    @router.post(
        "/reorder",
        response_model=MessageResponse,
        summary="Reorder items",
        description="Reorder items within an exercise (Admin/Therapist only)",
        dependencies=[Depends(require_role("admin", "therapist"))],
    )
    async def reorder_items(
        data: ExerciseItemReorder,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
        exercise_id: UUID = Query(..., description="Exercise ID"),
    ) -> MessageResponse:
        """Reorder exercise items."""
        await service.reorder_exercise_items(
            exercise_id=exercise_id,
            item_ids=data.item_ids,
        )
        return MessageResponse(message=f"Reordered {len(data.item_ids)} items")
    
    @router.post(
        "/{item_id}/instruction/{instruction_id}",
        response_model=ExerciseItemResponse,
        status_code=status.HTTP_200_OK,
        summary="Attach instruction to item",
        description="Attach an instruction to an exercise item (Admin/Therapist only)",
        dependencies=[Depends(require_role("admin", "therapist"))],
    )
    async def attach_instruction(
        item_id: UUID,
        instruction_id: UUID,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseItemResponse:
        """Attach an instruction to an exercise item."""
        try:
            item = await service.attach_instruction_to_item(
                item_id=item_id,
                instruction_id=instruction_id,
            )
            return ExerciseItemResponse.model_validate(item)
        
        except ExerciseItemNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
    
    @router.delete(
        "/{item_id}/instruction",
        response_model=ExerciseItemResponse,
        summary="Detach instruction from item",
        description="Remove the instruction from an exercise item (Admin/Therapist only)",
        dependencies=[Depends(require_role("admin", "therapist"))],
    )
    async def detach_instruction(
        item_id: UUID,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseItemResponse:
        """Detach instruction from an exercise item."""
        try:
            item = await service.detach_instruction_from_item(item_id=item_id)
            return ExerciseItemResponse.model_validate(item)
        
        except ExerciseItemNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
    
    @router.delete(
        "/{item_id}",
        response_model=MessageResponse,
        summary="Delete item",
        description="Delete an exercise item (Admin only)",
        dependencies=[Depends(require_role("admin"))],
    )
    async def delete_item(
        item_id: UUID,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> MessageResponse:
        """Delete an exercise item."""
        try:
            await service.delete_exercise_item(item_id=item_id)
            return MessageResponse(message="Item deleted successfully")
        
        except ExerciseItemNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
    
    @router.post(
        "/{item_id}/duplicate",
        response_model=ExerciseItemResponse,
        status_code=status.HTTP_201_CREATED,
        summary="Duplicate item",
        description="Create a copy of an item (Admin/Therapist only)",
        dependencies=[Depends(require_role("admin", "therapist"))],
    )
    async def duplicate_item(
        item_id: UUID,
        data: DuplicateItemRequest,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseItemResponse:
        """Duplicate an item as library item or exercise item."""
        try:
            item = await service.duplicate_item(
                item_id=item_id,
                as_library_item=data.as_library_item,
                target_exercise_id=data.exercise_id,
            )
            
            return ExerciseItemResponse.model_validate(item)
        
        except (ExerciseItemNotFoundError, ExerciseNotFoundError) as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
    
    return router
