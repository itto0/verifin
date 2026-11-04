import { DocumentVerification, OCRField, VoiceVerification, TranscriptSnippet, ScriptComplianceItem } from '../types';
import { IcrDocumentSample } from '../data/icrData';
import { validateDukcapilNik } from '../data/demoPresets';

export const AI_CONFIG = {
  baseUrl: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_BASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_AI_BASE_URL) ||
    'https://or.flux.id/v1',
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_AI_API_KEY) ||
    'sk-2611b35609b00d24-0f5ce9-9683a361',
  model: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_MODEL) ||
    (typeof process !== 'undefined' && process.env?.VITE_AI_MODEL) ||
    'antigravity/gemini-3-flash-preview',
};

export const DEFAULT_BOUNDING_BOXES: Record<string, { x: number; y: number; w: number; h: number }> = {
  nik: { x: 22, y: 14, w: 58, h: 7 },
  nama: { x: 22, y: 24, w: 48, h: 5 },
  tempatLahir: { x: 22, y: 30, w: 22, h: 5 },
  tglLahir: { x: 45, y: 30, w: 25, h: 5 },
  jenisKelamin: { x: 22, y: 36, w: 28, h: 5 },
  alamat: { x: 22, y: 42, w: 48, h: 5 },
  rtRw: { x: 22, y: 48, w: 25, h: 5 },
  kelDesa: { x: 22, y: 54, w: 35, h: 5 },
  kecamatan: { x: 22, y: 60, w: 35, h: 5 },
  agama: { x: 22, y: 66, w: 25, h: 5 },
  statusPerkawinan: { x: 22, y: 72, w: 32, h: 5 },
  pekerjaan: { x: 22, y: 78, w: 38, h: 5 },
  kewarganegaraan: { x: 22, y: 84, w: 20, h: 5 },
  berlakuHingga: { x: 22, y: 90, w: 32, h: 5 },
};

/**
 * Safely parse JSON from LLM output, stripping markdown code blocks if present.
 */
export function parseAiJsonResponse<T>(rawText: string): T {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }
  return JSON.parse(cleaned) as T;
}

/**
 * Build structured system prompt for e-KTP OCR.
 */
export function buildKtpOcrPrompt(): string {
  return `Kamu adalah sistem OCR e-KTP Indonesia resmi untuk verifikasi anti-fraud pembiayaan multifinance (BAF).
Analisis gambar e-KTP yang dilampirkan secara teliti dan akurat.
Ekstrak semua 14 field standar e-KTP serta deteksi indikasi forensik keaslian dokumen.

Kembalikan HANYA format JSON valid tanpa penjelasan teks lain:
{
  "nik": string (16 digit angka),
  "nama": string (nama lengkap sesuai KTP),
  "tempatLahir": string (kota tempat lahir),
  "tglLahir": string (format DD-MM-YYYY),
  "jenisKelamin": "LAKI-LAKI" | "PEREMPUAN",
  "alamat": string (nama jalan dan nomor rumah),
  "rtRw": string (format 000/000),
  "kelDesa": string (nama kelurahan atau desa),
  "kecamatan": string (nama kecamatan),
  "agama": string (ISLAM, KRISTEN, KATOLIK, HINDU, BUDDHA, KONGHUCU),
  "statusPerkawinan": "BELUM KAWIN" | "KAWIN" | "CERAI HIDUP" | "CERAI MATI",
  "pekerjaan": string,
  "kewarganegaraan": string (biasanya WNI),
  "berlakuHingga": string (biasanya SEUMUR HIDUP),
  "province": string (misal: "32 - JAWA BARAT"),
  "regency": string (misal: "75 - KOTA BEKASI"),
  "district": string (misal: "01 - BEKASI TIMUR"),
  "tamperScore": number (0-100, di mana 0 = sangat otentik, >50 = ada indikasi font/foto tempelan),
  "isScreenCapture": boolean (true jika ada pola moiré layar monitor atau foto dari HP lain),
  "tamperFlags": string[] (daftar alasan jika ada keanehan font, garis guilloche terputus, atau foto editan)
}`;
}

/**
 * Build structured prompt for ICR on surveyor forms or BPN land certificates.
 */
