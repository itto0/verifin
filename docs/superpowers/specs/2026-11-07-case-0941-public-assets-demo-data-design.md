# Case 0941 (Ahmad Fauzi) Demo Data & Public Assets Alignment - Design Spec

**Date:** 2026-11-07  
**Topic:** Align Case 0941 (Ahmad Fauzi) demo data and ICR presets with all public assets  
**Status:** Approved  

---

## 1. Executive Summary & Goals

The VeriFin application provides multi-pillar AI fraud prevention and underwriting verification for vehicle financing. While individual document scans for e-KTP, Kartu Keluarga, Slip Gaji, and survey photos were previously linked to Case 0941 (`BAF-APP-2026-0941` / `Ahmad Fauzi`), secondary document assets in `public/`—specifically `sertipikat_tanah_bpn.jfif` and `survey_form_cmo.jfif`—retained legacy associations, external Unsplash thumbnails, and mismatched borrower identities.

This specification unifies all authentic scan assets in `public/` around **Case 0941 (Ahmad Fauzi)**:
1. `ktp_demo_normal.jfif` (and `.jpg` / `ktp_demo_tampered.jpg`) -> e-KTP Verification
2. `kartu_keluarga_normal.jfif` -> Family Card Verification
3. `slip_gaji_normal.jfif` -> Corporate Payroll Slip Verification
4. `survey_house_front.jfif` -> Field Survey Photo 1 (House Front)
5. `survey_pln_meter.jfif` -> Field Survey Photo 2 (PLN Electricity Meter)
6. `survey_form_cmo.jfif` -> Handwritten CMO Survey Inspection Form (`ICR-DOC-001`)
7. `sertipikat_tanah_bpn.jfif` -> ATR/BPN Land Certificate SHM (`ICR-DOC-002` & `clean_shm` preset)

---

## 2. Public Asset Mapping Matrix

| Asset File in `public/` | Document Type | Associated Case | Borrower / Owner | UI Component / View |
|---|---|---|---|---|
| `/ktp_demo_normal.jfif` | e-KTP (Civil ID) | `CASE-0941` | Ahmad Fauzi | `CaseEktpPage`, `DetailedKtpCard` |
| `/ktp_demo_tampered.jpg` | Tampered e-KTP | `CASE-0941` (Demo preset) | Ahmad Fauzi | `DetailedKtpCard` (tamper preset) |
| `/kartu_keluarga_normal.jfif` | Kartu Keluarga (KK) | `CASE-0941` | Ahmad Fauzi | `CaseEktpPage` (KK Tab) |
| `/slip_gaji_normal.jfif` | Slip Gaji (Payroll) | `CASE-0941` | Ahmad Fauzi | `DetailedSalarySlipCard` |
| `/survey_house_front.jfif` | Survey: Tampak Depan Rumah | `CASE-0941` (`PHT-01`) | Ahmad Fauzi | `CaseGeoPage` |
| `/survey_pln_meter.jfif` | Survey: Meteran Listrik KWH | `CASE-0941` (`PHT-02`) | Ahmad Fauzi | `CaseGeoPage`, `DetailedIcrDocumentCard` |
| `/survey_form_cmo.jfif` | Formulir Lapangan CMO | `CASE-0941` (`ICR-DOC-001`) | Ahmad Fauzi | `CaseIcrPage`, `IcrDocumentView` |
| `/sertipikat_tanah_bpn.jfif` | SHM Sentuh Tanahku | `CASE-0941` (`ICR-DOC-002`) | Ahmad Fauzi | `CaseIcrPage`, `IcrDocumentView` |

---

## 3. Detailed Data Modifications

### 3.1 `src/data/icrData.ts`
- **`ICR-DOC-001` (Formulir Survei Lapangan BAF):**
  - `applicantName`: `'Ahmad Fauzi'`
  - `caseId`: `'CASE-0941'`
  - `documentNumber`: `'SRV-FORM-2026-0941'`
  - `imageUrl`: `'/survey_form_cmo.jfif'`
  - `thumbnailUrl`: `'/survey_form_cmo.jfif'` (replace Unsplash URL)
  - `summaryNote`: Keep focus on handwritten anomalies in PLN capacity and guarantor notes matching Ahmad Fauzi's survey context.

