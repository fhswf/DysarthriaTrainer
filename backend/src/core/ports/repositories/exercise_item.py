from abc import ABC, abstractmethod
from uuid import UUID

from src.core.ports.repositories.base import IRepository
from src.core.entities.exercise_item import ExerciseItem


class IExerciseItemRepository(IRepository[ExerciseItem], ABC):
    """Repository interface for ExerciseItem aggregate."""

    @abstractmethod
    async def get_by_exercise(self, exercise_id: UUID, language: str | None = None) -> list[ExerciseItem]:
        """Retrieve all items for an exercise ordered by display_order.
        
        Args:
            exercise_id: UUID of the exercise
            language: Optional language filter for content
            
        Returns:
            List of items with content
        """
        ...

    @abstractmethod
    async def get_by_type(self, exercise_id: UUID, item_type: str) -> list[ExerciseItem]:
        """Retrieve items of a specific type for an exercise.
        
        Args:
            exercise_id: UUID of the exercise
            item_type: Type of items to retrieve (movement, speech_practice, information)
            
        Returns:
            List of items of the specified type
        """
        ...

    @abstractmethod
    async def get_with_content(self, item_id: UUID, language: str | None = None) -> ExerciseItem | None:
        """Retrieve item with content eagerly loaded.
        
        Args:
            item_id: UUID of the item
            language: Optional language filter for content
            
        Returns:
            Item with content if found, None otherwise
        """
        ...

    @abstractmethod
    async def reorder_items(self, exercise_id: UUID, item_ids: list[UUID]) -> bool:
        """Update display_order for multiple items within an exercise.
        
        Args:
            exercise_id: UUID of the exercise
            item_ids: Ordered list of item IDs
            
        Returns:
            True if successful, False otherwise
        """
        ...

    @abstractmethod
    async def bulk_create(self, items: list[ExerciseItem]) -> list[ExerciseItem]:
        """Create multiple items at once.
        
        Args:
            items: List of items to create
            
        Returns:
            List of created items
        """
        ...

    @abstractmethod
    async def delete_by_exercise(self, exercise_id: UUID) -> int:
        """Delete all items for an exercise.
        
        Args:
            exercise_id: UUID of the exercise
            
        Returns:
            Number of items deleted
        """
        ...

    @abstractmethod
    async def get_library_items(
        self, 
        item_type: str | None = None,
        language: str | None = None,
        limit: int = 50,
        offset: int = 0
    ) -> tuple[list[ExerciseItem], int]:
        """Retrieve library items with pagination.
        
        Args:
            item_type: Optional filter by item type
            language: Optional language filter for content
            limit: Maximum number of items to return
            offset: Number of items to skip
            
        Returns:
            Tuple of (items list, total count)
        """
        ...

    @abstractmethod
    async def get_library_item_with_content(self, item_id: UUID, language: str | None = None) -> ExerciseItem | None:
        """Retrieve library item with content eagerly loaded.
        
        Args:
            item_id: UUID of the library item
            language: Optional language filter for content
            
        Returns:
            Library item with content if found, None otherwise
        """
        ...

    @abstractmethod
    async def create_library_item(self, item: ExerciseItem) -> ExerciseItem:
        """Create a standalone library item.
        
        Args:
            item: Library item to create (must have is_library_item=True)
            
        Returns:
            Created library item
            
        Raises:
            ValueError: If item.is_library_item is False or exercise_id is not None
        """
        ...

    @abstractmethod
    async def duplicate_item(self, item_id: UUID, as_library_item: bool = False) -> ExerciseItem:
        """Duplicate an existing item.
        
        Creates a copy of the item with all content, instructions, and metadata.
        
        Args:
            item_id: UUID of the item to duplicate
            as_library_item: If True, creates as library item (exercise_id=None)
            
        Returns:
            Newly created duplicate item
        """
        ...

    @abstractmethod
    async def attach_library_item_to_exercise(
        self, 
        library_item_id: UUID, 
        exercise_id: UUID,
        display_order: int | None = None
    ) -> ExerciseItem:
        """Attach a library item to an exercise by creating a linked copy.
        
        Args:
            library_item_id: UUID of the library item
            exercise_id: UUID of the exercise to attach to
            display_order: Optional display order (defaults to last)
            
        Returns:
            Newly created exercise item linked to the exercise
            
        Raises:
            ValueError: If library_item_id is not a library item
        """
        ...
