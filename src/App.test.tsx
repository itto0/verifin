import { describe, it, expect } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

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

describe('App component', () => {
  it('renders application structure cleanly', async () => {
    const { default: App } = await import('./App');
    const html = renderToStaticMarkup(<App />);
    expect(html).toBeDefined();
    // Default initial user is logged in as DEMO_USERS[0]
    expect(html).toContain('Operational Overview');
    expect(html).toContain('Dian Pratama');
  });

  it('imports workflow API functions from apiService', async () => {
    const apiService = await import('./services/apiService');
    expect(typeof apiService.mapBackendApplicationsToFinancingCases).toBe('function');
    expect(typeof apiService.approveApplication).toBe('function');
    expect(typeof apiService.rejectApplication).toBe('function');
    expect(typeof apiService.getApplications).toBe('function');
  });

  it('maps backend applications and maintains case IDs', async () => {
    const { getApplications, mapBackendApplicationsToFinancingCases } = await import('./services/apiService');
    const rawApps = await getApplications();
    const mappedCases = mapBackendApplicationsToFinancingCases(rawApps);

    expect(Array.isArray(mappedCases)).toBe(true);
    expect(mappedCases.length).toBeGreaterThan(0);
    expect(mappedCases[0].id).toBeDefined();
    expect(mappedCases[0].status).toBeDefined();
  });

  it('executes approve and reject workflow actions without throwing unhandled errors', async () => {
    const { approveApplication, rejectApplication } = await import('./services/apiService');

    const approveRes = await approveApplication('CASE-0941', 'Manual verification approved', undefined, {
      useMockFallback: true,
    });
    expect(approveRes).toBeDefined();
    expect(approveRes.status).toBe('approved');

    const rejectRes = await rejectApplication('CASE-0942', 'Fake GPS detected in audit', undefined, {
      useMockFallback: true,
    });
    expect(rejectRes).toBeDefined();
    expect(rejectRes.status === 'rejected_fraud' || rejectRes.status === 'ditolak').toBe(true);
  });
});

