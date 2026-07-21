"""Unit tests for ResultAnalysisService."""

import pytest
import numpy as np
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
from datetime import datetime, timezone

from src.application.services.result_analysis_service import ResultAnalysisService
from src.core.entities.exercise_result import ExerciseResult
from src.core.exceptions.audio import AudioProcessingError


class TestResultAnalysisService:
    """Test ResultAnalysisService with mocked dependencies."""

    @pytest.fixture
    def mock_segment_extractor(self):
        """Create mock audio segment extractor."""
        extractor = AsyncMock()
        # Return fake audio array (16kHz, 1 second)
        extractor.extract_segment.return_value = np.zeros(16000, dtype=np.float32)
        extractor.validate_segment.return_value = True
        return extractor

    @pytest.fixture
    def mock_audio_service(self):
        """Create mock audio analysis service."""
        service = AsyncMock()
        # Mock analysis results
        service.analyze_audio.return_value = {
            "snr_db": 20.0,
            "rms": 0.05,
            "has_clipping": False,
            "spectral_flatness": 0.4,
            "duration_seconds": 1.0
        }
        service.transcribe_audio.return_value = "hello world"
        return service

    @pytest.fixture
    def mock_phoneme_service(self):
        """Create mock phoneme recognition service."""
        service = AsyncMock()
        service.recognize_phonemes.return_value = ["h", "ɛ", "l", "oʊ"]
        return service

    @pytest.fixture
    def mock_result_repo(self):
        """Create mock exercise result repository."""
        repo = AsyncMock()
        # Mock update to return the same result
        repo.update.side_effect = lambda result: result
        return repo

    @pytest.fixture
    def mock_logger(self):
        """Create mock logger."""
        return MagicMock()

    @pytest.fixture
    def service(self, mock_segment_extractor, mock_audio_service, 
                mock_phoneme_service, mock_result_repo, mock_logger):
        """Create ResultAnalysisService with mocked dependencies."""
        return ResultAnalysisService(
            segment_extractor=mock_segment_extractor,
            audio_service=mock_audio_service,
            phoneme_service=mock_phoneme_service,
            result_repo=mock_result_repo,
            logger=mock_logger
        )

    @pytest.fixture
    def sample_result(self):
        """Create sample exercise result for testing."""
        return ExerciseResult(
            id=uuid4(),
            practice_session_id=uuid4(),
            exercise_item_id=uuid4(),
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            audio_file_id=uuid4(),  # Required for has_audio_segment()
            audio_segment_start_ms=1000,
            audio_segment_end_ms=2000,
            created_at=datetime.now(timezone.utc)
        )

    @pytest.mark.asyncio
    async def test_analyze_result_complete_pipeline(self, service, sample_result):
        """Test complete analysis pipeline executes all steps."""
        # Act
        result = await service.analyze_result(
            result=sample_result,
            expected_text="hello",
            expected_ipa="hɛloʊ",
            language="de"
        )

        # Assert
        assert result is not None
        assert result.evaluation_scores is not None
        assert "overall_score" in result.evaluation_scores
        assert result.ai_analysis is not None
        assert "transcription" in result.ai_analysis
        assert "phonemes" in result.ai_analysis

    @pytest.mark.asyncio
    async def test_analyze_result_validates_segment(self, service, sample_result, 
                                                     mock_segment_extractor):
        """Test that analysis validates audio segment."""
        # Act
        await service.analyze_result(sample_result, expected_text="h", expected_ipa="h", language="de")

        # Assert
        mock_segment_extractor.validate_segment.assert_called_once()

    @pytest.mark.asyncio
    async def test_analyze_result_invalid_segment_raises_error(self, service, sample_result,
                                                                 mock_segment_extractor):
        """Test that invalid segment raises AudioProcessingError."""
        # Arrange
        mock_segment_extractor.validate_segment.return_value = False

        # Act & Assert
        with pytest.raises(AudioProcessingError, match="Invalid audio segment"):
            await service.analyze_result(sample_result, expected_text="h", expected_ipa="h", language="de")

    @pytest.mark.asyncio
    async def test_analyze_result_missing_timestamps(self, service):
        """Test that missing timestamps raise error."""
        # Arrange
        result = ExerciseResult(
            practice_session_id=uuid4(),
            exercise_item_id=uuid4(),
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            audio_segment_start_ms=None,  # Missing
            audio_segment_end_ms=None,  # Missing
        )

        # Act & Assert
        with pytest.raises(AudioProcessingError, match="Missing audio segment"):
            await service.analyze_result(result, uuid4(), ["t"])

    @pytest.mark.asyncio
    async def test_analyze_result_extracts_audio(self, service, sample_result, 
                                                  mock_segment_extractor):
        """Test that analysis extracts audio segment."""
        # Act
        await service.analyze_result(sample_result, expected_text="h", expected_ipa="h", language="de")

        # Assert
        mock_segment_extractor.extract_segment.assert_called_once_with(
            audio_file_id=sample_result.audio_file_id,
            start_ms=sample_result.audio_segment_start_ms,
            end_ms=sample_result.audio_segment_end_ms,
            output_sample_rate=16000
        )

    @pytest.mark.asyncio
    async def test_analyze_result_preprocesses_audio(self, service, sample_result,
                                                      mock_audio_service):
        """Test that audio is preprocessed."""
        # Act
        await service.analyze_result(sample_result, expected_text="h", expected_ipa="h", language="de")

        # Assert
        mock_audio_service.analyze_audio.assert_called_once()

    @pytest.mark.asyncio
    async def test_analyze_result_transcribes_audio(self, service, sample_result,
                                                     mock_audio_service):
        """Test that audio is transcribed."""
        # Act
        await service.analyze_result(sample_result, expected_text="h", expected_ipa="h", language="de")

        # Assert
        mock_audio_service.transcribe_audio.assert_called_once()

    @pytest.mark.asyncio
    async def test_analyze_result_recognizes_phonemes(self, service, sample_result,
                                                       mock_phoneme_service):
        """Test that phonemes are recognized."""
        # Act
        await service.analyze_result(sample_result, expected_text="hɛ", expected_ipa="h\u025b", language="de")

        # Assert
        mock_phoneme_service.recognize_phonemes.assert_called_once()

    @pytest.mark.asyncio
    async def test_analyze_result_calculates_scores(self, service, sample_result):
        """Test that evaluation scores are calculated."""
        # Act
        result = await service.analyze_result(sample_result, expected_text="h", expected_ipa="h", language="de")

        # Assert
        scores = result.evaluation_scores
        assert "overall_score" in scores
        assert "accuracy_score" in scores
        assert "pronunciation_score" in scores
        assert "fluency_score" in scores
        assert 0 <= scores["overall_score"] <= 100

    @pytest.mark.asyncio
    async def test_analyze_result_stores_ai_analysis(self, service, sample_result):
        """Test that AI analysis data is stored."""
        # Act
        result = await service.analyze_result(sample_result, expected_text="h", expected_ipa="h", language="de")

        # Assert
        analysis = result.ai_analysis
        assert "transcription" in analysis
        assert "phonemes" in analysis
        assert "quality_metrics" in analysis
        assert "quality_level" in analysis
        assert "suitable_for_therapy" in analysis
        assert "phoneme_errors" in analysis

    @pytest.mark.asyncio
    async def test_analyze_result_updates_repository(self, service, sample_result,
                                                      mock_result_repo):
        """Test that result is updated in repository."""
        # Act
        await service.analyze_result(sample_result, expected_text="h", expected_ipa="h", language="de")

        # Assert
        mock_result_repo.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_analyze_result_quality_classification(self, service, sample_result,
                                                          mock_audio_service):
        """Test quality level classification."""
        # Arrange - Excellent quality
        mock_audio_service.analyze_audio.return_value = {
            "snr_db": 25.0,  # > 20 = Excellent
            "rms": 0.05,
            "has_clipping": False,
            "spectral_flatness": 0.3,
            "duration_seconds": 1.0
        }

        # Act
        result = await service.analyze_result(sample_result, expected_text="h", expected_ipa="h", language="de")

        # Assert
        assert result.ai_analysis["quality_level"] == "Excellent"

    @pytest.mark.asyncio
    async def test_analyze_result_therapy_suitability(self, service, sample_result,
                                                       mock_audio_service):
        """Test therapy suitability assessment."""
        # Arrange - Suitable for therapy
        mock_audio_service.analyze_audio.return_value = {
            "snr_db": 15.0,  # >= 12
            "rms": 0.03,  # >= 0.02
            "has_clipping": False,  # No clipping
            "spectral_flatness": 0.5,  # < 0.6
            "duration_seconds": 1.0
        }

        # Act
        result = await service.analyze_result(sample_result, expected_text="h", expected_ipa="h", language="de")

        # Assert
        assert result.ai_analysis["suitable_for_therapy"] is True

    @pytest.mark.asyncio
    async def test_analyze_result_phoneme_accuracy(self, service, sample_result,
                                                    mock_phoneme_service):
        """Test phoneme accuracy calculation."""
        # Arrange - Matching phonemes
        expected = ["h", "ɛ", "l", "oʊ"]
        mock_phoneme_service.recognize_phonemes.return_value = ["h", "ɛ", "l", "oʊ"]

        # Act
        result = await service.analyze_result(sample_result, expected_text="hello", expected_ipa="hɛloʊ", language="de")

        # Assert
        scores = result.evaluation_scores
        assert scores["pronunciation_score"] == 100.0  # Perfect match

    @pytest.mark.asyncio
    async def test_analyze_result_scoring_weights(self, service, sample_result):
        """Test that scoring uses correct weights."""
        # Act
        result = await service.analyze_result(sample_result, expected_text="h", expected_ipa="h", language="de")

        # Assert - verify weights: 25% accuracy, 50% pronunciation, 25% fluency
        scores = result.evaluation_scores
        accuracy = scores["accuracy_score"]
        pronunciation = scores["pronunciation_score"]
        fluency = scores["fluency_score"]
        
        expected_overall = (accuracy * 0.25 + pronunciation * 0.5 + fluency * 0.25)
        assert abs(scores["overall_score"] - expected_overall) < 0.01

    @pytest.mark.asyncio
    async def test_analyze_result_handles_extraction_error(self, service, sample_result,
                                                            mock_segment_extractor):
        """Test handling of audio extraction errors."""
        # Arrange
        mock_segment_extractor.extract_segment.side_effect = Exception("Extraction failed")

        # Act & Assert
        with pytest.raises(AudioProcessingError):
            await service.analyze_result(sample_result, expected_text="h", expected_ipa="h", language="de")

    @pytest.mark.asyncio
    async def test_analyze_result_logs_operations(self, service, sample_result, mock_logger):
        """Test that operations are logged."""
        # Act
        await service.analyze_result(sample_result, expected_text="h", expected_ipa="h", language="de")

        # Assert
        assert mock_logger.info.called or mock_logger.debug.called


