from fastapi import APIRouter

from src.api.endpoints.exercise.categories import create_categories_router
from src.api.endpoints.exercise.exercises import create_exercises_router
from src.api.endpoints.exercise.items import create_items_router


def create_exercise_router() -> APIRouter:
    router = APIRouter(
        prefix="/exercise",
        tags=["Exercises"],
    )

    sub_routers = (
        create_categories_router(),
        create_exercises_router(),
        create_items_router(),
    )

    for sub_router in sub_routers:
        router.include_router(sub_router)

    return router
