"""
Exercise Result Entity

Core domain entity representing the result of a single exercise item attempt
with audio analysis and evaluation.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4


class ProcessingStatus(Enum):
    """Processing status enumeration."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class PhonemeAnalysis:
    """Value object for phoneme analysis data."""
    detected_phonemes: list[dict]
    phoneme_accuracy: float
    common_errors: list[str]
    ipa_transcription: str
    expected_ipa: str
    
    def __post_init__(self):
        if not 0.0 <= self.phoneme_accuracy <= 1.0:
            raise ValueError("phoneme_accuracy must be between 0.0 and 1.0")


@dataclass
class AudioQualityMetrics:
    """Value object for audio quality metrics."""
    snr_db: float
    rms_energy: float
    clipping_detected: bool
    spectral_flatness: float
    quality_level: str  # 'excellent', 'good', 'fair', 'poor'
    is_suitable_for_therapy: bool
    warnings: list[str] = field(default_factory=list)
    
    def __post_init__(self):
        valid_levels = {'excellent', 'good', 'fair', 'poor'}
        if self.quality_level not in valid_levels:
            raise ValueError(f"quality_level must be one of {valid_levels}")


@dataclass
class EvaluationScores:
    """Value object for evaluation scores."""
    accuracy_score: float
    pronunciation_score: float
    fluency_score: float
    overall_score: float
    
    def __post_init__(self):
        for score_name in ['accuracy_score', 'pronunciation_score', 'fluency_score', 'overall_score']:
            score = getattr(self, score_name)
            if not 0.0 <= score <= 100.0:
                raise ValueError(f"{score_name} must be between 0.0 and 100.0")


