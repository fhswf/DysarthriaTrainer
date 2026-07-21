"""
Session Analysis Orchestrator

Coordinates the analysis of all results in a practice session with progress tracking,
error handling, and WebSocket-based real-time updates.
"""

# Standard library
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from enum import Enum
from typing import Optional
from uuid import UUID

# Local imports
from src.application.services.result_analysis_service import ResultAnalysisService
from src.core.entities.exercise import Exercise
from src.core.entities.exercise_result import ExerciseResult
from src.core.entities.practice_session import PracticeSession
from src.core.exceptions.audio import AudioProcessingError
from src.core.ports.repositories.exercise import IExerciseRepository
from src.core.ports.repositories.exercise_item import IExerciseItemRepository
from src.core.ports.repositories.exercise_result_repository import IExerciseResultRepository
from src.core.ports.repositories.practice_session_repository import IPracticeSessionRepository
from src.core.ports.utils.logger_protocol import ILogger


class AnalysisStatus(Enum):
    """Analysis job status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class AnalysisProgress:
    """Progress information for session analysis."""
    session_id: UUID
    status: AnalysisStatus
    total_results: int
    processed_results: int
    current_result_id: Optional[UUID]
    errors: list[dict]
    started_at: float
    completed_at: Optional[float]
    
    @property
    def progress_percentage(self) -> float:
        """Calculate progress percentage."""
        if self.total_results == 0:
            return 100.0
        return (self.processed_results / self.total_results) * 100


class SessionAnalysisOrchestrator:
    """
    Orchestrates the analysis of all results in a session.
    
    Features:
    - Sequential result processing
    - Progress tracking with in-memory state
    - Error handling with retry logic
    - WebSocket progress updates via callback
    - Comprehensive logging
    
    This is an Application Service that coordinates multiple
    domain operations across repositories and services.
    """
    
    def __init__(
        self,
        result_service: ResultAnalysisService,
        session_repo: IPracticeSessionRepository,
        result_repo: IExerciseResultRepository,
        exercise_repo: IExerciseRepository,
        exercise_item_repo: IExerciseItemRepository,
        logger: ILogger,
    ):
        """
        Initialize session analysis orchestrator.
        
        Args:
            result_service: Service for analyzing individual results
            session_repo: Repository for practice sessions
            result_repo: Repository for exercise results
            exercise_repo: Repository for exercises
            logger: Logger instance
        """
        self._result_service = result_service
        self._session_repo = session_repo
        self._result_repo = result_repo
        self._exercise_repo = exercise_repo
        self._exercise_item_repo = exercise_item_repo
        self._logger = logger
        
        # Active analysis jobs (in-memory tracking)
        self._active_jobs: dict[UUID, AnalysisProgress] = {}
    
    async def analyze_session(
        self,
        session_id: UUID,
        progress_callback: Optional[Callable[[AnalysisProgress], Awaitable[None]]] = None,
    ) -> AnalysisProgress:
        """
        Analyze all results in a practice session.
        
        Args:
            session_id: ID of the practice session
            progress_callback: Optional async callback for progress updates
            
        Returns:
            Final analysis progress
            
        Raises:
            FileNotFoundError: If session doesn't exist
            AudioProcessingError: If critical error occurs
        """
        # Initialize progress tracker
        progress = AnalysisProgress(
            session_id=session_id,
            status=AnalysisStatus.PENDING,
            total_results=0,
            processed_results=0,
            current_result_id=None,
            errors=[],
            started_at=time.time(),
            completed_at=None,
        )
        
        self._active_jobs[session_id] = progress
        
        try:
            # Fetch session
            self._logger.info(f"Starting session analysis: {session_id}")
            session = await self._session_repo.get_by_id(session_id)
            if not session:
                raise FileNotFoundError(f"Practice session not found: {session_id}")
            
            # Fetch all results for this session
            results = await self._result_repo.find_by_session(session_id)
            progress.total_results = len(results)
            progress.status = AnalysisStatus.RUNNING
            
            self._logger.info(
                f"Session {session_id}: Found {len(results)} results to analyze"
            )
            
            # Notify initial progress
            if progress_callback:
                await progress_callback(progress)
            
            # Process each result sequentially
            for i, result in enumerate(results, 1):
                progress.current_result_id = result.id
                
                try:
                    self._logger.info(
                        f"Processing result {i}/{len(results)}: {result.id}"
                    )
                    
                    # Get exercise for expected values
                    exercise = None
                    exercise_item = None
                    if result.exercise_item_id:
                        exercise_item = await self._exercise_item_repo.get_by_id(
                            result.exercise_item_id
                        )
                        if exercise_item:
                            exercise = await self._exercise_repo.get_by_id(
                                exercise_item.exercise_id
                            )
                    
                    # Extract expected values from exercise
                    expected_text = None
                    expected_ipa = None
                    if exercise and exercise_item:
                        # Get expected text from exercise item
                        expected_text = getattr(exercise_item, 'prompt_text', None)
                        expected_ipa = getattr(exercise_item, 'expected_ipa', None)
                    
                    # Analyze result
                    # TODO: Get language from exercise or user preferences when available
                    # For now, default to German
                    await self._result_service.analyze_result(
                        result=result,
                        expected_text=expected_text,
                        expected_ipa=expected_ipa,
                        language="de",
                    )
                    
                    # Update progress
                    progress.processed_results += 1
                    
                    self._logger.info(
                        f"Result {result.id} analyzed successfully "
                        f"({progress.progress_percentage:.1f}% complete)"
                    )
                    
                except Exception as e:
                    # Log error but continue with other results
                    error_info = {
                        'result_id': str(result.id),
                        'error': str(e),
                        'timestamp': time.time(),
                    }
                    progress.errors.append(error_info)
                    
                    self._logger.error(
                        f"Failed to analyze result {result.id}: {str(e)}"
                    )
                    
                    # Still count as processed
                    progress.processed_results += 1
                
                # Notify progress after each result
                if progress_callback:
                    await progress_callback(progress)
            
            # Mark as completed
            progress.status = AnalysisStatus.COMPLETED
            progress.completed_at = time.time()
            progress.current_result_id = None
            
            duration = progress.completed_at - progress.started_at
            self._logger.info(
                f"Session analysis completed: {session_id}. "
                f"Processed: {progress.processed_results}/{progress.total_results}, "
                f"Errors: {len(progress.errors)}, "
                f"Duration: {duration:.1f}s"
            )
            
            # Final progress update
            if progress_callback:
                await progress_callback(progress)
            
            return progress
            
        except FileNotFoundError:
            # Re-raise session not found
            raise
            
        except Exception as e:
            # Mark as failed
            progress.status = AnalysisStatus.FAILED
            progress.completed_at = time.time()
            error_info = {
                'error': f"Critical error: {str(e)}",
                'timestamp': time.time(),
            }
            progress.errors.append(error_info)
            
            self._logger.error(f"Session analysis failed: {session_id}: {str(e)}")
            
            # Final progress update
            if progress_callback:
                await progress_callback(progress)
            
            raise AudioProcessingError(
                f"Session analysis failed: {str(e)}"
            ) from e
            
        finally:
            # Cleanup (keep in memory for status queries for a bit)
            # In production, might want to move to Redis or similar
            pass
    
    def get_analysis_progress(self, session_id: UUID) -> Optional[AnalysisProgress]:
        """
        Get current analysis progress for a session.
        
        Args:
            session_id: ID of the practice session
            
        Returns:
            AnalysisProgress if analysis is active or recently completed, None otherwise
        """
        return self._active_jobs.get(session_id)
    
    def is_analysis_running(self, session_id: UUID) -> bool:
        """
        Check if analysis is currently running for a session.
        
        Args:
            session_id: ID of the practice session
            
        Returns:
            True if analysis is currently running, False otherwise
        """
        progress = self._active_jobs.get(session_id)
        return progress is not None and progress.status == AnalysisStatus.RUNNING
    
    def clear_completed_job(self, session_id: UUID) -> bool:
        """
        Clear a completed analysis job from memory.
        
        Args:
            session_id: ID of the practice session
            
        Returns:
            True if job was removed, False if not found or still running
        """
        progress = self._active_jobs.get(session_id)
        if progress and progress.status in (AnalysisStatus.COMPLETED, AnalysisStatus.FAILED):
            del self._active_jobs[session_id]
            self._logger.info(f"Cleared completed analysis job: {session_id}")
            return True
        return False
    
    def get_active_jobs_count(self) -> int:
        """
        Get the number of currently active analysis jobs.
        
        Returns:
            Count of active jobs
        """
        return len([
            job for job in self._active_jobs.values()
            if job.status == AnalysisStatus.RUNNING
        ])
