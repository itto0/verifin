# Frontend Processing Lab & Python ML Service Integration Design

## Overview
A dedicated test playground ("Processing Lab") embedded directly inside the VeriFin web portal (Vite + React + Tailwind CSS). It connects the frontend to the local Python processing service (`services/processing/`) via a typed API client and Vite dev proxy, allowing interactive testing of:
1. **e-KTP OCR & Dukcapil NIK Algorithmic Validation** (`POST /api/v1/ocr/ktp`)
2. **Survey Form Handwriting ICR** (`POST /api/v1/icr/survey-form`)
3. **Voice Speech-to-Text, Hesitation Detection & OJK Script QA** (`POST /api/v1/voice/analyze`)
4. **General Document OCR** (`POST /api/v1/ocr/document`)
5. **Service Health & Diagnostics** (`GET /health`)

---

## 1. Architecture & Networking

```
+-----------------------------------------------------------+
|                     VeriFin Frontend                      |
|                  (Vite + React @ :3000)                   |
|                                                           |
|  [Sidebar: Processing Lab]                                |
|         |                                                 |
|  [ProcessingLabView]                                      |
|         |                                                 |
|  [processingClient.ts]                                    |
|         |                                                 |
|  fetch('/api/v1/...')                                     |
+-----------------------------+-----------------------------+
                              | Vite Proxy (:3000/api/v1)
                              v
+-----------------------------------------------------------+
|                 Python Processing Backend                 |
|                   (FastAPI @ :8000)                       |
|                                                           |
|  - GET  /health                                           |
|  - POST /api/v1/ocr/ktp                                   |
|  - POST /api/v1/ocr/document                              |
|  - POST /api/v1/icr/survey-form                           |
|  - POST /api/v1/voice/analyze                             |
|  - POST /api/v1/voice/transcribe                          |
+-----------------------------------------------------------+
```

### 1.1 Vite Proxy Configuration (`vite.config.ts`)
Add `/api/v1` proxy definition alongside the existing `/api/ai` proxy:
```typescript
'/api/v1': {
  target: 'http://127.0.0.1:8000',
  changeOrigin: true,
  secure: false,
}
```

---

## 2. Typed Client Service (`src/services/processingClient.ts`)

### 2.1 Schema Interfaces Matching Backend Pydantic Envelopes

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
```

### 2.2 Client Methods
- `checkHealth(): Promise<HealthCheckResponse>`
- `processKtp(file: File | Blob): Promise<ProcessEnvelope<KTPProcessResult>>`
- `processDocument(file: File | Blob): Promise<ProcessEnvelope<GeneralOcrResult>>`
- `processSurveyForm(file: File | Blob): Promise<ProcessEnvelope<ICRFormResult>>`
- `analyzeVoice(file: File | Blob): Promise<ProcessEnvelope<VoiceQAResult>>`

---

## 3. UI Component & Interaction Design

### 3.1 Navigation & Shell Integration
- **`src/components/layout/Sidebar.tsx`**:
  - Extend `NavTab` union with `'lab'`.
  - Add navigation item with `FlaskConical` icon:
    ```typescript
    {
      id: 'lab' as NavTab,
      label: 'Processing Lab',
      icon: FlaskConical,
      desc: 'ML Service Playground & Test'
    }
    ```
- **`src/App.tsx`**:
  - Add tab rendering: `{currentTab === 'lab' && <ProcessingLabView />}`.
  - Set page header title: `currentTab === 'lab'` $\rightarrow$ `"Processing Lab — Python ML Service Testbed"`.

### 3.2 Processing Lab View (`src/components/lab/ProcessingLabView.tsx`)

#### Top Diagnostics Bar
- Live ping to `GET /health` on initial mount.
- Status indicator:
  - 🟢 **Online**: displays backend version, device (`cpu` / `cuda`), and OCR/Voice model versions.
  - 🔴 **Offline**: displays warning banner with troubleshooting command (`uv run uvicorn app.main:app --port 8000`).
- "Refresh Health" button.

#### Sub-Tabs
- `ktp`: **e-KTP OCR & Dukcapil**
- `icr`: **Survey Form ICR**
- `voice`: **Voice Call QA & Hesitancy**
- `general`: **General Document OCR**

#### Workspace Split-Screen (Two Columns)
- **Left Column: Input & Controls**:
  - Dropzone for local file selection (`image/*` or `audio/*`).
  - **"Load Demo Sample" button**:
    - e-KTP tab $\rightarrow$ loads `/ktp_demo_normal.jfif`.
    - ICR tab $\rightarrow$ loads `/survey_form_cmo.jfif`.
    - Voice tab $\rightarrow$ loads `/voice_0941.mp3`.
  - Live media preview:
    - Image preview with dimensions.
    - Audio player with play/pause controls.
  - **"Run Processing" button**:
    - Disables during processing, shows spinner and elapsed seconds counter.

- **Right Column: Analysis & Envelope Inspector**:
  - **Result Envelope Header**:
    - Status pill: `SUCCESS` (green), `PARTIAL` (amber), `FAILED` (red).
    - Confidence meter with progress bar (`0–100%`).
    - Model version and execution timestamp.
  - **Risk Findings Section**:
    - Color-coded badges for findings (`critical` red, `high` orange, `medium` yellow, `low` blue).
    - Type code and message (e.g. `BLURRED_IMAGE`, `NIK_GENDER_MISMATCH`, `HESITATION_LONG_PAUSE`).
  - **Domain-Specific Visualization**:
    - *e-KTP*:
      - Dukcapil Registry Status card: Province, Regency, District, Gender, DOB validity.
      - Tamper Score bar (0–100%).
      - Grid of all 14 extracted fields with individual field confidence chips.
    - *Survey Form ICR*:
      - Form fields table with label, extracted handwritten value, confidence, and `needs_review` badge.
    - *Voice QA*:
      - Overall QA Score gauge (`0–100%`).
      - 4-Stage OJK Script Adherence checklist (Greeting, Purpose/Recording Disclosure, Data Confirmation, Closing).
      - Speaker-attributed dialogue timeline (`agent` vs `customer`) highlighting pauses $\ge 1.5$s.
    - *General OCR*:
      - Table of detected text lines with confidence and bounding box coordinates.
  - **Collapsible Raw JSON Viewer**:
    - Accordion with syntax highlighting and a "Copy JSON" button.

---

## 4. Error Handling & Edge Cases
1. **Python Service Offline / Connection Refused**:
   - Show a friendly banner with exact setup instructions (`cd services/processing && uv run uvicorn app.main:app --port 8000`).
2. **File Size Violations**:
   - Prevent frontend submission if image $> 15$ MB or audio $> 50$ MB with an instant client alert.
3. **Invalid File Formats**:
   - Validate file types before upload (`.jpg`, `.jpeg`, `.png`, `.jfif` for images; `.mp3`, `.wav`, `.m4a` for voice).
4. **Partial or Tampered Results**:
   - Visual alerts highlighting why status is `partial` (e.g. blurred image or civil registry mismatch).

---

## 5. Testing & Verification Plan
1. **Unit Tests (`src/services/processingClient.test.ts`)**:
   - Test client methods with mocked `fetch` handling success envelopes, error statuses, and network failures.
2. **Component Tests / Build Validation**:
   - Run `bun test` to ensure existing 181 tests pass without regression.
   - Run `bun run build` / `vite build` to guarantee TypeScript types, imports, and bundling pass cleanly.
3. **End-to-End Verification**:
   - Verify health check connectivity.
   - Verify e-KTP, ICR, and Voice demo sample processing and visual envelope rendering.
