import { describe, expect, it } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { icrDemoPresets } from '../../../data/demoPresets';
import { mockCases } from '../../../data/mockData';
import {
  createCustomIcrDocument,
  DEFAULT_ICR_BOUNDING_BOXES,
  CaseIcrPage,
} from './CaseIcrPage';
import { DetailedIcrDocumentCard } from '../../icr/DetailedIcrDocumentCard';

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

  it('updates summary notes to remove percentage match and confidence claims', () => {
    expect(icrDemoPresets.clean_shm.summaryNote).toContain('terverifikasi cocok');
    expect(icrDemoPresets.clean_shm.summaryNote).not.toContain('cocok 100%');

    expect(icrDemoPresets.low_confidence.summaryNote).toContain('yang terindikasi anomali');
    expect(icrDemoPresets.low_confidence.summaryNote).not.toContain('keyakinan di bawah 75%');
  });
});

describe('CaseIcrPage ICR Field Survey & Collateral UI Rendering', () => {
  const baseCase = mockCases[0];

  it('renders extracted fields list without % Confidence badges', () => {
    const html = renderToStaticMarkup(
      React.createElement(CaseIcrPage, {
        caseData: baseCase,
      })
    );

    // Should render field labels and extracted values
    expect(html).toContain('Kapasitas Listrik (PLN)');
    expect(html).toContain('1300 VA (Pascabayar)');

    // Extracted fields subtext should be updated without bounding box mentions
    expect(html).toContain('Click or hover any row to inspect field');
    expect(html).not.toContain('pinpoint bounding box');

    // Extracted fields must not render % Confidence badges
    expect(html).not.toContain('% Confidence');
    expect(html).not.toMatch(/\d+%\s*Confidence/i);
  });

  it('renders Clean SHM preset button as Clean SHM (Verified) without 1:1', () => {
    const html = renderToStaticMarkup(
      React.createElement(CaseIcrPage, {
        caseData: baseCase,
        initialCategory: 'bpn_certificate',
      })
    );

    expect(html).toContain('Clean SHM (Verified)');
    expect(html).not.toContain('Clean SHM (Verified 1:1)');
  });

  it('renders header status badge cleanly without ICR Confidence', () => {
    const html = renderToStaticMarkup(
      React.createElement(CaseIcrPage, {
        caseData: baseCase,
      })
    );

    expect(html).toContain('Status: Verified');
    expect(html).not.toContain('ICR Confidence:');
  });

  it('renders DetailedIcrDocumentCard without confidence percentage and 100% match badge', () => {
    // Custom uploaded doc preview
    const customDoc = createCustomIcrDocument(
      'data:image/jpeg;base64,mockupload',
      'custom_survey.jpg',
      { applicantName: 'Budi Santoso', type: 'survey_form' }
    );
    const customHtml = renderToStaticMarkup(
      React.createElement(DetailedIcrDocumentCard, {
        document: customDoc,
        onSelectCase: () => {},
      })
    );
    expect(customHtml).toContain('Status:');
    expect(customHtml).toContain('Terverifikasi');
    expect(customHtml).not.toContain('ICR Confidence:');

    // Custom uploaded doc preview with mismatch status renders Tamper / Mismatch
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
    const mismatchHtml = renderToStaticMarkup(
      React.createElement(DetailedIcrDocumentCard, {
        document: mismatchDoc,
        onSelectCase: () => {},
      })
    );
    expect(mismatchHtml).toContain('Status:');
    expect(mismatchHtml).toContain('Tamper / Mismatch');

    // Custom uploaded doc with needs_review status
    const reviewDoc = {
      ...customDoc,
      status: 'needs_review' as const,
    };
    const reviewHtml = renderToStaticMarkup(
      React.createElement(DetailedIcrDocumentCard, {
        document: reviewDoc,
        onSelectCase: () => {},
      })
    );
    expect(reviewHtml).toContain('Needs Review');

    // BPN SHM certificate
    const shmDoc = icrDemoPresets.clean_shm;
    const shmHtml = renderToStaticMarkup(
      React.createElement(DetailedIcrDocumentCard, {
        document: shmDoc,
        onSelectCase: () => {},
      })
    );
    expect(shmHtml).toContain('(Cocok dengan KTP Pemohon)');
    expect(shmHtml).not.toContain('(Cocok 100% dengan KTP Pemohon)');
  });
});
