# Case 0941 Document Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate authentic document images for Case 0941 (Ahmad Fauzi) across e-KTP, Kartu Keluarga, Salary Slip, Geo Survey Photos, and ICR document views with full visual support and test coverage.

**Architecture:** Extend data types with `SurveyPhoto.imageUrl`, connect real public asset paths in `mockData.ts`, `icrData.ts`, and `demoPresets.ts`, add a dedicated Kartu Keluarga (KK) viewer tab in `CaseEktpPage.tsx`, and enhance `CaseGeoPage.tsx` to render real survey photos with EXIF watermarks.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Bun test runner.

## Global Constraints

- Use exact public asset paths: `/ktp_demo_normal.jfif`, `/kartu_keluarga_normal.jfif`, `/slip_gaji_normal.jfif`, `/survey_house_front.jfif`, `/survey_pln_meter.jfif`, `/survey_form_cmo.jfif`, `/sertipikat_tanah_bpn.jfif`.
- Backward compatibility: Fallback gracefully if an image URL is missing or cannot load.
- All existing and new tests must pass via `bun test`.

---

### Task 1: Data Model & Mock Data Updates

**Files:**
- Modify: `src/types.ts:462-475`
- Modify: `src/data/mockData.ts:180-260`
- Modify: `src/data/icrData.ts:30-80`
- Modify: `src/data/demoPresets.ts:12-25`
- Test: `tests/data/mockDataDocuments.test.ts`

**Interfaces:**
- Consumes: Existing `Case`, `DocumentVerification`, `SurveyPhoto`, `IcrDocument` interfaces.
- Produces: Updated `SurveyPhoto.imageUrl?: string` and valid mock references to all 7 files in `public/`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/data/mockDataDocuments.test.ts
import { describe, it, expect } from 'bun:test';
import { mockCases } from '../../src/data/mockData';
import { mockIcrDocuments } from '../../src/data/icrData';
import { ocrDemoPresets } from '../../src/data/demoPresets';

