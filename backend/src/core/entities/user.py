from datetime import datetime

from src.core.entities.base import Entity


class User(Entity):
    # Core fields
    username: str
    hashed_password: str
    email: str | None = None
    full_name: str | None = None
    disabled: bool | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    
    # Authentication fields
    email_verified: bool = False
    failed_login_attempts: int = 0
    locked_until: datetime | None = None
    last_login: datetime | None = None
    last_password_change: datetime | None = None
    
    # Password reset
    password_reset_token: str | None = None
    password_reset_sent_at: datetime | None = None
    
    # Email verification  
    email_verification_token: str | None = None
    email_verification_sent_at: datetime | None = None
