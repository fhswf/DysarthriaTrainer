"""
Audio Recording REST Endpoint

HTTP endpoint for saving and retrieving audio recordings.
"""

import base64
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import (
    get_audio_analysis_service,
    get_current_user,
    get_db,
    get_logger,
)
from src.api.schemas.audio import (
    AudioAnalysisResponse,
    QualityCheckResponse,
    QualityMetricsSchema,
    RecordingCreateRequest,
    RecordingResponse,
)
from src.application.services.audio_analysis_service import AudioAnalysisService
from src.core.ports.utils.logger_protocol import ILogger
from src.infrastructure.persistence.sqla.models.user import User


router = APIRouter()


@router.post(
    "/analyze",
    response_model=AudioAnalysisResponse,
    status_code=status.HTTP_200_OK,
)
async def analyze_audio(
    audio_data: str,
    language: str = "de",
    apply_noise_reduction: bool = True,
    audio_service: AudioAnalysisService = Depends(get_audio_analysis_service),
    current_user: User = Depends(get_current_user),
    logger: ILogger = Depends(get_logger),
):
    """
    Analyze audio data and return transcription with quality metrics.
    
    Args:
        audio_data: Base64-encoded audio bytes
        language: Target language (de, en)
        apply_noise_reduction: Whether to apply noise reduction
        
    Returns:
        AudioAnalysisResponse with transcription and quality metrics
        
    Raises:
        HTTPException: If analysis fails
    """
    try:
        # Decode audio data
        audio_bytes = base64.b64decode(audio_data)
        
        # Perform analysis
        result = await audio_service.analyze_audio(
            audio_bytes,
            language=language,
            apply_noise_reduction=apply_noise_reduction,
        )
        
        # Convert to response schema
        response = AudioAnalysisResponse(
            transcription=result.transcription,
            language=result.language,
            confidence=result.confidence,
            quality_metrics=QualityMetricsSchema(
                snr_db=result.quality_metrics.snr_db,
                rms_energy=result.quality_metrics.rms_energy,
                clipping_detected=result.quality_metrics.clipping_detected,
                spectral_flatness=result.quality_metrics.spectral_flatness,
            ),
            warnings=result.warnings,
            processing_time_ms=result.processing_time_ms,
            timestamp=result.timestamp,
        )
        
        logger.info(
            f"Audio analysis completed for user {current_user.id}: "
            f"{len(result.transcription)} chars, {len(result.warnings)} warnings"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Audio analysis failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio analysis failed: {str(e)}",
        )


@router.post(
    "/quality-check",
    response_model=QualityCheckResponse,
    status_code=status.HTTP_200_OK,
)
async def check_audio_quality(
    audio_data: str,
    audio_service: AudioAnalysisService = Depends(get_audio_analysis_service),
    current_user: User = Depends(get_current_user),
    logger: ILogger = Depends(get_logger),
):
    """
    Quick quality check without transcription (faster).
    
    Useful for:
    - Pre-recording quality validation
    - Real-time quality monitoring
    - Testing microphone quality
    
    Args:
        audio_data: Base64-encoded audio bytes
        
    Returns:
        QualityCheckResponse with metrics and warnings
        
    Raises:
        HTTPException: If quality check fails
    """
    try:
        # Decode audio data
        audio_bytes = base64.b64decode(audio_data)
        
        # Calculate quality metrics only
        result = await audio_service.calculate_quality_only(audio_bytes)
        
        # Convert to response schema
        response = QualityCheckResponse(
            quality_metrics=QualityMetricsSchema(
                snr_db=result.quality_metrics.snr_db,
                rms_energy=result.quality_metrics.rms_energy,
                clipping_detected=result.quality_metrics.clipping_detected,
                spectral_flatness=result.quality_metrics.spectral_flatness,
            ),
            is_acceptable=result.quality_metrics.is_acceptable(),
            warnings=result.warnings,
            processing_time_ms=result.processing_time_ms or 0.0,
        )
        
        logger.info(
            f"Quality check for user {current_user.id}: "
            f"acceptable={response.is_acceptable}, {len(response.warnings)} warnings"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Quality check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quality check failed: {str(e)}",
        )


@router.post(
    "/recordings",
    response_model=RecordingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_recording(
    request: RecordingCreateRequest,
    audio_service: AudioAnalysisService = Depends(get_audio_analysis_service),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    logger: ILogger = Depends(),
):
    """
    Save audio recording with automatic transcription and quality analysis.
    
    Workflow:
    1. Decode and validate audio data
    2. Perform complete analysis (transcription + quality)
    3. Save audio file to storage
    4. Create database record
    5. Return recording with analysis results
    
    Args:
        request: RecordingCreateRequest with audio data and metadata
        
    Returns:
        RecordingResponse with saved recording and analysis
        
    Raises:
        HTTPException: If recording creation fails
    """
    try:
        # Decode audio data
        audio_bytes = base64.b64decode(request.audio_data)
        
        # Perform complete analysis
        result = await audio_service.analyze_audio(
            audio_bytes,
            language=request.language,
            apply_noise_reduction=True,
        )
        
        # TODO: Save audio file to storage
        # For now, we'll create a placeholder file path
        file_path = f"/data/audio/recordings/{current_user.id}_{datetime.utcnow().timestamp()}.wav"
        
        # TODO: Create database record for recording
        # This requires the Recording model to be created
        # For now, we'll return a mock response
        
        response = RecordingResponse(
            id=0,  # TODO: Replace with actual database ID
            exercise_id=request.exercise_id,
            user_id=current_user.id,
            file_path=file_path,
            duration_seconds=request.duration_seconds,
            transcription=result.transcription,
            quality_metrics=QualityMetricsSchema(
                snr_db=result.quality_metrics.snr_db,
                rms_energy=result.quality_metrics.rms_energy,
                clipping_detected=result.quality_metrics.clipping_detected,
                spectral_flatness=result.quality_metrics.spectral_flatness,
            ),
            warnings=result.warnings,
            created_at=datetime.utcnow(),
        )
        
        logger.info(
            f"Recording created for user {current_user.id}, "
            f"exercise {request.exercise_id}: {file_path}"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Recording creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recording creation failed: {str(e)}",
        )


@router.get(
    "/recordings/{recording_id}",
    response_model=RecordingResponse,
    status_code=status.HTTP_200_OK,
)
async def get_recording(
    recording_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    logger: ILogger = Depends(),
):
    """
    Retrieve a specific audio recording by ID.
    
    Args:
        recording_id: Recording ID
        
    Returns:
        RecordingResponse with recording data
        
    Raises:
        HTTPException: If recording not found or access denied
    """
    # TODO: Implement database retrieval
    # For now, return 501 Not Implemented
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Recording retrieval not yet implemented. Requires Recording model.",
    )


@router.get(
    "/recordings",
    response_model=list[RecordingResponse],
    status_code=status.HTTP_200_OK,
)
async def list_recordings(
    exercise_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    logger: ILogger = Depends(),
):
    """
    List audio recordings for current user.
    
    Args:
        exercise_id: Optional filter by exercise ID
        limit: Maximum number of recordings to return
        offset: Number of recordings to skip
        
    Returns:
        List of RecordingResponse objects
        
    Raises:
        HTTPException: If listing fails
    """
    # TODO: Implement database retrieval
    # For now, return 501 Not Implemented
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Recording listing not yet implemented. Requires Recording model.",
    )
