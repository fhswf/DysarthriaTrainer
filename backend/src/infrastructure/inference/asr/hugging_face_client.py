import aiohttp

from src.core.ports.inference.asr import IASRService
from src.core.ports.utils.logger_protocol import ILogger


class HuggingFaceASRClient(IASRService):
    def __init__(self, logger: ILogger, config):
        self._logger = logger
        if not config.token:
            raise ValueError("API token must be provided in the settings.")
        if not config.url:
            raise ValueError("API url must be provided in the settings.")
        self._url: str | None
        self._token: str | None
        self._headers: dict | None
        ...

    async def transcribe(self, data: bytes) -> str:
        # async with aiohttp.ClientSession() as session: ...
        ...

