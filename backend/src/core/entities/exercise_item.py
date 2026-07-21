"""  
Exercise Item domain entity.
"""

from datetime import datetime
from uuid import UUID
from typing import TYPE_CHECKING

from src.core.entities.base import Entity
from src.core.enums.exercise_enums import ExerciseItemType

if TYPE_CHECKING:
    from src.core.entities.exercise_item_content import ExerciseItemContent
    from src.core.entities.exercise_instructions import ExerciseInstructions


class ExerciseItem(Entity):
    """
    Represents a single item within an exercise or a standalone library item.
    
    Can be a movement instruction, speech practice, or informational content.
    Library items exist independently and can be reused across exercises.
    
    Domain Rules:
    - If is_library_item=True, exercise_id must be None
    - If is_library_item=False, exercise_id must be set
    - Library items must have at least one content item
    """
    
    exercise_id: UUID | None  # None for library items
    is_library_item: bool = False
    item_type: ExerciseItemType
    display_order: int = 0
    
    instruction_id: UUID | None = None
    repetitions: int | None = None
    duration_seconds: int | None = None
    metadata: dict | None = None  # Flexible JSONB field for additional attributes
    
    # Relationships (populated when eagerly loaded)
    instruction: "ExerciseInstructions | None" = None
    contents: "list[ExerciseItemContent]" = []
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    def validate(self) -> None:
        """Validate domain rules for exercise items."""
        # Rule: Library items must not have exercise_id
        if self.is_library_item and self.exercise_id is not None:
            raise ValueError(
                "Library items cannot have an exercise_id. Set exercise_id to None for library items."
            )
        
        # Rule: Non-library items must have exercise_id
        if not self.is_library_item and self.exercise_id is None:
            raise ValueError(
                "Regular exercise items must have an exercise_id. Set is_library_item=True for standalone items."
            )
        
        # Rule: Library items must have content
        if self.is_library_item and not self.contents:
            raise ValueError(
                "Library items must have at least one content item."
            )
    
    def is_reusable(self) -> bool:
        """Check if this item can be reused in other exercises."""
        return self.is_library_item
    
    def attach_to_exercise(self, exercise_id: UUID) -> "ExerciseItem":
        """Convert library item to exercise item by attaching to an exercise.
        
        Returns a new ExerciseItem instance (does not modify original).
        """
        if not self.is_library_item:
            raise ValueError("Only library items can be attached to exercises.")
        
        # Create new instance with exercise attached
        return ExerciseItem(
            id=None,  # New item gets new ID
            exercise_id=exercise_id,
            is_library_item=False,
            item_type=self.item_type,
            display_order=self.display_order,
            instruction_id=self.instruction_id,
            repetitions=self.repetitions,
            duration_seconds=self.duration_seconds,
            metadata=self.metadata.copy() if self.metadata else None,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )