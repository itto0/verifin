import { describe, it, expect } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DetailedSalarySlipCard } from './DetailedSalarySlipCard';
import { defaultSalarySlip } from '../../data/salarySlipHelper';
import { SalarySlipBreakdown } from '../../types';

describe('DetailedSalarySlipCard component', () => {
  it('renders header with title and stamp status badge, without OCR confidence', () => {
    const html = renderToStaticMarkup(
      <DetailedSalarySlipCard salaryData={defaultSalarySlip} />
    );

    // Header title
    expect(html).toContain('Pratinjau Forensik Slip Gaji (Corporate Payroll Scan)');
    // OCR Confidence badge removed
    expect(html).not.toContain('OCR Confidence');
    // Stamp badge for verified
    expect(html).toContain('Stempel Asli Terverifikasi');
  });

  it('renders company name, employee name, NIK, period, and payment date', () => {
    const html = renderToStaticMarkup(
      <DetailedSalarySlipCard salaryData={defaultSalarySlip} />
    );

    // Company & Document
    expect(html).toContain('PT Citra Nusantara Mandiri');
    expect(html).toContain('SLIP GAJI KARYAWAN');
    // Employee metadata
    expect(html).toContain('BUDI SANTOSO');
    expect(html).toContain('3171012305880001');
    expect(html).toContain('Oktober 2026');
    expect(html).toContain('25 Oktober 2026');
  });

  it('renders all financial items in the earnings and deductions grids', () => {
    const html = renderToStaticMarkup(
      <DetailedSalarySlipCard salaryData={defaultSalarySlip} />
    );

    // Earnings
    expect(html).toContain('Gaji Pokok');
    expect(html).toContain('Tunjangan Transport');
    expect(html).toContain('Tunjangan Makan');
    expect(html).toContain('Tunjangan Kehadiran');
    expect(html).toContain('Total Tunjangan');
    expect(html).toContain('Penghasilan Kotor');

    // Deductions
    expect(html).toContain('BPJS Kesehatan');
    expect(html).toContain('BPJS Ketenagakerjaan');
    expect(html).toContain('PPh 21');
    expect(html).toContain('Total Potongan');

    // Take home pay
    expect(html).toContain('GAJI BERSIH');
    expect(html).toContain('6.850.000');
  });

  it('renders correct stamp badge for suspicious and missing stamp statuses', () => {
    const suspiciousSlip: SalarySlipBreakdown = {
      ...defaultSalarySlip,
      stampStatus: 'suspicious',
    };
    const missingSlip: SalarySlipBreakdown = {
      ...defaultSalarySlip,
      stampStatus: 'missing',
    };

    const suspHtml = renderToStaticMarkup(
      <DetailedSalarySlipCard salaryData={suspiciousSlip} />
    );
    expect(suspHtml).toContain('Indikasi Digital Overlay / Editing');

    const missHtml = renderToStaticMarkup(
      <DetailedSalarySlipCard salaryData={missingSlip} />
    );
    expect(missHtml).toContain('Tanpa Stempel Perusahaan');
  });

  it('correctly applies glowing reticle highlight when highlightedFieldKey is provided', () => {
    const htmlWithHighlight = renderToStaticMarkup(
      <DetailedSalarySlipCard
        salaryData={defaultSalarySlip}
        highlightedFieldKey="gajiPokok"
      />
    );

    // Checks that the gajiPokok field has the highlight class tokens
    expect(htmlWithHighlight).toContain('border-[#2563EB]');
    expect(htmlWithHighlight).toContain('bg-[#2563EB]/15');
    expect(htmlWithHighlight).toContain('shadow-[0_0_12px_rgba(37,99,235,0.4)]');

    // Highlight takeHomePay
    const htmlTakeHome = renderToStaticMarkup(
      <DetailedSalarySlipCard
        salaryData={defaultSalarySlip}
        highlightedFieldKey="takeHomePay"
      />
    );
    expect(htmlTakeHome).toContain('border-[#2563EB]');
  });

  it('renders dashed red border for anomalous fields', () => {
    const slipWithAnomaly: SalarySlipBreakdown = {
      ...defaultSalarySlip,
      anomalies: [
        {
          fieldKey: 'gajiPokok',
          description: 'Font mismatch with company baseline',
          severity: 'high',
        },
      ],
    };

    const html = renderToStaticMarkup(
      <DetailedSalarySlipCard salaryData={slipWithAnomaly} />
    );

    expect(html).toContain('border-[#DC2626]');
    expect(html).toContain('border-dashed');
    expect(html).toContain('bg-[#DC2626]/10');
  });

  it('renders footer with document ID, OCR engine status, and scan date', () => {
    const html = renderToStaticMarkup(
      <DetailedSalarySlipCard salaryData={defaultSalarySlip} />
    );

    expect(html).toContain('PP-OCRv4 + LayoutLMv3');
    expect(html).toContain('25 Oktober 2026');
  });
});
