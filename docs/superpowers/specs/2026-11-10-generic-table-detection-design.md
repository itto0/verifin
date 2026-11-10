# Generic Table Detection & Extraction Service Design

## 1. Overview & Goals
Financial and survey verification in VeriFin frequently requires extracting structured tabular data from varied, unpredictable document layouts—including:
- **Payslips (Slip Gaji)**: Earnings breakdown, deductions, allowances, take-home pay.
- **Bank Statements (Rekening Koran)**: Date, transaction descriptions, debits, credits, balances.
- **Surveyor Checklists / Inspection Tables**: Multi-column inspection reports.

Since document formats, column headers, and table structures vary widely across institutions and employers, this system implements **generic, layout-agnostic table detection and 2D matrix extraction** rather than rigid template-based matching.

## 2. Architecture & Components

### 2.1 Technology Choice: `img2table` + Shared EasyOCR Engine
- Uses `img2table` (open-source computer vision table segmentation library) coupled with the existing `easyocr.Reader` instance initialized in `services/processing/app/services/ocr_engine.py`.
- Reuses loaded PyTorch/EasyOCR models without allocating duplicate GPU/CPU memory or downloading separate multi-hundred-megabyte deep learning models.
- Detects both **bordered tables** (explicit grid lines via morphological image kernels) and **borderless tables** (whitespace-aligned text blocks).

### 2.2 Data Contract & Schema (`services/processing/app/schemas/table.py`)
```python
from typing import List, Optional
from pydantic import BaseModel, Field

class TableCell(BaseModel):
    row_idx: int
    col_idx: int
    text: str
    confidence: float = 1.0  # Normalized 0.0 - 1.0
    bbox: Optional[List[int]] = None  # [x1, y1, x2, y2]
    is_header: bool = False

class ExtractedTable(BaseModel):
    table_idx: int
    headers: List[str] = Field(default_factory=list)
    rows: List[List[str]] = Field(default_factory=list)  # Clean 2D array of string values
    cells: List[TableCell] = Field(default_factory=list)  # Cell-level bounding boxes and confidences
    num_rows: int = 0
    num_cols: int = 0
    bbox: Optional[List[int]] = None  # Outer table bounding box [x1, y1, x2, y2]

class TableExtractionResult(BaseModel):
    tables_found: int = 0
    tables: List[ExtractedTable] = Field(default_factory=list)
    raw_text: str = ""
```

### 2.3 Response Envelope Output
Wrapped inside the PRD standard `ProcessEnvelope[TableExtractionResult]`:
- `status`: `"success"` if tables are detected; `"partial"` if blurred image or no tables detected; `"failed"` on unreadable/empty image.
- `confidence`: Bounded in `[0.0, 100.0]`. Average cell confidence, penalized (capped at 45.0) if image is blurred.
- `findings`: Combined image quality findings (`BLURRED_IMAGE`, `LOW_RESOLUTION`) and table anomalies (`NO_TABLES_DETECTED`).
- `data`: Complete `TableExtractionResult` with 2D string matrices for rows/columns.

### 2.4 API Endpoint (`services/processing/app/routers/ocr.py` or `table.py`)
- **`POST /api/v1/ocr/table`**:
  - Request: `file: UploadFile` (image: JPEG, PNG, WebP, JFIF; up to 15MB)
  - Query/Form parameter: `borderless: bool = True`
  - Handler declared as standard `def` (synchronous) so FastAPI automatically executes CPU-intensive image processing on the threadpool (`run_in_threadpool`), avoiding event loop starvation.

## 3. Engine Implementation (`services/processing/app/services/table_engine.py`)

1. **Preprocessing & Quality**:
   - Decodes uploaded image bytes using `cv2.imdecode(..., cv2.IMREAD_COLOR)`.
   - Runs `assess_image_quality` (Laplacian blur variance and resolution checks).
2. **Table Segmentation & OCR**:
   - Adapts image array to `img2table.document.Image`.
   - Calls `img_doc.extract_tables(ocr=ocr_wrapper, borderless_tables=borderless, min_confidence=30)`.
   - Formats detected tables into clean `ExtractedTable` objects:
     - Extracts cell coordinates and text.
     - Detects header row if present, otherwise row 0.
     - Produces row-by-row string arrays: `rows[row_idx][col_idx]`.
3. **Mock Mode for Fast Unit Testing**:
   - Supports injecting mock table outputs or mock OCR readers so the entire test suite executes in < 1s without requiring GPU or live OCR weight downloads.

## 4. Frontend Integration

### 4.1 Typed API Client (`src/services/processingClient.ts`)
- TypeScript interfaces: `TableCell`, `ExtractedTable`, `TableExtractionResult`.
- Method: `processTableImage(file: File, borderless?: boolean): Promise<ProcessEnvelope<TableExtractionResult>>`.

### 4.2 Interactive Processing Lab UI (`src/components/lab/ProcessingLabView.tsx`)
- Adds a **Table** sub-tab (`table`) with `Table` icon from `lucide-react`.
- Adds a demo sample loader for tabular documents (`/slip_gaji_normal.jfif`).
- Renders an interactive table visualizer:
  - Formatted HTML `<table>` with alternating row striping and column headers.
  - Cell hover tooltips displaying cell bounding boxes and OCR confidence.
  - "Copy Table as CSV" and "Copy Table as JSON" actions.
  - Raw JSON envelope inspector.

## 5. Error Handling & Edge Cases
- **No Tables in Image**: Emits `Finding(type="NO_TABLES_DETECTED", severity="low")`, returns `status="partial"`, and preserves unformatted extracted text lines in `raw_text`.
- **Large Uploads**: Enforces 15MB image size limit at both frontend UI and backend router.
- **Corrupted Image**: Returns HTTP 400 Bad Request with informative error detail.
- **Blurred Images**: Caps confidence at 45.0% and flags `BLURRED_IMAGE`.

## 6. Testing Plan
- **Backend Unit Tests (`services/processing/tests/test_table_engine.py`)**:
  - Test 2D row/column conversion, header detection, multi-column tables, borderless toggle, and empty table fallbacks.
  - Test image quality degradation and confidence penalty on blurred image.
  - Test HTTP 400 on empty and corrupt image files.
- **Backend Router Tests (`services/processing/tests/test_table_endpoints.py`)**:
  - Test `POST /api/v1/ocr/table` returns valid `ProcessEnvelope[TableExtractionResult]`.
- **Frontend Unit Tests (`src/services/processingClient.test.ts` & `ProcessingLabView.test.tsx`)**:
  - Test `processTableImage` client serialization and error handling.
  - Test table rendering, header display, and sample button loading.
