import { describe, it, expect } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mockCases } from '../../src/data/mockData';

// Polyfill minimal browser globals for Leaflet in server-side test environment
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    requestAnimationFrame: (fn: any) => setTimeout(fn, 16),
    devicePixelRatio: 1,
    screen: { deviceXDPI: 96, logicalXDPI: 96 },
  };
  (globalThis as any).document = {
    documentElement: { style: {} },
    createElement: () => ({ style: {} }),
  };
  (globalThis as any).navigator = {
    userAgent: 'node',
    platform: 'Win32',
  };
}

describe('CaseGeoPage Survey Photos & Lightbox Viewer', async () => {
  const { CaseGeoPage } = await import('../../src/components/detail/subpages/CaseGeoPage');

  it('should render authentic survey photos when imageUrl is present', () => {
    const caseItem = mockCases[0];
    const html = renderToStaticMarkup(<CaseGeoPage caseData={caseItem} />);

    // Both real photos from CASE-0941 should be rendered in the document
    expect(html).toContain('src="/survey_house_front.jfif"');
    expect(html).toContain('src="/survey_pln_meter.jfif"');
    expect(html).toContain('CameraX In-App Verified');
    expect(html).toContain('CameraX Live');
  });

  it('should retain placeholder canvas fallback when imageUrl is absent', () => {
    const caseItem = mockCases[0]; // PHT-03 has no imageUrl
    const html = renderToStaticMarkup(<CaseGeoPage caseData={caseItem} />);

    expect(html).toContain('Foto Surveyor dengan Pemohon');
    expect(html).toContain('TYPE: selfie_with_applicant');
  });

  it('should display GPS coordinates and timestamp watermarks on photo cards', () => {
    const caseItem = mockCases[0];
    const html = renderToStaticMarkup(<CaseGeoPage caseData={caseItem} />);

    // PHT-01 coordinates: -6.229728, 106.845612
    expect(html).toContain('-6.22973, 106.84561');
    expect(html).toContain('2026-03-28');
  });

  it('should not render lightbox modal by default', () => {
    const caseItem = mockCases[0];
    const html = renderToStaticMarkup(<CaseGeoPage caseData={caseItem} />);

    expect(html).not.toContain('EXIF &amp; Forensics');
    expect(html).not.toContain('Tutup Preview');
  });

  it('should render lightbox modal with full photo and EXIF metadata when a photo is selected', () => {
    const caseItem = mockCases[0];
    const photoToView = caseItem.geo.surveyPhotos[0]; // PHT-01
    const html = renderToStaticMarkup(
      <CaseGeoPage caseData={caseItem} initialSelectedPhoto={photoToView} />
    );

    expect(html).toContain('EXIF &amp; Forensics');
    expect(html).toContain('Tutup Preview');
    expect(html).toContain('PHT-01');
    expect(html).toContain('Tampak Depan Rumah (Nomor Rumah Jelas)');
    expect(html).toContain('CameraX Live Source');
    expect(html).toContain('EXIF Tamper Check');
    expect(html).toContain('Genuine CameraX Hardware Signature (Passed)');
    expect(html).toContain('src="/survey_house_front.jfif"');
  });

  it('should format timestamp resiliently when timestamp has no space', () => {
    const caseItem = {
      ...mockCases[0],
      geo: {
        ...mockCases[0].geo,
        surveyTimestamp: '14:15:00',
        surveyPhotos: [
          {
            ...mockCases[0].geo.surveyPhotos[0],
            timestamp: '14:15:22',
          },
        ],
      },
    };
    const html = renderToStaticMarkup(<CaseGeoPage caseData={caseItem} />);

    expect(html).toContain('14:15:22 WIB');
    expect(html).toContain('14:15:00 WIB');
    expect(html).not.toContain('undefined WIB');
  });
});
