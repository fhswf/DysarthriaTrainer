from abc import abstractmethod
from typing import Protocol, runtime_checkable


@runtime_checkable
class IDisposable(Protocol):

    @abstractmethod
    async def dispose(self, disposing: bool = False) -> None: ...
