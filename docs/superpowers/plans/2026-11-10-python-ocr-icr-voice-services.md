# Local Python OCR/ICR & Voice-to-Text Services Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight, unified Python FastAPI service in `services/processing/` for local e-KTP OCR, Dukcapil algorithmic validation, survey form ICR, and Faster-Whisper voice transcription with OJK script compliance QA.

**Architecture:** A modular FastAPI application under `services/processing/` adhering to the VeriFin PRD envelope (`status`, `confidence`, `findings[]`, `evidence_refs[]`). Computer vision & OCR are handled via OpenCV + EasyOCR; civil registry NIK validation and tamper detection are handled via a pure Python rule-engine; voice transcription and acoustic silence analysis are handled via Faster-Whisper and an OJK compliance auditor.

**Tech Stack:** Python 3.10+, FastAPI, Uvicorn, Pydantic v2, OpenCV (`opencv-python-headless`), Pillow, EasyOCR, Faster-Whisper, Pytest, `uv`.

## Global Constraints

- Root folder for Python service: `services/processing/`
- All response schemas must adhere to standard PRD result envelope (`status`, `confidence`, `findings[]`, `evidence_refs[]`, `model_version`, `processed_at`)
- NIK validation must enforce 16 digits, province/regency code verification, female $+40$ day offset, and sequence validation
- Image quality check must flag Laplacian variance $< 100$ as `BLURRED_IMAGE` and width $< 600$ as `LOW_RESOLUTION`
- Voice pause detection must flag silence gaps $> 1.5$ seconds between conversational turns
- Fully tested using `pytest` with mocked heavy ML model calls where appropriate so tests run fast and deterministically

---

### Task 1: Project Setup, Dependencies & Common Schema Envelope

**Files:**
- Create: `services/processing/pyproject.toml`
- Create: `services/processing/README.md`
- Create: `services/processing/app/__init__.py`
- Create: `services/processing/app/config.py`
- Create: `services/processing/app/schemas/__init__.py`
- Create: `services/processing/app/schemas/common.py`
- Create: `services/processing/tests/__init__.py`
- Create: `services/processing/tests/test_common_schemas.py`

**Interfaces:**
- Consumes: None
- Produces: `AppConfig`, `get_settings()`, `Finding`, `EvidenceRef`, `ProcessEnvelope[T]`

- [ ] **Step 1: Write the failing test for common envelope schemas**

Create `services/processing/tests/test_common_schemas.py`:

```python
from datetime import datetime, timezone
import pytest
from pydantic import BaseModel
from app.schemas.common import ProcessEnvelope, Finding, EvidenceRef


class DummyData(BaseModel):
    key: str
    value: int


def test_process_envelope_valid_payload():
    payload = DummyData(key="test", value=42)
    finding = Finding(
        type="TEST_ANOMALY",
        severity="medium",
        description="A test finding",
        field_ref="key",
    )
    ref = EvidenceRef(
        ref_id="ref_001",
        label="Cropped Image",
        uri="evidence/ref_001.jpg",
        content_type="image/jpeg",
    )

    envelope = ProcessEnvelope[DummyData](
        status="success",
        confidence=98.5,
        model_version="test-v1.0",
        data=payload,
        findings=[finding],
        evidence_refs=[ref],
    )

    dumped = envelope.model_dump()
    assert dumped["status"] == "success"
    assert dumped["confidence"] == 98.5
    assert dumped["model_version"] == "test-v1.0"
    assert dumped["data"]["key"] == "test"
    assert len(dumped["findings"]) == 1
    assert dumped["findings"][0]["severity"] == "medium"
    assert len(dumped["evidence_refs"]) == 1
    assert dumped["processed_at"] is not None


def test_process_envelope_confidence_validation():
    with pytest.raises(ValueError):
        ProcessEnvelope[DummyData](
            status="success",
            confidence=105.0,  # Invalid: max 100
            model_version="test-v1.0",
            data=DummyData(key="x", value=1),
        )
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
uv run --directory services/processing pytest tests/test_common_schemas.py -v
```
Expected: FAIL with ModuleNotFoundError: No module named 'app'

- [ ] **Step 3: Write minimal implementation**

Create `services/processing/pyproject.toml`:

```toml
[project]
name = "verifin-processing"
version = "0.1.0"
description = "VeriFin Python Processing Service for OCR/ICR and Voice Analytics"
readme = "README.md"
requires-python = ">=3.10"
dependencies = [
    "fastapi>=0.110.0",
    "uvicorn[standard]>=0.28.0",
    "pydantic>=2.6.0",
    "python-multipart>=0.0.9",
    "pillow>=10.2.0",
    "opencv-python-headless>=4.9.0",
    "numpy>=1.26.0",
    "easyocr>=1.7.1",
    "faster-whisper>=1.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "httpx>=0.27.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["."]
```

Create `services/processing/README.md`:

```markdown
# VeriFin Python Processing Service

FastAPI service providing local OCR/ICR (e-KTP, surveyor forms) and Voice-to-Text analytics (Faster-Whisper, OJK compliance).

## Quick Start
```bash
uv sync --extra dev
uv run uvicorn app.main:app --reload --port 8000
```
```

Create empty `services/processing/app/__init__.py`, `services/processing/app/schemas/__init__.py`, `services/processing/tests/__init__.py`.

Create `services/processing/app/config.py`:

```python
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
```

Create `services/processing/app/schemas/common.py`:

```python
from datetime import datetime, timezone
from typing import Generic, List, Literal, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class Finding(BaseModel):
    type: str = Field(..., description="Machine-readable code, e.g. BLURRED_IMAGE, NIK_MISMATCH")
    severity: Literal["low", "medium", "high", "critical"]
    description: str
    field_ref: Optional[str] = None
    timestamp: Optional[float] = None


class EvidenceRef(BaseModel):
    ref_id: str
    label: str
    uri: str
    content_type: str


class ProcessEnvelope(BaseModel, Generic[T]):
    status: Literal["success", "partial", "failed"]
    confidence: float = Field(..., ge=0.0, le=100.0, description="Overall confidence 0-100")
    model_version: str
    processed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    data: Optional[T] = None
    findings: List[Finding] = Field(default_factory=list)
    evidence_refs: List[EvidenceRef] = Field(default_factory=list)
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
uv run --directory services/processing pytest tests/test_common_schemas.py -v
```
Expected: PASS with 2 passed.

- [ ] **Step 5: Commit**

```bash
git add services/processing/
git commit -m "feat(processing): setup python package structure and common envelope schemas"
```

---

### Task 2: e-KTP Schema & Dukcapil NIK Algorithmic Validator

**Files:**
- Create: `services/processing/app/schemas/ocr.py`
- Create: `services/processing/app/services/ktp_parser.py`
- Create: `services/processing/tests/test_nik_validation.py`

**Interfaces:**
- Consumes: `Finding` from `app.schemas.common`
- Produces: `KTPFieldExtraction`, `KTPValidationResult`, `validate_nik()`, `cross_validate_ktp()`

- [ ] **Step 1: Write the failing tests for NIK algorithmic validation**

Create `services/processing/tests/test_nik_validation.py`:

