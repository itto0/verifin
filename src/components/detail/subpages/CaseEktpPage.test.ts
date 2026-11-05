import { describe, expect, it } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ocrDemoPresets, validateDukcapilNik } from '../../../data/demoPresets';
import {
  createCustomEktpDocument,
  DEFAULT_BOUNDING_BOXES,
  CaseEktpPage,
  resolveActiveSalarySlip,
} from './CaseEktpPage';
import { isFullKtpDocument, resolveKtpPortraitUrl } from '../DetailedKtpCard';
import { mockCases } from '../../../data/mockData';
import { defaultSalarySlip } from '../../../data/salarySlipHelper';
import { FinancingCase } from '../../../types';

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

describe('CaseEktpPage Salary Slip Dual-View Integration', () => {
  const baseCase: FinancingCase = mockCases[0];

  it('computes activeSalarySlip with DSR calculation from caseData and falls back to defaultSalarySlip', () => {
    // 1. Without salarySlip on document, falls back and computes DSR from caseData
    const testCase: FinancingCase = {
      ...baseCase,
      monthlyInstallment: 2400000,
      customerName: 'JOKO WIDODO',
    };
    const activeSlip = resolveActiveSalarySlip(testCase.document, testCase, 'JOKO WIDODO');

    expect(activeSlip.employeeName).toBe('JOKO WIDODO');
    expect(activeSlip.monthlyInstallment).toBe(2400000);
    // DSR = (2,400,000 / 6,850,000) * 100 = 35.04% -> unhealty (> 35.0)
    expect(activeSlip.dsrPercentage).toBe(35.04);
    expect(activeSlip.isDsrHealthy).toBe(false);

    // 2. Healthy DSR case
    const healthyCase: FinancingCase = {
      ...baseCase,
      monthlyInstallment: 1395000,
    };
    const healthySlip = resolveActiveSalarySlip(healthyCase.document, healthyCase);
    expect(healthySlip.dsrPercentage).toBe(20.36);
    expect(healthySlip.isDsrHealthy).toBe(true);

    // 3. When document already contains salarySlip, returns it directly
    const customSalarySlip = {
      ...defaultSalarySlip,
      employeeName: 'CUSTOM WORKER',
      takeHomePay: 9000000,
      dsrPercentage: 15.0,
      isDsrHealthy: true,
    };
    const caseWithSlipDoc = {
      ...testCase.document,
      salarySlip: customSalarySlip,
    };
    const directSlip = resolveActiveSalarySlip(caseWithSlipDoc, testCase);
    expect(directSlip.employeeName).toBe('CUSTOM WORKER');
    expect(directSlip.takeHomePay).toBe(9000000);
  });

  it('renders document selection buttons including ktp, selfie, and slip pills', () => {
    const html = renderToStaticMarkup(
      React.createElement(CaseEktpPage, { caseData: baseCase })
    );

    // Document Selector tabs must contain all 3 document options
    expect(html).toContain('e-KTP Card');
    expect(html).toContain('Consumer Selfie');
    expect(html).toContain('Salary Slip');
  });

  it('switching selectedDoc to slip displays DetailedSalarySlipCard and SalaryBreakdownTable with DSR calculation', () => {
    const testCase: FinancingCase = {
      ...baseCase,
      monthlyInstallment: 1850000,
      customerName: 'BUDI SANTOSO',
    };

    const html = renderToStaticMarkup(
      React.createElement(CaseEktpPage, {
        caseData: testCase,
        initialSelectedDoc: 'slip',
      })
    );

    // Left column: DetailedSalarySlipCard should be rendered
    expect(html).toContain('Pratinjau Forensik Slip Gaji');
    expect(html).toContain('SLIP GAJI KARYAWAN');
    expect(html).toContain('PT Citra Nusantara Mandiri');

    // Right column: SalaryBreakdownTable should be rendered
    expect(html).toContain('Analisis Rasio Beban Utang (DSR)');
    expect(html).toContain('Rasio DSR');
    expect(html).toContain('27.01%'); // 1,850,000 / 6,850,000 = 27.01%
    expect(html).toContain('Memenuhi Syarat OJK (DSR ≤ 35%)');

    // KTP specific tamper box and NIK analysis card should NOT be shown
    expect(html).not.toContain('Dukcapil 16-Digit NIK Structure Analysis');
    expect(html).not.toContain('Forensic Tamper Detection');
  });

  it('switching selectedDoc to ktp renders DetailedKtpCard, tamper box, and Dukcapil analysis', () => {
    const html = renderToStaticMarkup(
      React.createElement(CaseEktpPage, {
        caseData: baseCase,
        initialSelectedDoc: 'ktp',
      })
    );

    // KTP Card and NIK analysis should be rendered
    expect(html).toContain('Dukcapil 16-Digit NIK Structure Analysis');
    expect(html).toContain('Forensic Tamper Detection');

    // Salary slip cards should NOT be rendered
    expect(html).not.toContain('Pratinjau Forensik Slip Gaji');
    expect(html).not.toContain('Rincian Gaji Bersih &amp; Rasio Beban Angsuran');
  });

  it('hovering field keys in breakdown table updates highlighted field in salary slip card', () => {
    // When gajiPokok is hovered, DetailedSalarySlipCard should receive highlightedFieldKey='gajiPokok'
    const htmlHighlighted = renderToStaticMarkup(
      React.createElement(CaseEktpPage, {
        caseData: baseCase,
        initialSelectedDoc: 'slip',
        initialHoveredFieldKey: 'gajiPokok',
      })
    );

    // DetailedSalarySlipCard applies high-contrast blue ring/glow for highlighted fields
    expect(htmlHighlighted).toContain('border-[#2563EB]');
    expect(htmlHighlighted).toContain('bg-[#2563EB]/15');

    // When no field is hovered
    const htmlUnhighlighted = renderToStaticMarkup(
      React.createElement(CaseEktpPage, {
        caseData: baseCase,
        initialSelectedDoc: 'slip',
        initialHoveredFieldKey: null,
      })
    );

    expect(htmlUnhighlighted).not.toContain('bg-[#2563EB]/15');
  });
});

