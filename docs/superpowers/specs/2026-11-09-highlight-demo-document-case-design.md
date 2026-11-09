# Highlight Demo Document Case in Review Queue - Design Spec

**Date:** 2026-11-09  
**Topic:** Highlight the case containing authentic demo documents (`CASE-0941` / Ahmad Fauzi) in the Review Queue  
**Status:** Approved  

---

## 1. Executive Summary & Goals

In the VeriFin verification underwriting application, only `CASE-0941` (`BAF-APP-2026-0941` / Ahmad Fauzi) has full authentic public demo documents (physical e-KTP, Kartu Keluarga, corporate payroll slip, geotagged survey photos, CMO inspection form, and ATR/BPN land certificate SHM). Other cases use placeholders or stock images.

To make this immediately identifiable for demo evaluators and underwriters, `CASE-0941` must be visually highlighted in the Review Queue table with a dedicated **"Demo Document"** pill badge and row accent styling.

---

## 2. Requirements & Scope

- **Scope:** Exclusively targeted to the Review Queue table (`ReviewQueueView.tsx`), per user selection.
- **Data-Driven Architecture:** Introduce an optional boolean property `hasDemoDocuments?: boolean` to the `FinancingCase` interface.
- **Visual Design:**
  - Row styling: Add a prominent left border (`border-l-4 border-l-blue-600`) and a soft ambient tint (`bg-blue-50/25 hover:bg-blue-50/50`).
  - Badge: Display an inline pill badge next to the Application ID with the text `"Demo Document"` and a `FileText` icon (`bg-blue-50 text-blue-700 border border-blue-200`). Include a descriptive tooltip on hover.
- **Maintainability:** Ensure backend application mapping (`apiService.ts`) preserves `hasDemoDocuments`.

---

## 3. Detailed Technical Architecture

### 3.1 Type Definition (`src/types.ts`)
Add `hasDemoDocuments?: boolean` to `FinancingCase`:
```typescript
export interface FinancingCase {
  id: string;
  applicationNumber: string;
  hasDemoDocuments?: boolean;
  // ... other properties
}
```

### 3.2 Mock Data (`src/data/mockData.ts`)
Set `hasDemoDocuments: true` for `CASE-0941`:
```typescript
export const mockCases: FinancingCase[] = [
  {
    id: 'CASE-0941',
    applicationNumber: 'BAF-APP-2026-0941',
    hasDemoDocuments: true,
    // ...
  },
  // CASE-0942 through CASE-0946 have hasDemoDocuments omitted or undefined
];
```

### 3.3 Backend Mapping Service (`src/services/apiService.ts`)
In `mapBackendApplicationsToFinancingCases` / `findMatchingMockCase`:
Ensure `hasDemoDocuments: match.hasDemoDocuments` is copied when generating the mapped `FinancingCase`.

### 3.4 Review Queue Component (`src/components/queue/ReviewQueueView.tsx`)
In `sortedCases.map((c) => ...)`:
- Add `FileText` to Lucide icon imports if not already imported.
- Compute conditional styling for row:
  - If `c.hasDemoDocuments === true`: append `border-l-4 border-l-blue-600 bg-blue-50/25 hover:bg-blue-50/50`.
  - Else: use default neutral styling (`hover:bg-[#F7F7F5]`).
- In Column 1 (Application ID & Time):
  - Render an inline pill badge beside `c.applicationNumber`:
  ```tsx
  <div className="flex items-center gap-1.5 flex-wrap">
    <span className="text-xs font-semibold text-[#1A1A1A]">{c.applicationNumber}</span>
    {c.hasDemoDocuments && (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80"
        title="Application with full authentic demo documents (e-KTP, KK, Slip Gaji, Survey & ICR)"
      >
        <FileText className="w-3 h-3 text-blue-600 shrink-0" />
        Demo Document
      </span>
    )}
  </div>
  ```

---

## 4. Verification & Testing

1. **Automated Unit Tests:**
   - Create or update `ReviewQueueView.test.tsx` to verify:
     - The row for `CASE-0941` contains the `Demo Document` text and badge.
     - The row has the accent border class `border-l-blue-600`.
     - Other cases do not contain the `Demo Document` badge.
2. **Regression Testing:**
   - Run `npm test` across all suites to ensure no regressions in existing components and tests.
3. **Manual Check:**
   - Check rendered layout in browser to confirm visual polish, accessibility contrast, and hover states.
