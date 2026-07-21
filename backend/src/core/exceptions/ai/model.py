from src.core.exceptions.ai.base import AIError


class ModelError(AIError):
    """Basisklasse für alle modellbezogenen Fehler."""
    pass


class ModelLoadingError(ModelError):
    """Wird ausgelöst, wenn ein KI-Modell nicht geladen werden kann."""

    def __init__(self, model_name: str, details: str | None = None):
        self.model_name = model_name
        self.details = details
        super().__init__(f"Failed to load model {model_name!r}. Details: {details or 'N/A'}.")


class ModelInitializationError(ModelError):
    """Fehler bei der Initialisierung eines Modells."""

    def __init__(self, model_name: str, reason: str):
        super().__init__(f"Initialization failed for model {model_name!r}: {reason}.")


class ModelInferenceError(ModelError):
    """Basisklasse für alle Inferenz-bezogenen Fehler."""

    def __init__(self, model_name: str, reason: str):
        super().__init__(f"Inference failed for model {model_name!r}: {reason}.")


class ModelConfigurationError(ModelError):
    """Fehlerhafte oder inkompatible Modellkonfiguration."""

    def __init__(self, model_name: str, message: str | None = None):
        self.message = message or "Model configuration is invalid or incompatible."
        super().__init__(model_name, self.message)
