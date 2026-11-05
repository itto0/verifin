import { describe, it, expect } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DetailedKtpCard } from './DetailedKtpCard';
import { ocrDemoPresets } from '../../data/demoPresets';

// CaseEktpPage merges DEFAULT_BOUNDING_BOXES onto ocrFields at runtime.
// In order to verify that DetailedKtpCard does not render bounding boxes even
// when boundingBox coordinate data is present on fields, we attach bounding boxes here.
const withBoundingBoxes = (doc: typeof ocrDemoPresets.clean) => ({
  ...doc,
  ocrFields: Object.fromEntries(
    Object.entries(doc.ocrFields).map(([key, field]) => [
      key,
      {
        ...field,
        boundingBox: field.boundingBox ?? { x: 28, y: 18, w: 42, h: 6.5 },
      },
    ])
  ),
});

describe('DetailedKtpCard bounding box removal', () => {
  it('renders KTP scan image and forensic header', () => {
    const html = renderToStaticMarkup(
      <DetailedKtpCard
        document={ocrDemoPresets.clean}
        customerName="BUDI SANTOSO"
        showTamperOverlay={false}
      />
    );

    expect(html).toContain('Pratinjau Forensik Dokumen Fisik (Original Scan)');
    expect(html).toContain('alt="e-KTP Document Full Scan - BUDI SANTOSO"');
  });

  it('does NOT render red dashed bounding boxes even when tamper overlay is active on anomalous document', () => {
    const html = renderToStaticMarkup(
      <DetailedKtpCard
        document={withBoundingBoxes(ocrDemoPresets.tampered)}
        customerName="ANDI PRASETYO"
        showTamperOverlay={true}
      />
    );

    // Tamper warning banner should still be present
    expect(html).toContain('Forensic Tamper Anomaly Detected');

    // Dashed red bounding box divs should NOT be rendered
    expect(html).not.toContain('border-dashed border-[#DC2626] bg-[#DC2626]/20');
  });

  it('does NOT render interactive blue coordinate reticle when field is hovered or selected', () => {
    const html = renderToStaticMarkup(
      <DetailedKtpCard
        document={withBoundingBoxes(ocrDemoPresets.clean)}
        customerName="BUDI SANTOSO"
        showTamperOverlay={false}
        hoveredFieldKey="nik"
      />
    );

    // Blue coordinate reticle box should NOT be rendered
    expect(html).not.toContain('border-[#2563EB] bg-[#2563EB]/25');
  });
});
