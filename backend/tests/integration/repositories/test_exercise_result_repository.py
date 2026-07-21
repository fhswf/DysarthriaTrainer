"""
Integration tests for ExerciseResultRepository
"""

import pytest
from datetime import datetime, timezone
from uuid import uuid4

from src.core.entities.exercise_result import (
    ExerciseResult,
    ProcessingStatus,
    PhonemeAnalysis,
    AudioQualityMetrics,
    EvaluationScores
)
from src.infrastructure.persistence.sqla.repositories.exercise_result_repository import ExerciseResultRepository


@pytest.mark.asyncio
class TestExerciseResultRepository:
    """Integration tests for ExerciseResultRepository."""
    
    async def test_create_result(self, db_session, test_practice_session, test_exercise_item):
        """Test creating an exercise result."""
        # Arrange
        repo = ExerciseResultRepository(db_session)
        result = ExerciseResult(
            id=uuid4(),
            practice_session_id=test_practice_session.id,
            exercise_item_id=test_exercise_item.id,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            iteration_number=1,
            duration_ms=5000,
            audio_file_id=None,
            audio_segment_start_ms=None,
            audio_segment_end_ms=None,
            audio_duration_ms=None,
            transcription=None,
            transcription_confidence=None,
            phoneme_analysis=None,
            audio_quality_metrics=None,
            analysis_parameters={},
            evaluation_results=None,
            processing_status=ProcessingStatus.PENDING,
            processing_error=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        # Act
        created = await repo.create(result)
        
        # Assert
        assert created.id == result.id
        assert created.practice_session_id == test_practice_session.id
        assert created.exercise_item_id == test_exercise_item.id
        assert created.iteration_number == 1
        assert created.processing_status == ProcessingStatus.PENDING
    
    async def test_find_by_id(self, db_session, test_practice_session, test_exercise_item):
        """Test finding result by ID."""
        # Arrange
        repo = ExerciseResultRepository(db_session)
        result = ExerciseResult(
            id=uuid4(),
            practice_session_id=test_practice_session.id,
            exercise_item_id=test_exercise_item.id,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            iteration_number=1,
            duration_ms=3000,
            audio_file_id=None,
            audio_segment_start_ms=None,
            audio_segment_end_ms=None,
            audio_duration_ms=None,
            transcription=None,
            transcription_confidence=None,
            phoneme_analysis=None,
            audio_quality_metrics=None,
            analysis_parameters={},
            evaluation_results=None,
            processing_status=ProcessingStatus.PENDING,
            processing_error=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        await repo.create(result)
        
        # Act
        found = await repo.find_by_id(result.id)
        
        # Assert
        assert found is not None
        assert found.id == result.id
        assert found.practice_session_id == test_practice_session.id
    
    async def test_update_result_with_value_objects(self, db_session, test_practice_session, test_exercise_item):
        """Test updating result with value objects."""
        # Arrange
        repo = ExerciseResultRepository(db_session)
        result = ExerciseResult(
            id=uuid4(),
            practice_session_id=test_practice_session.id,
            exercise_item_id=test_exercise_item.id,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            iteration_number=1,
            duration_ms=5000,
            audio_file_id=None,
            audio_segment_start_ms=0,
            audio_segment_end_ms=5000,
            audio_duration_ms=5000,
            transcription=None,
            transcription_confidence=None,
            phoneme_analysis=None,
            audio_quality_metrics=None,
            analysis_parameters={},
            evaluation_results=None,
            processing_status=ProcessingStatus.PENDING,
            processing_error=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        created = await repo.create(result)
        
        # Act - Update with value objects
        created.transcription = "Hello world"
        created.transcription_confidence = 0.95
        created.phoneme_analysis = PhonemeAnalysis(
            detected_phonemes=["h", "ə", "l", "oʊ"],
            phoneme_accuracy=0.92,
            ipa_transcription="həˈloʊ"
        )
        created.audio_quality_metrics = AudioQualityMetrics(
            snr_db=25.5,
            rms_energy=0.15,
            clipping_detected=False,
            quality_level="excellent"
        )
        created.evaluation_results = EvaluationScores(
            accuracy_score=92,
            pronunciation_score=88,
            fluency_score=90,
            overall_score=90
        )
        created.processing_status = ProcessingStatus.COMPLETED
        
        updated = await repo.update(created)
        
        # Assert
        assert updated.transcription == "Hello world"
        assert updated.transcription_confidence == 0.95
        assert updated.phoneme_analysis is not None
        assert updated.phoneme_analysis.phoneme_accuracy == 0.92
        assert updated.audio_quality_metrics is not None
        assert updated.audio_quality_metrics.quality_level == "excellent"
        assert updated.evaluation_results is not None
        assert updated.evaluation_results.overall_score == 90
        assert updated.processing_status == ProcessingStatus.COMPLETED
    
    async def test_find_by_session(self, db_session, test_practice_session, test_exercise_item):
        """Test finding results by session."""
        # Arrange
        repo = ExerciseResultRepository(db_session)
        
        # Create multiple results
        result1 = ExerciseResult(
            id=uuid4(),
            practice_session_id=test_practice_session.id,
            exercise_item_id=test_exercise_item.id,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            iteration_number=1,
            duration_ms=3000,
            audio_file_id=None,
            audio_segment_start_ms=0,
            audio_segment_end_ms=3000,
            audio_duration_ms=3000,
            transcription=None,
            transcription_confidence=None,
            phoneme_analysis=None,
            audio_quality_metrics=None,
            analysis_parameters={},
            evaluation_results=None,
            processing_status=ProcessingStatus.PENDING,
            processing_error=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        result2 = ExerciseResult(
            id=uuid4(),
            practice_session_id=test_practice_session.id,
            exercise_item_id=test_exercise_item.id,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            iteration_number=2,
            duration_ms=3500,
            audio_file_id=None,
            audio_segment_start_ms=3000,
            audio_segment_end_ms=6500,
            audio_duration_ms=3500,
            transcription=None,
            transcription_confidence=None,
            phoneme_analysis=None,
            audio_quality_metrics=None,
            analysis_parameters={},
            evaluation_results=None,
            processing_status=ProcessingStatus.COMPLETED,
            processing_error=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        await repo.create(result1)
        await repo.create(result2)
        
        # Act
        results = await repo.find_by_session(test_practice_session.id)
        
        # Assert
        assert len(results) == 2
        assert all(r.practice_session_id == test_practice_session.id for r in results)
    
    async def test_find_by_item(self, db_session, test_practice_session, test_exercise_item):
        """Test finding results by exercise item."""
        # Arrange
        repo = ExerciseResultRepository(db_session)
        
        result = ExerciseResult(
            id=uuid4(),
            practice_session_id=test_practice_session.id,
            exercise_item_id=test_exercise_item.id,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            iteration_number=1,
            duration_ms=4000,
            audio_file_id=None,
            audio_segment_start_ms=None,
            audio_segment_end_ms=None,
            audio_duration_ms=None,
            transcription=None,
            transcription_confidence=None,
            phoneme_analysis=None,
            audio_quality_metrics=None,
            analysis_parameters={},
            evaluation_results=None,
            processing_status=ProcessingStatus.PENDING,
            processing_error=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        await repo.create(result)
        
        # Act
        results = await repo.find_by_item(test_exercise_item.id)
        
        # Assert
        assert len(results) >= 1
        assert results[0].exercise_item_id == test_exercise_item.id
    
    async def test_find_by_status(self, db_session, test_practice_session, test_exercise_item):
        """Test finding results by processing status."""
        # Arrange
        repo = ExerciseResultRepository(db_session)
        
        # Create results with different statuses
        pending_result = ExerciseResult(
            id=uuid4(),
            practice_session_id=test_practice_session.id,
            exercise_item_id=test_exercise_item.id,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            iteration_number=1,
            duration_ms=3000,
            audio_file_id=None,
            audio_segment_start_ms=None,
            audio_segment_end_ms=None,
            audio_duration_ms=None,
            transcription=None,
            transcription_confidence=None,
            phoneme_analysis=None,
            audio_quality_metrics=None,
            analysis_parameters={},
            evaluation_results=None,
            processing_status=ProcessingStatus.PENDING,
            processing_error=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        completed_result = ExerciseResult(
            id=uuid4(),
            practice_session_id=test_practice_session.id,
            exercise_item_id=test_exercise_item.id,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            iteration_number=2,
            duration_ms=3500,
            audio_file_id=None,
            audio_segment_start_ms=None,
            audio_segment_end_ms=None,
            audio_duration_ms=None,
            transcription="Test",
            transcription_confidence=0.9,
            phoneme_analysis=None,
            audio_quality_metrics=None,
            analysis_parameters={},
            evaluation_results=None,
            processing_status=ProcessingStatus.COMPLETED,
            processing_error=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        await repo.create(pending_result)
        await repo.create(completed_result)
        
        # Act
        pending_results = await repo.find_by_status(ProcessingStatus.PENDING)
        completed_results = await repo.find_by_status(ProcessingStatus.COMPLETED)
        
        # Assert
        assert any(r.id == pending_result.id for r in pending_results)
        assert any(r.id == completed_result.id for r in completed_results)
    
    async def test_count_by_session(self, db_session, test_practice_session, test_exercise_item):
        """Test counting results by session."""
        # Arrange
        repo = ExerciseResultRepository(db_session)
        
        # Create 3 results
        for i in range(3):
            result = ExerciseResult(
                id=uuid4(),
                practice_session_id=test_practice_session.id,
                exercise_item_id=test_exercise_item.id,
                started_at=datetime.now(timezone.utc),
                completed_at=datetime.now(timezone.utc),
                iteration_number=i + 1,
                duration_ms=3000,
                audio_file_id=None,
                audio_segment_start_ms=None,
                audio_segment_end_ms=None,
                audio_duration_ms=None,
                transcription=None,
                transcription_confidence=None,
                phoneme_analysis=None,
                audio_quality_metrics=None,
                analysis_parameters={},
                evaluation_results=None,
                processing_status=ProcessingStatus.PENDING,
                processing_error=None,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            await repo.create(result)
        
        # Act
        count = await repo.count_by_session(test_practice_session.id)
        
        # Assert
        assert count == 3
    
    async def test_delete_result(self, db_session, test_practice_session, test_exercise_item):
        """Test deleting an exercise result."""
        # Arrange
        repo = ExerciseResultRepository(db_session)
        result = ExerciseResult(
            id=uuid4(),
            practice_session_id=test_practice_session.id,
            exercise_item_id=test_exercise_item.id,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            iteration_number=1,
            duration_ms=3000,
            audio_file_id=None,
            audio_segment_start_ms=None,
            audio_segment_end_ms=None,
            audio_duration_ms=None,
            transcription=None,
            transcription_confidence=None,
            phoneme_analysis=None,
            audio_quality_metrics=None,
            analysis_parameters={},
            evaluation_results=None,
            processing_status=ProcessingStatus.PENDING,
            processing_error=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        created = await repo.create(result)
        
        # Act
        deleted = await repo.delete(created.id)
        found = await repo.find_by_id(created.id)
        
        # Assert
        assert deleted is True
        assert found is None
    
    async def test_audio_segment_timestamps(self, db_session, test_practice_session, test_exercise_item):
        """Test audio segment timestamp handling."""
        # Arrange
        repo = ExerciseResultRepository(db_session)
        result = ExerciseResult(
            id=uuid4(),
            practice_session_id=test_practice_session.id,
            exercise_item_id=test_exercise_item.id,
            started_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            iteration_number=1,
            duration_ms=5000,
            audio_file_id=None,
            audio_segment_start_ms=1000,
            audio_segment_end_ms=6000,
            audio_duration_ms=5000,
            transcription=None,
            transcription_confidence=None,
            phoneme_analysis=None,
            audio_quality_metrics=None,
            analysis_parameters={},
            evaluation_results=None,
            processing_status=ProcessingStatus.PENDING,
            processing_error=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        # Act
        created = await repo.create(result)
        found = await repo.find_by_id(created.id)
        
        # Assert
        assert found.audio_segment_start_ms == 1000
        assert found.audio_segment_end_ms == 6000
        assert found.audio_duration_ms == 5000
        assert found.audio_file_id is None  # No file created in this test
