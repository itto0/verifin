import { describe, it, expect } from 'bun:test';
import { mockCases } from '../../src/data/mockData';
import { mockIcrDocuments } from '../../src/data/icrData';
import { ocrDemoPresets } from '../../src/data/demoPresets';

describe('Case 0941 Document Assets Integration', () => {
  it('should reference authentic local documents for CASE-0941', () => {
    const case0941 = mockCases.find((c) => c.id === 'CASE-0941');
    expect(case0941).toBeDefined();

    // e-KTP & Documents
    expect(case0941?.document.ktpImageUrl).toBe('/ktp_demo_normal.jfif');
    expect(case0941?.document.kkImageUrl).toBe('/kartu_keluarga_normal.jfif');
    expect(case0941?.document.slipGajiImageUrl).toBe('/slip_gaji_normal.jfif');
    expect(case0941?.document.salarySlip?.slipImageUrl).toBe('/slip_gaji_normal.jfif');

    // Geo survey photos
    const housePhoto = case0941?.geo.surveyPhotos.find((p) => p.photoType === 'house_front');
    const plnPhoto = case0941?.geo.surveyPhotos.find((p) => p.photoType === 'electricity_meter');

    expect(housePhoto?.imageUrl).toBe('/survey_house_front.jfif');
    expect(plnPhoto?.imageUrl).toBe('/survey_pln_meter.jfif');
  });

  it('should reference authentic local documents for ICR presets', () => {
    const doc001 = mockIcrDocuments.find((d) => d.id === 'ICR-DOC-001');
    const doc002 = mockIcrDocuments.find((d) => d.id === 'ICR-DOC-002');
    const doc003 = mockIcrDocuments.find((d) => d.id === 'ICR-DOC-003');

    expect(doc001?.imageUrl).toBe('/survey_form_cmo.jfif');
    expect(doc002?.imageUrl).toBe('/sertipikat_tanah_bpn.jfif');
    expect(doc003?.imageUrl).toBe('/slip_gaji_normal.jfif');
  });

  it('should update demoPreset clean ktpImageUrl', () => {
    expect(ocrDemoPresets.clean.ktpImageUrl).toBe('/ktp_demo_normal.jfif');
  });
});
