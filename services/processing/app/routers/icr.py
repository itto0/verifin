import numpy as np
from fastapi import APIRouter, Depends, File, UploadFile

from app.config import AppConfig, get_settings
from app.routers.ocr import read_image_from_upload
from app.schemas.common import ProcessEnvelope
from app.schemas.icr import ICRFormResult
from app.services.icr_engine import extract_survey_form_icr
from app.services.ocr_engine import OCREngine, assess_image_quality, get_ocr_engine

router = APIRouter(tags=["ICR"])


@router.post("/survey-form", response_model=ProcessEnvelope[ICRFormResult])
async def process_survey_form(
    file: UploadFile = File(...),
    ocr_engine: OCREngine = Depends(get_ocr_engine),
    settings: AppConfig = Depends(get_settings),
):
    image_np = await read_image_from_upload(file)
    quality = assess_image_quality(image_np)
    lines = ocr_engine.extract_text(image_np)

    icr_result, icr_findings = extract_survey_form_icr(lines)
    all_findings = quality.findings + icr_findings

    confidences = [f.confidence for f in icr_result.fields.values()]
    avg_conf = float(np.mean(confidences) * 100) if confidences else 50.0
    if quality.is_blurred:
        avg_conf = min(avg_conf, 45.0)
    avg_conf = max(0.0, min(100.0, avg_conf))

    status = "partial" if (quality.is_blurred or len(all_findings) > 0) else "success"

    return ProcessEnvelope[ICRFormResult](
        status=status,
        confidence=round(avg_conf, 1),
        model_version=settings.ocr_model_version,
        data=icr_result,
        findings=all_findings,
    )
