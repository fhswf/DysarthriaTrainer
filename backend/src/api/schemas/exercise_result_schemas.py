"""
Exercise Result API Schemas

Request and response schemas for exercise result endpoints.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


# Request Schemas

class CreateExerciseResultRequest(BaseModel):
    """Request schema for creating an exercise result."""
    
    practice_session_id: UUID = Field(..., description="Parent session ID")
    exercise_item_id: UUID = Field(..., description="Exercise item ID")
    started_at: datetime = Field(..., description="Item start timestamp")
    completed_at: datetime = Field(..., description="Item completion timestamp")
    iteration_number: int = Field(1, ge=1, description="Iteration number for repeats")
    audio_segment_start_ms: Optional[int] = Field(None, ge=0, description="Audio segment start offset")
    audio_segment_end_ms: Optional[int] = Field(None, ge=0, description="Audio segment end offset")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "practice_session_id": "550e8400-e29b-41d4-a716-446655440000",
            "exercise_item_id": "660e8400-e29b-41d4-a716-446655440000",
            "started_at": "2024-11-28T10:30:00Z",
            "completed_at": "2024-11-28T10:31:00Z",
            "iteration_number": 1,
            "audio_segment_start_ms": 0,
            "audio_segment_end_ms": 60000
        }
    })


class AttachAudioSegmentRequest(BaseModel):
    """Request schema for attaching audio segment."""
    
    audio_file_id: UUID = Field(..., description="Audio file ID")
    start_ms: int = Field(..., ge=0, description="Segment start in milliseconds")
    end_ms: int = Field(..., ge=0, description="Segment end in milliseconds")


class SetTranscriptionRequest(BaseModel):
    """Request schema for setting transcription."""
    
    text: str = Field(..., min_length=1, description="Transcribed text")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Transcription confidence")


class SetPhonemeAnalysisRequest(BaseModel):
    """Request schema for setting phoneme analysis."""
    
    detected_phonemes: list[dict] = Field(..., description="List of detected phonemes with accuracy")
    phoneme_accuracy: float = Field(..., ge=0.0, le=1.0, description="Overall phoneme accuracy")
    common_errors: list[str] = Field(..., description="Common error descriptions")
    ipa_transcription: str = Field(..., description="IPA transcription of detected speech")
    expected_ipa: str = Field(..., description="Expected IPA transcription")


class SetAudioQualityRequest(BaseModel):
    """Request schema for setting audio quality metrics."""
    
    snr_db: float = Field(..., description="Signal-to-noise ratio in decibels")
    rms_energy: float = Field(..., description="RMS energy level")
    clipping_detected: bool = Field(..., description="Whether audio clipping was detected")
    spectral_flatness: float = Field(..., description="Spectral flatness measure")
    quality_level: str = Field(..., description="Quality level: excellent, good, fair, poor")
    is_suitable_for_therapy: bool = Field(..., description="Whether audio is suitable for therapy")
    warnings: Optional[list[str]] = Field(default_factory=list, description="Warning messages")


class SetEvaluationScoresRequest(BaseModel):
    """Request schema for setting evaluation scores."""
    
    accuracy_score: float = Field(..., ge=0.0, le=100.0, description="Speech accuracy (0-100)")
    pronunciation_score: float = Field(..., ge=0.0, le=100.0, description="Pronunciation quality (0-100)")
    fluency_score: float = Field(..., ge=0.0, le=100.0, description="Speech fluency (0-100)")
    overall_score: float = Field(..., ge=0.0, le=100.0, description="Overall score (0-100)")


# Response Schemas

class ExerciseResultResponse(BaseModel):
    """Response schema for exercise result."""
    
    id: UUID
    practice_session_id: UUID
    exercise_item_id: UUID
    iteration_number: int
    started_at: datetime
    completed_at: datetime
    duration_ms: int
    audio_file_id: Optional[UUID]
    audio_segment_start_ms: Optional[int]
    audio_segment_end_ms: Optional[int]
    audio_duration_ms: Optional[int]
    transcription: Optional[str]
    transcription_confidence: Optional[float]
    phoneme_analysis: Optional[dict]
    audio_quality_metrics: Optional[dict]
    analysis_parameters: Optional[dict]
    evaluation_results: Optional[dict]
    processing_status: str
    processing_error: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def model_validate(cls, obj, **kwargs):
        """Custom validation to handle dataclass objects in dict fields."""
        from dataclasses import is_dataclass, asdict
        
        # Convert dataclass objects to dicts for JSON fields
        if hasattr(obj, 'audio_quality_metrics') and obj.audio_quality_metrics:
            if is_dataclass(obj.audio_quality_metrics):
                obj.audio_quality_metrics = asdict(obj.audio_quality_metrics)
        
        if hasattr(obj, 'phoneme_analysis') and obj.phoneme_analysis:
            if is_dataclass(obj.phoneme_analysis):
                obj.phoneme_analysis = asdict(obj.phoneme_analysis)
        
        return super().model_validate(obj, **kwargs)


class ExerciseResultListResponse(BaseModel):
    """Response schema for result list."""
    
    items: list[ExerciseResultResponse]
    total: int
    limit: int
    offset: int
