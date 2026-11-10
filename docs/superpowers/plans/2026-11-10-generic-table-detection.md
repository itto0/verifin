# Generic Table Detection & Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide generic, layout-agnostic table detection and 2D matrix extraction for payslips, bank statements, and inspection forms across backend ML microservice and frontend Processing Lab.

**Architecture:** Integrate `img2table` with the existing `OCREngine` (EasyOCR reader) to detect bordered and borderless tables, format them into 2D string matrices with cell bounding boxes, expose a `POST /api/v1/ocr/table` endpoint returning `ProcessEnvelope[TableExtractionResult]`, and visualize interactive tables in the frontend Processing Lab.

**Tech Stack:** Python 3.10+, FastAPI, `img2table`, EasyOCR, OpenCV, Pydantic v2, pytest, React, TypeScript, Bun test, Lucide icons.

## Global Constraints

- Must conform to PRD Standard Result Envelope: `status`, `confidence`, `findings[]`, `evidence_refs[]`, `model_version`, `processed_at`, `data`.
- Per-field/per-cell confidence bounded in `[0.0, 1.0]`; envelope confidence bounded in `[0.0, 100.0]`.
- Image uploads capped at 15MB with client-side and backend HTTP 400 enforcement.
- Blur variance < 100 flags `BLURRED_IMAGE` and caps confidence at 45.0%.
- CPU-bound image/OCR operations in routers must use standard `def` (not `async def`) to run on FastAPI's threadpool and avoid blocking the event loop.
- Offline/mock test execution must run in < 2 seconds without requiring GPU or live neural weight downloads.
- Preserves all existing mock datasets, case workflows, and detail views in the frontend.

---

### Task 1: Table Schemas, Dependency & Table Engine

**Files:**
- Modify: `services/processing/pyproject.toml`
- Create: `services/processing/app/schemas/table.py`
- Modify: `services/processing/app/schemas/__init__.py`
- Create: `services/processing/app/services/table_engine.py`
- Test: `services/processing/tests/test_table_engine.py`

**Interfaces:**
- Consumes:
  - `ProcessEnvelope`, `Finding` from `app.schemas.common`
  - `OCREngine`, `OCRLineResult`, `get_ocr_engine` from `app.services.ocr_engine`
- Produces:
  - `TableCell`, `ExtractedTable`, `TableExtractionResult`
  - `TableEngine.extract_tables_from_image(image_np, borderless=True, mock_tables=None)`
  - `get_table_engine()` singleton accessor

- [ ] **Step 1: Write the failing unit tests for TableEngine and Schemas**

```python
# services/processing/tests/test_table_engine.py
import numpy as np
import pytest
from app.schemas.table import TableCell, ExtractedTable, TableExtractionResult
from app.services.table_engine import TableEngine, get_table_engine


def test_table_schemas_serialization():
    cell = TableCell(row_idx=0, col_idx=0, text="Tanggal", confidence=0.98, bbox=[10, 20, 100, 50], is_header=True)
    table = ExtractedTable(
        table_idx=0,
        headers=["Tanggal", "Keterangan", "Jumlah"],
        rows=[
            ["01/11/2026", "Gaji Pokok", "10.000.000"],
            ["05/11/2026", "Tunjangan", "2.500.000"],
        ],
        cells=[cell],
        num_rows=2,
        num_cols=3,
        bbox=[10, 20, 500, 300],
    )
    result = TableExtractionResult(tables_found=1, tables=[table], raw_text="Tanggal Keterangan Jumlah")
    assert result.tables_found == 1
    assert len(result.tables[0].rows) == 2
    assert result.tables[0].headers[1] == "Keterangan"
    assert result.tables[0].cells[0].is_header is True


def test_table_engine_mock_extraction():
    engine = TableEngine()
    dummy_img = np.zeros((400, 600, 3), dtype=np.uint8)

    mock_table_data = [
        ExtractedTable(
            table_idx=0,
            headers=["Deskripsi", "Nilai"],
            rows=[["Gaji Pokok", "7.500.000"], ["PPH21", "250.000"]],
            num_rows=2,
            num_cols=2,
            bbox=[20, 30, 400, 200],
        )
    ]

    result, findings = engine.extract_tables_from_image(dummy_img, mock_tables=mock_table_data)
    assert result.tables_found == 1
    assert len(result.tables) == 1
    assert result.tables[0].headers == ["Deskripsi", "Nilai"]
    assert result.tables[0].rows[0] == ["Gaji Pokok", "7.500.000"]
    assert len(findings) == 0


def test_table_engine_empty_tables_finding():
    engine = TableEngine()
    dummy_img = np.zeros((400, 600, 3), dtype=np.uint8)

    result, findings = engine.extract_tables_from_image(dummy_img, mock_tables=[])
    assert result.tables_found == 0
    assert len(result.tables) == 0
    assert any(f.type == "NO_TABLES_DETECTED" for f in findings)


def test_get_table_engine_singleton():
    engine1 = get_table_engine()
    engine2 = get_table_engine()
    assert engine1 is engine2
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run --directory services/processing pytest tests/test_table_engine.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.schemas.table'`

