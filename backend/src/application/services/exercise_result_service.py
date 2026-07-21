"""
Exercise Result Service for managing individual exercise item results and audio segments.
"""

from datetime import datetime, timezone
from uuid import UUID, uuid4

from src.application.services.base_service import BaseService
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


class ExerciseResultService(BaseService):
    """Service for exercise result management operations."""

    def __init__(self, repository: IExerciseResultRepository):
        """
        Initialize the service with required dependencies.
        
        Args:
            repository: Exercise result repository interface
        """
        self._repo = repository

    # ==================== Result Creation ====================

    async def create_result(
        self,
        practice_session_id: UUID,
        exercise_item_id: UUID,
        iteration_number: int = 1,
        started_at: datetime | None = None,
        completed_at: datetime | None = None,
        audio_segment_start_ms: int | None = None,
        audio_segment_end_ms: int | None = None,
    ) -> ExerciseResult:
        """
        Create a new exercise result for an item iteration.
        
        Args:
            practice_session_id: ID of the practice session
            exercise_item_id: ID of the exercise item
            iteration_number: Iteration number (must be positive)
            started_at: Optional start timestamp (defaults to now)
            completed_at: Optional completion timestamp (defaults to now)
            audio_segment_start_ms: Optional audio segment start in milliseconds
            audio_segment_end_ms: Optional audio segment end in milliseconds
            
        Returns:
            Created exercise result
            
        Raises:
            InvalidIterationNumberError: If iteration number is invalid
        """
        # Validate iteration number
        if iteration_number < 1:
            raise InvalidIterationNumberError(iteration_number)
        
        now = datetime.now(timezone.utc)
        
        # Calculate duration if both timestamps provided
        duration_ms = 0
        if started_at and completed_at:
            duration_ms = int((completed_at - started_at).total_seconds() * 1000)
        
        # Calculate audio duration if both segments provided
        audio_duration_ms = None
        if audio_segment_start_ms is not None and audio_segment_end_ms is not None:
            audio_duration_ms = audio_segment_end_ms - audio_segment_start_ms
        
        result = ExerciseResult(
            id=uuid4(),
            practice_session_id=practice_session_id,
            exercise_item_id=exercise_item_id,
            started_at=started_at or now,
            completed_at=completed_at or now,
            iteration_number=iteration_number,
            duration_ms=duration_ms,
            audio_segment_start_ms=audio_segment_start_ms,
            audio_segment_end_ms=audio_segment_end_ms,
            audio_duration_ms=audio_duration_ms,
            audio_file_id=None,
            transcription=None,
            transcription_confidence=None,
            phoneme_analysis=None,
            audio_quality_metrics=None,
            evaluation_results={},
            processing_status=ProcessingStatus.PENDING,
            processing_error=None,
            created_at=now,
            updated_at=now,
        )

        return await self._repo.create(result)

    # ==================== Audio Segment Management ====================

    async def attach_audio_segment(
        self,
        result_id: UUID,
        start_ms: int,
        end_ms: int,
        audio_file_id: UUID | None = None,
    ) -> ExerciseResult:
        """
        Attach audio segment timestamps to a result.
        
        Args:
            result_id: ID of the exercise result
            start_ms: Start timestamp in milliseconds
            end_ms: End timestamp in milliseconds
            audio_file_id: Optional ID of the audio file
            
        Returns:
            Updated exercise result
            
        Raises:
            ExerciseResultNotFoundError: If result doesn't exist
            AudioSegmentOutOfBoundsError: If timestamps are invalid
        """
        result = await self.get_result_by_id(result_id)
        
        # Validate timestamps
        if start_ms < 0 or end_ms < 0 or start_ms >= end_ms:
            raise AudioSegmentOutOfBoundsError(start_ms, end_ms, end_ms)
        
        # Update audio segment info
        result.audio_segment_start_ms = start_ms
        result.audio_segment_end_ms = end_ms
        result.audio_duration_ms = end_ms - start_ms
        
        if audio_file_id is not None:
            result.audio_file_id = audio_file_id
        
        result.updated_at = datetime.now(timezone.utc)
        
        return await self._repo.update(result)

    # ==================== Transcription ====================

    async def set_transcription(
        self,
        result_id: UUID,
        transcription_text: str,
        confidence: float | None = None,
    ) -> ExerciseResult:
        """
        Set transcription for an exercise result.
        
        Args:
            result_id: ID of the exercise result
            transcription_text: Transcribed text
            confidence: Optional confidence score (0.0 - 1.0)
            
        Returns:
            Updated exercise result
            
        Raises:
            ExerciseResultNotFoundError: If result doesn't exist
        """
        result = await self.get_result_by_id(result_id)
        
        result.transcription = transcription_text
        result.transcription_confidence = confidence
        result.updated_at = datetime.now(timezone.utc)
        
        return await self._repo.update(result)

    # ==================== Analysis and Evaluation ====================

    async def set_phoneme_analysis(
        self,
        result_id: UUID,
        detected_phonemes: list[dict],
        phoneme_accuracy: float,
        common_errors: list[str],
        ipa_transcription: str,
        expected_ipa: str,
    ) -> ExerciseResult:
        """
        Set phoneme analysis for an exercise result.
        
        Args:
            result_id: ID of the exercise result
            detected_phonemes: List of detected phoneme dicts
            phoneme_accuracy: Overall phoneme accuracy (0.0 - 1.0)
            common_errors: List of common error descriptions
            ipa_transcription: IPA transcription of detected speech
            expected_ipa: Expected IPA transcription
            
        Returns:
            Updated exercise result
            
        Raises:
            ExerciseResultNotFoundError: If result doesn't exist
        """
        result = await self.get_result_by_id(result_id)
        
        phoneme_analysis = PhonemeAnalysis(
            detected_phonemes=detected_phonemes,
            phoneme_accuracy=phoneme_accuracy,
            common_errors=common_errors,
            ipa_transcription=ipa_transcription,
            expected_ipa=expected_ipa,
        )
        
        result.phoneme_analysis = phoneme_analysis
        result.updated_at = datetime.now(timezone.utc)
        
        return await self._repo.update(result)

    async def set_audio_quality_metrics(
        self,
        result_id: UUID,
        snr_db: float,
        rms_energy: float,
        clipping_detected: bool,
        spectral_flatness: float,
        quality_level: str,
        is_suitable_for_therapy: bool,
        warnings: list[str] | None = None,
    ) -> ExerciseResult:
        """
        Set audio quality metrics for an exercise result.
        
        Args:
            result_id: ID of the exercise result
            snr_db: Signal-to-noise ratio in decibels
            rms_energy: RMS energy level
            clipping_detected: Whether audio clipping was detected
            spectral_flatness: Spectral flatness measure
            quality_level: Quality level ('excellent', 'good', 'fair', 'poor')
            is_suitable_for_therapy: Whether audio is suitable for therapy use
            warnings: Optional list of warning messages
            
        Returns:
            Updated exercise result
            
        Raises:
            ExerciseResultNotFoundError: If result doesn't exist
        """
        result = await self.get_result_by_id(result_id)
        
        audio_quality = AudioQualityMetrics(
            snr_db=snr_db,
            rms_energy=rms_energy,
            clipping_detected=clipping_detected,
            spectral_flatness=spectral_flatness,
            quality_level=quality_level,
            is_suitable_for_therapy=is_suitable_for_therapy,
            warnings=warnings or [],
        )
        
        result.audio_quality_metrics = audio_quality
        result.updated_at = datetime.now(timezone.utc)
        
        return await self._repo.update(result)

    async def set_evaluation_results(
        self,
        result_id: UUID,
        accuracy_score: float,
        pronunciation_score: float,
        fluency_score: float,
        overall_score: float,
    ) -> ExerciseResult:
        """
        Set evaluation results for an exercise result.
        
        Args:
            result_id: ID of the exercise result
            accuracy_score: Speech accuracy (0.0 - 100.0)
            pronunciation_score: Pronunciation quality (0.0 - 100.0)
            fluency_score: Speech fluency (0.0 - 100.0)
            overall_score: Overall evaluation score (0.0 - 100.0)
            
        Returns:
            Updated exercise result
            
        Raises:
            ExerciseResultNotFoundError: If result doesn't exist
        """
        result = await self.get_result_by_id(result_id)
        
        evaluation = EvaluationScores(
            accuracy_score=accuracy_score,
            pronunciation_score=pronunciation_score,
            fluency_score=fluency_score,
            overall_score=overall_score,
        )
        
        # Store as dict in evaluation_results field
        result.evaluation_results = {
            'accuracy_score': accuracy_score,
            'pronunciation_score': pronunciation_score,
            'fluency_score': fluency_score,
            'overall_score': overall_score,
        }
        result.updated_at = datetime.now(timezone.utc)
        
        return await self._repo.update(result)

    async def update_result_with_full_analysis(
        self,
        result_id: UUID,
        transcription: str,
        transcription_confidence: float,
        phoneme_analysis: PhonemeAnalysis,
        audio_quality_metrics: AudioQualityMetrics,
        evaluation_results_dict: dict,
    ) -> ExerciseResult:
        """
        Update result with complete analysis data (all-in-one).
        
        Args:
            result_id: ID of the exercise result
            transcription: Transcribed text
            transcription_confidence: Confidence score
            phoneme_analysis: Phoneme analysis data
            audio_quality_metrics: Audio quality metrics
            evaluation_results_dict: Evaluation results as dictionary
            
        Returns:
            Updated exercise result
            
        Raises:
            ExerciseResultNotFoundError: If result doesn't exist
        """
        result = await self.get_result_by_id(result_id)
        
        # Update all fields
        result.transcription = transcription
        result.transcription_confidence = transcription_confidence
        result.phoneme_analysis = phoneme_analysis
        result.audio_quality_metrics = audio_quality_metrics
        result.evaluation_results = evaluation_results_dict
        result.updated_at = datetime.now(timezone.utc)
        
        return await self._repo.update(result)

    # ==================== Processing Status ====================

    async def start_processing(self, result_id: UUID) -> ExerciseResult:
        """
        Mark result as processing started.
        
        Args:
            result_id: ID of the exercise result
            
        Returns:
            Updated exercise result
            
        Raises:
            ExerciseResultNotFoundError: If result doesn't exist
        """
        result = await self.get_result_by_id(result_id)
        
        result.processing_status = ProcessingStatus.PROCESSING
        result.updated_at = datetime.now(timezone.utc)
        
        return await self._repo.update(result)

    async def complete_processing(self, result_id: UUID) -> ExerciseResult:
        """
        Mark result as processing completed.
        
        Args:
            result_id: ID of the exercise result
            
        Returns:
            Updated exercise result
            
        Raises:
            ExerciseResultNotFoundError: If result doesn't exist
        """
        result = await self.get_result_by_id(result_id)
        
        result.processing_status = ProcessingStatus.COMPLETED
        result.updated_at = datetime.now(timezone.utc)
        
        return await self._repo.update(result)

    async def fail_processing(
        self,
        result_id: UUID,
        error_message: str,
    ) -> ExerciseResult:
        """
        Mark result as processing failed.
        
        Args:
            result_id: ID of the exercise result
            error_message: Error message describing the failure
            
        Returns:
            Updated exercise result
            
        Raises:
            ExerciseResultNotFoundError: If result doesn't exist
        """
        result = await self.get_result_by_id(result_id)
        
        result.processing_status = ProcessingStatus.FAILED
        result.processing_error = error_message
        result.updated_at = datetime.now(timezone.utc)
        
        return await self._repo.update(result)

    # ==================== Result Retrieval ====================

    async def get_result_by_id(self, result_id: UUID) -> ExerciseResult:
        """
        Get an exercise result by ID.
        
        Args:
            result_id: ID of the exercise result
            
        Returns:
            Exercise result
            
        Raises:
            ExerciseResultNotFoundError: If result doesn't exist
        """
        result = await self._repo.get_by_id(result_id)
        if not result:
            raise ExerciseResultNotFoundError(result_id)
        return result

    async def get_session_results(
        self,
        practice_session_id: UUID,
        limit: int = 100,
        offset: int = 0,
    ) -> list[ExerciseResult]:
        """
        Get all results for a practice session.
        
        Args:
            practice_session_id: ID of the practice session
            limit: Maximum number of results to return
            offset: Number of results to skip
            
        Returns:
            List of exercise results
        """
        return await self._repo.find_by_session(
            practice_session_id=practice_session_id,
            limit=limit,
            offset=offset,
        )

    async def get_item_results(
        self,
        exercise_item_id: UUID,
        limit: int = 100,
        offset: int = 0,
    ) -> list[ExerciseResult]:
        """
        Get all results for an exercise item.
        
        Args:
            exercise_item_id: ID of the exercise item
            limit: Maximum number of results to return
            offset: Number of results to skip
            
        Returns:
            List of exercise results
        """
        return await self._repo.find_by_item(
            exercise_item_id=exercise_item_id,
            limit=limit,
            offset=offset,
        )

    async def get_results_by_status(
        self,
        status: ProcessingStatus,
        limit: int = 100,
        offset: int = 0,
    ) -> list[ExerciseResult]:
        """
        Get results filtered by processing status.
        
        Args:
            status: Processing status to filter by
            limit: Maximum number of results to return
            offset: Number of results to skip
            
        Returns:
            List of exercise results
        """
        return await self._repo.find_by_status(
            status=status,
            limit=limit,
            offset=offset,
        )

    async def count_session_results(
        self,
        practice_session_id: UUID,
    ) -> int:
        """
        Count results for a practice session.
        
        Args:
            practice_session_id: ID of the practice session
            
        Returns:
            Number of results
        """
        return await self._repo.count_by_session(practice_session_id)

    # ==================== Result Deletion ====================

    async def delete_result(self, result_id: UUID) -> bool:
        """
        Delete an exercise result.
        
        Args:
            result_id: ID of the exercise result
            
        Returns:
            True if deleted successfully
            
        Raises:
            ExerciseResultNotFoundError: If result doesn't exist
        """
        # Verify result exists
        await self.get_result_by_id(result_id)
        
        return await self._repo.delete(result_id)
