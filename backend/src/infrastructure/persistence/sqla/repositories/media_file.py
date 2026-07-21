from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, Result, Select, delete, func

from src.core.entities.media_file import MediaFile
from src.infrastructure.persistence.sqla.models.media_file_model import MediaFileModel
from src.infrastructure.persistence.sqla.repositories.base import BaseRepository
from src.core.ports.repositories.media_file import IMediaFileRepository


class MediaFileRepository(BaseRepository[MediaFileModel, MediaFile], IMediaFileRepository):
    """SQLAlchemy implementation of MediaFile repository."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(MediaFileModel, session)

    async def get_by_type(self, file_type: str) -> list[MediaFile]:
        """Retrieve all files of a specific type."""
        stmt: Select = (
            select(self._model)
            .where(self._model.file_type == file_type)
            .order_by(self._model.created_at.desc())
        )
        result: Result = await self._session.execute(stmt)
        entities_db = result.scalars().all()
        return [self.to_domain(entity_db) for entity_db in entities_db]

    async def get_by_created_by(self, user_id: str) -> list[MediaFile]:
        """Retrieve all files uploaded by a specific user."""
        stmt: Select = (
            select(self._model)
            .where(self._model.created_by == user_id)
            .order_by(self._model.created_at.desc())
        )
        result: Result = await self._session.execute(stmt)
        entities_db = result.scalars().all()
        return [self.to_domain(entity_db) for entity_db in entities_db]

    async def get_by_storage_path(self, storage_path: str) -> MediaFile | None:
        """Retrieve file by storage path."""
        stmt: Select = select(self._model).where(self._model.storage_path == storage_path)
        result: Result = await self._session.execute(stmt)
        entity_db: MediaFileModel | None = result.scalar_one_or_none()
        return self.to_domain(entity_db) if entity_db else None

    async def search_files(
        self,
        file_type: str | None = None,
        mime_type: str | None = None,
        created_by: str | None = None,
        min_size: int | None = None,
        max_size: int | None = None,
    ) -> list[MediaFile]:
        """Search files with multiple filters."""
        stmt: Select = select(self._model)
        
        if file_type:
            stmt = stmt.where(self._model.file_type == file_type)
        if mime_type:
            stmt = stmt.where(self._model.mime_type == mime_type)
        if created_by:
            stmt = stmt.where(self._model.created_by == created_by)
        if min_size is not None:
            stmt = stmt.where(self._model.file_size_bytes >= min_size)
        if max_size is not None:
            stmt = stmt.where(self._model.file_size_bytes <= max_size)
        
        stmt = stmt.order_by(self._model.created_at.desc())
        result: Result = await self._session.execute(stmt)
        entities_db = result.scalars().all()
        return [self.to_domain(entity_db) for entity_db in entities_db]

    async def get_orphaned_files(self) -> list[MediaFile]:
        """Find media files not referenced by any exercise content."""
        # TODO: Implement joins with exercise_instructions and exercise_item_contents
        # to find files not referenced in any URL fields
        stmt: Select = select(self._model).order_by(self._model.created_at.desc())
        result: Result = await self._session.execute(stmt)
        entities_db = result.scalars().all()
        return [self.to_domain(entity_db) for entity_db in entities_db]

    async def get_total_storage_used(self, created_by: str | None = None) -> int:
        """Calculate total storage used in bytes."""
        stmt = select(func.sum(self._model.file_size_bytes))
        if created_by:
            stmt = stmt.where(self._model.created_by == created_by)
        
        result = await self._session.execute(stmt)
        total = result.scalar()
        return total if total is not None else 0

    async def bulk_delete(self, file_ids: list[UUID]) -> int:
        """Delete multiple files at once."""
        stmt = delete(self._model).where(self._model.id.in_(file_ids))
        result = await self._session.execute(stmt)
        await self._session.commit()
        return result.rowcount

    def to_domain(self, entity: MediaFileModel) -> MediaFile:
        """Convert ORM model to domain entity."""
        return MediaFile(
            id=entity.id,
            file_type=entity.file_type,
            mime_type=entity.mime_type,
            original_filename=entity.original_filename,
            storage_path=entity.storage_path,
            cdn_url=entity.cdn_url,
            thumbnail_url=entity.thumbnail_url,
            file_size_bytes=entity.file_size_bytes,
            duration_seconds=entity.duration_seconds,
            width=entity.width,
            height=entity.height,
            metadata=entity.file_metadata,
            created_at=entity.created_at,
            created_by=entity.created_by,
        )

    def to_orm(self, model: MediaFile) -> MediaFileModel:
        """Convert domain entity to ORM model."""
        return MediaFileModel(
            id=model.id,
            file_type=model.file_type,
            mime_type=model.mime_type,
            original_filename=model.original_filename,
            storage_path=model.storage_path,
            cdn_url=model.cdn_url,
            thumbnail_url=model.thumbnail_url,
            file_size_bytes=model.file_size_bytes,
            duration_seconds=model.duration_seconds,
            width=model.width,
            height=model.height,
            file_metadata=model.metadata,
            created_at=model.created_at,
            created_by=model.created_by,
        )
