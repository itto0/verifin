import { describe, expect, it } from 'bun:test';
import {
  parseAiJsonResponse,
  buildKtpOcrPrompt,
  buildIcrPrompt,
  buildAudioSttPrompt,
  createDocumentVerificationFromAiResult,
  createIcrSampleFromAiResult,
  createVoiceVerificationFromAiResult,
} from './aiService';

describe('aiService - Response Parsing and Payload Builders', () => {
  it('parses raw markdown-wrapped JSON response from AI', () => {
    const rawMarkdown = '```json\n{"nik": "3174092408850003", "nama": "BUDI SANTOSO"}\n```';
    const parsed = parseAiJsonResponse<{ nik: string; nama: string }>(rawMarkdown);
    expect(parsed.nik).toBe('3174092408850003');
    expect(parsed.nama).toBe('BUDI SANTOSO');
  });

  it('parses clean unadorned JSON response', () => {
    const cleanJson = '{"documentType": "bpn_certificate", "confidence": 95}';
    const parsed = parseAiJsonResponse<{ documentType: string; confidence: number }>(cleanJson);
    expect(parsed.documentType).toBe('bpn_certificate');
    expect(parsed.confidence).toBe(95);
  });

  it('builds prompt for e-KTP OCR containing all 14 official fields', () => {
    const prompt = buildKtpOcrPrompt();
    expect(prompt).toContain('nik');
    expect(prompt).toContain('nama');
    expect(prompt).toContain('tempatLahir');
    expect(prompt).toContain('tglLahir');
    expect(prompt).toContain('jenisKelamin');
    expect(prompt).toContain('alamat');
    expect(prompt).toContain('rtRw');
  });

  it('builds prompt for ICR containing ATR/BPN and surveyor form schemas', () => {
    const prompt = buildIcrPrompt('sertipikat_tanah.jpg');
    expect(prompt).toContain('bpn_certificate');
    expect(prompt).toContain('survey_form');
    expect(prompt).toContain('isHandwritten');
  });

  it('transforms AI OCR result into DocumentVerification with civil Dukcapil validation', () => {
    const aiOcr = {
      nik: '3275011408940003',
      nama: 'RIAN HENDRAWAN',
      tempatLahir: 'BEKASI',
      tglLahir: '14-08-1994',
      jenisKelamin: 'LAKI-LAKI',
      alamat: 'JL. MELATI NO. 45 RT 004 RW 002',
      rtRw: '004/002',
      kelDesa: 'DUREN JAYA',
      kecamatan: 'BEKASI TIMUR',
      agama: 'ISLAM',
      statusPerkawinan: 'BELUM KAWIN',
      pekerjaan: 'KARYAWAN SWASTA',
      kewarganegaraan: 'WNI',
      berlakuHingga: 'SEUMUR HIDUP',
      tamperScore: 8,
      isScreenCapture: false,
    };

    const doc = createDocumentVerificationFromAiResult(
      'data:image/jpeg;base64,testktp',
      aiOcr
    );

    expect(doc.ocrFields.nik.value).toBe('3275011408940003');
    expect(doc.ocrFields.nama.value).toBe('RIAN HENDRAWAN');
    expect(doc.nikValidation.isValidStructure).toBe(true);
    expect(doc.tamperScore).toBe(8);
  });

  it('detects civil demographic discrepancy in AI OCR result (female date offset)', () => {
    // NIK has day 54 (female 14th) but gender is male -> mismatch
    const aiOcr = {
      nik: '3275015408940002',
      nama: 'BUDI SANTOSO',
      tempatLahir: 'BEKASI',
      tglLahir: '14-08-1994',
      jenisKelamin: 'LAKI-LAKI',
      alamat: 'JL. MELATI NO. 45',
      rtRw: '004/002',
      kelDesa: 'DUREN JAYA',
      kecamatan: 'BEKASI TIMUR',
      agama: 'ISLAM',
      statusPerkawinan: 'BELUM KAWIN',
      pekerjaan: 'KARYAWAN SWASTA',
      kewarganegaraan: 'WNI',
      berlakuHingga: 'SEUMUR HIDUP',
      tamperScore: 78,
    };

    const doc = createDocumentVerificationFromAiResult(
      'data:image/jpeg;base64,tamperedktp',
      aiOcr
    );

    expect(doc.nikValidation.isValidStructure).toBe(false);
    expect(doc.nikValidation.anomalies.length).toBeGreaterThan(0);
    expect(doc.score).toBeGreaterThanOrEqual(70);
  });

  it('transforms AI ICR result into IcrDocumentSample with cadastral verification', () => {
    const aiIcr = {
      documentType: 'bpn_certificate' as const,
      documentNumber: 'SHM-04291-BKS',
      confidence: 96,
      fields: [
        {
          key: 'nomor_hak',
          label: 'Nomor Hak Milik (SHM)',
          extractedValue: 'SHM No. 04291 / Duren Jaya',
          confidence: 98,
          isHandwritten: false,
        },
        {
          key: 'nama_pemegang_hak',
          label: 'Nama Pemegang Hak',
          extractedValue: 'Rian Hendrawan',
          confidence: 97,
          isHandwritten: false,
        },
      ],
      bpnDetails: {
        nib: '10.02.04.05.04291',
        hakMilik: 'SHM No. 04291',
        areaM2: 145,
        location: 'Kel. Duren Jaya, Kec. Bekasi Timur',
        issuedDate: '12-05-2017',
        ownerName: 'Rian Hendrawan',
      },
      spatialMatchWithSurveyAddress: true,
      summary: 'Sertipikat Hak Milik atas nama Rian Hendrawan valid dan terverifikasi di ATR/BPN.',
    };

    const sample = createIcrSampleFromAiResult('custom-shm', 'sertipikat.jpg', 'data:image/jpeg;base64,shm', aiIcr);

    expect(sample.type).toBe('bpn_certificate');
    expect(sample.bpnSpatialVerification?.persilNib).toBe('10.02.04.05.04291');
    expect(sample.bpnSpatialVerification?.spatialMatchWithSurveyAddress).toBe(true);
    expect(sample.extractedFields.length).toBe(2);
  });

  it('builds prompt for audio Speech-to-Text (STT) and OJK QA compliance', () => {
    const prompt = buildAudioSttPrompt('Ahmad Fauzi');
    expect(prompt).toContain('STT');
    expect(prompt).toContain('Ahmad Fauzi');
    expect(prompt).toContain('diarization');
    expect(prompt).toContain('transcripts');
  });

  it('transforms AI STT result into VoiceVerification with real transcribed dialogue and timestamps', () => {
    const aiStt = {
      durationSeconds: 45,
      hesitancyDetected: true,
      scriptComplianceScore: 82,
      transcripts: [
        {
          speaker: 'agent',
          startTime: 0,
          endTime: 8,
          text: 'Halo selamat siang dengan Bapak Ahmad Fauzi?',
          hasHesitancy: false,
        },
        {
          speaker: 'customer',
          startTime: 9,
          endTime: 22,
          text: 'Halo... iya betul saya sendiri, ini dari mana ya?',
          hasHesitancy: true,
          hesitancyDuration: 2.1,
          flagReason: 'Jeda hening 2.1 detik di awal respon',
        },
      ],
      voiceFlags: ['Jeda hening akustik 2.1s pada konfirmasi nama'],
      complianceChecklist: [
        {
          item: 'Salam Pembuka & Verifikasi Identitas',
          isCompliant: true,
          timestampRef: 0,
          description: 'Penyebutan nama nasabah dan salam pembuka',
        },
      ],
    };

    const voice = createVoiceVerificationFromAiResult(
      'rekaman_telepon.mp3',
      { customerName: 'Ahmad Fauzi', agentName: 'Siti' },
      aiStt,
      [20, 40, 60],
      45
    );

    expect(voice.callDuration).toBe(45);
    expect(voice.recordingUrl).toBe('rekaman_telepon.mp3');
    expect(voice.transcripts.length).toBe(2);
    expect(voice.transcripts[0].text).toBe('Halo selamat siang dengan Bapak Ahmad Fauzi?');
    expect(voice.transcripts[1].text).toContain('Halo... iya betul saya sendiri');
    expect(voice.transcripts[1].hasHesitancy).toBe(true);
    expect(voice.transcripts[1].hesitancyDuration).toBe(2.1);
    expect(voice.hesitancyDetected).toBe(true);
    expect(voice.scriptComplianceScore).toBe(82);
    expect(voice.waveform).toEqual([20, 40, 60]);
  });
});
