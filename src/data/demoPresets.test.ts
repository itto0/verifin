import { describe, expect, it } from 'bun:test';
import {
  ocrDemoPresets,
  icrDemoPresets,
  voiceDemoPresets,
  validateDukcapilNik,
} from './demoPresets';

describe('demoPresets', () => {
  it('defines 3 OCR presets with distinct risk profiles', () => {
    expect(ocrDemoPresets.clean).toBeDefined();
    expect(ocrDemoPresets.tampered).toBeDefined();
    expect(ocrDemoPresets.screen_capture).toBeDefined();

    expect(ocrDemoPresets.clean.score).toBeLessThan(30);
    expect(ocrDemoPresets.tampered.score).toBeGreaterThanOrEqual(70);
    expect(ocrDemoPresets.screen_capture.isScreenCaptureDetected).toBe(true);
  });

  it('defines 3 ICR presets with cadastral variations', () => {
    expect(icrDemoPresets.clean_shm).toBeDefined();
    expect(icrDemoPresets.cadastral_mismatch).toBeDefined();
    expect(icrDemoPresets.low_confidence).toBeDefined();

    expect(icrDemoPresets.clean_shm.bpnSpatialVerification?.spatialMatchWithSurveyAddress).toBe(true);
    expect(icrDemoPresets.cadastral_mismatch.bpnSpatialVerification?.spatialMatchWithSurveyAddress).toBe(false);
  });

  it('defines 3 Voice STT presets with hesitation and compliance differences', () => {
    expect(voiceDemoPresets.nominal).toBeDefined();
    expect(voiceDemoPresets.hesitant_noncompliant).toBeDefined();
    expect(voiceDemoPresets.coaching_suspicion).toBeDefined();

    expect(voiceDemoPresets.nominal.scriptComplianceScore).toBeGreaterThanOrEqual(90);
    expect(voiceDemoPresets.hesitant_noncompliant.scriptComplianceScore).toBeLessThan(80);
  });

  describe('validateDukcapilNik', () => {
    it('validates matching NIK birth date format for male', () => {
      // DOB: 14-08-1994 -> NIK middle digits: 140894
      const result = validateDukcapilNik('3275011408940003', '14-08-1994', 'Laki-laki');
      expect(result.isValid).toBe(true);
      expect(result.anomalies.length).toBe(0);
    });

    it('validates matching NIK birth date with +40 offset for female', () => {
      // DOB: 14-08-1994 female -> Day + 40 = 54 -> NIK middle digits: 540894
      const result = validateDukcapilNik('3275015408940001', '14-08-1994', 'Perempuan');
      expect(result.isValid).toBe(true);
      expect(result.anomalies.length).toBe(0);
    });

    it('detects mismatch when birth date in NIK does not match card date', () => {
      const result = validateDukcapilNik('3275011408940003', '20-11-1990', 'Laki-laki');
      expect(result.isValid).toBe(false);
      expect(result.anomalies.some((a) => a.includes('Birth date'))).toBe(true);
    });

    it('detects invalid 16-digit structure', () => {
      const result = validateDukcapilNik('327501', '14-08-1994', 'Laki-laki');
      expect(result.isValid).toBe(false);
      expect(result.anomalies.some((a) => a.includes('16 digits'))).toBe(true);
    });

    it('detects non-numeric characters in NIK', () => {
      const result = validateDukcapilNik('327501140894000A', '14-08-1994', 'Laki-laki');
      expect(result.isValid).toBe(false);
      expect(result.anomalies.some((a) => a.includes('16 digits'))).toBe(true);
    });

    it('handles ISO date format YYYY-MM-DD correctly', () => {
      const result = validateDukcapilNik('3275011408940003', '1994-08-14', 'Laki-laki');
      expect(result.isValid).toBe(true);
      expect(result.anomalies.length).toBe(0);
    });

    it('handles slash date format DD/MM/YYYY correctly', () => {
      const result = validateDukcapilNik('3275015408940001', '14/08/1994', 'Perempuan');
      expect(result.isValid).toBe(true);
      expect(result.anomalies.length).toBe(0);
    });
  });
});
