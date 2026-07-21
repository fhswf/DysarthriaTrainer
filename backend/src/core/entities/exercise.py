"""
Exercise domain entity.
"""

from datetime import datetime
from uuid import UUID
from typing import TYPE_CHECKING

from src.core.entities.base import Entity
from src.core.enums.exercise_enums import DifficultyLevel

if TYPE_CHECKING:
    from src.core.entities.exercise_category import ExerciseCategory
    from src.core.entities.exercise_item import ExerciseItem
    from src.core.entities.exercise_instructions import ExerciseInstructions


class Exercise(Entity):
    """
    Represents a speech therapy exercise with versioning support.
    
    Example: "Für den Mund" - Mouth exercises
    """
    
    category_id: UUID
    code: str
    title: str
    subtitle: str | None = None
    scope: str | None = None
    difficulty_level: DifficultyLevel = DifficultyLevel.BEGINNER
    estimated_duration_minutes: int | None = None
    display_order: int = 0
    
    # Versioning
    version: int = 1
    is_active: bool = True
    superseded_by: UUID | None = None
    
    # Soft delete
    deleted_at: datetime | None = None
    deleted_by: UUID | None = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    created_by: str | None = None
    
    # Relationships (populated when eagerly loaded)
    instructions: "list[ExerciseInstructions]" = []
    category: "ExerciseCategory | None" = None
    items: "list[ExerciseItem]" = []
