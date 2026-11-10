from typing import Any, List, Optional, Tuple
import cv2
import numpy as np
from pydantic import BaseModel, Field
from app.config import get_settings
from app.schemas.common import Finding


class OCRLineResult(BaseModel):
    text: str
    confidence: float
    bbox: List[List[int]] = Field(default_factory=list)


class ImageQualityResult(BaseModel):
    width: int
    height: int
    blur_score: float
    is_blurred: bool
    is_low_res: bool
    findings: List[Finding] = Field(default_factory=list)


def assess_image_quality(image_np: np.ndarray) -> ImageQualityResult:
    """Computes Laplacian variance to assess sharpness and verifies resolution."""
    settings = get_settings()
    h, w = image_np.shape[:2]
    findings: List[Finding] = []

    if len(image_np.shape) == 3:
        if image_np.shape[2] == 4:
            gray = cv2.cvtColor(image_np, cv2.COLOR_BGRA2GRAY)
        elif image_np.shape[2] == 3:
            gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
        elif image_np.shape[2] == 1:
            gray = image_np[:, :, 0]
        else:
            gray = image_np
    else:
        gray = image_np
    variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    is_blurred = variance < settings.blur_threshold
    if is_blurred:
        findings.append(
            Finding(
                type="BLURRED_IMAGE",
                severity="high",
                description=f"Image is blurred (Laplacian variance {variance:.1f} < threshold {settings.blur_threshold})",
            )
        )

    is_low_res = w < settings.min_image_width
    if is_low_res:
        findings.append(
            Finding(
                type="LOW_RESOLUTION",
                severity="medium",
                description=f"Image width ({w}px) is below minimum required ({settings.min_image_width}px)",
            )
        )

    return ImageQualityResult(
        width=w,
        height=h,
        blur_score=round(variance, 2),
        is_blurred=is_blurred,
        is_low_res=is_low_res,
        findings=findings,
    )


class OCREngine:
    def __init__(self, reader: Optional[Any] = None):
        self._reader = reader

    def _get_reader(self):
        if self._reader is None:
            import easyocr
            self._reader = easyocr.Reader(
                ["id", "en"],
                gpu=(get_settings().whisper_device == "cuda"),
            )
        return self._reader

    def extract_text(
        self,
        image_np: np.ndarray,
        mock_output: Optional[List[Tuple[str, float, List[List[int]]]]] = None,
    ) -> List[OCRLineResult]:
        if mock_output is not None:
            return [
                OCRLineResult(text=item[0], confidence=item[1], bbox=item[2])
                for item in mock_output
            ]

        reader = self._get_reader()
        raw_results = reader.readtext(image_np)
        parsed: List[OCRLineResult] = []
        for bbox, text, conf in raw_results:
            int_bbox = [[int(pt[0]), int(pt[1])] for pt in bbox]
            parsed.append(
                OCRLineResult(
                    text=text.strip(),
                    confidence=float(round(conf, 4)),
                    bbox=int_bbox,
                )
            )
        return parsed


_default_ocr_engine: Optional[OCREngine] = None


def get_ocr_engine() -> OCREngine:
    global _default_ocr_engine
    if _default_ocr_engine is None:
        _default_ocr_engine = OCREngine()
    return _default_ocr_engine
