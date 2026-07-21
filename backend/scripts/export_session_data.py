"""
Export the latest practice session with all related data to JSON.

This script fetches the most recent practice session including:
- Session metadata
- All exercise results
- Associated audio file information
"""

import asyncio
import json
import sys
from pathlib import Path
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

# Add parent directory to path to allow imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.infrastructure.persistence.database import async_session_maker
from src.infrastructure.persistence.models import (
    PracticeSessionModel,
    ExerciseResultModel,
    MediaFileModel,
)


async def get_latest_session_with_details():
    """Fetch the latest practice session with all related data."""
    async with async_session_maker() as session:
        # Get the most recent practice session with all relationships
        stmt = (
            select(PracticeSessionModel)
            .options(
                selectinload(PracticeSessionModel.results),
                selectinload(PracticeSessionModel.audio_file),
            )
            .order_by(desc(PracticeSessionModel.created_at))
            .limit(1)
        )
        result = await session.execute(stmt)
        practice_session = result.scalar_one_or_none()

        if not practice_session:
            return {"error": "No sessions found"}

        # Convert to dict with all details
        session_data = {
            "metadata": {
                "export_timestamp": asyncio.get_event_loop().time(),
                "description": "Latest practice session with all related records",
            },
            "session": {
                "id": str(practice_session.id),
                "user_id": str(practice_session.user_id),
                "exercise_id": str(practice_session.exercise_id),
                "status": (
                    practice_session.status.value
                    if hasattr(practice_session.status, "value")
                    else str(practice_session.status)
                ),
                "started_at": (
                    practice_session.started_at.isoformat()
                    if practice_session.started_at
                    else None
                ),
                "completed_at": (
                    practice_session.completed_at.isoformat()
                    if practice_session.completed_at
                    else None
                ),
                "recording_started_at": (
                    practice_session.recording_started_at.isoformat()
                    if practice_session.recording_started_at
                    else None
                ),
                "recording_duration_ms": practice_session.recording_duration_ms,
                "total_items": practice_session.total_items,
                "completed_items": practice_session.completed_items,
                "session_audio_file_id": (
                    str(practice_session.session_audio_file_id)
                    if practice_session.session_audio_file_id
                    else None
                ),
                "metadata": practice_session.metadata,
                "created_at": practice_session.created_at.isoformat(),
                "updated_at": practice_session.updated_at.isoformat(),
            },
            "results": [],
            "audio_file": None,
            "statistics": {
                "total_results": len(practice_session.results),
                "total_duration_ms": 0,
                "average_duration_ms": 0,
            },
        }

        # Add results
        total_duration = 0
        for result in practice_session.results:
            result_data = {
                "id": str(result.id),
                "practice_session_id": str(result.practice_session_id),
                "exercise_item_id": str(result.exercise_item_id),
                "iteration_number": result.iteration_number,
                "started_at": (
                    result.started_at.isoformat() if result.started_at else None
                ),
                "completed_at": (
                    result.completed_at.isoformat() if result.completed_at else None
                ),
                "duration_ms": result.duration_ms,
                "audio_segment_start_ms": result.audio_segment_start_ms,
                "audio_segment_end_ms": result.audio_segment_end_ms,
                "audio_duration_ms": result.audio_duration_ms,
                "transcription": result.transcription,
                "audio_quality_score": (
                    float(result.audio_quality_score)
                    if result.audio_quality_score
                    else None
                ),
                "pronunciation_accuracy": (
                    float(result.pronunciation_accuracy)
                    if result.pronunciation_accuracy
                    else None
                ),
                "fluency_score": (
                    float(result.fluency_score) if result.fluency_score else None
                ),
                "completeness_score": (
                    float(result.completeness_score)
                    if result.completeness_score
                    else None
                ),
                "evaluation_results": result.evaluation_results,
                "analysis_parameters": result.analysis_parameters,
                "created_at": result.created_at.isoformat(),
            }
            session_data["results"].append(result_data)
            if result.duration_ms:
                total_duration += result.duration_ms

        # Update statistics
        if session_data["results"]:
            session_data["statistics"]["total_duration_ms"] = total_duration
            session_data["statistics"]["average_duration_ms"] = (
                total_duration / len(session_data["results"])
            )

        # Add audio file if exists
        if practice_session.audio_file:
            audio = practice_session.audio_file
            session_data["audio_file"] = {
                "id": str(audio.id),
                "file_type": (
                    audio.file_type.value
                    if hasattr(audio.file_type, "value")
                    else str(audio.file_type)
                ),
                "mime_type": audio.mime_type,
                "original_filename": audio.original_filename,
                "storage_path": audio.storage_path,
                "file_size_bytes": audio.file_size_bytes,
                "duration_seconds": audio.duration_seconds,
                "created_at": audio.created_at.isoformat(),
            }

        return session_data


async def main():
    """Main entry point."""
    data = await get_latest_session_with_details()
    print(json.dumps(data, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