describe('Case 0941 Document Assets Integration', () => {
  it('should reference authentic local documents for CASE-0941', () => {
    const case0941 = mockCases.find((c) => c.id === 'CASE-0941');
    expect(case0941).toBeDefined();

    // e-KTP & Documents
    expect(case0941?.document.ktpImageUrl).toBe('/ktp_demo_normal.jfif');
    expect(case0941?.document.kkImageUrl).toBe('/kartu_keluarga_normal.jfif');
    expect(case0941?.document.slipGajiImageUrl).toBe('/slip_gaji_normal.jfif');
    expect(case0941?.document.salarySlip?.slipImageUrl).toBe('/slip_gaji_normal.jfif');

    // Geo survey photos
    const housePhoto = case0941?.geo.surveyPhotos.find((p) => p.photoType === 'house_front');
    const plnPhoto = case0941?.geo.surveyPhotos.find((p) => p.photoType === 'electricity_meter');

    expect(housePhoto?.imageUrl).toBe('/survey_house_front.jfif');
    expect(plnPhoto?.imageUrl).toBe('/survey_pln_meter.jfif');
  });

  it('should reference authentic local documents for ICR presets', () => {
    const doc001 = mockIcrDocuments.find((d) => d.id === 'ICR-DOC-001');
    const doc002 = mockIcrDocuments.find((d) => d.id === 'ICR-DOC-002');
    const doc003 = mockIcrDocuments.find((d) => d.id === 'ICR-DOC-003');

    expect(doc001?.imageUrl).toBe('/survey_form_cmo.jfif');
    expect(doc002?.imageUrl).toBe('/sertipikat_tanah_bpn.jfif');
    expect(doc003?.imageUrl).toBe('/slip_gaji_normal.jfif');
  });

  it('should update demoPreset clean ktpImageUrl', () => {
    expect(ocrDemoPresets.clean.ktpImageUrl).toBe('/ktp_demo_normal.jfif');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/data/mockDataDocuments.test.ts`  
Expected: FAIL with assertion errors on image URLs.

- [ ] **Step 3: Update `src/types.ts`**

Add `imageUrl?: string` to `SurveyPhoto` interface:
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

- [ ] **Step 4: Update `src/data/mockData.ts`, `src/data/icrData.ts`, `src/data/demoPresets.ts`**

In `src/data/mockData.ts` for `CASE-0941`:
```typescript
ktpImageUrl: '/ktp_demo_normal.jfif',
selfieImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
slipGajiImageUrl: '/slip_gaji_normal.jfif',
kkImageUrl: '/kartu_keluarga_normal.jfif',
```
In `salarySlip`:
```typescript
slipImageUrl: '/slip_gaji_normal.jfif',
```
In `geo.surveyPhotos`:
```typescript
{
  id: 'PHT-01',
  caption: 'Tampak Depan Rumah (Nomor Rumah Jelas)',
  timestamp: '2026-03-28 10:14:32',
  lat: -6.229728,
  lng: 106.845612,
  isFromInAppCamera: true,
  hasExifTamper: false,
  photoType: 'house_front',
  imageUrl: '/survey_house_front.jfif',
},
{
  id: 'PHT-02',
  caption: 'Meteran Listrik PLN (KWH & Segel)',
  timestamp: '2026-03-28 10:16:05',
  lat: -6.229731,
  lng: 106.845608,
  isFromInAppCamera: true,
  hasExifTamper: false,
  photoType: 'electricity_meter',
  imageUrl: '/survey_pln_meter.jfif',
},
```

In `src/data/icrData.ts`:
```typescript
// ICR-DOC-001:
imageUrl: '/survey_form_cmo.jfif',

// ICR-DOC-002:
imageUrl: '/sertipikat_tanah_bpn.jfif',

// ICR-DOC-003:
imageUrl: '/slip_gaji_normal.jfif',
```

In `src/data/demoPresets.ts`:
```typescript
clean: {
  // ...
  ktpImageUrl: '/ktp_demo_normal.jfif',
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun test tests/data/mockDataDocuments.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/data/mockData.ts src/data/icrData.ts src/data/demoPresets.ts tests/data/mockDataDocuments.test.ts
git commit -m "feat(data): wire authentic case 0941 document image assets"
```

---

### Task 2: Kartu Keluarga Tab & Detailed KTP Fallback

**Files:**
- Modify: `src/components/detail/subpages/CaseEktpPage.tsx`
- Modify: `src/components/detail/DetailedKtpCard.tsx`
- Test: `tests/components/CaseEktpPage.test.tsx`

**Interfaces:**
- Consumes: `mockCases[0].document`, `kkImageUrl`, `ktpImageUrl`.
- Produces: ViewMode `'ktp' | 'selfie' | 'salary' | 'kk'` in `CaseEktpPage` and fallback `/ktp_demo_normal.jfif` in `DetailedKtpCard`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/components/CaseEktpPage.test.tsx
import { describe, it, expect } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CaseEktpPage } from '../../src/components/detail/subpages/CaseEktpPage';
import { mockCases } from '../../src/data/mockData';

describe('CaseEktpPage Kartu Keluarga Tab', () => {
  it('should render Kartu Keluarga tab button and switch view when clicked', () => {
    const caseItem = mockCases[0];
    render(<CaseEktpPage currentCase={caseItem} />);

    const kkTabButton = screen.getByRole('button', { name: /kartu keluarga/i });
    expect(kkTabButton).toBeDefined();

    fireEvent.click(kkTabButton);

    const kkImage = screen.getByAltText(/kartu keluarga/i);
    expect(kkImage).toBeDefined();
    expect(kkImage.getAttribute('src')).toBe('/kartu_keluarga_normal.jfif');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/components/CaseEktpPage.test.tsx`  
Expected: FAIL (tab button not found).

- [ ] **Step 3: Update `src/components/detail/DetailedKtpCard.tsx`**

Replace fallback `/ktp_demo_normal.jpg` with `/ktp_demo_normal.jfif`:
```typescript
const imageSrc = document.ktpImageUrl || '/ktp_demo_normal.jfif';
```

- [ ] **Step 4: Update `src/components/detail/subpages/CaseEktpPage.tsx`**

1. Update `ViewMode` type:
```typescript
type ViewMode = 'ktp' | 'selfie' | 'salary' | 'kk';
```
2. Add KK tab in the header switch buttons:
```tsx
<button
  onClick={() => setViewMode('kk')}
  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
    viewMode === 'kk'
      ? 'bg-blue-600 text-white shadow-sm'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
  }`}
>
  <FileText className="w-3.5 h-3.5" />
  Kartu Keluarga (KK)
  {currentCase.document.kkImageUrl && (
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
  )}
</button>
```
3. Add KK viewer section in the main view switch:
```tsx
{viewMode === 'kk' && (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <div className="lg:col-span-8">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Scan Asli Kartu Keluarga (KK)</h3>
              <p className="text-xs text-slate-400">Dokumen pembanding verifikasi susunan keluarga</p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Dukcapil Verified
          </span>
        </div>
        <div className="p-4 bg-slate-950/60 flex items-center justify-center min-h-[460px]">
          <img
            src={currentCase.document.kkImageUrl || '/kartu_keluarga_normal.jfif'}
            alt="Kartu Keluarga"
            className="max-h-[600px] w-auto object-contain rounded-lg shadow-md border border-slate-800"
          />
        </div>
      </div>
    </div>
    <div className="lg:col-span-4 space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Data Hasil Ekstraksi KK
        </h4>
        <dl className="space-y-3 text-xs">
          <div>
            <dt className="text-slate-400">Nomor Kartu Keluarga (NKK)</dt>
            <dd className="font-mono font-medium text-slate-100 mt-0.5">3174010502120005</dd>
          </div>
          <div>
            <dt className="text-slate-400">Nama Kepala Keluarga</dt>
            <dd className="font-medium text-slate-100 mt-0.5">AHMAD FAUZI</dd>
          </div>
          <div>
            <dt className="text-slate-400">Alamat Terdaftar</dt>
            <dd className="text-slate-200 mt-0.5 leading-relaxed">JL TEBET BARAT DALAM VII NO 14, RT 005 / RW 003, KEL. TEBET BARAT, KEC. TEBET</dd>
          </div>
          <div>
            <dt className="text-slate-400">Kesesuaian dengan e-KTP</dt>
            <dd className="text-emerald-400 font-medium mt-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Identik (Alamat & NIK)
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun test tests/components/CaseEktpPage.test.tsx`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/detail/subpages/CaseEktpPage.tsx src/components/detail/DetailedKtpCard.tsx tests/components/CaseEktpPage.test.tsx
git commit -m "feat(ui): add Kartu Keluarga viewer tab and update e-ktp fallback"
```

---

### Task 3: Geo Survey Real Photos & Lightbox Viewer

**Files:**
- Modify: `src/components/detail/subpages/CaseGeoPage.tsx`
- Test: `tests/components/CaseGeoPage.test.tsx`

**Interfaces:**
- Consumes: `currentCase.geo.surveyPhotos`, `SurveyPhoto.imageUrl`.
- Produces: Visual survey photo card rendering `<img src={photo.imageUrl} />` with CameraX overlay and modal lightbox on click.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/components/CaseGeoPage.test.tsx
import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CaseGeoPage } from '../../src/components/detail/subpages/CaseGeoPage';
import { mockCases } from '../../src/data/mockData';

describe('CaseGeoPage Survey Photos', () => {
  it('should render authentic survey photos when imageUrl is present', () => {
    const caseItem = mockCases[0];
    render(<CaseGeoPage currentCase={caseItem} />);

    const images = screen.getAllByRole('img');
    const houseImg = images.find((img) => img.getAttribute('src') === '/survey_house_front.jfif');
    const plnImg = images.find((img) => img.getAttribute('src') === '/survey_pln_meter.jfif');

    expect(houseImg).toBeDefined();
    expect(plnImg).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/components/CaseGeoPage.test.tsx`  
Expected: FAIL (no `img` elements found with those src attributes).

- [ ] **Step 3: Update `src/components/detail/subpages/CaseGeoPage.tsx`**

In `CaseGeoPage.tsx`:
1. Add state for lightbox:
```typescript
const [selectedPhoto, setSelectedPhoto] = useState<SurveyPhoto | null>(null);
```
2. In the survey photo grid item, check `photo.imageUrl`:
```tsx
<div 
  className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-800 cursor-pointer group"
  onClick={() => setSelectedPhoto(photo)}
>
  {photo.imageUrl ? (
    <img
      src={photo.imageUrl}
      alt={photo.caption}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  ) : (
    /* existing placeholder canvas */
  )}
  {/* Existing CameraX overlay, coordinates badge, and timestamp */}
  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-slate-300 pointer-events-none">
    <span className="font-mono bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/50">
      {photo.lat.toFixed(5)}, {photo.lng.toFixed(5)}
    </span>
    <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
      CameraX Live
    </span>
  </div>
</div>
```
3. Add lightbox modal at the bottom of the component when `selectedPhoto` is not null.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/components/CaseGeoPage.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/detail/subpages/CaseGeoPage.tsx tests/components/CaseGeoPage.test.tsx
git commit -m "feat(ui): display real survey photos with lightbox preview in CaseGeoPage"
```

---

### Task 4: Full System Verification & Regression Suite

**Files:**
- Modify: `tests/` (run full suite)
- Test: All unit, integration, and UI tests

- [ ] **Step 1: Run complete test suite**

Run: `bun test`  
Expected: All tests pass (139+ passing tests, 0 failures).

- [ ] **Step 2: Run build to ensure zero TypeScript / bundling errors**

Run: `bun run build`  
Expected: Build succeeds cleanly with no TypeScript errors and generated assets.

- [ ] **Step 3: Commit any final cleanup**

```bash
git add -A
git commit -m "chore: final verification for case 0941 document integration"
```