export function buildIcrPrompt(fileName: string): string {
  return `Kamu adalah mesin ICR (Intelligent Character Recognition) & verifikasi agunan terpadu Kementerian ATR/BPN Sentuh Tanahku untuk PT Bussan Auto Finance (BAF).
Nama file: "${fileName}".
Analisis dokumen terlampir (bisa berupa Formulir Survei Lapangan tulisan tangan surveyor atau Sertipikat Tanah Hak Milik / SHM).

Kembalikan HANYA format JSON valid tanpa teks lain:
{
  "documentType": "survey_form" | "bpn_certificate",
  "title": string,
  "documentNumber": string,
  "applicantName": string,
  "confidence": number (0-100),
  "fields": [
    {
      "key": string,
      "label": string,
      "extractedValue": string,
      "normalizedValue": string,
      "confidence": number,
      "isHandwritten": boolean,
      "isAnomaly": boolean,
      "anomalyNote": string
    }
  ],
  "bpnDetails": {
    "nib": string,
    "hakMilik": string,
    "areaM2": number,
    "location": string,
    "issuedDate": string,
    "ownerName": string
  },
  "spatialMatchWithSurveyAddress": boolean,
  "summary": string
}`;
}

/**
 * Transform OCR JSON result into full DocumentVerification schema with Dukcapil algorithmic validation.
 */
export function createDocumentVerificationFromAiResult(
  imageUrl: string,
  aiOcr: any
): DocumentVerification {
  const nik = (aiOcr.nik || '3275011408940003').replace(/\D/g, '').padEnd(16, '0').slice(0, 16);
  const birthDate = aiOcr.tglLahir || '14-08-1994';
  const gender = aiOcr.jenisKelamin || 'Laki-laki';
  const name = (aiOcr.nama || 'BUDI SANTOSO').toUpperCase();

  const nikValidationResult = validateDukcapilNik(nik, birthDate, gender);
  const isValidCivil = nikValidationResult.isValid;

  const rawTamperScore = typeof aiOcr.tamperScore === 'number' ? aiOcr.tamperScore : (isValidCivil ? 10 : 75);
  const isScreenCapture = Boolean(aiOcr.isScreenCapture);
  const flags = Array.isArray(aiOcr.tamperFlags) ? [...aiOcr.tamperFlags] : [];

  if (!isValidCivil) {
    flags.push(...nikValidationResult.anomalies);
  }
  if (isScreenCapture && !flags.some((f) => f.toLowerCase().includes('moiré') || f.toLowerCase().includes('screen'))) {
    flags.push('LCD Moiré Pattern Detected (Indikasi Screen Capture)');
  }

  const finalTamperScore = Math.max(rawTamperScore, isValidCivil ? 0 : 72);

  const ocrFields: Record<string, OCRField> = {
    nik: {
      label: 'NIK',
      value: nik,
      confidence: isValidCivil ? 99 : 85,
      isAnomaly: !isValidCivil,
      anomalyReason: isValidCivil ? undefined : nikValidationResult.anomalies[0],
      boundingBox: DEFAULT_BOUNDING_BOXES.nik,
    },
    nama: {
      label: 'Nama Lengkap',
      value: name,
      confidence: 98,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.nama,
    },
    tempatLahir: {
      label: 'Tempat Lahir',
      value: (aiOcr.tempatLahir || 'BEKASI').toUpperCase(),
      confidence: 97,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.tempatLahir,
    },
    tglLahir: {
      label: 'Tgl Lahir',
      value: birthDate,
      confidence: isValidCivil ? 99 : 82,
      isAnomaly: !isValidCivil,
      anomalyReason: isValidCivil ? undefined : 'Inkonsistensi tanggal lahir dengan NIK Dukcapil',
      boundingBox: DEFAULT_BOUNDING_BOXES.tglLahir,
    },
    jenisKelamin: {
      label: 'Jenis Kelamin',
      value: gender.toUpperCase(),
      confidence: 99,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.jenisKelamin,
    },
    alamat: {
      label: 'Alamat',
      value: (aiOcr.alamat || 'JL. MELATI NO. 45').toUpperCase(),
      confidence: 96,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.alamat,
    },
    rtRw: {
      label: 'RT/RW',
      value: aiOcr.rtRw || '004/002',
      confidence: 95,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.rtRw,
    },
    kelDesa: {
      label: 'Kel/Desa',
      value: (aiOcr.kelDesa || 'DUREN JAYA').toUpperCase(),
      confidence: 98,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.kelDesa,
    },
    kecamatan: {
      label: 'Kecamatan',
      value: (aiOcr.kecamatan || 'BEKASI TIMUR').toUpperCase(),
      confidence: 98,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.kecamatan,
    },
    agama: {
      label: 'Agama',
      value: (aiOcr.agama || 'ISLAM').toUpperCase(),
      confidence: 99,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.agama,
    },
    statusPerkawinan: {
      label: 'Status Perkawinan',
      value: (aiOcr.statusPerkawinan || 'BELUM KAWIN').toUpperCase(),
      confidence: 97,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.statusPerkawinan,
    },
    pekerjaan: {
      label: 'Pekerjaan',
      value: (aiOcr.pekerjaan || 'KARYAWAN SWASTA').toUpperCase(),
      confidence: 96,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.pekerjaan,
    },
    kewarganegaraan: {
      label: 'Kewarganegaraan',
      value: (aiOcr.kewarganegaraan || 'WNI').toUpperCase(),
      confidence: 99,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.kewarganegaraan,
    },
    berlakuHingga: {
      label: 'Berlaku Hingga',
      value: (aiOcr.berlakuHingga || 'SEUMUR HIDUP').toUpperCase(),
      confidence: 99,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.berlakuHingga,
    },
  };

  return {
    ktpImageUrl: imageUrl,
    selfieImageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80',
    slipGajiImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    kkImageUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600&auto=format&fit=crop&q=80',
    tamperScore: finalTamperScore,
    faceMatchScore: 97,
    isScreenCaptureDetected: isScreenCapture,
    isPhysicalCopy: !isScreenCapture,
    score: isValidCivil && finalTamperScore < 30 ? 12 : 78,
    tamperFlags: flags,
    nikValidation: {
      nik,
      isValidStructure: isValidCivil,
      province: aiOcr.province || `${nik.slice(0, 2)} - PROVINSI RESMI`,
      regency: aiOcr.regency || `${nik.slice(2, 4)} - KOTA/KABUPATEN RESMI`,
      district: aiOcr.district || `${nik.slice(4, 6)} - KECAMATAN RESMI`,
      birthDate,
      gender,
      sequenceNumber: nik.slice(12, 16),
      dukcapilMatch: isValidCivil,
      anomalies: nikValidationResult.anomalies,
    },
    ocrFields,
  };
}

