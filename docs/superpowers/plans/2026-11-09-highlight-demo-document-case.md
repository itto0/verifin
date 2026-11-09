# Highlight Demo Document Case in Review Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Visually highlight Case 0941 (`BAF-APP-2026-0941` / Ahmad Fauzi) in the Review Queue table with a "Demo Document" pill badge and a subtle blue row accent to indicate it contains full authentic demo documents.

**Architecture:** Extend the `FinancingCase` interface with an optional `hasDemoDocuments?: boolean` property, mark `CASE-0941` with `hasDemoDocuments: true` in mock data, preserve this flag in API mapping, and conditionally render the row accent styling and inline badge in `ReviewQueueView.tsx`.

**Tech Stack:** TypeScript, React 19, Tailwind CSS v4, Lucide React (`FileText`), Bun test runner.

## Global Constraints

- Scope is strictly limited to the Review Queue table (`ReviewQueueView.tsx`).
- Preserve existing styling and behavior for all non-demo cases (`CASE-0942` through `CASE-0946`).
- Badge copy must be exactly `"Demo Document"`.
- Badge must have a hover tooltip: `"Application with full authentic demo documents (e-KTP, KK, Slip Gaji, Survey & ICR)"`.
- Maintain 100% test pass rate with `bun test`.

---

### Task 1: Add `hasDemoDocuments` to Type Definition, Mock Data, and API Service

**Files:**
- Modify: `src/types.ts`
- Modify: `src/data/mockData.ts`
- Modify: `src/services/apiService.ts`
- Test: `src/components/queue/ReviewQueueView.test.tsx`

**Interfaces:**
- Consumes: Existing `FinancingCase` interface in `src/types.ts`, `mockCases` in `src/data/mockData.ts`.
- Produces: `hasDemoDocuments?: boolean` on `FinancingCase`, `CASE-0941` with `hasDemoDocuments: true`, and preserved in `mapBackendApplicationsToFinancingCases`.

- [ ] **Step 1: Write the failing test for `hasDemoDocuments` flag in mock cases and mapped cases**

Create `src/components/queue/ReviewQueueView.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/components/queue/ReviewQueueView.test.tsx`  
Expected: FAIL because `case0941?.hasDemoDocuments` is undefined.

- [ ] **Step 3: Update `src/types.ts`, `src/data/mockData.ts`, and `src/services/apiService.ts`**

In `src/types.ts`, update `FinancingCase`:
```typescript
export interface FinancingCase {
  id: string;
  applicationNumber: string;
  submittedAt: string;
  customerName: string;
  customerNik: string;
  customerPhone: string;
  branch: string;
  vehicleModel: string;
  downPayment: number;
  loanAmount: number;
  tenorMonths: number;
  monthlyInstallment: number;
  status: CaseStatus;
  riskScore: RiskScore;
  document: DocumentVerification;
  geo: GeoVerification;
  voice: VoiceVerification;
  auditTrail: AuditTrailItem[];
  decisionNotes?: string;
  decisionTimestamp?: string;
  assignedTo?: string;
  hasDemoDocuments?: boolean;
}
```

In `src/data/mockData.ts`, add `hasDemoDocuments: true` to `CASE-0941`:
```typescript
export const mockCases: FinancingCase[] = [
  {
    id: 'CASE-0941',
    applicationNumber: 'BAF-APP-2026-0941',
    hasDemoDocuments: true,
    submittedAt: '2026-10-27 14:15:20',
```

In `src/services/apiService.ts`, ensure `hasDemoDocuments` is explicitly set in `mapBackendApplicationsToFinancingCases`:
```typescript
    return {
      ...base,
      id: app.id || base.id,
      applicationNumber: app.application_number || app.applicationNumber || app.id || base.applicationNumber,
      customerName,
      customerNik,
      customerPhone,
      branch,
      status,
      vehicleModel: app.vehicle_model || app.asset?.model || base.vehicleModel || 'Motor Honda/Yamaha',
      loanAmount: app.loan_amount || app.financial?.loan_amount || base.loanAmount || 25000000,
      monthlyInstallment: app.monthly_installment || app.financial?.monthly_installment || base.monthlyInstallment || 1200000,
      downPayment: app.down_payment || app.financial?.down_payment || base.downPayment || 5000000,
      tenorMonths: app.tenor_months || app.financial?.tenor_months || base.tenorMonths || 24,
      submittedAt: app.created_at ? new Date(app.created_at).toISOString().replace('T', ' ').slice(0, 19) : base.submittedAt,
      hasDemoDocuments: base.hasDemoDocuments ?? matched.hasDemoDocuments,
    };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/components/queue/ReviewQueueView.test.tsx`  
