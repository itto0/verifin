import { describe, expect, it } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mockCases } from '../../../data/mockData';

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

describe('CaseGeoPage Survey Photos Real Asset Rendering', () => {
  it('renders authentic survey photos when imageUrl is present on surveyPhotos', async () => {
    const { CaseGeoPage } = await import('./CaseGeoPage');
    const caseItem = mockCases[0];
    const html = renderToStaticMarkup(
      React.createElement(CaseGeoPage, { caseData: caseItem })
    );

    expect(
      html.includes('/survey_house_front.jpg') || html.includes('/survey_house_front.jfif')
    ).toBe(true);
    expect(html).toContain('CameraX In-App Verified');
  });
});
