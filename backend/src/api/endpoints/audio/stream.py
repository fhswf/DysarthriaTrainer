"""
Audio Streaming WebSocket Endpoint

Real-time audio streaming with live transcription and quality monitoring.
"""

import base64
import json
from typing import Optional

import numpy as np
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from numpy.typing import NDArray

from src.api.helpers.connection_manager import ConnectionManager
from src.api.dependencies import get_audio_analysis_service, get_connection_manager, get_logger
from src.application.services.audio_analysis_service import AudioAnalysisService
from src.core.ports.utils.logger_protocol import ILogger


router = APIRouter()


@router.websocket("/ws/stream")
async def audio_stream_endpoint(
    websocket: WebSocket,
    audio_service: AudioAnalysisService = Depends(get_audio_analysis_service),
    connection_manager: ConnectionManager = Depends(get_connection_manager),
    logger: ILogger = Depends(get_logger),
    enable_transcription: bool = Query(default=False),  # Default: no transcription
    session_id: Optional[str] = Query(default=None),  # Optional session ID to link audio
):
    """
    WebSocket endpoint for real-time audio streaming and transcription.
    
    Query Parameters:
    - enable_transcription (bool): Enable/disable Whisper transcription (default: False)
      - When False, only quality metrics are computed (faster processing)
      - When True, full transcription is performed on all chunks
    
    Protocol:
    1. Client sends audio chunks as JSON: {"audio_data": "base64...", "chunk_index": 0, "is_final": false}
    2. Server processes each chunk and responds with partial transcription (if enabled)
    3. On final chunk (is_final=true), server returns complete analysis with quality metrics
    
    Audio format:
    - WAV format recommended (16kHz, 16-bit PCM, mono)
    - Chunks should be 1-2 seconds of audio
    - Base64-encoded for transmission
    
    Example client message:
    ```json
    {
        "audio_data": "UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=",
        "chunk_index": 0,
        "is_final": false
    }
    ```
    
    Example server response (partial):
    ```json
    {
        "chunk_index": 0,
        "transcription": "Das ist ein",
        "is_final": false,
        "quality_metrics": null,
        "warnings": []
    }
    ```
    
    Example server response (final):
    ```json
    {
        "chunk_index": 5,
        "transcription": "Das ist ein Test der Audioaufnahme.",
        "is_final": true,
        "quality_metrics": {
            "snr_db": 18.5,
            "rms_energy": 0.35,
            "clipping_detected": false,
            "spectral_flatness": 0.25
        },
        "warnings": []
    }
    ```
    """
    await connection_manager.connect(websocket)
    logger.info(
        f"WebSocket connected: {websocket.client}, "
        f"transcription={'enabled' if enable_transcription else 'disabled'}, "
        f"session_id={session_id or 'none'}"
    )
    
    # Buffer for accumulating raw audio bytes (not decoded samples)
    raw_audio_buffer: list[bytes] = []
    chunk_count = 0
    session_uuid = None
    
    # Parse session_id if provided
    if session_id:
        try:
            from uuid import UUID
            session_uuid = UUID(session_id)
            logger.info(f"Audio will be linked to session: {session_uuid}")
        except ValueError:
            logger.warning(f"Invalid session_id format: {session_id}")
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Extract fields
            audio_data_b64 = message.get("audio_data")
            chunk_index = message.get("chunk_index", chunk_count)
            is_final = message.get("is_final", False)
            language = message.get("language", "de")
            
            if not audio_data_b64:
                await websocket.send_json({
                    "error": "Missing audio_data field",
                    "chunk_index": chunk_index,
                })
                continue
            
            # Decode audio data
            try:
                audio_bytes = base64.b64decode(audio_data_b64)
            except Exception as e:
                logger.error(f"Failed to decode base64 audio: {str(e)}")
                await websocket.send_json({
                    "error": "Invalid base64 audio data",
                    "chunk_index": chunk_index,
                })
                continue
            
            # Store raw bytes (don't decode yet)
            raw_audio_buffer.append(audio_bytes)
            chunk_count += 1
            
            logger.info(
                f"Received chunk {chunk_index}, "
                f"bytes={len(audio_bytes)}, is_final={is_final}"
            )
            
            # Process based on whether this is final chunk
            if is_final:
                # Concatenate all raw bytes
                full_audio_bytes = b"".join(raw_audio_buffer)
                
                logger.info(
                    f"Processing final audio: {len(full_audio_bytes)} bytes "
                    f"from {len(raw_audio_buffer)} chunks"
                )
                
                # Convert concatenated bytes to audio samples
                try:
                    full_audio = await audio_service._preprocessor.convert_to_wav(
                        full_audio_bytes,
                        output_sample_rate=16000,
                    )
                except Exception as e:
                    logger.error(f"Failed to convert final audio: {str(e)}")
                    await websocket.send_json({
                        "error": f"Audio conversion failed: {str(e)}",
                        "chunk_index": chunk_index,
                        "is_final": True,
                    })
                    raw_audio_buffer.clear()
                    chunk_count = 0
                    continue
                
                # Perform complete analysis
                try:
                    result = await audio_service.analyze_audio_stream(
                        full_audio,
                        sample_rate=16000,
                        language=language,
                        apply_noise_reduction=True,
                        skip_transcription=not enable_transcription,
                    )
                    
                    # Send final response with quality metrics
                    response = {
                        "chunk_index": chunk_index,
                        "transcription": result.transcription,
                        "is_final": True,
                        "quality_metrics": {
                            "snr_db": result.quality_metrics.snr_db,
                            "rms_energy": result.quality_metrics.rms_energy,
                            "clipping_detected": result.quality_metrics.clipping_detected,
                            "spectral_flatness": result.quality_metrics.spectral_flatness,
                        },
                        "warnings": result.warnings,
                        "processing_time_ms": result.processing_time_ms,
                    }
                    
                    await websocket.send_json(response)
                    logger.info(f"Sent final analysis: {len(result.transcription)} chars")
                    
                    # Save audio to database if session_id provided
                    if session_uuid:
                        logger.warning(f"Session audio storage not yet implemented for session {session_uuid}. "
                                     f"Frontend should save audio via REST API after WebSocket completes.")
                    
                    # Clear buffer for next recording
                    raw_audio_buffer.clear()
                    chunk_count = 0
                    
                except Exception as e:
                    logger.error(f"Analysis failed: {str(e)}")
                    await websocket.send_json({
                        "error": f"Analysis failed: {str(e)}",
                        "chunk_index": chunk_index,
                        "is_final": True,
                    })
            
            else:
                # Partial processing - analyze ONLY the latest chunk for quality feedback
                # Note: We can't concatenate WebM/Opus chunks because they have container headers
                # So we analyze the most recent chunk independently for real-time quality metrics
                try:
                    # Decode the latest chunk only
                    latest_audio = await audio_service._preprocessor.convert_to_wav(
                        audio_bytes,  # Just the current chunk
                        output_sample_rate=16000,
                    )
                    
                    # Quick analysis with optional transcription
                    # Skip transcription for partial chunks if disabled for faster processing
                    result = await audio_service.analyze_audio_stream(
                        latest_audio,
                        sample_rate=16000,
                        language=language,
                        apply_noise_reduction=False,  # Skip for speed
                        skip_transcription=not enable_transcription,
                    )
                    
                    # Send partial response WITH quality metrics from latest chunk
                    response = {
                        "chunk_index": chunk_index,
                        "transcription": result.transcription,
                        "is_final": False,
                        "quality_metrics": {
                            "snr_db": result.quality_metrics.snr_db,
                            "rms_energy": result.quality_metrics.rms_energy,
                            "clipping_detected": result.quality_metrics.clipping_detected,
                            "spectral_flatness": result.quality_metrics.spectral_flatness,
                        },
                        "warnings": result.warnings,
                    }
                    
                    await websocket.send_json(response)
                    logger.info(
                        f"Sent partial analysis: {len(result.transcription)} chars, "
                        f"SNR: {result.quality_metrics.snr_db:.1f}dB"
                    )
                    
                except Exception as e:
                    logger.warning(f"Partial analysis failed: {str(e)}")
                    # Don't send error for partial failures - send empty response
                    await websocket.send_json({
                        "chunk_index": chunk_index,
                        "transcription": "",
                        "is_final": False,
                        "quality_metrics": None,
                        "warnings": [],
                    })
    
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
        logger.info(f"WebSocket disconnected: {websocket.client}")
    
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        try:
            await websocket.send_json({"error": f"Server error: {str(e)}"})
        except:
            pass
        connection_manager.disconnect(websocket)


@router.get("/ws/audio/status")
async def websocket_status():
    """
    Get current WebSocket connection status.
    
    Returns:
        Connection count and status information
    """
    return {
        "active_connections": connection_manager.active_connections,
        "status": "operational",
    }
