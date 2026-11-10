import re
from typing import List, Tuple
from app.schemas.common import Finding
from app.schemas.icr import ICRField, ICRFormResult
from app.services.ocr_engine import OCRLineResult

KNOWN_FIELD_KEYS = [
    "Nama Debitur",
    "Pekerjaan",
    "Penghasilan Per Bulan",
    "Penghasilan",
    "Kondisi Rumah",
    "Status Rumah",
    "Alamat Domisili",
    "Tujuan Pembiayaan",
    "Catatan Surveyor",
]


def extract_survey_form_icr(lines: List[OCRLineResult]) -> Tuple[ICRFormResult, List[Finding]]:
    """Extracts key-value pairs from surveyor forms and flags low-confidence handwriting."""
    fields: dict[str, ICRField] = {}
    findings: List[Finding] = []
    raw_texts: List[str] = []

    for line in lines:
        txt = line.text.strip()
        raw_texts.append(txt)

        for key in KNOWN_FIELD_KEYS:
            pattern = rf"{re.escape(key)}\s*[:;]?\s*(.+)$"
            match = re.search(pattern, txt, re.IGNORECASE)
            if match:
                val = match.group(1).strip()
                needs_review = line.confidence < 0.60
                field_obj = ICRField(
                    label=key,
                    value=val,
                    confidence=line.confidence,
                    bbox=line.bbox,
                    needs_review=needs_review,
                )
                fields[key] = field_obj

                if needs_review:
                    findings.append(
                        Finding(
                            type="LOW_CONFIDENCE_FIELD",
                            severity="medium",
                            description=f"Field '{key}' has low confidence handwriting ({line.confidence * 100:.1f}%). Requires surveyor review.",
                            field_ref=key,
                        )
                    )
                break

    result = ICRFormResult(
        form_type="SURVEY_FORM_CMO",
        fields=fields,
        raw_text="\n".join(raw_texts),
    )
    return result, findings
