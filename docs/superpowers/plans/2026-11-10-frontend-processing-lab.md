# Frontend Processing Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a dedicated "Processing Lab" test page in the VeriFin React frontend connected to the local Python processing service via Vite proxy and a typed client, enabling live testing of e-KTP OCR, Survey Form ICR, Voice QA & Hesitancy, and General Document OCR with one-click demo samples and structured envelope inspection.

**Architecture:** 
- Vite dev server proxies `/api/v1` to `http://127.0.0.1:8000`.
- `processingClient.ts` encapsulates all HTTP calls, `FormData` transmission, and strict TypeScript types matching the backend's `ProcessEnvelope[T]` schemas.
- `ProcessingLabView.tsx` provides a two-column interactive playground with live `/health` ping, one-click demo sample loading, visual domain results (Dukcapil verification, handwriting review flags, voice dialogue timeline & OJK script checklist), and collapsible raw JSON inspection.
- Sidebar and App routing updated with `lab` tab and `FlaskConical` icon.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide React icons, Vite 6, Bun test runner.

## Global Constraints
- Do not break existing mock data or case workflows (`currentTab` states).
- All API client methods must handle backend connection failure gracefully with typed errors.
- Result envelopes must strictly conform to: `{ status, confidence, findings, evidence_refs, model_version, processed_at, data }`.
- Maximum upload size guards: 15MB for images, 50MB for audio files.
- All existing tests (`bun test`) must continue to pass (181 baseline tests).

---

### Task 1: Vite Proxy & Typed Processing Client Service

**Files:**
- Modify: `vite.config.ts:14-32`
- Create: `src/services/processingClient.ts`
- Test: `src/services/processingClient.test.ts`

**Interfaces:**
- Consumes: Backend endpoints `GET /health`, `POST /api/v1/ocr/ktp`, `POST /api/v1/ocr/document`, `POST /api/v1/icr/survey-form`, `POST /api/v1/voice/analyze`
- Produces:
  - Interfaces: `Finding`, `EvidenceRef`, `ProcessEnvelope<T>`, `HealthCheckResponse`, `KTPProcessResult`, `GeneralOcrResult`, `ICRFormResult`, `VoiceQAResult`
  - Functions: `checkProcessingHealth()`, `processKtpImage(file: File | Blob)`, `processDocumentImage(file: File | Blob)`, `processSurveyFormImage(file: File | Blob)`, `analyzeVoiceAudio(file: File | Blob)`

- [ ] **Step 1: Write the failing tests for processing client**

Create `src/services/processingClient.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  checkProcessingHealth,
  processKtpImage,
  processDocumentImage,
  processSurveyFormImage,
  analyzeVoiceAudio,
} from './processingClient';

describe('processingClient', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('checks processing health successfully', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            status: 'healthy',
            version: '0.1.0',
            device: 'cpu',
            ocr_model_version: 'easyocr-1.7.2',
            voice_model_version: 'faster-whisper-base-id',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
    ) as any;

    const res = await checkProcessingHealth();
    expect(res.status).toBe('healthy');
    expect(res.device).toBe('cpu');
    expect(res.ocr_model_version).toBe('easyocr-1.7.2');
  });

  it('processes KTP image and returns typed envelope', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            status: 'success',
            confidence: 96.5,
            findings: [],
            evidence_refs: [],
            model_version: 'easyocr-1.7.2',
            processed_at: '2026-11-10T00:00:00Z',
            data: {
              fields: {
                nik: '3174012005850001',
                nama: 'AHMAD FAUZI',
                field_confidences: { nik: 0.98, nama: 0.95 },
              },
              validation: {
                is_valid: true,
                province: 'DKI JAKARTA',
                regency: 'JAKARTA SELATAN',
                district: 'TEBET',
                tamper_score: 0.0,
                findings: [],
              },
              image_quality: {
                blur_score: 185.2,
                is_blurred: false,
                width: 1200,
                height: 800,
                findings: [],
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
    ) as any;

    const blob = new Blob(['fake-image'], { type: 'image/jpeg' });
    const result = await processKtpImage(blob);
    expect(result.status).toBe('success');
    expect(result.confidence).toBe(96.5);
    expect(result.data.fields.nik).toBe('3174012005850001');
    expect(result.data.validation.is_valid).toBe(true);
  });

  it('throws descriptive error on server HTTP 400', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ detail: 'Image file too large (max 15MB)' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    ) as any;

    const blob = new Blob(['too-large'], { type: 'image/jpeg' });
    expect(processKtpImage(blob)).rejects.toThrow('Image file too large (max 15MB)');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/services/processingClient.test.ts`
