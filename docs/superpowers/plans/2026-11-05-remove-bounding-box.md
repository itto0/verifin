# Remove Document Scan Bounding Box Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove bounding box overlays from the e-KTP document scan viewer and refine bounding box copy references across the application.

**Architecture:** Refactor `DetailedKtpCard` to eliminate red dashed anomaly bounding boxes and blue coordinate reticles while preserving document images, tamper warning banners, and table interactions. Update microcopy in `CaseIcrPage` and `DetailedSalarySlipCard`. Maintain data contracts in `types.ts` and mock factories.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Bun test runner (`bun:test`).

## Global Constraints
- Preserve `boundingBox?: { x: number; y: number; w: number; h: number }` in `src/types.ts` and `DEFAULT_BOUNDING_BOXES` / `DEFAULT_ICR_BOUNDING_BOXES` in mock generators.
- Retain all tabular OCR row hover/selection interactions in `CaseEktpPage.tsx`.
- All tests must pass with `bun test`.

---

### Task 1: Add Unit Tests for DetailedKtpCard Scan Cleanliness

**Files:**
- Create: `src/components/detail/DetailedKtpCard.test.tsx`

**Interfaces:**
- Consumes: `DetailedKtpCard` from `src/components/detail/DetailedKtpCard.tsx`, `ocrDemoPresets` from `src/data/demoPresets.ts`.
- Produces: Test suite validating that no bounding box overlay markup is rendered on the document scan.

- [ ] **Step 1: Write the failing test**

Create `src/components/detail/DetailedKtpCard.test.tsx`:
```tsx
import { describe, it, expect } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DetailedKtpCard } from './DetailedKtpCard';
import { ocrDemoPresets } from '../../data/demoPresets';

describe('DetailedKtpCard bounding box removal', () => {
  it('renders KTP scan image and forensic header', () => {
    const html = renderToStaticMarkup(
      <DetailedKtpCard
        document={ocrDemoPresets.clean}
        customerName="BUDI SANTOSO"
      />
    );

    expect(html).toContain('Pratinjau Forensik Dokumen Fisik (Original Scan)');
    expect(html).toContain('alt="e-KTP Document Full Scan - BUDI SANTOSO"');
  });

  it('does NOT render red dashed bounding boxes even when tamper overlay is active on anomalous document', () => {
    const html = renderToStaticMarkup(
      <DetailedKtpCard
        document={ocrDemoPresets.tampered}
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
        document={ocrDemoPresets.clean}
        customerName="BUDI SANTOSO"
        hoveredFieldKey="nik"
      />
    );

    // Blue coordinate reticle box should NOT be rendered
    expect(html).not.toContain('border-[#2563EB] bg-[#2563EB]/25');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/components/detail/DetailedKtpCard.test.tsx`
Expected: FAIL on the red dashed bounding box check or blue coordinate reticle check because they are still rendered in `DetailedKtpCard.tsx`.

- [ ] **Step 3: Commit test file**

```bash
git add src/components/detail/DetailedKtpCard.test.tsx
git commit -m "test(ektp): add tests for absence of bounding box overlays in DetailedKtpCard"
```

---

### Task 2: Remove Bounding Box Overlays from DetailedKtpCard

**Files:**
- Modify: `src/components/detail/DetailedKtpCard.tsx:35-120`
- Test: `src/components/detail/DetailedKtpCard.test.tsx`

**Interfaces:**
- Consumes: `DetailedKtpCardProps` from `src/components/detail/DetailedKtpCard.tsx`
- Produces: Clean scan viewer without bounding box divs

- [ ] **Step 1: Edit DetailedKtpCard.tsx to remove bounding box overlays**