```python
import pytest
from app.services.ktp_parser import validate_nik, cross_validate_ktp
from app.schemas.ocr import KTPFieldExtraction


def test_valid_male_nik():
    # 320405 120590 0001: Prov 32, Kab 04, Kec 05, Male, born 12 May 1990
    result = validate_nik("3204051205900001")
    assert result.is_valid is True
    assert result.province_code == "32"
    assert result.regency_code == "04"
    assert result.district_code == "05"
    assert result.gender == "LAKI-LAKI"
    assert result.birth_date_str == "1990-05-12"
    assert result.sequence == "0001"
    assert len(result.findings) == 0


def test_valid_female_nik():
    # Female born 15 August 1985 -> Day is 15 + 40 = 55 -> 550885
    result = validate_nik("3171015508850002")
    assert result.is_valid is True
    assert result.province_code == "31"
    assert result.gender == "PEREMPUAN"
    assert result.birth_date_str == "1985-08-15"
    assert result.sequence == "0002"
    assert len(result.findings) == 0


def test_invalid_nik_length():
    result = validate_nik("32040512059")  # 11 digits
    assert result.is_valid is False
    assert any(f.type == "INVALID_NIK_LENGTH" for f in result.findings)


def test_invalid_nik_date():
    # Month 13 is invalid
    result = validate_nik("3204051213900001")
    assert result.is_valid is False
    assert any(f.type == "INVALID_NIK_DATE" for f in result.findings)


def test_cross_validate_ktp_mismatch():
    fields = KTPFieldExtraction(
        nik="3204051205900001",
        nama="BUDI SANTOSO",
        tempat_lahir="BANDUNG",
        tgl_lahir="15-08-1992",  # Mismatches NIK birthdate (1990-05-12)
        jenis_kelamin="PEREMPUAN",  # Mismatches NIK gender (LAKI-LAKI)
        alamat="JL. MERDEKA NO 1",
        rt_rw="001/002",
        kel_desa="SUKAJADI",
        kecamatan="SUKAJADI",
        agama="ISLAM",
        status_perkawinan="BELUM KAWIN",
        pekerjaan="KARYAWAN SWASTA",
        kewarganegaraan="WNI",
        berlaku_hingga="SEUMUR HIDUP",
    )
    tamper_result = cross_validate_ktp(fields)
    assert tamper_result.tamper_score >= 70
    assert any(f.type == "NIK_BIRTHDATE_MISMATCH" for f in tamper_result.findings)
    assert any(f.type == "NIK_GENDER_MISMATCH" for f in tamper_result.findings)
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
uv run --directory services/processing pytest tests/test_nik_validation.py -v
```
Expected: FAIL with ModuleNotFoundError: No module named 'app.schemas.ocr'

- [ ] **Step 3: Write minimal implementation**

Create `services/processing/app/schemas/ocr.py`:

```python
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.common import Finding


class KTPFieldExtraction(BaseModel):
    nik: Optional[str] = None
    nama: Optional[str] = None
    tempat_lahir: Optional[str] = None
    tgl_lahir: Optional[str] = None
    jenis_kelamin: Optional[str] = None
    alamat: Optional[str] = None
    rt_rw: Optional[str] = None
    kel_desa: Optional[str] = None
    kecamatan: Optional[str] = None
    agama: Optional[str] = None
    status_perkawinan: Optional[str] = None
    pekerjaan: Optional[str] = None
    kewarganegaraan: Optional[str] = None
    berlaku_hingga: Optional[str] = None
    field_confidences: Dict[str, float] = Field(default_factory=dict)


class KTPValidationResult(BaseModel):
    is_valid: bool
    province_code: Optional[str] = None
    regency_code: Optional[str] = None
    district_code: Optional[str] = None
    gender: Optional[str] = None
    birth_date_str: Optional[str] = None
    sequence: Optional[str] = None
    tamper_score: float = 0.0
    findings: List[Finding] = Field(default_factory=list)


class KTPProcessResult(BaseModel):
    fields: KTPFieldExtraction
    validation: KTPValidationResult
    quality_score: float
    is_blurred: bool
```

Create `services/processing/app/services/ktp_parser.py`:

