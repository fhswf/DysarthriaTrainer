"""
Unit tests for ExerciseResultService.

Tests all exercise result operations including:
- Result creation with iteration support
- Audio segment attachment
- Transcription and analysis updates
- Evaluation results
- Processing status management
- Business rule validation
"""

import pytest
from datetime import datetime, timezone
from uuid import uuid4, UUID
from unittest.mock import AsyncMock

from src.application.services.exercise_result_service import ExerciseResultService
from src.application.exceptions.not_found import ExerciseResultNotFoundError
from src.application.exceptions.business_rules import (
    AudioSegmentOutOfBoundsError,
    InvalidIterationNumberError,
)
from src.core.entities.exercise_result import (
    ExerciseResult,
    PhonemeAnalysis,
    AudioQualityMetrics,
    EvaluationScores,
    ProcessingStatus,
)
from src.core.ports.repositories.exercise_result_repository import IExerciseResultRepository


class TestExerciseResultServiceCreate:
    """Tests for result creation."""

    @pytest.fixture
    def mock_repository(self) -> AsyncMock:
        repo = AsyncMock(spec=IExerciseResultRepository)
        return repo

    @pytest.fixture
    def service(self, mock_repository: AsyncMock) -> ExerciseResultService:
        return ExerciseResultService(repository=mock_repository)

    @pytest.mark.asyncio
    async def test_create_result_success(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
    ):
        """Should successfully create a new exercise result."""
        # Arrange
        practice_session_id = uuid4()
        exercise_item_id = uuid4()

        async def mock_create(result: ExerciseResult) -> ExerciseResult:
            return result
        mock_repository.create.side_effect = mock_create

        # Act
        result = await service.create_result(
            practice_session_id=practice_session_id,
            exercise_item_id=exercise_item_id,
            iteration_number=1,
        )

        # Assert
        assert result.practice_session_id == practice_session_id
        assert result.exercise_item_id == exercise_item_id
        assert result.iteration_number == 1
        assert result.processing_status == ProcessingStatus.PENDING
        assert result.audio_segment_start_ms is None
        assert result.transcription is None

        mock_repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_result_invalid_iteration(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
    ):
        """Should raise InvalidIterationNumberError for invalid iteration."""
        # Arrange
        practice_session_id = uuid4()
        exercise_item_id = uuid4()

        # Act & Assert
        with pytest.raises(InvalidIterationNumberError):
            await service.create_result(
                practice_session_id=practice_session_id,
                exercise_item_id=exercise_item_id,
                iteration_number=0,
            )

    @pytest.mark.asyncio
    async def test_create_result_negative_iteration(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
    ):
        """Should raise InvalidIterationNumberError for negative iteration."""
        # Arrange
        practice_session_id = uuid4()
        exercise_item_id = uuid4()

        # Act & Assert
        with pytest.raises(InvalidIterationNumberError):
            await service.create_result(
                practice_session_id=practice_session_id,
                exercise_item_id=exercise_item_id,
                iteration_number=-1,
            )


