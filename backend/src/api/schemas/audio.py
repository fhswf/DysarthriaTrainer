"""
Audio API Schemas

Pydantic models for audio recording and analysis endpoints.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class QualityMetricsSchema(BaseModel):
    """Audio quality metrics schema."""
    
    snr_db: Optional[float] = Field(None, description="Signal-to-Noise Ratio in dB")
    rms_energy: Optional[float] = Field(None, description="Root Mean Square energy level")
    clipping_detected: bool = Field(False, description="Whether audio clipping was detected")
    spectral_flatness: Optional[float] = Field(None, description="Spectral flatness (0-1)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "snr_db": 18.5,
                "rms_energy": 0.35,
                "clipping_detected": False,
                "spectral_flatness": 0.25,
            }
        }


class AudioAnalysisResponse(BaseModel):
    """Response schema for audio analysis."""
    
    transcription: str = Field(..., description="Transcribed text")
    language: str = Field("de", description="Detected or specified language")
    confidence: Optional[float] = Field(None, description="Transcription confidence (0-1)")
    quality_metrics: QualityMetricsSchema = Field(..., description="Audio quality metrics")
    warnings: list[str] = Field(default_factory=list, description="Quality warnings")
    processing_time_ms: Optional[float] = Field(None, description="Processing time in milliseconds")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Analysis timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "transcription": "Das ist ein Test.",
                "language": "de",
                "confidence": 0.95,
                "quality_metrics": {
                    "snr_db": 18.5,
                    "rms_energy": 0.35,
                    "clipping_detected": False,
                    "spectral_flatness": 0.25,
                },
                "warnings": [],
                "processing_time_ms": 245.5,
                "timestamp": "2024-01-15T10:30:00Z",
            }
        }


class AudioStreamChunk(BaseModel):
    """WebSocket message for streaming audio chunks."""
    
    audio_data: str = Field(..., description="Base64-encoded audio data")
    chunk_index: int = Field(..., description="Chunk sequence number")
    is_final: bool = Field(False, description="Whether this is the final chunk")
    
    class Config:
        json_schema_extra = {
            "example": {
                "audio_data": "UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
                "chunk_index": 0,
                "is_final": False,
            }
        }


class AudioStreamResponse(BaseModel):
    """WebSocket response for streaming audio analysis."""
    
    chunk_index: int = Field(..., description="Chunk sequence number")
    transcription: str = Field(..., description="Partial or complete transcription")
    is_final: bool = Field(False, description="Whether analysis is complete")
    quality_metrics: Optional[QualityMetricsSchema] = Field(None, description="Quality metrics (if final)")
    warnings: list[str] = Field(default_factory=list, description="Quality warnings (if final)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "chunk_index": 2,
                "transcription": "Das ist ein",
                "is_final": False,
                "quality_metrics": None,
                "warnings": [],
            }
        }


class RecordingCreateRequest(BaseModel):
    """Request schema for creating an audio recording."""
    
    exercise_id: int = Field(..., description="Exercise ID this recording belongs to")
    audio_data: str = Field(..., description="Base64-encoded audio data")
    duration_seconds: float = Field(..., gt=0, description="Recording duration in seconds")
    language: str = Field("de", description="Recording language")
    
    class Config:
        json_schema_extra = {
            "example": {
                "exercise_id": 123,
                "audio_data": "UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
                "duration_seconds": 3.5,
                "language": "de",
            }
        }


class RecordingResponse(BaseModel):
    """Response schema for audio recording."""
    
    id: int = Field(..., description="Recording ID")
    exercise_id: int = Field(..., description="Exercise ID")
    user_id: int = Field(..., description="User ID")
    file_path: str = Field(..., description="Stored file path")
    duration_seconds: float = Field(..., description="Recording duration")
    transcription: Optional[str] = Field(None, description="Transcribed text")
    quality_metrics: Optional[QualityMetricsSchema] = Field(None, description="Quality metrics")
    warnings: list[str] = Field(default_factory=list, description="Quality warnings")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": 456,
                "exercise_id": 123,
                "user_id": 789,
                "file_path": "/data/audio/recordings/456.wav",
                "duration_seconds": 3.5,
                "transcription": "Das ist ein Test.",
                "quality_metrics": {
                    "snr_db": 18.5,
                    "rms_energy": 0.35,
                    "clipping_detected": False,
                    "spectral_flatness": 0.25,
                },
                "warnings": [],
                "created_at": "2024-01-15T10:30:00Z",
            }
        }


class QualityCheckResponse(BaseModel):
    """Response schema for quick quality check (no transcription)."""
    
    quality_metrics: QualityMetricsSchema = Field(..., description="Audio quality metrics")
    is_acceptable: bool = Field(..., description="Whether quality meets minimum standards")
    warnings: list[str] = Field(default_factory=list, description="Quality warnings")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "quality_metrics": {
                    "snr_db": 18.5,
                    "rms_energy": 0.35,
                    "clipping_detected": False,
                    "spectral_flatness": 0.25,
                },
                "is_acceptable": True,
                "warnings": [],
                "processing_time_ms": 45.2,
            }
        }
