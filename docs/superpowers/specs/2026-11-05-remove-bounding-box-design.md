# Design Specification: Remove Document Scan Bounding Boxes

## Context & Motivation
In VeriFin's document forensics and OCR inspection views, bounding box overlays (such as red dashed anomaly boxes and blue coordinate reticles on hover/click) were previously rendered directly on top of the original physical document scan. To deliver a cleaner visual inspection experience without visual clutter obscuring document details, all overlay bounding boxes are removed from the scan viewer while retaining field-level table interactions and forensic indicator badges.

## Scope & Target Components

### 1. `src/components/detail/DetailedKtpCard.tsx`
- **Remove Red Dashed Anomaly Bounding Boxes**:
  Remove the conditional iteration over `document.ocrFields` that rendered dashed red rectangles over anomalous text regions (`showTamperOverlay && Object.entries(document.ocrFields).map(...)`).
- **Remove Hover / Selection Coordinate Reticle**:
  Remove the `hoveredBox` visual indicator div rendered over the KTP scan (`{hoveredBox && (...)}`).
- **Clean Up Hovered State Computations**:
  Remove the `hoveredBox` variable assignment.
- **Retain Key Scan Badges & Warnings**:
  Retain the overall tamper warning overlay banner (`showTamperOverlay && isHighRisk`), the LCD moiré tag, and clean image presentation.

### 2. Microcopy Cleanups
- **`src/components/detail/subpages/CaseIcrPage.tsx`**:
  Update subtext from `"Click or hover any row to pinpoint bounding box"` to `"Click or hover any row to inspect field"`.
- **`src/components/detail/DetailedSalarySlipCard.tsx`**:
  Update description from `"Inspeksi keaslian dokumen, koordinat bounding box OCR, dan verifikasi stempel"` to `"Inspeksi keaslian dokumen, ekstraksi OCR, dan verifikasi stempel"`.

### 3. Data Schema & Pipeline Compatibility
- Preserve existing data interfaces (`boundingBox?: { x: number; y: number; w: number; h: number }` in `types.ts`) and mock data to guarantee zero breaking changes to AI services, ICR processors, or backend contracts.

## Verification
- Run test suite: `bun test` ensuring 100% pass rate.
- Run typecheck / build: `bun run build` or Vite build check to ensure zero TypeScript errors.