class TestExerciseResultServiceAudioSegment:
    """Tests for audio segment management."""

    @pytest.fixture
    def mock_repository(self) -> AsyncMock:
        repo = AsyncMock(spec=IExerciseResultRepository)
        return repo

    @pytest.fixture
    def service(self, mock_repository: AsyncMock) -> ExerciseResultService:
        return ExerciseResultService(repository=mock_repository)

    @pytest.fixture
    def pending_result(self) -> ExerciseResult:
        """Create a pending result for testing."""
        return ExerciseResult(
            id=uuid4(),
            practice_session_id=uuid4(),
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            exercise_item_id=uuid4(),
            iteration_number=1,
            audio_segment_start_ms=None,
            audio_segment_end_ms=None,
            audio_duration_ms=None,
            audio_file_id=None,
            transcription=None,
            transcription_confidence=None,
            phoneme_analysis=None,
            audio_quality_metrics=None,
            evaluation_results=None,
            processing_status=ProcessingStatus.PENDING,
            processing_error=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

    @pytest.mark.asyncio
    async def test_attach_audio_segment_success(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
        pending_result: ExerciseResult,
    ):
        """Should successfully attach audio segment timestamps."""
        # Arrange
        audio_file_id = uuid4()
        start_ms = 1000
        end_ms = 5000
        
        mock_repository.find_by_id.return_value = pending_result

        async def mock_update(result: ExerciseResult) -> ExerciseResult:
            return result
        mock_repository.update.side_effect = mock_update

        # Act
        updated = await service.attach_audio_segment(
            result_id=pending_result.id,
            start_ms=start_ms,
            end_ms=end_ms,
            audio_file_id=audio_file_id,
        )

        # Assert
        assert updated.audio_segment_start_ms == start_ms
        assert updated.audio_segment_end_ms == end_ms
        assert updated.audio_duration_ms == 4000
        assert updated.audio_file_id == audio_file_id

        mock_repository.find_by_id.assert_called_once_with(pending_result.id)
        mock_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_attach_audio_segment_invalid_timestamps(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
        pending_result: ExerciseResult,
    ):
        """Should raise AudioSegmentOutOfBoundsError for invalid timestamps."""
        # Arrange
        mock_repository.find_by_id.return_value = pending_result

        # Act & Assert - start >= end
        with pytest.raises(AudioSegmentOutOfBoundsError):
            await service.attach_audio_segment(
                result_id=pending_result.id,
                start_ms=5000,
                end_ms=5000,
            )

    @pytest.mark.asyncio
    async def test_attach_audio_segment_negative_start(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
        pending_result: ExerciseResult,
    ):
        """Should raise AudioSegmentOutOfBoundsError for negative start."""
        # Arrange
        mock_repository.find_by_id.return_value = pending_result

        # Act & Assert
        with pytest.raises(AudioSegmentOutOfBoundsError):
            await service.attach_audio_segment(
                result_id=pending_result.id,
                start_ms=-1000,
                end_ms=5000,
            )


class TestExerciseResultServiceTranscription:
    """Tests for transcription management."""

    @pytest.fixture
    def mock_repository(self) -> AsyncMock:
        repo = AsyncMock(spec=IExerciseResultRepository)
        return repo

    @pytest.fixture
    def service(self, mock_repository: AsyncMock) -> ExerciseResultService:
        return ExerciseResultService(repository=mock_repository)

    @pytest.fixture
    def pending_result(self) -> ExerciseResult:
        """Create a pending result for testing."""
        return ExerciseResult(
            id=uuid4(),
            practice_session_id=uuid4(),
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            exercise_item_id=uuid4(),
            iteration_number=1,
            audio_segment_start_ms=1000,
            audio_segment_end_ms=5000,
            audio_duration_ms=4000,
            audio_file_id=uuid4(),
            transcription=None,
            transcription_confidence=None,
            phoneme_analysis=None,
            audio_quality_metrics=None,
            evaluation_results=None,
            processing_status=ProcessingStatus.PENDING,
            processing_error=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

    @pytest.mark.asyncio
    async def test_set_transcription_success(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
        pending_result: ExerciseResult,
    ):
        """Should successfully set transcription."""
        # Arrange
        transcription = "Hello world"
        confidence = 0.95
        
        mock_repository.find_by_id.return_value = pending_result

        async def mock_update(result: ExerciseResult) -> ExerciseResult:
            return result
        mock_repository.update.side_effect = mock_update

        # Act
        updated = await service.set_transcription(
            result_id=pending_result.id,
            transcription_text=transcription,
            confidence=confidence,
        )

        # Assert
        assert updated.transcription == transcription
        assert updated.transcription_confidence == confidence

        mock_repository.update.assert_called_once()


class TestExerciseResultServiceAnalysis:
    """Tests for analysis management (phoneme, audio quality, evaluation)."""

    @pytest.fixture
    def mock_repository(self) -> AsyncMock:
        repo = AsyncMock(spec=IExerciseResultRepository)
        return repo

    @pytest.fixture
    def service(self, mock_repository: AsyncMock) -> ExerciseResultService:
        return ExerciseResultService(repository=mock_repository)

    @pytest.fixture
    def pending_result(self) -> ExerciseResult:
        """Create a pending result for testing."""
        return ExerciseResult(
            id=uuid4(),
            practice_session_id=uuid4(),
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            exercise_item_id=uuid4(),
            iteration_number=1,
            audio_segment_start_ms=1000,
            audio_segment_end_ms=5000,
            audio_duration_ms=4000,
            audio_file_id=uuid4(),
            transcription="Hello",
            transcription_confidence=0.9,
            phoneme_analysis=None,
            audio_quality_metrics=None,
            evaluation_results=None,
            processing_status=ProcessingStatus.PROCESSING,
            processing_error=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

    @pytest.mark.asyncio
    async def test_set_phoneme_analysis_success(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
        pending_result: ExerciseResult,
    ):
        """Should successfully set phoneme analysis."""
        # Arrange
        detected_phonemes = [
            {"phoneme": "h", "accuracy": 0.95},
            {"phoneme": "ɛ", "accuracy": 0.85},
            {"phoneme": "l", "accuracy": 0.90},
            {"phoneme": "oʊ", "accuracy": 0.88},
        ]
        phoneme_accuracy = 0.895
        common_errors = ["Slightly weak 'ɛ' sound"]
        ipa_transcription = "hɛloʊ"
        expected_ipa = "hɛloʊ"
        
        mock_repository.find_by_id.return_value = pending_result

        async def mock_update(result: ExerciseResult) -> ExerciseResult:
            return result
        mock_repository.update.side_effect = mock_update

        # Act
        updated = await service.set_phoneme_analysis(
            result_id=pending_result.id,
            detected_phonemes=detected_phonemes,
            phoneme_accuracy=phoneme_accuracy,
            common_errors=common_errors,
            ipa_transcription=ipa_transcription,
            expected_ipa=expected_ipa,
        )

        # Assert
        assert updated.phoneme_analysis is not None
        assert updated.phoneme_analysis.detected_phonemes == detected_phonemes
        assert updated.phoneme_analysis.phoneme_accuracy == phoneme_accuracy
        assert updated.phoneme_analysis.common_errors == common_errors
        assert updated.phoneme_analysis.ipa_transcription == ipa_transcription
        assert updated.phoneme_analysis.expected_ipa == expected_ipa

        mock_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_set_audio_quality_metrics_success(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
        pending_result: ExerciseResult,
    ):
        """Should successfully set audio quality metrics."""
        # Arrange
        snr_db = 25.5
        rms_energy = 0.92
        clipping_detected = False
        spectral_flatness = 0.15
        quality_level = "good"
        is_suitable_for_therapy = True
        warnings = ["Minor background noise detected"]
        
        mock_repository.find_by_id.return_value = pending_result

        async def mock_update(result: ExerciseResult) -> ExerciseResult:
            return result
        mock_repository.update.side_effect = mock_update

        # Act
        updated = await service.set_audio_quality_metrics(
            result_id=pending_result.id,
            snr_db=snr_db,
            rms_energy=rms_energy,
            clipping_detected=clipping_detected,
            spectral_flatness=spectral_flatness,
            quality_level=quality_level,
            is_suitable_for_therapy=is_suitable_for_therapy,
            warnings=warnings,
        )

        # Assert
        assert updated.audio_quality_metrics is not None
        assert updated.audio_quality_metrics.snr_db == snr_db
        assert updated.audio_quality_metrics.rms_energy == rms_energy
        assert updated.audio_quality_metrics.clipping_detected == clipping_detected
        assert updated.audio_quality_metrics.spectral_flatness == spectral_flatness
        assert updated.audio_quality_metrics.quality_level == quality_level
        assert updated.audio_quality_metrics.is_suitable_for_therapy == is_suitable_for_therapy
        assert updated.audio_quality_metrics.warnings == warnings

        mock_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_set_evaluation_results_success(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
        pending_result: ExerciseResult,
    ):
        """Should successfully set evaluation results."""
        # Arrange
        accuracy_score = 88.0
        pronunciation_score = 90.0
        fluency_score = 85.0
        overall_score = 87.7
        
        mock_repository.find_by_id.return_value = pending_result

        async def mock_update(result: ExerciseResult) -> ExerciseResult:
            return result
        mock_repository.update.side_effect = mock_update

        # Act
        updated = await service.set_evaluation_results(
            result_id=pending_result.id,
            accuracy_score=accuracy_score,
            pronunciation_score=pronunciation_score,
            fluency_score=fluency_score,
            overall_score=overall_score,
        )

        # Assert
        assert updated.evaluation_results is not None
        # evaluation_results is stored as a dict
        assert updated.evaluation_results["accuracy_score"] == accuracy_score
        assert updated.evaluation_results["pronunciation_score"] == pronunciation_score
        assert updated.evaluation_results["fluency_score"] == fluency_score
        assert updated.evaluation_results["overall_score"] == overall_score

        mock_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_result_with_full_analysis(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
        pending_result: ExerciseResult,
    ):
        """Should successfully update result with full analysis."""
        # Arrange
        transcription = "Hello world"
        confidence = 0.95
        
        phoneme_analysis = PhonemeAnalysis(
            detected_phonemes=[
                {"phoneme": "h", "accuracy": 0.9},
                {"phoneme": "ɛ", "accuracy": 0.85},
                {"phoneme": "l", "accuracy": 0.92},
            ],
            phoneme_accuracy=0.89,
            common_errors=[],
            ipa_transcription="hɛloʊ",
            expected_ipa="hɛloʊ",
        )
        
        audio_quality = AudioQualityMetrics(
            snr_db=20.0,
            rms_energy=0.85,
            clipping_detected=False,
            spectral_flatness=0.1,
            quality_level="good",
            is_suitable_for_therapy=True,
            warnings=[],
        )
        
        evaluation = EvaluationScores(
            accuracy_score=90.0,
            pronunciation_score=88.0,
            fluency_score=85.0,
            overall_score=87.7,
        )
        
        mock_repository.find_by_id.return_value = pending_result

        async def mock_update(result: ExerciseResult) -> ExerciseResult:
            return result
        mock_repository.update.side_effect = mock_update

        # Act
        # Convert EvaluationScores to dict for the service method
        evaluation_dict = {
            'accuracy_score': evaluation.accuracy_score,
            'pronunciation_score': evaluation.pronunciation_score,
            'fluency_score': evaluation.fluency_score,
            'overall_score': evaluation.overall_score,
        }
        updated = await service.update_result_with_full_analysis(
            result_id=pending_result.id,
            transcription=transcription,
            transcription_confidence=confidence,
            phoneme_analysis=phoneme_analysis,
            audio_quality_metrics=audio_quality,
            evaluation_results_dict=evaluation_dict,
        )

        # Assert
        assert updated.transcription == transcription
        assert updated.transcription_confidence == confidence
        assert updated.phoneme_analysis == phoneme_analysis
        assert updated.audio_quality_metrics == audio_quality
        # evaluation_results stored as dict
        assert "accuracy_score" in updated.evaluation_results
        assert updated.evaluation_results["overall_score"] == 87.7

        mock_repository.update.assert_called_once()


class TestExerciseResultServiceProcessingStatus:
    """Tests for processing status management."""

    @pytest.fixture
    def mock_repository(self) -> AsyncMock:
        repo = AsyncMock(spec=IExerciseResultRepository)
        return repo

    @pytest.fixture
    def service(self, mock_repository: AsyncMock) -> ExerciseResultService:
        return ExerciseResultService(repository=mock_repository)

    @pytest.fixture
    def pending_result(self) -> ExerciseResult:
        """Create a pending result for testing."""
        return ExerciseResult(
            id=uuid4(),
            practice_session_id=uuid4(),
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            exercise_item_id=uuid4(),
            iteration_number=1,
            audio_segment_start_ms=1000,
            audio_segment_end_ms=5000,
            audio_duration_ms=4000,
            audio_file_id=uuid4(),
            transcription=None,
            transcription_confidence=None,
            phoneme_analysis=None,
            audio_quality_metrics=None,
            evaluation_results=None,
            processing_status=ProcessingStatus.PENDING,
            processing_error=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

    @pytest.mark.asyncio
    async def test_start_processing_success(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
        pending_result: ExerciseResult,
    ):
        """Should successfully start processing."""
        # Arrange
        mock_repository.find_by_id.return_value = pending_result

        async def mock_update(result: ExerciseResult) -> ExerciseResult:
            return result
        mock_repository.update.side_effect = mock_update

        # Act
        updated = await service.start_processing(result_id=pending_result.id)

        # Assert
        assert updated.processing_status == ProcessingStatus.PROCESSING

        mock_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_complete_processing_success(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
        pending_result: ExerciseResult,
    ):
        """Should successfully complete processing."""
        # Arrange
        pending_result.processing_status = ProcessingStatus.PROCESSING
        
        mock_repository.find_by_id.return_value = pending_result

        async def mock_update(result: ExerciseResult) -> ExerciseResult:
            return result
        mock_repository.update.side_effect = mock_update

        # Act
        updated = await service.complete_processing(
            result_id=pending_result.id,
        )

        # Assert
        assert updated.processing_status == ProcessingStatus.COMPLETED

        mock_repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_fail_processing_success(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
        pending_result: ExerciseResult,
    ):
        """Should successfully mark processing as failed."""
        # Arrange
        pending_result.processing_status = ProcessingStatus.PROCESSING
        processing_error = "Audio quality too low"
        
        mock_repository.find_by_id.return_value = pending_result

        async def mock_update(result: ExerciseResult) -> ExerciseResult:
            return result
        mock_repository.update.side_effect = mock_update

        # Act
        updated = await service.fail_processing(
            result_id=pending_result.id,
            error_message=processing_error,
        )

        # Assert
        assert updated.processing_status == ProcessingStatus.FAILED
        assert updated.processing_error == processing_error

        mock_repository.update.assert_called_once()


class TestExerciseResultServiceRetrieval:
    """Tests for result retrieval operations."""

    @pytest.fixture
    def mock_repository(self) -> AsyncMock:
        repo = AsyncMock(spec=IExerciseResultRepository)
        return repo

    @pytest.fixture
    def service(self, mock_repository: AsyncMock) -> ExerciseResultService:
        return ExerciseResultService(repository=mock_repository)

    @pytest.mark.asyncio
    async def test_get_result_by_id_success(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
    ):
        """Should successfully get a result by ID."""
        # Arrange
        result_id = uuid4()
        expected_result = ExerciseResult(
            id=result_id,
            practice_session_id=uuid4(),
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            exercise_item_id=uuid4(),
            iteration_number=1,
            audio_segment_start_ms=1000,
            audio_segment_end_ms=5000,
            audio_duration_ms=4000,
            audio_file_id=uuid4(),
            transcription="Test",
            transcription_confidence=0.9,
            phoneme_analysis=None,
            audio_quality_metrics=None,
            evaluation_results=None,
            processing_status=ProcessingStatus.COMPLETED,
            processing_error=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        mock_repository.find_by_id.return_value = expected_result

        # Act
        result = await service.get_result_by_id(result_id)

        # Assert
        assert result == expected_result
        mock_repository.find_by_id.assert_called_once_with(result_id)

    @pytest.mark.asyncio
    async def test_get_result_by_id_not_found(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
    ):
        """Should raise ExerciseResultNotFoundError if result doesn't exist."""
        # Arrange
        result_id = uuid4()
        mock_repository.find_by_id.return_value = None

        # Act & Assert
        with pytest.raises(ExerciseResultNotFoundError):
            await service.get_result_by_id(result_id)

    @pytest.mark.asyncio
    async def test_get_session_results(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
    ):
        """Should get results for a session."""
        # Arrange
        session_id = uuid4()
        expected_results = [
            ExerciseResult(
                id=uuid4(),
                practice_session_id=session_id,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
                exercise_item_id=uuid4(),
                iteration_number=1,
                audio_segment_start_ms=1000,
                audio_segment_end_ms=5000,
                audio_duration_ms=4000,
                audio_file_id=uuid4(),
                transcription="Test",
                transcription_confidence=0.9,
                phoneme_analysis=None,
                audio_quality_metrics=None,
                evaluation_results=None,
                processing_status=ProcessingStatus.COMPLETED,
                processing_error=None,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
        ]
        
        mock_repository.find_by_session.return_value = expected_results

        # Act
        results = await service.get_session_results(
            practice_session_id=session_id,
            limit=10,
            offset=0,
        )

        # Assert
        assert results == expected_results
        mock_repository.find_by_session.assert_called_once_with(
            practice_session_id=session_id,
            limit=10,
            offset=0,
        )

    @pytest.mark.asyncio
    async def test_count_session_results(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
    ):
        """Should count results for a session."""
        # Arrange
        session_id = uuid4()
        expected_count = 8
        
        mock_repository.count_by_session.return_value = expected_count

        # Act
        count = await service.count_session_results(session_id)

        # Assert
        assert count == expected_count
        mock_repository.count_by_session.assert_called_once_with(session_id)


class TestExerciseResultServiceDelete:
    """Tests for result deletion."""

    @pytest.fixture
    def mock_repository(self) -> AsyncMock:
        repo = AsyncMock(spec=IExerciseResultRepository)
        return repo

    @pytest.fixture
    def service(self, mock_repository: AsyncMock) -> ExerciseResultService:
        return ExerciseResultService(repository=mock_repository)

    @pytest.mark.asyncio
    async def test_delete_result_success(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
    ):
        """Should successfully delete a result."""
        # Arrange
        result_id = uuid4()
        result = ExerciseResult(
            id=result_id,
            practice_session_id=uuid4(),
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            exercise_item_id=uuid4(),
            iteration_number=1,
            audio_segment_start_ms=1000,
            audio_segment_end_ms=5000,
            audio_duration_ms=4000,
            audio_file_id=uuid4(),
            transcription=None,
            transcription_confidence=None,
            phoneme_analysis=None,
            audio_quality_metrics=None,
            evaluation_results=None,
            processing_status=ProcessingStatus.FAILED,
            processing_error="Test error",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        
        mock_repository.find_by_id.return_value = result
        mock_repository.delete.return_value = True

        # Act
        result_deleted = await service.delete_result(result_id)

        # Assert
        assert result_deleted is True
        mock_repository.find_by_id.assert_called_once_with(result_id)
        mock_repository.delete.assert_called_once_with(result_id)

    @pytest.mark.asyncio
    async def test_delete_result_not_found(
        self,
        service: ExerciseResultService,
        mock_repository: AsyncMock,
    ):
        """Should raise ExerciseResultNotFoundError if result doesn't exist."""
        # Arrange
        result_id = uuid4()
        mock_repository.find_by_id.return_value = None

        # Act & Assert
        with pytest.raises(ExerciseResultNotFoundError):
            await service.delete_result(result_id)
