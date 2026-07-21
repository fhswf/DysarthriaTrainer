"""
SQLAlchemy implementation of ExerciseResultRepository
"""

from typing import Optional, List
from uuid import UUID
from decimal import Decimal

from sqlalchemy import select, func, Result, Select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.entities.exercise_result import (
    ExerciseResult,
    ProcessingStatus,
    PhonemeAnalysis,
    AudioQualityMetrics,
    EvaluationScores
)
from src.core.ports.repositories.exercise_result_repository import IExerciseResultRepository
from src.infrastructure.persistence.sqla.models.exercise_result_model import ExerciseResultModel
from src.infrastructure.persistence.sqla.repositories.base import BaseRepository


class ExerciseResultRepository(BaseRepository[ExerciseResultModel, ExerciseResult], IExerciseResultRepository):
    """SQLAlchemy implementation of exercise result repository."""
    
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(ExerciseResultModel, session)
    
    async def create(self, result: ExerciseResult) -> ExerciseResult:
        """Create a new exercise result."""
        result_db = self.to_orm(result)
        self._session.add(result_db)
        await self._session.commit()
        await self._session.refresh(result_db)
        return self.to_domain(result_db)
    
    async def find_by_id(self, result_id: UUID) -> Optional[ExerciseResult]:
        """Find exercise result by ID."""
        result_db = await self._session.get(self._model, result_id)
        return self.to_domain(result_db) if result_db else None
    
    async def update(self, result: ExerciseResult) -> ExerciseResult:
        """Update existing exercise result."""
        result_db = self.to_orm(result)
        merged = await self._session.merge(result_db)
        await self._session.commit()
        await self._session.refresh(merged)
        return self.to_domain(merged)
    
    async def find_by_session(
        self,
        practice_session_id: UUID,
        limit: int = 100,
        offset: int = 0
    ) -> List[ExerciseResult]:
        """Find all results for a practice session."""
        stmt: Select = (
            select(self._model)
            .where(self._model.practice_session_id == practice_session_id)
            .order_by(self._model.started_at.asc())
            .offset(offset)
            .limit(limit)
        )
        
        result: Result = await self._session.execute(stmt)
        results_db = result.scalars().all()
        return [self.to_domain(result_db) for result_db in results_db]
    
    async def find_by_item(
        self,
        exercise_item_id: UUID,
        limit: int = 100,
        offset: int = 0
    ) -> List[ExerciseResult]:
        """Find all results for a specific exercise item across sessions."""
        stmt: Select = (
            select(self._model)
            .where(self._model.exercise_item_id == exercise_item_id)
            .order_by(self._model.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        
        result: Result = await self._session.execute(stmt)
        results_db = result.scalars().all()
        return [self.to_domain(result_db) for result_db in results_db]
    
    async def find_by_status(
        self,
        status: ProcessingStatus,
        limit: int = 100
    ) -> List[ExerciseResult]:
        """Find results by processing status (e.g., for processing queue)."""
        stmt: Select = (
            select(self._model)
            .where(self._model.processing_status == status.value)
            .order_by(self._model.created_at.asc())
            .limit(limit)
        )
        
        result: Result = await self._session.execute(stmt)
        results_db = result.scalars().all()
        return [self.to_domain(result_db) for result_db in results_db]
    
    async def count_by_session(self, practice_session_id: UUID) -> int:
        """Count results in a practice session."""
        stmt = select(func.count()).select_from(self._model).where(
            self._model.practice_session_id == practice_session_id
        )
        
        result: Result = await self._session.execute(stmt)
        return result.scalar() or 0
    
    async def delete(self, result_id: UUID) -> bool:
        """Delete an exercise result by ID."""
        result_db = await self._session.get(self._model, result_id)
        if result_db is None:
            return False
        
        await self._session.delete(result_db)
        await self._session.commit()
        return True
    
    def to_domain(self, entity: ExerciseResultModel) -> ExerciseResult:
        """Convert SQLAlchemy model to domain entity."""
        # Convert JSONB fields to value objects
        phoneme_analysis = None
        if entity.phoneme_analysis:
            phoneme_analysis = PhonemeAnalysis(
                detected_phonemes=entity.phoneme_analysis.get("detected_phonemes", []),
                phoneme_accuracy=entity.phoneme_analysis.get("phoneme_accuracy", 0.0),
                common_errors=entity.phoneme_analysis.get("common_errors", []),
                ipa_transcription=entity.phoneme_analysis.get("ipa_transcription", ""),
                expected_ipa=entity.phoneme_analysis.get("expected_ipa", ""),
            )
        
        audio_quality = None
        if entity.audio_quality_metrics:
            audio_quality = AudioQualityMetrics(
                snr_db=entity.audio_quality_metrics.get("snr_db", 0.0),
                rms_energy=entity.audio_quality_metrics.get("rms_energy", 0.0),
                clipping_detected=entity.audio_quality_metrics.get("clipping_detected", False),
                spectral_flatness=entity.audio_quality_metrics.get("spectral_flatness", 0.0),
                quality_level=entity.audio_quality_metrics.get("quality_level", "poor"),
                is_suitable_for_therapy=entity.audio_quality_metrics.get("is_suitable_for_therapy", False),
                warnings=entity.audio_quality_metrics.get("warnings", []),
            )
        
        # Extract evaluation_results dict (no conversion to EvaluationScores here)
        # The entity stores it as a dict, conversion happens in service layer
        evaluation_results = entity.evaluation_results or {}
        
        return ExerciseResult(
            practice_session_id=entity.practice_session_id,
            exercise_item_id=entity.exercise_item_id,
            started_at=entity.started_at,
            completed_at=entity.completed_at,
            id=entity.id,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            iteration_number=entity.iteration_number,
            duration_ms=entity.duration_ms,
            audio_file_id=entity.audio_file_id,
            audio_segment_start_ms=entity.audio_segment_start_ms,
            audio_segment_end_ms=entity.audio_segment_end_ms,
            audio_duration_ms=entity.audio_duration_ms,
            transcription=entity.transcription,
            transcription_confidence=float(entity.transcription_confidence) if entity.transcription_confidence else None,
            phoneme_analysis=phoneme_analysis,
            audio_quality_metrics=audio_quality,
            analysis_parameters=entity.analysis_parameters or {},
            evaluation_results=evaluation_results,
            processing_status=ProcessingStatus(entity.processing_status),
            processing_error=entity.processing_error,
        )
    
    def to_orm(self, model: ExerciseResult) -> ExerciseResultModel:
        """Convert domain entity to SQLAlchemy model."""
        # Convert value objects to JSONB
        phoneme_analysis_json = None
        if model.phoneme_analysis:
            phoneme_analysis_json = {
                "detected_phonemes": model.phoneme_analysis.detected_phonemes,
                "phoneme_accuracy": model.phoneme_analysis.phoneme_accuracy,
                "common_errors": model.phoneme_analysis.common_errors,
                "ipa_transcription": model.phoneme_analysis.ipa_transcription,
                "expected_ipa": model.phoneme_analysis.expected_ipa,
            }
        
        audio_quality_json = None
        if model.audio_quality_metrics:
            audio_quality_json = {
                "snr_db": model.audio_quality_metrics.snr_db,
                "rms_energy": model.audio_quality_metrics.rms_energy,
                "clipping_detected": model.audio_quality_metrics.clipping_detected,
                "spectral_flatness": model.audio_quality_metrics.spectral_flatness,
                "quality_level": model.audio_quality_metrics.quality_level,
                "is_suitable_for_therapy": model.audio_quality_metrics.is_suitable_for_therapy,
                "warnings": model.audio_quality_metrics.warnings,
            }
        
        # evaluation_results is already a dict in the entity
        # It's stored by set_evaluation_scores() which creates the nested structure
        evaluation_results_json = model.evaluation_results
        
        return ExerciseResultModel(
            id=model.id,
            practice_session_id=model.practice_session_id,
            exercise_item_id=model.exercise_item_id,
            started_at=model.started_at,
            completed_at=model.completed_at,
            iteration_number=model.iteration_number,
            duration_ms=model.duration_ms,
            audio_file_id=model.audio_file_id,
            audio_segment_start_ms=model.audio_segment_start_ms,
            audio_segment_end_ms=model.audio_segment_end_ms,
            audio_duration_ms=model.audio_duration_ms,
            transcription=model.transcription,
            transcription_confidence=Decimal(str(model.transcription_confidence)) if model.transcription_confidence else None,
            phoneme_analysis=phoneme_analysis_json,
            audio_quality_metrics=audio_quality_json,
            analysis_parameters=model.analysis_parameters,
            evaluation_results=evaluation_results_json,
            processing_status=model.processing_status.value,
            processing_error=model.processing_error,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