- **`ICR-DOC-002` (Sertipikat Hak Milik BPN):**
  - `applicantName`: `'Ahmad Fauzi'` (reassigned from Doni Kurniawan)
  - `caseId`: `'CASE-0941'`
  - `documentNumber`: `'SHM-3174-05-01294'`
  - `imageUrl`: `'/sertipikat_tanah_bpn.jfif'`
  - `thumbnailUrl`: `'/sertipikat_tanah_bpn.jfif'` (replace Unsplash URL)
  - `extractedFields`:
    - Pemegang Hak: `'AHMAD FAUZI'`
    - NIB: `'09.01.05.02.04581'`
    - Surat Ukur: `'No. 342/Tebet/2018'`
    - Luas Tanah: `'142 m² (Seratus empat puluh dua meter persegi)'`
  - `bpnSpatialVerification`:
    - `districtOffice`: `'Kantor Pertanahan Kota Administrasi Jakarta Selatan'`
    - `registeredOwner`: `'Ahmad Fauzi (Sesuai KTP Pemohon)'`
    - `applicantRelation`: `'Pemilik Langsung (Self-Owned)'`
    - `latitude`: `-6.2383`
    - `longitude`: `106.8532`
    - `spatialMatchWithSurveyAddress`: `true`
    - `sentuhTanahkuStatus`: `'Terverifikasi BPN'`

- **`ICR-DOC-003` (Sertipikat Agunan Bermasalah - Anomali):**
  - `imageUrl`: `'/sertipikat_tanah_bpn.jfif'` (replaces mismatched `/slip_gaji_normal.jfif`)
  - `thumbnailUrl`: `'/sertipikat_tanah_bpn.jfif'` (replace Unsplash URL)
  - Retain `applicantName: 'Hendra Irawan'`, `caseId: 'CASE-0946'`, with spatial mismatch and differing owner for fraud testing.

### 3.2 `src/data/demoPresets.ts`
- **`icrDemoPresets.clean_shm`:**
  - `applicantName`: `'Ahmad Fauzi'`
  - `caseId`: `'CASE-0941'`
  - `extractedFields`:
    - `nama_pemilik`: `'AHMAD FAUZI'`
  - `bpnSpatialVerification`:
    - `districtOffice`: `'Kantor Pertanahan Kota Administrasi Jakarta Selatan'`
    - `registeredOwner`: `'Ahmad Fauzi'`
    - `applicantRelation`: `'Pemilik Langsung (Sesuai KTP)'`
    - `latitude`: `-6.2383`
    - `longitude`: `106.8532`
    - `spatialMatchWithSurveyAddress`: `true`
    - `sentuhTanahkuStatus`: `'Terverifikasi BPN'`
  - `thumbnailUrl`: `'/sertipikat_tanah_bpn.jfif'`
  - `imageUrl`: `'/sertipikat_tanah_bpn.jfif'`

- **`icrDemoPresets.low_confidence`:**
  - Verify `applicantName: 'Ahmad Fauzi'`, `caseId: 'CASE-0941'`, and image paths use `/survey_form_cmo.jfif`.

---

## 4. Testing & Verification

1. **`demoPresets.test.ts`:**
   - Update tests checking `clean_shm` to assert `Ahmad Fauzi` and `CASE-0941`.
   - Ensure thumbnail assertions verify `/sertipikat_tanah_bpn.jfif` and `/survey_form_cmo.jfif`.
2. **`CaseIcrPage.test.ts` & `aiService.test.ts`:**
   - Verify that fallback document selection and mock ICR parsing for Ahmad Fauzi continue to succeed.
3. **Full Test Suite:**
   - Execute `bun test` to confirm all 172+ test cases pass without regression.
4. **Build Check:**
   - Execute `bun run build` to confirm zero TypeScript compilation or bundling errors.