@dataclass
class ExerciseResult:
    """
    Core entity representing the result of an exercise item attempt.
    
    Tracks audio recordings, transcriptions, phoneme analysis, quality metrics,
    and evaluation scores for a single exercise item iteration.
    
    Attributes:
        id: Unique result identifier
        practice_session_id: ID of the parent practice session
        exercise_item_id: ID of the exercise item
        started_at: When the item attempt started
        completed_at: When the item attempt completed
        iteration_number: Iteration number for repeated items (1-based)
        duration_ms: Duration of the attempt in milliseconds
        audio_file_id: ID of the session's continuous audio file
        audio_segment_start_ms: Start timestamp in the audio file
        audio_segment_end_ms: End timestamp in the audio file
        audio_duration_ms: Duration of this audio segment
        transcription: Transcribed text from speech recognition
        transcription_confidence: Confidence score for transcription
        phoneme_analysis: Detailed phoneme analysis results
        audio_quality_metrics: Audio quality measurements
        analysis_parameters: Parameters used for analysis
        evaluation_results: Full evaluation results with feedback
        processing_status: Current processing status
        processing_error: Error message if processing failed
        created_at: Entity creation timestamp
        updated_at: Entity last update timestamp
    """
    
    # Required fields
    practice_session_id: UUID
    exercise_item_id: UUID
    started_at: datetime
    completed_at: datetime
    
    # Auto-generated fields
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Iteration support
    iteration_number: int = 1
    
    # Calculated fields
    duration_ms: int = 0
    
    # Audio segment fields
    audio_file_id: Optional[UUID] = None
    audio_segment_start_ms: Optional[int] = None
    audio_segment_end_ms: Optional[int] = None
    audio_duration_ms: Optional[int] = None
    
    # Analysis fields
    transcription: Optional[str] = None
    transcription_confidence: Optional[float] = None
    phoneme_analysis: Optional[PhonemeAnalysis] = None
    audio_quality_metrics: Optional[AudioQualityMetrics] = None
    analysis_parameters: dict = field(default_factory=dict)
    evaluation_results: dict = field(default_factory=dict)
    
    # Processing
    processing_status: ProcessingStatus = ProcessingStatus.PENDING
    processing_error: Optional[str] = None
    
    def __post_init__(self):
        """Validate entity after initialization."""
        self._validate()
        self._calculate_duration()
    
    def _validate(self) -> None:
        """Validate entity invariants."""
        if self.iteration_number < 1:
            raise ValueError("iteration_number must be >= 1")
        
        if self.transcription_confidence is not None:
            if not 0.0 <= self.transcription_confidence <= 1.0:
                raise ValueError("transcription_confidence must be between 0.0 and 1.0")
        
        if self.audio_segment_start_ms is not None and self.audio_segment_start_ms < 0:
            raise ValueError("audio_segment_start_ms cannot be negative")
        
        if self.audio_segment_end_ms is not None and self.audio_segment_end_ms < 0:
            raise ValueError("audio_segment_end_ms cannot be negative")
        
        if (self.audio_segment_start_ms is not None and 
            self.audio_segment_end_ms is not None and
            self.audio_segment_end_ms <= self.audio_segment_start_ms):
            raise ValueError("audio_segment_end_ms must be greater than audio_segment_start_ms")
    
    def _calculate_duration(self) -> None:
        """Calculate duration from timestamps."""
        delta = self.completed_at - self.started_at
        self.duration_ms = int(delta.total_seconds() * 1000)
        
        # Calculate audio segment duration if timestamps available
        if self.audio_segment_start_ms is not None and self.audio_segment_end_ms is not None:
            self.audio_duration_ms = self.audio_segment_end_ms - self.audio_segment_start_ms
    
    # Domain Methods
    
    def start_processing(self) -> None:
        """Mark result as being processed."""
        self.processing_status = ProcessingStatus.PROCESSING
        self._touch()
    
    def complete_processing(self) -> None:
        """Mark result processing as completed."""
        self.processing_status = ProcessingStatus.COMPLETED
        self._touch()
    
    def fail_processing(self, error_message: str) -> None:
        """Mark result processing as failed."""
        self.processing_status = ProcessingStatus.FAILED
        self.processing_error = error_message
        self._touch()
    
    def attach_audio_segment(self, audio_file_id: UUID, start_ms: int, end_ms: int) -> None:
        """
        Attach audio segment information.
        
        Args:
            audio_file_id: ID of the audio file
            start_ms: Start timestamp in milliseconds
            end_ms: End timestamp in milliseconds
            
        Raises:
            ValueError: If timestamps are invalid
        """
        if start_ms < 0 or end_ms < 0:
            raise ValueError("Timestamps cannot be negative")
        
        if end_ms <= start_ms:
            raise ValueError("end_ms must be greater than start_ms")
        
        self.audio_file_id = audio_file_id
        self.audio_segment_start_ms = start_ms
        self.audio_segment_end_ms = end_ms
        self.audio_duration_ms = end_ms - start_ms
        self._touch()
    
    def set_transcription(self, text: str, confidence: float) -> None:
        """
        Set transcription result.
        
        Args:
            text: Transcribed text
            confidence: Confidence score (0.0 - 1.0)
            
        Raises:
            ValueError: If confidence is out of range
        """
        if not 0.0 <= confidence <= 1.0:
            raise ValueError("confidence must be between 0.0 and 1.0")
        
        self.transcription = text
        self.transcription_confidence = confidence
        self._touch()
    
    def set_phoneme_analysis(self, analysis: PhonemeAnalysis) -> None:
        """Set phoneme analysis results."""
        self.phoneme_analysis = analysis
        self._touch()
    
    def set_audio_quality(self, metrics: AudioQualityMetrics) -> None:
        """Set audio quality metrics."""
        self.audio_quality_metrics = metrics
        self._touch()
    
    def set_evaluation_scores(self, scores: EvaluationScores) -> None:
        """Set evaluation scores."""
        # Store scores in evaluation_results dict for serialization
        self.evaluation_results['scores'] = {
            'accuracy_score': scores.accuracy_score,
            'pronunciation_score': scores.pronunciation_score,
            'fluency_score': scores.fluency_score,
            'overall_score': scores.overall_score
        }
        self._touch()
    
    def is_pending(self) -> bool:
        """Check if result is pending processing."""
        return self.processing_status == ProcessingStatus.PENDING
    
    def is_processing(self) -> bool:
        """Check if result is currently being processed."""
        return self.processing_status == ProcessingStatus.PROCESSING
    
    def is_completed(self) -> bool:
        """Check if result processing is completed."""
        return self.processing_status == ProcessingStatus.COMPLETED
    
    def is_failed(self) -> bool:
        """Check if result processing failed."""
        return self.processing_status == ProcessingStatus.FAILED
    
    def has_audio_segment(self) -> bool:
        """Check if result has audio segment information."""
        return (self.audio_file_id is not None and
                self.audio_segment_start_ms is not None and
                self.audio_segment_end_ms is not None)
    
    def _touch(self) -> None:
        """Update the updated_at timestamp."""
        self.updated_at = datetime.now(timezone.utc)
