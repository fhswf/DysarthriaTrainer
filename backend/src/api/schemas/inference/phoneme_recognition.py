from pydantic import BaseModel


# schema to define return type for phoneme recognition API
class PhonemeRecognitionOut(BaseModel):
    phonemes: list[str]
    success: bool