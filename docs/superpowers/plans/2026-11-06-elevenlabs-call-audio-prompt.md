# ElevenLabs Call Audio Conversation Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a production-ready ElevenLabs audio conversation prompt and multi-speaker dialogue asset matching CASE-0941 (Ahmad Fauzi) clean tele-verification, and wire it into VeriFin's voice presets.

**Architecture:** Define typed ElevenLabs prompt configuration and full dialogue script in `src/data/prompts/elevenlabsCallPrompts.ts`. Wire the clean voice dataset into `voiceDemoPresets.nominal` in `src/data/demoPresets.ts` so the VeriFin Tele-verification UI and automated tests seamlessly reflect this 100% compliant tele-survey call.

**Tech Stack:** TypeScript, Bun Test, React 18, ElevenLabs Multilingual v2 format.

## Global Constraints

- Must match CASE-0941 data verbatim: NIK `3174012005850001`, DOB `20 Mei 1985`, Mother `Nurhasanah`, Unit `Yamaha NMAX 155 Connected`, Tenor `35 bulan`, DP `Rp 5.500.000`, Installment `Rp 1.395.000`.
- Must fulfill all 6 OJK & BAF tele-verification compliance checklist items (`SC-1` to `SC-6`).
- Script compliance score must be 100, zero hesitancy count, voice risk score <= 25 (zona hijau).
- All numbers and vehicle identifiers must have phonetic Indonesian spelling guides for ElevenLabs TTS.

---

### Task 1: ElevenLabs Call Prompt Definition & Unit Tests

**Files:**
- Create: `src/data/prompts/elevenlabsCallPrompts.ts`
- Test: `src/data/prompts/elevenlabsCallPrompts.test.ts`

**Interfaces:**
- Produces:
  - `ELEVENLABS_CASE_0941_CLEAN_SCRIPT`: `string`
  - `ELEVENLABS_VOICE_CONFIG`: `{ modelId: string; agentVoice: { name: string; stability: number; similarity: number; style: number }; customerVoice: { name: string; stability: number; similarity: number; style: number } }`
  - `case0941CleanVoiceVerification`: `VoiceVerification`

- [ ] **Step 1: Write failing test for ElevenLabs call prompt asset**

Create `src/data/prompts/elevenlabsCallPrompts.test.ts`:

```typescript
import { describe, expect, it } from 'bun:test';
import {
  ELEVENLABS_CASE_0941_CLEAN_SCRIPT,
  ELEVENLABS_VOICE_CONFIG,
  case0941CleanVoiceVerification,
} from './elevenlabsCallPrompts';

describe('ElevenLabs Call Audio Prompt', () => {
  it('contains dialogue script with phonetic Indonesian spelling for NIK and installment', () => {
    expect(ELEVENLABS_CASE_0941_CLEAN_SCRIPT).toContain('Ahmad Fauzi');
    expect(ELEVENLABS_CASE_0941_CLEAN_SCRIPT).toContain('Tiga satu tujuh empat');
    expect(ELEVENLABS_CASE_0941_CLEAN_SCRIPT).toContain('Nurhasanah');
    expect(ELEVENLABS_CASE_0941_CLEAN_SCRIPT).toContain('Yamaha N-MAX seratus lima puluh lima');
    expect(ELEVENLABS_CASE_0941_CLEAN_SCRIPT).toContain('satu juta tiga ratus sembilan puluh lima ribu rupiah');
    expect(ELEVENLABS_CASE_0941_CLEAN_SCRIPT).toContain('Otoritas Jasa Keuangan');
  });

  it('provides voice casting configuration for Agent and Customer', () => {
    expect(ELEVENLABS_VOICE_CONFIG.modelId).toBe('eleven_multilingual_v2');
    expect(ELEVENLABS_VOICE_CONFIG.agentVoice.stability).toBeGreaterThanOrEqual(0.6);
    expect(ELEVENLABS_VOICE_CONFIG.customerVoice.stability).toBeGreaterThanOrEqual(0.5);
  });

  it('matches VeriFin VoiceVerification data structure with 100% compliance', () => {
    const voice = case0941CleanVoiceVerification;
    expect(voice.callId).toBe('CALL-20261027-0941-CLN');
    expect(voice.overallHesitancyCount).toBe(0);
    expect(voice.spellingAccuracyScore).toBe(100);
    expect(voice.scriptComplianceScore).toBe(100);
    expect(voice.score).toBeLessThanOrEqual(25);
    expect(voice.complianceChecklist.length).toBe(6);
    expect(voice.complianceChecklist.every((item) => item.isCompliant)).toBe(true);
    expect(voice.voiceFlags.length).toBe(0);
    expect(voice.transcripts.length).toBeGreaterThanOrEqual(14);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/data/prompts/elevenlabsCallPrompts.test.ts`  
