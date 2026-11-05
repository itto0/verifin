import { describe, it, expect } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CaseEktpPage } from '../../src/components/detail/subpages/CaseEktpPage';
import { DetailedKtpCard } from '../../src/components/detail/DetailedKtpCard';
import { mockCases } from '../../src/data/mockData';
import { FinancingCase, DocumentVerification } from '../../src/types';

describe('CaseEktpPage Kartu Keluarga Tab & Fallbacks', () => {
  it('should render Kartu Keluarga tab button in document selector tabs', () => {
    const caseItem = mockCases[0];
    const html = renderToStaticMarkup(<CaseEktpPage caseData={caseItem} />);

    expect(html).toContain('Kartu Keluarga');
  });

  it('should render KK image using mockCases[0].document.kkImageUrl', () => {
    const caseItem = mockCases[0];
    const html = renderToStaticMarkup(
      <CaseEktpPage caseData={caseItem} initialSelectedDoc="kk" />
    );

    expect(html).toContain('Scan Asli Kartu Keluarga (KK)');
    expect(html).toContain('src="/kartu_keluarga_normal.jfif"');
    expect(html).toContain('Dukcapil Verified');
    expect(html).toContain('Data Hasil Ekstraksi KK');
    expect(html).toContain('3174010502120005');
  });

  it('should fallback to /kartu_keluarga_normal.jfif when document.kkImageUrl is undefined', () => {
    const caseWithoutKk: FinancingCase = {
      ...mockCases[0],
      document: {
        ...mockCases[0].document,
        kkImageUrl: undefined,
      },
    };

    const html = renderToStaticMarkup(
      <CaseEktpPage caseData={caseWithoutKk} initialSelectedDoc="kk" />
    );

    expect(html).toContain('src="/kartu_keluarga_normal.jfif"');
  });

  it('should render custom KK image URL when provided', () => {
    const customKkCase: FinancingCase = {
      ...mockCases[0],
      document: {
        ...mockCases[0].document,
        kkImageUrl: 'https://example.com/custom_kk.jpg',
      },
    };

    const html = renderToStaticMarkup(
      <CaseEktpPage caseData={customKkCase} initialSelectedDoc="kk" />
    );

    expect(html).toContain('src="https://example.com/custom_kk.jpg"');
  });
});

describe('DetailedKtpCard Fallback', () => {
  it('should fallback to /ktp_demo_normal.jfif when document.ktpImageUrl is undefined', () => {
    const docWithoutKtp: DocumentVerification = {
      ...mockCases[0].document,
      ktpImageUrl: undefined as any,
    };

    const html = renderToStaticMarkup(
      <DetailedKtpCard
        document={docWithoutKtp}
        customerName="BUDI SANTOSO"
        showTamperOverlay={false}
      />
    );

    expect(html).toContain('src="/ktp_demo_normal.jfif"');
  });
});