In `src/components/detail/DetailedKtpCard.tsx`:
1. Remove `const hoveredBox = hoveredFieldKey ? document.ocrFields[hoveredFieldKey]?.boundingBox : undefined;`
2. Remove the JSX block for red dashed bounding boxes:
```tsx
            {/* Red Dashed Bounding Boxes for Anomalous Fields */}
            {showTamperOverlay &&
              Object.entries(document.ocrFields).map(([key, field]) => {
                if (!field.isAnomaly || !field.boundingBox) return null;
                const box = field.boundingBox;
                return (
                  <div
                    key={key}
                    title={field.anomalyReason || `${field.label}: Anomaly detected`}
                    className="absolute border-2 border-dashed border-[#DC2626] bg-[#DC2626]/20 rounded pointer-events-none z-10"
                    style={{
                      top: `${box.y}%`,
                      left: `${box.x}%`,
                      width: `${(box as any).width ?? box.w}%`,
                      height: `${(box as any).height ?? box.h}%`,
                    }}
                  />
                );
              })}
```
3. Remove the JSX block for the hover reticle:
```tsx
            {/* Interactive Coordinate Highlight Reticle on Hover */}
            {hoveredBox && (
              <div
                className="absolute border-2 border-[#2563EB] bg-[#2563EB]/25 rounded pointer-events-none transition-all duration-150 z-10 shadow-[0_0_8px_rgba(37,99,235,0.5)]"
                style={{
                  top: `${hoveredBox.y}%`,
                  left: `${hoveredBox.x}%`,
                  width: `${(hoveredBox as any).width ?? hoveredBox.w}%`,
                  height: `${(hoveredBox as any).height ?? hoveredBox.h}%`,
                }}
              />
            )}
```

- [ ] **Step 2: Run test to verify it passes**

Run: `bun test src/components/detail/DetailedKtpCard.test.tsx`
Expected: PASS (all 3 tests pass)

- [ ] **Step 3: Commit component change**

```bash
git add src/components/detail/DetailedKtpCard.tsx
git commit -m "refactor(ektp): remove anomaly bounding boxes and hover reticle from document scan"
```

---

### Task 3: Update Bounding Box Microcopy References

**Files:**
- Modify: `src/components/detail/subpages/CaseIcrPage.tsx:597-600`
- Modify: `src/components/detail/DetailedSalarySlipCard.tsx:95-99`
- Modify: `src/components/detail/DetailedSalarySlipCard.test.tsx`

**Interfaces:**
- Consumes: None
- Produces: Polished subtext copy across ICR and Salary Slip views

- [ ] **Step 1: Update microcopy in CaseIcrPage.tsx**

In `src/components/detail/subpages/CaseIcrPage.tsx` line 598:
Replace:
```tsx
                <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                  Click or hover any row to pinpoint bounding box
                </p>
```
With:
```tsx
                <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                  Click or hover any row to inspect field
                </p>
```

- [ ] **Step 2: Update microcopy in DetailedSalarySlipCard.tsx**

In `src/components/detail/DetailedSalarySlipCard.tsx` line 97:
Replace:
```tsx
              Inspeksi keaslian dokumen, koordinat bounding box OCR, dan verifikasi stempel
```
With:
```tsx
              Inspeksi keaslian dokumen, ekstraksi OCR, dan verifikasi stempel
```

- [ ] **Step 3: Add test assertion in DetailedSalarySlipCard.test.tsx**

In `src/components/detail/DetailedSalarySlipCard.test.tsx`, add an assertion in the first test verifying the updated subtitle:
```tsx
    expect(html).toContain('Inspeksi keaslian dokumen, ekstraksi OCR, dan verifikasi stempel');
    expect(html).not.toContain('bounding box');
```

- [ ] **Step 4: Run full test suite and verify**

Run: `bun test`
Expected: All tests pass with 0 failures.

- [ ] **Step 5: Commit changes**

```bash
git add src/components/detail/subpages/CaseIcrPage.tsx src/components/detail/DetailedSalarySlipCard.tsx src/components/detail/DetailedSalarySlipCard.test.tsx
git commit -m "refactor(copy): update bounding box references in ICR and salary slip views"
```

---

### Task 4: Final Verification and Typecheck

**Files:**
- None (verification only)

- [ ] **Step 1: Run production build / typecheck**

Run: `bun run build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 2: Run all tests**

Run: `bun test`
Expected: All tests pass with 0 failures.
