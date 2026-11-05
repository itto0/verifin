# Case 0941 (Ahmad Fauzi) Real Document Integration - Design Spec

**Date:** 2026-11-05  
**Topic:** Integration of authentic documents for Case 0941 (Ahmad Fauzi) across VeriFin  
**Status:** Approved  

---

## 1. Overview & Goals

The user has placed 7 authentic case document images in `public/` corresponding to borrower Ahmad Fauzi (`CASE-0941` / `BAF-APP-2026-0941`). Previously, the application utilized generic Unsplash placeholder URLs and placeholder canvas mockups for these items.

This design specifies how these files are connected into the data models, views, and components across:
1. **e-KTP & Document Verification View** (e-KTP, Kartu Keluarga, Slip Gaji)
2. **Geo & Field Survey Verification View** (House Front & PLN Meter photos)
3. **ICR / Intelligent Document Processing View** (CMO Survey Form, ATR/BPN Land Certificate, Corporate Payroll Slip)

---

## 2. Inventory of Document Files in `public/`

| File Name | Description | Target Component / View |
|-----------|-------------|-------------------------|
| `ktp_demo_normal.jfif` (or `ktp_demo.jpg`) | Ahmad Fauzi's e-KTP (NIK 3174012005850001) | `CaseEktpPage`, `DetailedKtpCard`, `demoPresets` |
| `kartu_keluarga_normal.jfif` | Family Card (Kartu Keluarga) for Ahmad Fauzi | `CaseEktpPage` (new KK tab) |
| `slip_gaji_normal.jfif` | Corporate payroll slip for PT Mitra Solusi Solusindo | `CaseEktpPage` (Salary tab), `icrData` (`ICR-DOC-003`) |
| `survey_house_front.jfif` | Field survey photo: Tampak Depan Rumah | `CaseGeoPage` (`PHT-01`) |
| `survey_pln_meter.jfif` | Field survey photo: Meteran Listrik PLN (KWH) | `CaseGeoPage` (`PHT-02`) |
| `survey_form_cmo.jfif` | Handwritten CMO Field Survey Form (SRV-FORM-2026-0941) | `icrData` (`ICR-DOC-001`), `DetailedIcrDocumentCard` |
| `sertipikat_tanah_bpn.jfif` | ATR/BPN Land Certificate (Hak Milik No. 04821) | `icrData` (`ICR-DOC-002`), `DetailedIcrDocumentCard` |

---

## 3. Data Schema & Mock Updates

### 3.1 Type Definitions (`src/types.ts`)
Update `SurveyPhoto` to include an optional `imageUrl`:
```typescript
export interface SurveyPhoto {
  id: string;
  caption: string;
  timestamp: string;
  lat: number;
  lng: number;
  isFromInAppCamera: boolean;
  hasExifTamper: boolean;
  photoType: 'house_front' | 'electricity_meter' | 'selfie_with_applicant' | 'road_access';
  imageUrl?: string;
}
```

### 3.2 Mock Data (`src/data/mockData.ts`)
For `mockCases[0]` (`CASE-0941`):
- `document.ktpImageUrl`: `"/ktp_demo_normal.jfif"`
- `document.kkImageUrl`: `"/kartu_keluarga_normal.jfif"`
- `document.slipGajiImageUrl`: `"/slip_gaji_normal.jfif"`
- `document.salarySlip.slipImageUrl`: `"/slip_gaji_normal.jfif"`
- `geo.surveyPhotos`:
  - `PHT-01` (`house_front`): Add `imageUrl: "/survey_house_front.jfif"`
  - `PHT-02` (`electricity_meter`): Add `imageUrl: "/survey_pln_meter.jfif"`

### 3.3 ICR Mock Data (`src/data/icrData.ts`)
- `ICR-DOC-001` (Survey Form CMO): Update `imageUrl: "/survey_form_cmo.jfif"`
- `ICR-DOC-002` (Sertipikat Tanah BPN): Update `imageUrl: "/sertipikat_tanah_bpn.jfif"`
- `ICR-DOC-003` (Slip Gaji): Update `imageUrl: "/slip_gaji_normal.jfif"`

### 3.4 Fallbacks & Demo Presets (`src/data/demoPresets.ts`, `src/components/detail/DetailedKtpCard.tsx`)
- Update fallback references from `/ktp_demo_normal.jpg` to `/ktp_demo_normal.jfif`.

---

## 4. UI Components & Display

### 4.1 Document Verification Subpage (`src/components/detail/subpages/CaseEktpPage.tsx`)
1. **Add Tab for Kartu Keluarga**:
   - Extend the view mode selector state to support `'ktp' | 'selfie' | 'salary' | 'kk'`.
   - Add tab button: `Kartu Keluarga (KK)` with icon (`FileText` or `Users`).
2. **Kartu Keluarga Viewer**:
   - Displays `/kartu_keluarga_normal.jfif` inside the interactive image viewer (zoom/pan, rotate, reset).
   - Right-side / bottom metadata panel displaying:
     - No. KK: `3174010502120005` (matching family card data)
     - Kepala Keluarga: `Ahmad Fauzi`
     - Status Verifikasi: `Dukcapil Verified (MATCH)`
     - Jumlah Anggota Keluarga: `3 Jiwa`
     - Alamat: `Jl. Tebet Barat Dalam VII No. 14, RT 005 / RW 003`

### 4.2 Geo Survey Photos Subpage (`src/components/detail/subpages/CaseGeoPage.tsx`)
1. **Render Real Survey Photos**:
   - In the survey photo grid, check if `photo.imageUrl` exists.
   - If present, render the actual image with object-fit cover, subtle hover zoom, and click-to-lightbox dialog.
   - Retain the CameraX verified badge, timestamp watermark, GPS coordinates overlay, and EXIF integrity check.
   - If `imageUrl` is absent, fall back to the existing placeholder canvas.

### 4.3 ICR Document Processing (`src/components/detail/DetailedIcrDocumentCard.tsx`)
- Verify that `DetailedIcrDocumentCard` correctly renders `/survey_form_cmo.jfif` and `/sertipikat_tanah_bpn.jfif` with bounding boxes and extracted OCR fields.

---

## 5. Verification & Testing

1. **Automated Tests**:
   - Run `bun test` to confirm all existing unit/component tests continue passing.
   - Add/update tests for `CaseGeoPage` and `CaseEktpPage` covering the new `imageUrl` rendering and `kk` tab navigation.
2. **Visual & Browser Verification**:
   - Verify that all 7 images load without 404s.
   - Verify layout responsiveness and zoom/pan functionality on desktop and mobile viewports.
