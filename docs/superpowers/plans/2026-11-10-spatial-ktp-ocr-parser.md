# Spatial & Multi-Box e-KTP OCR Parser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the e-KTP field extraction in `app/services/ktp_parser.py` to support spatial horizontal row pairing, sequential line fallback, and OCR artifact tolerance so all 14 standard e-KTP fields are extracted from multi-box EasyOCR outputs.

**Architecture:** Normalizes incoming OCR lines into geometric `LineItem` models, scans for NIK and labels, resolves value boxes either via horizontal spatial alignment ($y$-overlap and $x_{\text{value}} > x_{\text{label}}$) or sequential adjacency, normalizes field values, and populates `KTPFieldExtraction`.

**Tech Stack:** Python 3.10+, FastAPI, Pydantic v2, EasyOCR, Pytest.

## Global Constraints

- Must extract all 14 e-KTP fields (`nik`, `nama`, `tempat_lahir`, `tgl_lahir`, `jenis_kelamin`, `alamat`, `rt_rw`, `kel_desa`, `kecamatan`, `agama`, `status_perkawinan`, `pekerjaan`, `kewarganegaraan`, `berlaku_hingga`).
- Must preserve 100% backward compatibility with single-string inline lines (`"Nama : AHMAD FAUZI"`).
- Must calculate per-field confidence bounded in `[0.0, 1.0]`.
- Must not break any of the 87 existing pytest tests or 207 Bun frontend tests.

---

### Task 1: Spatial Row Grouping & Two-Tier Parser Implementation

**Files:**
- Modify: `services/processing/app/services/ktp_parser.py:210-330`
- Test: `services/processing/tests/test_ocr_endpoints.py`

**Interfaces:**
- Consumes: `OCRLineResult(text, confidence, bbox)` from `app.services.ocr_engine`, `KTPFieldExtraction` from `app.schemas.ocr`.
- Produces: `extract_ktp_fields_from_ocr(lines: List[Any]) -> KTPFieldExtraction`.

- [ ] **Step 1: Write failing tests for multi-box spatial and sequential line extraction**

Add test cases in `services/processing/tests/test_ocr_endpoints.py`:
- `test_extract_ktp_fields_spatial_multi_box`: Feed separate bounding boxes for labels (`x=[500, 650]`) and values (`x=[950, 1400]`) on overlapping $y$ coordinates, asserting `fields.nama == "AHMAD FAUZI"`, `fields.alamat == "JL TEBET BARAT DALAM NO. 12"`, `fields.agama == "ISLAM"`, etc.
- `test_extract_ktp_fields_sequential_fallback`: Feed separate lines without bounding boxes (tuples of `(text, conf)`), asserting `fields.nama == "AHMAD FAUZI"`.

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run --directory services/processing pytest tests/test_ocr_endpoints.py -k "test_extract_ktp_fields_spatial_multi_box" -v`
Expected: FAIL (`assert None == 'AHMAD FAUZI'`)

- [ ] **Step 3: Implement spatial row grouping and multi-box pairing in `ktp_parser.py`**

In `services/processing/app/services/ktp_parser.py`:
1. Build internal `_OCRBox` helper computing `min_x`, `max_x`, `center_y`, and `height` from bounding box coordinates.
2. Implement spatial horizontal matching: For a detected standalone label, locate candidate value boxes sharing the horizontal band ($|y_{\text{val}} - y_{\text{label}}| \le \text{height} \times 0.9$) with $x_{\text{val}} \ge x_{\text{label}}$.
3. Implement sequential fallback for non-bbox inputs.
4. Support OCR noise variations (`RTIRW`, `KellDesa`, `Tempat.*Lahir`, `Gol. Darah`).
5. Ensure inline strings (`Nama : AHMAD FAUZI`) continue to be matched.

- [ ] **Step 4: Run tests to verify they pass**

Run: `uv run --directory services/processing pytest tests/test_ocr_endpoints.py -v`
Expected: PASS (all tests in `test_ocr_endpoints.py`)

- [ ] **Step 5: Commit**

```bash
git add services/processing/app/services/ktp_parser.py services/processing/tests/test_ocr_endpoints.py
git commit -m "feat(processing): implement spatial multi-box row pairing for e-KTP OCR extraction"
```

---

### Task 2: Real e-KTP Image Integration Test & End-to-End Verification

**Files:**
- Modify: `services/processing/tests/test_ocr_endpoints.py`

**Interfaces:**
- Consumes: `public/ktp_demo_normal.jfif`, `extract_ktp_fields_from_ocr`, `POST /api/v1/ocr/ktp`.
- Produces: Integration test verifying full 14-field extraction against real e-KTP scan.

- [ ] **Step 1: Write the end-to-end real KTP image test**

In `services/processing/tests/test_ocr_endpoints.py`:
Add `test_real_ktp_demo_image_full_extraction`:
Read `public/ktp_demo_normal.jfif`, run through `OCREngine`, extract fields via `extract_ktp_fields_from_ocr`, and assert:
- `fields.nik == "3174012005850001"`
- `fields.nama == "AHMAD FAUZI"`
- `fields.tempat_lahir == "JAKARTA"`
- `fields.tgl_lahir == "20-05-1985"`
- `fields.jenis_kelamin == "LAKI-LAKI"`
- `fields.alamat == "JL TEBET BARAT DALAM NO. 12"`
- `fields.rt_rw == "004/002"`
- `fields.kel_desa == "TEBET BARAT"`
- `fields.kecamatan == "TEBET"`
- `fields.agama == "ISLAM"`
- `fields.status_perkawinan == "KAWIN"`
- `fields.pekerjaan == "KARYAWAN SWASTA"`
- `fields.kewarganegaraan == "WNI"`
- `fields.berlaku_hingga == "SEUMUR HIDUP"`
Also assert `cross_validate_ktp(fields).is_valid is True`.

- [ ] **Step 2: Run test to verify it passes**

Run: `uv run --directory services/processing pytest tests/test_ocr_endpoints.py -k "test_real_ktp_demo_image_full_extraction" -v`
Expected: PASS

- [ ] **Step 3: Run full backend and frontend regression test suites**

Run: `uv run --directory services/processing pytest -v`
Expected: PASS (all tests pass)
Run: `bun test`
Expected: PASS (207 pass)

- [ ] **Step 4: Commit**

```bash
git add services/processing/tests/test_ocr_endpoints.py
git commit -m "test(processing): add real e-KTP demo image end-to-end extraction test"
```