- [ ] **Step 3: Add `img2table` dependency and implement Schemas and TableEngine**

Add dependency in `services/processing/pyproject.toml`:
```toml
dependencies = [
    # ...
    "img2table>=1.2.0",
]
```
Run `uv sync --directory services/processing` to update the virtualenv.

Create `services/processing/app/schemas/table.py`:
```python
from typing import List, Optional
from pydantic import BaseModel, Field


class TableCell(BaseModel):
    row_idx: int
    col_idx: int
    text: str
    confidence: float = 1.0  # 0.0 - 1.0
    bbox: Optional[List[int]] = None  # [x1, y1, x2, y2]
    is_header: bool = False


class ExtractedTable(BaseModel):
    table_idx: int
    headers: List[str] = Field(default_factory=list)
    rows: List[List[str]] = Field(default_factory=list)  # 2D array of string values
    cells: List[TableCell] = Field(default_factory=list)
    num_rows: int = 0
    num_cols: int = 0
    bbox: Optional[List[int]] = None  # [x1, y1, x2, y2]


class TableExtractionResult(BaseModel):
    tables_found: int = 0
    tables: List[ExtractedTable] = Field(default_factory=list)
    raw_text: str = ""
```

Update `services/processing/app/schemas/__init__.py`:
```python
from app.schemas.common import EvidenceRef, Finding, ProcessEnvelope
from app.schemas.table import ExtractedTable, TableCell, TableExtractionResult

__all__ = [
    "Finding",
    "EvidenceRef",
    "ProcessEnvelope",
    "TableCell",
    "ExtractedTable",
    "TableExtractionResult",
]
```