Expected: PASS (2 tests pass).

- [ ] **Step 5: Commit changes**

```bash
git add src/types.ts src/data/mockData.ts src/services/apiService.ts src/components/queue/ReviewQueueView.test.tsx
git commit -m "feat: add hasDemoDocuments property to FinancingCase and mock data"
```

---

### Task 2: Implement "Demo Document" Badge and Row Accent in `ReviewQueueView.tsx`

**Files:**
- Modify: `src/components/queue/ReviewQueueView.tsx`
- Test: `src/components/queue/ReviewQueueView.test.tsx`

**Interfaces:**
- Consumes: `hasDemoDocuments` from `FinancingCase`, `FileText` from `lucide-react`.
- Produces: Rendered Review Queue table with blue left border, light background tint, and `"Demo Document"` pill badge on `CASE-0941`.

- [ ] **Step 1: Add failing test for Review Queue table rendering in `src/components/queue/ReviewQueueView.test.tsx`**

Append to `src/components/queue/ReviewQueueView.test.tsx`:

```tsx
describe('ReviewQueueView Demo Document Highlight', () => {
  it('renders "Demo Document" badge and blue accent border for cases with hasDemoDocuments: true', async () => {
    const { ReviewQueueView } = await import('./ReviewQueueView');
    const html = renderToStaticMarkup(
      <ReviewQueueView
        cases={mockCases}
        onSelectCase={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
      />
    );

    // Verify badge text and title tooltip
    expect(html).toContain('Demo Document');
    expect(html).toContain('Application with full authentic demo documents (e-KTP, KK, Slip Gaji, Survey &amp; ICR)');

    // Verify blue border accent class for highlighted row
    expect(html).toContain('border-l-4 border-l-blue-600');
    expect(html).toContain('bg-blue-50/25');
  });

  it('does not render "Demo Document" badge when no cases have hasDemoDocuments', async () => {
    const { ReviewQueueView } = await import('./ReviewQueueView');
    const plainCases = mockCases.map((c) => ({ ...c, hasDemoDocuments: false }));
    const html = renderToStaticMarkup(
      <ReviewQueueView
        cases={plainCases}
        onSelectCase={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
      />
    );

    expect(html).not.toContain('Demo Document');
    expect(html).not.toContain('border-l-4 border-l-blue-600');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/components/queue/ReviewQueueView.test.tsx`  
Expected: FAIL because `ReviewQueueView` does not yet render `"Demo Document"` or `border-l-4 border-l-blue-600`.

- [ ] **Step 3: Update `src/components/queue/ReviewQueueView.tsx`**

1. Import `FileText` from `lucide-react`:
```tsx
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  ChevronRight,
  FileText
} from 'lucide-react';
```

2. In the table body mapping `sortedCases.map((c) => ...)`:
```tsx
          <tbody className="divide-y divide-[#E5E5E3]">
            {sortedCases.map((c) => {
              const isHigh = c.riskScore.level === 'high';
              const isMedium = c.riskScore.level === 'medium';
              const isDemo = Boolean(c.hasDemoDocuments);

              return (
                <tr
                  key={c.id}
                  onClick={() => onSelectCase(c.id)}
                  className={`transition-colors cursor-pointer group ${
                    isDemo
                      ? 'border-l-4 border-l-blue-600 bg-blue-50/25 hover:bg-blue-50/50'
                      : 'hover:bg-[#F7F7F5]'
                  }`}
                >
                  {/* Column 1: Application ID */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-[#1A1A1A]">
                        {c.applicationNumber}
                      </span>
                      {isDemo && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80"
                          title="Application with full authentic demo documents (e-KTP, KK, Slip Gaji, Survey & ICR)"
                        >
                          <FileText className="w-3 h-3 text-blue-600 shrink-0" />
                          Demo Document
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#6B6B6B] mt-0.5 tabular-nums">
                      {c.submittedAt}
                    </div>
                  </td>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/components/queue/ReviewQueueView.test.tsx`  
Expected: PASS (all 4 tests pass).

- [ ] **Step 5: Run full test suite and type check**

Run: `bun test`  
Expected: All tests pass (>= 181 passing tests).

Run: `npm run lint` (`tsc --noEmit`)  
Expected: Clean exit code 0, no TypeScript compilation errors.

- [ ] **Step 6: Commit changes**

```bash
git add src/components/queue/ReviewQueueView.tsx src/components/queue/ReviewQueueView.test.tsx
git commit -m "feat: render Demo Document badge and row accent in ReviewQueueView"
```
