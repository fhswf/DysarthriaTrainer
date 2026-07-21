"""
SQLAlchemy implementation of PracticeSessionRepository
"""

from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, func, Result, Select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.entities.practice_session import PracticeSession, SessionStatus
from src.core.ports.repositories.practice_session_repository import IPracticeSessionRepository
from src.infrastructure.persistence.sqla.models.practice_session_model import PracticeSessionModel
from src.infrastructure.persistence.sqla.repositories.base import BaseRepository


class PracticeSessionRepository(BaseRepository[PracticeSessionModel, PracticeSession], IPracticeSessionRepository):
    """SQLAlchemy implementation of practice session repository."""
    
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(PracticeSessionModel, session)
    
    async def create(self, session: PracticeSession) -> PracticeSession:
        """Create a new practice session."""
        session_db = self.to_orm(session)
        self._session.add(session_db)
        await self._session.commit()
        await self._session.refresh(session_db)
        return self.to_domain(session_db)
    
    async def find_by_id(self, session_id: UUID) -> Optional[PracticeSession]:
        """Find practice session by ID."""
        session_db = await self._session.get(self._model, session_id)
        return self.to_domain(session_db) if session_db else None
    
    async def update(self, session: PracticeSession) -> PracticeSession:
        """Update existing practice session."""
        session_db = self.to_orm(session)
        merged = await self._session.merge(session_db)
        await self._session.commit()
        await self._session.refresh(merged)
        return self.to_domain(merged)
    
    async def find_all(
        self,
        status: Optional[SessionStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[PracticeSession]:
        """Find all practice sessions, optionally filtered by status."""
        stmt: Select = select(self._model)
        
        if status:
            stmt = stmt.where(self._model.status == status.value)
        
        stmt = (
            stmt
            .order_by(self._model.started_at.desc())
            .offset(offset)
            .limit(limit)
        )
        
        result: Result = await self._session.execute(stmt)
        sessions_db = result.scalars().all()
        return [self.to_domain(session_db) for session_db in sessions_db]
    
    async def find_by_user(
        self,
        user_id: UUID,
        status: Optional[SessionStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[PracticeSession]:
        """Find practice sessions for a user, optionally filtered by status."""
        stmt: Select = (
            select(self._model)
            .where(self._model.user_id == user_id)
        )
        
        if status:
            stmt = stmt.where(self._model.status == status.value)
        
        stmt = (
            stmt
            .order_by(self._model.started_at.desc())
            .offset(offset)
            .limit(limit)
        )
        
        result: Result = await self._session.execute(stmt)
        sessions_db = result.scalars().all()
        return [self.to_domain(session_db) for session_db in sessions_db]
    
    async def find_by_exercise(
        self,
        exercise_id: UUID,
        limit: int = 50,
        offset: int = 0
    ) -> List[PracticeSession]:
        """Find all practice sessions for a specific exercise."""
        stmt: Select = (
            select(self._model)
            .where(self._model.exercise_id == exercise_id)
            .order_by(self._model.started_at.desc())
            .offset(offset)
            .limit(limit)
        )
        
        result: Result = await self._session.execute(stmt)
        sessions_db = result.scalars().all()
        return [self.to_domain(session_db) for session_db in sessions_db]
    
    async def count_all(
        self,
        status: Optional[SessionStatus] = None
    ) -> int:
        """Count all practice sessions, optionally filtered by status."""
        stmt = select(func.count()).select_from(self._model)
        
        if status:
            stmt = stmt.where(self._model.status == status.value)
        
        result: Result = await self._session.execute(stmt)
        return result.scalar() or 0
    
    async def count_by_user(
        self,
        user_id: UUID,
        status: Optional[SessionStatus] = None
    ) -> int:
        """Count practice sessions for a user, optionally filtered by status."""
        stmt = select(func.count()).select_from(self._model).where(
            self._model.user_id == user_id
        )
        
        if status:
            stmt = stmt.where(self._model.status == status.value)
        
        result: Result = await self._session.execute(stmt)
        return result.scalar() or 0
    
    async def delete(self, session_id: UUID) -> bool:
        """Delete a practice session by ID."""
        session_db = await self._session.get(self._model, session_id)
        if session_db is None:
            return False
        
        await self._session.delete(session_db)
        await self._session.commit()
        return True
    
    def to_domain(self, entity: PracticeSessionModel) -> PracticeSession:
        """Convert SQLAlchemy model to domain entity."""
        return PracticeSession(
            id=entity.id,
            user_id=entity.user_id,
            exercise_id=entity.exercise_id,
            started_at=entity.started_at,
            completed_at=entity.completed_at,
            status=SessionStatus(entity.status),
            total_items=entity.total_items,
            completed_items=entity.completed_items,
            session_audio_file_id=entity.session_audio_file_id,
            recording_started_at=entity.recording_started_at,
            recording_duration_ms=entity.recording_duration_ms,
            metadata=entity.session_metadata or {},
            created_at=entity.created_at,
            updated_at=entity.updated_at
        )
    
    def to_orm(self, model: PracticeSession) -> PracticeSessionModel:
        """Convert domain entity to SQLAlchemy model."""
        return PracticeSessionModel(
            id=model.id,
            user_id=model.user_id,
            exercise_id=model.exercise_id,
            started_at=model.started_at,
            completed_at=model.completed_at,
            status=model.status.value,
            total_items=model.total_items,
            completed_items=model.completed_items,
            session_audio_file_id=model.session_audio_file_id,
            recording_started_at=model.recording_started_at,
            recording_duration_ms=model.recording_duration_ms,
            session_metadata=model.metadata,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
