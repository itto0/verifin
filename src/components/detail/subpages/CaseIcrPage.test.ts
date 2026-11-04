import { describe, expect, it } from 'bun:test';
import { icrDemoPresets } from '../../../data/demoPresets';
import { createCustomIcrDocument, DEFAULT_ICR_BOUNDING_BOXES } from './CaseIcrPage';

describe('CaseIcrPage demo state logic', () => {
  it('has default preset survey_clean configured as survey_form with 6 extracted fields and verified status', () => {
    const surveyClean = icrDemoPresets.survey_clean;
    expect(surveyClean).toBeDefined();
    expect(surveyClean.type).toBe('survey_form');
    expect(surveyClean.status).toBe('verified');
    expect(surveyClean.applicantName).toBe('Budi Santoso');
    expect(surveyClean.caseId).toBe('CASE-001');
    expect(surveyClean.overallConfidence).toBe(96);
    expect(surveyClean.extractedFields.length).toBe(6);
    expect(surveyClean.extractedFields.every((f) => f.confidence >= 90)).toBe(true);
    expect(surveyClean.extractedFields.every((f) => !f.isAnomaly)).toBe(true);
    expect(surveyClean.documentNumber).toBe('SRV-FORM-2026-001');

    const expectedKeys = [
      'status_kepemilikan',
      'daya_listrik',
      'lama_tinggal',
      'nama_penjamin',
      'penghasilan_tambahan',
      'catatan_lingkungan',
    ];
    const actualKeys = surveyClean.extractedFields.map((f) => f.fieldKey);
    expect(actualKeys).toEqual(expectedKeys);
  });

  it('correctly maps category switching between survey form and bpn certificate', () => {
    const surveyCategoryPresets = ['survey_clean', 'low_confidence'];
    for (const key of surveyCategoryPresets) {
      expect(icrDemoPresets[key].type).toBe('survey_form');
    }

    const bpnCategoryPresets = ['clean_shm', 'cadastral_mismatch'];
    for (const key of bpnCategoryPresets) {
      expect(icrDemoPresets[key].type).toBe('bpn_certificate');
    }

    const getInitialDocForCategory = (category: 'survey_form' | 'bpn_certificate') => {
      return category === 'survey_form' ? icrDemoPresets.survey_clean : icrDemoPresets.clean_shm;
    };

    expect(getInitialDocForCategory('survey_form').type).toBe('survey_form');
    expect(getInitialDocForCategory('survey_form').id).toBe('ICR-PRESET-CLEAN-SURVEY');
    expect(getInitialDocForCategory('bpn_certificate').type).toBe('bpn_certificate');
    expect(getInitialDocForCategory('bpn_certificate').id).toBe('ICR-PRESET-CLEAN');
  });

  it('correctly switches between ICR presets and reflects BPN spatial status', () => {
    let activeDoc = icrDemoPresets.clean_shm;
    expect(activeDoc.bpnSpatialVerification?.sentuhTanahkuStatus).toBe('Terverifikasi BPN');
    expect(activeDoc.status).toBe('verified');

    // Switch to cadastral mismatch
    activeDoc = icrDemoPresets.cadastral_mismatch;
    expect(activeDoc.bpnSpatialVerification?.spatialMatchWithSurveyAddress).toBe(false);
    expect(activeDoc.status).toBe('mismatch_flag');
  });

  it('contains extracted field definitions with confidence scores', () => {
    const doc = icrDemoPresets.low_confidence;
    expect(doc.extractedFields.some((f) => f.confidence < 65)).toBe(true);
    expect(doc.status).toBe('needs_review');
  });

  it('creates custom ICR document for uploaded surveyor form with simulated fields', () => {
    const customDoc = createCustomIcrDocument(
      'data:image/jpeg;base64,mockformdata',
      'survey_lapangan_baf.jpg',
      {
        applicantName: 'BUDI SANTOSO',
        caseId: 'CASE-0941',
        type: 'survey_form',
      }
    );

    expect(customDoc.type).toBe('survey_form');
    expect(customDoc.applicantName).toBe('BUDI SANTOSO');
    expect(customDoc.thumbnailUrl).toBe('data:image/jpeg;base64,mockformdata');
    expect(customDoc.extractedFields.length).toBeGreaterThan(0);
    expect(customDoc.extractedFields.some((f) => f.fieldKey === 'status_kepemilikan')).toBe(true);
    expect(customDoc.extractedFields.some((f) => f.fieldKey === 'daya_listrik')).toBe(true);
    expect(customDoc.overallConfidence).toBeGreaterThanOrEqual(80);
    expect(customDoc.status).toBe('verified');
  });

  it('creates custom ICR document for uploaded BPN SHM certificate with cadastral verification', () => {
    const customDoc = createCustomIcrDocument(
      'data:application/pdf;base64,mockpdfdata',
      'sertipikat_tanah_shm.pdf',
      {
        applicantName: 'BUDI SANTOSO',
        caseId: 'CASE-0943',
        type: 'bpn_certificate',
      }
    );

    expect(customDoc.type).toBe('bpn_certificate');
    expect(customDoc.applicantName).toBe('BUDI SANTOSO');
    expect(customDoc.bpnSpatialVerification).toBeDefined();
    expect(customDoc.bpnSpatialVerification?.sentuhTanahkuStatus).toBe('Terverifikasi BPN');
    expect(customDoc.bpnSpatialVerification?.spatialMatchWithSurveyAddress).toBe(true);
    expect(customDoc.bpnSpatialVerification?.registeredOwner).toBe('BUDI SANTOSO');
    expect(customDoc.status).toBe('verified');
  });

  it('flags anomaly when custom document has mismatch keywords or flagged name', () => {
    const mismatchDoc = createCustomIcrDocument(
      'data:image/png;base64,mockmismatch',
      'sertipikat_tanah_sengketa_mismatch.png',
      {
        applicantName: 'BUDI SANTOSO',
        caseId: 'CASE-0945',
        type: 'bpn_certificate',
        forceMismatch: true,
      }
    );

    expect(mismatchDoc.status).toBe('mismatch_flag');
    expect(mismatchDoc.bpnSpatialVerification?.spatialMatchWithSurveyAddress).toBe(false);
    expect(mismatchDoc.bpnSpatialVerification?.sentuhTanahkuStatus).toBe('Beda Nama Pemilik');
    expect(mismatchDoc.extractedFields.some((f) => f.isAnomaly)).toBe(true);
  });

  it('provides default bounding box mappings for ICR form and certificate fields', () => {
    const formKeys = ['status_kepemilikan', 'daya_listrik', 'lama_tinggal', 'nama_penjamin'];
    for (const key of formKeys) {
      expect(DEFAULT_ICR_BOUNDING_BOXES[key]).toBeDefined();
      expect(DEFAULT_ICR_BOUNDING_BOXES[key].w).toBeGreaterThan(0);
      expect(DEFAULT_ICR_BOUNDING_BOXES[key].h).toBeGreaterThan(0);
    }

    const certKeys = ['shm_nomor', 'nib', 'luas_tanah', 'nama_pemilik'];
    for (const key of certKeys) {
      expect(DEFAULT_ICR_BOUNDING_BOXES[key]).toBeDefined();
      expect(DEFAULT_ICR_BOUNDING_BOXES[key].w).toBeGreaterThan(0);
      expect(DEFAULT_ICR_BOUNDING_BOXES[key].h).toBeGreaterThan(0);
    }
  });
});
