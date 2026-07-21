from fastapi import APIRouter

from src.api.endpoints.auth.router import create_auth_router
from src.api.endpoints.general.router import create_general_router
from src.api.endpoints.users.router import create_user_router
from src.api.endpoints.exercise.router import create_exercise_router
from src.api.endpoints.media.router import router as media_router
from src.api.endpoints.audio import audio_router
from src.api.endpoints.practice_sessions import router as practice_sessions_router
from src.api.endpoints.exercise_results import router as exercise_results_router
from src.api.endpoints.session_analysis import router as session_analysis_router


def create_api_v1_router() -> APIRouter:
    router = APIRouter(
        prefix="/api/v1",
    )

    sub_routers = (
        create_general_router(),
        create_user_router(),
        create_auth_router(),
        create_exercise_router(),
        media_router,
        audio_router,
        practice_sessions_router,
        exercise_results_router,
        session_analysis_router,
        # Add more routers here as needed
    )

    if True:  # settings.environment == "local":
        from src.api.endpoints.demo.router import create_demo_router
        sub_routers += (create_demo_router(),)

    for sub_router in sub_routers:
        router.include_router(sub_router)

    return router
