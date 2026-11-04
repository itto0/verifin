import { describe, expect, it } from 'bun:test';
import { ocrDemoPresets, validateDukcapilNik } from '../../../data/demoPresets';
import { createCustomEktpDocument, DEFAULT_BOUNDING_BOXES } from './CaseEktpPage';
import { isFullKtpDocument, resolveKtpPortraitUrl } from '../DetailedKtpCard';

describe('CaseEktpPage demo state logic', () => {
  it('correctly switches between OCR preset records', () => {
    let currentDoc = ocrDemoPresets.clean;
    expect(currentDoc.score).toBe(12);

    // Switch to tampered
    currentDoc = ocrDemoPresets.tampered;
    expect(currentDoc.score).toBe(88);
    expect(currentDoc.tamperFlags.length).toBeGreaterThan(0);

    // Switch to screen capture
    currentDoc = ocrDemoPresets.screen_capture;
    expect(currentDoc.isScreenCaptureDetected).toBe(true);
  });

  it('updates NIK validation anomalies dynamically when NIK is changed', () => {
    const maleDob = '14-08-1994';
    // Valid NIK for male on 14-08-1994 -> 3275011408940003
    const validCheck = validateDukcapilNik('3275011408940003', maleDob, 'Laki-laki');
    expect(validCheck.isValid).toBe(true);

    // Tampered NIK -> 3275012011900003
    const tamperedCheck = validateDukcapilNik('3275012011900003', maleDob, 'Laki-laki');
    expect(tamperedCheck.isValid).toBe(false);
    expect(tamperedCheck.anomalies.length).toBeGreaterThan(0);
  });

  it('creates custom e-KTP document verification with simulated OCR fields and NIK validation', () => {
    const customDoc = createCustomEktpDocument('data:image/jpeg;base64,mockdata', {
      customerName: 'BUDI SANTOSO',
    });
    expect(customDoc.ktpImageUrl).toBe('data:image/jpeg;base64,mockdata');
    expect(customDoc.ocrFields.nama.value).toBe('BUDI SANTOSO');
    expect(customDoc.nikValidation.isValidStructure).toBe(true);
    expect(customDoc.ocrFields.nik.value).toBe(customDoc.nikValidation.nik);
    expect(customDoc.ocrFields.nik.boundingBox).toBeDefined();
    expect(customDoc.score).toBeLessThan(30);
  });

  it('handles female NIK with +40 day offset in custom document generation', () => {
    // 14-08-1994 female -> Day + 40 = 54 -> NIK: 3275015408940002
    const femaleDoc = createCustomEktpDocument('data:image/jpeg;base64,femaledata', {
      customerName: 'SITI RAHMAWATI',
      nik: '3275015408940002',
      birthDate: '14-08-1994',
      gender: 'Perempuan',
    });

    expect(femaleDoc.nikValidation.isValidStructure).toBe(true);
    expect(femaleDoc.nikValidation.dukcapilMatch).toBe(true);
    expect(femaleDoc.tamperScore).toBeLessThan(30);
    expect(femaleDoc.ocrFields.jenisKelamin.value).toBe('PEREMPUAN');
  });

  it('flags anomalies and marks high risk when custom document has mismatched NIK', () => {
    // NIK indicates 20-11-1990 but document birthDate is 14-08-1994
    const tamperedDoc = createCustomEktpDocument('data:image/jpeg;base64,tampereddata', {
      customerName: 'ANDI PRASETYO',
      nik: '3275012011900001',
      birthDate: '14-08-1994',
      gender: 'Laki-laki',
    });

    expect(tamperedDoc.nikValidation.isValidStructure).toBe(false);
    expect(tamperedDoc.nikValidation.dukcapilMatch).toBe(false);
    expect(tamperedDoc.tamperScore).toBeGreaterThanOrEqual(60);
    expect(tamperedDoc.score).toBeGreaterThanOrEqual(65);
    expect(tamperedDoc.ocrFields.nik.isAnomaly).toBe(true);
    expect(tamperedDoc.ocrFields.nik.anomalyReason).toBeDefined();
    expect(tamperedDoc.tamperFlags.length).toBeGreaterThan(0);
  });

  it('provides bounding box coordinates for all standard e-KTP OCR fields', () => {
    const requiredKeys = [
      'nik',
      'nama',
      'tempatLahir',
      'tglLahir',
      'jenisKelamin',
      'alamat',
      'rtRw',
      'kelDesa',
      'kecamatan',
      'agama',
      'statusPerkawinan',
      'pekerjaan',
      'kewarganegaraan',
      'berlakuHingga',
    ];

    for (const key of requiredKeys) {
      expect(DEFAULT_BOUNDING_BOXES[key]).toBeDefined();
      expect(DEFAULT_BOUNDING_BOXES[key].x).toBeGreaterThan(0);
      expect(DEFAULT_BOUNDING_BOXES[key].y).toBeGreaterThan(0);
      expect(DEFAULT_BOUNDING_BOXES[key].w).toBeGreaterThan(0);
      expect(DEFAULT_BOUNDING_BOXES[key].h).toBeGreaterThan(0);
    }
  });

  it('identifies full KTP document scans versus portrait avatars', () => {
    expect(isFullKtpDocument('data:image/jpeg;base64,/9j/4AAQSkZJRg...')).toBe(true);
    expect(isFullKtpDocument('/ktp_demo_normal.jpg')).toBe(true);
    expect(isFullKtpDocument('/ktp_demo_tampered.jpg')).toBe(true);
    expect(isFullKtpDocument('https://example.com/uploads/ktp-scan.png')).toBe(true);
    expect(isFullKtpDocument('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d')).toBe(false);
    expect(isFullKtpDocument(undefined)).toBe(false);
  });

  it('prevents stuffing full KTP document scans into the 3x4 passport portrait slot', () => {
    const fullScanDoc = 'data:image/jpeg;base64,fullKtpImage';
    const fallbackPortrait = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80';
    
    // When a full document scan is uploaded, it must NOT be used as the 3x4 portrait photo
    expect(resolveKtpPortraitUrl(fullScanDoc)).toBe(fallbackPortrait);

    // When an actual portrait avatar URL is provided, it should be used
    const avatarUrl = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2';
    expect(resolveKtpPortraitUrl(avatarUrl)).toBe(avatarUrl);
  });

  it('uses full KTP document scans for preset demo records', () => {
    expect(isFullKtpDocument(ocrDemoPresets.clean.ktpImageUrl)).toBe(true);
    expect(isFullKtpDocument(ocrDemoPresets.tampered.ktpImageUrl)).toBe(true);
  });
});