Expected: FAIL with module `./processingClient` not found.

- [ ] **Step 3: Update `vite.config.ts` with `/api/v1` proxy**

Edit `vite.config.ts` to add the proxy rule:
```typescript
        '/api/v1': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
```

- [ ] **Step 4: Implement `src/services/processingClient.ts`**

Write `src/services/processingClient.ts`:
```typescript
export interface Finding {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  field_ref?: string | null;
  timestamp?: number | null;
}

export interface EvidenceRef {
  id: string;
  type: string;
  uri?: string | null;
  bbox?: number[][] | null;
}

export interface ProcessEnvelope<T> {
  status: 'success' | 'partial' | 'failed';
  confidence: number;
  findings: Finding[];
  evidence_refs: EvidenceRef[];
  model_version: string;
  processed_at: string;
  data: T;
}

export interface HealthCheckResponse {
  status: string;
  version: string;
  device: string;
  ocr_model_version: string;
  voice_model_version: string;
}

export interface KTPFieldExtraction {
  nik?: string | null;
  nama?: string | null;
  tempat_lahir?: string | null;
  tgl_lahir?: string | null;
  jenis_kelamin?: string | null;
  alamat?: string | null;
  rt_rw?: string | null;
  kel_desa?: string | null;
  kecamatan?: string | null;
  agama?: string | null;
  status_perkawinan?: string | null;
  pekerjaan?: string | null;
  kewarganegaraan?: string | null;
  berlaku_hingga?: string | null;
  field_confidences: Record<string, number>;
}

export interface KTPValidationResult {
  is_valid: boolean;
  province?: string | null;
  regency?: string | null;
  district?: string | null;
  parsed_dob?: string | null;
  parsed_gender?: string | null;
  tamper_score: number;
  findings: Finding[];
}

export interface ImageQualityResult {
  blur_score: number;
  is_blurred: boolean;
  width: number;
  height: number;
  findings: Finding[];
}

export interface KTPProcessResult {
  fields: KTPFieldExtraction;
  validation: KTPValidationResult;
  image_quality: ImageQualityResult;
}

export interface OCRLineResult {
  text: string;
  confidence: number;
  bbox: number[][];
}

export interface GeneralOcrResult {
  lines: OCRLineResult[];
  full_text: string;
  image_quality: ImageQualityResult;
}

export interface ICRField {
  label: string;
  value: string;
  confidence: number;
  bbox: number[][];
  needs_review: boolean;
}

export interface ICRFormResult {
  form_type: string;
  fields: Record<string, ICRField>;
  raw_text: string;
}

export interface AudioSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker: 'agent' | 'customer' | 'unknown';
  confidence: number;
}

export interface ScriptCheckItem {
  stage: string;
  description: string;
  passed: boolean;
  matched_utterance?: string | null;
}

export interface VoiceQAResult {
  transcription: {
    language: string;
    duration: number;
    full_transcript: string;
    segments: AudioSegment[];
  };
  qa_score: number;
  script_adherence: ScriptCheckItem[];
  hesitation_count: number;
}

const API_BASE = '/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detailMsg = `HTTP ${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.detail) {
        detailMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(detailMsg);
  }
  return res.json() as Promise<T>;
}

