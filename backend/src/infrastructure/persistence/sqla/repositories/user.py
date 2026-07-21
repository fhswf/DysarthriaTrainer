from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, exists, Result, Select

from src.core.entities.user import User
from src.infrastructure.persistence.sqla.models.user import User as UserDB
from src.infrastructure.persistence.sqla.repositories.base import BaseRepository
from src.core.ports.repositories.user import IUserRepository


class UserRepository(BaseRepository[User, UserDB], IUserRepository):

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(UserDB, session)

    async def get_by_email(self, email: str) -> User | None:
        stmt: Select = select(self._model).where(self._model.email == email)
        result: Result = await self._session.execute(stmt)
        entity_db: UserDB | None = result.scalar_one_or_none()
        return self.to_domain(entity_db) if entity_db else None

    async def exists_by_username(self, username: str) -> bool:
        stmt: Select = select(exists().where(self._model.username == username))
        return bool(await self._session.scalar(stmt))

    async def get_by_email_verification_token(self, token: str) -> User | None:
        stmt: Select = select(self._model).where(self._model.email_verification_token == token)
        result: Result = await self._session.execute(stmt)
        entity_db: UserDB | None = result.scalar_one_or_none()
        return self.to_domain(entity_db) if entity_db else None

    async def get_by_password_reset_token(self, token: str) -> User | None:
        stmt: Select = select(self._model).where(self._model.password_reset_token == token)
        result: Result = await self._session.execute(stmt)
        entity_db: UserDB | None = result.scalar_one_or_none()
        return self.to_domain(entity_db) if entity_db else None

    # TODO: Refactor
    def to_domain(self, entity: UserDB) -> User:
        return User(
            id=entity.id,
            username=entity.username,
            hashed_password=entity.hashed_password,
            email=entity.email,
            full_name=entity.full_name,
            disabled=entity.disabled,
            created_at=entity.created_at,
            email_verified=entity.email_verified,
            failed_login_attempts=entity.failed_login_attempts,
            locked_until=entity.locked_until,
            last_login=entity.last_login,
            last_password_change=entity.last_password_change,
            password_reset_token=entity.password_reset_token,
            password_reset_sent_at=entity.password_reset_sent_at,
            email_verification_token=entity.email_verification_token,
            email_verification_sent_at=entity.email_verification_sent_at,
        )

    def to_orm(self, model: User) -> UserDB:
        return UserDB(
            id=model.id,
            username=model.username,
            hashed_password=model.hashed_password,
            email=model.email,
            full_name=model.full_name,
            disabled=model.disabled,
            created_at=model.created_at,
            email_verified=model.email_verified,
            failed_login_attempts=model.failed_login_attempts,
            locked_until=model.locked_until,
            last_login=model.last_login,
            last_password_change=model.last_password_change,
            password_reset_token=model.password_reset_token,
            password_reset_sent_at=model.password_reset_sent_at,
            email_verification_token=model.email_verification_token,
            email_verification_sent_at=model.email_verification_sent_at,
        )
