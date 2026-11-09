import { describe, it, expect } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mockCases } from '../../data/mockData';
import { mapBackendApplicationsToFinancingCases } from '../../services/apiService';

describe('Demo Document Data Flag', () => {
  it('marks CASE-0941 with hasDemoDocuments: true and leaves others false or undefined', () => {
    const case0941 = mockCases.find((c) => c.id === 'CASE-0941');
    expect(case0941).toBeDefined();
    expect(case0941?.hasDemoDocuments).toBe(true);

    const otherCases = mockCases.filter((c) => c.id !== 'CASE-0941');
    for (const c of otherCases) {
      expect(Boolean(c.hasDemoDocuments)).toBe(false);
    }
  });

  it('preserves hasDemoDocuments when mapped through mapBackendApplicationsToFinancingCases', () => {
    const mapped = mapBackendApplicationsToFinancingCases([
      { id: 'APP-2026-JKT-001', customerName: 'Ahmad Fauzi' },
      { id: 'APP-2026-JKT-002', customerName: 'Siti Nurhaliza' }
    ]);
    const fauzi = mapped.find((c) => c.customerName === 'Ahmad Fauzi');
    const siti = mapped.find((c) => c.customerName === 'Siti Nurhaliza');

    expect(fauzi?.hasDemoDocuments).toBe(true);
    expect(Boolean(siti?.hasDemoDocuments)).toBe(false);
  });
});
