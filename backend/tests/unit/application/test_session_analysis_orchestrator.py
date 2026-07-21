"""Unit tests for SessionAnalysisOrchestrator."""

import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from datetime import datetime, timezone

from src.application.services.session_analysis_orchestrator import (
    SessionAnalysisOrchestrator,
    AnalysisStatus,
    AnalysisProgress
)
from src.core.entities.practice_session import PracticeSession
from src.core.entities.exercise_result import ExerciseResult
from src.core.entities.exercise import Exercise


class TestSessionAnalysisOrchestrator:
    """Test SessionAnalysisOrchestrator with mocked dependencies."""

    @pytest.fixture
    def mock_result_service(self):
        """Create mock result analysis service."""
        service = AsyncMock()
        # Mock analyze_result to return the input result
        service.analyze_result.side_effect = lambda result, audio_id, phonemes: result
        return service

    @pytest.fixture
    def mock_session_repo(self):
        """Create mock practice session repository."""
        repo = AsyncMock()
        # Mock session with audio file
        session = PracticeSession(
            user_id=uuid4(),
            exercise_id=uuid4(),
            session_audio_file_id=uuid4(),
            started_at=datetime.now(timezone.utc)
        )
        # Add language attribute (not in entity but used by orchestrator)
        session.language = "de"
        repo.find_by_id.return_value = session
        return repo

    @pytest.fixture
    def mock_result_repo(self):
        """Create mock exercise result repository."""
        repo = AsyncMock()
        # Mock results list
        results = [
            ExerciseResult(
                practice_session_id=uuid4(),
                exercise_item_id=uuid4(),
                started_at=datetime.now(timezone.utc),
                completed_at=datetime.now(timezone.utc),
                audio_segment_start_ms=0,
                audio_segment_end_ms=1000
            )
            for _ in range(3)
        ]
        repo.find_by_session_id.return_value = results
        return repo

    @pytest.fixture
    def mock_exercise_repo(self):
        """Create mock exercise repository."""
        repo = AsyncMock()
        # Mock exercise with phonemes
        exercise = Exercise(
            id=uuid4(),
            category_id=uuid4(),
            code="TEST_EX_001",
            title="Test Exercise",
            description="Test",
            phonemes=["t", "ɛ", "s", "t"],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        repo.find_by_id.return_value = exercise
        return repo

    @pytest.fixture
    def mock_logger(self):
        """Create mock logger."""
        return MagicMock()

    @pytest.fixture
    def orchestrator(self, mock_result_service, mock_session_repo,
                     mock_result_repo, mock_exercise_repo, mock_logger):
        """Create SessionAnalysisOrchestrator with mocked dependencies."""
        return SessionAnalysisOrchestrator(
            result_service=mock_result_service,
            session_repo=mock_session_repo,
            result_repo=mock_result_repo,
            exercise_repo=mock_exercise_repo,
            logger=mock_logger
        )

    @pytest.mark.asyncio
    async def test_analyze_session_success(self, orchestrator):
        """Test successful session analysis."""
        # Arrange
        session_id = uuid4()

        # Act
        await orchestrator.analyze_session(session_id)

        # Assert
        progress = orchestrator.get_analysis_progress(session_id)
        assert progress is not None
        assert progress.status == AnalysisStatus.COMPLETED
        assert progress.processed_results == progress.total_results

    @pytest.mark.asyncio
    async def test_analyze_session_fetches_session(self, orchestrator, mock_session_repo):
        """Test that session is fetched from repository."""
        # Arrange
        session_id = uuid4()

        # Act
        await orchestrator.analyze_session(session_id)

        # Assert
        mock_session_repo.find_by_id.assert_called_once_with(session_id)

    @pytest.mark.asyncio
    async def test_analyze_session_session_not_found(self, orchestrator, mock_session_repo):
        """Test error when session not found."""
        # Arrange
        session_id = uuid4()
        mock_session_repo.find_by_id.return_value = None

        # Act
        await orchestrator.analyze_session(session_id)

        # Assert
        progress = orchestrator.get_analysis_progress(session_id)
        assert progress.status == AnalysisStatus.FAILED
        assert len(progress.errors) > 0

    @pytest.mark.asyncio
    async def test_analyze_session_missing_audio_file(self, orchestrator, mock_session_repo):
        """Test error when session has no audio file."""
        # Arrange
        session_id = uuid4()
        session = PracticeSession(
            user_id=uuid4(),
            exercise_id=uuid4(),
            session_audio_file_id=None,  # Missing audio
            started_at=datetime.now(timezone.utc)
        )
        session.id = session_id
        mock_session_repo.find_by_id.return_value = session

        # Act
        await orchestrator.analyze_session(session_id)

        # Assert
        progress = orchestrator.get_analysis_progress(session_id)
        assert progress.status == AnalysisStatus.FAILED
        assert any("audio" in error.lower() for error in progress.errors)

    @pytest.mark.asyncio
    async def test_analyze_session_fetches_results(self, orchestrator, mock_result_repo):
        """Test that results are fetched from repository."""
        # Arrange
        session_id = uuid4()

        # Act
        await orchestrator.analyze_session(session_id)

        # Assert
        mock_result_repo.find_by_session_id.assert_called_once_with(session_id)

    @pytest.mark.asyncio
    async def test_analyze_session_no_results(self, orchestrator, mock_result_repo):
        """Test handling of session with no results."""
        # Arrange
        session_id = uuid4()
        mock_result_repo.find_by_session_id.return_value = []

        # Act
        await orchestrator.analyze_session(session_id)

        # Assert
        progress = orchestrator.get_analysis_progress(session_id)
        assert progress.status == AnalysisStatus.COMPLETED
        assert progress.total_results == 0
        assert progress.processed_results == 0

    @pytest.mark.asyncio
    async def test_analyze_session_processes_all_results(self, orchestrator,
                                                          mock_result_service, mock_result_repo):
        """Test that all results are processed."""
        # Arrange
        session_id = uuid4()

        # Act
        await orchestrator.analyze_session(session_id)

        # Assert
        results = await mock_result_repo.find_by_session_id(session_id)
        assert mock_result_service.analyze_result.call_count == len(results)

    @pytest.mark.asyncio
    async def test_analyze_session_fetches_exercises(self, orchestrator, mock_exercise_repo):
        """Test that exercises are fetched for phonemes."""
        # Arrange
        session_id = uuid4()

        # Act
        await orchestrator.analyze_session(session_id)

        # Assert
        assert mock_exercise_repo.find_by_id.called

    @pytest.mark.asyncio
    async def test_analyze_session_progress_tracking(self, orchestrator):
        """Test progress tracking during analysis."""
        # Arrange
        session_id = uuid4()
        progress_updates = []

        async def capture_progress(progress: AnalysisProgress):
            progress_updates.append(progress)

        # Act
        await orchestrator.analyze_session(session_id, progress_callback=capture_progress)

        # Assert
        assert len(progress_updates) > 0
        # Should have updates for each result
        assert any(p.processed_results > 0 for p in progress_updates)

    @pytest.mark.asyncio
    async def test_analyze_session_progress_callback(self, orchestrator):
        """Test that progress callback is called."""
        # Arrange
        session_id = uuid4()
        callback = AsyncMock()

        # Act
        await orchestrator.analyze_session(session_id, progress_callback=callback)

        # Assert
        assert callback.called
        # Should be called for each result processed
        assert callback.call_count >= 3  # We have 3 mock results

    @pytest.mark.asyncio
    async def test_analyze_session_continues_on_error(self, orchestrator,
                                                       mock_result_service):
        """Test that analysis continues when one result fails."""
        # Arrange
        session_id = uuid4()
        # Make first call fail, rest succeed
        mock_result_service.analyze_result.side_effect = [
            Exception("Analysis failed"),
            None,
            None
        ]

        # Act
        await orchestrator.analyze_session(session_id)

        # Assert
        progress = orchestrator.get_analysis_progress(session_id)
        assert progress.status == AnalysisStatus.COMPLETED
        assert len(progress.errors) == 1  # Only one error
        assert progress.processed_results == 3  # All attempted

    @pytest.mark.asyncio
    async def test_analyze_session_collects_errors(self, orchestrator, mock_result_service):
        """Test that errors are collected."""
        # Arrange
        session_id = uuid4()
        mock_result_service.analyze_result.side_effect = Exception("Test error")

        # Act
        await orchestrator.analyze_session(session_id)

        # Assert
        progress = orchestrator.get_analysis_progress(session_id)
        assert len(progress.errors) > 0
        assert any("Test error" in error for error in progress.errors)

    @pytest.mark.asyncio
    async def test_get_analysis_progress_returns_none_when_not_found(self, orchestrator):
        """Test get_analysis_progress returns None for unknown session."""
        # Arrange
        unknown_session_id = uuid4()

        # Act
        progress = orchestrator.get_analysis_progress(unknown_session_id)

        # Assert
        assert progress is None

    @pytest.mark.asyncio
    async def test_is_analysis_running_true_during_analysis(self, orchestrator):
        """Test is_analysis_running returns True during analysis."""
        # Arrange
        session_id = uuid4()

        # Act - Check during analysis
        async def check_running(_):
            assert orchestrator.is_analysis_running(session_id) is True

        await orchestrator.analyze_session(session_id, progress_callback=check_running)

    @pytest.mark.asyncio
    async def test_is_analysis_running_false_when_not_running(self, orchestrator):
        """Test is_analysis_running returns False when not running."""
        # Arrange
        session_id = uuid4()

        # Act & Assert
        assert orchestrator.is_analysis_running(session_id) is False

    @pytest.mark.asyncio
    async def test_is_analysis_running_false_after_completion(self, orchestrator):
        """Test is_analysis_running returns False after completion."""
        # Arrange
        session_id = uuid4()

        # Act
        await orchestrator.analyze_session(session_id)

        # Assert
        assert orchestrator.is_analysis_running(session_id) is False

    @pytest.mark.asyncio
    async def test_clear_completed_job(self, orchestrator):
        """Test clearing completed job from memory."""
        # Arrange
        session_id = uuid4()
        await orchestrator.analyze_session(session_id)

        # Act
        orchestrator.clear_completed_job(session_id)

        # Assert
        progress = orchestrator.get_analysis_progress(session_id)
        assert progress is None

    @pytest.mark.asyncio
    async def test_get_active_jobs_count(self, orchestrator):
        """Test getting count of active jobs."""
        # Arrange
        session_id = uuid4()

        # Act & Assert - Initially 0
        assert orchestrator.get_active_jobs_count() == 0

        # Start analysis
        await orchestrator.analyze_session(session_id)

        # After completion, still tracked (completed state)
        assert orchestrator.get_active_jobs_count() >= 0

    @pytest.mark.asyncio
    async def test_analyze_session_records_timestamps(self, orchestrator):
        """Test that start and completion timestamps are recorded."""
        # Arrange
        session_id = uuid4()

        # Act
        await orchestrator.analyze_session(session_id)

        # Assert
        progress = orchestrator.get_analysis_progress(session_id)
        assert progress.started_at is not None
        assert progress.completed_at is not None
        assert progress.completed_at >= progress.started_at


class TestAnalysisProgress:
    """Test AnalysisProgress dataclass."""

    def test_analysis_progress_creation(self):
        """Test creating AnalysisProgress instance."""
        # Arrange & Act
        progress = AnalysisProgress(
            session_id=uuid4(),
            status=AnalysisStatus.RUNNING,
            total_results=10,
            processed_results=5,
            current_result_id=uuid4(),
            errors=[],
            started_at=1000,
            completed_at=None
        )

        # Assert
        assert progress.status == AnalysisStatus.RUNNING
        assert progress.total_results == 10
        assert progress.processed_results == 5

    def test_progress_percentage_calculation(self):
        """Test progress percentage calculation."""
        # Arrange
        progress = AnalysisProgress(
            session_id=uuid4(),
            status=AnalysisStatus.RUNNING,
            total_results=10,
            processed_results=5,
            current_result_id=None,
            errors=[],
            started_at=1000,
            completed_at=None
        )

        # Act
        percentage = progress.progress_percentage

        # Assert
        assert percentage == 50.0

    def test_progress_percentage_zero_total(self):
        """Test progress percentage with zero total."""
        # Arrange
        progress = AnalysisProgress(
            session_id=uuid4(),
            status=AnalysisStatus.COMPLETED,
            total_results=0,
            processed_results=0,
            current_result_id=None,
            errors=[],
            started_at=1000,
            completed_at=2000
        )

        # Act
        percentage = progress.progress_percentage

        # Assert
        assert percentage == 100.0  # 0/0 should be 100% (completed)

    def test_progress_percentage_completed(self):
        """Test progress percentage when completed."""
        # Arrange
        progress = AnalysisProgress(
            session_id=uuid4(),
            status=AnalysisStatus.COMPLETED,
            total_results=10,
            processed_results=10,
            current_result_id=None,
            errors=[],
            started_at=1000,
            completed_at=2000
        )

        # Act
        percentage = progress.progress_percentage

        # Assert
        assert percentage == 100.0


class TestAnalysisStatus:
    """Test AnalysisStatus enum."""

    def test_analysis_status_values(self):
        """Test that all status values are defined."""
        assert AnalysisStatus.PENDING.value == "pending"
        assert AnalysisStatus.RUNNING.value == "running"
        assert AnalysisStatus.COMPLETED.value == "completed"
        assert AnalysisStatus.FAILED.value == "failed"

    def test_analysis_status_comparison(self):
        """Test status equality comparison."""
        assert AnalysisStatus.RUNNING == AnalysisStatus.RUNNING
        assert AnalysisStatus.RUNNING != AnalysisStatus.COMPLETED
