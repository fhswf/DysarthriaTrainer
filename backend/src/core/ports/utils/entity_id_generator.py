from abc import abstractmethod
from typing import Protocol, runtime_checkable
from uuid import UUID


@runtime_checkable
class IEntityIdGenerator(Protocol):
    @abstractmethod
    def __call__(self) -> UUID: ...
