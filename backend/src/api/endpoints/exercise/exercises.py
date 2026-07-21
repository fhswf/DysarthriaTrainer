"""
Exercise endpoints for managing exercises.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.api.dependencies import get_current_user, get_exercise_service, require_role
from src.api.schemas.common import PaginatedResponse
from src.api.schemas.exercise import (
    ExerciseCreate,
    ExerciseUpdate,
    ExerciseVersionCreate,
    ExerciseResponse,
    ExerciseDetailResponse,
    ExerciseFromItemsCreate,
    MessageResponse,
)
from src.application.services.exercise_service import ExerciseService
from src.core.entities.user import User
from src.core.exceptions.exercise_exceptions import (
    ExerciseNotFoundError,
    ExerciseCategoryNotFoundError,
    ExerciseVersionConflictError,
    ExerciseItemNotFoundError,
)


def create_exercises_router() -> APIRouter:
    """Create and configure the exercises router."""
    
    router = APIRouter(prefix="/exercises", tags=["Exercises"])
    
    @router.post(
        "",
        response_model=ExerciseResponse,
        status_code=status.HTTP_201_CREATED,
        summary="Create exercise",
        description="Create a new exercise (Admin/Therapist only)",
        dependencies=[Depends(require_role("admin", "therapist"))],
    )
    async def create_exercise(
        data: ExerciseCreate,
        current_user: Annotated[User, Depends(get_current_user)],
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseResponse:
        """Create a new exercise."""
        try:
            # Convert ExerciseItemCreateRequest to a format the service expects
            items_data = None
            if data.items:
                items_data = [
                    {
                        "item_type": item.item_type,
                        "display_order": item.display_order,
                        "repetitions": item.repetitions,
                        "duration_seconds": item.duration_seconds,
                        "metadata": item.metadata,
                        "contents": [
                            {
                                "language": content.language,
                                "text_content": content.text_content,
                                "demonstration_video_url": content.demonstration_video_url,
                                "image_url": content.image_url,
                                "phonetic_transcription": content.phonetic_transcription,
                                "audio_example_url": content.audio_example_url,
                                "difficulty": content.difficulty,
                                "info_type": content.info_type,
                            }
                            for content in (item.contents or [])
                        ] if hasattr(item, 'contents') and item.contents else [],
                    }
                    for item in data.items
                ]
            
            # Convert instructions to expected format
            instructions_data = None
            if data.instructions:
                instructions_data = [
                    {
                        "language": instr.language,
                        "hint_text": instr.hint_text,
                        "explanation_text": instr.explanation_text,
                        "safety_notes": instr.safety_notes,
                        "audio_instruction_url": instr.audio_instruction_url,
                        "image_url": instr.image_url,
                    }
                    for instr in data.instructions
                ]
            
            exercise = await service.create_exercise(
                category_id=data.category_id,
                code=data.code,
                title=data.title,
                subtitle=data.subtitle,
                scope=data.scope,
                difficulty_level=data.difficulty_level,
                estimated_duration_minutes=data.estimated_duration_minutes,
                display_order=data.display_order,
                instructions=instructions_data,
                items=items_data,
                created_by=str(current_user.id),
            )
            
            return ExerciseResponse.model_validate(exercise)
        
        except ExerciseCategoryNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
    
    @router.get(
        "",
        response_model=PaginatedResponse[ExerciseResponse],
        summary="List exercises",
        description="Get paginated list of exercises with optional filtering",
    )
    async def list_exercises(
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
        offset: int = Query(0, ge=0, description="Number of items to skip"),
        limit: int = Query(50, ge=1, le=100, description="Maximum items to return"),
        category_id: UUID | None = Query(None, description="Filter by single category ID (deprecated, use category_ids)"),
        category_ids: str | None = Query(None, description="Filter by multiple category IDs (comma-separated UUIDs)"),
        active_only: bool = Query(True, description="Only show active exercises"),
        search: str | None = Query(None, description="Search term for title or code"),
    ) -> PaginatedResponse[ExerciseResponse]:
        """Get paginated list of exercises."""
        # Parse category_ids if provided, otherwise fall back to single category_id
        category_id_list: list[UUID] | None = None
        if category_ids:
            try:
                category_id_list = [UUID(cid.strip()) for cid in category_ids.split(',') if cid.strip()]
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid category_ids format: {e}",
                )
        elif category_id:
            category_id_list = [category_id]
        
        exercises, count = await service.get_all_exercises(
            offset=offset,
            limit=limit,
            category_ids=category_id_list,
            active_only=active_only,
            search=search,
        )
        
        return PaginatedResponse(
            count=count,
            results=[ExerciseResponse.model_validate(e) for e in exercises],
        )
    
    @router.get(
        "/{exercise_id}",
        response_model=ExerciseDetailResponse,
        summary="Get exercise by ID",
        description="Get a specific exercise with full details including instructions and items",
    )
    async def get_exercise(
        exercise_id: UUID,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
        load_instructions: bool = Query(True, description="Load instructions"),
        load_items: bool = Query(True, description="Load exercise items"),
        language: str | None = Query(None, description="Filter items by language"),
    ) -> ExerciseDetailResponse:
        """Get an exercise by ID with full details."""
        try:
            exercise = await service.get_exercise_by_id(
                exercise_id=exercise_id,
                load_instructions=load_instructions,
                load_items=load_items,
                language=language,
            )
            return ExerciseDetailResponse.model_validate(exercise)
        
        except ExerciseNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
    
    @router.get(
        "/code/{exercise_code}",
        response_model=ExerciseDetailResponse,
        summary="Get exercise by code",
        description="Get a specific exercise by its unique code",
    )
    async def get_exercise_by_code(
        exercise_code: str,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseDetailResponse:
        """Get an exercise by code."""
        try:
            exercise = await service.get_exercise_by_code(code=exercise_code)
            return ExerciseDetailResponse.model_validate(exercise)
        
        except ExerciseNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
    
    @router.get(
        "/code/{exercise_code}/versions",
        response_model=list[ExerciseResponse],
        summary="Get exercise versions",
        description="Get version history for an exercise by code",
    )
    async def get_exercise_versions(
        exercise_code: str,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> list[ExerciseResponse]:
        """Get all versions of an exercise."""
        try:
            versions = await service.get_exercise_versions(code=exercise_code)
            return [ExerciseResponse.model_validate(v) for v in versions]
        
        except ExerciseNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
    
    @router.put(
        "/{exercise_id}",
        response_model=ExerciseResponse,
        summary="Update exercise (full)",
        description="Fully update an exercise with all fields (Admin/Therapist only)",
        dependencies=[Depends(require_role("admin", "therapist"))],
    )
    async def update_exercise_put(
        exercise_id: UUID,
        data: ExerciseUpdate,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseResponse:
        """Update an exercise (full update via PUT)."""
        try:
            # Build update kwargs with all provided fields
            update_kwargs = {}
            if data.title is not None:
                update_kwargs["title"] = data.title
            if data.subtitle is not None:
                update_kwargs["subtitle"] = data.subtitle
            if data.scope is not None:
                update_kwargs["scope"] = data.scope
            if data.difficulty_level is not None:
                update_kwargs["difficulty_level"] = data.difficulty_level
            if data.estimated_duration_minutes is not None:
                update_kwargs["estimated_duration_minutes"] = data.estimated_duration_minutes
            if data.display_order is not None:
                update_kwargs["display_order"] = data.display_order
            
            # Handle instructions if provided
            if data.instructions is not None:
                instructions_data = [
                    {
                        "language": instr.language,
                        "hint_text": instr.hint_text,
                        "explanation_text": instr.explanation_text,
                        "safety_notes": instr.safety_notes,
                        "audio_instruction_url": instr.audio_instruction_url,
                        "image_url": instr.image_url,
                    }
                    for instr in data.instructions
                ]
                update_kwargs["instructions"] = instructions_data
            
            # Handle items if provided
            if data.items is not None:
                items_data = [
                    {
                        "item_type": item.item_type,
                        "display_order": item.display_order,
                        "repetitions": item.repetitions,
                        "duration_seconds": item.duration_seconds,
                        "metadata": item.metadata,
                        "contents": [
                            {
                                "language": content.language,
                                "text_content": content.text_content,
                                "demonstration_video_url": content.demonstration_video_url,
                                "image_url": content.image_url,
                                "phonetic_transcription": content.phonetic_transcription,
                                "audio_example_url": content.audio_example_url,
                                "difficulty": content.difficulty,
                                "info_type": content.info_type,
                            }
                            for content in (item.contents or [])
                        ] if hasattr(item, 'contents') and item.contents else [],
                    }
                    for item in data.items
                ]
                update_kwargs["items"] = items_data
            
            exercise = await service.update_exercise(
                exercise_id=exercise_id,
                **update_kwargs,
            )
            
            return ExerciseResponse.model_validate(exercise)
        
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
    
    @router.patch(
        "/{exercise_id}",
        response_model=ExerciseResponse,
        summary="Update exercise",
        description="Update an exercise (Admin/Therapist only)",
        dependencies=[Depends(require_role("admin", "therapist"))],
    )
    async def update_exercise(
        exercise_id: UUID,
        data: ExerciseUpdate,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseResponse:
        """Update an exercise."""
        try:
            # Build update dict with only provided fields, map schema fields to service params
            update_kwargs = {}
            if data.title is not None:
                update_kwargs["title"] = data.title
            if data.subtitle is not None:
                update_kwargs["subtitle"] = data.subtitle
            if data.scope is not None:
                update_kwargs["scope"] = data.scope
            if data.difficulty_level is not None:
                update_kwargs["difficulty_level"] = data.difficulty_level
            if data.estimated_duration_minutes is not None:
                update_kwargs["estimated_duration_minutes"] = data.estimated_duration_minutes
            if data.display_order is not None:
                update_kwargs["display_order"] = data.display_order
            
            # Handle instructions if provided
            if data.instructions is not None:
                instructions_data = [
                    {
                        "language": instr.language,
                        "hint_text": instr.hint_text,
                        "explanation_text": instr.explanation_text,
                        "safety_notes": instr.safety_notes,
                        "audio_instruction_url": instr.audio_instruction_url,
                        "image_url": instr.image_url,
                    }
                    for instr in data.instructions
                ]
                update_kwargs["instructions"] = instructions_data
            
            # Handle items if provided
            if data.items is not None:
                items_data = [
                    {
                        "item_type": item.item_type,
                        "display_order": item.display_order,
                        "repetitions": item.repetitions,
                        "duration_seconds": item.duration_seconds,
                        "metadata": item.metadata,
                        "contents": [
                            {
                                "language": content.language,
                                "text_content": content.text_content,
                                "demonstration_video_url": content.demonstration_video_url,
                                "image_url": content.image_url,
                                "phonetic_transcription": content.phonetic_transcription,
                                "audio_example_url": content.audio_example_url,
                                "difficulty": content.difficulty,
                                "info_type": content.info_type,
                            }
                            for content in (item.contents or [])
                        ] if hasattr(item, 'contents') and item.contents else [],
                    }
                    for item in data.items
                ]
                update_kwargs["items"] = items_data
            
            exercise = await service.update_exercise(
                exercise_id=exercise_id,
                **update_kwargs,
            )
            
            return ExerciseResponse.model_validate(exercise)
        
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
    
    @router.post(
        "/{exercise_id}/versions",
        response_model=ExerciseResponse,
        status_code=status.HTTP_201_CREATED,
        summary="Create new version",
        description="Create a new version of an exercise (Admin/Therapist only)",
        dependencies=[Depends(require_role("admin", "therapist"))],
    )
    async def create_new_version(
        exercise_id: UUID,
        data: ExerciseVersionCreate,
        current_user: Annotated[User, Depends(get_current_user)],
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseResponse:
        """Create a new version of an exercise."""
        try:
            # Build changes dict with only provided fields
            changes = {}
            if data.title is not None:
                changes["title"] = data.title
            if data.subtitle is not None:
                changes["subtitle"] = data.subtitle
            if data.scope is not None:
                changes["scope"] = data.scope
            if data.difficulty_level is not None:
                changes["difficulty_level"] = data.difficulty_level
            if data.estimated_duration_minutes is not None:
                changes["estimated_duration_minutes"] = data.estimated_duration_minutes
            
            new_exercise = await service.create_new_version(
                old_exercise_id=exercise_id,
                changes=changes,
                created_by=str(current_user.id),
            )
            
            return ExerciseResponse.model_validate(new_exercise)
        
        except ExerciseNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
        except ExerciseVersionConflictError as e:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )
    
    @router.delete(
        "/{exercise_id}",
        response_model=MessageResponse,
        summary="Delete exercise",
        description="Soft-delete an exercise (Admin only)",
        dependencies=[Depends(require_role("admin"))],
    )
    async def delete_exercise(
        exercise_id: UUID,
        current_user: Annotated[User, Depends(get_current_user)],
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> MessageResponse:
        """Soft-delete an exercise."""
        try:
            await service.delete_exercise(
                exercise_id=exercise_id,
                deleted_by=str(current_user.id),
            )
            
            return MessageResponse(message="Exercise deleted successfully")
        
        except ExerciseNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
    
    @router.post(
        "/from-items",
        response_model=ExerciseDetailResponse,
        status_code=status.HTTP_201_CREATED,
        summary="Create exercise from library items",
        description="Create a new exercise by composing library items (Admin/Therapist only)",
        dependencies=[Depends(require_role("admin", "therapist"))],
    )
    async def create_exercise_from_items(
        data: ExerciseFromItemsCreate,
        service: Annotated[ExerciseService, Depends(get_exercise_service)],
    ) -> ExerciseDetailResponse:
        """Create an exercise by composing library items."""
        try:
            exercise = await service.create_exercise_from_library_items(
                code=data.code,
                name=data.name,
                category_id=data.category_id,
                library_item_ids=data.library_item_ids,
                description=data.description,
                difficulty=data.difficulty,
            )
            
            return ExerciseDetailResponse.model_validate(exercise)
        
        except (ExerciseCategoryNotFoundError, ExerciseNotFoundError, ExerciseItemNotFoundError) as e:
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
