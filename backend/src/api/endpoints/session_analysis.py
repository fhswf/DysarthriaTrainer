"""
Session Analysis API Endpoints

RESTful endpoints for analyzing practice session results with AI-powered
audio analysis, transcription, phoneme recognition, and evaluation.
"""

# Standard library
import asyncio
from typing import Annotated
from uuid import UUID

# Third-party
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    status,
)

# Local imports
from src.api.dependencies import (
    get_connection_manager,
    get_current_user,
    get_logger,
    get_practice_session_repository,
    get_session_analysis_orchestrator,
)
from src.api.helpers.connection_manager import ConnectionManager
from src.application.services.session_analysis_orchestrator import (
    AnalysisProgress,
    SessionAnalysisOrchestrator,
)
from src.core.entities.user import User
from src.core.ports.repositories.practice_session_repository import IPracticeSessionRepository
from src.core.ports.utils.logger_protocol import ILogger


router = APIRouter(
    prefix="/analyze",
    tags=["Session Analysis"],
)


@router.post(
    "/sessions/{session_id}/analyze",
    summary="Analyze practice session",
    description="Start AI analysis of all exercise results in a practice session",
    status_code=status.HTTP_202_ACCEPTED,
)
async def analyze_session(
    session_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    orchestrator: Annotated[SessionAnalysisOrchestrator, Depends(get_session_analysis_orchestrator)],
    connection_manager: Annotated[ConnectionManager, Depends(get_connection_manager)],
    session_repo: Annotated[IPracticeSessionRepository, Depends(get_practice_session_repository)],
    logger: Annotated[ILogger, Depends(get_logger)],
):
    """
    Start analysis of a practice session.
    
    The analysis runs in the background and sends progress updates
    via WebSocket to `/ws/analyze/{session_id}`.
    
    Returns immediately with job status.
    
    **Manual Testing**:
    - Authenticate with: admin@example.com / Admin123!
    - Use session: 742e5e7f-2bc7-4053-8b5e-4f531dbbedba
    
    **Authentication**: Requires valid JWT token
    """
    # Verify session exists
    session = await session_repo.get_by_id(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Practice session not found: {session_id}"
        )
    
    # Check if analysis is already running
    if orchestrator.is_analysis_running(session_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Analysis already running for this session"
        )
    
    logger.info(
        f"Starting analysis for session {session_id} (user: {current_user.id})"
    )
    
    # Define progress callback for WebSocket updates
    async def send_progress(progress: AnalysisProgress):
        """Send progress updates via WebSocket."""
        await connection_manager.broadcast_to_group(
            group=f"session_analysis_{session_id}",
            message={
                "type": "analysis_progress",
                "session_id": str(session_id),
                "status": progress.status.value,
                "total_results": progress.total_results,
                "processed_results": progress.processed_results,
                "progress_percentage": progress.progress_percentage,
                "current_result_id": str(progress.current_result_id) if progress.current_result_id else None,
                "errors_count": len(progress.errors),
                "errors": progress.errors,
                "started_at": progress.started_at,
                "completed_at": progress.completed_at,
            }
        )
    
    # Start analysis in background with slight delay to allow WebSocket connection
    async def delayed_analysis():
        # Wait 100ms for WebSocket to connect
        await asyncio.sleep(0.1)
        await orchestrator.analyze_session(
            session_id=session_id,
            progress_callback=send_progress,
        )
    
    background_tasks.add_task(delayed_analysis)
    
    return {
        "message": "Analysis started",
        "session_id": str(session_id),
        "websocket_url": f"/api/v1/analyze/ws/sessions/{session_id}",
        "status_url": f"/api/v1/analyze/sessions/{session_id}/status",
    }


@router.get(
    "/sessions/{session_id}/status",
    summary="Get analysis status",
    description="Get current analysis progress for a session",
)
async def get_analysis_status(
    session_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    orchestrator: Annotated[SessionAnalysisOrchestrator, Depends(get_session_analysis_orchestrator)],
    session_repo: Annotated[IPracticeSessionRepository, Depends(get_practice_session_repository)],
    logger: Annotated[ILogger, Depends(get_logger)],
):
    """
    Get current analysis status.
    
    Returns progress information if analysis is active or recently completed.
    
    **Authentication**: Requires valid JWT token
    """
    # Verify session exists
    session = await session_repo.get_by_id(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Practice session not found: {session_id}"
        )
    
    # Get progress
    progress = orchestrator.get_analysis_progress(session_id)
    
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active or recent analysis found for this session"
        )
    
    return {
        "session_id": str(session_id),
        "status": progress.status.value,
        "total_results": progress.total_results,
        "processed_results": progress.processed_results,
        "progress_percentage": progress.progress_percentage,
        "current_result_id": str(progress.current_result_id) if progress.current_result_id else None,
        "errors_count": len(progress.errors),
        "errors": progress.errors,
        "started_at": progress.started_at,
        "completed_at": progress.completed_at,
    }


@router.websocket("/ws/sessions/{session_id}")
async def analysis_websocket(
    session_id: UUID,
    websocket: WebSocket,
    connection_manager: Annotated[ConnectionManager, Depends(get_connection_manager)],
    logger: Annotated[ILogger, Depends(get_logger)],
    # Note: WebSocket authentication typically uses token from query params or headers
    # For now, we'll allow connection - consider adding token verification in production
):
    """
    WebSocket endpoint for real-time analysis progress updates.
    
    The client connects before starting the analysis to receive
    progress updates throughout the processing.
    
    **Connection**: Connect before calling POST /analyze
    **Group**: Each session has its own broadcast group
    
    **Message format**:
    ```json
    {
        "type": "analysis_progress",
        "session_id": "uuid",
        "status": "running",
        "total_results": 10,
        "processed_results": 3,
        "progress_percentage": 30.0,
        "current_result_id": "uuid",
        "errors": []
    }
    ```
    
    **WebSocket Authentication**:
    In production, add token verification:
    - Query param: ?token=<jwt_token>
    - Connection header: Sec-WebSocket-Protocol
    - Or send token in first message
    
    Example:
    ```python
    token = request.query_params.get("token")
    try:
        claims = jwt_handler.decode_token(token)
        user_id = claims.get("sub")
        # Verify user owns session...
    except:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    ```
    """
    group = f"session_analysis_{session_id}"
    
    await connection_manager.connect_to_group(websocket, group)
    logger.info(f"WebSocket connected to analysis: {session_id}")
    
    try:
        # Keep connection alive and handle client messages
        while True:
            # Wait for client messages (e.g., ping/pong, status queries)
            data = await websocket.receive_text()
            
            # Echo back for connection health check
            if data == "ping":
                await websocket.send_text("pong")
            
            # Could handle other commands here
            # e.g., "status" -> send current progress
            
    except WebSocketDisconnect:
        connection_manager.disconnect_from_group(websocket, group)
        logger.info(f"WebSocket disconnected from analysis: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {str(e)}")
        connection_manager.disconnect_from_group(websocket, group)
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass
