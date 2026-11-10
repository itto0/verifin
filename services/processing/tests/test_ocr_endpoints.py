import io
from typing import List, Tuple
import cv2
from fastapi import FastAPI
from fastapi.testclient import TestClient
import numpy as np
import pytest

from app.routers.ocr import router
from app.services.ktp_parser import extract_ktp_fields_from_ocr
from app.services.ocr_engine import (
    OCREngine,
    OCRLineResult,
    assess_image_quality,
    get_ocr_engine,
)

app = FastAPI()
app.include_router(router, prefix="/api/v1/ocr")


@pytest.fixture
def sample_ktp_lines():
    return [
        OCRLineResult(text="PROVINSI JAWA BARAT", confidence=0.98, bbox=[[50, 10], [300, 10], [300, 30], [50, 30]]),
        OCRLineResult(text="KABUPATEN BANDUNG", confidence=0.97, bbox=[[50, 35], [300, 35], [300, 55], [50, 55]]),
        OCRLineResult(text="NIK : 3204051205900001", confidence=0.99, bbox=[[50, 70], [350, 70], [350, 95], [50, 95]]),
        OCRLineResult(text="Nama : BUDI SANTOSO", confidence=0.96, bbox=[[50, 105], [350, 105], [350, 125], [50, 125]]),
        OCRLineResult(text="Tempat/Tgl Lahir : BANDUNG, 12-05-1990", confidence=0.94, bbox=[[50, 130], [400, 130], [400, 150], [50, 150]]),
        OCRLineResult(text="Jenis Kelamin : LAKI-LAKI", confidence=0.95, bbox=[[50, 155], [300, 155], [300, 175], [50, 175]]),
        OCRLineResult(text="Alamat : JL. RAYA SOREANG NO 45", confidence=0.93, bbox=[[50, 180], [450, 180], [450, 200], [50, 200]]),
        OCRLineResult(text="RT/RW : 004/002", confidence=0.92, bbox=[[50, 190], [200, 190], [200, 205], [50, 205]]),
        OCRLineResult(text="Kel/Desa : SOREANG", confidence=0.91, bbox=[[50, 200], [220, 200], [220, 215], [50, 215]]),
        OCRLineResult(text="Kecamatan : SOREANG", confidence=0.93, bbox=[[50, 210], [230, 210], [230, 225], [50, 225]]),
        OCRLineResult(text="Agama : ISLAM", confidence=0.99, bbox=[[50, 205], [200, 205], [200, 225], [50, 225]]),
        OCRLineResult(text="Status Perkawinan : BELUM KAWIN", confidence=0.95, bbox=[[50, 230], [350, 230], [350, 250], [50, 250]]),
        OCRLineResult(text="Pekerjaan : KARYAWAN SWASTA", confidence=0.96, bbox=[[50, 255], [350, 255], [350, 275], [50, 275]]),
        OCRLineResult(text="Kewarganegaraan : WNI", confidence=0.99, bbox=[[50, 280], [250, 280], [250, 300], [50, 300]]),
        OCRLineResult(text="Berlaku Hingga : SEUMUR HIDUP", confidence=0.98, bbox=[[50, 305], [350, 305], [350, 325], [50, 325]]),
    ]


@pytest.fixture
def client(monkeypatch, sample_ktp_lines):
    test_engine = OCREngine(reader="mock")

    def mock_extract(img, mock_output=None):
        return sample_ktp_lines

    monkeypatch.setattr(test_engine, "extract_text", mock_extract)
    app.dependency_overrides[get_ocr_engine] = lambda: test_engine
    yield TestClient(app)
    app.dependency_overrides.clear()


