# Demo Data Cross-Module Consistency Design

**Date:** 2026-11-07
**Author:** AI Agent
**Status:** Approved

## 1. Goal & Context
The VeriFin application provides multi-pillar fraud prevention and AI verification demos for vehicle financing (e-KTP OCR, Handwritten ICR & BPN Sertipikat Tanahku, Voice STT Audio QA).
While mock cases and master data were previously aligned, the demo presets in `src/data/demoPresets.ts` (`ocrDemoPresets`, `icrDemoPresets`, `voiceDemoPresets`) contained obsolete synthetic data, missing local physical document image paths, and misaligned transkrip dialogues that conflicted with real physical assets and test expectations.

This design aligns all demo presets with:
1. Authentic local document scans in `public/` (`/ktp_demo_normal.jfif`, `/slip_gaji_normal.jfif`, `/kartu_keluarga_normal.jfif`, `/survey_form_cmo.jfif`, `/sertipikat_tanah_bpn.jfif`).
2. Applicant identity and multi-pillar attributes for CASE-0941 (Ahmad Fauzi) and related cases.
3. Test constraints across `demoPresets.test.ts`, `DetailedKtpCard.test.tsx`, `VoiceVerificationTab.test.ts`, `CaseEktpPage.test.ts`, `CaseIcrPage.test.ts`, and `mockDataDocuments.test.ts`.

---

## 2. Component Specifications

### 2.1 OCR Demo Presets (`ocrDemoPresets`)
- **`clean`:**
  - `ktpImageUrl: '/ktp_demo_normal.jfif'`
  - `slipGajiImageUrl: '/slip_gaji_normal.jfif'`
  - `kkImageUrl: '/kartu_keluarga_normal.jfif'`
  - `salarySlip`:
    - `companyName: 'PT Citra Nusantara Mandiri'` (preserved for test expectation)
    - `employeeName: 'AHMAD FAUZI'`
    - `employeeNik: '3174012005850001'`
    - `monthlyInstallment: 1395000`
    - `dsrPercentage: 20.36`
    - `isDsrHealthy: true`
    - `slipImageUrl: '/slip_gaji_normal.jfif'`
  - `nikValidation`:
    - `nik: '3174012005850001'`
    - `isValidStructure: true`
    - `province: '31 - DKI JAKARTA'`
    - `regency: '74 - JAKARTA SELATAN'`
    - `district: '01 - TEBET'`
    - `birthDate: '20-05-1985'`
    - `gender: 'Laki-laki'`
    - `sequenceNumber: '0001'`
    - `dukcapilMatch: true`
    - `anomalies: []`
  - `ocrFields`:
    - Synchronized with Ahmad Fauzi: NIK `3174012005850001`, nama `AHMAD FAUZI`, tempatLahir `JAKARTA`, tglLahir `20-05-1985`, alamat `JL. TEBET BARAT DALAM NO. 12 RT 005 RW 002`, kelDesa `TEBET BARAT`, kecamatan `TEBET`.
- **`tampered` & `screen_capture`:**
  - `slipGajiImageUrl: '/slip_gaji_normal.jfif'`
  - `kkImageUrl: '/kartu_keluarga_normal.jfif'`
  - Preserve specific tamper anomalies, OCR-B font mismatch, moiré screen capture flags, and test assertions.

### 2.2 ICR Demo Presets (`icrDemoPresets`)
- **`survey_clean` & `low_confidence`:**
  - Add `imageUrl: '/survey_form_cmo.jfif'`
  - Update `thumbnailUrl: '/survey_form_cmo.jfif'`
  - Preserve `applicantName: 'Budi Santoso'`, `documentNumber: 'SRV-FORM-2026-001'`, and field schemas for test compatibility.
- **`clean_shm` & `cadastral_mismatch`:**
  - Add `imageUrl: '/sertipikat_tanah_bpn.jfif'`
  - Update `thumbnailUrl: '/sertipikat_tanah_bpn.jfif'`
  - Retain BPN Sentuh Tanahku spatial verification coordinates and mismatch logic.

### 2.3 Voice Demo Presets (`voiceDemoPresets`)
- **`nominal`:**
  - Uses `case0941CleanVoiceVerification` (fluent, score 18, 0 hesitancy, 100% OJK compliance).
- **`hesitant_noncompliant`:**
  - `T-6`: NIK recitation updated to `3174012005850001` ("Tiga satu tujuh empat nol satu dua nol nol lima delapan lima nol nol nol satu").
  - `T-10`: Birth date hesitation updated to `20-05-1985` ("Eee... dua puluh Mei sembilan belas delapan puluh lima").
  - Preserve 3.4s hesitancy duration on mother maiden name `Nurhasanah` with `pitchTremor: true`.
  - Preserve total hesitancy count of 3, misstated installment of Rp 1.100.000, and 50% script compliance score (3 pass, 3 fail).
- **`coaching_suspicion`:**
  - `agentName` updated from `Ahmad Fauzi` to `Rahmat Hidayat` (`AGT-019`).
  - `T-1` dialogue updated: "Selamat sore, saya Rahmat dari Verifikasi BAF. Bisa berbicara dengan Saudara Hendra?".

---

## 3. Verification & Acceptance Criteria
1. All unit and integration tests pass cleanly with `bun test`.
2. New consistency tests verify alignment across demo presets, local assets, and case data.
3. No build errors on `bun run build`.