Expected: FAIL with module `./elevenlabsCallPrompts` not found.

- [ ] **Step 3: Implement `src/data/prompts/elevenlabsCallPrompts.ts`**

Write `src/data/prompts/elevenlabsCallPrompts.ts`:

```typescript
import { VoiceVerification } from '../../types';

export const ELEVENLABS_VOICE_CONFIG = {
  modelId: 'eleven_multilingual_v2',
  agentVoice: {
    name: 'Fitri Handayani (Agent)',
    description: 'Female, professional, calm customer service tone, clear Indonesian articulation',
    recommendedPreset: 'Rachel / Sarah (Multilingual)',
    stability: 0.65,
    similarity: 0.75,
    style: 0.05,
  },
  customerVoice: {
    name: 'Ahmad Fauzi (Customer)',
    description: 'Male 35-40, everyday calm Indonesian accent, confident, no hesitation',
    recommendedPreset: 'Adam / George (Multilingual)',
    stability: 0.55,
    similarity: 0.75,
    style: 0.1,
  },
};

export const ELEVENLABS_CASE_0941_CLEAN_SCRIPT = `[Agent - Suara Wanita: Fitri]
Halo, selamat siang. Saya Fitri dari tim Verifikasi Pembiayaan BAF. Benar saya terhubung dengan Bapak Ahmad Fauzi?

[Customer - Suara Pria: Ahmad Fauzi]
Halo, selamat siang Mbak Fitri. Betul, saya sendiri, Ahmad Fauzi.

[Agent - Suara Wanita: Fitri]
Baik, terima kasih Bapak Ahmad Fauzi. Mohon izin meminta waktunya sebentar untuk melakukan verifikasi data singkat terkait pengajuan pembiayaan unit motor Yamaha melalui BAF ya, Pak.

[Customer - Suara Pria: Ahmad Fauzi]
Iya, silakan Mbak Fitri, tidak apa-apa.

[Agent - Suara Wanita: Fitri]
Baik Pak, untuk keperluan validasi identitas, bisa tolong dibantu sebutkan kembali enam belas digit Nomor Induk Kependudukan KTP Bapak?

[Customer - Suara Pria: Ahmad Fauzi]
Boleh, NIK saya: Tiga satu tujuh empat, nol satu dua nol, nol lima delapan lima, nol nol nol satu.

[Agent - Suara Wanita: Fitri]
Baik, data NIK cocok dan sesuai, Pak Ahmad. Selanjutnya, untuk pertanyaan keamanan sistem kami, mohon dibantu sebutkan nama gadis ibu kandung Bapak?

[Customer - Suara Pria: Ahmad Fauzi]
Nama ibu kandung saya Ibu Nurhasanah.

[Agent - Suara Wanita: Fitri]
Baik, Ibu Nurhasanah. Lalu untuk tanggal lahir Bapak sendiri tanggal berapa ya, Pak?

[Customer - Suara Pria: Ahmad Fauzi]
Tanggal dua puluh Mei, tahun seribu sembilan ratus delapan puluh lima.

[Agent - Suara Wanita: Fitri]
Cocok, terima kasih Pak. Selanjutnya mengenai detail pembiayaan. Pengajuan Bapak adalah satu unit Yamaha N-MAX seratus lima puluh lima Connected, dengan masa tenor tiga puluh lima bulan. Apakah sudah betul, Pak?

[Customer - Suara Pria: Ahmad Fauzi]
Iya betul Mbak, Yamaha N-MAX seratus lima puluh lima Connected, tenornya tiga puluh lima bulan.

[Agent - Suara Wanita: Fitri]
Baik. Untuk uang muka yang disepakati adalah lima juta lima ratus ribu rupiah, dengan nilai angsuran per bulan sebesar satu juta tiga ratus sembilan puluh lima ribu rupiah. Apakah Bapak menyetujui nominal angsuran tersebut?

