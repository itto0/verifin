import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProcessingLabView } from './ProcessingLabView';
import {
  ProcessEnvelope,
  KTPProcessResult,
  ICRFormResult,
  VoiceQAResult,
  GeneralOcrResult,
  HealthCheckResponse,
} from '../../services/processingClient';

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

  it('renders health check bar and subtabs', () => {
    const html = renderToStaticMarkup(<ProcessingLabView />);
    expect(html).toContain('Python ML Processing Lab');
    expect(html).toContain('e-KTP OCR &amp; Dukcapil');
    expect(html).toContain('Survey Form ICR');
    expect(html).toContain('Voice Call QA');
    expect(html).toContain('General Document OCR');
    expect(html).toContain('Refresh Status');
  });

  it('renders initial healthy status when provided', () => {
    const mockHealth: HealthCheckResponse = {
      status: 'healthy',
      version: '0.1.0',
      device: 'cpu',
      ocr_model_version: 'easyocr-1.7.2',
      voice_model_version: 'faster-whisper-base-id',
    };
    const html = renderToStaticMarkup(<ProcessingLabView initialHealth={mockHealth} />);
    expect(html).toContain('Online');
    expect(html).toContain('easyocr-1.7.2');
    expect(html).toContain('faster-whisper-base-id');
    expect(html).toContain('cpu');
  });

  it('renders offline warning banner when health check reports service unavailable', () => {
    const html = renderToStaticMarkup(<ProcessingLabView initialHealthStatus="offline" />);
    expect(html).toContain('Python ML Service Offline');
    expect(html).toContain('uvicorn');
  });

  it('renders KTP subtab by default with demo sample loader button', () => {
    const html = renderToStaticMarkup(<ProcessingLabView initialTab="ktp" />);
    expect(html).toContain('Load Demo e-KTP');
    expect(html).toContain('ktp_demo_normal.jfif');
    expect(html).toContain('Run Processing');
  });

  it('switches to Voice Call QA tab and displays audio upload prompt', () => {
    const html = renderToStaticMarkup(<ProcessingLabView initialTab="voice" />);
    expect(html).toContain('Voice Call QA');
    expect(html).toContain('Upload or load an audio recording');
    expect(html).toContain('Load Demo Call Recording');
    expect(html).toContain('voice_0941.mp3');
  });

  it('switches to Survey Form ICR tab and displays ICR sample button', () => {
    const html = renderToStaticMarkup(<ProcessingLabView initialTab="icr" />);
    expect(html).toContain('Survey Form ICR');
    expect(html).toContain('Load Demo CMO Survey Form');
    expect(html).toContain('survey_form_cmo.jfif');
  });

  it('switches to General Document OCR tab and displays document sample button', () => {
    const html = renderToStaticMarkup(<ProcessingLabView initialTab="general" />);
    expect(html).toContain('General Document OCR');
    expect(html).toContain('Load Demo Salary Slip');
    expect(html).toContain('slip_gaji_normal.jfif');
  });

  it('renders e-KTP extraction result with 14 fields grid and Dukcapil validation card', () => {
    const mockEnvelope: ProcessEnvelope<KTPProcessResult> = {
      status: 'success',
      confidence: 96.8,
      findings: [
        {
          type: 'INFO_LOG',
          severity: 'low',
          description: 'Document borders auto-aligned successfully',
        },
      ],
      evidence_refs: [],
      model_version: 'easyocr-1.7.2',
      processed_at: '2026-11-10T12:00:00Z',
      data: {
        fields: {
          nik: '3174012005850001',
          nama: 'AHMAD FAUZI',
          tempat_lahir: 'JAKARTA',
          tgl_lahir: '20-05-1985',
          jenis_kelamin: 'LAKI-LAKI',
          alamat: 'JL. MERDEKA NO 12',
          rt_rw: '003/005',
          kel_desa: 'TEBET TIMUR',
          kecamatan: 'TEBET',
          agama: 'ISLAM',
          status_perkawinan: 'KAWIN',
          pekerjaan: 'KARYAWAN SWASTA',
          kewarganegaraan: 'WNI',
          berlaku_hingga: 'SEUMUR HIDUP',
          field_confidences: {
            nik: 0.99,
            nama: 0.98,
          },
        },
        validation: {
          is_valid: true,
          province_code: '31 - DKI JAKARTA',
          regency_code: '74 - JAKARTA SELATAN',
          district_code: '01 - TEBET',
          gender: 'LAKI-LAKI',
          birth_date_str: '20-05-1985',
          tamper_score: 0.02,
          findings: [],
        },
        image_quality: {
          blur_score: 184.5,
          is_blurred: false,
          width: 1200,
          height: 800,
          findings: [],
        },
      },
    };

    const html = renderToStaticMarkup(
      <ProcessingLabView
        initialTab="ktp"
        initialResult={mockEnvelope}
        initialExecutionDuration={340}
      />
    );

    // Envelope header
    expect(html).toContain('SUCCESS');
    expect(html).toContain('96.8%');
    expect(html).toContain('340 ms');
    expect(html).toContain('easyocr-1.7.2');

    // Findings
    expect(html).toContain('Document borders auto-aligned successfully');
    expect(html).toContain('low');

    // 14 fields
    expect(html).toContain('3174012005850001');
    expect(html).toContain('AHMAD FAUZI');
    expect(html).toContain('TEBET TIMUR');
    expect(html).toContain('SEUMUR HIDUP');

    // Dukcapil civil registry fallback
    expect(html).toContain('Dukcapil Civil Registry Validation');
    expect(html).toContain('31 - DKI JAKARTA');
    expect(html).toContain('74 - JAKARTA SELATAN');
    expect(html).toContain('0.02');
  });

  it('renders ICR form result with key-value table and needs_review chips', () => {
    const mockIcrEnvelope: ProcessEnvelope<ICRFormResult> = {
      status: 'partial',
      confidence: 84.5,
      findings: [
        {
          type: 'LOW_CONFIDENCE_FIELD',
          severity: 'medium',
          description: 'Surveyor signature confidence below threshold',
          field_ref: 'surveyor_name',
        },
      ],
      evidence_refs: [],
      model_version: 'trocr-base-handwritten',
      processed_at: '2026-11-10T12:00:00Z',
      data: {
        form_type: 'SURVEY_FORM_CMO',
        fields: {
          applicant_name: {
            label: 'Nama Pemohon',
            value: 'Budi Santoso',
            confidence: 0.96,
            bbox: [[10, 20], [200, 50]],
            needs_review: false,
          },
          monthly_income: {
            label: 'Pendapatan Bulanan',
            value: 'Rp 8.500.000',
            confidence: 0.62,
            bbox: [[10, 60], [200, 90]],
            needs_review: true,
          },
        },
        raw_text: 'Nama Pemohon: Budi Santoso\nPendapatan: Rp 8.500.000',
      },
    };

    const html = renderToStaticMarkup(
      <ProcessingLabView
        initialTab="icr"
        initialResult={mockIcrEnvelope}
      />
    );

    expect(html).toContain('PARTIAL');
    expect(html).toContain('84.5%');
    expect(html).toContain('Nama Pemohon');
    expect(html).toContain('Budi Santoso');
    expect(html).toContain('Needs Review');
    expect(html).toContain('Verified');
    expect(html).toContain('SURVEY_FORM_CMO');
  });

  it('renders Voice QA result with score gauge, OJK checklist, and speaker dialogue timeline', () => {
    const mockVoiceEnvelope: ProcessEnvelope<VoiceQAResult> = {
      status: 'success',
      confidence: 94.0,
      findings: [
        {
          type: 'SUSPICIOUS_PAUSE',
          severity: 'high',
          description: 'Customer hesitated for 2.8s when asked for date of birth',
          timestamp: 14.5,
        },
      ],
      evidence_refs: [],
      model_version: 'faster-whisper-base-id',
      processed_at: '2026-11-10T12:00:00Z',
      data: {
        transcription: {
          language: 'id',
          duration: 48.5,
          full_transcript: 'Selamat pagi Bapak Budi Santoso...',
          segments: [
            {
              id: 1,
              start: 0.0,
              end: 3.2,
              text: 'Selamat pagi dengan Bapak Budi Santoso?',
              speaker: 'agent',
              confidence: 0.98,
            },
            {
              id: 2,
              start: 3.8,
              end: 5.1,
              text: 'Iya benar saya sendiri.',
              speaker: 'customer',
              confidence: 0.95,
            },
          ],
        },
        qa_score: 92.5,
        script_adherence: [
          {
            stage: 'greeting',
            description: 'Salam pembuka standar BAF & konfirmasi nama',
            passed: true,
            matched_utterance: 'Selamat pagi dengan Bapak Budi Santoso?',
          },
          {
            stage: 'consent',
            description: 'Persetujuan verifikasi dan rekaman OJK',
            passed: true,
            matched_utterance: 'Iya setuju.',
          },
        ],
        hesitation_count: 1,
      },
    };

    const html = renderToStaticMarkup(
      <ProcessingLabView
        initialTab="voice"
        initialResult={mockVoiceEnvelope}
      />
    );

    expect(html).toContain('92.5');
    expect(html).toContain('OJK Compliant');
    expect(html).toContain('Salam pembuka standar BAF &amp; konfirmasi nama');
    expect(html).toContain('Selamat pagi dengan Bapak Budi Santoso?');
    expect(html).toContain('Iya benar saya sendiri.');
    expect(html).toContain('1 hesitation pause');
    expect(html).toContain('high');
  });

  it('renders General Document OCR result with lines, bounding boxes, and raw JSON copy accordion', () => {
    const mockDocEnvelope: ProcessEnvelope<GeneralOcrResult> = {
      status: 'success',
      confidence: 91.0,
      findings: [],
      evidence_refs: [],
      model_version: 'easyocr-1.7.2',
      processed_at: '2026-11-10T12:00:00Z',
      data: {
        lines: [
          {
            text: 'SLIP GAJI BULANAN',
            confidence: 0.97,
            bbox: [[50, 20], [300, 45]],
          },
          {
            text: 'TOTAL DITERIMA: RP 9.200.000',
            confidence: 0.91,
            bbox: [[50, 100], [350, 130]],
          },
        ],
        total_lines: 2,
        full_text: 'SLIP GAJI BULANAN\nTOTAL DITERIMA: RP 9.200.000',
        quality_score: 95.0,
      },
    };

    const html = renderToStaticMarkup(
      <ProcessingLabView
        initialTab="general"
        initialResult={mockDocEnvelope}
      />
    );

    expect(html).toContain('SLIP GAJI BULANAN');
    expect(html).toContain('TOTAL DITERIMA: RP 9.200.000');
    expect(html).toContain('Raw Response Envelope (JSON)');
    expect(html).toContain('Copy JSON');
  });
});
