from datetime import datetime

from fastapi import APIRouter
from starlette.requests import Request


def create_healthcheck_router() -> APIRouter:
    router = APIRouter()

    async def healthcheck(_: Request) -> dict[str, str]:
        return {
            "status": "ok",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

    router.add_api_route(
        "/",
        healthcheck,
        methods=["GET"],
    )

    return router
