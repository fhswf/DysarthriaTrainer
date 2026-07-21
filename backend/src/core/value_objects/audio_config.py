from pydantic import BaseModel, Field


class AudioConfig(BaseModel):
    sampling_rate: int = Field(default=16000, description="Sample rate in Hz [1/s], e.g. 16000 for most STT models")
    channels: int = Field(default=1, description="Number of audio channels, e.g. 1 for mono")
    bit_depth: int | None = Field(default=None, description="Bit depth of audio samples, e.g. 16 for 16-bit PCM")

    @property
    def is_mono(self) -> bool:
        """ Check if the audio configuration is mono.
        Returns:
            bool: True if mono, False otherwise.
        """
        return self.channels == 1