export async function checkProcessingHealth(): Promise<HealthCheckResponse> {
  const res = await fetch('/health', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  return handleResponse<HealthCheckResponse>(res);
}

export async function processKtpImage(file: File | Blob): Promise<ProcessEnvelope<KTPProcessResult>> {
  const formData = new FormData();
  formData.append('file', file, file instanceof File ? file.name : 'ktp.jpg');
  const res = await fetch(`${API_BASE}/ocr/ktp`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessEnvelope<KTPProcessResult>>(res);
}

export async function processDocumentImage(file: File | Blob): Promise<ProcessEnvelope<GeneralOcrResult>> {
  const formData = new FormData();
  formData.append('file', file, file instanceof File ? file.name : 'document.jpg');
  const res = await fetch(`${API_BASE}/ocr/document`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessEnvelope<GeneralOcrResult>>(res);
}

export async function processSurveyFormImage(file: File | Blob): Promise<ProcessEnvelope<ICRFormResult>> {
  const formData = new FormData();
  formData.append('file', file, file instanceof File ? file.name : 'survey_form.jpg');
  const res = await fetch(`${API_BASE}/icr/survey-form`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessEnvelope<ICRFormResult>>(res);
}

export async function analyzeVoiceAudio(file: File | Blob): Promise<ProcessEnvelope<VoiceQAResult>> {
  const formData = new FormData();
  formData.append('file', file, file instanceof File ? file.name : 'call_audio.mp3');
  const res = await fetch(`${API_BASE}/voice/analyze`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessEnvelope<VoiceQAResult>>(res);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `bun test src/services/processingClient.test.ts`
Expected: PASS (3/3 passed).

- [ ] **Step 6: Commit**

```bash
git add vite.config.ts src/services/processingClient.ts src/services/processingClient.test.ts
git commit -m "feat(frontend): add vite proxy and typed processing service client"
```

---

### Task 2: Sidebar & App Navigation Integration

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/App.tsx`
- Test: `src/App.test.tsx` (or verify tab switching in existing App test suite)

**Interfaces:**
- Consumes: `NavTab` type
- Produces: Updated `NavTab` supporting `'lab'`, sidebar rendering "Processing Lab" with `FlaskConical` icon, and App switching to `'lab'`.

- [ ] **Step 1: Write failing test for sidebar navigation**

Create or update test asserting `lab` exists in navigation items:
```typescript
import { describe, it, expect } from 'bun:test';
import { NavTab } from './src/components/layout/Sidebar';

describe('Sidebar NavTab', () => {
  it('allows "lab" as a valid NavTab', () => {
    const tab: NavTab = 'lab';
    expect(tab).toBe('lab');
  });
});
```

- [ ] **Step 2: Update `src/components/layout/Sidebar.tsx`**

1. Import `FlaskConical` from `lucide-react`.
2. Update `NavTab` type:
```typescript
export type NavTab =
  | 'dashboard'
  | 'queue'
  | 'detail'
  | 'gis'
  | 'qa'
  | 'surveyor'
  | 'icr'
  | 'reports'
  | 'master'
  | 'settings'
  | 'lab';
```
3. Add to `navItems` array:
```typescript
    {
      id: 'lab' as NavTab,
      label: 'Processing Lab',
      icon: FlaskConical,
      desc: 'ML Service Playground & Test'
    },
```

- [ ] **Step 3: Update `src/App.tsx`**

1. Add title resolution for `lab`:
```typescript
      lab: 'Processing Lab — Python ML Service Testbed',
```
2. In the tab rendering section, import and render placeholder or view:
```typescript
      {currentTab === 'lab' && <ProcessingLabView />}
```

- [ ] **Step 4: Run existing test suite to verify no regressions**

Run: `bun test`
Expected: All 181+ tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/App.tsx
git commit -m "feat(frontend): add processing lab navigation tab in sidebar and app layout"
```

---

### Task 3: Interactive Processing Lab UI Component & End-to-End Verification

**Files:**
- Create: `src/components/lab/ProcessingLabView.tsx`
- Test: `src/components/lab/ProcessingLabView.test.tsx`

**Interfaces:**
- Consumes: `processingClient.ts` methods and types (`checkProcessingHealth`, `processKtpImage`, `processSurveyFormImage`, `analyzeVoiceAudio`, `processDocumentImage`).
- Produces: Complete interactive React component with:
  - Live `/health` service status badge and refresh button.
  - Sub-tab switcher: `ktp` | `icr` | `voice` | `general`.
  - Left panel: Drag-and-drop file upload, "Load Demo Sample" button (`/ktp_demo_normal.jfif`, `/survey_form_cmo.jfif`, `/voice_0941.mp3`), image thumbnail or audio player preview, "Run Processing" button with spinner.
  - Right panel:
    - Status pill (`SUCCESS`, `PARTIAL`, `FAILED`), confidence meter, execution duration.
    - Findings list with severity badges (`critical`, `high`, `medium`, `low`).
    - Domain cards:
      - e-KTP: 14 fields grid + Dukcapil validation card (Province, Regency, Gender, DOB validity, Tamper score).
      - ICR: Key-value fields table with handwriting confidence and `needs_review` chips.
      - Voice: QA score gauge, 4-stage OJK script checklist, speaker-attributed dialogue timeline with acoustic pauses highlighted.
      - General: Bounding boxes and extracted text lines.
    - Collapsible JSON accordion with "Copy JSON" button.

- [ ] **Step 1: Write test for ProcessingLabView component**

Create `src/components/lab/ProcessingLabView.test.tsx`:
```typescript
import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProcessingLabView } from './ProcessingLabView';

describe('ProcessingLabView', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = mock((url: string) => {
      if (url.includes('/health')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              status: 'healthy',
              version: '0.1.0',
              device: 'cpu',
              ocr_model_version: 'easyocr-1.7.2',
              voice_model_version: 'faster-whisper-base-id',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }
      return Promise.resolve(new Response('{}', { status: 200 }));
    }) as any;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renders health check bar and subtabs', async () => {
    render(<ProcessingLabView />);
    expect(screen.getByText(/Python ML Processing Lab/i)).toBeDefined();
    expect(screen.getByText(/e-KTP OCR & Dukcapil/i)).toBeDefined();
    expect(screen.getByText(/Survey Form ICR/i)).toBeDefined();
    expect(screen.getByText(/Voice Call QA/i)).toBeDefined();
    expect(screen.getByText(/General Document OCR/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText(/Online/i)).toBeDefined();
      expect(screen.getByText(/easyocr-1.7.2/i)).toBeDefined();
    });
  });

  it('switches between subtabs', () => {
    render(<ProcessingLabView />);
    const voiceTab = screen.getByText(/Voice Call QA/i);
    fireEvent.click(voiceTab);
    expect(screen.getByText(/Upload or load an audio recording/i)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/components/lab/ProcessingLabView.test.tsx`
Expected: FAIL with component not found.

- [ ] **Step 3: Implement `src/components/lab/ProcessingLabView.tsx`**

Build the full component with clean styling, responsive layout, sample loaders, and domain visualizers. Ensure:
- Graceful offline error banner if Python backend is not running.
- One-click demo sample loading via `fetch(sampleUrl).then(r => r.blob())`.
- Full rendering of all findings, confidence meters, and Dukcapil civil registry fields.
- Copyable JSON response inspector.

- [ ] **Step 4: Run component tests to verify they pass**

Run: `bun test src/components/lab/ProcessingLabView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run full frontend test suite and build**

Run: `bun test`
Expected: All tests pass (183+ tests).

Run: `bun run build`
Expected: Clean Vite production build with zero TypeScript or bundling errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/lab/ProcessingLabView.tsx src/components/lab/ProcessingLabView.test.tsx
git commit -m "feat(frontend): implement processing lab UI with sample loaders and envelope inspection"
```
