from abc import ABC, abstractmethod
from uuid import UUID

from src.core.ports.repositories.base import IRepository
from src.core.entities.exercise import Exercise


class IExerciseRepository(IRepository[Exercise], ABC):
    """Repository interface for Exercise aggregate."""

    @abstractmethod
    async def get_by_code(self, code: str) -> Exercise | None:
        """Retrieve exercise by unique code.
        
        Args:
            code: Exercise code
            
        Returns:
            Exercise if found, None otherwise
        """
        ...

    @abstractmethod
    async def get_by_category(self, category_id: UUID) -> list[Exercise]:
        """Retrieve all exercises in a category.
        
        Args:
            category_id: UUID of the category
            
        Returns:
            List of exercises in the category
        """
        ...

    @abstractmethod
    async def get_active_exercises(self, category_id: UUID | None = None) -> list[Exercise]:
        """Retrieve active (non-superseded) exercises.
        
        Args:
            category_id: Optional category filter
            
        Returns:
            List of active exercises
        """
        ...

    @abstractmethod
    async def get_exercise_versions(self, code: str) -> list[Exercise]:
        """Retrieve all versions of an exercise by code.
        
        Args:
            code: Exercise code
            
        Returns:
            List of all versions ordered by version number
        """
        ...

    @abstractmethod
    async def get_with_instructions(self, exercise_id: UUID, language: str | None = None) -> Exercise | None:
        """Retrieve exercise with instructions eagerly loaded.
        
        Args:
            exercise_id: UUID of the exercise
            language: Optional language filter for instructions
            
        Returns:
            Exercise with instructions if found, None otherwise
        """
        ...

    @abstractmethod
    async def get_with_items(self, exercise_id: UUID, language: str | None = None) -> Exercise | None:
        """Retrieve exercise with items and content eagerly loaded.
        
        Args:
            exercise_id: UUID of the exercise
            language: Optional language filter for content
            
        Returns:
            Exercise with items if found, None otherwise
        """
        ...

    @abstractmethod
    async def get_complete(self, exercise_id: UUID, language: str | None = None) -> Exercise | None:
        """Retrieve exercise with all related data (instructions, items, content).
        
        Args:
            exercise_id: UUID of the exercise
            language: Optional language filter
            
        Returns:
            Complete exercise if found, None otherwise
        """
        ...
