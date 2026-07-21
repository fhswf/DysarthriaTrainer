"""
Practice Sessions API Endpoints

REST endpoints for managing practice sessions.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_db_session, get_current_user, get_media_service, is_admin
from src.api.schemas.common import PaginatedResponse
from src.api.schemas.practice_session_schemas import (
    CreatePracticeSessionRequest,
    StartRecordingRequest,
    CompletePracticeSessionRequest,
    UpdateSessionMetricsRequest,
    AttachAudioFileRequest,
    PracticeSessionResponse,
    PracticeSessionListResponse,
    PracticeSessionWithResultsResponse,
    PracticeSessionWithResultsListResponse,
)
from src.api.schemas.exercise_result_schemas import ExerciseResultResponse
from src.application.services.practice_session_service import PracticeSessionService
from src.application.services.exercise_result_service import ExerciseResultService
from src.application.services.media_service import MediaService
from src.infrastructure.persistence.sqla.repositories.practice_session_repository import PracticeSessionRepository
from src.infrastructure.persistence.sqla.repositories.exercise_result_repository import ExerciseResultRepository
from src.application.exceptions.not_found import PracticeSessionNotFoundError
from src.application.exceptions.business_rules import BusinessRuleViolationError
from src.core.entities.practice_session import SessionStatus
from src.core.entities.user import User


router = APIRouter(prefix="/practice/sessions", tags=["Practice Sessions"])


def get_service(
    db: AsyncSession = Depends(get_db_session),
    media_service: MediaService = Depends(get_media_service),
) -> PracticeSessionService:
    """Dependency to get practice session service with all required dependencies."""
    session_repository = PracticeSessionRepository(db)
    result_repository = ExerciseResultRepository(db)
    return PracticeSessionService(
        repository=session_repository,
        result_repository=result_repository,
        media_service=media_service,
    )


def get_result_service(db: AsyncSession = Depends(get_db_session)) -> ExerciseResultService:
    """Dependency to get exercise result service."""
    repository = ExerciseResultRepository(db)
    return ExerciseResultService(repository)


@router.post(
    "",
    response_model=PracticeSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new practice session",
    description="Create a new practice session for the authenticated user to begin exercising."
)
async def create_session(
    request: CreatePracticeSessionRequest,
    current_user: User = Depends(get_current_user),
    service: PracticeSessionService = Depends(get_service),
):
    """
    Create a new practice session.

    - **exercise_id**: ID of the exercise to practice
    - **total_items**: Total number of items (including repeats)
    - **metadata**: Optional session metadata (device info, settings)
    """
    try:
        session = await service.create_session(
            user_id=current_user.id,
            exercise_id=request.exercise_id,
        )
        return PracticeSessionResponse.model_validate(session)
    except BusinessRuleViolationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get(
    "/with-results",
    response_model=PaginatedResponse[PracticeSessionWithResultsResponse],
    summary="List all practice sessions with results",
    description="Get a paginated list of all practice sessions with their exercise results included."
)
async def list_sessions_with_results(
    service: PracticeSessionService = Depends(get_service),
    result_service: ExerciseResultService = Depends(get_result_service),
    current_user: User = Depends(get_current_user),
    offset: int = Query(0, ge=0, description="Number of sessions to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum sessions to return"),
    status_filter: Optional[str] = Query(
        None,
        description="Filter by status: in_progress, completed, abandoned"
    ),
):
    """
    List all practice sessions with their results.
    
    This endpoint returns all sessions with their associated exercise results included,
    avoiding the need for separate API calls to fetch results for each session.
    """
    # Convert status string to enum if provided
    status_enum = None
    if status_filter:
        try:
            status_enum = SessionStatus(status_filter)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status_filter}. Must be one of: in_progress, completed, abandoned"
            )

    # Get all sessions
    sessions = await service.get_all_sessions(
        status=status_enum,
        limit=limit,
        offset=offset,
    )

    total = await service.count_all_sessions(
        status=status_enum,
    )

    # Build response with results included
    items_with_results = []
    for session in sessions:
        # Get all results for this session (no pagination on results)
        results = await result_service.get_session_results(
            practice_session_id=session.id,
            limit=1000,  # Large enough to get all results for a session
            offset=0,
        )
        
        # Convert session to response model
        session_response = PracticeSessionResponse.model_validate(session)
        
        # Add results to response
        response_data = session_response.model_dump()
        response_data['results'] = [ExerciseResultResponse.model_validate(r).model_dump() for r in results]
        
        items_with_results.append(PracticeSessionWithResultsResponse(**response_data))

    return PaginatedResponse(
        count=total,
        results=items_with_results,
    )


@router.get(
    "/{session_id}/with-results",
    response_model=PracticeSessionWithResultsResponse,
    summary="Get practice session with all results",
    description="Get detailed information about a specific practice session including all exercise results."
)
async def get_session_with_results(
    session_id: UUID,
    service: PracticeSessionService = Depends(get_service),
    result_service: ExerciseResultService = Depends(get_result_service),
):
    """Get practice session by ID with all results included."""
    try:
        session = await service.get_session_by_id(session_id)

        # Get all results for this session
        results = await result_service.get_session_results(
            practice_session_id=session.id,
            limit=1000,  # Large enough to get all results for a session
            offset=0,
        )
        
        # Debug logging
        print(f"[DEBUG] Session {session_id}: Found {len(results)} results")
        for r in results:
            print(f"[DEBUG]   - Result {r.id}: iteration {r.iteration_number}, status={r.processing_status}")

        # Convert session to response model
        session_response = PracticeSessionResponse.model_validate(session)
        
        # Add results to response
        response_data = session_response.model_dump()
        response_data['results'] = [ExerciseResultResponse.model_validate(r).model_dump() for r in results]
        
        print(f"[DEBUG] Response data keys: {response_data.keys()}")
        print(f"[DEBUG] Results array length: {len(response_data['results'])}")

        return PracticeSessionWithResultsResponse(**response_data)
    except PracticeSessionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get(
    "/{session_id}",
    response_model=PracticeSessionResponse,
    summary="Get practice session details",
    description="Get detailed information about a specific practice session."
)
async def get_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    service: PracticeSessionService = Depends(get_service),
    user_is_admin: bool = Depends(is_admin),
):
    """Get practice session by ID."""
    try:
        session = await service.get_session_by_id(session_id)

        # Authorization check (admins can access any session)
        if not user_is_admin and session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this session"
            )

        return PracticeSessionResponse.model_validate(session)
    except PracticeSessionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put(
    "/{session_id}/start-recording",
    response_model=PracticeSessionResponse,
    summary="Start recording for session",
    description="Mark the session recording as started."
)
async def start_recording(
    session_id: UUID,
    request: StartRecordingRequest,
    current_user: User = Depends(get_current_user),
    service: PracticeSessionService = Depends(get_service),
    user_is_admin: bool = Depends(is_admin),
):
    """Start recording for a practice session."""
    try:
        # Note: The audio_file_id will be set later when the session is completed
        # For now, we just mark the recording as started
        session = await service.start_recording(
            session_id=session_id,
            audio_file_id=None,  # Will be set on completion
            started_at=request.recording_timestamp,
        )

        # Authorization check (admins can modify any session)
        if not user_is_admin and session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this session"
            )

        return PracticeSessionResponse.model_validate(session)
    except PracticeSessionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except BusinessRuleViolationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put(
    "/{session_id}/complete",
    response_model=PracticeSessionResponse,
    summary="Complete practice session",
    description="Mark a practice session as completed."
)
async def complete_session(
    session_id: UUID,
    request: CompletePracticeSessionRequest,
    current_user: User = Depends(get_current_user),
    service: PracticeSessionService = Depends(get_service),
    user_is_admin: bool = Depends(is_admin),
):
    """Complete a practice session."""
    try:
        session = await service.complete_session(
            session_id=session_id,
            audio_file_id=request.audio_file_id,
            recording_duration_ms=request.recording_duration_ms,
            total_items=request.total_items,
            completed_items=request.completed_items,
        )

        # Authorization check (admins can modify any session)
        if not user_is_admin and session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this session"
            )

        return PracticeSessionResponse.model_validate(session)
    except PracticeSessionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except BusinessRuleViolationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put(
    "/{session_id}/abandon",
    response_model=PracticeSessionResponse,
    summary="Abandon practice session",
    description="Mark a practice session as abandoned."
)
async def abandon_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    service: PracticeSessionService = Depends(get_service),
    user_is_admin: bool = Depends(is_admin),
):
    """Abandon a practice session."""
    try:
        session = await service.abandon_session(session_id)

        # Authorization check (admins can modify any session)
        if not user_is_admin and session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this session"
            )

        return PracticeSessionResponse.model_validate(session)
    except PracticeSessionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except BusinessRuleViolationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put(
    "/{session_id}/attach-audio",
    response_model=PracticeSessionResponse,
    summary="Attach audio file to session",
    description="Attach a complete session audio file."
)
async def attach_audio(
    session_id: UUID,
    request: AttachAudioFileRequest,
    current_user: User = Depends(get_current_user),
    service: PracticeSessionService = Depends(get_service),
    user_is_admin: bool = Depends(is_admin),
):
    """Attach audio file to a practice session."""
    try:
        session = await service.attach_audio_file(
            session_id=session_id,
            audio_file_id=request.audio_file_id,
            duration_ms=request.duration_ms,
        )

        # Authorization check (admins can modify any session)
        if not user_is_admin and session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this session"
            )

        return PracticeSessionResponse.model_validate(session)
    except PracticeSessionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put(
    "/{session_id}/metrics",
    response_model=PracticeSessionResponse,
    summary="Update session metrics",
    description="Update progress metrics for a practice session."
)
async def update_metrics(
    session_id: UUID,
    request: UpdateSessionMetricsRequest,
    current_user: User = Depends(get_current_user),
    service: PracticeSessionService = Depends(get_service),
    user_is_admin: bool = Depends(is_admin),
):
    """Update session metrics (total_items, completed_items)."""
    try:
        session = await service.update_session_metrics(
            session_id=session_id,
            total_items=request.total_items,
            completed_items=request.completed_items,
        )

        # Authorization check (admins can modify any session)
        if not user_is_admin and session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this session"
            )

        return PracticeSessionResponse.model_validate(session)
    except PracticeSessionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get(
    "",
    response_model=PracticeSessionListResponse,
    summary="List user's practice sessions",
    description="Get a paginated list of practice sessions for the authenticated user."
)
async def list_user_sessions(
    status_filter: Optional[str] = Query(
        None,
        description="Filter by status: in_progress, completed, abandoned"
    ),
    limit: int = Query(10, ge=1, le=100, description="Maximum results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    current_user: User = Depends(get_current_user),
    service: PracticeSessionService = Depends(get_service),
):
    """List practice sessions for the authenticated user."""
    # Convert status string to enum if provided
    status_enum = None
    if status_filter:
        try:
            status_enum = SessionStatus(status_filter)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status_filter}. Must be one of: in_progress, completed, abandoned"
            )

    sessions = await service.get_user_sessions(
        user_id=current_user.id,
        status=status_enum,
        limit=limit,
        offset=offset,
    )

    total = await service.count_user_sessions(
        user_id=current_user.id,
        status=status_enum,
    )

    return PracticeSessionListResponse(
        items=[PracticeSessionResponse.model_validate(s) for s in sessions],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete practice session",
    description="Delete a practice session and all associated results."
)
async def delete_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    service: PracticeSessionService = Depends(get_service),
    user_is_admin: bool = Depends(is_admin),
):
    """Delete a practice session."""
    try:
        session = await service.get_session_by_id(session_id)

        # Authorization check (admins can delete any session)
        if not user_is_admin and session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this session"
            )

        await service.delete_session(session_id)
        return None
    except PracticeSessionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
