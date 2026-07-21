from pathlib import Path

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request, HTTPException, Depends
from fastapi.responses import HTMLResponse
from starlette.websockets import WebSocketState
from typing import Annotated
from starlette.templating import Jinja2Templates

from src.api.dependencies import get_logger
from src.core.ports import ILogger

router = APIRouter(prefix="/ws_demo")


# https://fastapi.tiangolo.com/advanced/websockets/

@router.websocket("/simple_test_msg")
async def websocket_test(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json({"msg": "Hello WebSocket"})
    await websocket.close()


@router.websocket("/ws_proxied")
async def websocket_proxied_test(
        websocket: WebSocket,
        logger: Annotated[ILogger, Depends(get_logger)]
):
    try:
        await websocket.accept()
        while True:
            data = await websocket.receive_bytes()
            logger.debug(f"Received data of length {len(data)} bytes")
            # Logik...

    except WebSocketDisconnect:
        logger.debug("Client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if not websocket.client_state == WebSocketState.DISCONNECTED:
            await websocket.close(code=1011)
        logger.debug("Connection closed")


# Testen unter: http://localhost:8000/api/v1/demo/ws_demo/
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
templates = Jinja2Templates(directory=BASE_DIR.parent / "templates")
websocket_client_template = "websocket_demo.html"


@router.get("/", response_class=HTMLResponse)
async def get_websocket_client(request: Request):
    return templates.TemplateResponse(websocket_client_template, {"request": request})


@router.websocket("/client_echo")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Message text was: {data}")
