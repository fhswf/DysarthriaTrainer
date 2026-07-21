from abc import ABC, abstractmethod

from src.core.ports.repositories.base import IRepository
from src.core.entities.exercise_category import ExerciseCategory


class IExerciseCategoryRepository(IRepository[ExerciseCategory], ABC):
    """Repository interface for ExerciseCategory aggregate."""

    @abstractmethod
    async def get_by_slug(self, slug: str) -> ExerciseCategory | None:
        """Retrieve category by unique slug.
        
        Args:
            slug: Category slug
            
        Returns:
            Category if found, None otherwise
        """
        ...

    @abstractmethod
    async def get_active_categories(self) -> list[ExerciseCategory]:
        """Retrieve all non-deleted categories ordered by display_order.
        
        Returns:
            List of active categories
        """
        ...

    @abstractmethod
    async def get_all_paginated(
        self,
        offset: int = 0,
        limit: int = 50,
        search: str | None = None,
    ) -> tuple[list[ExerciseCategory], int]:
        """Retrieve paginated categories (including deleted).
        
        Args:
            offset: Number of items to skip
            limit: Maximum items to return
            search: Optional search term for name, slug, or description
            
        Returns:
            Tuple of (categories, total_count)
        """
        ...

    @abstractmethod
    async def get_active_categories_paginated(
        self,
        offset: int = 0,
        limit: int = 50,
        search: str | None = None,
    ) -> tuple[list[ExerciseCategory], int]:
        """Retrieve paginated non-deleted categories ordered by display_order.
        
        Args:
            offset: Number of items to skip
            limit: Maximum items to return
            search: Optional search term for name, slug, or description
            
        Returns:
            Tuple of (active_categories, total_count)
        """
        ...

    @abstractmethod
    async def reorder_categories(self, category_ids: list[str]) -> bool:
        """Update display_order for multiple categories.
        
        Args:
            category_ids: Ordered list of category IDs
            
        Returns:
            True if successful, False otherwise
        """
        ...

    @abstractmethod
    async def get_with_exercises(self, category_id: str, include_inactive: bool = False) -> ExerciseCategory | None:
        """Retrieve category with exercises eagerly loaded.
        
        Args:
            category_id: UUID of the category
            include_inactive: Whether to include inactive exercises
            
        Returns:
            Category with exercises if found, None otherwise
        """
        ...

    @abstractmethod
    async def soft_delete(self, category_id: str, deleted_by: str) -> bool:
        """Soft delete a category.
        
        Args:
            category_id: UUID of the category
            deleted_by: User ID performing the deletion
            
        Returns:
            True if successful, False otherwise
        """
        ...
