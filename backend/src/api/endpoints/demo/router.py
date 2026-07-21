from fastapi import APIRouter

from src.api.endpoints.demo.log import (
    create_logging_router,
)
from src.api.endpoints.demo.user import router as user_router
from src.api.endpoints.demo.sqla import router as sqla_router
from src.api.endpoints.demo.websocket import router as websocket_router
from src.api.endpoints.demo.phoneme_recognition import router as phonemerec_router


def create_demo_router() -> APIRouter:
    router = APIRouter(
        prefix="/demo",
        tags=["Demo"],
    )

    sub_routers = (
        create_logging_router(),
        user_router,
        sqla_router,
        websocket_router,
        phonemerec_router
    )

    for sub_router in sub_routers:
        router.include_router(sub_router)

    return router

# curl http://localhost:8000/api/v1/demo/<endpoint>/