[Customer - Suara Pria: Ahmad Fauzi]
Iya Mbak Fitri, saya setuju. Angsurannya satu juta tiga ratus sembilan puluh lima ribu rupiah per bulan. Sudah sesuai simulasi kemarin.

[Agent - Suara Wanita: Fitri]
Sempurna. Sebagai penutup, kami informasikan bahwa percakapan telepon ini direkam secara resmi sebagai bukti verifikasi yang sah sesuai regulasi Otoritas Jasa Keuangan dan kebijakan pembiayaan PT Bussan Auto Finance. Apakah Bapak Ahmad Fauzi menyetujui hal tersebut?

[Customer - Suara Pria: Ahmad Fauzi]
Baik Mbak, saya memahami dan menyetujui sepenuhnya.

[Agent - Suara Wanita: Fitri]
Terima kasih banyak atas waktu dan kerja sama Bapak Ahmad Fauzi. Proses verifikasi telah selesai dan data Bapak akan segera kami teruskan ke sistem. Selamat siang dan selamat beraktivitas kembali.

[Customer - Suara Pria: Ahmad Fauzi]
Sama-sama Mbak Fitri, selamat siang.`;

export const case0941CleanVoiceVerification: VoiceVerification = {
  callId: 'CALL-20261027-0941-CLN',
  callDuration: 150,
  agentName: 'Fitri Handayani',
  agentId: 'AGT-044',
  callTimestamp: '2026-10-27 14:18:10',
  audioDurationFormatted: '02:30',
  overallHesitancyCount: 0,
  spellingAccuracyScore: 100,
  scriptComplianceScore: 100,
  score: 18,
  voiceFlags: [],
  complianceChecklist: [
    {
      id: 'SC-1',
      category: 'Pembuka',
      requirement: 'Salam standar BAF & perkenalan diri verifikator',
      isCompliant: true,
      timestampRef: 4,
      note: 'Salam standar BAF dan perkenalan identitas verifikator lengkap',
    },
    {
      id: 'SC-2',
      category: 'Verifikasi',
      requirement: 'Konfirmasi nama lengkap & 16 digit NIK pemohon',
      isCompliant: true,
      timestampRef: 24,
      note: '16 digit NIK diverifikasi akurat tanpa kesalahan sebut',
    },
    {
      id: 'SC-3',
      category: 'Verifikasi',
      requirement: 'Verifikasi nama gadis ibu kandung nasabah',
      isCompliant: true,
      timestampRef: 42,
      note: 'Nama gadis ibu kandung dan tanggal lahir dijawab lancar (<1 detik respons)',
    },
    {
      id: 'SC-4',
      category: 'Pembiayaan',
      requirement: 'Konfirmasi unit Yamaha NMAX 155 & tenor 35 bulan',
      isCompliant: true,
      timestampRef: 68,
      note: 'Unit dan tenor terkonfirmasi sesuai pengajuan',
    },
    {
      id: 'SC-5',
      category: 'Pembiayaan',
      requirement: 'Konfirmasi besaran angsuran & tanggal jatuh tempo',
      isCompliant: true,
      timestampRef: 98,
      note: 'Nominal angsuran Rp 1.395.000 disetujui pemohon',
    },
    {
      id: 'SC-6',
      category: 'Penutup',
      requirement: 'Pernyataan klausul persetujuan & rekaman resmi OJK',
      isCompliant: true,
      timestampRef: 124,
      note: 'Klausul rekaman resmi OJK dibacakan dan disetujui pemohon',
    },
  ],
  transcripts: [
    {
      id: 'CLN-1',
      speaker: 'agent',
      startTime: 0,
      endTime: 6,
      text: 'Halo, selamat siang. Saya Fitri dari tim Verifikasi Pembiayaan BAF. Benar saya terhubung dengan Bapak Ahmad Fauzi?',
    },
    {
      id: 'CLN-2',
      speaker: 'customer',
      startTime: 7,
      endTime: 11,
      text: 'Halo, selamat siang Mbak Fitri. Betul, saya sendiri, Ahmad Fauzi.',
    },
    {
      id: 'CLN-3',
      speaker: 'agent',
      startTime: 12,
      endTime: 21,
      text: 'Baik, terima kasih Bapak Ahmad Fauzi. Mohon izin meminta waktunya sebentar untuk melakukan verifikasi data singkat terkait pengajuan pembiayaan unit motor Yamaha melalui BAF ya, Pak.',
    },
    {
      id: 'CLN-4',
      speaker: 'customer',
      startTime: 22,
      endTime: 25,
      text: 'Iya, silakan Mbak Fitri, tidak apa-apa.',
    },
    {
      id: 'CLN-5',
      speaker: 'agent',
      startTime: 26,
      endTime: 34,
      text: 'Baik Pak, untuk keperluan validasi identitas, bisa tolong dibantu sebutkan kembali enam belas digit Nomor Induk Kependudukan KTP Bapak?',
    },
    {
      id: 'CLN-6',
      speaker: 'customer',
      startTime: 35,
      endTime: 48,
      text: 'Boleh, NIK saya: Tiga satu tujuh empat, nol satu dua nol, nol lima delapan lima, nol nol nol satu.',
      spellingMatch: true,
    },
    {
      id: 'CLN-7',
      speaker: 'agent',
      startTime: 49,
      endTime: 56,
      text: 'Baik, data NIK cocok dan sesuai, Pak Ahmad. Selanjutnya, untuk pertanyaan keamanan sistem kami, mohon dibantu sebutkan nama gadis ibu kandung Bapak?',
    },
    {
      id: 'CLN-8',
      speaker: 'customer',
      startTime: 57,
      endTime: 62,
      text: 'Nama ibu kandung saya Ibu Nurhasanah.',
    },
    {
      id: 'CLN-9',
      speaker: 'agent',
      startTime: 63,
      endTime: 70,
      text: 'Baik, Ibu Nurhasanah. Lalu untuk tanggal lahir Bapak sendiri tanggal berapa ya, Pak?',
    },
    {
      id: 'CLN-10',
      speaker: 'customer',
      startTime: 71,
      endTime: 79,
      text: 'Tanggal dua puluh Mei, tahun seribu sembilan ratus delapan puluh lima.',
    },
    {
      id: 'CLN-11',
      speaker: 'agent',
      startTime: 80,
      endTime: 92,
      text: 'Cocok, terima kasih Pak. Selanjutnya mengenai detail pembiayaan. Pengajuan Bapak adalah satu unit Yamaha N-MAX seratus lima puluh lima Connected, dengan masa tenor tiga puluh lima bulan. Apakah sudah betul, Pak?',
    },
    {
      id: 'CLN-12',
      speaker: 'customer',
      startTime: 93,
      endTime: 101,
      text: 'Iya betul Mbak, Yamaha N-MAX seratus lima puluh lima Connected, tenornya tiga puluh lima bulan.',
    },
    {
      id: 'CLN-13',
      speaker: 'agent',
      startTime: 102,
      endTime: 115,
      text: 'Baik. Untuk uang muka yang disepakati adalah lima juta lima ratus ribu rupiah, dengan nilai angsuran per bulan sebesar satu juta tiga ratus sembilan puluh lima ribu rupiah. Apakah Bapak menyetujui nominal angsuran tersebut?',
    },
    {
      id: 'CLN-14',
      speaker: 'customer',
      startTime: 116,
      endTime: 126,
      text: 'Iya Mbak Fitri, saya setuju. Angsurannya satu juta tiga ratus sembilan puluh lima ribu rupiah per bulan. Sudah sesuai simulasi kemarin.',
    },
    {
      id: 'CLN-15',
      speaker: 'agent',
      startTime: 127,
      endTime: 141,
      text: 'Sempurna. Sebagai penutup, kami informasikan bahwa percakapan telepon ini direkam secara resmi sebagai bukti verifikasi yang sah sesuai regulasi Otoritas Jasa Keuangan dan kebijakan pembiayaan PT Bussan Auto Finance. Apakah Bapak Ahmad Fauzi menyetujui hal tersebut?',
    },
    {
      id: 'CLN-16',
      speaker: 'customer',
      startTime: 142,
      endTime: 147,
      text: 'Baik Mbak, saya memahami dan menyetujui sepenuhnya.',
    },
    {
      id: 'CLN-17',
      speaker: 'agent',
      startTime: 148,
      endTime: 156,
      text: 'Terima kasih banyak atas waktu dan kerja sama Bapak Ahmad Fauzi. Proses verifikasi telah selesai dan data Bapak akan segera kami teruskan ke sistem. Selamat siang dan selamat beraktivitas kembali.',
    },
    {
      id: 'CLN-18',
      speaker: 'customer',
      startTime: 157,
      endTime: 161,
      text: 'Sama-sama Mbak Fitri, selamat siang.',
    },
  ],
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/data/prompts/elevenlabsCallPrompts.test.ts`  
Expected: PASS (all 3 tests passing).

