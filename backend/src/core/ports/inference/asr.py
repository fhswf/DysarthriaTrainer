from abc import abstractmethod
from typing import Protocol, runtime_checkable


@runtime_checkable
class IASRService(Protocol):

    @abstractmethod
    async def transcribe[T](self, audio_data: T) -> str: ...