```python
from datetime import datetime
import re
from typing import List, Tuple
from app.schemas.common import Finding
from app.schemas.ocr import KTPFieldExtraction, KTPValidationResult

# Recognized 2-digit Indonesian province codes according to Kemendagri / Dukcapil
INDONESIAN_PROVINCES = {
    "11": "ACEH", "12": "SUMATERA UTARA", "13": "SUMATERA BARAT", "14": "RIAU",
    "15": "JAMBI", "16": "SUMATERA SELATAN", "17": "BENGKULU", "18": "LAMPUNG",
    "19": "KEPULAUAN BANGKA BELITUNG", "21": "KEPULAUAN RIAU", "31": "DKI JAKARTA",
    "32": "JAWA BARAT", "33": "JAWA TENGAH", "34": "DAERAH ISTIMEWA YOGYAKARTA",
    "35": "JAWA TIMUR", "36": "BANTEN", "51": "BALI", "52": "NUSA TENGGARA BARAT",
    "53": "NUSA TENGGARA TIMUR", "61": "KALIMANTAN BARAT", "62": "KALIMANTAN TENGAH",
    "63": "KALIMANTAN SELATAN", "64": "KALIMANTAN TIMUR", "65": "KALIMANTAN UTARA",
    "71": "SULAWESI UTARA", "72": "SULAWESI TENGAH", "73": "SULAWESI SELATAN",
    "74": "SULAWESI TENGGARA", "75": "GORONTALO", "76": "SULAWESI BARAT",
    "81": "MALUKU", "82": "MALUKU UTARA", "91": "PAPUA BARAT", "92": "PAPUA",
}


def parse_nik_date(date_code: str) -> Tuple[bool, Optional[str], Optional[str], Optional[Finding]]:
    """Decodes 6-digit DDMMYY from NIK handling female +40 day offset."""
    if len(date_code) != 6 or not date_code.isdigit():
        return False, None, None, Finding(
            type="INVALID_NIK_DATE",
            severity="high",
            description="NIK date portion must be 6 digits",
            field_ref="nik",
        )

    raw_day = int(date_code[0:2])
    month = int(date_code[2:4])
    year_short = int(date_code[4:6])

    if raw_day > 40:
        gender = "PEREMPUAN"
        day = raw_day - 40
    else:
        gender = "LAKI-LAKI"
        day = raw_day

    if month < 1 or month > 12 or day < 1 or day > 31:
        return False, None, None, Finding(
            type="INVALID_NIK_DATE",
            severity="high",
            description=f"NIK date is out of range: day={day}, month={month}",
            field_ref="nik",
        )

    current_year_short = int(datetime.now().strftime("%y"))
    full_year = 1900 + year_short if year_short > current_year_short else 2000 + year_short

    try:
        dt = datetime(full_year, month, day)
        return True, gender, dt.strftime("%Y-%m-%d"), None
    except ValueError as e:
        return False, None, None, Finding(
            type="INVALID_NIK_DATE",
            severity="high",
            description=f"Invalid calendar date in NIK: {e}",
            field_ref="nik",
        )


def validate_nik(nik_input: Optional[str]) -> KTPValidationResult:
    """Validates 16-digit Dukcapil NIK according to civil registry algorithms."""
    findings: List[Finding] = []
    if not nik_input:
        return KTPValidationResult(
            is_valid=False,
            findings=[Finding(type="MISSING_NIK", severity="critical", description="NIK is missing", field_ref="nik")],
        )

    clean_nik = re.sub(r"\D", "", nik_input)
    if len(clean_nik) != 16:
        return KTPValidationResult(
            is_valid=False,
            findings=[
                Finding(
                    type="INVALID_NIK_LENGTH",
                    severity="critical",
                    description=f"NIK must be exactly 16 digits, got {len(clean_nik)}",
                    field_ref="nik",
                )
            ],
        )

    prov_code = clean_nik[0:2]
    reg_code = clean_nik[2:4]
    dist_code = clean_nik[4:6]
    date_code = clean_nik[6:12]
    seq_code = clean_nik[12:16]

    if prov_code not in INDONESIAN_PROVINCES:
        findings.append(
            Finding(
                type="INVALID_PROVINCE_CODE",
                severity="high",
                description=f"Province code '{prov_code}' is not recognized in Dukcapil registry",
                field_ref="nik",
            )
        )

    date_valid, gender, birth_date, date_finding = parse_nik_date(date_code)
    if date_finding:
        findings.append(date_finding)

    if seq_code == "0000":
        findings.append(
            Finding(
                type="INVALID_SEQUENCE_NUMBER",
                severity="high",
                description="Sequence number '0000' is invalid in Dukcapil specification",
                field_ref="nik",
            )
        )

    is_valid = len(findings) == 0
    return KTPValidationResult(
        is_valid=is_valid,
        province_code=prov_code,
        regency_code=reg_code,
        district_code=dist_code,
        gender=gender,
        birth_date_str=birth_date,
        sequence=seq_code,
        findings=findings,
    )


def cross_validate_ktp(fields: KTPFieldExtraction) -> KTPValidationResult:
    """Performs tamper cross-checking between NIK and plain text fields."""
    validation = validate_nik(fields.nik)
    tamper_findings: List[Finding] = list(validation.findings)
    tamper_score = 0.0

    if validation.is_valid:
        # Cross-check Gender
        if fields.jenis_kelamin:
            clean_gender = fields.jenis_kelamin.upper().strip()
            if "LAKI" in clean_gender and validation.gender != "LAKI-LAKI":
                tamper_score += 40.0
                tamper_findings.append(
                    Finding(
                        type="NIK_GENDER_MISMATCH",
                        severity="high",
                        description=f"Gender in text ('{fields.jenis_kelamin}') mismatches NIK decoded gender ('{validation.gender}')",
                        field_ref="jenis_kelamin",
                    )
                )
            elif "PEREMPUAN" in clean_gender and validation.gender != "PEREMPUAN":
                tamper_score += 40.0
                tamper_findings.append(
                    Finding(
                        type="NIK_GENDER_MISMATCH",
                        severity="high",
                        description=f"Gender in text ('{fields.jenis_kelamin}') mismatches NIK decoded gender ('{validation.gender}')",
                        field_ref="jenis_kelamin",
                    )
                )

        # Cross-check Birth Date
        if fields.tgl_lahir and validation.birth_date_str:
            norm_text_date = re.sub(r"[\s/.-]", "", fields.tgl_lahir)
            norm_nik_date = re.sub(r"[\s/.-]", "", validation.birth_date_str)
            # Check if day and month match
            if validation.birth_date_str not in fields.tgl_lahir:
                # Also test reversed format DD-MM-YYYY
                nik_dt = datetime.strptime(validation.birth_date_str, "%Y-%m-%d")
                dmy_str = nik_dt.strftime("%d-%m-%Y")
                dmy_compact = nik_dt.strftime("%d%m%Y")
                if dmy_str not in fields.tgl_lahir and dmy_compact not in norm_text_date:
                    tamper_score += 40.0
                    tamper_findings.append(
                        Finding(
                            type="NIK_BIRTHDATE_MISMATCH",
                            severity="high",
                            description=f"Birth date in text ('{fields.tgl_lahir}') mismatches NIK decoded date ('{validation.birth_date_str}')",
                            field_ref="tgl_lahir",
                        )
                    )

    validation.tamper_score = min(tamper_score, 100.0)
    validation.findings = tamper_findings
    return validation
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
uv run --directory services/processing pytest tests/test_nik_validation.py -v
```
Expected: PASS with 5 passed.

- [ ] **Step 5: Commit**

```bash
git add services/processing/app/schemas/ocr.py services/processing/app/services/ktp_parser.py services/processing/tests/test_nik_validation.py
git commit -m "feat(processing): implement e-KTP schemas and Dukcapil NIK validator"
```

---

### Task 3: Image Preprocessing & OCR Engine Wrapper

**Files:**
- Create: `services/processing/app/services/ocr_engine.py`
- Create: `services/processing/tests/test_ocr_engine.py`

**Interfaces:**
- Consumes: `AppConfig`, `get_settings()` from `app.config`
- Produces: `OCRLineResult`, `ImageQualityResult`, `OCREngine`, `assess_image_quality()`

- [ ] **Step 1: Write the failing tests for image assessment and OCR wrapper**

Create `services/processing/tests/test_ocr_engine.py`:

```python
import numpy as np
import cv2
import pytest
from app.services.ocr_engine import assess_image_quality, OCREngine, OCRLineResult


def test_assess_image_quality_sharp():
    # Create sharp synthetic image with high contrast edges
    img = np.zeros((800, 1000, 3), dtype=np.uint8)
    cv2.putText(img, "REPUBLIK INDONESIA", (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 3.0, (255, 255, 255), 5)
    quality = assess_image_quality(img)
    assert quality.width == 1000
    assert quality.height == 800
    assert quality.is_low_res is False
    assert quality.is_blurred is False
    assert quality.blur_score > 100.0
    assert len(quality.findings) == 0


def test_assess_image_quality_blurred():
    # Create heavily blurred image
    img = np.zeros((800, 1000, 3), dtype=np.uint8)
    cv2.putText(img, "BLUR TEST", (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 2.0, (255, 255, 255), 2)
    blurred = cv2.GaussianBlur(img, (51, 51), 0)
    quality = assess_image_quality(blurred)
    assert quality.is_blurred is True
    assert any(f.type == "BLURRED_IMAGE" for f in quality.findings)


def test_assess_image_quality_low_res():
    img = np.zeros((200, 300, 3), dtype=np.uint8)
    quality = assess_image_quality(img)
    assert quality.is_low_res is True
    assert any(f.type == "LOW_RESOLUTION" for f in quality.findings)


def test_ocr_engine_mock_extraction():
    engine = OCREngine(reader=None)  # None initializes mock/fallback reader for test mode
    lines = engine.extract_text(np.zeros((100, 100, 3), dtype=np.uint8), mock_output=[
        ("NIK : 3204051205900001", 0.95, [[10, 10], [200, 10], [200, 30], [10, 30]]),
        ("Nama : BUDI SANTOSO", 0.92, [[10, 35], [200, 35], [200, 55], [10, 55]]),
    ])
    assert len(lines) == 2
    assert lines[0].text == "NIK : 3204051205900001"
    assert lines[0].confidence == 0.95
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
uv run --directory services/processing pytest tests/test_ocr_engine.py -v
```
Expected: FAIL with ModuleNotFoundError: No module named 'app.services.ocr_engine'