- [ ] **Step 5: Commit changes**

```bash
git add src/data/prompts/elevenlabsCallPrompts.ts src/data/prompts/elevenlabsCallPrompts.test.ts
git commit -m "feat(voice): add ElevenLabs call audio prompt and clean CASE-0941 dataset"
```

---

### Task 2: Connect `voiceDemoPresets` and Fix Preset Tests

**Files:**
- Modify: `src/data/demoPresets.ts`
- Test: `src/data/demoPresets.test.ts`

**Interfaces:**
- Consumes:
  - `case0941CleanVoiceVerification` from `src/data/prompts/elevenlabsCallPrompts`
  - `mockCases` from `src/data/mockData`
- Produces:
  - Populated `voiceDemoPresets`: `{ nominal: VoiceVerification; hesitant_noncompliant: VoiceVerification; coaching_suspicion: VoiceVerification }`

- [ ] **Step 1: Check existing test failure in `src/data/demoPresets.test.ts`**

Run: `bun test src/data/demoPresets.test.ts`  
Expected: Fails at `expect(voiceDemoPresets.nominal).toBeDefined()`.

- [ ] **Step 2: Update `voiceDemoPresets` in `src/data/demoPresets.ts`**

In `src/data/demoPresets.ts`:
Import `case0941CleanVoiceVerification` from `./prompts/elevenlabsCallPrompts`.
Import `mockCases` from `./mockData`.
Define:
```typescript
import { case0941CleanVoiceVerification } from './prompts/elevenlabsCallPrompts';

// ...

export const voiceDemoPresets: Record<string, VoiceVerification> = {
  nominal: case0941CleanVoiceVerification,
  hesitant_noncompliant: mockCases[0].voice,
  coaching_suspicion: mockCases[5].voice,
};
```

