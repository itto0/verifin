import io
import cv2
from fastapi import FastAPI
from fastapi.testclient import TestClient
import numpy as np
import pytest

from app.routers.icr import router
from app.schemas.common import Finding
from app.schemas.icr import ICRField, ICRFormResult
from app.services.icr_engine import extract_survey_form_icr
from app.services.ocr_engine import OCRLineResult, OCREngine, get_ocr_engine

app = FastAPI()
app.include_router(router, prefix="/api/v1/icr")


@pytest.fixture
def sample_survey_lines():
    return [
        OCRLineResult(text="FORM SURVEY KELAYAKAN CMO", confidence=0.95, bbox=[[10, 10], [300, 10], [300, 30], [10, 30]]),
        OCRLineResult(text="Nama Debitur : AHMAD FAUZI", confidence=0.85, bbox=[[10, 40], [250, 40], [250, 60], [10, 60]]),
        OCRLineResult(text="Pekerjaan : WIRASWASTA", confidence=0.55, bbox=[[10, 70], [250, 70], [250, 90], [10, 90]]),  # Low conf < 0.60
        OCRLineResult(text="Penghasilan Per Bulan : Rp 8.500.000", confidence=0.88, bbox=[[10, 100], [300, 100], [300, 120], [10, 120]]),
        OCRLineResult(text="Kondisi Rumah : MILIK SENDIRI", confidence=0.78, bbox=[[10, 130], [280, 130], [280, 150], [10, 150]]),
    ]


@pytest.fixture
def client(monkeypatch, sample_survey_lines):
    test_engine = OCREngine(reader="mock")

    def mock_extract(img, mock_output=None):
        return sample_survey_lines

    monkeypatch.setattr(test_engine, "extract_text", mock_extract)
    app.dependency_overrides[get_ocr_engine] = lambda: test_engine
    yield TestClient(app)
    app.dependency_overrides.clear()


