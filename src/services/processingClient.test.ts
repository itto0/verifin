import { describe, it, expect, afterEach, mock } from 'bun:test';
import {
  checkProcessingHealth,
  processKtpImage,
  processDocumentImage,
  processSurveyFormImage,
  analyzeVoiceAudio,
  processTableImage,
  MAX_IMAGE_SIZE,
  MAX_AUDIO_SIZE,
  ProcessEnvelope,
  TableExtractionResult,
} from './processingClient';

describe('processingClient', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('checks processing health successfully', async () => {
    globalThis.fetch = mock((url, init) => {
      expect(url).toBe('/health');
      expect(init?.method).toBe('GET');
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
    }) as any;

    const res = await checkProcessingHealth();
    expect(res.status).toBe('healthy');
    expect(res.device).toBe('cpu');
    expect(res.ocr_model_version).toBe('easyocr-1.7.2');
    expect(res.voice_model_version).toBe('faster-whisper-base-id');
  });

  it('checks processing health with nested models object successfully', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            status: 'healthy',
            version: '0.1.0',
            device: 'cpu',
            models: {
              ocr: 'easyocr-1.7.2',
              voice: 'faster-whisper-base-id',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
    ) as any;

    const res = await checkProcessingHealth();
    expect(res.status).toBe('healthy');
    expect(res.ocr_model_version).toBe('easyocr-1.7.2');
    expect(res.voice_model_version).toBe('faster-whisper-base-id');
  });

  it('processes KTP image and returns typed envelope', async () => {
    let capturedBody: any = null;
    let capturedUrl = '';

    globalThis.fetch = mock((url, init) => {
      capturedUrl = String(url);
      capturedBody = init?.body;
      return Promise.resolve(
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
      );
    }) as any;

    const blob = new Blob(['fake-image'], { type: 'image/jpeg' });
    const result = await processKtpImage(blob);

    expect(capturedUrl).toBe('/api/v1/ocr/ktp');
    expect(capturedBody instanceof FormData).toBe(true);
    expect(result.status).toBe('success');
    expect(result.confidence).toBe(96.5);
    expect(result.data.fields.nik).toBe('3174012005850001');
    expect(result.data.validation.is_valid).toBe(true);
  });

  it('processes general document image successfully', async () => {
    let capturedUrl = '';

    globalThis.fetch = mock((url) => {
      capturedUrl = String(url);
      return Promise.resolve(
        new Response(
          JSON.stringify({
            status: 'success',
            confidence: 91.2,
            findings: [],
            evidence_refs: [],
            model_version: 'easyocr-1.7.2',
            processed_at: '2026-11-10T00:00:00Z',
            data: {
              lines: [
                { text: 'SLIP GAJI', confidence: 0.95, bbox: [[0, 0], [10, 10]] },
              ],
              full_text: 'SLIP GAJI',
              image_quality: {
                blur_score: 150.0,
                is_blurred: false,
                width: 800,
                height: 600,
                findings: [],
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }) as any;

    const file = new File(['document-bytes'], 'slip.png', { type: 'image/png' });
    const result = await processDocumentImage(file);

    expect(capturedUrl).toBe('/api/v1/ocr/document');
    expect(result.status).toBe('success');
    expect(result.data.lines.length).toBe(1);
    expect(result.data.lines[0].text).toBe('SLIP GAJI');
  });

  it('processes survey form image with ICR successfully', async () => {
    let capturedUrl = '';

    globalThis.fetch = mock((url) => {
      capturedUrl = String(url);
      return Promise.resolve(
        new Response(
          JSON.stringify({
            status: 'success',
            confidence: 88.0,
            findings: [],
            evidence_refs: [],
            model_version: 'trocr-base-handwritten',
            processed_at: '2026-11-10T00:00:00Z',
            data: {
              form_type: 'survey_report',
              fields: {
                customer_name: {
                  label: 'Customer Name',
                  value: 'Budi Santoso',
                  confidence: 0.92,
                  bbox: [[10, 20], [100, 40]],
                  needs_review: false,
                },
              },
              raw_text: 'Customer Name: Budi Santoso',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }) as any;

    const blob = new Blob(['survey-form-content'], { type: 'image/jpeg' });
    const result = await processSurveyFormImage(blob);

    expect(capturedUrl).toBe('/api/v1/icr/survey-form');
    expect(result.status).toBe('success');
    expect(result.data.form_type).toBe('survey_report');
    expect(result.data.fields.customer_name.value).toBe('Budi Santoso');
  });

  it('analyzes voice audio and returns QA result', async () => {
    let capturedUrl = '';

    globalThis.fetch = mock((url) => {
      capturedUrl = String(url);
      return Promise.resolve(
        new Response(
          JSON.stringify({
            status: 'success',
            confidence: 94.0,
            findings: [],
            evidence_refs: [],
            model_version: 'faster-whisper-base-id',
            processed_at: '2026-11-10T00:00:00Z',
            data: {
              transcription: {
                language: 'id',
                duration: 45.2,
                full_transcript: 'Selamat pagi bapak...',
                segments: [
                  {
                    id: 1,
                    start: 0.0,
                    end: 3.5,
                    text: 'Selamat pagi bapak',
                    speaker: 'agent',
                    confidence: 0.95,
                  },
                ],
              },
              qa_score: 95.0,
              script_adherence: [
                {
                  stage: 'greeting',
                  description: 'Salam pembuka standar',
                  passed: true,
                  matched_utterance: 'Selamat pagi bapak',
                },
              ],
              hesitation_count: 1,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }) as any;

    const file = new File(['audio-bytes'], 'recording.mp3', { type: 'audio/mp3' });
    const result = await analyzeVoiceAudio(file);

    expect(capturedUrl).toBe('/api/v1/voice/analyze');
    expect(result.status).toBe('success');
    expect(result.data.qa_score).toBe(95.0);
    expect(result.data.transcription.segments.length).toBe(1);
    expect(result.data.script_adherence[0].passed).toBe(true);
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

  it('handles structured detail error responses gracefully', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ detail: [{ msg: 'Invalid file format' }] }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    ) as any;

    const blob = new Blob(['corrupt'], { type: 'image/jpeg' });
    expect(processDocumentImage(blob)).rejects.toThrow('[{"msg":"Invalid file format"}]');
  });

  it('falls back to HTTP status text when error body is not JSON', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response('Internal Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
        })
      )
    ) as any;

    const blob = new Blob(['sample'], { type: 'image/jpeg' });
    expect(processKtpImage(blob)).rejects.toThrow('HTTP 500 Internal Server Error');
  });

  it('enforces client-side max upload size guard for images (>15MB)', async () => {
    const hugeBlob = {
      size: MAX_IMAGE_SIZE + 1,
      type: 'image/jpeg',
    } as unknown as Blob;

    expect(processKtpImage(hugeBlob)).rejects.toThrow('Image file too large (max 15MB)');
    expect(processDocumentImage(hugeBlob)).rejects.toThrow('Image file too large (max 15MB)');
    expect(processSurveyFormImage(hugeBlob)).rejects.toThrow('Image file too large (max 15MB)');
  });

  it('enforces client-side max upload size guard for audio (>50MB)', async () => {
    const hugeAudio = {
      size: MAX_AUDIO_SIZE + 1,
      type: 'audio/mp3',
    } as unknown as Blob;

    expect(analyzeVoiceAudio(hugeAudio)).rejects.toThrow('Audio file too large (max 50MB)');
  });

  it('handles backend network connection failure gracefully', async () => {
    globalThis.fetch = mock(() => Promise.reject(new Error('Connection refused'))) as any;

    expect(checkProcessingHealth()).rejects.toThrow(
      'Failed to connect to processing service (/health): Connection refused'
    );
  });

  it('processTableImage calls /api/v1/ocr/table with borderless parameter', async () => {
    const dummyTableResponse: ProcessEnvelope<TableExtractionResult> = {
      status: 'success',
      confidence: 85.0,
      findings: [],
      evidence_refs: [],
      model_version: 'easyocr-1.7.2',
      processed_at: new Date().toISOString(),
      data: {
        tables_found: 1,
        tables: [
          {
            table_idx: 0,
            headers: ['Item', 'Biaya'],
            rows: [['Admin', '5000'], ['Total', '100000']],
            cells: [],
            num_rows: 2,
            num_cols: 2,
          },
        ],
        raw_text: 'Item\tBiaya\nAdmin\t5000\nTotal\t100000',
      },
    };

    const mockFetch = mock();
    globalThis.fetch = mockFetch as any;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => dummyTableResponse,
    });

    const file = new File(['dummy content'], 'slip.png', { type: 'image/png' });
    const result = await processTableImage(file, true);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/v1/ocr/table?borderless=true');
    expect(init.method).toBe('POST');
    expect(result.data.tables_found).toBe(1);
    expect(result.data.tables[0].headers).toEqual(['Item', 'Biaya']);
  });

  it('processTableImage calls /api/v1/ocr/table with default borderless=true', async () => {
    const mockFetch = mock();
    globalThis.fetch = mockFetch as any;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        confidence: 85.0,
        findings: [],
        evidence_refs: [],
        model_version: 'easyocr-1.7.2',
        processed_at: new Date().toISOString(),
        data: { tables_found: 0, tables: [], raw_text: '' },
      }),
    });

    const file = new File(['dummy'], 'table.png', { type: 'image/png' });
    await processTableImage(file);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/v1/ocr/table?borderless=true');
  });

  it('enforces client-side max upload size guard for table images (>15MB)', async () => {
    const hugeBlob = {
      size: MAX_IMAGE_SIZE + 1,
      type: 'image/jpeg',
    } as unknown as Blob;

    expect(processTableImage(hugeBlob as File)).rejects.toThrow('Image file too large (max 15MB)');
  });
});