Also populate `ocrDemoPresets` and `icrDemoPresets` to resolve the existing demoPreset assertions:
```typescript
export const ocrDemoPresets: Record<string, DocumentVerification> = {
  clean: mockCases[1].documents[0],
  tampered: mockCases[5].documents[0],
  screen_capture: mockCases[4].documents[0],
};

export const casePresets = ocrDemoPresets;

export const icrDemoPresets: Record<string, IcrDocumentSample> = {
  survey_clean: mockCases[0].icrDocuments?.[0] as IcrDocumentSample,
  clean_shm: mockCases[1].icrDocuments?.[0] as IcrDocumentSample,
  cadastral_mismatch: mockCases[2].icrDocuments?.[0] as IcrDocumentSample,
  low_confidence: mockCases[4].icrDocuments?.[0] as IcrDocumentSample,
};
```

- [ ] **Step 3: Run `bun test src/data/demoPresets.test.ts` to verify it passes**

Run: `bun test src/data/demoPresets.test.ts`  
Expected: PASS (all tests passing).

- [ ] **Step 4: Commit changes**

```bash
git add src/data/demoPresets.ts
git commit -m "feat(presets): populate voiceDemoPresets with clean ElevenLabs verification preset"
```

---

### Task 3: Full Test Suite & Verification

**Files:**
- Test: All tests across project (`bun test`)
- Build: `bun run build`

- [ ] **Step 1: Run complete test suite**

Run: `bun test`  
Expected: All tests pass.

- [ ] **Step 2: Run production build check**

Run: `bun run build`  
Expected: Clean build with zero TypeScript or bundling errors.

- [ ] **Step 3: Commit all remaining changes**

```bash
git add docs/superpowers/plans/2026-11-06-elevenlabs-call-audio-prompt.md
git commit -m "docs: add implementation plan for ElevenLabs call audio prompt"
```