def create_synthetic_image_bytes(w=800, h=600, blur=False):
    img = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(0, h, 25):
        cv2.line(img, (0, y), (w, y), (255, 255, 255), 2)
    cv2.putText(img, "SURVEY FORM", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
    if blur:
        img = cv2.GaussianBlur(img, (45, 45), 0)
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
    assert body["data"]["fields"]["Nama Debitur"]["needs_review"] is False

    # Pekerjaan had confidence 0.55 (< 0.60), so finding must be created and needs_review=True
    assert body["data"]["fields"]["Pekerjaan"]["value"] == "WIRASWASTA"
    assert body["data"]["fields"]["Pekerjaan"]["needs_review"] is True

    # Check findings
    findings = [Finding(**f) for f in body["findings"]]
    assert any(f.type == "LOW_CONFIDENCE_FIELD" for f in findings)
    assert any(f["type"] == "LOW_CONFIDENCE_FIELD" for f in body["findings"])

    low_conf_findings = [f for f in body["findings"] if f["type"] == "LOW_CONFIDENCE_FIELD"]
    assert len(low_conf_findings) == 1
    assert low_conf_findings[0]["field_ref"] == "Pekerjaan"
    assert low_conf_findings[0]["severity"] == "medium"


def test_post_icr_survey_form_all_high_confidence(client, monkeypatch):
    test_engine = OCREngine(reader="mock")
    high_conf_lines = [
        OCRLineResult(text="FORM SURVEY CMO", confidence=0.95, bbox=[]),
        OCRLineResult(text="Nama Debitur : SITI AMINAH", confidence=0.89, bbox=[]),
        OCRLineResult(text="Pekerjaan : PNS", confidence=0.92, bbox=[]),
        OCRLineResult(text="Penghasilan Per Bulan : Rp 12.000.000", confidence=0.87, bbox=[]),
    ]
    monkeypatch.setattr(test_engine, "extract_text", lambda img: high_conf_lines)
    app.dependency_overrides[get_ocr_engine] = lambda: test_engine

    file_bytes = create_synthetic_image_bytes()
    response = client.post(
        "/api/v1/icr/survey-form",
        files={"file": ("survey_form.jpg", file_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert len(body["findings"]) == 0
    assert all(not f["needs_review"] for f in body["data"]["fields"].values())


def test_post_icr_survey_form_blurred(client):
    file_bytes = create_synthetic_image_bytes(blur=True)
    response = client.post(
        "/api/v1/icr/survey-form",
        files={"file": ("survey_form_blur.jpg", file_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "partial"
    finding_types = [f["type"] for f in body["findings"]]
    assert "BLURRED_IMAGE" in finding_types
    assert body["confidence"] <= 45.0


def test_post_icr_survey_form_empty_file(client):
    response = client.post(
        "/api/v1/icr/survey-form",
        files={"file": ("empty.jpg", io.BytesIO(b""), "image/jpeg")},
    )
    assert response.status_code == 400
    assert "Empty image file" in response.json()["detail"]


def test_post_icr_survey_form_corrupted_file(client):
    response = client.post(
        "/api/v1/icr/survey-form",
        files={"file": ("corrupt.jpg", io.BytesIO(b"not an image"), "image/jpeg")},
    )
    assert response.status_code == 400
    assert "Invalid image file format" in response.json()["detail"]


def test_post_icr_survey_form_file_too_large(client):
    class LargeFakeFile(io.RawIOBase):
        def __init__(self, size):
            self.size = size
            self.read_bytes = 0

        def read(self, n=-1):
            if self.read_bytes >= self.size:
                return b""
            chunk_size = n if n > 0 else (self.size - self.read_bytes)
            chunk_size = min(chunk_size, self.size - self.read_bytes)
            self.read_bytes += chunk_size
            return b"a" * chunk_size

    large_file = LargeFakeFile(16 * 1024 * 1024)
    response = client.post(
        "/api/v1/icr/survey-form",
        files={"file": ("huge.jpg", large_file, "image/jpeg")},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Image file too large (max 15MB)"


def test_extract_survey_form_icr_unit():
    lines = [
        OCRLineResult(text="Header Form CMO", confidence=0.90, bbox=[]),
        OCRLineResult(text="Nama Debitur: BUDI SANTOSO", confidence=0.85, bbox=[[0, 0], [10, 10]]),
        OCRLineResult(text="Pekerjaan; PEDAGANG", confidence=0.45, bbox=[[0, 10], [10, 20]]),
        OCRLineResult(text="Penghasilan Per Bulan Rp 5.000.000", confidence=0.75, bbox=[[0, 20], [10, 30]]),
        OCRLineResult(text="Status Rumah : KONTRAK", confidence=0.60, bbox=[[0, 30], [10, 40]]),
        OCRLineResult(text="Alamat Domisili : JL MAWAR NO 12", confidence=0.59, bbox=[[0, 40], [10, 50]]),
        OCRLineResult(text="Tujuan Pembiayaan : RENOVASI", confidence=0.82, bbox=[[0, 50], [10, 60]]),
        OCRLineResult(text="Catatan Surveyor : SURVEY BERHASIL", confidence=0.88, bbox=[[0, 60], [10, 70]]),
    ]

    result, findings = extract_survey_form_icr(lines)
    assert isinstance(result, ICRFormResult)
    assert result.form_type == "SURVEY_FORM_CMO"
    assert len(result.fields) == 7

    assert result.fields["Nama Debitur"].value == "BUDI SANTOSO"
    assert result.fields["Nama Debitur"].needs_review is False

    assert result.fields["Pekerjaan"].value == "PEDAGANG"
    assert result.fields["Pekerjaan"].needs_review is True

    assert result.fields["Status Rumah"].value == "KONTRAK"
    assert result.fields["Status Rumah"].needs_review is False

    assert result.fields["Alamat Domisili"].value == "JL MAWAR NO 12"
    assert result.fields["Alamat Domisili"].needs_review is True

    # 2 fields below 0.60: Pekerjaan (0.45) and Alamat Domisili (0.59)
    assert len(findings) == 2
    finding_refs = {f.field_ref for f in findings}
    assert finding_refs == {"Pekerjaan", "Alamat Domisili"}
    assert all(f.type == "LOW_CONFIDENCE_FIELD" for f in findings)
    assert all(f.severity == "medium" for f in findings)
