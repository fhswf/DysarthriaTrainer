from pydantic import (
    PostgresDsn, Field
)
from pydantic_settings import BaseSettings


class DatabaseConfig(BaseSettings):
    url: str
    echo: bool = False
    pool_size: int = Field(default=5, ge=1, le=20)
    ...
