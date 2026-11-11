import io
from pathlib import Path
from typing import List, Tuple
import cv2
from fastapi import FastAPI
from fastapi.testclient import TestClient
import numpy as np
import pytest

from app.routers.ocr import router
from app.services.ktp_parser import (
    _OCRBox,
    _normalize_ttl,
    cross_validate_ktp,
    extract_ktp_fields_from_ocr,
)
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


def test_extract_ktp_fields_spatial_multi_box():
    lines = [
        OCRLineResult(text="PROVINSI DKI JAKARTA", confidence=0.9, bbox=[[1000, 200], [1700, 200], [1700, 250], [1000, 250]]),
        OCRLineResult(text="NIK", confidence=0.99, bbox=[[500, 430], [650, 430], [650, 500], [500, 500]]),
        OCRLineResult(text="3174012005850001", confidence=0.95, bbox=[[950, 430], [1500, 430], [1500, 500], [950, 500]]),
        OCRLineResult(text="Nama", confidence=0.98, bbox=[[500, 540], [650, 540], [650, 600], [500, 600]]),
        OCRLineResult(text="AHMAD FAUZI", confidence=0.97, bbox=[[950, 540], [1400, 540], [1400, 600], [950, 600]]),
        OCRLineResult(text="Tempat/Tgl Lahir", confidence=0.92, bbox=[[500, 600], [850, 600], [850, 660], [500, 660]]),
        OCRLineResult(text="JAKARTA, 20-05-1985", confidence=0.93, bbox=[[950, 600], [1500, 600], [1500, 660], [950, 660]]),
        OCRLineResult(text="Jenis Kelamin", confidence=0.91, bbox=[[500, 660], [800, 660], [800, 720], [500, 720]]),
        OCRLineResult(text="LAKI-LAKI", confidence=0.96, bbox=[[950, 660], [1200, 660], [1200, 720], [950, 720]]),
        OCRLineResult(text="Gol. Darah: 0", confidence=0.94, bbox=[[1350, 660], [1600, 660], [1600, 720], [1350, 720]]),
        OCRLineResult(text="Alamat", confidence=0.95, bbox=[[500, 720], [680, 720], [680, 780], [500, 780]]),
        OCRLineResult(text="JL TEBET BARAT DALAM NO. 12", confidence=0.90, bbox=[[950, 720], [1600, 720], [1600, 780], [950, 780]]),
        OCRLineResult(text="RTIRW", confidence=0.92, bbox=[[580, 780], [750, 780], [750, 840], [580, 840]]),
        OCRLineResult(text="004/002", confidence=0.91, bbox=[[950, 780], [1150, 780], [1150, 840], [950, 840]]),
        OCRLineResult(text="KellDesa", confidence=0.88, bbox=[[580, 840], [800, 840], [800, 900], [580, 900]]),
        OCRLineResult(text="TEBET BARAT", confidence=0.94, bbox=[[950, 840], [1300, 840], [1300, 900], [950, 900]]),
        OCRLineResult(text="Kecamatan", confidence=0.96, bbox=[[580, 900], [820, 900], [820, 960], [580, 960]]),
        OCRLineResult(text="TEBET", confidence=0.95, bbox=[[950, 900], [1150, 900], [1150, 960], [950, 960]]),
        OCRLineResult(text="Agama", confidence=0.97, bbox=[[500, 960], [680, 960], [680, 1020], [500, 1020]]),
        OCRLineResult(text="ISLAM", confidence=0.99, bbox=[[950, 960], [1150, 960], [1150, 1020], [950, 1020]]),
        OCRLineResult(text="Status Perkawinan", confidence=0.95, bbox=[[500, 1020], [850, 1020], [850, 1080], [500, 1080]]),
        OCRLineResult(text="KAWIN", confidence=0.97, bbox=[[950, 1020], [1150, 1020], [1150, 1080], [950, 1080]]),
        OCRLineResult(text="Pekerjaan", confidence=0.96, bbox=[[500, 1080], [750, 1080], [750, 1140], [500, 1140]]),
        OCRLineResult(text="KARYAWAN SWASTA", confidence=0.94, bbox=[[950, 1080], [1450, 1080], [1450, 1140], [950, 1140]]),
        OCRLineResult(text="Kewarganegaraan", confidence=0.93, bbox=[[500, 1140], [880, 1140], [880, 1200], [500, 1200]]),
        OCRLineResult(text="WNI", confidence=0.98, bbox=[[950, 1140], [1100, 1140], [1100, 1200], [950, 1200]]),
        OCRLineResult(text="Berlaku Hingga", confidence=0.96, bbox=[[500, 1200], [820, 1200], [820, 1260], [500, 1260]]),
        OCRLineResult(text="SEUMUR HIDUP", confidence=0.99, bbox=[[950, 1200], [1350, 1200], [1350, 1260], [950, 1260]]),
    ]
    fields = extract_ktp_fields_from_ocr(lines)
    assert fields.nik == "3174012005850001"
    assert fields.nama == "AHMAD FAUZI"
    assert fields.tempat_lahir == "JAKARTA"
    assert fields.tgl_lahir == "20-05-1985"
    assert fields.jenis_kelamin == "LAKI-LAKI"
    assert fields.alamat == "JL TEBET BARAT DALAM NO. 12"
    assert fields.rt_rw == "004/002"
    assert fields.kel_desa == "TEBET BARAT"
    assert fields.kecamatan == "TEBET"
    assert fields.agama == "ISLAM"
    assert fields.status_perkawinan == "KAWIN"
    assert fields.pekerjaan == "KARYAWAN SWASTA"
    assert fields.kewarganegaraan == "WNI"
    assert fields.berlaku_hingga == "SEUMUR HIDUP"
    assert fields.field_confidences["nama"] == pytest.approx(0.97, abs=0.01)
    assert fields.field_confidences["alamat"] == pytest.approx(0.90, abs=0.01)


def test_extract_ktp_fields_sequential_fallback():
    lines = [
        ("PROVINSI DKI JAKARTA", 0.95),
        ("NIK", 0.99),
        ("3174012005850001", 0.98),
        ("Nama", 0.97),
        ("AHMAD FAUZI", 0.96),
        ("Tempat/Tgl Lahir", 0.94),
        ("JAKARTA, 20-05-1985", 0.93),
        ("Jenis Kelamin", 0.95),
        ("LAKI-LAKI", 0.95),
        ("Alamat", 0.92),
        ("JL TEBET BARAT DALAM NO. 12", 0.91),
        ("Agama", 0.99),
        ("ISLAM", 0.98),
    ]
    fields = extract_ktp_fields_from_ocr(lines)
    assert fields.nik == "3174012005850001"
    assert fields.nama == "AHMAD FAUZI"
    assert fields.tempat_lahir == "JAKARTA"
    assert fields.tgl_lahir == "20-05-1985"
    assert fields.jenis_kelamin == "LAKI-LAKI"
    assert fields.alamat == "JL TEBET BARAT DALAM NO. 12"
    assert fields.agama == "ISLAM"
    assert fields.field_confidences["nama"] == pytest.approx(0.96, abs=0.01)


def test_real_ktp_demo_image_full_extraction():
    img_path = Path(__file__).resolve().parents[3] / "public" / "ktp_demo_normal.jfif"
    if not img_path.exists():
        img_path = Path("public/ktp_demo_normal.jfif").resolve()
    assert img_path.exists(), f"Demo KTP image not found at {img_path}"

    img = cv2.imread(str(img_path))
    assert img is not None, f"Failed to load image from {img_path}"

    engine = OCREngine()
    lines = engine.extract_text(img)
    assert len(lines) > 0

    fields = extract_ktp_fields_from_ocr(lines)
    assert fields.nik == "3174012005850001"
    assert fields.nama == "AHMAD FAUZI"
    assert fields.tempat_lahir == "JAKARTA"
    assert fields.tgl_lahir == "20-05-1985"
    assert fields.jenis_kelamin == "LAKI-LAKI"
    assert fields.alamat in ("JL TEBET BARAT DALAM NO. 12", "JL. TEBET BARAT DALAM NO. 12")
    assert fields.rt_rw == "004/002"
    assert fields.kel_desa == "TEBET BARAT"
    assert fields.kecamatan == "TEBET"
    assert fields.agama == "ISLAM"
    assert fields.status_perkawinan == "KAWIN"
    assert fields.pekerjaan == "KARYAWAN SWASTA"
    assert fields.kewarganegaraan == "WNI"
    assert fields.berlaku_hingga == "SEUMUR HIDUP"

    for field_name, conf in fields.field_confidences.items():
        assert 0.0 <= conf <= 1.0

    validation = cross_validate_ktp(fields)
    assert validation.is_valid is True


