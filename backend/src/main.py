from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path

from src.configurations.logger import configure_logger
from src.configurations.lifetime import application_lifetime
from src.configurations.settings import settings
from src.api.main import create_root_router


def create_app() -> FastAPI:
    logger = configure_logger(name=__name__, lvl="DEBUG")
    logger.info("Creating FastAPI application")

    project_name = os.getenv("PROJECT_NAME", "MyApp")

    application = FastAPI(
        lifespan=application_lifetime,
        title=f"{project_name} Backend",
        description="This is a sample FastAPI application.",
        version="1.0.0",
    )
    
    # Add CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors.origins,
        allow_credentials=settings.cors.allow_credentials,
        allow_methods=settings.cors.allow_methods,
        allow_headers=settings.cors.allow_headers,
    )
    
    # Mount static files for media storage (if directory exists)
    media_path = Path(settings.media_storage.base_path)
    if media_path.exists():
        application.mount(
            settings.media_storage.base_url,
            StaticFiles(directory=str(media_path)),
            name="media"
        )
        logger.info(f"Mounted static media files at {settings.media_storage.base_url}")
    else:
        logger.warning(f"Media directory {media_path} does not exist, skipping static mount")
    
    application.include_router(create_root_router())
    return application


app = create_app()
