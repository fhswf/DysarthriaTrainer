"""
SQLAlchemy implementation of RefreshToken repository.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select, update, delete, and_
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.entities.refresh_token import RefreshToken as RefreshTokenEntity
from src.core.ports.repositories.refresh_token_repository import IRefreshTokenRepository
from src.infrastructure.persistence.sqla.models.refresh_token import RefreshToken as RefreshTokenModel


class RefreshTokenRepository(IRefreshTokenRepository):
    """SQLAlchemy implementation of RefreshToken repository."""
    
    def __init__(self, session: AsyncSession):
        self._session = session
    
    async def create(self, refresh_token: RefreshTokenEntity) -> RefreshTokenEntity:
        """Create a new refresh token."""
        model = RefreshTokenModel(
            id=refresh_token.id,
            user_id=refresh_token.user_id,
            token_jti=refresh_token.token_jti,
            token_hash=refresh_token.token_hash,
            expires_at=refresh_token.expires_at,
            revoked=refresh_token.revoked,
            revoked_at=refresh_token.revoked_at,
            replaced_by_jti=refresh_token.replaced_by_jti,
            device_info=refresh_token.device_info,
            ip_address=refresh_token.ip_address,
            user_agent=refresh_token.user_agent,
            created_at=refresh_token.created_at,
        )
        
        self._session.add(model)
        await self._session.flush()
        
        return self._to_entity(model)
    
    async def get_by_jti(self, token_jti: str) -> Optional[RefreshTokenEntity]:
        """Get a refresh token by its JTI."""
        result = await self._session.execute(
            select(RefreshTokenModel).where(RefreshTokenModel.token_jti == token_jti)
        )
        model = result.scalar_one_or_none()
        
        return self._to_entity(model) if model else None
    
    async def get_by_user_id(self, user_id: UUID) -> list[RefreshTokenEntity]:
        """Get all refresh tokens for a user."""
        result = await self._session.execute(
            select(RefreshTokenModel)
            .where(RefreshTokenModel.user_id == user_id)
            .order_by(RefreshTokenModel.created_at.desc())
        )
        models = result.scalars().all()
        
        return [self._to_entity(model) for model in models]
    
    async def revoke(self, token_jti: str, replaced_by_jti: Optional[str] = None) -> bool:
        """Revoke a refresh token."""
        result = await self._session.execute(
            update(RefreshTokenModel)
            .where(RefreshTokenModel.token_jti == token_jti)
            .values(
                revoked=True,
                revoked_at=datetime.now(),
                replaced_by_jti=replaced_by_jti,
            )
        )
        
        return result.rowcount > 0
    
    async def revoke_all_for_user(self, user_id: UUID) -> int:
        """Revoke all refresh tokens for a user."""
        result = await self._session.execute(
            update(RefreshTokenModel)
            .where(
                and_(
                    RefreshTokenModel.user_id == user_id,
                    RefreshTokenModel.revoked == False,
                )
            )
            .values(
                revoked=True,
                revoked_at=datetime.now(),
            )
        )
        
        return result.rowcount
    
    async def delete_expired(self) -> int:
        """Delete all expired refresh tokens."""
        now = datetime.now()
        result = await self._session.execute(
            delete(RefreshTokenModel).where(RefreshTokenModel.expires_at < now)
        )
        
        return result.rowcount
    
    async def is_valid(self, token_jti: str) -> bool:
        """Check if a refresh token is valid."""
        now = datetime.now()
        result = await self._session.execute(
            select(RefreshTokenModel).where(
                and_(
                    RefreshTokenModel.token_jti == token_jti,
                    RefreshTokenModel.revoked == False,
                    RefreshTokenModel.expires_at > now,
                )
            )
        )
        
        return result.scalar_one_or_none() is not None
    
    def _to_entity(self, model: RefreshTokenModel) -> RefreshTokenEntity:
        """Convert SQLAlchemy model to domain entity."""
        return RefreshTokenEntity(
            id=model.id,
            user_id=model.user_id,
            token_jti=model.token_jti,
            token_hash=model.token_hash,
            expires_at=model.expires_at,
            revoked=model.revoked,
            revoked_at=model.revoked_at,
            replaced_by_jti=model.replaced_by_jti,
            device_info=model.device_info,
            ip_address=model.ip_address,
            user_agent=model.user_agent,
            created_at=model.created_at,
        )