def test_extract_ktp_fields_with_colon_delimiter_box():
    # Spatial pairing case with separate delimiter ':' box
    spatial_lines = [
        OCRLineResult(text="NIK", confidence=0.99, bbox=[[100, 50], [200, 50], [200, 80], [100, 80]]),
        OCRLineResult(text=":", confidence=0.95, bbox=[[210, 50], [220, 50], [220, 80], [210, 80]]),
        OCRLineResult(text="3204051205900001", confidence=0.98, bbox=[[240, 50], [500, 50], [500, 80], [240, 80]]),
        OCRLineResult(text="Nama", confidence=0.98, bbox=[[100, 100], [200, 100], [200, 130], [100, 130]]),
        OCRLineResult(text=":", confidence=0.90, bbox=[[210, 100], [220, 100], [220, 130], [210, 130]]),
        OCRLineResult(text="BUDI SANTOSO", confidence=0.95, bbox=[[240, 100], [450, 100], [450, 130], [240, 130]]),
    ]
    fields_spatial = extract_ktp_fields_from_ocr(spatial_lines)
    assert fields_spatial.nik == "3204051205900001"
    assert fields_spatial.nama == "BUDI SANTOSO"

    # Sequential fallback case with separate delimiter ':' box
    seq_lines = [
        ("NIK", 0.99),
        (":", 0.90),
        ("3204051205900001", 0.98),
        ("Nama", 0.98),
        (":", 0.92),
        ("BUDI SANTOSO", 0.96),
    ]
    fields_seq = extract_ktp_fields_from_ocr(seq_lines)
    assert fields_seq.nik == "3204051205900001"
    assert fields_seq.nama == "BUDI SANTOSO"


def test_extract_ktp_fields_with_overlapping_boxes():
    # Word boxes that overlap horizontally (gap < 0 within 50% height tolerance)
    lines = [
        OCRLineResult(text="Nama", confidence=0.98, bbox=[[100, 100], [200, 100], [200, 130], [100, 130]]),
        # BUDI max_x = 350, height = 30
        OCRLineResult(text="BUDI", confidence=0.96, bbox=[[250, 100], [350, 100], [350, 130], [250, 130]]),
        # SANTOSO min_x = 340 (overlap of 10px, tolerance is 30 * 0.5 = 15px)
        OCRLineResult(text="SANTOSO", confidence=0.94, bbox=[[340, 100], [450, 100], [450, 130], [340, 130]]),
    ]
    fields = extract_ktp_fields_from_ocr(lines)
    assert fields.nama == "BUDI SANTOSO"
    assert fields.field_confidences["nama"] == pytest.approx(0.95, abs=0.01)


def test_normalize_ttl_city_only_and_date_normalization():
    # City-only input without comma or date pattern
    city, date = _normalize_ttl("JAKARTA")
    assert city == "JAKARTA"
    assert date is None

    # City-only with delimiter artifacts
    city, date = _normalize_ttl(": BANDUNG - ")
    assert city == "BANDUNG"
    assert date is None

    # Comma-separated with dots normalized to hyphens
    city, date = _normalize_ttl("BANDUNG, 12.05.1990")
    assert city == "BANDUNG"
    assert date == "12-05-1990"

    # Comma-separated with slashes normalized to hyphens
    city, date = _normalize_ttl("JAKARTA, 20/05/1985")
    assert city == "JAKARTA"
    assert date == "20-05-1985"

    # No comma, date pattern with dots
    city, date = _normalize_ttl("JAKARTA 20.05.1985")
    assert city == "JAKARTA"
    assert date == "20-05-1985"

    # Full extraction with city-only TTL
    lines = [
        ("Nama", 0.98),
        ("BUDI SANTOSO", 0.96),
        ("Tempat/Tgl Lahir", 0.95),
        ("JAKARTA", 0.92),
    ]
    fields = extract_ktp_fields_from_ocr(lines)
    assert fields.tempat_lahir == "JAKARTA"
    assert fields.tgl_lahir is None


def test_ocr_box_confidence_none_safety():
    # Safely handle confidence = None in _OCRBox and extract_ktp_fields_from_ocr
    box = _OCRBox(text="BUDI", confidence=None)
    assert box.confidence == 1.0

    class DuckLine:
        text = "Nama : BUDI SANTOSO"
        confidence = None
        bbox = None

    lines = [
        DuckLine(),
        ("NIK : 3204051205900001", None),
    ]
    fields = extract_ktp_fields_from_ocr(lines)
    assert fields.nama == "BUDI SANTOSO"
    assert fields.nik == "3204051205900001"
    assert fields.field_confidences["nama"] == 1.0
    assert fields.field_confidences["nik"] == 1.0



