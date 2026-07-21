import numpy as np
from typing import Annotated
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status

from src.api.dependencies import get_phoneme_service, get_audio_loader, get_logger
from src.api.schemas.inference.phoneme_recognition import PhonemeRecognitionOut
from src.core.value_objects.phoneme_recognition_result import PhonemeRecognitionResult
from src.core.exceptions.ai.checkpoint import ModelCheckpointUnavailableError
from src.core.ports.inference.phoneme_recognition import IPhonemeRecognitionService
from src.core.ports.utils.audio_loader import IAudioLoader
from src.core.ports import ILogger

router = APIRouter(prefix="/phoneme_recognition")


@router.post("/phonemes_from_file", response_model=PhonemeRecognitionOut)
async def predict_phonemes_from_file(
        logger: Annotated[ILogger, Depends(get_logger)],
        file: UploadFile = File(...),
        phoneme_service: IPhonemeRecognitionService = Depends(get_phoneme_service),
        audio_loader: IAudioLoader = Depends(get_audio_loader),
):
    file_bytes: bytes = await file.read(size=-1)  # The number of bytes to read from the file (-1 means read all)
    logger.debug(f"Received file for phoneme recognition: {file.filename}, size: {len(file_bytes)} bytes")
    # Load audio file bytes into numpy array
    audio: np.ndarray = await audio_loader.load_from_bytes(audio=file_bytes)
    try:
        result: PhonemeRecognitionResult = await phoneme_service.predict(audio=audio)
        return PhonemeRecognitionOut(**result.model_dump())
    except ModelCheckpointUnavailableError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Model checkpoint unavailable: {e}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error during phoneme recognition: {e}",
        )
    finally:
        await file.close()
