from pydantic import (AnyUrl, PostgresDsn, HttpUrl, computed_field, Field, BaseModel)
from pydantic_settings import BaseSettings, SettingsConfigDict

class ApplicationBuilderSettings(BaseSettings): ...


class JWTSettings(BaseModel):
    """JWT Configuration."""
    secret_key: str = Field(default="dev-secret-key-change-me-in-production")
    algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=15)
    refresh_token_expire_days: int = Field(default=7)
    private_key_path: str | None = Field(default=None)
    public_key_path: str | None = Field(default=None)


class PasswordSettings(BaseModel):
    """Password Policy Configuration."""
    min_length: int = Field(default=8)
    require_uppercase: bool = Field(default=True)
    require_lowercase: bool = Field(default=True)
    require_digits: bool = Field(default=True)
    require_special: bool = Field(default=False)


class SecuritySettings(BaseModel):
    """Security Configuration."""
    max_failed_login_attempts: int = Field(default=5)
    account_lockout_duration_minutes: int = Field(default=15)
    password_reset_token_expire_hours: int = Field(default=1)
    email_verification_token_expire_hours: int = Field(default=24)
    require_email_verification: bool = Field(default=True)


class RateLimitSettings(BaseModel):
    """Rate Limiting Configuration."""
    enabled: bool = Field(default=True)
    login: str = Field(default="5/minute")
    refresh: str = Field(default="10/minute")
    password_reset: str = Field(default="3/hour")


class CORSSettings(BaseModel):
    """CORS Configuration."""
    origins: list[str] = Field(default=[
        "http://localhost:5173",
        "https://35-234-119-225.nip.io"
    ])
    allow_credentials: bool = Field(default=True)
    allow_methods: list[str] = Field(default=["GET", "POST", "PUT", "PATCH", "DELETE"])
    allow_headers: list[str] = Field(default=["*"])


class EmailSettings(BaseModel):
    """Email Configuration."""
    smtp_host: str = Field(default="smtp.gmail.com")
    smtp_port: int = Field(default=587)
    smtp_user: str = Field(default="")
    smtp_password: str = Field(default="")
    email_from: str = Field(default="noreply@example.com")


class MediaStorageSettings(BaseModel):
    """Media Storage Configuration."""
    backend: str = Field(
        default="local",
        description="Storage backend type: local, s3, azure"
    )
    base_path: str = Field(
        default="/app/media",
        description="Base path for local file storage"
    )
    base_url: str = Field(
        default="/media",
        description="Base URL for serving files"
    )
    cdn_url: str | None = Field(
        default=None,
        description="CDN base URL for serving files"
    )
    
    # S3 settings (for future)
    s3_bucket: str | None = Field(default=None)
    s3_region: str | None = Field(default=None)
    s3_access_key: str | None = Field(default=None)
    s3_secret_key: str | None = Field(default=None)
    
    # Azure settings (for future)
    azure_account_name: str | None = Field(default=None)
    azure_account_key: str | None = Field(default=None)
    azure_container: str | None = Field(default=None)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file_encoding='utf-8',
        env_nested_delimiter='__',
        extra="ignore",
        case_sensitive=False
    )
    project_name: str = Field(default="Speech Training Application")
    version: str = Field(default="0.0.0", description="Application version")
    database_url: PostgresDsn = Field(
        default="postgresql+asyncpg://user:password@localhost:5432/speech_training_db",
        description="Database connection URL"
    )
    log_level: str = Field(default="info", description="Logging level for the application")
    
    # Authentication & Authorization settings
    jwt: JWTSettings = Field(default_factory=JWTSettings)
    password: PasswordSettings = Field(default_factory=PasswordSettings)
    security: SecuritySettings = Field(default_factory=SecuritySettings)
    rate_limit: RateLimitSettings = Field(default_factory=RateLimitSettings)
    cors: CORSSettings = Field(default_factory=CORSSettings)
    email: EmailSettings = Field(default_factory=EmailSettings)
    media_storage: MediaStorageSettings = Field(default_factory=MediaStorageSettings)


settings = Settings()  # type: ignore
