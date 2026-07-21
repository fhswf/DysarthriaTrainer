from abc import abstractmethod

from src.core.ports.repositories.base import IRepository
from src.core.entities.user import User


class IUserRepository(IRepository[User]):
    @abstractmethod
    async def get_by_email(self, email: str) -> User | None: ...

    @abstractmethod
    async def exists_by_username(self, username: str) -> bool: ...

    async def get_by_email_verification_token(self, token: str) -> User | None: ...

    async def get_by_password_reset_token(self, token: str) -> User | None: ...
