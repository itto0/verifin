# Design Spec: Local Python OCR/ICR & Voice-to-Text Services

- **Date:** 2026-11-10
- **Status:** Approved
- **Topic:** Lightweight, unified Python processing service for OCR/ICR (e-KTP, survey forms) and Voice-to-Text with OJK/BAF QA analytics based on the VeriFin Backend Processing PRD.

---

## 1. Overview & Objectives

This specification defines the architecture, data models, endpoints, and processing logic for the VeriFin Python processing service. Fulfilling the requirements of the **VeriFin for BAF Backend & Processing PRD** (specifically Part B: Section 9 Document Processing: OCR/ICR, Section 10 e-KTP Validation, and Section 12 Voice Analytics), this service provides local, on-premise capable extraction and analytics.

### Key Goals
1. **Local e-KTP OCR & Algorithmic Validation**:
   - Extract 14 standard e-KTP fields using local computer vision and OCR.
   - Perform algorithmic Dukcapil validation (province, regency, district code lookup, female birth date $+40$ day offset, sequence numbers).
   - Compute document image quality (sharpness, blur detection) and tamper detection indicators.
2. **Local ICR (Intelligent Character Recognition)**:
   - Extract semi-structured handwriting from field surveyor forms and BPN land certificates.
   - Return per-field bounding boxes and confidence scores.
3. **Local Voice-to-Text & QA Analytics**:
   - Transcribe audio files in Bahasa Indonesia with segment timestamps.
   - Detect acoustic doubt/hesitancy (pauses $>1.5$ seconds) and conversational flags.
   - Audit tele-verification calls against OJK & BAF SOP scripts and calculate compliance QA scores.
4. **Unified API Contract**:
   - Deliver all outputs inside the standard PRD result envelope (`status`, `confidence`, `findings[]`, `evidence_refs[]`, `model_version`, `processed_at`).

---

## 2. Technology Stack & Architecture

- **Runtime & Management**: Python 3.10+ managed via `uv` / `pyproject.toml`.
- **Web Framework**: FastAPI with `uvicorn` for asynchronous request handling.
- **Image Processing & OCR**:
  - `Pillow` and `opencv-python-headless` for image preprocessing (CLAHE, deskewing, Laplacian blur estimation).
  - `easyocr` (or `paddleocr` fallback) for local multilingual OCR supporting Indonesian (`id`) and English (`en`).
- **Audio Processing & STT**:
  - `faster-whisper` (CTranslate2) utilizing `base` or `small` multilingual Whisper models running on CPU/CUDA.
  - Timestamp-based hesitation analyzer and script compliance matcher.
- **Data Validation & Serialization**: Pydantic v2.

### Directory Structure
```text
services/processing/
├── pyproject.toml
├── README.md
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── common.py           # Standard PRD envelope
│   │   ├── ocr.py              # KTP and document schemas
│   │   ├── icr.py              # Handwriting survey form schemas
│   │   └── voice.py            # Audio transcription and QA schemas
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ocr_engine.py       # Image preprocessing & OCR reader wrapper
│   │   ├── ktp_parser.py       # e-KTP field extraction & Dukcapil NIK validator
│   │   ├── icr_engine.py       # Handwriting form key-value extractor
│   │   ├── audio_engine.py     # Faster-Whisper wrapper & pause detector
│   │   └── voice_qa.py         # OJK script compliance & speaker diarization
│   └── routers/
│       ├── __init__.py
│       ├── ocr.py              # POST /api/v1/ocr/ktp, POST /api/v1/ocr/document
│       ├── icr.py              # POST /api/v1/icr/survey-form
│       └── voice.py            # POST /api/v1/voice/transcribe, POST /api/v1/voice/analyze
└── tests/
    ├── __init__.py
    ├── test_nik_validation.py
    ├── test_ocr_endpoints.py
    └── test_voice_endpoints.py
```

---

## 3. Detailed Specifications

### 3.1 Common Result Envelope (`schemas/common.py`)
All endpoints conform to the PRD section 3 standard envelope:
- `status`: `"success"` | `"partial"` | `"failed"`
- `confidence`: float (0–100)
- `model_version`: string identifier
- `processed_at`: ISO 8601 UTC timestamp
- `data`: Typed payload
- `findings`: Array of risk findings (`type`, `severity`, `description`, `timestamp`/`field_ref`)
- `evidence_refs`: Array of artifact references

