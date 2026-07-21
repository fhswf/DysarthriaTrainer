"""
Exercise Instructions domain entity.
"""

from datetime import datetime
from uuid import UUID

from src.core.entities.base import Entity


class ExerciseInstructions(Entity):
    """
    Language-specific instructions for an exercise.
    
    Includes hints, explanations, safety notes, and optional media.
    """
    
    exercise_id: UUID
    language: str = "de"  # ISO 639-1 code
    
    hint_text: str | None = None
    explanation_text: str | None = None
    safety_notes: str | None = None
    audio_instruction_url: str | None = None
    image_url: str | None = None
    
    # Ordering - enables sequential presentation with exercise items
    display_order: int = 0
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