def create_synthetic_image_bytes(w=800, h=500, blur=False):
    img = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(0, h, 20):
        cv2.line(img, (0, y), (w, y), (255, 255, 255), 2)
    cv2.putText(img, "REPUBLIK INDONESIA", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
    if blur:
        img = cv2.GaussianBlur(img, (45, 45), 0)
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
    assert body["data"]["fields"]["rt_rw"] == "004/002"
    assert body["data"]["fields"]["kel_desa"] == "SOREANG"
    assert body["data"]["fields"]["kecamatan"] == "SOREANG"
    assert body["data"]["validation"]["is_valid"] is True
    assert body["data"]["validation"]["gender"] == "LAKI-LAKI"
    assert body["confidence"] > 90.0


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
    assert body["data"]["total_lines"] > 0
    assert body["confidence"] > 90.0


def test_extract_ktp_fields_from_ocr_unit(sample_ktp_lines):
    fields = extract_ktp_fields_from_ocr(sample_ktp_lines)
    assert fields.nik == "3204051205900001"
    assert fields.nama == "BUDI SANTOSO"
    assert fields.tempat_lahir == "BANDUNG"
    assert fields.tgl_lahir == "12-05-1990"
    assert fields.jenis_kelamin == "LAKI-LAKI"
    assert fields.alamat == "JL. RAYA SOREANG NO 45"
    assert fields.rt_rw == "004/002"
    assert fields.kel_desa == "SOREANG"
    assert fields.kecamatan == "SOREANG"
    assert fields.agama == "ISLAM"
    assert fields.status_perkawinan == "BELUM KAWIN"
    assert fields.pekerjaan == "KARYAWAN SWASTA"
    assert fields.kewarganegaraan == "WNI"
    assert fields.berlaku_hingga == "SEUMUR HIDUP"
    assert "nik" in fields.field_confidences
    assert fields.field_confidences["nik"] == 0.99


def test_post_ocr_ktp_blurred_returns_partial(client):
    file_bytes = create_synthetic_image_bytes(blur=True)
    response = client.post(
        "/api/v1/ocr/ktp",
        files={"file": ("ktp_blur.jpg", file_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "partial"
    assert body["data"]["is_blurred"] is True
    finding_types = [f["type"] for f in body["findings"]]
    assert "BLURRED_IMAGE" in finding_types
    assert body["confidence"] <= 45.0


def test_post_ocr_ktp_tamper_mismatch(client, monkeypatch):
    test_engine = OCREngine(reader="mock")
    tampered_lines = [
        OCRLineResult(text="NIK : 3204051205900001", confidence=0.99, bbox=[]),
        OCRLineResult(text="Nama : BUDI SANTOSO", confidence=0.96, bbox=[]),
        OCRLineResult(text="Tempat/Tgl Lahir : BANDUNG, 12-05-1990", confidence=0.94, bbox=[]),
        OCRLineResult(text="Jenis Kelamin : PEREMPUAN", confidence=0.95, bbox=[]),  # Mismatch with male NIK
    ]
    monkeypatch.setattr(test_engine, "extract_text", lambda img: tampered_lines)
    app.dependency_overrides[get_ocr_engine] = lambda: test_engine

    file_bytes = create_synthetic_image_bytes()
    response = client.post(
        "/api/v1/ocr/ktp",
        files={"file": ("ktp.jpg", file_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "partial"
    assert body["data"]["validation"]["is_valid"] is False
    assert body["data"]["validation"]["tamper_score"] >= 70.0
    finding_types = [f["type"] for f in body["findings"]]
    assert "NIK_GENDER_MISMATCH" in finding_types


def test_post_ocr_ktp_empty_file_raises_400(client):
    empty_bytes = io.BytesIO(b"")
    response = client.post(
        "/api/v1/ocr/ktp",
        files={"file": ("empty.jpg", empty_bytes, "image/jpeg")},
    )
    assert response.status_code == 400
    assert "Empty image file" in response.json()["detail"]


def test_post_ocr_ktp_corrupted_file_raises_400(client):
    corrupt_bytes = io.BytesIO(b"not an image at all, purely corrupt bytes")
    response = client.post(
        "/api/v1/ocr/ktp",
        files={"file": ("corrupt.jpg", corrupt_bytes, "image/jpeg")},
    )
    assert response.status_code == 400
    assert "Invalid image file format" in response.json()["detail"]


def test_post_ocr_document_empty_file_raises_400(client):
    empty_bytes = io.BytesIO(b"")
    response = client.post(
        "/api/v1/ocr/document",
        files={"file": ("empty.jpg", empty_bytes, "image/jpeg")},
    )
    assert response.status_code == 400
    assert "Empty image file" in response.json()["detail"]


def test_post_ocr_ktp_file_too_large(client):
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
        "/api/v1/ocr/ktp",
        files={"file": ("huge.jpg", large_file, "image/jpeg")},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Image file too large (max 15MB)"


def test_assess_image_quality_rgba_support():
    # 4-channel BGRA image
    rgba_img = np.zeros((600, 800, 4), dtype=np.uint8)
    for y in range(0, 600, 20):
        cv2.line(rgba_img, (0, y), (800, y), (255, 255, 255, 255), 2)
    quality = assess_image_quality(rgba_img)
    assert quality.width == 800
    assert quality.height == 600
    assert not quality.is_low_res
    assert quality.blur_score > 0
