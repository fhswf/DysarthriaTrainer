"""
Exercise Category domain entity.
"""

from datetime import datetime
from uuid import UUID

from src.core.entities.base import Entity


class ExerciseCategory(Entity):
    """
    Represents a hierarchical category for organizing exercises.
    
    Example: "Gymnastik Sprechwerkzeuge" (Speech Tool Gymnastics)
    """
    
    name: str
    slug: str
    description: str | None = None
    icon_url: str | None = None
    display_order: int = 0
    
    # Soft delete
    deleted_at: datetime | None = None
    deleted_by: UUID | None = None
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
