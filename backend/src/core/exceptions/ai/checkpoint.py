# TODO: Download error ?
class ModelCheckpointUnavailableError(Exception):
    """Raised when a model checkpoint is unavailable."""
    def __init__(self, checkpoint_url: str):
        super().__init__(f"Model checkpoint is unavailable, could not from {checkpoint_url}.")