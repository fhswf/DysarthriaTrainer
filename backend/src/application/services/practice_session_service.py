"""
Practice Session Service for managing exercise practice sessions and audio recording.
"""

from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import TYPE_CHECKING

from src.application.services.base_service import BaseService
from src.application.exceptions.not_found import PracticeSessionNotFoundError
from src.application.exceptions.business_rules import (
    SessionAlreadyCompletedError,
    SessionAlreadyAbandonedError,
    InvalidSessionStateTransitionError,
)
from src.core.entities.practice_session import PracticeSession, SessionStatus
from src.core.ports.repositories.practice_session_repository import IPracticeSessionRepository
from src.core.ports.repositories.exercise_result_repository import IExerciseResultRepository

# Avoid circular import for type hints
if TYPE_CHECKING:
    from src.application.services.media_service import MediaService


class PracticeSessionService(BaseService):
    """Service for practice session management operations."""

    def __init__(
        self,
        repository: IPracticeSessionRepository,
        result_repository: IExerciseResultRepository,
        media_service: "MediaService | None" = None,
    ):
        """
        Initialize the service with required dependencies.
        
        Args:
            repository: Practice session repository interface
            result_repository: Exercise result repository interface
            media_service: Media service for file management (optional, for deletion)
        """
        self._repo = repository
        self._result_repo = result_repository
        self._media_service = media_service

    # ==================== Session Lifecycle ====================

    async def create_session(
        self,
        user_id: UUID,
        exercise_id: UUID,
    ) -> PracticeSession:
        """
        Create a new practice session.
        
        Args:
            user_id: ID of the user practicing
            exercise_id: ID of the exercise being practiced
            
        Returns:
            Created practice session
        """
        session = PracticeSession(
            id=uuid4(),
            user_id=user_id,
            exercise_id=exercise_id,
            status=SessionStatus.IN_PROGRESS,
            session_audio_file_id=None,
            recording_started_at=None,
            recording_duration_ms=None,
            total_items=0,
            completed_items=0,
            started_at=datetime.now(timezone.utc),
            completed_at=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        return await self._repo.create(session)

    async def start_recording(
        self,
        session_id: UUID,
        audio_file_id: UUID | None = None,
        started_at: datetime | None = None,
    ) -> PracticeSession:
        """
        Start audio recording for a practice session.
        
        Args:
            session_id: ID of the practice session
            audio_file_id: ID of the audio file being recorded (optional, can be set later)
            started_at: Recording start timestamp (defaults to now)
            
        Returns:
            Updated practice session
            
        Raises:
            PracticeSessionNotFoundError: If session doesn't exist
            SessionAlreadyCompletedError: If session is already completed
            SessionAlreadyAbandonedError: If session was abandoned
        """
        session = await self.get_session_by_id(session_id)
        
        # Validate session state
        self._ensure_session_modifiable(session)
        
        # Update recording info
        if audio_file_id is not None:
            session.session_audio_file_id = audio_file_id
        session.recording_started_at = started_at or datetime.now(timezone.utc)
        session.updated_at = datetime.now(timezone.utc)
        
        return await self._repo.update(session)

    async def complete_session(
        self,
        session_id: UUID,
        audio_file_id: UUID | None = None,
        recording_duration_ms: int | None = None,
        total_items: int | None = None,
        completed_items: int | None = None,
    ) -> PracticeSession:
        """
        Mark a practice session as completed.
        
        Args:
            session_id: ID of the practice session
            audio_file_id: ID of the uploaded audio file
            recording_duration_ms: Total duration of audio recording in milliseconds
            total_items: Total number of items in the session
            completed_items: Number of items successfully completed
            
        Returns:
            Updated practice session
            
        Raises:
            PracticeSessionNotFoundError: If session doesn't exist
            SessionAlreadyCompletedError: If session is already completed
            SessionAlreadyAbandonedError: If session was abandoned
        """
        session = await self.get_session_by_id(session_id)
        
        # Validate session state
        self._ensure_session_modifiable(session)
        
        # Update session data
        now = datetime.now(timezone.utc)
        session.status = SessionStatus.COMPLETED
        session.completed_at = now
        
        if audio_file_id is not None and recording_duration_ms is not None:
            session.attach_audio_file(audio_file_id, recording_duration_ms)
        elif audio_file_id is not None:
            session.session_audio_file_id = audio_file_id
        elif recording_duration_ms is not None:
            session.recording_duration_ms = recording_duration_ms
            
        if total_items is not None:
            session.total_items = total_items
        if completed_items is not None:
            session.completed_items = completed_items
        
        session.updated_at = now
        
        return await self._repo.update(session)

    async def abandon_session(self, session_id: UUID) -> PracticeSession:
        """
        Mark a practice session as abandoned.
        
        Args:
            session_id: ID of the practice session
            
        Returns:
            Updated practice session
            
        Raises:
            PracticeSessionNotFoundError: If session doesn't exist
            SessionAlreadyCompletedError: If session is already completed
        """
        session = await self.get_session_by_id(session_id)
        
        # Can't abandon a completed session
        if session.status == SessionStatus.COMPLETED:
            raise SessionAlreadyCompletedError(str(session_id))
        
        # Update status
        session.status = SessionStatus.ABANDONED
        session.updated_at = datetime.now(timezone.utc)
        
        return await self._repo.update(session)

    # ==================== Session Retrieval ====================

    async def get_session_by_id(self, session_id: UUID) -> PracticeSession:
        """
        Get a practice session by ID.
        
        Args:
            session_id: ID of the practice session
            
        Returns:
            Practice session
            
        Raises:
            PracticeSessionNotFoundError: If session doesn't exist
        """
        session = await self._repo.get_by_id(session_id)
        if not session:
            raise PracticeSessionNotFoundError(session_id)
        return session

    async def get_all_sessions(
        self,
        status: SessionStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[PracticeSession]:
        """
        Get all practice sessions.
        
        Args:
            status: Optional status filter
            limit: Maximum number of sessions to return
            offset: Number of sessions to skip
            
        Returns:
            List of practice sessions
        """
        return await self._repo.find_all(
            status=status,
            limit=limit,
            offset=offset,
        )

    async def get_user_sessions(
        self,
        user_id: UUID,
        status: SessionStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[PracticeSession]:
        """
        Get practice sessions for a user.
        
        Args:
            user_id: ID of the user
            status: Optional status filter
            limit: Maximum number of sessions to return
            offset: Number of sessions to skip
            
        Returns:
            List of practice sessions
        """
        return await self._repo.find_by_user(
            user_id=user_id,
            status=status,
            limit=limit,
            offset=offset,
        )

    async def get_exercise_sessions(
        self,
        exercise_id: UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> list[PracticeSession]:
        """
        Get practice sessions for an exercise.
        
        Args:
            exercise_id: ID of the exercise
            limit: Maximum number of sessions to return
            offset: Number of sessions to skip
            
        Returns:
            List of practice sessions
        """
        return await self._repo.find_by_exercise(
            exercise_id=exercise_id,
            limit=limit,
            offset=offset,
        )

    async def count_all_sessions(
        self,
        status: SessionStatus | None = None,
    ) -> int:
        """
        Count all practice sessions.
        
        Args:
            status: Optional status filter
            
        Returns:
            Number of matching sessions
        """
        return await self._repo.count_all(status=status)

    async def count_user_sessions(
        self,
        user_id: UUID,
        status: SessionStatus | None = None,
    ) -> int:
        """
        Count practice sessions for a user.
        
        Args:
            user_id: ID of the user
            status: Optional status filter
            
        Returns:
            Number of matching sessions
        """
        return await self._repo.count_by_user(user_id=user_id, status=status)

    # ==================== Session Updates ====================

    async def update_session_metrics(
        self,
        session_id: UUID,
        total_items: int | None = None,
        completed_items: int | None = None,
    ) -> PracticeSession:
        """
        Update session metrics (items total and completed).
        
        Args:
            session_id: ID of the practice session
            total_items: Total number of items
            completed_items: Number of items completed
            
        Returns:
            Updated practice session
            
        Raises:
            PracticeSessionNotFoundError: If session doesn't exist
            SessionAlreadyCompletedError: If session is already completed
            SessionAlreadyAbandonedError: If session was abandoned
        """
        session = await self.get_session_by_id(session_id)
        
        # Validate session state
        self._ensure_session_modifiable(session)
        
        # Update metrics
        if total_items is not None:
            session.total_items = total_items
        if completed_items is not None:
            session.completed_items = completed_items
        
        session.updated_at = datetime.now(timezone.utc)
        
        return await self._repo.update(session)

    async def attach_audio_file(
        self,
        session_id: UUID,
        audio_file_id: UUID,
        recording_duration_ms: int,
    ) -> PracticeSession:
        """
        Attach an audio file to a practice session.
        
        Args:
            session_id: ID of the practice session
            audio_file_id: ID of the audio file
            recording_duration_ms: Duration of the recording in milliseconds
            
        Returns:
            Updated practice session
            
        Raises:
            PracticeSessionNotFoundError: If session doesn't exist
            SessionAlreadyCompletedError: If session is already completed
            SessionAlreadyAbandonedError: If session was abandoned
        """
        session = await self.get_session_by_id(session_id)
        
        # Validate session state
        self._ensure_session_modifiable(session)
        
        # Update audio info
        session.session_audio_file_id = audio_file_id
        session.recording_duration_ms = recording_duration_ms
        session.updated_at = datetime.now(timezone.utc)
        
        return await self._repo.update(session)

    # ==================== Session Deletion ====================

    async def delete_session(self, session_id: UUID) -> bool:
        """
        Delete a practice session and all associated data.
        
        This includes:
        - All exercise results for the session
        - Session audio file (if exists)
        - Individual result audio files (if exist)
        - The practice session record itself
        
        Args:
            session_id: ID of the practice session
            
        Returns:
            True if deleted successfully
            
        Raises:
            PracticeSessionNotFoundError: If session doesn't exist
        """
        # Verify session exists and get its data
        session = await self.get_session_by_id(session_id)
        
        # Collect all media file IDs to delete
        media_file_ids: list[UUID] = []
        
        # Add session audio file if exists
        if session.session_audio_file_id:
            media_file_ids.append(session.session_audio_file_id)
        
        # Get all results for this session to collect their audio files
        if self._media_service:
            try:
                results = await self._result_repo.find_by_session(session_id)
                for result in results:
                    if result.audio_file_id:
                        media_file_ids.append(result.audio_file_id)
            except Exception as e:
                # Log but don't fail deletion if we can't get results
                # The database cascade will handle result deletion
                print(f"Warning: Could not fetch results for media cleanup: {e}")
        
        # Delete all media files (physical files + database records)
        if self._media_service and media_file_ids:
            try:
                deleted_count = await self._media_service.bulk_delete_files(media_file_ids)
                print(f"Deleted {deleted_count} media files for session {session_id}")
            except Exception as e:
                # Log but don't fail session deletion if media cleanup fails
                print(f"Warning: Media file cleanup failed for session {session_id}: {e}")
        
        # Delete the session (cascade will delete results)
        # Note: Media file foreign keys use SET NULL, so they won't block deletion
        return await self._repo.delete(session_id)

    # ==================== Business Rule Validation ====================

    def _ensure_session_modifiable(self, session: PracticeSession) -> None:
        """
        Ensure a session can be modified.
        
        Args:
            session: Practice session to check
            
        Raises:
            SessionAlreadyCompletedError: If session is completed
            SessionAlreadyAbandonedError: If session was abandoned
        """
        if session.status == SessionStatus.COMPLETED:
            raise SessionAlreadyCompletedError(str(session.id))
        
        if session.status == SessionStatus.ABANDONED:
            raise SessionAlreadyAbandonedError(str(session.id))
