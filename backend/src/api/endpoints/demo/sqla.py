from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import URL, make_url
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_logger, get_db, Settings, get_app_config
from src.core.ports import ILogger

router = APIRouter(prefix="/sqla")

LoggingDep = Annotated[ILogger, Depends(get_logger)]
SessionDep = Annotated[AsyncSession, Depends(get_db().session)]

@router.get("/session_active/")
async def check_session_active(
        session: Annotated[AsyncSession, Depends(get_db().session)],
        logger: Annotated[ILogger, Depends(get_logger)],
) -> bool:
    is_active = session.is_active
    logger.debug(f"Session active: {is_active}")
    return is_active == True


@router.get("/db-test")
async def test_db_connection(
        session: Annotated[AsyncSession, Depends(get_db().session)],
        logger: Annotated[ILogger, Depends(get_logger)],
):
    try:
        # TODO
        value = "..."
        return {"status": "ok", "result": value}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


@router.get("/session_info/")
async def get_session_info(
        session: Annotated[AsyncSession, Depends(get_db().session)],
        config: Annotated[Settings, Depends(get_app_config)],
        logger: Annotated[ILogger, Depends(get_logger)],
) -> dict:
    url = make_url(config.database_url)
    info = {
        "is_active": session.is_active,
        "bind": str(session.get_bind()),
        "info": session.info,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    logger.debug(f"Session info: {info}")
    return info


@router.get("/url_info/")
async def get_url_info(
        config: Annotated[Settings, Depends(get_app_config)],
) -> dict:
    url = make_url(config.database_url)
    info = {
        "database_driver": url.drivername,
        "username": url.username,
        "host": url.host,
        "port": url.port,
        "database": url.database,
    }
    return info

# curl http://localhost:8000/api/v1/demo/sqla/<...>/
