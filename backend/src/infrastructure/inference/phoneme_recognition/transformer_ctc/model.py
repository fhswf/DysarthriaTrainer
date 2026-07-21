from __future__ import annotations
from dataclasses import asdict
from types import ModuleType
from typing import Final, Any
from importlib import import_module
from pathlib import Path
import torch
import torch.nn as nn
from transformers import PreTrainedModel, PretrainedConfig, Wav2Vec2FeatureExtractor, BatchFeature
import numpy as np
import warnings
import logging

from src.core.exceptions.ai.model import (
    ModelConfigurationError, ModelLoadingError, ModelInferenceError, ModelInitializationError
)
from src.infrastructure.utils.io.file_loader import ensure_file_exists, checkpoint_cache_path
from src.infrastructure.inference.phoneme_recognition.transformer_ctc.checkpoint import Checkpoint

warnings.filterwarnings("ignore", message="Support for mismatched key_padding_mask")
logger = logging.getLogger('API')

# TODO:
# - Models & Configs sollten nur aus eigener Quelle stammen.
# - Möglichst alles aus einer Quelle laden.
# - Vocab: Woher kommt das Vocab ?
class GenericTransformerCTC[TModel: PreTrainedModel, TConfig: PretrainedConfig](nn.Module):
    """Generic Transformer CTC model for phoneme recognition."""
    checkpoint_keys: list[str] = ["model_class", "model_name", "model_state_dict", "vocab"]
    model_formats: list[str] = [".pth"]
    cache_dir: str = "/root/.cache/huggingface"

    def __init__(
            self,
            model_cls: type[TModel],
            model_config: TConfig,
            model_name: str,
            vocab: list[str],
            blank_token: str = "<blank>",  # Auch aus config?
            sil_token: str = "spn",
            cache_dir: str | None = None
    ) -> None:
        super().__init__()
        assert hasattr(model_config, "hidden_size"), "Model config must have 'hidden_size' attribute."
        assert hasattr(model_config, "vocab_size"), "Model config must have 'vocab_size' attribute."
        # TODO: Config um vocab, blank_token, sil_token erweitern.
        assert vocab and isinstance(vocab, list), "Model vocab must be a non-empty list of strings"
        assert blank_token in vocab, f"Blank token {blank_token!r} not found in 'vocab'."
        assert sil_token in vocab, f"Silence token {sil_token!r} not found in 'vocab'."

        self.model_name: Final[str] = model_name
        self.vocab: Final[list[str]] = vocab
        self.sil_token_id: Final[int] = self.vocab.index(sil_token)
        self.blank_token_id: Final[int] = self.vocab.index(blank_token)
        self.blank_id: Final[int] = self.blank_token_id

        # Initialize model encoder from pretrained config
        self.encoder: Final[TModel] = model_cls(model_config)

        # Initialize CTC head.
        self.fc: Final[nn.Linear] = nn.Linear(
            # TODO: Config überschreiben und model_config.vocab_size nutzen.
            model_config.hidden_size, len(self.vocab)
        )

        # Modell spezifische Vorverarbeitung - bleibt erstmal hier.
        # TODO: Config aus lokaler Quelle laden und Wav2Vec2FeatureExtractor.from_dict(...) verwenden.
        self.feature_extractor: Final[Wav2Vec2FeatureExtractor] = Wav2Vec2FeatureExtractor.from_pretrained(
            pretrained_model_name_or_path=self.model_name,
            cache_dir=cache_dir,
        )

    def forward(
            self,
            input_values: torch.Tensor,
            attention_mask: torch.Tensor | None = None,
    ) -> torch.Tensor:
        outputs = self.encoder(
            input_values=input_values, attention_mask=attention_mask
        )
        features = outputs.last_hidden_state
        return self.fc(features)

    def predict(
            self,
            audio_input: np.ndarray,
            sampling_rate: int = 16_000,
            chunk_duration: float = 1.0,
    ) -> list[str]:
        chunk_size = max(1, int(sampling_rate * chunk_duration))
        prepared_audio = self._prepare_model_input(audio_input, min_samples=chunk_size)

        all_tokens: list[list[str]] = []

        for start in range(0, len(prepared_audio), chunk_size):
            chunk = prepared_audio[start:start + chunk_size]
            chunk = self._prepare_model_input(chunk, min_samples=chunk_size)

            input_values, attention_mask = self._extract_features(chunk, sampling_rate)
            logits = self._infer_logits(input_values, attention_mask)
            token_ids, token_confidences = self._greedy_decode_ids_with_confidences(logits)
            tokens = self._ctc_postprocess(token_ids, token_confidences)
            all_tokens.append(tokens)

        return self._merge_chunk_tokens(all_tokens)

    def _prepare_model_input(self, audio_input: np.ndarray, min_samples: int = 16_000) -> np.ndarray:
        audio = audio_input.astype(np.float32)
        if len(audio) < min_samples:
            pad_len = min_samples - len(audio)
            audio = np.pad(audio, (0, pad_len), mode="constant", constant_values=0)
        return audio

    def _infer_logits(
            self, input_values: torch.Tensor, attention_mask: torch.Tensor | None
    ) -> torch.Tensor:
        """Run model in eval mode to obtain logits."""
        self.eval()
        with torch.no_grad():
            logits: torch.Tensor = self.forward(
                input_values=input_values, attention_mask=attention_mask
            )
        return logits

    def _greedy_decode_ids_with_confidences(self, logits: torch.Tensor) -> tuple[list[int], list[float]]:
        """Greedy CTC decoding: convert logits to token IDs with confidences."""
        probabilities = torch.softmax(logits, dim=-1)
        predicted_ids: list[int] = torch.argmax(logits, dim=-1)[0].cpu().tolist()
        predicted_confidences: list[float] = probabilities.max(dim=-1).values[0].cpu().tolist()
        return predicted_ids, predicted_confidences

    def _extract_features(
            self, audio: np.ndarray, sampling_rate: int, return_tensors: str = "pt"
    ) -> tuple[torch.Tensor, torch.Tensor | None]:
        """Convert raw audio to model input tensors."""
        features: BatchFeature = self.feature_extractor(
            raw_speech=audio, sampling_rate=sampling_rate, return_tensors=return_tensors
        )
        return features.input_values, features.attention_mask

    def _merge_chunk_tokens(self, chunk_tokens: list[list[str]]) -> list[str]:
        merged: list[str] = []

        for tokens in chunk_tokens:
            for token in tokens:
                if not merged or token != merged[-1]:
                    merged.append(token)

        return merged

    def _ctc_postprocess(self, token_ids: list[int], token_confidences: list[float]) -> list[str]:
        """Post-process CTC outputs: collapse repeats, remove blanks and silences."""
        cleaned_phonemes: list[str] = []

        prev_id = self.blank_id
        for token_id, confidence in zip(token_ids, token_confidences):
            if token_id == prev_id:
                continue

            prev_id = token_id

            if token_id == self.blank_id:
                continue

            token = self.vocab[token_id]
            if token == self.vocab[self.sil_token_id]:
                continue

            if confidence > 0.5:
                cleaned_phonemes.append(token)

        return cleaned_phonemes

    @staticmethod
    def resolve_model_cls(class_name: str) -> type[TModel]:
        """Resolve model class from its name."""
        assert class_name and isinstance(class_name, str), "Parameter 'class_name' must be a non-empty string."
        try:
            module: ModuleType = import_module("transformers")
            model_cls: type[TModel] = getattr(module, class_name)
            return model_cls
        except (ImportError, AttributeError) as e:
            raise ValueError(f"Unsupported model class was provided: {class_name!r}") from e

    @classmethod
    def from_pretrained(
            cls: type[GenericTransformerCTC[TModel, TConfig]],
            checkpoint_file: str,
            checkpoint_url: str,
            cache_dir: str | None = None,
            map_location: str | torch.device | None = "cpu",
    ) -> GenericTransformerCTC[TModel, TConfig]:
        """Load pretrained GenericTransformerCTC model from checkpoint."""
        ckpt: Checkpoint = cls.load_model_checkpoint(
            checkpoint_file, checkpoint_url, map_location, weights_only=False
        )
        logger.debug(f"Model checkpoint loaded successfully! Keys: {list(asdict(ckpt).keys())}")

        # Resolve model class for generic CTC model.
        model_cls: type[TModel] = cls.resolve_model_cls(class_name=ckpt.model_class)

        # Load pretrained model config from pretrained model name.
        model_config: TConfig = cls.load_model_config(
            model_cls, ckpt.model_name, ckpt.model_name, cache_dir
        )

        # Initializing model from hf config and torch state dict.
        model = cls.create_model(
            model_cls, model_config, ckpt.model_name, ckpt.vocab
        )

        # Load model weights into the model.
        try:
            model.load_state_dict(ckpt.model_state_dict)
        except Exception as e:
            raise ModelInitializationError(
                ckpt.model_name, f"Failed to load pretrained model weights. Error: {e}"
            )
        return model

    @classmethod
    def load_model_checkpoint(
            cls: type[GenericTransformerCTC[TModel, TConfig]],
            checkpoint_file: str,
            checkpoint_url: str,
            map_location: str | torch.device | None = "cpu",
            weights_only: bool = True,
    ) -> Checkpoint:
        """Load model checkpoint from local path."""
        if Path(checkpoint_file).suffix not in cls.model_formats:
            raise ValueError(f"Invalid model file format for path: {checkpoint_file!r}.")
        
        # TODO: Async
        checkpoint_file = checkpoint_cache_path(
            checkpoint_file,
            checkpoint_url,
        )

        ensure_file_exists(checkpoint_file, checkpoint_url)
        try:
            ckpt: dict[str, Any] = torch.load(
                f=checkpoint_file,
                map_location=map_location,
                # TODO: Check - Uses pickle module, which is known to be insecure.
                weights_only=weights_only
            )
            if any((key not in ckpt.keys()) for key in cls.checkpoint_keys):
                raise ModelConfigurationError(
                    ckpt.get("model_name", Path(checkpoint_file).stem or ""),
                    f"Checkpoint is missing required keys: {set(cls.checkpoint_keys) - set(ckpt.keys())}."
                )
            return Checkpoint(**ckpt)
        except Exception as e:
            raise ModelLoadingError(
                Path(checkpoint_file).stem or "", f"Failed to load checkpoint file {checkpoint_file!r}. Error: {e}"
            )

    @staticmethod
    def load_model_config(
            model_cls: type[TModel], model_name: str, model_path: str, cache_dir: str
    ) -> TConfig:
        """Load model configuration from pretrained model name."""
        assert hasattr(model_cls, "config_class"), f"{model_cls.__name__!r} must have 'config_class' attribute."

        try:
            # TODO: Workaround zum Laden der pretrained Configs aus lokalem Cache oder HF Hub. Besser lösen.
            model_dir = Path(cache_dir) / ("models--" + model_name.replace("/", "--"))

            if local := model_dir.exists():
                logger.debug(f"Loading model config from local cache: {model_dir}")
            else:
                logger.debug(f"Loading model config from Hugging Face: {model_name}")

            model_config: TConfig = model_cls.config_class.from_pretrained(
                model_path if local else model_name,
                cache_dir=cache_dir, local_files_only=local
            )
        except Exception as e:
            raise ModelLoadingError(model_name, f"Failed to load pretrained model config: {e}")
        else:
            logger.debug(f"Model config loaded successfully (snapshot={model_config._commit_hash!r}).")
            return model_config

    @staticmethod
    def create_model(
            model_cls: type[TModel], model_config: TConfig, model_name: str, vocab: list[str]
    ) -> GenericTransformerCTC[TModel, TConfig]:
        """Creates GenericTransformerCTC of the specified model class and configuration."""
        try:
            return GenericTransformerCTC(
                model_cls=model_cls,
                model_config=model_config,
                model_name=model_name,
                vocab=vocab
            )
        except KeyError as e:
            raise ModelInitializationError(
                model_name,
                reason=f"Checkpoint is missing required key {e.args[0]!r}."
            )
        except AssertionError as e:
            raise ModelInitializationError(
                model_name, f"An assertion error occurred: {e}"
            )
        except Exception as e:
            raise ModelInitializationError(
                model_name, f"An unexpected error occurred: {e}"
            )
