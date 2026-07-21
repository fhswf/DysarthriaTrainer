"""SecurityEvent SQLAlchemy model."""
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey, UUID as SQLUUID, Boolean, Text, JSON
from datetime import datetime, timezone
from uuid import UUID

from src.infrastructure.persistence.sqla.models.base import Base


class SecurityEvent(Base):
    """Security event model for audit logging."""
    __tablename__ = "security_events"

    user_id: Mapped[UUID | None] = mapped_column(
        SQLUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # Event details
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True, index=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Context
    success: Mapped[bool] = mapped_column(Boolean, nullable=False)
    event_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # Renamed from 'metadata'

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )

    # Relationships
    user: Mapped["User | None"] = relationship("User", back_populates="security_events")

    def __repr__(self) -> str:
        return f"<SecurityEvent(id={self.id!r}, type={self.event_type!r}, success={self.success!r})>"
