"""
Media file upload and management API endpoints.

Provides endpoints for uploading, retrieving, and managing media files
(images, audio, video) used in speech exercises.
"""

from typing import Annotated, Optional
from uuid import UUID
import io
import wave
import struct
import subprocess
import tempfile
import os

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    Query,
    status,
)
from fastapi.responses import StreamingResponse

from src.api.schemas.media import (
    MediaFileResponse,
    MediaFileDetailResponse,
    BulkDeleteRequest,
    BulkDeleteResponse,
    StorageStatsResponse,
)
from src.api.dependencies import get_media_service
from src.application.services.media_service import MediaService
from src.core.entities.user import User
from src.core.exceptions.exercise_exceptions import (
    MediaFileNotFoundError,
    MediaFileValidationError,
    InvalidMediaFileTypeError,
)


router = APIRouter(prefix="/media", tags=["Media"])


# ============================================================================
# Media File Upload & Retrieval
# ============================================================================


@router.post(
    "/upload",
    response_model=MediaFileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a media file",
    description="""
    Upload an image, audio, or video file for use in speech exercises.
    
    **Supported formats:**
    - Images: JPEG, PNG, GIF, WebP (max 10 MB)
    - Audio: MP3, WAV, OGG, MP4 (max 50 MB)
    - Video: MP4, WebM, OGG (max 200 MB)
    
    **Requires authentication.**
    """,
)
async def upload_media_file(
    file: Annotated[UploadFile, File(description="The media file to upload")],
    description: Annotated[str | None, Form()] = None,
    alt_text: Annotated[str | None, Form(description="Alternative text for images (accessibility)")] = None,
    duration_seconds: Annotated[int | None, Form(description="Duration for audio/video files")] = None,
    width: Annotated[int | None, Form(description="Image/video width in pixels")] = None,
    height: Annotated[int | None, Form(description="Image/video height in pixels")] = None,
    media_service: MediaService = Depends(get_media_service),
    # current_user: User = Depends(get_current_user),  # Uncomment when auth is ready
) -> MediaFileResponse:
    """Upload a new media file."""
    try:
        # Read file content
        file_content = await file.read()
        
        # Validate file was provided
        if not file_content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file content provided"
            )
        
        # Validate filename
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename is required"
            )
        
        # Validate MIME type
        if not file.content_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Content type is required"
            )
        
        # Build metadata dict
        metadata = {}
        if description:
            metadata["description"] = description
        if alt_text:
            metadata["alt_text"] = alt_text
        
        # Upload file via service
        media_file = await media_service.upload_file(
            file_content=file_content,
            original_filename=file.filename,
            mime_type=file.content_type,
            # created_by=str(current_user.id),  # Uncomment when auth is ready
            created_by=None,  # TODO: Get from authenticated user
            width=width,
            height=height,
            duration_seconds=duration_seconds,
            metadata=metadata if metadata else None,
        )
        
        # Convert to response schema
        return MediaFileResponse.model_validate(media_file)
        
    except InvalidMediaFileTypeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except MediaFileValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File validation failed: {e}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}"
        )


@router.get(
    "/{file_id}",
    summary="Stream media file",
    description="Stream the actual file content for playback in browser. Returns the file as an inline stream. Supports audio slicing with start_ms and end_ms query parameters.",
)
async def stream_media_file(
    file_id: UUID,
    start_ms: Annotated[Optional[int], Query(description="Start time in milliseconds for audio slicing")] = None,
    end_ms: Annotated[Optional[int], Query(description="End time in milliseconds for audio slicing")] = None,
    media_service: MediaService = Depends(get_media_service),
) -> StreamingResponse:
    """Stream media file content for inline playback with optional audio segment slicing."""
    try:
        content, mime_type, filename = await media_service.get_file_content(file_id)
        
        # If audio slicing is requested, slice it based on format
        if start_ms is not None and end_ms is not None:
            try:
                if mime_type == "audio/wav":
                    content = slice_wav_audio(content, start_ms, end_ms)
                elif mime_type in ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg"]:
                    content = slice_audio_ffmpeg(content, start_ms, end_ms, mime_type)
            except Exception as e:
                # If slicing fails, log and return full file
                print(f"Warning: Audio slicing failed: {e}")
        
        # Create streaming response with inline disposition for browser playback
        return StreamingResponse(
            io.BytesIO(content),
            media_type=mime_type,
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
                "Accept-Ranges": "bytes",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Range",
            }
        )
        
    except MediaFileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Media file {file_id} not found"
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Physical file not found in storage"
        )


