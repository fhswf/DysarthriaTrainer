"""
Audio endpoints package.

Includes:
- stream.py: WebSocket endpoint for real-time audio streaming
- recording.py: REST endpoints for audio recording CRUD operations
"""

from fastapi import APIRouter

from . import recording, stream

# Create audio router
audio_router = APIRouter(prefix="/audio", tags=["audio"])

# Include sub-routers
audio_router.include_router(recording.router, prefix="")
audio_router.include_router(stream.router, prefix="")

__all__ = ["audio_router"]
