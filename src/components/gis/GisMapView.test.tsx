import { describe, it, expect, mock } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mockSurveyPoints } from '../../data/mockData';

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

describe('GisMapView Component', () => {
  it('renders GIS map view title, statistics, and filters', async () => {
    const { GisMapView } = await import('./GisMapView');
    const html = renderToStaticMarkup(<GisMapView onSelectCase={() => {}} />);

    expect(html).toContain('Geospatial Survey &amp; Field Routes (GIS)');
    expect(html).toContain('Real interactive map of survey check-in coordinates');
    expect(html).toContain('Branch:');
    expect(html).toContain('Compliant Radius');
    expect(html).toContain('Warning Zone');
    expect(html).toContain('Mock GPS Alert');
    expect(html).toContain('Survey Check-in Details');
  });

  it('imports API services getGisPoints and mapBackendGisPointsToSurveyorPoints', async () => {
    const { getGisPoints, mapBackendGisPointsToSurveyorPoints } = await import('../../services/apiService');
    expect(typeof getGisPoints).toBe('function');
    expect(typeof mapBackendGisPointsToSurveyorPoints).toBe('function');

    const rawPoints = await getGisPoints();
    const mapped = mapBackendGisPointsToSurveyorPoints(rawPoints);
    expect(Array.isArray(mapped)).toBe(true);
    expect(mapped.length).toBeGreaterThan(0);
    expect(mapped[0].applicantName).toBeDefined();
    expect(mapped[0].branch).toBeDefined();
    expect(mapped[0].status).toBeDefined();
  });

  it('renders initial dynamic counts corresponding to mockSurveyPoints baseline', async () => {
    const { GisMapView } = await import('./GisMapView');
    const html = renderToStaticMarkup(<GisMapView onSelectCase={() => {}} />);

    const totalCount = mockSurveyPoints.length;
    const greenCount = mockSurveyPoints.filter((p) => p.status === 'green').length;
    const yellowCount = mockSurveyPoints.filter((p) => p.status === 'yellow').length;
    const redCount = mockSurveyPoints.filter((p) => p.status === 'red').length;

    expect(html).toContain(`All (${totalCount})`);
    expect(html).toContain(`≤200m Valid (${greenCount})`);
    expect(html).toContain(`201m-1km (${yellowCount})`);
    expect(html).toContain(`&gt;1km / Mock (${redCount})`);
  });

  it('maps custom backend GIS points to SurveyorPoint format accurately', async () => {
    const { mapBackendGisPointsToSurveyorPoints } = await import('../../services/apiService');
    const rawApiPayload = [
      {
        id: 'PT-99',
        application_id: 'APP-999',
        consumer_name: 'Budi Santoso',
        vehicle_model: 'Honda PCX 160',
        branch_code: 'JKT-SEL',
        surveyor_name: 'Surveyor Team 1',
        latitude: -6.2,
        longitude: 106.8,
        distance_meters: 150,
        status: 'green',
        mock_location_detected: false,
        device_timestamp: '2026-11-05T08:00:00Z',
      },
    ];

    const mapped = mapBackendGisPointsToSurveyorPoints(rawApiPayload);
    expect(mapped.length).toBe(1);
    expect(mapped[0].id).toBe('PT-99');
    expect(mapped[0].caseId).toBe('APP-999');
    expect(mapped[0].applicantName).toBe('Budi Santoso');
    expect(mapped[0].status).toBe('green');
    expect(mapped[0].distanceMeters).toBe(150);
    expect(mapped[0].isMockLocation).toBe(false);
  });
});
