"""
Practice Session API Schemas

Request and response schemas for practice session endpoints.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


# Request Schemas

class CreatePracticeSessionRequest(BaseModel):
    """Request schema for creating a practice session."""
    
    exercise_id: UUID = Field(..., description="Exercise to practice")
    total_items: int = Field(..., ge=1, description="Total number of practice items")
    metadata: Optional[dict] = Field(default_factory=dict, description="Session metadata (device info, settings)")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "exercise_id": "550e8400-e29b-41d4-a716-446655440000",
            "total_items": 10,
            "metadata": {
                "device_type": "mobile",
                "browser": "Chrome 120"
            }
        }
    })


class StartRecordingRequest(BaseModel):
    """Request schema for starting recording."""
    
    recording_timestamp: Optional[datetime] = Field(
        None,
        description="Recording start timestamp (defaults to now)"
    )


class CompletePracticeSessionRequest(BaseModel):
    """Request schema for completing a session."""
    
    audio_file_id: Optional[UUID] = Field(
        None,
        description="Session audio file ID"
    )
    recording_duration_ms: Optional[int] = Field(
        None,
        ge=0,
        description="Recording duration in milliseconds"
    )
    total_items: Optional[int] = Field(
        None,
        ge=0,
        description="Total number of unique items in session"
    )
    completed_items: Optional[int] = Field(
        None,
        ge=0,
        description="Number of unique items completed"
    )


class UpdateSessionMetricsRequest(BaseModel):
    """Request schema for updating session metrics."""
    
    total_items: Optional[int] = Field(None, ge=0, description="Total items count")
    completed_items: Optional[int] = Field(None, ge=0, description="Completed items count")


class AttachAudioFileRequest(BaseModel):
    """Request schema for attaching audio file."""
    
    audio_file_id: UUID = Field(..., description="Uploaded audio file ID")
    duration_ms: int = Field(..., ge=0, description="Audio duration in milliseconds")


# Response Schemas

class PracticeSessionResponse(BaseModel):
    """Response schema for practice session."""
    
    id: UUID
    user_id: UUID
    exercise_id: UUID
    started_at: datetime
    completed_at: Optional[datetime]
    status: str
    total_items: int
    completed_items: int
    session_audio_file_id: Optional[UUID]
    recording_started_at: Optional[datetime]
    recording_duration_ms: Optional[int]
    metadata: dict
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PracticeSessionListResponse(BaseModel):
    """Response schema for paginated session list."""
    
    items: list[PracticeSessionResponse]
    total: int
    limit: int
    offset: int


class PracticeSessionWithResultsResponse(BaseModel):
    """Response schema for practice session with included results."""
    
    id: UUID
    user_id: UUID
    exercise_id: UUID
    started_at: datetime
    completed_at: Optional[datetime]
    status: str
    total_items: int
    completed_items: int
    session_audio_file_id: Optional[UUID]
    recording_started_at: Optional[datetime]
    recording_duration_ms: Optional[int]
    metadata: dict
    created_at: datetime
    updated_at: datetime
    results: list[dict] = Field(default_factory=list, description="Exercise results for this session")

    model_config = ConfigDict(from_attributes=True)


class PracticeSessionWithResultsListResponse(BaseModel):
    """Response schema for paginated session list with results."""
    
    items: list[PracticeSessionWithResultsResponse]
    total: int
    limit: int
    offset: int