Create `services/processing/app/services/table_engine.py`:
```python
from functools import lru_cache
from typing import List, Optional, Tuple
import cv2
import numpy as np

from app.schemas.common import Finding
from app.schemas.table import ExtractedTable, TableCell, TableExtractionResult
from app.services.ocr_engine import get_ocr_engine


class TableEngine:
    def __init__(self):
        self._easyocr_reader = None

    def _get_reader(self):
        if self._easyocr_reader is None:
            ocr_engine = get_ocr_engine()
            self._easyocr_reader = ocr_engine._get_reader()
        return self._easyocr_reader

    def extract_tables_from_image(
        self,
        image_np: np.ndarray,
        borderless: bool = True,
        mock_tables: Optional[List[ExtractedTable]] = None,
    ) -> Tuple[TableExtractionResult, List[Finding]]:
        """Extracts tables from an image array using img2table or mock data."""
        findings: List[Finding] = []

        if mock_tables is not None:
            tables = mock_tables
            if len(tables) == 0:
                findings.append(
                    Finding(
                        type="NO_TABLES_DETECTED",
                        severity="low",
                        description="No structured tables were detected in the document.",
                        field_ref="tables",
                    )
                )
            return (
                TableExtractionResult(
                    tables_found=len(tables),
                    tables=tables,
                    raw_text="\n".join(["\t".join(row) for t in tables for row in t.rows]),
                ),
                findings,
            )

        # Production path using img2table
        try:
            from img2table.document import Image as Img2TableImage
            from img2table.ocr import EasyOCR as Img2TableEasyOCR

            # Encode image to memory buffer for img2table
            success, encoded_img = cv2.imencode(".png", image_np)
            if not success:
                raise ValueError("Failed to encode image array for table extraction")

            reader = self._get_reader()
            ocr_wrapper = Img2TableEasyOCR(reader=reader)
            doc = Img2TableImage(encoded_img.tobytes())

            extracted = doc.extract_tables(
                ocr=ocr_wrapper,
                implicit_rows=borderless,
                borderless_tables=borderless,
                min_confidence=30,
            )

            tables: List[ExtractedTable] = []
            raw_lines: List[str] = []

            for idx, tbl in enumerate(extracted):
                df = tbl.df
                headers: List[str] = [str(col).strip() for col in df.columns]
                rows: List[List[str]] = [
                    [str(val).strip() if val is not None else "" for val in row]
                    for row in df.values.tolist()
                ]

                cells: List[TableCell] = []
                for cell in getattr(tbl, "cells", []):
                    cells.append(
                        TableCell(
                            row_idx=cell.row,
                            col_idx=cell.col,
                            text=str(cell.text or "").strip(),
                            confidence=float(getattr(cell, "confidence", 100) or 100) / 100.0,
                            bbox=[cell.bbox.x1, cell.bbox.y1, cell.bbox.x2, cell.bbox.y2]
                            if hasattr(cell, "bbox") and cell.bbox
                            else None,
                        )
                    )

                outer_bbox = (
                    [tbl.bbox.x1, tbl.bbox.y1, tbl.bbox.x2, tbl.bbox.y2]
                    if hasattr(tbl, "bbox") and tbl.bbox
                    else None
                )

                tables.append(
                    ExtractedTable(
                        table_idx=idx,
                        headers=headers,
                        rows=rows,
                        cells=cells,
                        num_rows=len(rows),
                        num_cols=len(headers) if headers else (len(rows[0]) if rows else 0),
                        bbox=outer_bbox,
                    )
                )

                raw_lines.append("\t".join(headers))
                for row in rows:
                    raw_lines.append("\t".join(row))

            if len(tables) == 0:
                findings.append(
                    Finding(
                        type="NO_TABLES_DETECTED",
                        severity="low",
                        description="No structured tables were detected in the document.",
                        field_ref="tables",
                    )
                )

            return (
                TableExtractionResult(
                    tables_found=len(tables),
                    tables=tables,
                    raw_text="\n".join(raw_lines),
                ),
                findings,
            )
        except Exception as e:
            findings.append(
                Finding(
                    type="TABLE_EXTRACTION_ERROR",
                    severity="medium",
                    description=f"Table extraction encountered an error: {str(e)}",
                    field_ref="tables",
                )
            )
            return TableExtractionResult(tables_found=0, tables=[]), findings


@lru_cache()
def get_table_engine() -> TableEngine:
    return TableEngine()
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `uv run --directory services/processing pytest tests/test_table_engine.py -v`
Expected: PASS (4 passed)

- [ ] **Step 5: Commit**

```bash
git add services/processing/pyproject.toml services/processing/uv.lock services/processing/app/schemas/table.py services/processing/app/schemas/__init__.py services/processing/app/services/table_engine.py services/processing/tests/test_table_engine.py
git commit -m "feat(processing): add generic table extraction schemas and table engine"
```

---

### Task 2: Table REST Endpoint & Integration Tests

**Files:**
- Modify: `services/processing/app/routers/ocr.py`
- Create: `services/processing/tests/test_table_endpoints.py`

**Interfaces:**
- Consumes:
  - `TableEngine`, `get_table_engine` from `app.services.table_engine`
  - `assess_image_quality`, `read_image_from_upload` from `app.routers.ocr`
  - `ProcessEnvelope`, `TableExtractionResult`
- Produces:
  - `POST /api/v1/ocr/table` endpoint returning `ProcessEnvelope[TableExtractionResult]`

- [ ] **Step 1: Write the failing tests for table endpoint**

```python
# services/processing/tests/test_table_endpoints.py
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run --directory services/processing pytest tests/test_table_endpoints.py -v`
Expected: FAIL with `404 Not Found` for `/api/v1/ocr/table`

- [ ] **Step 3: Add `POST /table` to `app/routers/ocr.py`**

Modify `services/processing/app/routers/ocr.py`:
```python
from app.schemas.table import TableExtractionResult
from app.services.table_engine import TableEngine, get_table_engine

