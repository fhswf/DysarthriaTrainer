"""RefreshToken SQLAlchemy model."""
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey, UUID as SQLUUID
from datetime import datetime, timezone
from uuid import UUID

from src.infrastructure.persistence.sqla.models.base import Base


class RefreshToken(Base):
    """Refresh token model for JWT token management."""
    __tablename__ = "refresh_tokens"

    user_id: Mapped[UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    token_jti: Mapped[UUID] = mapped_column(
        SQLUUID(as_uuid=True),
        nullable=False,
        unique=True,
        index=True
    )
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Session metadata
    device_info: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)  # IPv6 max length
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Token lifecycle
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True
    )
    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    revoked: Mapped[bool] = mapped_column(default=False, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True
    )
    revoked_reason: Mapped[str | None] = mapped_column(String(100), nullable=True)
    replaced_by_jti: Mapped[UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")

    def __repr__(self) -> str:
        return f"<RefreshToken(id={self.id!r}, user_id={self.user_id!r}, jti={self.token_jti!r})>"
