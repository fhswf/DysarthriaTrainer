from datetime import datetime

from pydantic import BaseModel


class PhonemeRecognitionResult(BaseModel):
    phonemes: list[str]
    model: str
    timestamp: datetime
    success: bool