@router.post("/table", response_model=ProcessEnvelope[TableExtractionResult])
def process_table(
    file: UploadFile = File(...),
    borderless: bool = True,
    table_engine: TableEngine = Depends(get_table_engine),
    settings: AppConfig = Depends(get_settings),
) -> ProcessEnvelope[TableExtractionResult]:
    """Extracts 2D structured tables from arbitrary image documents."""
    image_np = read_image_from_upload(file)
    quality = assess_image_quality(image_np)

    table_result, table_findings = table_engine.extract_tables_from_image(
        image_np, borderless=borderless
    )

    all_findings = quality.findings + table_findings

    if table_result.tables_found > 0:
        base_conf = 85.0
    else:
        base_conf = 50.0

    if quality.is_blurred:
        base_conf = min(base_conf, 45.0)

    avg_conf = max(0.0, min(100.0, base_conf))

    status: str = "success"
    if quality.is_blurred or any(f.severity in ["high", "critical"] for f in all_findings):
        status = "partial"
    elif table_result.tables_found == 0:
        status = "partial"

    return ProcessEnvelope[TableExtractionResult](
        status=status,
        confidence=round(avg_conf, 1),
        model_version=settings.ocr_model_version,
        data=table_result,
        findings=all_findings,
    )
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `uv run --directory services/processing pytest tests/test_table_endpoints.py -v`
Expected: PASS (3 passed)
Run full backend suite: `uv run --directory services/processing pytest -v`
Expected: 101 passed, 0 failed.

- [ ] **Step 5: Commit**

```bash
git add services/processing/app/routers/ocr.py services/processing/tests/test_table_endpoints.py
git commit -m "feat(processing): add generic table detection REST endpoint"
```

---

### Task 3: Frontend API Client & Processing Lab Table Visualizer

**Files:**
- Modify: `src/services/processingClient.ts`
- Modify: `src/services/processingClient.test.ts`
- Modify: `src/components/lab/ProcessingLabView.tsx`
- Modify: `src/components/lab/ProcessingLabView.test.tsx`

**Interfaces:**
- Consumes:
  - `POST /api/v1/ocr/table`
  - `ProcessEnvelope<TableExtractionResult>`
- Produces:
  - `TableCell`, `ExtractedTable`, `TableExtractionResult` TypeScript interfaces
  - `processTableImage(file: File, borderless?: boolean)`
  - Subtab `'table'` in `ProcessingLabView` with interactive HTML `<table>` rendering, headers, rows, and "Copy CSV" / "Copy JSON"

- [ ] **Step 1: Write failing unit tests for `processTableImage` and Table UI**

Add in `src/services/processingClient.test.ts`:
```typescript
test('processTableImage calls /api/v1/ocr/table with borderless parameter', async () => {
  const dummyTableResponse: ProcessEnvelope<TableExtractionResult> = {
    status: 'success',
    confidence: 85.0,
    findings: [],
    evidence_refs: [],
    model_version: 'easyocr-1.7.2',
    processed_at: new Date().toISOString(),
    data: {
      tables_found: 1,
      tables: [
        {
          table_idx: 0,
          headers: ['Item', 'Biaya'],
          rows: [['Admin', '5000'], ['Total', '100000']],
          cells: [],
          num_rows: 2,
          num_cols: 2,
        },
      ],
      raw_text: 'Item\tBiaya\nAdmin\t5000\nTotal\t100000',
    },
  };

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => dummyTableResponse,
  });

  const file = new File(['dummy content'], 'slip.png', { type: 'image/png' });
  const result = await processTableImage(file, true);

  expect(mockFetch).toHaveBeenCalledTimes(1);
  const [url, init] = mockFetch.mock.calls[0];
  expect(url).toContain('/api/v1/ocr/table?borderless=true');
  expect(init.method).toBe('POST');
  expect(result.data.tables_found).toBe(1);
  expect(result.data.tables[0].headers).toEqual(['Item', 'Biaya']);
});
```

