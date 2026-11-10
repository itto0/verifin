export interface Finding {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  field_ref?: string | null;
  timestamp?: number | null;
}

export interface EvidenceRef {
  ref_id?: string;
  label?: string;
  uri?: string | null;
  content_type?: string;
  id?: string;
  type?: string;
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
  models?: {
    ocr?: string;
    voice?: string;
  };
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
  province_code?: string | null;
  regency_code?: string | null;
  district_code?: string | null;
  gender?: string | null;
  parsed_gender?: string | null;
  birth_date_str?: string | null;
  parsed_dob?: string | null;
  sequence?: string | null;
  tamper_score: number;
  findings: Finding[];
}

export interface ImageQualityResult {
  blur_score: number;
  is_blurred: boolean;
  quality_score?: number;
  width?: number;
  height?: number;
  findings?: Finding[];
}

export interface KTPProcessResult {
  fields: KTPFieldExtraction;
  validation: KTPValidationResult;
  image_quality?: ImageQualityResult;
  quality_score?: number;
  is_blurred?: boolean;
}

export interface OCRLineResult {
  text: string;
  confidence: number;
  bbox: number[][];
}

export interface GeneralOcrResult {
  lines: OCRLineResult[];
  full_text: string;
  image_quality?: ImageQualityResult;
  total_lines?: number;
  quality_score?: number;
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
export const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB
export const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

function validateFileSize(file: File | Blob, maxSize: number, fileType: 'Image' | 'Audio'): void {
  if (file.size > maxSize) {
    const maxMb = Math.round(maxSize / (1024 * 1024));
    throw new Error(`${fileType} file too large (max ${maxMb}MB)`);
  }
}

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

async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err: any) {
    throw new Error(`Failed to connect to processing service (${url}): ${err?.message || 'Network error'}`);
  }
}

export async function checkProcessingHealth(): Promise<HealthCheckResponse> {
  const res = await safeFetch('/health', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const data = await handleResponse<any>(res);
  return {
    status: data.status ?? 'unknown',
    version: data.version ?? '',
    device: data.device ?? 'cpu',
    ocr_model_version: data.ocr_model_version ?? data.models?.ocr ?? '',
    voice_model_version: data.voice_model_version ?? data.models?.voice ?? '',
    models: data.models,
  };
}

export async function processKtpImage(file: File | Blob): Promise<ProcessEnvelope<KTPProcessResult>> {
  validateFileSize(file, MAX_IMAGE_SIZE, 'Image');
  const formData = new FormData();
  formData.append('file', file, file instanceof File ? file.name : 'ktp.jpg');
  const res = await safeFetch(`${API_BASE}/ocr/ktp`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessEnvelope<KTPProcessResult>>(res);
}

export async function processDocumentImage(file: File | Blob): Promise<ProcessEnvelope<GeneralOcrResult>> {
  validateFileSize(file, MAX_IMAGE_SIZE, 'Image');
  const formData = new FormData();
  formData.append('file', file, file instanceof File ? file.name : 'document.jpg');
  const res = await safeFetch(`${API_BASE}/ocr/document`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessEnvelope<GeneralOcrResult>>(res);
}

export async function processSurveyFormImage(file: File | Blob): Promise<ProcessEnvelope<ICRFormResult>> {
  validateFileSize(file, MAX_IMAGE_SIZE, 'Image');
  const formData = new FormData();
  formData.append('file', file, file instanceof File ? file.name : 'survey_form.jpg');
  const res = await safeFetch(`${API_BASE}/icr/survey-form`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessEnvelope<ICRFormResult>>(res);
}

export async function analyzeVoiceAudio(file: File | Blob): Promise<ProcessEnvelope<VoiceQAResult>> {
  validateFileSize(file, MAX_AUDIO_SIZE, 'Audio');
  const formData = new FormData();
  formData.append('file', file, file instanceof File ? file.name : 'call_audio.mp3');
  const res = await safeFetch(`${API_BASE}/voice/analyze`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ProcessEnvelope<VoiceQAResult>>(res);
}