- [ ] **Step 3: Write minimal implementation**

Create `services/processing/app/services/ocr_engine.py`:

```python
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

    gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY) if len(image_np.shape) == 3 else image_np
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
            self._reader = easyocr.Reader(["id", "en"], gpu=False)
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
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
uv run --directory services/processing pytest tests/test_ocr_engine.py -v
```
Expected: PASS with 4 passed.

- [ ] **Step 5: Commit**

```bash
git add services/processing/app/services/ocr_engine.py services/processing/tests/test_ocr_engine.py
git commit -m "feat(processing): add image quality assessment and OCR engine wrapper"
```

---

### Task 4: e-KTP Field Parser & OCR Router

**Files:**
- Modify: `services/processing/app/services/ktp_parser.py`
- Create: `services/processing/app/routers/__init__.py`
- Create: `services/processing/app/routers/ocr.py`
- Create: `services/processing/tests/test_ocr_endpoints.py`

**Interfaces:**
- Consumes: `OCREngine`, `assess_image_quality`, `cross_validate_ktp`
- Produces: `extract_ktp_fields_from_ocr()`, `router` with `POST /api/v1/ocr/ktp` and `POST /api/v1/ocr/document`

- [ ] **Step 1: Write the failing tests for OCR router endpoints**

Create `services/processing/tests/test_ocr_endpoints.py`:

```python
import io
import cv2
import numpy as np
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.routers.ocr import router
from app.services.ocr_engine import get_ocr_engine, OCREngine

app = FastAPI()
app.include_router(router, prefix="/api/v1/ocr")


@pytest.fixture
def client(monkeypatch):
    test_engine = OCREngine(reader="mock")
    # Mock extract_text to return standard e-KTP OCR lines
    def mock_extract(img, mock_output=None):
        return test_engine.extract_text(img, mock_output=[
            ("PROVINSI JAWA BARAT", 0.98, [[50, 10], [300, 10], [300, 30], [50, 30]]),
            ("KABUPATEN BANDUNG", 0.97, [[50, 35], [300, 35], [300, 55], [50, 55]]),
            ("NIK : 3204051205900001", 0.99, [[50, 70], [350, 70], [350, 95], [50, 95]]),
            ("Nama : BUDI SANTOSO", 0.96, [[50, 105], [350, 105], [350, 125], [50, 125]]),
            ("Tempat/Tgl Lahir : BANDUNG, 12-05-1990", 0.94, [[50, 130], [400, 130], [400, 150], [50, 150]]),
            ("Jenis Kelamin : LAKI-LAKI", 0.95, [[50, 155], [300, 155], [300, 175], [50, 175]]),
            ("Alamat : JL. RAYA SOREANG NO 45", 0.93, [[50, 180], [450, 180], [450, 200], [50, 200]]),
            ("Agama : ISLAM", 0.99, [[50, 205], [200, 205], [200, 225], [50, 225]]),
            ("Status Perkawinan : BELUM KAWIN", 0.95, [[50, 230], [350, 230], [350, 250], [50, 250]]),
            ("Pekerjaan : KARYAWAN SWASTA", 0.96, [[50, 255], [350, 255], [350, 275], [50, 275]]),
            ("Kewarganegaraan : WNI", 0.99, [[50, 280], [250, 280], [250, 300], [50, 300]]),
            ("Berlaku Hingga : SEUMUR HIDUP", 0.98, [[50, 305], [350, 305], [350, 325], [50, 325]]),
        ])

    monkeypatch.setattr(test_engine, "extract_text", mock_extract)
    app.dependency_overrides[get_ocr_engine] = lambda: test_engine
    yield TestClient(app)
    app.dependency_overrides.clear()


def create_synthetic_image_bytes(w=800, h=500):
    img = np.zeros((h, w, 3), dtype=np.uint8)
    cv2.putText(img, "TEST", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
    _, buf = cv2.imencode(".jpg", img)
    return io.BytesIO(buf.tobytes())


def test_post_ocr_ktp_success(client):
    file_bytes = create_synthetic_image_bytes()
    response = client.post(
        "/api/v1/ocr/ktp",
        files={"file": ("ktp.jpg", file_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert body["data"]["fields"]["nik"] == "3204051205900001"
    assert body["data"]["fields"]["nama"] == "BUDI SANTOSO"
    assert body["data"]["validation"]["is_valid"] is True
    assert body["data"]["validation"]["gender"] == "LAKI-LAKI"


def test_post_ocr_document_general(client):
    file_bytes = create_synthetic_image_bytes()
    response = client.post(
        "/api/v1/ocr/document",
        files={"file": ("doc.jpg", file_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert "lines" in body["data"]
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
uv run --directory services/processing pytest tests/test_ocr_endpoints.py -v
```
Expected: FAIL with ModuleNotFoundError: No module named 'app.routers.ocr'

- [ ] **Step 3: Write minimal implementation**

Add field regex parsing to `services/processing/app/services/ktp_parser.py`:

```python
def extract_ktp_fields_from_ocr(lines: List[Any]) -> KTPFieldExtraction:
    """Parses sequential OCR lines using regex rules for Indonesian e-KTP layout."""
    fields = KTPFieldExtraction()
    full_text = "\n".join([line.text for line in lines])

    for line in lines:
        txt = line.text.strip()
        conf = float(line.confidence)

        # NIK detection
        nik_match = re.search(r"\b(\d{16})\b", txt)
        if not nik_match:
            # Check for NIK : 3204...
            nik_match = re.search(r"NIK\s*[:;]?\s*([0-9Xx\s]{16,20})", txt, re.IGNORECASE)
            if nik_match:
                cleaned = re.sub(r"\D", "", nik_match.group(1))
                if len(cleaned) == 16 and not fields.nik:
                    fields.nik = cleaned
                    fields.field_confidences["nik"] = conf
        else:
            if not fields.nik:
                fields.nik = nik_match.group(1)
                fields.field_confidences["nik"] = conf

        # Nama
        nama_match = re.search(r"Nama\s*[:;]?\s*(.+)$", txt, re.IGNORECASE)
        if nama_match and not fields.nama:
            fields.nama = nama_match.group(1).strip()
            fields.field_confidences["nama"] = conf

        # Tempat / Tgl Lahir
        ttl_match = re.search(r"Tempat.*Lahir\s*[:;]?\s*(.+)$", txt, re.IGNORECASE)
        if ttl_match and not fields.tgl_lahir:
            ttl_val = ttl_match.group(1).strip()
            if "," in ttl_val:
                parts = ttl_val.split(",", 1)
                fields.tempat_lahir = parts[0].strip()
                fields.tgl_lahir = parts[1].strip()
            else:
                fields.tgl_lahir = ttl_val
            fields.field_confidences["tgl_lahir"] = conf

        # Jenis Kelamin
        jk_match = re.search(r"Jenis\s*Kelamin\s*[:;]?\s*(.+)$", txt, re.IGNORECASE)
        if jk_match and not fields.jenis_kelamin:
            val = jk_match.group(1).strip()
            if "LAKI" in val.upper():
                fields.jenis_kelamin = "LAKI-LAKI"
            elif "PEREMPUAN" in val.upper():
                fields.jenis_kelamin = "PEREMPUAN"
            else:
                fields.jenis_kelamin = val
            fields.field_confidences["jenis_kelamin"] = conf

        # Alamat
        alamat_match = re.search(r"Alamat\s*[:;]?\s*(.+)$", txt, re.IGNORECASE)
        if alamat_match and not fields.alamat:
            fields.alamat = alamat_match.group(1).strip()
            fields.field_confidences["alamat"] = conf

        # Agama
        agama_match = re.search(r"Agama\s*[:;]?\s*(.+)$", txt, re.IGNORECASE)
        if agama_match and not fields.agama:
            fields.agama = agama_match.group(1).strip()
            fields.field_confidences["agama"] = conf

        # Status Perkawinan
        kawin_match = re.search(r"Status\s*Perkawinan\s*[:;]?\s*(.+)$", txt, re.IGNORECASE)
        if kawin_match and not fields.status_perkawinan:
            fields.status_perkawinan = kawin_match.group(1).strip()
            fields.field_confidences["status_perkawinan"] = conf

        # Pekerjaan
        kerja_match = re.search(r"Pekerjaan\s*[:;]?\s*(.+)$", txt, re.IGNORECASE)
        if kerja_match and not fields.pekerjaan:
            fields.pekerjaan = kerja_match.group(1).strip()
            fields.field_confidences["pekerjaan"] = conf

        # Kewarganegaraan
        wn_match = re.search(r"Kewarganegaraan\s*[:;]?\s*(.+)$", txt, re.IGNORECASE)
        if wn_match and not fields.kewarganegaraan:
            fields.kewarganegaraan = wn_match.group(1).strip()
            fields.field_confidences["kewarganegaraan"] = conf

        # Berlaku Hingga
        berlaku_match = re.search(r"Berlaku\s*Hingga\s*[:;]?\s*(.+)$", txt, re.IGNORECASE)
        if berlaku_match and not fields.berlaku_hingga:
            fields.berlaku_hingga = berlaku_match.group(1).strip()
            fields.field_confidences["berlaku_hingga"] = conf

    return fields
```

Create `services/processing/app/routers/__init__.py`.

Create `services/processing/app/routers/ocr.py`:

```python
from typing import Any, Dict, List
import cv2
import numpy as np
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from app.config import AppConfig, get_settings
from app.schemas.common import ProcessEnvelope
from app.schemas.ocr import KTPFieldExtraction, KTPProcessResult, KTPValidationResult
from app.services.ktp_parser import cross_validate_ktp, extract_ktp_fields_from_ocr
from app.services.ocr_engine import assess_image_quality, get_ocr_engine, OCREngine

router = APIRouter(tags=["OCR"])


async def read_image_from_upload(upload_file: UploadFile) -> np.ndarray:
    contents = await upload_file.read()
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

    lines_payload = [
        {"text": l.text, "confidence": l.confidence, "bbox": l.bbox}
        for l in extracted_lines
    ]

    return ProcessEnvelope[Dict[str, Any]](
        status="partial" if quality.is_blurred else "success",
        confidence=round(avg_conf, 1),
        model_version=settings.ocr_model_version,
        data={"lines": lines_payload, "total_lines": len(lines_payload)},
        findings=quality.findings,
    )
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
uv run --directory services/processing pytest tests/test_ocr_endpoints.py -v
```
Expected: PASS with 2 passed.

- [ ] **Step 5: Commit**

```bash
git add services/processing/app/services/ktp_parser.py services/processing/app/routers/ services/processing/tests/test_ocr_endpoints.py
git commit -m "feat(processing): add e-KTP field extraction and OCR REST endpoints"
```

---

### Task 5: Survey Form ICR Engine & Router

**Files:**
- Create: `services/processing/app/schemas/icr.py`
- Create: `services/processing/app/services/icr_engine.py`
- Create: `services/processing/app/routers/icr.py`
- Create: `services/processing/tests/test_icr_endpoints.py`

**Interfaces:**
- Consumes: `ProcessEnvelope`, `Finding`, `OCREngine`
- Produces: `ICRFormResult`, `ICRField`, `extract_survey_form_icr()`, `router` with `POST /api/v1/icr/survey-form`

- [ ] **Step 1: Write the failing tests for survey form ICR**

Create `services/processing/tests/test_icr_endpoints.py`:

```python
import io
import cv2
import numpy as np
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.routers.icr import router
from app.services.ocr_engine import get_ocr_engine, OCREngine

app = FastAPI()
app.include_router(router, prefix="/api/v1/icr")


@pytest.fixture
def client(monkeypatch):
    test_engine = OCREngine(reader="mock")

    def mock_extract(img, mock_output=None):
        return test_engine.extract_text(img, mock_output=[
            ("FORM SURVEY KELAYAKAN CMO", 0.95, [[10, 10], [300, 10], [300, 30], [10, 30]]),
            ("Nama Debitur : AHMAD FAUZI", 0.85, [[10, 40], [250, 40], [250, 60], [10, 60]]),
            ("Pekerjaan : WIRASWASTA", 0.55, [[10, 70], [250, 70], [250, 90], [10, 90]]),  # Low conf < 0.60
            ("Penghasilan Per Bulan : Rp 8.500.000", 0.88, [[10, 100], [300, 100], [300, 120], [10, 120]]),
            ("Kondisi Rumah : MILIK SENDIRI", 0.78, [[10, 130], [280, 130], [280, 150], [10, 150]]),
        ])

    monkeypatch.setattr(test_engine, "extract_text", mock_extract)
    app.dependency_overrides[get_ocr_engine] = lambda: test_engine
    yield TestClient(app)
    app.dependency_overrides.clear()


def create_synthetic_image_bytes():
    img = np.zeros((800, 600, 3), dtype=np.uint8)
    cv2.putText(img, "SURVEY FORM", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
    _, buf = cv2.imencode(".jpg", img)
    return io.BytesIO(buf.tobytes())


def test_post_icr_survey_form(client):
    file_bytes = create_synthetic_image_bytes()
    response = client.post(
        "/api/v1/icr/survey-form",
        files={"file": ("survey_form.jpg", file_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] in ["success", "partial"]
    assert "Nama Debitur" in body["data"]["fields"]
    assert body["data"]["fields"]["Nama Debitur"]["value"] == "AHMAD FAUZI"
    # Pekerjaan had confidence 0.55 (< 0.60), so finding must be created
    assert any(f.type == "LOW_CONFIDENCE_FIELD" for f in body["findings"])
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
uv run --directory services/processing pytest tests/test_icr_endpoints.py -v
```
Expected: FAIL with ModuleNotFoundError: No module named 'app.schemas.icr'

- [ ] **Step 3: Write minimal implementation**

Create `services/processing/app/schemas/icr.py`:

```python
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ICRField(BaseModel):
    label: str
    value: str
    confidence: float
    bbox: List[List[int]] = Field(default_factory=list)
    needs_review: bool = False


class ICRFormResult(BaseModel):
    form_type: str = "SURVEY_FORM_CMO"
    fields: Dict[str, ICRField] = Field(default_factory=dict)
    raw_text: str = ""
```

Create `services/processing/app/services/icr_engine.py`:

```python
import re
from typing import List, Tuple
import numpy as np
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
```

Create `services/processing/app/routers/icr.py`:

```python
import numpy as np
from fastapi import APIRouter, Depends, File, UploadFile
from app.config import AppConfig, get_settings
from app.routers.ocr import read_image_from_upload
from app.schemas.common import ProcessEnvelope
from app.schemas.icr import ICRFormResult
from app.services.icr_engine import extract_survey_form_icr
from app.services.ocr_engine import assess_image_quality, get_ocr_engine, OCREngine

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

    status = "partial" if (quality.is_blurred or len(all_findings) > 0) else "success"

    return ProcessEnvelope[ICRFormResult](
        status=status,
        confidence=round(avg_conf, 1),
        model_version=settings.ocr_model_version,
        data=icr_result,
        findings=all_findings,
    )
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
uv run --directory services/processing pytest tests/test_icr_endpoints.py -v
```
Expected: PASS with 1 passed.

- [ ] **Step 5: Commit**

```bash
git add services/processing/app/schemas/icr.py services/processing/app/services/icr_engine.py services/processing/app/routers/icr.py services/processing/tests/test_icr_endpoints.py
git commit -m "feat(processing): add survey form ICR extraction and endpoint"
```

---

### Task 6: Audio Transcription Engine & Hesitation Detector

**Files:**
- Create: `services/processing/app/schemas/voice.py`
- Create: `services/processing/app/services/audio_engine.py`
- Create: `services/processing/tests/test_audio_engine.py`

**Interfaces:**
- Consumes: `AppConfig`, `get_settings()`
- Produces: `AudioSegment`, `TranscriptionResult`, `detect_hesitation_pauses()`, `AudioEngine`

- [ ] **Step 1: Write the failing tests for audio hesitation detection and engine**

Create `services/processing/tests/test_audio_engine.py`:

```python
import pytest
from app.schemas.voice import AudioSegment
from app.services.audio_engine import detect_hesitation_pauses, AudioEngine


def test_detect_hesitation_pauses_found():
    # Segment 1 ends at 2.0s, Segment 2 starts at 4.0s -> pause = 2.0s (> 1.5s threshold)
    segments = [
        AudioSegment(id=0, start=0.0, end=2.0, text="Selamat pagi bapak", speaker="agent"),
        AudioSegment(id=1, start=4.0, end=6.5, text="Iya pagi mba", speaker="customer"),
    ]
    findings = detect_hesitation_pauses(segments, threshold_sec=1.5)
    assert len(findings) == 1
    assert findings[0].type == "HESITATION_LONG_PAUSE"
    assert findings[0].timestamp == 2.0


def test_detect_hesitation_disfluency_keywords():
    segments = [
        AudioSegment(id=0, start=0.0, end=2.0, text="Ee.. anu.. saya kurang yakin pak", speaker="customer"),
    ]
    findings = detect_hesitation_pauses(segments, threshold_sec=1.5)
    assert any(f.type == "HESITATION_KEYWORD" for f in findings)


def test_audio_engine_mock_transcribe():
    engine = AudioEngine(model=None)
    result = engine.transcribe_file(
        "dummy.wav",
        mock_segments=[
            AudioSegment(id=0, start=0.0, end=1.5, text="Halo selamat pagi", speaker="agent"),
            AudioSegment(id=1, start=1.8, end=3.5, text="Iya dengan siapa ini", speaker="customer"),
        ]
    )
    assert result.duration == 3.5
    assert len(result.segments) == 2
    assert "Halo selamat pagi" in result.full_transcript
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
uv run --directory services/processing pytest tests/test_audio_engine.py -v
```
Expected: FAIL with ModuleNotFoundError: No module named 'app.schemas.voice'

- [ ] **Step 3: Write minimal implementation**

Create `services/processing/app/schemas/voice.py`:

```python
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field
from app.schemas.common import Finding


class AudioSegment(BaseModel):
    id: int
    start: float = Field(..., description="Start timestamp in seconds")
    end: float = Field(..., description="End timestamp in seconds")
    text: str
    speaker: Literal["agent", "customer", "unknown"] = "unknown"
    confidence: float = 1.0


class TranscriptionResult(BaseModel):
    language: str = "id"
    duration: float = 0.0
    full_transcript: str = ""
    segments: List[AudioSegment] = Field(default_factory=list)


class ScriptCheckItem(BaseModel):
    stage: str
    description: str
    passed: bool
    matched_utterance: Optional[str] = None


class VoiceQAResult(BaseModel):
    transcription: TranscriptionResult
    qa_score: float = Field(..., ge=0.0, le=100.0, description="Overall compliance QA score 0-100")
    script_adherence: List[ScriptCheckItem] = Field(default_factory=list)
    hesitation_count: int = 0
```

Create `services/processing/app/services/audio_engine.py`:

```python
import os
import re
from typing import Any, List, Optional
from app.config import get_settings
from app.schemas.common import Finding
from app.schemas.voice import AudioSegment, TranscriptionResult

HESITATION_KEYWORDS = [
    r"\bee+\b",
    r"\banu+\b",
    r"\bnganu\b",
    r"\bapaan ya\b",
    r"\bradak lupa\b",
    r"\blupa saya\b",
]


def detect_hesitation_pauses(
    segments: List[AudioSegment],
    threshold_sec: float = 1.5,
) -> List[Finding]:
    """Detects acoustic silence gaps (>1.5s) between turns and disfluency phrases."""
    findings: List[Finding] = []

    # 1. Silence gaps between consecutive segments
    for i in range(len(segments) - 1):
        gap = segments[i + 1].start - segments[i].end
        if gap >= threshold_sec:
            findings.append(
                Finding(
                    type="HESITATION_LONG_PAUSE",
                    severity="medium",
                    description=f"Long acoustic pause ({gap:.2f}s >= {threshold_sec}s) detected before response.",
                    timestamp=round(segments[i].end, 2),
                )
            )

    # 2. Verbal disfluencies in customer speech
    for seg in segments:
        text_lower = seg.text.lower()
        for kw in HESITATION_KEYWORDS:
            if re.search(kw, text_lower):
                findings.append(
                    Finding(
                        type="HESITATION_KEYWORD",
                        severity="low",
                        description=f"Hesitation / uncertainty marker detected: '{seg.text}'",
                        timestamp=round(seg.start, 2),
                    )
                )
                break

    return findings


class AudioEngine:
    def __init__(self, model: Optional[Any] = None):
        self._model = model

    def _get_model(self):
        if self._model is None:
            from faster_whisper import WhisperModel
            settings = get_settings()
            self._model = WhisperModel(
                settings.whisper_model_size,
                device=settings.whisper_device,
                compute_type=settings.whisper_compute_type,
            )
        return self._model

    def transcribe_file(
        self,
        audio_path: str,
        mock_segments: Optional[List[AudioSegment]] = None,
    ) -> TranscriptionResult:
        if mock_segments is not None:
            duration = mock_segments[-1].end if mock_segments else 0.0
            full_txt = " ".join([s.text for s in mock_segments])
            return TranscriptionResult(
                language="id",
                duration=duration,
                full_transcript=full_txt,
                segments=mock_segments,
            )

        model = self._get_model()
        segments_generator, info = model.transcribe(
            audio_path,
            language="id",
            beam_size=5,
            vad_filter=True,
        )

        parsed_segments: List[AudioSegment] = []
        full_texts: List[str] = []

        for idx, s in enumerate(segments_generator):
            clean_text = s.text.strip()
            full_texts.append(clean_text)
            parsed_segments.append(
                AudioSegment(
                    id=idx,
                    start=round(float(s.start), 2),
                    end=round(float(s.end), 2),
                    text=clean_text,
                    confidence=round(float(np.exp(s.avg_logprob)), 2) if hasattr(s, "avg_logprob") else 0.9,
                    speaker="agent" if idx % 2 == 0 else "customer",
                )
            )

        return TranscriptionResult(
            language=info.language if hasattr(info, "language") else "id",
            duration=round(float(info.duration), 2) if hasattr(info, "duration") else 0.0,
            full_transcript=" ".join(full_texts),
            segments=parsed_segments,
        )


_default_audio_engine: Optional[AudioEngine] = None


def get_audio_engine() -> AudioEngine:
    global _default_audio_engine
    if _default_audio_engine is None:
        _default_audio_engine = AudioEngine()
    return _default_audio_engine
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
uv run --directory services/processing pytest tests/test_audio_engine.py -v
```
Expected: PASS with 3 passed.

