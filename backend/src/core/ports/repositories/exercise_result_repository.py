"""
Exercise Result Repository Interface

Defines the contract for exercise result data access.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from src.core.entities.exercise_result import ExerciseResult, ProcessingStatus


class IExerciseResultRepository(ABC):
    """Repository interface for exercise results."""
    
    @abstractmethod
    async def create(self, result: ExerciseResult) -> ExerciseResult:
        """
        Create a new exercise result.
        
        Args:
            result: The result entity to create
            
        Returns:
            The created result with any generated fields
        """
        pass
    
    @abstractmethod
    async def find_by_id(self, result_id: UUID) -> Optional[ExerciseResult]:
        """
        Find a result by ID.
        
        Args:
            result_id: The result ID
            
        Returns:
            The result if found, None otherwise
        """
        pass
    
    @abstractmethod
    async def update(self, result: ExerciseResult) -> ExerciseResult:
        """
        Update an existing result.
        
        Args:
            result: The result entity with updated values
            
        Returns:
            The updated result
        """
        pass
    
    @abstractmethod
    async def find_by_session(
        self,
        practice_session_id: UUID,
        limit: int = 100,
        offset: int = 0
    ) -> List[ExerciseResult]:
        """
        Find results by practice session ID.
        
        Args:
            practice_session_id: The practice session ID
            limit: Maximum number of results
            offset: Number of results to skip
            
        Returns:
            List of matching results
        """
        pass
    
    @abstractmethod
    async def find_by_item(
        self,
        exercise_item_id: UUID,
        limit: int = 100,
        offset: int = 0
    ) -> List[ExerciseResult]:
        """
        Find results by exercise item ID.
        
        Args:
            exercise_item_id: The exercise item ID
            limit: Maximum number of results
            offset: Number of results to skip
            
        Returns:
            List of matching results
        """
        pass
    
    @abstractmethod
    async def find_by_status(
        self,
        status: ProcessingStatus,
        limit: int = 100
    ) -> List[ExerciseResult]:
        """
        Find results by processing status.
        
        Args:
            status: The processing status
            limit: Maximum number of results
            
        Returns:
            List of matching results
        """
        pass
    
    @abstractmethod
    async def count_by_session(self, practice_session_id: UUID) -> int:
        """
        Count results for a practice session.
        
        Args:
            practice_session_id: The practice session ID
            
        Returns:
            Count of results
        """
        pass
    
    @abstractmethod
    async def delete(self, result_id: UUID) -> bool:
        """
        Delete a result by ID.
        
        Args:
            result_id: The result ID
            
        Returns:
            True if deleted, False if not found
        """
        pass
