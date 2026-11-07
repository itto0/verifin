# Case 0941 (Ahmad Fauzi) Demo Data & Public Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify all public document assets (`/ktp_demo_normal.jfif`, `/kartu_keluarga_normal.jfif`, `/slip_gaji_normal.jfif`, `/survey_house_front.jfif`, `/survey_pln_meter.jfif`, `/survey_form_cmo.jfif`, `/sertipikat_tanah_bpn.jfif`) under Case 0941 (Ahmad Fauzi) across ICR mock data and demo presets.

**Architecture:** Update `src/data/icrData.ts` and `src/data/demoPresets.ts` to attribute both handwritten survey form (`ICR-DOC-001`) and BPN land certificate (`ICR-DOC-002`) to Ahmad Fauzi (`CASE-0941`), replace all external Unsplash URLs with local `/...jfif` public assets, and update corresponding tests in `demoPresets.test.ts`.

**Tech Stack:** TypeScript, React, Bun test runner, Vite.

## Global Constraints

- Never introduce external HTTP/Unsplash URLs for documents where local assets exist in `public/`.
- Preserve fraud demonstration presets (`cadastral_mismatch` and `ktp_demo_tampered.jpg`) without breaking anomaly detection logic.
- Maintain 100% test pass rate with `bun test`.

---

### Task 1: Update Mock ICR Documents in `src/data/icrData.ts`

**Files:**
- Modify: `src/data/icrData.ts`
- Test: `src/data/demoPresets.test.ts`

**Interfaces:**
- Consumes: `IcrDocumentSample` from `src/data/icrData.ts`
- Produces: Updated `mockIcrDocuments` with local assets and Ahmad Fauzi identity for `ICR-DOC-001` and `ICR-DOC-002`.

- [ ] **Step 1: Write failing test in `src/data/demoPresets.test.ts` for `mockIcrDocuments`**

Add test checking that `mockIcrDocuments` has local public thumbnails and Ahmad Fauzi identity:

```typescript
import { mockIcrDocuments } from './icrData';

describe('mockIcrDocuments public assets alignment', () => {
  it('aligns ICR-DOC-001 and ICR-DOC-002 with Ahmad Fauzi and local public assets', () => {
    const doc1 = mockIcrDocuments.find((d) => d.id === 'ICR-DOC-001')!;
    expect(doc1.applicantName).toBe('Ahmad Fauzi');
    expect(doc1.caseId).toBe('CASE-0941');
    expect(doc1.thumbnailUrl).toBe('/survey_form_cmo.jfif');
    expect(doc1.imageUrl).toBe('/survey_form_cmo.jfif');

    const doc2 = mockIcrDocuments.find((d) => d.id === 'ICR-DOC-002')!;
    expect(doc2.applicantName).toBe('Ahmad Fauzi');
    expect(doc2.caseId).toBe('CASE-0941');
    expect(doc2.thumbnailUrl).toBe('/sertipikat_tanah_bpn.jfif');
    expect(doc2.imageUrl).toBe('/sertipikat_tanah_bpn.jfif');
    expect(doc2.bpnSpatialVerification?.registeredOwner).toContain('Ahmad Fauzi');
    expect(doc2.bpnSpatialVerification?.districtOffice).toContain('Jakarta Selatan');

    const doc3 = mockIcrDocuments.find((d) => d.id === 'ICR-DOC-003')!;
    expect(doc3.thumbnailUrl).toBe('/sertipikat_tanah_bpn.jfif');
    expect(doc3.imageUrl).toBe('/sertipikat_tanah_bpn.jfif');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/data/demoPresets.test.ts`
Expected: FAIL due to Unsplash thumbnails, Doni Kurniawan name, and `/slip_gaji_normal.jfif` on doc3.

- [ ] **Step 3: Update `src/data/icrData.ts`**

Update `mockIcrDocuments`:
- `ICR-DOC-001`: `thumbnailUrl: '/survey_form_cmo.jfif'`, `imageUrl: '/survey_form_cmo.jfif'`
- `ICR-DOC-002`:
  - `applicantName: 'Ahmad Fauzi'`, `caseId: 'CASE-0941'`
  - `thumbnailUrl: '/sertipikat_tanah_bpn.jfif'`, `imageUrl: '/sertipikat_tanah_bpn.jfif'`
  - `pemegang_hak` extracted field: `'AHMAD FAUZI'`
  - `surat_ukur` extracted field: `'No. 342/Tebet/2018'`
  - `bpnSpatialVerification`:
    - `districtOffice: 'Kantor Pertanahan Kota Administrasi Jakarta Selatan'`
    - `registeredOwner: 'Ahmad Fauzi (Sesuai KTP Pemohon)'`
    - `applicantRelation: 'Pemilik Langsung (Self-Owned)'`
    - `latitude: -6.2383`, `longitude: 106.8532`
    - `spatialMatchWithSurveyAddress: true`
    - `sentuhTanahkuStatus: 'Terverifikasi BPN'`
