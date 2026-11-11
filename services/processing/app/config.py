import os
from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

# Suppress noisy symlink warnings on Windows platforms without developer mode / admin privileges
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")



class AppConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "VeriFin Processing Service"
    version: str = "0.1.0"
    ocr_model_version: str = "easyocr-id-en-v1"
    ocr_quantize: Optional[bool] = None
    voice_model_version: str = "faster-whisper-small-id-v1"
    whisper_model_size: str = "small"
    whisper_device: str = "cpu"
    whisper_compute_type: str = "int8"
    blur_threshold: float = 100.0
    min_image_width: int = 600
    hesitation_silence_threshold: float = 1.5
    cors_origins: List[str] = ["*"]


@lru_cache
def get_settings() -> AppConfig:
    return AppConfig()