describe('CaseEktpPage OCR Extracted Fields Table & Biometric Updates', () => {
  const baseCase: FinancingCase = mockCases[0];

  it('renders 2-column OCR Extracted Field Values table without confidence scores', () => {
    const html = renderToStaticMarkup(
      React.createElement(CaseEktpPage, {
        caseData: baseCase,
        initialSelectedDoc: 'ktp',
      })
    );

    // Section heading and subtitle
    expect(html).toContain('OCR Extracted Field Values');
    expect(html).not.toContain('OCR Extracted Field Values &amp; Confidence');
    expect(html).not.toContain('OCR Extracted Field Values & Confidence');
    expect(html).toContain('Extracted textual fields from KTP document scan');

    // 2-column table headers
    expect(html).toContain('Field / Keterangan');
    expect(html).toContain('Extracted Value');
    expect(html).not.toContain('Confidence');
    expect(html).not.toContain('>Verification<');

    // Preset pills check
    expect(html).toContain('Clean (Valid)');
    expect(html).not.toContain('Clean (100% Valid)');

    // Qualitative biometric badge check
    expect(html).toContain('Verified Match');
    expect(html).not.toContain('% Verified');
  });

  it('renders demographic field rows without percentage badges', () => {
    const html = renderToStaticMarkup(
      React.createElement(CaseEktpPage, {
        caseData: baseCase,
        initialSelectedDoc: 'ktp',
      })
    );

    // Should render extracted values
    expect(html).toContain(ocrDemoPresets.clean.ocrFields.nik.value);
    expect(html).toContain(ocrDemoPresets.clean.ocrFields.nama.value);

    // Demographic field rows must render extracted value without confidence percentage badges
    expect(html).not.toMatch(/\d+%\s*<\/span>\s*<\/td>/);
  });
});
