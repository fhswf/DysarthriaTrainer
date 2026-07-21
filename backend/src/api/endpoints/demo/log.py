from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, status, HTTPException
from starlette.requests import Request

from src.api.dependencies import get_logger
from src.core.ports import ILogger

def create_logging_router() -> APIRouter:
    router = APIRouter()

    async def log_message(
            _: Request,
            message: str,
            logger: Annotated[ILogger, Depends(get_logger)],
            #config: Annotated[Settings, Depends(get_app_config)],
    ) -> dict[str, str]:
        logger.debug(f"Demo log! Msg={message}")
        return {
            "success": "true",
            "message": message,
            "timestamp": datetime.now().isoformat()
        }

    router.add_api_route(
        "/log",
        log_message,
        methods=["GET"],
        status_code=status.HTTP_200_OK
    )

    return router
