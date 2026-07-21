from pydantic import Field
from pydantic_settings import BaseSettings


class TransformerCTCConfig(BaseSettings):
    checkpoint_url: str = Field(..., alias="TRANSFORMER_CTC_MODEL_URL", description="download URL")
    checkpoint_file: str = Field(..., alias="TRANSFORMER_CTC_MODEL_PATH")
    cache_dir: str = Field(default="/root/.cache/huggingface", alias="HF_CACHE_DIR")
    map_location: str = Field(default="cpu", alias="TRANSFORMER_CTC_DEVICE")