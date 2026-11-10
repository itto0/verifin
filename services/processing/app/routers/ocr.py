from typing import Any, Dict, List
import cv2
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
import numpy as np

from app.config import AppConfig, get_settings
from app.schemas.common import ProcessEnvelope
from app.schemas.ocr import KTPFieldExtraction, KTPProcessResult
from app.services.ktp_parser import cross_validate_ktp, extract_ktp_fields_from_ocr
from app.services.ocr_engine import OCREngine, assess_image_quality, get_ocr_engine

router = APIRouter(tags=["OCR"])


async def read_image_from_upload(upload_file: UploadFile) -> np.ndarray:
    contents = await upload_file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty image file")
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image file format")
    return image


@router.post("/ktp", response_model=ProcessEnvelope[KTPProcessResult])
async def process_ktp(
    file: UploadFile = File(...),
    ocr_engine: OCREngine = Depends(get_ocr_engine),
    settings: AppConfig = Depends(get_settings),
):
    image_np = await read_image_from_upload(file)
    quality = assess_image_quality(image_np)

    extracted_lines = ocr_engine.extract_text(image_np)
    ktp_fields = extract_ktp_fields_from_ocr(extracted_lines)
    validation = cross_validate_ktp(ktp_fields)

    all_findings = quality.findings + validation.findings

    confidences = list(ktp_fields.field_confidences.values())
    avg_conf = float(np.mean(confidences) * 100) if confidences else (50.0 if not quality.is_blurred else 30.0)
    if quality.is_blurred:
        avg_conf = min(avg_conf, 45.0)
    avg_conf = max(0.0, min(100.0, avg_conf))

    status = "failed" if (validation.tamper_score >= 80 or not ktp_fields.nik) else (
        "partial" if (quality.is_blurred or len(all_findings) > 0) else "success"
    )

    data_payload = KTPProcessResult(
        fields=ktp_fields,
        validation=validation,
        quality_score=quality.blur_score,
        is_blurred=quality.is_blurred,
    )

    return ProcessEnvelope[KTPProcessResult](
        status=status,
        confidence=round(avg_conf, 1),
        model_version=settings.ocr_model_version,
        data=data_payload,
        findings=all_findings,
    )


@router.post("/document", response_model=ProcessEnvelope[Dict[str, Any]])
async def process_document(
    file: UploadFile = File(...),
    ocr_engine: OCREngine = Depends(get_ocr_engine),
    settings: AppConfig = Depends(get_settings),
):
    image_np = await read_image_from_upload(file)
    quality = assess_image_quality(image_np)
    extracted_lines = ocr_engine.extract_text(image_np)

    confidences = [l.confidence for l in extracted_lines]
    avg_conf = float(np.mean(confidences) * 100) if confidences else 50.0
    if quality.is_blurred:
        avg_conf = min(avg_conf, 45.0)
    avg_conf = max(0.0, min(100.0, avg_conf))

    lines_payload = [
        {"text": l.text, "confidence": l.confidence, "bbox": l.bbox}
        for l in extracted_lines
    ]

    return ProcessEnvelope[Dict[str, Any]](
        status="partial" if (quality.is_blurred or len(quality.findings) > 0) else "success",
        confidence=round(avg_conf, 1),
        model_version=settings.ocr_model_version,
        data={"lines": lines_payload, "total_lines": len(lines_payload)},
        findings=quality.findings,
    )
