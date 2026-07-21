"""
Result Analysis Service

Comprehensive analysis pipeline for individual exercise results.
Orchestrates audio extraction, preprocessing, transcription, phoneme recognition,
quality assessment, and evaluation scoring.
"""

# Standard library
from difflib import SequenceMatcher
from typing import Optional
from uuid import UUID

# Local imports
from src.application.services.audio_analysis_service import AudioAnalysisService
from src.application.services.audio_segment_extractor import AudioSegmentExtractor
from src.core.entities.exercise_result import (
    AudioQualityMetrics,
    EvaluationScores,
    ExerciseResult,
    PhonemeAnalysis,
)
from src.core.exceptions.audio import AudioProcessingError
from src.core.ports.inference.phoneme_recognition import IPhonemeRecognitionService
from src.core.ports.repositories.exercise_result_repository import IExerciseResultRepository
from src.core.ports.utils.logger_protocol import ILogger


class ResultAnalysisService:
    """
    Service for analyzing individual exercise results.
    
    Pipeline:
    1. Extract audio segment from session recording
    2. Preprocess audio (noise reduction, normalization)
    3. Analyze audio quality (SNR, RMS, clipping, spectral flatness)
    4. Transcribe speech (Faster Whisper)
    5. Recognize phonemes (TransformerCTC)
    6. Calculate evaluation scores
    7. Update result entity
    8. Persist to database
    
    This is an Application Service that orchestrates the complete
    analysis workflow using domain entities and infrastructure services.
    """
    
    def __init__(
        self,
        segment_extractor: AudioSegmentExtractor,
        audio_service: AudioAnalysisService,
        phoneme_service: IPhonemeRecognitionService,
        result_repo: IExerciseResultRepository,
        logger: ILogger,
    ):
        """
        Initialize result analysis service.
        
        Args:
            segment_extractor: Service for extracting audio segments
            audio_service: Service for audio analysis (preprocessing, transcription)
            phoneme_service: Service for phoneme recognition
            result_repo: Repository for persisting results
            logger: Logger instance
        """
        self._segment_extractor = segment_extractor
        self._audio_service = audio_service
        self._phoneme_service = phoneme_service
        self._result_repo = result_repo
        self._logger = logger
    
    async def analyze_result(
        self,
        result: ExerciseResult,
        expected_text: Optional[str] = None,
        expected_ipa: Optional[str] = None,
        language: str = "de",
    ) -> ExerciseResult:
        """
        Analyze an exercise result with full AI pipeline.
        
        Args:
            result: ExerciseResult entity to analyze
            expected_text: Expected text for comparison (optional)
            expected_ipa: Expected IPA transcription (optional)
            language: Language code for transcription (default: "de")
            
        Returns:
            Updated ExerciseResult with analysis data
            
        Raises:
            AudioProcessingError: If analysis fails
            FileNotFoundError: If audio file not found
        """
        try:
            # Mark as processing
            result.start_processing()
            await self._result_repo.update(result)
            
            self._logger.info(f"Starting analysis for result {result.id}")
            
            # Validate audio segment information
            if not result.has_audio_segment():
                raise AudioProcessingError(
                    "Result does not have audio segment information. "
                    "Call attach_audio_segment() first."
                )
            
            # Step 1: Extract audio segment
            self._logger.info(
                f"Extracting audio segment: {result.audio_segment_start_ms}ms - "
                f"{result.audio_segment_end_ms}ms"
            )
            audio_samples = await self._segment_extractor.extract_segment(
                audio_file_id=result.audio_file_id,
                start_ms=result.audio_segment_start_ms,
                end_ms=result.audio_segment_end_ms,
                output_sample_rate=16000,
            )
            
            # Step 2 & 3: Analyze audio with preprocessing
            # AudioAnalysisService handles:
            # - Noise reduction (spectral subtraction)
            # - Quality metric calculation
            # - Speech-to-text transcription
            # - Warning generation
            self._logger.info("Analyzing audio quality and transcribing")
            analysis_result = await self._audio_service.analyze_audio_stream(
                audio_samples=audio_samples,
                sample_rate=16000,
                language=language,
                apply_noise_reduction=True,
                skip_transcription=False,
            )
            
            # Extract quality metrics from analysis result
            quality_metrics = AudioQualityMetrics(
                snr_db=analysis_result.quality_metrics.snr_db or 0.0,
                rms_energy=analysis_result.quality_metrics.rms_energy or 0.0,
                clipping_detected=analysis_result.quality_metrics.clipping_detected,
                spectral_flatness=analysis_result.quality_metrics.spectral_flatness or 0.0,
                quality_level=self._calculate_quality_level(analysis_result.quality_metrics),
                is_suitable_for_therapy=self._is_suitable_for_therapy(analysis_result.quality_metrics),
                warnings=analysis_result.warnings,
            )
            result.set_audio_quality(quality_metrics)
            
            # Store analysis parameters
            result.analysis_parameters = {
                'language': language,
                'noise_reduction_applied': True,
                'noise_reduction_strength': 0.5,
                'model_version': 'whisper-base',
                'sample_rate': 16000,
            }
            
            # Set transcription from analysis result
            if analysis_result.transcription:
                result.set_transcription(
                    text=analysis_result.transcription,
                    confidence=analysis_result.confidence or 1.0,
                )
                self._logger.info(
                    f"Transcription: '{analysis_result.transcription}' "
                    f"(confidence: {analysis_result.confidence or 1.0:.2f})"
                )
            
            # Step 4: Phoneme recognition
            # Use the same preprocessed audio for consistency
            if result.transcription:
                self._logger.info("Performing phoneme recognition")
                try:
                    # Phoneme service expects numpy array at 16kHz
                    phoneme_result = await self._phoneme_service.predict(
                        audio=audio_samples,
                        sampling_rate=16000
                    )
                    
                    if phoneme_result.success:
                        # Extract phonemes list from result
                        phonemes = phoneme_result.phonemes
                        
                        # Convert phonemes list to IPA transcription
                        ipa_transcription = " ".join(phonemes)
                        
                        # Calculate phoneme accuracy if expected IPA provided
                        phoneme_accuracy = 1.0
                        common_errors = []
                        if expected_ipa:
                            phoneme_accuracy = self._calculate_phoneme_accuracy(
                                ipa_transcription,
                                expected_ipa
                            )
                            common_errors = self._identify_phoneme_errors(
                                phonemes,
                                expected_ipa
                            )
                        
                        phoneme_analysis = PhonemeAnalysis(
                            detected_phonemes=phonemes,
                            phoneme_accuracy=phoneme_accuracy,
                            common_errors=common_errors,
                            ipa_transcription=ipa_transcription,
                            expected_ipa=expected_ipa or "",
                        )
                        result.set_phoneme_analysis(phoneme_analysis)
                        
                        self._logger.info(
                            f"Phoneme analysis complete: IPA '{ipa_transcription}', "
                            f"accuracy: {phoneme_accuracy:.2f}, "
                            f"model: {phoneme_result.model}"
                        )
                    else:
                        self._logger.warning("Phoneme recognition returned unsuccessful status")
                    
                except Exception as e:
                    self._logger.warning(f"Phoneme recognition failed: {str(e)}")
                    # Continue without phoneme analysis
            
            # Step 5: Calculate evaluation scores
            self._logger.info("Calculating evaluation scores")
            evaluation_scores = self._calculate_evaluation_scores(
                result=result,
                expected_text=expected_text,
                expected_ipa=expected_ipa,
            )
            result.set_evaluation_scores(evaluation_scores)
            
            # Step 6: Mark as completed and save
            result.complete_processing()
            await self._result_repo.update(result)
            
            self._logger.info(
                f"Analysis completed for result {result.id}. "
                f"Overall score: {evaluation_scores.overall_score:.1f}"
            )
            
            return result
            
        except (AudioProcessingError, FileNotFoundError):
            # Re-raise these to be handled by caller
            raise
            
        except Exception as e:
            self._logger.error(f"Analysis failed for result {result.id}: {str(e)}")
            result.fail_processing(str(e))
            await self._result_repo.update(result)
            raise AudioProcessingError(f"Analysis failed: {str(e)}") from e
    
    def _calculate_quality_level(self, metrics) -> str:
        """
        Calculate overall quality level from metrics.
        
        Quality levels:
        - excellent: SNR ≥ 20 dB, RMS ≥ 0.05, no clipping
        - good: SNR ≥ 15 dB, RMS ≥ 0.03
        - fair: SNR ≥ 10 dB
        - poor: SNR < 10 dB or other severe issues
        
        Args:
            metrics: QualityMetrics from audio analysis
            
        Returns:
            Quality level string: 'excellent', 'good', 'fair', or 'poor'
        """
        # Handle None values (use worst-case defaults)
        snr_db = metrics.snr_db if metrics.snr_db is not None else 0.0
        rms_energy = metrics.rms_energy if metrics.rms_energy is not None else 0.0
        
        if snr_db >= 20 and rms_energy >= 0.05 and not metrics.clipping_detected:
            return "excellent"
        elif snr_db >= 15 and rms_energy >= 0.03:
            return "good"
        elif snr_db >= 10:
            return "fair"
        else:
            return "poor"
    
    def _is_suitable_for_therapy(self, metrics) -> bool:
        """
        Determine if audio quality is suitable for therapy feedback.
        
        Criteria:
        - SNR ≥ 12 dB (clear speech over noise)
        - RMS ≥ 0.02 (audible level)
        - No clipping (undistorted)
        - Spectral flatness < 0.6 (not too noisy)
        
        Args:
            metrics: QualityMetrics from audio analysis
            
        Returns:
            True if suitable for therapy analysis, False otherwise
        """
        # Handle None values conservatively
        snr_db = metrics.snr_db if metrics.snr_db is not None else 0.0
        rms_energy = metrics.rms_energy if metrics.rms_energy is not None else 0.0
        spectral_flatness = metrics.spectral_flatness if metrics.spectral_flatness is not None else 1.0
        
        return (
            snr_db >= 12 and
            rms_energy >= 0.02 and
            not metrics.clipping_detected and
            spectral_flatness < 0.6
        )
    
    def _calculate_phoneme_accuracy(
        self,
        detected_ipa: str,
        expected_ipa: str,
    ) -> float:
        """
        Calculate phoneme accuracy score using sequence matching.
        
        Args:
            detected_ipa: Detected IPA transcription
            expected_ipa: Expected IPA transcription
            
        Returns:
            Accuracy score (0.0 - 1.0)
        """
        if not expected_ipa:
            return 1.0
        
        # Use SequenceMatcher for similarity
        matcher = SequenceMatcher(None, detected_ipa, expected_ipa)
        return matcher.ratio()
    
    def _identify_phoneme_errors(
        self,
        detected_phonemes: list[str],
        expected_ipa: str,
    ) -> list[str]:
        """
        Identify common phoneme errors by comparing detected vs expected.
        
        Args:
            detected_phonemes: List of detected phoneme strings
            expected_ipa: Expected IPA transcription
            
        Returns:
            List of error descriptions
        """
        errors = []
        
        # Split expected IPA into phonemes (simple space-based split)
        expected_phonemes = expected_ipa.split()
        
        # Compare sequences
        for i, detected_phoneme in enumerate(detected_phonemes):
            if i < len(expected_phonemes):
                expected_phoneme = expected_phonemes[i]
                
                if detected_phoneme != expected_phoneme:
                    errors.append(
                        f"Position {i+1}: expected '{expected_phoneme}', "
                        f"detected '{detected_phoneme}'"
                    )
        
        # Check for length mismatch
        if len(detected_phonemes) != len(expected_phonemes):
            errors.append(
                f"Length mismatch: expected {len(expected_phonemes)} phonemes, "
                f"detected {len(detected_phonemes)}"
            )
        
        return errors[:5]  # Limit to first 5 errors
    
    def _calculate_evaluation_scores(
        self,
        result: ExerciseResult,
        expected_text: Optional[str],
        expected_ipa: Optional[str],
    ) -> EvaluationScores:
        """
        Calculate comprehensive evaluation scores.
        
        Scoring factors:
        - Accuracy: Transcription match with expected text
        - Pronunciation: Phoneme accuracy
        - Fluency: Audio quality and clarity
        - Overall: Weighted average
        
        Args:
            result: ExerciseResult with analysis data
            expected_text: Expected text (optional)
            expected_ipa: Expected IPA (optional)
            
        Returns:
            EvaluationScores value object
        """
        # Base scores (neutral starting point)
        accuracy = 70.0
        pronunciation = 70.0
        fluency = 70.0
        
        # Adjust for transcription accuracy
        if expected_text and result.transcription:
            matcher = SequenceMatcher(None, result.transcription.lower(), expected_text.lower())
            ratio = matcher.ratio()
            accuracy = ratio * 100
            
            # Boost for high confidence
            if result.transcription_confidence and result.transcription_confidence > 0.9:
                accuracy = min(100, accuracy * 1.05)
        
        # Adjust for phoneme accuracy
        if result.phoneme_analysis:
            pronunciation = result.phoneme_analysis.phoneme_accuracy * 100
            
            # Penalty for common errors
            if result.phoneme_analysis.common_errors:
                error_penalty = min(10, len(result.phoneme_analysis.common_errors) * 2)
                pronunciation = max(0, pronunciation - error_penalty)
        
        # Adjust for audio quality
        if result.audio_quality_metrics:
            quality_map = {
                'excellent': 95.0,
                'good': 85.0,
                'fair': 70.0,
                'poor': 50.0,
            }
            fluency = quality_map.get(result.audio_quality_metrics.quality_level, 70.0)
            
            # Penalty for warnings
            if result.audio_quality_metrics.warnings:
                warning_penalty = min(15, len(result.audio_quality_metrics.warnings) * 5)
                fluency = max(0, fluency - warning_penalty)
        
        # Calculate overall score (weighted average)
        # Pronunciation is most important for speech therapy
        overall = (
            accuracy * 0.25 +
            pronunciation * 0.50 +
            fluency * 0.25
        )
        
        # Clamp all scores to 0-100 range
        return EvaluationScores(
            accuracy_score=max(0, min(100, accuracy)),
            pronunciation_score=max(0, min(100, pronunciation)),
            fluency_score=max(0, min(100, fluency)),
            overall_score=max(0, min(100, overall)),
        )
