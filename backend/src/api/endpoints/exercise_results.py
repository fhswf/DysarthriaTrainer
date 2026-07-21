"""
Exercise Results API Endpoints

REST endpoints for managing exercise result analysis and tracking.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_db_session, get_current_user, is_admin
from src.api.schemas.exercise_result_schemas import (
    CreateExerciseResultRequest,
    AttachAudioSegmentRequest,
    SetTranscriptionRequest,
    SetPhonemeAnalysisRequest,
    SetAudioQualityRequest,
    SetEvaluationScoresRequest,
    ExerciseResultResponse,
    ExerciseResultListResponse,
)
from src.application.services.exercise_result_service import ExerciseResultService
from src.application.services.practice_session_service import PracticeSessionService
from src.infrastructure.persistence.sqla.repositories.exercise_result_repository import ExerciseResultRepository
from src.infrastructure.persistence.sqla.repositories.practice_session_repository import PracticeSessionRepository
from src.application.exceptions.not_found import ExerciseResultNotFoundError, PracticeSessionNotFoundError
from src.application.exceptions.business_rules import BusinessRuleViolationError
from src.core.entities.exercise_result import ProcessingStatus
from src.core.entities.user import User


router = APIRouter(prefix="/practice/results", tags=["Exercise Results"])


def get_result_service(db: AsyncSession = Depends(get_db_session)) -> ExerciseResultService:
    """Dependency to get exercise result service."""
    repository = ExerciseResultRepository(db)
    return ExerciseResultService(repository)


def get_session_service(db: AsyncSession = Depends(get_db_session)) -> PracticeSessionService:
    """Dependency to get practice session service for authorization."""
    session_repository = PracticeSessionRepository(db)
    result_repository = ExerciseResultRepository(db)
    return PracticeSessionService(
        repository=session_repository,
        result_repository=result_repository,
    )


@router.post(
    "",
    response_model=ExerciseResultResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new exercise result",
    description="Create a result entry for an exercise item attempt."
)
async def create_result(
    request: CreateExerciseResultRequest,
    current_user: User = Depends(get_current_user),
    result_service: ExerciseResultService = Depends(get_result_service),
    session_service: PracticeSessionService = Depends(get_session_service),
    user_is_admin: bool = Depends(is_admin),
):
    """
    Create a new exercise result.

    - **practice_session_id**: Parent session ID
    - **exercise_item_id**: Exercise item being attempted
    - **started_at**: Item attempt start timestamp
    - **completed_at**: Item attempt completion timestamp
    - **iteration_number**: Iteration number for repeated items (1-based)
    - **audio_segment_start_ms**: Optional audio segment start offset
    - **audio_segment_end_ms**: Optional audio segment end offset
    """
    try:
        # Authorization: Verify user owns the practice session (admins can create for any session)
        session = await session_service.get_session_by_id(request.practice_session_id)
        if not user_is_admin and session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to create results for this session"
            )

        result = await result_service.create_result(
            practice_session_id=request.practice_session_id,
            exercise_item_id=request.exercise_item_id,
            started_at=request.started_at,
            completed_at=request.completed_at,
            iteration_number=request.iteration_number,
            audio_segment_start_ms=request.audio_segment_start_ms,
            audio_segment_end_ms=request.audio_segment_end_ms,
        )
        return ExerciseResultResponse.model_validate(result)
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


@router.get(
    "/{result_id}",
    response_model=ExerciseResultResponse,
    summary="Get exercise result details",
    description="Get detailed information about a specific exercise result."
)
async def get_result(
    result_id: UUID,
    current_user: User = Depends(get_current_user),
    result_service: ExerciseResultService = Depends(get_result_service),
    session_service: PracticeSessionService = Depends(get_session_service),
    user_is_admin: bool = Depends(is_admin),
):
    """Get exercise result by ID."""
    try:
        result = await result_service.get_result_by_id(result_id)

        # Authorization: Verify user owns the session (admins can access any result)
        session = await session_service.get_session_by_id(result.practice_session_id)
        if not user_is_admin and session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this result"
            )

        return ExerciseResultResponse.model_validate(result)
    except ExerciseResultNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PracticeSessionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put(
    "/{result_id}/audio-segment",
    response_model=ExerciseResultResponse,
    summary="Attach audio segment",
    description="Attach audio segment timestamps to a result."
)
async def attach_audio_segment(
    result_id: UUID,
    request: AttachAudioSegmentRequest,
    current_user: User = Depends(get_current_user),
    result_service: ExerciseResultService = Depends(get_result_service),
    session_service: PracticeSessionService = Depends(get_session_service),
    user_is_admin: bool = Depends(is_admin),
):
    """Attach audio segment to an exercise result."""
    try:
        # Get result and check authorization (admins can modify any result)
        result = await result_service.get_result_by_id(result_id)
        session = await session_service.get_session_by_id(result.practice_session_id)
        if not user_is_admin and session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this result"
            )

        updated_result = await result_service.attach_audio_segment(
            result_id=result_id,
            audio_file_id=request.audio_file_id,
            start_ms=request.start_ms,
            end_ms=request.end_ms,
        )
        return ExerciseResultResponse.model_validate(updated_result)
    except ExerciseResultNotFoundError as e:
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
    "/{result_id}/transcription",
    response_model=ExerciseResultResponse,
    summary="Set transcription",
    description="Set the speech-to-text transcription for a result."
)
async def set_transcription(
    result_id: UUID,
    request: SetTranscriptionRequest,
    current_user: User = Depends(get_current_user),
    result_service: ExerciseResultService = Depends(get_result_service),
    session_service: PracticeSessionService = Depends(get_session_service),
    user_is_admin: bool = Depends(is_admin),
):
    """Set transcription for an exercise result."""
    try:
        # Get result and check authorization (admins can modify any result)
        result = await result_service.get_result_by_id(result_id)
        session = await session_service.get_session_by_id(result.practice_session_id)
        if not user_is_admin and session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this result"
            )

        updated_result = await result_service.set_transcription(
            result_id=result_id,
            transcription_text=request.text,
            confidence=request.confidence,
        )
        return ExerciseResultResponse.model_validate(updated_result)
    except ExerciseResultNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put(
    "/{result_id}/phoneme-analysis",
    response_model=ExerciseResultResponse,
    summary="Set phoneme analysis",
    description="Set phoneme detection and analysis results."
)
async def set_phoneme_analysis(
    result_id: UUID,
    request: SetPhonemeAnalysisRequest,
    current_user: User = Depends(get_current_user),
    result_service: ExerciseResultService = Depends(get_result_service),
    session_service: PracticeSessionService = Depends(get_session_service),
    user_is_admin: bool = Depends(is_admin),
):
    """Set phoneme analysis for an exercise result."""
    try:
        # Get result and check authorization (admins can modify any result)
        result = await result_service.get_result_by_id(result_id)
        session = await session_service.get_session_by_id(result.practice_session_id)
        if not user_is_admin and session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this result"
            )

        updated_result = await result_service.set_phoneme_analysis(
            result_id=result_id,
            detected_phonemes=request.detected_phonemes,
            phoneme_accuracy=request.phoneme_accuracy,
            common_errors=request.common_errors,
            ipa_transcription=request.ipa_transcription,
            expected_ipa=request.expected_ipa,
        )
        return ExerciseResultResponse.model_validate(updated_result)
    except ExerciseResultNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put(
    "/{result_id}/audio-quality",
    response_model=ExerciseResultResponse,
    summary="Set audio quality metrics",
    description="Set audio quality analysis results."
)
async def set_audio_quality(
    result_id: UUID,
    request: SetAudioQualityRequest,
    current_user: User = Depends(get_current_user),
    result_service: ExerciseResultService = Depends(get_result_service),
    session_service: PracticeSessionService = Depends(get_session_service),
    user_is_admin: bool = Depends(is_admin),
):
    """Set audio quality metrics for an exercise result."""
    try:
        # Get result and check authorization (admins can modify any result)
        result = await result_service.get_result_by_id(result_id)
        session = await session_service.get_session_by_id(result.practice_session_id)
        if not user_is_admin and session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this result"
            )

        updated_result = await result_service.set_audio_quality_metrics(
            result_id=result_id,
            snr_db=request.snr_db,
            rms_energy=request.rms_energy,
            clipping_detected=request.clipping_detected,
            spectral_flatness=request.spectral_flatness,
            quality_level=request.quality_level,
            is_suitable_for_therapy=request.is_suitable_for_therapy,
            warnings=request.warnings,
        )
        return ExerciseResultResponse.model_validate(updated_result)
    except ExerciseResultNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.put(
    "/{result_id}/evaluation",
    response_model=ExerciseResultResponse,
    summary="Set evaluation scores",
    description="Set evaluation scores and feedback."
)
async def set_evaluation(
    result_id: UUID,
    request: SetEvaluationScoresRequest,
    current_user: User = Depends(get_current_user),
    result_service: ExerciseResultService = Depends(get_result_service),
    session_service: PracticeSessionService = Depends(get_session_service),
    user_is_admin: bool = Depends(is_admin),
):
    """Set evaluation scores for an exercise result."""
    try:
        # Get result and check authorization (admins can modify any result)
        result = await result_service.get_result_by_id(result_id)
        session = await session_service.get_session_by_id(result.practice_session_id)
        if not user_is_admin and session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this result"
            )

        updated_result = await result_service.set_evaluation_results(
            result_id=result_id,
            accuracy_score=request.accuracy_score,
            pronunciation_score=request.pronunciation_score,
            fluency_score=request.fluency_score,
            overall_score=request.overall_score,
        )
        return ExerciseResultResponse.model_validate(updated_result)
    except ExerciseResultNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get(
    "/session/{session_id}",
    response_model=ExerciseResultListResponse,
    summary="List session results",
    description="Get all results for a practice session."
)
async def list_session_results(
    session_id: UUID,
    limit: int = Query(100, ge=1, le=500, description="Maximum results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    current_user: User = Depends(get_current_user),
    result_service: ExerciseResultService = Depends(get_result_service),
    session_service: PracticeSessionService = Depends(get_session_service),
    user_is_admin: bool = Depends(is_admin),
):
    """List all exercise results for a practice session."""
    try:
        # Authorization: Verify user owns the session (admins can access any session)
        session = await session_service.get_session_by_id(session_id)
        if not user_is_admin and session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access results for this session"
            )

        results = await result_service.get_session_results(
            practice_session_id=session_id,
            limit=limit,
            offset=offset,
        )

        total = await result_service.count_session_results(practice_session_id=session_id)

        return ExerciseResultListResponse(
            items=[ExerciseResultResponse.model_validate(r) for r in results],
            total=total,
            limit=limit,
            offset=offset,
        )
    except PracticeSessionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete(
    "/{result_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete exercise result",
    description="Delete an exercise result."
)
async def delete_result(
    result_id: UUID,
    current_user: User = Depends(get_current_user),
    result_service: ExerciseResultService = Depends(get_result_service),
    session_service: PracticeSessionService = Depends(get_session_service),
    user_is_admin: bool = Depends(is_admin),
):
    """Delete an exercise result."""
    try:
        result = await result_service.get_result_by_id(result_id)

        # Authorization: Verify user owns the session (admins can delete any result)
        session = await session_service.get_session_by_id(result.practice_session_id)
        if not user_is_admin and session.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this result"
            )

        await result_service.delete_result(result_id)
        return None
    except ExerciseResultNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PracticeSessionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