### 3.2 e-KTP OCR & Tamper Analysis (`services/ktp_parser.py`, `routers/ocr.py`)
- **Inputs**: Multipart image file (`image/jpeg`, `image/png`, etc.) or base64 image.
- **Image Quality Check**:
  - Sharpness check via OpenCV Laplacian variance ($Var < 100 \rightarrow$ `BLURRED_IMAGE`).
  - Minimum resolution verification ($width < 600px \rightarrow$ `LOW_RESOLUTION`).
- **Field Extraction**:
  - Regular expression and positional matching for: `nik`, `nama`, `tempat_lahir`, `tgl_lahir`, `jenis_kelamin`, `alamat`, `rt_rw`, `kel_desa`, `kecamatan`, `agama`, `status_perkawinan`, `pekerjaan`, `kewarganegaraan`, `berlaku_hingga`.
- **Algorithmic NIK Validation (PR-KTP-01)**:
  - 16 digits check.
  - Digits 1–2: Province code, Digits 3–4: Regency/City code, Digits 5–6: District code.
  - Digits 7–12: Birthdate (DDMMYY). If female, $DD = \text{day} + 40$.
  - Digits 13–16: 4-digit sequence number ($0001-9999$).
  - Cross-check NIK decoded date & gender with extracted `tgl_lahir` and `jenis_kelamin`.
- **Tampering Indicators (PR-KTP-02)**:
  - Inconsistency between NIK and plain text fields adds anomaly flags and sets `tamper_score >= 70`.

### 3.3 Survey Form ICR (`services/icr_engine.py`, `routers/icr.py`)
- **Inputs**: Survey form image (JPEG/PNG/PDF).
- **Processing**:
  - Detect text boxes with line/contour analysis.
  - Associate key-value pairs (e.g. "Nama Debitur", "Pekerjaan", "Kondisi Rumah", "Penghasilan").
  - Flag low-confidence handwriting ($confidence < 60\%$) for human surveyor review.

### 3.4 Voice Analytics & QA Scoring (`services/audio_engine.py`, `services/voice_qa.py`, `routers/voice.py`)
- **Inputs**: Audio file (`.mp3`, `.wav`, `.m4a`, `.ogg`) + optional reference application data (customer name, NIK, birthdate).
- **Processing**:
  - `faster-whisper` transcribe with `language="id"` producing segmented transcripts with start/end timestamps.
  - Detect acoustic doubt/hesitancy: silence gaps $>1.5$ seconds between conversational turns or disfluency keywords (`"ee.."`, `"anu.."`).
  - Speaker identification: classify utterances as `agent` or `customer` based on greeting/turn sequence or audio channels.
  - OJK Script Adherence Checklist:
    1. Greeting & Agent Identity (BAF official identification).
    2. Purpose disclosure & recording statement.
    3. Mandatory customer data verification (Name, NIK, Birthdate, Collateral unit).
    4. Closing statement.
  - QA Scoring: calculate composite score (0–100%) based on script checklist compliance and absence of hesitancy/mismatch flags.

---

## 4. Endpoints Overview

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Service health, model status, and device info (CPU/CUDA) |
| `POST` | `/api/v1/ocr/ktp` | Upload e-KTP image, extract fields, validate NIK, detect tampering |
| `POST` | `/api/v1/ocr/document` | General document OCR (printed forms, payslips, KK) |
| `POST` | `/api/v1/icr/survey-form` | Handwritten surveyor form ICR extraction |
| `POST` | `/api/v1/voice/transcribe` | Pure speech-to-text transcript generation with timestamps |
| `POST` | `/api/v1/voice/analyze` | Comprehensive voice QA analysis, hesitancy detection & compliance scoring |

---

## 5. Testing & Verification Plan

1. **Unit Tests (`tests/test_nik_validation.py`)**:
   - Valid male NIK (normal date representation).
   - Valid female NIK ($+40$ day offset).
   - Invalid/Tampered NIK (impossible month, invalid district sequence, date mismatch).
2. **Endpoint Tests (`tests/test_ocr_endpoints.py`)**:
   - Mocked/synthetic image upload to `/api/v1/ocr/ktp`.
   - Quality check failure simulation (small/blank image).
3. **Voice Tests (`tests/test_voice_endpoints.py`)**:
   - Short audio verification with `/api/v1/voice/transcribe` and `/api/v1/voice/analyze`.
   - Hesitancy pause detection assertion ($>1.5\text{s}$).
4. **Integration Verification**:
   - Service starts cleanly via `uvicorn app.main:app`.
   - Health check returns `200 OK`.
