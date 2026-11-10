import io
import cv2
import numpy as np
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.table import ExtractedTable, TableExtractionResult
from app.services.table_engine import TableEngine, get_table_engine

client = TestClient(app)


def _make_dummy_image_bytes(width: int = 800, height: int = 600) -> bytes:
    img = np.ones((height, width, 3), dtype=np.uint8) * 255
    cv2.putText(img, "TABLE DEMO", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
    success, buffer = cv2.imencode(".png", img)
    assert success
    return buffer.tobytes()


def test_table_endpoint_mock_success(monkeypatch):
    mock_table = ExtractedTable(
        table_idx=0,
        headers=["Bulan", "Gaji", "Potongan"],
        rows=[["November 2026", "12.000.000", "500.000"]],
        num_rows=1,
        num_cols=3,
    )

    class MockTableEngine:
        def extract_tables_from_image(self, image_np, borderless=True, mock_tables=None):
            return TableExtractionResult(tables_found=1, tables=[mock_table], raw_text="Mock"), []

    app.dependency_overrides[get_table_engine] = lambda: MockTableEngine()

    try:
        img_bytes = _make_dummy_image_bytes()
        response = client.post(
            "/api/v1/ocr/table?borderless=true",
            files={"file": ("slip.png", io.BytesIO(img_bytes), "image/png")},
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["status"] == "success"
        assert payload["data"]["tables_found"] == 1
        assert payload["data"]["tables"][0]["headers"] == ["Bulan", "Gaji", "Potongan"]
    finally:
        app.dependency_overrides.clear()


def test_table_endpoint_blurred_image(monkeypatch):
    class MockTableEngine:
        def extract_tables_from_image(self, image_np, borderless=True, mock_tables=None):
            return TableExtractionResult(tables_found=1, tables=[], raw_text=""), []

    app.dependency_overrides[get_table_engine] = lambda: MockTableEngine()

    try:
        # Uniform color creates zero Laplacian variance (severe blur)
        blurred_img = np.zeros((700, 700, 3), dtype=np.uint8)
        _, buf = cv2.imencode(".png", blurred_img)

        response = client.post(
            "/api/v1/ocr/table",
            files={"file": ("blur.png", io.BytesIO(buf.tobytes()), "image/png")},
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["status"] == "partial"
        assert payload["confidence"] <= 45.0
        assert any(f["type"] == "BLURRED_IMAGE" for f in payload["findings"])
    finally:
        app.dependency_overrides.clear()


def test_table_endpoint_empty_file():
    response = client.post(
        "/api/v1/ocr/table",
        files={"file": ("empty.png", io.BytesIO(b""), "image/png")},
    )
    assert response.status_code == 400
    assert "Empty image file" in response.json()["detail"]


def test_table_endpoint_corrupted_file():
    response = client.post(
        "/api/v1/ocr/table",
        files={"file": ("corrupt.png", io.BytesIO(b"not-a-valid-image-data"), "image/png")},
    )
    assert response.status_code == 400
    assert "Invalid image file format" in response.json()["detail"]


def test_table_endpoint_file_too_large():
    too_large = b"x" * (15 * 1024 * 1024 + 10)
    response = client.post(
        "/api/v1/ocr/table",
        files={"file": ("huge.png", io.BytesIO(too_large), "image/png")},
    )
    assert response.status_code == 400
    assert "Image file too large" in response.json()["detail"]


def test_table_endpoint_no_tables_found():
    class MockTableEngine:
        def extract_tables_from_image(self, image_np, borderless=True, mock_tables=None):
            return TableExtractionResult(tables_found=0, tables=[], raw_text=""), []

    app.dependency_overrides[get_table_engine] = lambda: MockTableEngine()

    try:
        img_bytes = _make_dummy_image_bytes()
        response = client.post(
            "/api/v1/ocr/table",
            files={"file": ("no_table.png", io.BytesIO(img_bytes), "image/png")},
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["status"] == "partial"
        assert payload["data"]["tables_found"] == 0
        assert payload["confidence"] == 50.0
    finally:
        app.dependency_overrides.clear()


def test_table_endpoint_dynamic_cell_confidence():
    from app.schemas.table import TableCell

    cell1 = TableCell(row_idx=0, col_idx=0, text="A", confidence=0.90)
    cell2 = TableCell(row_idx=0, col_idx=1, text="B", confidence=0.94)
    mock_table = ExtractedTable(
        table_idx=0,
        headers=["A", "B"],
        rows=[],
        cells=[cell1, cell2],
        num_rows=0,
        num_cols=2,
    )

    class MockTableEngine:
        def extract_tables_from_image(self, image_np, borderless=True, mock_tables=None):
            return TableExtractionResult(tables_found=1, tables=[mock_table], raw_text=""), []

    app.dependency_overrides[get_table_engine] = lambda: MockTableEngine()

    try:
        img_bytes = _make_dummy_image_bytes()
        response = client.post(
            "/api/v1/ocr/table",
            files={"file": ("slip.png", io.BytesIO(img_bytes), "image/png")},
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["confidence"] == 92.0
    finally:
        app.dependency_overrides.clear()


def test_table_endpoint_dynamic_cell_confidence_blurred_capped():
    from app.schemas.table import TableCell

    cell1 = TableCell(row_idx=0, col_idx=0, text="A", confidence=0.95)
    mock_table = ExtractedTable(
        table_idx=0,
        headers=["A"],
        rows=[],
        cells=[cell1],
        num_rows=0,
        num_cols=1,
    )

    class MockTableEngine:
        def extract_tables_from_image(self, image_np, borderless=True, mock_tables=None):
            return TableExtractionResult(tables_found=1, tables=[mock_table], raw_text=""), []

    app.dependency_overrides[get_table_engine] = lambda: MockTableEngine()

    try:
        blurred_img = np.zeros((700, 700, 3), dtype=np.uint8)
        _, buf = cv2.imencode(".png", blurred_img)
        response = client.post(
            "/api/v1/ocr/table",
            files={"file": ("blur.png", io.BytesIO(buf.tobytes()), "image/png")},
        )
        assert response.status_code == 200
        payload = response.json()
        assert payload["confidence"] == 45.0
        assert payload["status"] == "partial"
    finally:
        app.dependency_overrides.clear()
