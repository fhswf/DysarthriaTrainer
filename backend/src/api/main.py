from fastapi import APIRouter
from fastapi.responses import RedirectResponse

from src.api.api_v1_router import create_api_v1_router


def create_root_router() -> APIRouter:
    router = APIRouter()

    async def redirect_to_docs() -> RedirectResponse:
        return RedirectResponse(url="docs/")

    router.add_api_route(
        "/",
        redirect_to_docs,
        methods=["GET"],
        tags=["General"],
        include_in_schema=False
    )

    sub_routers = (create_api_v1_router(),)

    for sub_router in sub_routers:
        router.include_router(sub_router)

    return router