def slice_audio_ffmpeg(audio_bytes: bytes, start_ms: int, end_ms: int, mime_type: str) -> bytes:
    """
    Slice audio file using ffmpeg to extract a segment between start_ms and end_ms.
    Works with WebM, MP4, MP3, OGG, and other formats.
    
    Args:
        audio_bytes: Original audio file content as bytes
        start_ms: Start time in milliseconds
        end_ms: End time in milliseconds
        mime_type: MIME type to determine output format
        
    Returns:
        Sliced audio file content as bytes
    """
    # Convert milliseconds to seconds for ffmpeg
    start_sec = start_ms / 1000.0
    duration_sec = (end_ms - start_ms) / 1000.0
    
    # Determine format from MIME type
    format_map = {
        "audio/webm": "webm",
        "audio/mp4": "mp4",
        "audio/mpeg": "mp3",
        "audio/ogg": "ogg",
    }
    output_format = format_map.get(mime_type, "webm")
    
    # Create temporary files
    with tempfile.NamedTemporaryFile(suffix=f".{output_format}", delete=False) as input_file:
        input_file.write(audio_bytes)
        input_path = input_file.name
    
    output_path = tempfile.mktemp(suffix=f".{output_format}")
    
    try:
        # Use ffmpeg to slice the audio
        cmd = [
            "ffmpeg",
            "-i", input_path,
            "-ss", str(start_sec),
            "-t", str(duration_sec),
            "-c", "copy",  # Copy codec without re-encoding for speed
            "-y",  # Overwrite output file
            output_path
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            # If copy fails, try re-encoding
            cmd = [
                "ffmpeg",
                "-i", input_path,
                "-ss", str(start_sec),
                "-t", str(duration_sec),
                "-y",
                output_path
            ]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                raise Exception(f"ffmpeg failed: {result.stderr}")
        
        # Read the sliced audio
        with open(output_path, "rb") as f:
            sliced_content = f.read()
        
        return sliced_content
        
    finally:
        # Cleanup temporary files
        try:
            os.unlink(input_path)
        except:
            pass
        try:
            os.unlink(output_path)
        except:
            pass


def slice_wav_audio(wav_bytes: bytes, start_ms: int, end_ms: int) -> bytes:
    """
    Slice a WAV audio file to extract a segment between start_ms and end_ms.
    
    Args:
        wav_bytes: Original WAV file content as bytes
        start_ms: Start time in milliseconds
        end_ms: End time in milliseconds
        
    Returns:
        Sliced WAV file content as bytes
    """
    # Read WAV file from bytes
    wav_input = io.BytesIO(wav_bytes)
    
    with wave.open(wav_input, 'rb') as wav_file:
        # Get WAV parameters
        n_channels = wav_file.getnchannels()
        sampwidth = wav_file.getsampwidth()
        framerate = wav_file.getframerate()
        n_frames = wav_file.getnframes()
        
        # Calculate frame positions
        start_frame = int((start_ms / 1000.0) * framerate)
        end_frame = int((end_ms / 1000.0) * framerate)
        
        # Ensure frames are within bounds
        start_frame = max(0, min(start_frame, n_frames))
        end_frame = max(start_frame, min(end_frame, n_frames))
        
        # Set position and read frames
        wav_file.setpos(start_frame)
        frames_to_read = end_frame - start_frame
        audio_data = wav_file.readframes(frames_to_read)
    
    # Create new WAV file with sliced content
    wav_output = io.BytesIO()
    
    with wave.open(wav_output, 'wb') as output_wav:
        output_wav.setnchannels(n_channels)
        output_wav.setsampwidth(sampwidth)
        output_wav.setframerate(framerate)
        output_wav.writeframes(audio_data)
    
    return wav_output.getvalue()


@router.get(
    "/{file_id}/metadata",
    response_model=MediaFileDetailResponse,
    summary="Get media file metadata",
    description="Retrieve metadata for a specific media file without downloading the content.",
)
async def get_media_file_metadata(
    file_id: UUID,
    media_service: MediaService = Depends(get_media_service),
) -> MediaFileDetailResponse:
    """Get media file metadata by ID."""
    try:
        media_file = await media_service.get_file_by_id(file_id)
        
        # Check if file is orphaned (not referenced by any exercise)
        # TODO: Implement check against exercise references
        is_orphaned = False
        
        return MediaFileDetailResponse.from_media_file(
            MediaFileResponse.model_validate(media_file),
            is_orphaned=is_orphaned
        )
        
    except MediaFileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Media file {file_id} not found"
        )


