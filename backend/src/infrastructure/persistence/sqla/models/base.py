from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped
from sqlalchemy import String, DateTime, Boolean, UUID


class Base(AsyncAttrs, DeclarativeBase):
    """
    Basisklasse für alle SQLAlchemy DB-Entities.
    Muss von allen Modellklassen (z.B. UserDB) geerbt werden.
    """
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
