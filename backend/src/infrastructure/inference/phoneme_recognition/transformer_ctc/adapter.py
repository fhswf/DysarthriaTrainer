import time
from datetime import datetime
from typing import Final
import numpy as np
import asyncio

from src.core.exceptions.ai.model import ModelInferenceError
from src.core.ports.utils.logger_protocol import ILogger
from src.core.ports.inference.phoneme_recognition import IPhonemeRecognitionService
from src.core.value_objects.phoneme_recognition_result import PhonemeRecognitionResult

from src.infrastructure.inference.phoneme_recognition.transformer_ctc.config import TransformerCTCConfig
from src.infrastructure.inference.phoneme_recognition.transformer_ctc.model import GenericTransformerCTC


class TransformerCTCAdapter(IPhonemeRecognitionService):
    """Base class for all CTC-based models. Wraps TransformerCTC with safe loading and inference."""

    def __init__(self, logger: ILogger, config: TransformerCTCConfig) -> None:
        self._logger: Final[ILogger] = logger
        self._config: Final[TransformerCTCConfig] = config
        self._model: GenericTransformerCTC | None = None

    async def load_model(self) -> None:
        if self._model:
            raise RuntimeError("Model is already loaded.")
        self._logger.info(
            f"Loading {GenericTransformerCTC.__name__!r} to {self._config.map_location!r}..."
        )
        start_time = time.time()
        self._model = GenericTransformerCTC.from_pretrained(
            checkpoint_file=self._config.checkpoint_file,
            checkpoint_url=self._config.checkpoint_url,
            cache_dir=self._config.cache_dir,
            map_location=self._config.map_location
        )
        self._logger.info(
            f"{GenericTransformerCTC.__name__!r} loaded successfully in {time.time() - start_time:.2f} s."
        )
        await self.lazy_load_tensors()
        self._logger.info("Model setup complete.")

    async def lazy_load_tensors(self) -> None:
        """ Lazy load tensors by running a dummy inference. """
        if not self._model:
            raise RuntimeError("Model not loaded. Call load_model() before lazy loading tensors.")

        self._logger.info("Performing lazy loading of model tensors...")
        try:
            dummy_audio: np.ndarray = np.zeros(
                int(self._model.feature_extractor.sampling_rate * 0.5),
                dtype=np.float32
            )
            _ = await asyncio.to_thread(
                self._model.predict, dummy_audio, self._model.feature_extractor.sampling_rate
            )
        except Exception as e:
            self._logger.warning(f"Lazy loading failed: {e}")
        else:
            self._logger.info("Model tensors are now loaded into memory.")

    async def predict(self, audio: np.ndarray, sampling_rate: int = 16_000) -> PhonemeRecognitionResult:
        if not self._model:
            raise RuntimeError("Model not loaded. Call load_model() before prediction.")

        assert sampling_rate > 0, "Parameter sampling_rate must be positive."

        model_sr = self._model.feature_extractor.sampling_rate
        if model_sr != sampling_rate:
            self._logger.warning(
                f"Input audio sampling rate ({sampling_rate} Hz) differs from model "
                f"sampling rate ({model_sr} Hz)."
            )

        self._logger.debug("Running phoneme prediction...")

        try:
            # TODO: Concurrent inference handling
            pred_phonemes: list[str] = await asyncio.to_thread(
                self._model.predict, audio, sampling_rate
            )
        except Exception as e:
            raise ModelInferenceError(
                self._model.model_name, f"Unexpected error during prediction: {e}"
            ) from e
        else:
            self._logger.debug("Prediction completed successfully.")
            return PhonemeRecognitionResult(
                phonemes=pred_phonemes,
                model=self._model.model_name,
                timestamp=datetime.now(),
                success=True  # Redundant, falls eine Exception geworfen wird ...?
            )