- `ICR-DOC-003`: `thumbnailUrl: '/sertipikat_tanah_bpn.jfif'`, `imageUrl: '/sertipikat_tanah_bpn.jfif'`

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/data/demoPresets.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/icrData.ts src/data/demoPresets.test.ts
git commit -m "feat(data): align mockIcrDocuments with Ahmad Fauzi and local public assets"
```

---

### Task 2: Align `icrDemoPresets` in `src/data/demoPresets.ts` and Tests

**Files:**
- Modify: `src/data/demoPresets.ts`
- Modify: `src/data/demoPresets.test.ts`

**Interfaces:**
- Consumes: `icrDemoPresets`
- Produces: Updated `clean_shm` preset with Ahmad Fauzi applicant identity, Jakarta Selatan land office, and local image URLs.

- [ ] **Step 1: Write failing test in `src/data/demoPresets.test.ts` for `clean_shm`**

Add assertion in `src/data/demoPresets.test.ts`:
```typescript
it('aligns clean_shm preset with Ahmad Fauzi and South Jakarta cadastral registry', () => {
  const shm = icrDemoPresets.clean_shm;
  expect(shm.applicantName).toBe('Ahmad Fauzi');
  expect(shm.caseId).toBe('CASE-0941');
  expect(shm.thumbnailUrl).toBe('/sertipikat_tanah_bpn.jfif');
  expect(shm.imageUrl).toBe('/sertipikat_tanah_bpn.jfif');
  expect(shm.bpnSpatialVerification?.registeredOwner).toBe('Ahmad Fauzi');
  expect(shm.bpnSpatialVerification?.districtOffice).toBe('Kantor Pertanahan Kota Administrasi Jakarta Selatan');
  expect(shm.bpnSpatialVerification?.latitude).toBe(-6.2383);
  expect(shm.bpnSpatialVerification?.longitude).toBe(106.8532);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/data/demoPresets.test.ts`
Expected: FAIL with `applicantName` being 'Doni Kurniawan' instead of 'Ahmad Fauzi'.

- [ ] **Step 3: Update `src/data/demoPresets.ts`**

Update `clean_shm`:
```typescript
clean_shm: {
  id: 'ICR-PRESET-CLEAN',
  type: 'bpn_certificate',
  title: 'Sertipikat Hak Milik (SHM) Agunan Tambahan / Sentuh Tanahku',
  applicantName: 'Ahmad Fauzi',
  caseId: 'CASE-0941',
  scanDate: '2026-10-27 10:50 WIB',
  documentNumber: 'SHM-3174-05-01294',
  overallConfidence: 96,
  status: 'verified',
  thumbnailUrl: '/sertipikat_tanah_bpn.jfif',
  imageUrl: '/sertipikat_tanah_bpn.jfif',
  summaryNote: 'Validasi OCR dan pencocokan koordinat persil bidang tanah Sentuh Tanahku (Kementerian ATR/BPN) terverifikasi cocok.',
  extractedFields: [
    {
      fieldKey: 'shm_nomor',
      label: 'Nomor Sertipikat',
      extractedValue: 'SHM No. 01294/Tebet',
      normalizedValue: 'SHM-01294',
      confidence: 99,
      isAnomaly: false,
    },
    {
      fieldKey: 'nib',
      label: 'Nomor Identifikasi Bidang (NIB)',
      extractedValue: '09.02.04.05.01294',
      normalizedValue: '09.02.04.05.01294',
      confidence: 98,
      isAnomaly: false,
    },
    {
      fieldKey: 'luas_tanah',
      label: 'Luas Tanah Terdaftar',
      extractedValue: '142 m2 (Seratus Empat Puluh Dua Meter Persegi)',
      normalizedValue: '142',
      confidence: 97,
      isAnomaly: false,
    },
    {
      fieldKey: 'nama_pemilik',
      label: 'Nama Pemegang Hak',
      extractedValue: 'AHMAD FAUZI',
      normalizedValue: 'AHMAD FAUZI',
      confidence: 99,
      isAnomaly: false,
    },
    {
      fieldKey: 'asal_hak',
      label: 'Asal Hak Milik',
      extractedValue: 'Konversi Letter C No. 402/Dsk',
      normalizedValue: 'KONVERSI_C',
      confidence: 94,
      isAnomaly: false,
    },
  ],
  bpnSpatialVerification: {
    persilNib: '09.02.04.05.01294',
    shmNumber: 'SHM No. 01294/Tebet',
    surfaceAreaM2: 142,
    districtOffice: 'Kantor Pertanahan Kota Administrasi Jakarta Selatan',
    registeredOwner: 'Ahmad Fauzi',
    applicantRelation: 'Pemilik Langsung (Sesuai KTP)',
    latitude: -6.2383,
    longitude: 106.8532,
    spatialMatchWithSurveyAddress: true,
    sentuhTanahkuStatus: 'Terverifikasi BPN',
  },
},
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/data/demoPresets.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/demoPresets.ts src/data/demoPresets.test.ts
git commit -m "feat(data): align clean_shm demo preset with Ahmad Fauzi and local assets"
```

---

### Task 3: Full Verification Across Modules & Build

**Files:**
- Verify: Entire test suite and build output

- [ ] **Step 1: Run complete test suite**

Run: `bun test`
Expected: 172+ pass, 0 fail.

- [ ] **Step 2: Run production build check**

Run: `bun run build`
Expected: Exit code 0, clean build in `dist/`.

- [ ] **Step 3: Commit any final integration adjustments**

```bash
git commit --allow-empty -m "chore: verify all public assets aligned with case 0941 Ahmad Fauzi"
```
