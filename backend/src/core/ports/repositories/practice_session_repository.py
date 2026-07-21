"""
Practice Session Repository Interface

Defines the contract for practice session data access.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from src.core.entities.practice_session import PracticeSession, SessionStatus


class IPracticeSessionRepository(ABC):
    """Repository interface for practice sessions."""
    
    @abstractmethod
    async def create(self, session: PracticeSession) -> PracticeSession:
        """
        Create a new practice session.
        
        Args:
            session: The session entity to create
            
        Returns:
            The created session with any generated fields
        """
        pass
    
    @abstractmethod
    async def find_by_id(self, session_id: UUID) -> Optional[PracticeSession]:
        """
        Find a session by ID.
        
        Args:
            session_id: The session ID
            
        Returns:
            The session if found, None otherwise
        """
        pass
    
    @abstractmethod
    async def update(self, session: PracticeSession) -> PracticeSession:
        """
        Update an existing session.
        
        Args:
            session: The session entity with updated values
            
        Returns:
            The updated session
        """
        pass
    
    @abstractmethod
    async def find_all(
        self,
        status: Optional[SessionStatus] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[PracticeSession]:
        """
        Find all sessions with optional status filter.
        
        Args:
            status: Optional status filter
            limit: Maximum number of results
            offset: Number of results to skip
            
        Returns:
            List of matching sessions
        """
        pass
    
    @abstractmethod
    async def find_by_user(
        self,
        user_id: UUID,
        status: Optional[SessionStatus] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[PracticeSession]:
        """
        Find sessions by user ID with optional status filter.
        
        Args:
            user_id: The user ID
            status: Optional status filter
            limit: Maximum number of results
            offset: Number of results to skip
            
        Returns:
            List of matching sessions
        """
        pass
    
    @abstractmethod
    async def find_by_exercise(
        self,
        exercise_id: UUID,
        limit: int = 100,
        offset: int = 0
    ) -> List[PracticeSession]:
        """
        Find sessions by exercise ID.
        
        Args:
            exercise_id: The exercise ID
            limit: Maximum number of results
            offset: Number of results to skip
            
        Returns:
            List of matching sessions
        """
        pass
    
    @abstractmethod
    async def count_all(
        self,
        status: Optional[SessionStatus] = None
    ) -> int:
        """
        Count all sessions with optional status filter.
        
        Args:
            status: Optional status filter
            
        Returns:
            Count of matching sessions
        """
        pass
    
    @abstractmethod
    async def count_by_user(
        self,
        user_id: UUID,
        status: Optional[SessionStatus] = None
    ) -> int:
        """
        Count sessions for a user with optional status filter.
        
        Args:
            user_id: The user ID
            status: Optional status filter
            
        Returns:
            Count of matching sessions
        """
        pass
    
    @abstractmethod
    async def delete(self, session_id: UUID) -> bool:
        """
        Delete a session by ID.
        
        Args:
            session_id: The session ID
            
        Returns:
            True if deleted, False if not found
        """
        pass
