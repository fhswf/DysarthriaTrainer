from os import PathLike
from abc import abstractmethod
from typing import Protocol, runtime_checkable, BinaryIO
import numpy as np


@runtime_checkable
class IAudioLoader(Protocol):

    @abstractmethod
    async def load_from_bytes(
            self, audio: bytes, sampling_rate: int | None = 16000, force_mono: bool = True, dtype: np.dtype = np.float32
    ) -> np.ndarray: ...

    @abstractmethod
    async def load_from_file(
            self, path: str | int | PathLike | BinaryIO,
            sampling_rate: int | None = 16000, force_mono: bool = True, dtype: np.dtype = np.float32
    ) -> np.ndarray: ...