- [ ] **Step 5: Commit**

```bash
git add services/processing/app/schemas/voice.py services/processing/app/services/audio_engine.py services/processing/tests/test_audio_engine.py
git commit -m "feat(processing): add audio transcription schemas and hesitation detector"
```

---

### Task 7: Voice QA Compliance Scoring & Voice Router

**Files:**
- Create: `services/processing/app/services/voice_qa.py`
- Create: `services/processing/app/routers/voice.py`
- Create: `services/processing/tests/test_voice_endpoints.py`

**Interfaces:**
- Consumes: `AudioEngine`, `TranscriptionResult`, `detect_hesitation_pauses`
- Produces: `audit_script_compliance()`, `calculate_voice_qa()`, `router` with `POST /api/v1/voice/transcribe` and `POST /api/v1/voice/analyze`

- [ ] **Step 1: Write the failing tests for voice QA endpoints and script compliance**

Create `services/processing/tests/test_voice_endpoints.py`:

```python
import io
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.routers.voice import router
from app.schemas.voice import AudioSegment
from app.services.audio_engine import get_audio_engine, AudioEngine
from app.services.voice_qa import audit_script_compliance, calculate_voice_qa

app = FastAPI()
app.include_router(router, prefix="/api/v1/voice")


def sample_compliant_segments():
    return [
        AudioSegment(id=0, start=0.0, end=2.0, text="Selamat pagi dengan saya dari BAF Finance", speaker="agent"),
        AudioSegment(id=1, start=2.5, end=4.0, text="Iya selamat pagi mba", speaker="customer"),
        AudioSegment(id=2, start=4.2, end=7.0, text="Panggilan ini direkam untuk keperluan verifikasi pengajuan pembiayaan", speaker="agent"),
        AudioSegment(id=3, start=7.2, end=9.0, text="Baik silakan mba", speaker="customer"),
        AudioSegment(id=4, start=9.2, end=12.0, text="Bisa konfirmasi nama lengkap dan tanggal lahir bapak?", speaker="agent"),
        AudioSegment(id=5, start=12.2, end=14.0, text="Nama saya Budi Santoso lahir 12 Mei 1990", speaker="customer"),
        AudioSegment(id=6, start=14.2, end=16.0, text="Terima kasih bapak telah meluangkan waktu, selamat beraktivitas", speaker="agent"),
    ]


def test_audit_script_compliance():
    segments = sample_compliant_segments()
    checklist = audit_script_compliance(segments)
    assert len(checklist) == 4
    assert all(item.passed for item in checklist)


def test_calculate_voice_qa():
    segments = sample_compliant_segments()
    qa_result, findings = calculate_voice_qa(segments)
    assert qa_result.qa_score >= 85.0
    assert qa_result.hesitation_count == 0


@pytest.fixture
def client(monkeypatch):
    test_engine = AudioEngine(model="mock")

    def mock_transcribe(audio_path, mock_segments=None):
        return test_engine.transcribe_file(audio_path, mock_segments=sample_compliant_segments())

    monkeypatch.setattr(test_engine, "transcribe_file", mock_transcribe)
    app.dependency_overrides[get_audio_engine] = lambda: test_engine
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_post_voice_transcribe(client):
    fake_audio = io.BytesIO(b"RIFF....WAVEfmt ....data....")
    response = client.post(
        "/api/v1/voice/transcribe",
        files={"file": ("call.wav", fake_audio, "audio/wav")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert len(body["data"]["segments"]) == 7


def test_post_voice_analyze(client):
    fake_audio = io.BytesIO(b"RIFF....WAVEfmt ....data....")
    response = client.post(
        "/api/v1/voice/analyze",
        files={"file": ("call.wav", fake_audio, "audio/wav")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert body["data"]["qa_score"] >= 85.0
    assert len(body["data"]["script_adherence"]) == 4
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
uv run --directory services/processing pytest tests/test_voice_endpoints.py -v
```
Expected: FAIL with ModuleNotFoundError: No module named 'app.services.voice_qa'

- [ ] **Step 3: Write minimal implementation**

Create `services/processing/app/services/voice_qa.py`:

```python
import re
from typing import List, Tuple
from app.schemas.common import Finding
from app.schemas.voice import AudioSegment, ScriptCheckItem, TranscriptionResult, VoiceQAResult
from app.services.audio_engine import detect_hesitation_pauses

OJK_STAGES = [
    {
        "stage": "1. GREETING & IDENTITY",
        "description": "Agent states official greeting and company identity (BAF / PT Bussan Auto Finance)",
        "patterns": [r"baf\b", r"bussan auto finance", r"selamat (pagi|siang|sore)", r"dengan saya"],
    },
    {
        "stage": "2. PURPOSE & RECORDING DISCLOSURE",
        "description": "Agent discloses call purpose and mandatory recording notice",
        "patterns": [r"direkam", r"rekaman", r"verifikasi", r"pengajuan", r"pembiayaan"],
    },
    {
        "stage": "3. DATA CONFIRMATION",
        "description": "Confirmation of customer identity, birthdate, or collateral",
        "patterns": [r"konfirmasi", r"nama", r"tanggal lahir", r"unit", r"motor", r"jaminan"],
    },
    {
        "stage": "4. CLOSING STATEMENT",
        "description": "Professional closing thanking the customer",
        "patterns": [r"terima kasih", r"selamat beraktivitas", r"selamat (pagi|siang|sore)"],
    },
]


def audit_script_compliance(segments: List[AudioSegment]) -> List[ScriptCheckItem]:
    """Audits agent utterances against OJK / BAF standard tele-verification stages."""
    agent_texts = [s.text for s in segments if s.speaker in ["agent", "unknown"]]
    full_agent_text = " ".join(agent_texts).lower()

    checklist: List[ScriptCheckItem] = []
    for item in OJK_STAGES:
        matches = [p for p in item["patterns"] if re.search(p, full_agent_text)]
        passed = len(matches) >= 1
        matched_sample = None
        if passed:
            for text in agent_texts:
                if any(re.search(p, text.lower()) for p in item["patterns"]):
                    matched_sample = text
                    break

        checklist.append(
            ScriptCheckItem(
                stage=item["stage"],
                description=item["description"],
                passed=passed,
                matched_utterance=matched_sample,
            )
        )
    return checklist


def calculate_voice_qa(segments: List[AudioSegment]) -> Tuple[VoiceQAResult, List[Finding]]:
    """Calculates composite QA compliance score (0-100) and aggregates findings."""
    checklist = audit_script_compliance(segments)
    hesitation_findings = detect_hesitation_pauses(segments)

    passed_count = sum(1 for c in checklist if c.passed)
    stage_score = (passed_count / len(checklist)) * 70.0  # Up to 70% from script adherence

    # Hesitation deductions (up to 30% penalty)
    hesitation_count = len(hesitation_findings)
    hesitation_penalty = min(hesitation_count * 5.0, 30.0)
    final_qa_score = max(0.0, min(100.0, stage_score + (30.0 - hesitation_penalty)))

    all_findings = list(hesitation_findings)
    for c in checklist:
        if not c.passed:
            all_findings.append(
                Finding(
                    type="SCRIPT_STAGE_MISSED",
                    severity="high" if "RECORDING" in c.stage else "medium",
                    description=f"OJK compliance stage not fulfilled: {c.stage} - {c.description}",
                )
            )

    full_txt = " ".join([s.text for s in segments])
    duration = segments[-1].end if segments else 0.0

    qa_result = VoiceQAResult(
        transcription=TranscriptionResult(
            language="id",
            duration=duration,
            full_transcript=full_txt,
            segments=segments,
        ),
        qa_score=round(final_qa_score, 1),
        script_adherence=checklist,
        hesitation_count=hesitation_count,
    )
    return qa_result, all_findings
```

Create `services/processing/app/routers/voice.py`:

```python
import os
import shutil
import tempfile
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from app.config import AppConfig, get_settings
from app.schemas.common import ProcessEnvelope
from app.schemas.voice import TranscriptionResult, VoiceQAResult
from app.services.audio_engine import get_audio_engine, AudioEngine
from app.services.voice_qa import calculate_voice_qa

router = APIRouter(tags=["Voice Analytics"])


async def save_temp_audio(upload_file: UploadFile) -> str:
    suffix = os.path.splitext(upload_file.filename or "")[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(upload_file.file, tmp)
        return tmp.name


@router.post("/transcribe", response_model=ProcessEnvelope[TranscriptionResult])
async def transcribe_audio(
    file: UploadFile = File(...),
    audio_engine: AudioEngine = Depends(get_audio_engine),
    settings: AppConfig = Depends(get_settings),
):
    tmp_path = await save_temp_audio(file)
    try:
        result = audio_engine.transcribe_file(tmp_path)
        return ProcessEnvelope[TranscriptionResult](
            status="success",
            confidence=90.0,
            model_version=settings.voice_model_version,
            data=result,
            findings=[],
        )
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.post("/analyze", response_model=ProcessEnvelope[VoiceQAResult])
async def analyze_voice_call(
    file: UploadFile = File(...),
    audio_engine: AudioEngine = Depends(get_audio_engine),
    settings: AppConfig = Depends(get_settings),
):
    tmp_path = await save_temp_audio(file)
    try:
        transcript = audio_engine.transcribe_file(tmp_path)
        qa_result, findings = calculate_voice_qa(transcript.segments)

        status = "failed" if qa_result.qa_score < 50.0 else (
            "partial" if qa_result.qa_score < 80.0 or findings else "success"
        )

        return ProcessEnvelope[VoiceQAResult](
            status=status,
            confidence=qa_result.qa_score,
            model_version=settings.voice_model_version,
            data=qa_result,
            findings=findings,
        )
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
uv run --directory services/processing pytest tests/test_voice_endpoints.py -v
```
Expected: PASS with 4 passed.

- [ ] **Step 5: Commit**

```bash
git add services/processing/app/services/voice_qa.py services/processing/app/routers/voice.py services/processing/tests/test_voice_endpoints.py
git commit -m "feat(processing): add voice QA scoring, compliance auditing and endpoints"
```

---

### Task 8: FastAPI Application Assembly, Health Endpoint & End-to-End Verification

**Files:**
- Create: `services/processing/app/main.py`
- Create: `services/processing/tests/test_main.py`

**Interfaces:**
- Consumes: `AppConfig`, `get_settings`, all routers (`ocr.router`, `icr.router`, `voice.router`)
- Produces: `app` FastAPI application instance, `GET /health` endpoint

- [ ] **Step 1: Write the failing tests for main app & health check**

Create `services/processing/tests/test_main.py`:

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert "version" in body
    assert "device" in body
    assert "models" in body
    assert body["models"]["ocr"] == "easyocr-id-en-v1"
    assert body["models"]["voice"] == "faster-whisper-small-id-v1"


def test_root_redirect_or_welcome(client):
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert "message" in body
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
uv run --directory services/processing pytest tests/test_main.py -v
```
Expected: FAIL with ModuleNotFoundError: No module named 'app.main'

- [ ] **Step 3: Write minimal implementation**

Create `services/processing/app/main.py`:

```python
from contextlib import asynccontextmanager
from typing import Any, Dict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import icr, ocr, voice


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions (if any)
    yield
    # Shutdown actions (if any)


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Unified Python Processing Service for e-KTP OCR, ICR, and Voice Analytics",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ocr.router, prefix="/api/v1/ocr")
app.include_router(icr.router, prefix="/api/v1/icr")
app.include_router(voice.router, prefix="/api/v1/voice")


@app.get("/")
async def root() -> Dict[str, str]:
    return {
        "message": "Welcome to VeriFin Python Processing Service",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health_check() -> Dict[str, Any]:
    cfg = get_settings()
    return {
        "status": "healthy",
        "version": cfg.version,
        "device": cfg.whisper_device,
        "models": {
            "ocr": cfg.ocr_model_version,
            "voice": cfg.voice_model_version,
        },
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
uv run --directory services/processing pytest tests/test_main.py -v
```
Expected: PASS with 2 passed.

- [ ] **Step 5: Run full test suite across entire service**

Run:
```bash
uv run --directory services/processing pytest -v
```
Expected: All tests pass across common schemas, NIK validation, OCR, ICR, Voice QA, and Main application.

- [ ] **Step 6: Commit**

```bash
git add services/processing/app/main.py services/processing/tests/test_main.py
git commit -m "feat(processing): assemble main FastAPI application and health check endpoint"
```
