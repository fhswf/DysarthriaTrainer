"""
Exercise Item Content domain entity.
"""

from datetime import datetime
from uuid import UUID

from src.core.entities.base import Entity
from src.core.enums.exercise_enums import DifficultyLevel, InformationType


class ExerciseItemContent(Entity):
    """
    Language-specific content for an exercise item.
    
    Polymorphic structure supporting:
    - Movement instructions (with video/image)
    - Speech practice (with audio and phonetic transcription)
    - Informational content (with type classification)
    """
    
    item_id: UUID
    language: str = "de"  # ISO 639-1 code
    
    # Common fields
    text_content: str | None = None
    
    # Movement-specific
    demonstration_video_url: str | None = None
    image_url: str | None = None
    
    # Speech practice-specific
    phonetic_transcription: str | None = None
    audio_example_url: str | None = None
    difficulty: DifficultyLevel | None = None
    
    # Information-specific
    info_type: InformationType | None = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
