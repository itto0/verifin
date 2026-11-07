# Demo Data Cross-Module Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synchronize `src/data/demoPresets.ts` OCR, ICR, and Voice demo presets with authentic local assets and CASE-0941 multi-pillar verification data.

**Architecture:** Update static preset definitions in `src/data/demoPresets.ts` to reference local authentic image assets (`/ktp_demo_normal.jfif`, `/slip_gaji_normal.jfif`, `/kartu_keluarga_normal.jfif`, `/survey_form_cmo.jfif`, `/sertipikat_tanah_bpn.jfif`), align applicant identities (Ahmad Fauzi) without breaking test fixtures, and create dedicated tests to prevent regression.

**Tech Stack:** TypeScript, React, Bun test runner.

## Global Constraints
- All 168+ existing tests must pass with 0 failures (`bun test`).
- Production build must succeed with 0 errors (`bun run build`).
- Do not remove or mutate properties required by existing tests: `ocrDemoPresets.clean.salarySlip?.companyName === 'PT Citra Nusantara Mandiri'`, `ocrDemoPresets.clean.score === 12`, `voiceDemoPresets.hesitant_noncompliant` hesitancy on 'Nurhasanah' (3.4s) & overall count (3).

---

### Task 1: Update OCR Demo Presets (`ocrDemoPresets`) in `src/data/demoPresets.ts`

**Files:**
- Modify: `src/data/demoPresets.ts:84-217`
- Test: `src/data/demoPresets.test.ts`

**Interfaces:**
- Consumes: `defaultSalarySlip` from `./salarySlipHelper`
- Produces: `ocrDemoPresets.clean`, `ocrDemoPresets.tampered`, `ocrDemoPresets.screen_capture` with authentic image URLs and aligned Ahmad Fauzi attributes on `clean`.

- [ ] **Step 1: Write test asserting clean preset alignment with Ahmad Fauzi and authentic local images**

Add to `src/data/demoPresets.test.ts`:
```ts
it('aligns clean OCR preset with Ahmad Fauzi and authentic local assets', () => {
  expect(ocrDemoPresets.clean.ktpImageUrl).toBe('/ktp_demo_normal.jfif');
  expect(ocrDemoPresets.clean.slipGajiImageUrl).toBe('/slip_gaji_normal.jfif');
  expect(ocrDemoPresets.clean.kkImageUrl).toBe('/kartu_keluarga_normal.jfif');
  expect(ocrDemoPresets.clean.ocrFields.nik.value).toBe('3174012005850001');
  expect(ocrDemoPresets.clean.ocrFields.nama.value).toBe('AHMAD FAUZI');
  expect(ocrDemoPresets.clean.salarySlip?.employeeName).toBe('AHMAD FAUZI');
  expect(ocrDemoPresets.clean.salarySlip?.slipImageUrl).toBe('/slip_gaji_normal.jfif');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/data/demoPresets.test.ts`
Expected: FAIL on `slipGajiImageUrl` or `ocrFields.nik.value`.

- [ ] **Step 3: Update `ocrDemoPresets` in `src/data/demoPresets.ts`**

Update `clean`, `tampered`, and `screen_capture` presets with authentic local URLs and Ahmad Fauzi details for `clean`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/data/demoPresets.test.ts`
Expected: PASS

---

### Task 2: Update ICR Demo Presets (`icrDemoPresets`) in `src/data/demoPresets.ts`

**Files:**
- Modify: `src/data/demoPresets.ts:228-486`
- Test: `src/data/demoPresets.test.ts`

**Interfaces:**
- Consumes: `IcrDocumentSample` from `./icrData`
- Produces: `icrDemoPresets.survey_clean`, `clean_shm`, `cadastral_mismatch`, `low_confidence` with `imageUrl` and authentic `thumbnailUrl`.

- [ ] **Step 1: Write test asserting ICR demo presets have physical scan imageUrl**

Add to `src/data/demoPresets.test.ts`:
```ts
it('provides physical scan imageUrl for all ICR demo presets', () => {
  expect(icrDemoPresets.survey_clean.imageUrl).toBe('/survey_form_cmo.jfif');
  expect(icrDemoPresets.clean_shm.imageUrl).toBe('/sertipikat_tanah_bpn.jfif');
  expect(icrDemoPresets.cadastral_mismatch.imageUrl).toBe('/sertipikat_tanah_bpn.jfif');
  expect(icrDemoPresets.low_confidence.imageUrl).toBe('/survey_form_cmo.jfif');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/data/demoPresets.test.ts`
Expected: FAIL on `icrDemoPresets.survey_clean.imageUrl`.

- [ ] **Step 3: Update `icrDemoPresets` with `imageUrl` and updated `thumbnailUrl`**

Add `imageUrl: '/survey_form_cmo.jfif'` and `thumbnailUrl: '/survey_form_cmo.jfif'` to `survey_clean` and `low_confidence`.
Add `imageUrl: '/sertipikat_tanah_bpn.jfif'` and `thumbnailUrl: '/sertipikat_tanah_bpn.jfif'` to `clean_shm` and `cadastral_mismatch`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/data/demoPresets.test.ts`
Expected: PASS

---

### Task 3: Update Voice Demo Presets (`voiceDemoPresets`) in `src/data/demoPresets.ts`

**Files:**
- Modify: `src/data/demoPresets.ts:494-573`
- Test: `src/components/detail/VoiceVerificationTab.test.ts` and `src/data/demoPresets.test.ts`

**Interfaces:**
- Consumes: `VoiceVerification` from `../types`
- Produces: `voiceDemoPresets.hesitant_noncompliant` and `coaching_suspicion` with consistent dialogues and non-colliding agent names.

- [ ] **Step 1: Write test asserting voice demo presets dialog consistency**

Add to `src/data/demoPresets.test.ts`:
```ts
it('ensures coaching_suspicion agent is distinct from applicant Ahmad Fauzi', () => {
  expect(voiceDemoPresets.coaching_suspicion.agentName).not.toBe('Ahmad Fauzi');
  expect(voiceDemoPresets.coaching_suspicion.agentId).toBe('AGT-019');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/data/demoPresets.test.ts`
Expected: FAIL because `voiceDemoPresets.coaching_suspicion.agentName` is currently `'Ahmad Fauzi'`.

- [ ] **Step 3: Update `voiceDemoPresets`**

In `hesitant_noncompliant`:
- Update T-6 text to recite Ahmad Fauzi's NIK `3174012005850001`: `'Tiga satu tujuh empat nol satu dua nol nol lima delapan lima nol nol nol satu.'`
- Update T-10 text to recite: `'Eee... dua puluh Mei sembilan belas delapan puluh lima.'`
In `coaching_suspicion`:
- Change `agentName` to `'Rahmat Hidayat'`
- Change T-1 to `'Selamat sore, saya Rahmat dari Verifikasi BAF. Bisa berbicara dengan Saudara Hendra?'`

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test src/components/detail/VoiceVerificationTab.test.ts src/data/demoPresets.test.ts`
Expected: PASS

---

### Task 4: Full Verification and Regression Testing

**Files:**
- Test: All tests in `tests/` and `src/`

- [ ] **Step 1: Run full test suite**

Run: `bun test`
Expected: All test files pass with 0 failures.

- [ ] **Step 2: Run production build**

Run: `bun run build`
Expected: Build passes with exit code 0.
