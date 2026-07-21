"""
Unit tests for PracticeSessionService.

Tests all practice session operations including:
- Session creation and lifecycle management
- Audio recording attachment
- Session completion and abandonment
- Session retrieval and filtering
- Business rule validation
"""

import pytest
from datetime import datetime, timezone
from uuid import uuid4, UUID
from unittest.mock import AsyncMock

from src.application.services.practice_session_service import PracticeSessionService
from src.application.exceptions.not_found import PracticeSessionNotFoundError
from src.application.exceptions.business_rules import (
    SessionAlreadyCompletedError,
    SessionAlreadyAbandonedError,
)
from src.core.entities.practice_session import PracticeSession, SessionStatus
from src.core.ports.repositories.practice_session_repository import IPracticeSessionRepository


class TestPracticeSessionServiceCreate:
    """Tests for session creation."""

    @pytest.fixture
    def mock_repository(self) -> AsyncMock:
        repo = AsyncMock(spec=IPracticeSessionRepository)
        return repo

    @pytest.fixture
    def service(self, mock_repository: AsyncMock) -> PracticeSessionService:
        return PracticeSessionService(repository=mock_repository)

    @pytest.mark.asyncio
    async def test_create_session_success(
        self,
        service: PracticeSessionService,
        mock_repository: AsyncMock,
    ):
        """Should successfully create a new practice session."""
        # Arrange
        user_id = uuid4()
        exercise_id = uuid4()

        async def mock_create(session: PracticeSession) -> PracticeSession:
            return session
        mock_repository.create.side_effect = mock_create

        # Act
        session = await service.create_session(
            user_id=user_id,
            exercise_id=exercise_id,
        )

        # Assert
        assert session.user_id == user_id
        assert session.exercise_id == exercise_id
        assert session.status == SessionStatus.IN_PROGRESS
        assert session.session_audio_file_id is None
        assert session.total_items == 0
        assert session.completed_items == 0
        assert session.started_at is not None
        assert session.completed_at is None

        mock_repository.create.assert_called_once()


