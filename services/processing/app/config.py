from functools import lru_cache
from pydantic import BaseModel


class AppConfig(BaseModel):
    app_name: str = "VeriFin Processing Service"
    version: str = "0.1.0"
    ocr_model_version: str = "easyocr-id-en-v1"
    voice_model_version: str = "faster-whisper-small-id-v1"
    whisper_model_size: str = "small"
    whisper_device: str = "cpu"
    whisper_compute_type: str = "int8"
    blur_threshold: float = 100.0
    min_image_width: int = 600
    hesitation_silence_threshold: float = 1.5


@lru_cache
def get_settings() -> AppConfig:
    return AppConfig()