@router.get(
    "/{file_id}/download",
    summary="Download media file",
    description="Download the actual file content. Returns the file as a binary stream.",
)
async def download_media_file(
    file_id: UUID,
    media_service: MediaService = Depends(get_media_service),
) -> StreamingResponse:
    """Download media file content."""
    try:
        content, mime_type, filename = await media_service.get_file_content(file_id)
        
        # Create streaming response
        return StreamingResponse(
            io.BytesIO(content),
            media_type=mime_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
        
    except MediaFileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Media file {file_id} not found"
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Physical file not found in storage"
        )


@router.get(
    "/",
    response_model=list[MediaFileResponse],
    summary="List all media files",
    description="Get a list of all uploaded media files with optional filtering.",
)
async def list_media_files(
    file_type: str | None = None,
    mime_type: str | None = None,
    media_service: MediaService = Depends(get_media_service),
) -> list[MediaFileResponse]:
    """List all media files with optional filters."""
    try:
        if file_type:
            media_files = await media_service.get_files_by_type(file_type)
        else:
            # Get all files by searching without filters
            media_files = await media_service.search_files(
                file_type=file_type,
                mime_type=mime_type,
            )
        
        return [MediaFileResponse.model_validate(f) for f in media_files]
        
    except InvalidMediaFileTypeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============================================================================
# Media File Deletion
# ============================================================================


@router.delete(
    "/{file_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a media file",
    description="""
    Delete a media file by ID. This will remove both the database record
    and the physical file from storage.
    
    **Requires authentication and appropriate permissions.**
    """,
)
async def delete_media_file(
    file_id: UUID,
    media_service: MediaService = Depends(get_media_service),
    # current_user: User = Depends(get_current_user),  # Uncomment when auth is ready
) -> None:
    """Delete a media file."""
    try:
        # Check if file exists
        await media_service.get_file_by_id(file_id)
        
        # Delete the file
        deleted = await media_service.delete_file(file_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete media file"
            )
            
    except MediaFileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Media file {file_id} not found"
        )


@router.post(
    "/bulk-delete",
    response_model=BulkDeleteResponse,
    summary="Delete multiple media files",
    description="""
    Delete multiple media files at once. Maximum 100 files per request.
    
    **Requires authentication and appropriate permissions.**
    """,
)
async def bulk_delete_media_files(
    request: BulkDeleteRequest,
    media_service: MediaService = Depends(get_media_service),
    # current_user: User = Depends(get_current_user),  # Uncomment when auth is ready
) -> BulkDeleteResponse:
    """Delete multiple media files at once."""
    try:
        deleted_count = await media_service.bulk_delete_files(request.file_ids)
        failed_count = len(request.file_ids) - deleted_count
        
        return BulkDeleteResponse(
            deleted_count=deleted_count,
            failed_count=failed_count,
            errors=[] if failed_count == 0 else [
                f"Failed to delete {failed_count} files"
            ]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bulk delete failed: {str(e)}"
        )


# ============================================================================
# Storage Management & Analytics
# ============================================================================


@router.get(
    "/stats/storage",
    response_model=dict,
    summary="Get storage statistics",
    description="Get statistics about total storage usage.",
)
async def get_storage_stats(
    user_id: UUID | None = None,
    media_service: MediaService = Depends(get_media_service),
) -> dict:
    """Get storage usage statistics."""
    try:
        stats = await media_service.get_total_storage_used(
            user_id=str(user_id) if user_id else None
        )
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get storage stats: {str(e)}"
        )


@router.get(
    "/orphaned",
    response_model=list[MediaFileResponse],
    summary="List orphaned media files",
    description="""
    Get a list of media files that are not referenced by any exercise content.
    These files can be safely deleted to free up storage space.
    """,
)
async def list_orphaned_files(
    media_service: MediaService = Depends(get_media_service),
) -> list[MediaFileResponse]:
    """List files not referenced by any exercise."""
    try:
        orphaned_files = await media_service.get_orphaned_files()
        return [MediaFileResponse.model_validate(f) for f in orphaned_files]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get orphaned files: {str(e)}"
        )


@router.post(
    "/cleanup-orphaned",
    response_model=dict,
    summary="Delete orphaned media files",
    description="""
    Delete all media files that are not referenced by any exercise content.
    Use with caution - this action cannot be undone.
    
    **Requires authentication and admin permissions.**
    """,
)
async def cleanup_orphaned_files(
    media_service: MediaService = Depends(get_media_service),
    # current_user: User = Depends(require_admin),  # Uncomment when auth is ready
) -> dict:
    """Delete all orphaned media files."""
    try:
        deleted_count = await media_service.cleanup_orphaned_files()
        
        return {
            "deleted_count": deleted_count,
            "message": f"Successfully deleted {deleted_count} orphaned files"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cleanup failed: {str(e)}"
        )