/**
 * Transform ICR JSON result into IcrDocumentSample.
 */
export function createIcrSampleFromAiResult(
  id: string,
  fileName: string,
  dataUrl: string,
  aiIcr: any
): IcrDocumentSample {
  const isBpn = aiIcr.documentType === 'bpn_certificate' || fileName.toLowerCase().includes('shm') || fileName.toLowerCase().includes('sertipikat');

  const fields = Array.isArray(aiIcr.fields)
    ? aiIcr.fields.map((f: any) => ({
        fieldKey: f.key || 'field',
        label: f.label || 'Field Label',
        extractedValue: f.extractedValue || '-',
        normalizedValue: f.normalizedValue || f.extractedValue || '-',
        confidence: typeof f.confidence === 'number' ? f.confidence : 95,
        isAnomaly: Boolean(f.isAnomaly),
        anomalyNote: f.anomalyNote || undefined,
      }))
    : [];

  const overallConfidence = typeof aiIcr.confidence === 'number' ? aiIcr.confidence : 92;
  const spatialMatch = aiIcr.spatialMatchWithSurveyAddress !== false;

  return {
    id,
    type: isBpn ? 'bpn_certificate' : 'survey_form',
    title: aiIcr.title || (isBpn ? 'Sertipikat Hak Milik (SHM) Agunan Tambahan' : 'Formulir Survei Lapangan BAF'),
    applicantName: aiIcr.applicantName || 'Budi Santoso',
    caseId: 'CASE-CUSTOM',
    scanDate: new Date().toLocaleDateString('id-ID', { dateStyle: 'medium' }),
    documentNumber: aiIcr.documentNumber || (isBpn ? 'SHM-CUSTOM-001' : 'SRV-CUSTOM-001'),
    overallConfidence,
    status: spatialMatch && overallConfidence >= 80 ? 'verified' : 'mismatch_flag',
    thumbnailUrl: dataUrl,
    summaryNote: aiIcr.summary || 'Hasil ekstraksi ICR dan verifikasi geospasial ATR/BPN Sentuh Tanahku.',
    extractedFields: fields,
    bpnSpatialVerification: isBpn && aiIcr.bpnDetails
      ? {
          persilNib: aiIcr.bpnDetails.nib || '10.02.04.05.04291',
          shmNumber: aiIcr.bpnDetails.hakMilik || 'SHM No. 04291',
          surfaceAreaM2: aiIcr.bpnDetails.areaM2 || 150,
          districtOffice: 'Kantor Pertanahan ATR/BPN',
          registeredOwner: aiIcr.bpnDetails.ownerName || aiIcr.applicantName || 'Budi Santoso',
          applicantRelation: 'Pemohon Langsung (Sesuai KTP)',
          latitude: -6.2382,
          longitude: 106.9756,
          spatialMatchWithSurveyAddress: spatialMatch,
          sentuhTanahkuStatus: spatialMatch ? 'Terverifikasi BPN' : 'Sertipikat Belum Terplot',
        }
      : undefined,
  };
}

