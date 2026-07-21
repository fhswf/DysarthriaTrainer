from abc import abstractmethod
from typing import Protocol, runtime_checkable


@runtime_checkable
class IPasswordHasher(Protocol):
    @abstractmethod
    def hash_password(self, password: str) -> str: ...

    @abstractmethod
    def verify_password(self, plain_password: str, hashed_password: str) -> bool: ...
