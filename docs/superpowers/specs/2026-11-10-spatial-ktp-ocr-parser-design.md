# Spatial & Multi-Box e-KTP OCR Parser Design Specification

**Date:** 2026-11-10  
**Topic:** Enhanced e-KTP Field Extraction with Spatial Row Pairing and OCR Artifact Normalization  
**Service:** `services/processing` (`app/services/ktp_parser.py`)

---

## 1. Context & Problem Statement

In production OCR environments using EasyOCR on Indonesian e-KTP cards (e.g. `public/ktp_demo_normal.jfif`), field labels (e.g. `Nama`, `Jenis Kelamin`, `Agama`) are spatially positioned on the left side of the card, while their corresponding values (e.g. `AHMAD FAUZI`, `LAKI-LAKI`, `ISLAM`) are positioned on the right side.

Because EasyOCR detects them as separate text bounding boxes on separate lines (e.g., Line 5 `Nama`, Line 6 `AHMAD FAUZI`), single-line regex rules requiring `Label : Value` on the exact same string fail to extract the values, leaving most e-KTP fields as `None` despite EasyOCR having high detection confidence for all boxes.

---

## 2. Goals & Success Criteria

1. **Full 14-Field e-KTP Extraction**: Successfully extract all standard e-KTP fields (`nik`, `nama`, `tempat_lahir`, `tgl_lahir`, `jenis_kelamin`, `alamat`, `rt_rw`, `kel_desa`, `kecamatan`, `agama`, `status_perkawinan`, `pekerjaan`, `kewarganegaraan`, `berlaku_hingga`) from real multi-box scans.
2. **Two-Tier Matching (Spatial + Sequential)**:
   - Primary: Spatial row alignment using bounding box coordinates (`y` overlap, `x_val > x_label`).
   - Secondary / Fallback: Sequential line adjacency (Line $i$ = Label, Line $i+1$ = Value).
   - Fast-path: Inline single-line regex matching (`Label : Value`).
3. **Artifact Tolerance**: Tolerate standard OCR noise in labels (e.g. `RTIRW` for `RT/RW`, `KellDesa` for `Kel/Desa`, `Tempat.*Lahir` for `Tempat/Tgl Lahir`).
4. **Zero Regressions**: Maintain 100% backward compatibility with all existing mock test cases and API contracts.

---

## 3. Architecture & Algorithm Design

### 3.1 Input Line Representation
The parser accepts a list of OCR items, each conforming to:
- `OCRLineResult` object with `.text`, `.confidence`, and `.bbox` (`List[List[int]]` of four corners: top-left, top-right, bottom-right, bottom-left).
- Duck-typed tuple/list `(text, confidence)` or string.

### 3.2 Label Dictionary & Spatial Association
Define a structured specification of e-KTP labels:
- `NIK`: Pattern matching standalone 16 digits `\b\d{16}\b` or labeled `NIK\s*[:;.]?\s*(\d+)`.
- `Nama`: Standalone pattern `^Nama$` or prefix `^Nama\s*[:;.]?\s*(.+)$`.
- `Tempat/Tgl Lahir`: Pattern `^Tempat.*Lahir$` or prefix.
- `Jenis Kelamin`: Pattern `^Jenis\s*Kelamin$` or prefix. Also handles stripping `Gol. Darah: ...` if placed on the same line.
- `Alamat`: Pattern `^Alamat$` or prefix.
- `RT/RW`: Pattern `^RT\s*[/I\s]?\s*RW$` or prefix.
- `Kel/Desa`: Pattern `^Kel\s*[/I.]?\s*Desa$` or prefix.
- `Kecamatan`: Pattern `^Kecamatan$` or prefix.
- `Agama`: Pattern `^Agama$` or prefix.
- `Status Perkawinan`: Pattern `^Status.*Perkawinan$` or prefix.
- `Pekerjaan`: Pattern `^Pekerjaan$` or prefix.
- `Kewarganegaraan`: Pattern `^Kewarganegaraan$` or prefix.
- `Berlaku Hingga`: Pattern `^Berlaku.*Hingga$` or prefix.

### 3.3 Two-Tier Extraction Algorithm

```text
Algorithm: extract_ktp_fields_from_ocr(lines)
1. Normalize lines into LineItem(text, conf, bbox, center_y, height, min_x, max_x).
2. Scan for NIK first:
   - Check any LineItem containing a 16-digit sequence.
3. For each e-KTP field definition (Nama, Tempat/Tgl Lahir, etc.):
   - Step A (Inline): Check if any LineItem starts with the label AND contains value text.
     If matched, extract value, record confidence, and mark field resolved.
   - Step B (Spatial Row Pairing):
     Find LineItem `L` matching standalone label pattern.
     If `L.bbox` is available:
       Find candidate LineItems `C` such that:
         - C.min_x >= L.min_x (to the right of label)
         - |C.center_y - L.center_y| <= max(L.height, C.height) * 0.8
         - C is not a recognized system label (e.g. not "REPUBLIK", "PROVINSI", etc.)
       Sort candidates by `min_x` ascending and join their texts.
       If joined text is non-empty, assign to field, use average confidence of `C`, and mark resolved.
   - Step C (Sequential Adjacency Fallback):
     If spatial pairing found nothing or bboxes were missing:
       Find LineItem `L` at index `i` matching standalone label pattern.
       If index `i+1` exists and is NOT another recognized label:
         Assign LineItem `i+1`.text as field value, assign its confidence, and mark resolved.
4. Normalize field values:
   - Tempat/Tgl Lahir: partition city and date using comma or date regex `\d{2}[-/.]\d{2}[-/.]\d{4}`.
   - Jenis Kelamin: map to "LAKI-LAKI" or "PEREMPUAN".
   - Clean trailing punctuation and whitespace.
5. Return populated KTPFieldExtraction.
```

---

## 4. Verification & Testing Strategy

1. **Real Image Test**: Validate with `public/ktp_demo_normal.jfif` using EasyOCR engine that all 14 fields (NIK, Nama, Tempat Lahir, Tgl Lahir, Jenis Kelamin, Alamat, RT/RW, Kel/Desa, Kecamatan, Agama, Status Perkawinan, Pekerjaan, Kewarganegaraan, Berlaku Hingga) are successfully extracted.
2. **Unit Tests**:
   - Multi-box spatial lines test (separate label and value bboxes).
   - Sequential lines test (no bbox coordinates, strictly adjacent).
   - Inline lines test (existing mock data format `Label : Value`).
   - Dukcapil cross-validation test with real extracted fields.
3. **Regression Tests**: Ensure all 87 existing pytest cases and 207 Bun frontend tests continue to pass with 0 failures.