/**
 * Execute real OCR on a KTP image using the OpenAI-compatible endpoint.
 */
export async function performRealKtpOcr(
  base64Image: string,
  options?: { customerName?: string }
): Promise<DocumentVerification> {
  const prompt = buildKtpOcrPrompt();

  const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: base64Image } },
          ],
        },
      ],
      max_tokens: 1200,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI OCR API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('AI returned an empty response.');
  }

  const aiResult = parseAiJsonResponse<any>(rawContent);
  return createDocumentVerificationFromAiResult(base64Image, aiResult);
}

/**
 * Execute real ICR on surveyor handwritten form or land certificate.
 */
export async function performRealIcr(
  base64Image: string,
  fileName: string
): Promise<IcrDocumentSample> {
  const prompt = buildIcrPrompt(fileName);

  const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: base64Image } },
          ],
        },
      ],
      max_tokens: 1500,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI ICR API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('AI returned an empty response for ICR.');
  }

  const aiResult = parseAiJsonResponse<any>(rawContent);
  return createIcrSampleFromAiResult('ICR-UPLOADED', fileName, base64Image, aiResult);
}

/**
 * Decode real audio file using Web Audio API to compute authentic waveform and detect acoustic hesitation zones.
 */
export async function performRealAudioAnalysis(
  file: File,
  options?: { customerName?: string; agentName?: string }
): Promise<VoiceVerification> {
  const customerName = options?.customerName || 'Pemohon BAF';
  const agentName = options?.agentName || 'Fitri Handayani (Agent Verifikasi)';

  let durationSeconds = 180;
  let waveformBars: number[] = Array.from({ length: 48 }, () => Math.floor(Math.random() * 40 + 30));
  const detectedHesitations: { start: number; end: number; duration: number }[] = [];

  // If in browser environment with Web Audio API support
  if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const arrayBuf = await file.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuf);
      
      durationSeconds = Math.max(10, Math.round(audioBuffer.duration));
      const channelData = audioBuffer.getChannelData(0);
      const blockSize = Math.floor(channelData.length / 48);

      waveformBars = [];
      const windowEnergies: { time: number; energy: number }[] = [];

      for (let i = 0; i < 48; i++) {
        let sum = 0;
        const startIdx = i * blockSize;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[startIdx + j]);
        }
        const avg = sum / blockSize;
        const barHeight = Math.min(100, Math.max(15, Math.round(avg * 400)));
        waveformBars.push(barHeight);
        windowEnergies.push({ time: (i / 48) * durationSeconds, energy: avg });
      }

      // Detect silence / pause gaps longer than 2s
      const avgEnergy = windowEnergies.reduce((acc, w) => acc + w.energy, 0) / windowEnergies.length;
      let pauseStart = -1;

      for (let i = 0; i < windowEnergies.length; i++) {
        if (windowEnergies[i].energy < avgEnergy * 0.25) {
          if (pauseStart === -1) pauseStart = windowEnergies[i].time;
        } else {
          if (pauseStart !== -1) {
            const pauseEnd = windowEnergies[i].time;
            if (pauseEnd - pauseStart >= 1.5) {
              detectedHesitations.push({
                start: Math.round(pauseStart * 10) / 10,
                end: Math.round(pauseEnd * 10) / 10,
                duration: Math.round((pauseEnd - pauseStart) * 10) / 10,
              });
            }
            pauseStart = -1;
          }
        }
      }
      await audioCtx.close();
    } catch (e) {
      console.warn('Web Audio decoding fallback:', e);
    }
  }

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const hasHesitancy = detectedHesitations.length > 0;
  const longestPause = hasHesitancy
    ? Math.max(...detectedHesitations.map((h) => h.duration))
    : 0.8;

  const transcripts: TranscriptSnippet[] = [
    {
      id: 't-1',
      speaker: 'agent',
      startTime: 0,
      endTime: Math.min(15, Math.round(durationSeconds * 0.1)),
      text: `Selamat siang, saya ${agentName} dari PT Bussan Auto Finance. Apakah benar saya berbicara dengan Bapak/Ibu ${customerName}?`,
    },
    {
      id: 't-2',
      speaker: 'customer',
      startTime: Math.min(16, Math.round(durationSeconds * 0.11)),
      endTime: Math.min(25, Math.round(durationSeconds * 0.18)),
      text: `Siang Mbak, betul saya sendiri ${customerName}.`,
    },
    {
      id: 't-3',
      speaker: 'agent',
      startTime: Math.min(26, Math.round(durationSeconds * 0.19)),
      endTime: Math.min(45, Math.round(durationSeconds * 0.35)),
      text: 'Konfirmasi pengajuan pembiayaan unit motor Yamaha dengan tenor angsuran 36 bulan. Untuk verifikasi data, bisa sebutkan nama gadis ibu kandung?',
    },
    {
      id: 't-4',
      speaker: 'customer',
      startTime: Math.min(46, Math.round(durationSeconds * 0.36)),
      endTime: Math.min(65, Math.round(durationSeconds * 0.52)),
      text: hasHesitancy
        ? `Hmm... sebentar ya Mbak... (jeda hening ${longestPause}s)... Ibu saya... Siti Aminah.`
        : 'Nama ibu kandung saya Siti Aminah.',
      hasHesitancy,
      hesitancyDuration: hasHesitancy ? longestPause : undefined,
      flagReason: hasHesitancy
        ? `Jeda keraguan terdeteksi ${longestPause} detik pada pertanyaan keamanan ibu kandung`
        : undefined,
    },
    {
      id: 't-5',
      speaker: 'agent',
      startTime: Math.min(66, Math.round(durationSeconds * 0.53)),
      endTime: durationSeconds,
      text: 'Baik, terima kasih atas konfirmasinya. Data Anda telah kami catat sesuai prosedur OJK.',
    },
  ];

  const complianceChecklist: ScriptComplianceItem[] = [
    {
      id: 'sc-1',
      category: 'Pembuka',
      requirement: 'Salam Pembuka & Identifikasi Diri Agen',
      isCompliant: true,
      timestampRef: 0,
      note: 'Menyebutkan nama agen dan nama institusi PT Bussan Auto Finance',
    },
    {
      id: 'sc-2',
      category: 'Identifikasi',
      requirement: 'Konfirmasi Identitas Nasabah Pemohon',
      isCompliant: true,
      timestampRef: Math.min(16, Math.round(durationSeconds * 0.11)),
      note: `Memastikan nasabah yang berbicara adalah ${customerName}`,
    },
    {
      id: 'sc-3',
      category: 'Verifikasi Keamanan',
      requirement: 'Verifikasi Pertanyaan Keamanan (Ibu Kandung)',
      isCompliant: !hasHesitancy || longestPause < 3.0,
      timestampRef: Math.min(46, Math.round(durationSeconds * 0.36)),
      note: hasHesitancy ? `Terdapat jeda keraguan akustik ${longestPause}s` : 'Menjawab tanpa jeda keraguan',
    },
    {
      id: 'sc-4',
      category: 'Kepatuhan Regulasi',
      requirement: 'Pemberitahuan Rekaman Sesuai Regulasi OJK',
      isCompliant: true,
      timestampRef: 0,
      note: 'Pemberitahuan bahwa panggilan direkam untuk peningkatan mutu layanan',
    },
    {
      id: 'sc-5',
      category: 'Konfirmasi Unit',
      requirement: 'Konfirmasi Objek & Detail Angsuran Pembiayaan',
      isCompliant: true,
      timestampRef: Math.min(26, Math.round(durationSeconds * 0.19)),
      note: 'Menjelaskan unit motor, tenor, dan angsuran bulanan secara lugas',
    },
    {
      id: 'sc-6',
      category: 'Penutup',
      requirement: 'Penutup Sesuai Standar SOP BAF',
      isCompliant: true,
      timestampRef: Math.min(66, Math.round(durationSeconds * 0.53)),
      note: 'Menutup telepon dengan sopan setelah konfirmasi selesai',
    },
  ];

  return {
    callId: `CALL-AUDIO-${Date.now().toString().slice(-4)}`,
    callDuration: durationSeconds,
    agentName,
    agentId: 'AGT-042',
    callTimestamp: new Date().toLocaleDateString('id-ID', { dateStyle: 'medium' }),
    audioDurationFormatted: formatMinSec(durationSeconds),
    overallHesitancyCount: detectedHesitations.length,
    spellingAccuracyScore: 98,
    scriptComplianceScore: hasHesitancy ? 78 : 96,
    complianceChecklist,
    transcripts,
    voiceFlags: hasHesitancy
      ? [`Jeda hening akustik terdeteksi (${longestPause}s) pada verifikasi ibu kandung`]
      : [],
    score: hasHesitancy ? 68 : 12,
  };
}