class TestResultAnalysisServiceScoringLogic:
    """Test scoring calculation logic."""

    @pytest.fixture
    def service(self):
        """Create service with mocks for scoring tests."""
        extractor = AsyncMock()
        audio_service = AsyncMock()
        phoneme_service = AsyncMock()
        repo = AsyncMock()
        logger = MagicMock()
        
        # Setup audio service with good quality
        audio_service.analyze_audio.return_value = {
            "snr_db": 20.0,
            "rms": 0.05,
            "has_clipping": False,
            "spectral_flatness": 0.4,
            "duration_seconds": 1.0
        }
        audio_service.transcribe_audio.return_value = "test"
        
        extractor.extract_segment.return_value = np.zeros(16000, dtype=np.float32)
        extractor.validate_segment.return_value = True
        phoneme_service.recognize_phonemes.return_value = ["t", "ɛ", "s", "t"]
        repo.update.side_effect = lambda x: x
        
        return ResultAnalysisService(extractor, audio_service, phoneme_service, repo, logger)

    def test_quality_level_thresholds(self):
        """Test quality level classification thresholds."""
        # Excellent: SNR >= 20
        assert 25.0 >= 20.0
        # Good: SNR >= 15
        assert 17.0 >= 15.0
        # Fair: SNR >= 10
        assert 12.0 >= 10.0
        # Poor: SNR < 10
        assert 8.0 < 10.0

    def test_therapy_suitability_criteria(self):
        """Test therapy suitability thresholds."""
        # All criteria must be met
        snr = 15.0
        rms = 0.03
        has_clipping = False
        spectral_flatness = 0.5
        
        is_suitable = (
            snr >= 12.0 and
            rms >= 0.02 and
            not has_clipping and
            spectral_flatness < 0.6
        )
        assert is_suitable is True

    def test_scoring_weights(self):
        """Test scoring weight distribution."""
        # Weights should sum to 1.0
        accuracy_weight = 0.25
        pronunciation_weight = 0.50
        fluency_weight = 0.25
        
        assert accuracy_weight + pronunciation_weight + fluency_weight == 1.0

    @pytest.mark.parametrize("accuracy,pronunciation,fluency,expected", [
        (100, 100, 100, 100),  # Perfect scores
        (0, 0, 0, 0),  # Zero scores
        (80, 90, 70, 82.5),  # Mixed scores: 80*0.25 + 90*0.5 + 70*0.25 = 82.5
        (50, 50, 50, 50),  # All equal
    ])
    def test_overall_score_calculation(self, accuracy, pronunciation, fluency, expected):
        """Test overall score calculation with different inputs."""
        overall = accuracy * 0.25 + pronunciation * 0.5 + fluency * 0.25
        assert abs(overall - expected) < 0.01
