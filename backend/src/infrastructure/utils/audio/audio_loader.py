from io import BytesIO
from os import PathLike
from typing import BinaryIO, Final
import librosa
import numpy as np

from src.core.ports.utils.logger_protocol import ILogger
from src.core.ports.utils.audio_loader import IAudioLoader


class LibrosaAudioLoader(IAudioLoader):

    def __init__(self, logger: ILogger) -> None:
        self._logger: Final[ILogger] = logger

    async def load_from_bytes(
            self, audio: bytes, sampling_rate: int | None = 16000, force_mono: bool = True, dtype: np.dtype = np.float32
    ) -> np.ndarray:
        assert audio and isinstance(audio, bytes), "audio must be a non-empty bytes object"

        with BytesIO(audio) as audio_handle:
            return await self.load_from_file(audio_handle, sampling_rate, force_mono, dtype)

    async def load_from_file(
            self, path: str | int | PathLike | BinaryIO,
            sampling_rate: int | None = None, force_mono: bool = True,  dtype: np.dtype = np.float32
    ) -> np.ndarray:
        audio, orig_sr = librosa.load(
            path=path, sr=None, mono=force_mono, dtype=dtype,
        )
        # Resample it to the model's expected sampling rate if needed
        if sampling_rate and orig_sr != sampling_rate:
            assert sampling_rate > 0, "sampling_rate must be positive"
            self._logger.warning(
                f"Input audio sampling rate ({orig_sr} Hz) differs from target "
                f"sampling rate ({sampling_rate} Hz). Resampling..."
            )
            audio = librosa.resample(audio, orig_sr=orig_sr, target_sr=sampling_rate)

        return audio