class TestPracticeSessionServiceRecording:
    """Tests for audio recording management."""

    @pytest.fixture
    def mock_repository(self) -> AsyncMock:
        repo = AsyncMock(spec=IPracticeSessionRepository)
        return repo

    @pytest.fixture
    def service(self, mock_repository: AsyncMock) -> PracticeSessionService:
        return PracticeSessionService(repository=mock_repository)

    @pytest.fixture
    def in_progress_session(self) -> PracticeSession:
        """Create an in-progress session for testing."""
        return PracticeSession(
            id=uuid4(),
            user_id=uuid4(),
            exercise_id=uuid4(),
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

    @pytest.mark.asyncio
    async def test_start_recording_success(
        self,
        service: PracticeSessionService,
        mock_repository: AsyncMock,
        in_progress_session: PracticeSession,
    ):
        """Should successfully start recording for a session."""
        # Arrange
        audio_file_id = uuid4()
        started_at = datetime.now(timezone.utc)
        
        mock_repository.find_by_id.return_value = in_progress_session

        async def mock_update(session: PracticeSession) -> PracticeSession:
            return session
        mock_repository.update.side_effect = mock_update

        # Act
        updated = await service.start_recording(
            session_id=in_progress_session.id,
            audio_file_id=audio_file_id,
            started_at=started_at,
        )

        # Assert
        assert updated.session_audio_file_id == audio_file_id
        assert updated.recording_started_at == started_at

        mock_repository.find_by_id.assert_called_once_with(in_progress_session.id)
        mock_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_start_recording_session_not_found(
        self,
        service: PracticeSessionService,
        mock_repository: AsyncMock,
    ):
        """Should raise PracticeSessionNotFoundError if session doesn't exist."""
        # Arrange
        session_id = uuid4()
        audio_file_id = uuid4()
        
        mock_repository.find_by_id.return_value = None

        # Act & Assert
        with pytest.raises(PracticeSessionNotFoundError):
            await service.start_recording(
                session_id=session_id,
                audio_file_id=audio_file_id,
            )

    @pytest.mark.asyncio
    async def test_start_recording_session_completed(
        self,
        service: PracticeSessionService,
        mock_repository: AsyncMock,
        in_progress_session: PracticeSession,
    ):
        """Should raise SessionAlreadyCompletedError if session is completed."""
        # Arrange
        in_progress_session.status = SessionStatus.COMPLETED
        audio_file_id = uuid4()
        
        mock_repository.find_by_id.return_value = in_progress_session

        # Act & Assert
        with pytest.raises(SessionAlreadyCompletedError):
            await service.start_recording(
                session_id=in_progress_session.id,
                audio_file_id=audio_file_id,
            )

    @pytest.mark.asyncio
    async def test_start_recording_session_abandoned(
        self,
        service: PracticeSessionService,
        mock_repository: AsyncMock,
        in_progress_session: PracticeSession,
    ):
        """Should raise SessionAlreadyAbandonedError if session is abandoned."""
        # Arrange
        in_progress_session.status = SessionStatus.ABANDONED
        audio_file_id = uuid4()
        
        mock_repository.find_by_id.return_value = in_progress_session

        # Act & Assert
        with pytest.raises(SessionAlreadyAbandonedError):
            await service.start_recording(
                session_id=in_progress_session.id,
                audio_file_id=audio_file_id,
            )


class TestPracticeSessionServiceComplete:
    """Tests for session completion."""

    @pytest.fixture
    def mock_repository(self) -> AsyncMock:
        repo = AsyncMock(spec=IPracticeSessionRepository)
        return repo

    @pytest.fixture
    def service(self, mock_repository: AsyncMock) -> PracticeSessionService:
        return PracticeSessionService(repository=mock_repository)

    @pytest.fixture
    def in_progress_session(self) -> PracticeSession:
        """Create an in-progress session for testing."""
        return PracticeSession(
            id=uuid4(),
            user_id=uuid4(),
            exercise_id=uuid4(),
            status=SessionStatus.IN_PROGRESS,
            session_audio_file_id=uuid4(),
            recording_started_at=datetime.now(timezone.utc),
            recording_duration_ms=None,
            total_items=0,
            completed_items=0,
            started_at=datetime.now(timezone.utc),
            completed_at=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

    @pytest.mark.asyncio
    async def test_complete_session_success(
        self,
        service: PracticeSessionService,
        mock_repository: AsyncMock,
        in_progress_session: PracticeSession,
    ):
        """Should successfully complete a session."""
        # Arrange
        mock_repository.find_by_id.return_value = in_progress_session

        async def mock_update(session: PracticeSession) -> PracticeSession:
            return session
        mock_repository.update.side_effect = mock_update

        # Act
        completed = await service.complete_session(
            session_id=in_progress_session.id,
            recording_duration_ms=60000,
            total_items=5,
            completed_items=4,
        )

        # Assert
        assert completed.status == SessionStatus.COMPLETED
        assert completed.recording_duration_ms == 60000
        assert completed.total_items == 5
        assert completed.completed_items == 4
        assert completed.completed_at is not None

        mock_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_complete_session_already_completed(
        self,
        service: PracticeSessionService,
        mock_repository: AsyncMock,
        in_progress_session: PracticeSession,
    ):
        """Should raise SessionAlreadyCompletedError if already completed."""
        # Arrange
        in_progress_session.status = SessionStatus.COMPLETED
        mock_repository.find_by_id.return_value = in_progress_session

        # Act & Assert
        with pytest.raises(SessionAlreadyCompletedError):
            await service.complete_session(
                session_id=in_progress_session.id,
                recording_duration_ms=60000,
            )


class TestPracticeSessionServiceAbandon:
    """Tests for session abandonment."""

    @pytest.fixture
    def mock_repository(self) -> AsyncMock:
        repo = AsyncMock(spec=IPracticeSessionRepository)
        return repo

    @pytest.fixture
    def service(self, mock_repository: AsyncMock) -> PracticeSessionService:
        return PracticeSessionService(repository=mock_repository)

    @pytest.fixture
    def in_progress_session(self) -> PracticeSession:
        """Create an in-progress session for testing."""
        return PracticeSession(
            id=uuid4(),
            user_id=uuid4(),
            exercise_id=uuid4(),
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

    @pytest.mark.asyncio
    async def test_abandon_session_success(
        self,
        service: PracticeSessionService,
        mock_repository: AsyncMock,
        in_progress_session: PracticeSession,
    ):
        """Should successfully abandon a session."""
        # Arrange
        mock_repository.find_by_id.return_value = in_progress_session

        async def mock_update(session: PracticeSession) -> PracticeSession:
            return session
        mock_repository.update.side_effect = mock_update

        # Act
        abandoned = await service.abandon_session(session_id=in_progress_session.id)

        # Assert
        assert abandoned.status == SessionStatus.ABANDONED

        mock_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_abandon_session_already_completed(
        self,
        service: PracticeSessionService,
        mock_repository: AsyncMock,
        in_progress_session: PracticeSession,
    ):
        """Should raise SessionAlreadyCompletedError if session is completed."""
        # Arrange
        in_progress_session.status = SessionStatus.COMPLETED
        mock_repository.find_by_id.return_value = in_progress_session

        # Act & Assert
        with pytest.raises(SessionAlreadyCompletedError):
            await service.abandon_session(session_id=in_progress_session.id)


class TestPracticeSessionServiceRetrieval:
    """Tests for session retrieval operations."""

    @pytest.fixture
    def mock_repository(self) -> AsyncMock:
        repo = AsyncMock(spec=IPracticeSessionRepository)
        return repo

    @pytest.fixture
    def service(self, mock_repository: AsyncMock) -> PracticeSessionService:
        return PracticeSessionService(repository=mock_repository)

    @pytest.mark.asyncio
    async def test_get_session_by_id_success(
        self,
        service: PracticeSessionService,
        mock_repository: AsyncMock,
    ):
        """Should successfully get a session by ID."""
        # Arrange
        session_id = uuid4()
        expected_session = PracticeSession(
            id=session_id,
            user_id=uuid4(),
            exercise_id=uuid4(),
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
        
        mock_repository.find_by_id.return_value = expected_session

        # Act
        session = await service.get_session_by_id(session_id)

        # Assert
        assert session == expected_session
        mock_repository.find_by_id.assert_called_once_with(session_id)

    @pytest.mark.asyncio
    async def test_get_session_by_id_not_found(
        self,
        service: PracticeSessionService,
        mock_repository: AsyncMock,
    ):
        """Should raise PracticeSessionNotFoundError if session doesn't exist."""
        # Arrange
        session_id = uuid4()
        mock_repository.find_by_id.return_value = None

        # Act & Assert
        with pytest.raises(PracticeSessionNotFoundError):
            await service.get_session_by_id(session_id)

    @pytest.mark.asyncio
    async def test_get_user_sessions(
        self,
        service: PracticeSessionService,
        mock_repository: AsyncMock,
    ):
        """Should get sessions for a user."""
        # Arrange
        user_id = uuid4()
        expected_sessions = [
            PracticeSession(
                id=uuid4(),
                user_id=user_id,
                exercise_id=uuid4(),
                status=SessionStatus.COMPLETED,
                session_audio_file_id=None,
                recording_started_at=None,
                recording_duration_ms=None,
                total_items=5,
                completed_items=5,
                started_at=datetime.now(timezone.utc),
                completed_at=datetime.now(timezone.utc),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
        ]
        
        mock_repository.find_by_user.return_value = expected_sessions

        # Act
        sessions = await service.get_user_sessions(
            user_id=user_id,
            status=SessionStatus.COMPLETED,
            limit=10,
            offset=0,
        )

        # Assert
        assert sessions == expected_sessions
        mock_repository.find_by_user.assert_called_once_with(
            user_id=user_id,
            status=SessionStatus.COMPLETED,
            limit=10,
            offset=0,
        )

    @pytest.mark.asyncio
    async def test_count_user_sessions(
        self,
        service: PracticeSessionService,
        mock_repository: AsyncMock,
    ):
        """Should count sessions for a user."""
        # Arrange
        user_id = uuid4()
        expected_count = 15
        
        mock_repository.count_by_user.return_value = expected_count

        # Act
        count = await service.count_user_sessions(
            user_id=user_id,
            status=SessionStatus.COMPLETED,
        )

        # Assert
        assert count == expected_count
        mock_repository.count_by_user.assert_called_once_with(
            user_id=user_id,
            status=SessionStatus.COMPLETED,
        )


class TestPracticeSessionServiceUpdate:
    """Tests for session update operations."""

    @pytest.fixture
    def mock_repository(self) -> AsyncMock:
        repo = AsyncMock(spec=IPracticeSessionRepository)
        return repo

    @pytest.fixture
    def service(self, mock_repository: AsyncMock) -> PracticeSessionService:
        return PracticeSessionService(repository=mock_repository)

    @pytest.fixture
    def in_progress_session(self) -> PracticeSession:
        """Create an in-progress session for testing."""
        return PracticeSession(
            id=uuid4(),
            user_id=uuid4(),
            exercise_id=uuid4(),
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

    @pytest.mark.asyncio
    async def test_update_session_metrics_success(
        self,
        service: PracticeSessionService,
        mock_repository: AsyncMock,
        in_progress_session: PracticeSession,
    ):
        """Should successfully update session metrics."""
        # Arrange
        mock_repository.find_by_id.return_value = in_progress_session

        async def mock_update(session: PracticeSession) -> PracticeSession:
            return session
        mock_repository.update.side_effect = mock_update

        # Act
        updated = await service.update_session_metrics(
            session_id=in_progress_session.id,
            total_items=3,
            completed_items=2,
        )

        # Assert
        assert updated.total_items == 3
        assert updated.completed_items == 2

        mock_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_attach_audio_file_success(
        self,
        service: PracticeSessionService,
        mock_repository: AsyncMock,
        in_progress_session: PracticeSession,
    ):
        """Should successfully attach audio file to session."""
        # Arrange
        audio_file_id = uuid4()
        recording_duration_ms = 120000
        
        mock_repository.find_by_id.return_value = in_progress_session

        async def mock_update(session: PracticeSession) -> PracticeSession:
            return session
        mock_repository.update.side_effect = mock_update

        # Act
        updated = await service.attach_audio_file(
            session_id=in_progress_session.id,
            audio_file_id=audio_file_id,
            recording_duration_ms=recording_duration_ms,
        )

        # Assert
        assert updated.session_audio_file_id == audio_file_id
        assert updated.recording_duration_ms == recording_duration_ms

        mock_repository.update.assert_called_once()


class TestPracticeSessionServiceDelete:
    """Tests for session deletion."""

    @pytest.fixture
    def mock_repository(self) -> AsyncMock:
        repo = AsyncMock(spec=IPracticeSessionRepository)
        return repo

    @pytest.fixture
    def service(self, mock_repository: AsyncMock) -> PracticeSessionService:
        return PracticeSessionService(repository=mock_repository)

    @pytest.mark.asyncio
    async def test_delete_session_success(
        self,
        service: PracticeSessionService,
        mock_repository: AsyncMock,
    ):
        """Should successfully delete a session."""
        # Arrange
        session_id = uuid4()
        session = PracticeSession(
            id=session_id,
            user_id=uuid4(),
            exercise_id=uuid4(),
            status=SessionStatus.ABANDONED,
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
        
        mock_repository.find_by_id.return_value = session
        mock_repository.delete.return_value = True

        # Act
        result = await service.delete_session(session_id)

        # Assert
        assert result is True
        mock_repository.find_by_id.assert_called_once_with(session_id)
        mock_repository.delete.assert_called_once_with(session_id)

    @pytest.mark.asyncio
    async def test_delete_session_not_found(
        self,
        service: PracticeSessionService,
        mock_repository: AsyncMock,
    ):
        """Should raise PracticeSessionNotFoundError if session doesn't exist."""
        # Arrange
        session_id = uuid4()
        mock_repository.find_by_id.return_value = None

        # Act & Assert
        with pytest.raises(PracticeSessionNotFoundError):
            await service.delete_session(session_id)