Add in `src/components/lab/ProcessingLabView.test.tsx`:
```typescript
test('renders Table subtab and sample loader prompt', () => {
  const html = renderToStaticMarkup(<ProcessingLabView initialTab="table" />);
  expect(html).toContain('Table');
  expect(html).toContain('Table Detection');
  expect(html).toContain('slip_gaji_normal.jfif');
});

test('renders extracted table view when initialResult contains tables', () => {
  const tableEnvelope: ProcessEnvelope<TableExtractionResult> = {
    status: 'success',
    confidence: 90.0,
    findings: [],
    evidence_refs: [],
    model_version: 'easyocr-1.7.2',
    processed_at: new Date().toISOString(),
    data: {
      tables_found: 1,
      tables: [
        {
          table_idx: 0,
          headers: ['Komponen', 'Nominal'],
          rows: [['Gaji Pokok', 'Rp 10.000.000']],
          cells: [],
          num_rows: 1,
          num_cols: 2,
        },
      ],
      raw_text: 'Komponen\tNominal',
    },
  };

  const html = renderToStaticMarkup(
    <ProcessingLabView initialTab="table" initialResult={tableEnvelope} />
  );
  expect(html).toContain('Komponen');
  expect(html).toContain('Nominal');
  expect(html).toContain('Rp 10.000.000');
  expect(html).toContain('Copy CSV');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test src/services/processingClient.test.ts`
Expected: FAIL with `processTableImage is not defined`

- [ ] **Step 3: Implement client method and Table UI visualizer**

In `src/services/processingClient.ts`:
```typescript
export interface TableCell {
  row_idx: int;
  col_idx: int;
  text: string;
  confidence: number;
  bbox?: number[] | null;
  is_header?: boolean;
}

export interface ExtractedTable {
  table_idx: number;
  headers: string[];
  rows: string[][];
  cells: TableCell[];
  num_rows: number;
  num_cols: number;
  bbox?: number[] | null;
}

export interface TableExtractionResult {
  tables_found: number;
  tables: ExtractedTable[];
  raw_text: string;
}

export async function processTableImage(
  file: File,
  borderless: boolean = true
): Promise<ProcessEnvelope<TableExtractionResult>> {
  validateFileSize(file, MAX_IMAGE_SIZE, 'Image');
  const formData = new FormData();
  formData.append('file', file);

  const query = borderless ? '?borderless=true' : '?borderless=false';
  const response = await safeFetch(`/api/v1/ocr/table${query}`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse<TableExtractionResult>(response);
}
```

In `src/components/lab/ProcessingLabView.tsx`:
- Extend `LabSubTab`: `export type LabSubTab = 'ktp' | 'icr' | 'voice' | 'general' | 'table';`
- Add `Table` icon to tab list with label `'Table'`.
- In `handleLoadDemo`: map `'table'` to `/slip_gaji_normal.jfif`.
- In `handleRunProcessing`: route `'table'` to `processTableImage(selectedFile)`.
- Add `TableDomainCard` component:
  - Displays detected table count badge (`1 Table Detected`).
  - Renders responsive HTML table (`<table className="w-full text-left border-collapse">`) with `<thead>` for `headers` and alternating `<tr>` for `rows`.
  - Includes "Copy CSV" and "Copy JSON" buttons with feedback state.
  - Fallback message when `tables_found === 0`.

- [ ] **Step 4: Run tests and production build to verify they pass**

Run: `bun test`
Expected: 210 passed, 0 failed across 21 files.
Run: `bun run build`
Expected: Clean build with 0 TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/services/processingClient.ts src/services/processingClient.test.ts src/components/lab/ProcessingLabView.tsx src/components/lab/ProcessingLabView.test.tsx
git commit -m "feat(frontend): add table extraction client and interactive table visualizer in lab"
```

---

## Plan Self-Review Checklist

1. **Spec coverage**:
   - Generic table detection schemas? Covered in Task 1.
   - `img2table` + EasyOCR wrapper? Covered in Task 1.
   - `POST /api/v1/ocr/table`? Covered in Task 2.
   - Frontend client + Processing Lab visualizer? Covered in Task 3.
2. **Placeholder scan**: Clean. No "TBD", "TODO", or vague descriptions.
3. **Type consistency**: `TableCell`, `ExtractedTable`, `TableExtractionResult` are identical across Python Pydantic and TypeScript interfaces.
