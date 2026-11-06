# Design Spec: Remove Backend API Usage (Standalone Client Architecture)

- **Date:** 2026-11-06
- **Status:** Approved
- **Topic:** Remove FastAPI backend dependencies and convert VeriFin frontend to a standalone, zero-network service architecture while preserving AI completions.

---

## 1. Overview & Objectives

Currently, VeriFin includes integration code for a FastAPI backend service (`http://localhost:8074` / `/api/v1` and `/health`). When the backend server is not running, the application issues failed `fetch` calls, performs periodic polling for health checks, and triggers timeout delays before falling back to local mock data.

This specification outlines the complete decoupling and removal of backend API usage from the codebase:
1. Convert `src/services/apiService.ts` into a clean, zero-network client service that operates entirely on local in-memory data and `localStorage`.
2. Clean up Vite proxy configurations and environment variables associated with `/api/v1` and `/health`.
3. Simplify the UI in `App.tsx` and `TopBar.tsx` by removing backend polling loops and network health status pills, replacing them with a clean standalone indicator.
4. Keep `src/services/aiService.ts` and AI completions intact so multimodal document vision and audio analysis workflows remain functional.
5. Update unit tests in `src/services/apiService.test.ts` to ensure 100% test passing without mocking failed network requests.

---

## 2. Architecture & Data Layer Refactoring

### 2.1 `src/services/apiService.ts`
All external network `fetch` calls to backend endpoints are removed. The service functions are updated as follows:

| Function | Previous Behavior | New Standalone Behavior |
|---|---|---|
| `login(email, password)` | Sent `POST /api/v1/auth/login` with fallback to `DEMO_USERS`. | Synchronously authenticates against `DEMO_USERS` by email, employee NIK, or name. Generates and stores a local mock session token. |
| `getDashboardSummary()` | Sent `GET /api/v1/dashboard/summary` with fallback. | Returns computed summary metrics directly from `buildMockDashboardSummary(mockCases)`. |
| `getApplications()` | Sent `GET /api/v1/applications` with fallback. | Returns `mockCases` mapped to application objects immediately. |
| `getGisPoints()` | Sent `GET /api/v1/gis/points` with fallback. | Returns `mockSurveyPoints` mapped to GIS points immediately. |
| `approveApplication(id, note)` | Sent `POST /api/v1/workflow/:id/approve` with fallback. | Updates local in-memory case status to `approved`, creates timeline history, and returns success. |
| `rejectApplication(id, reason)` | Sent `POST /api/v1/workflow/:id/reject` with fallback. | Updates local in-memory case status to `rejected_fraud`, records fraud reason, and returns success. |
| `checkBackendHealth()` | Polled `/health` and `/api/v1/health` with a 3-second timeout. | Removed (or returns `{ online: true, service: 'verifin-standalone' }` for backward compatibility). |
| Helper mappings | `mapBackendApplicationsToFinancingCases`, etc. | Preserved for schema compatibility and type stability. |

### 2.2 Preserving AI Completions
- `src/services/aiService.ts` is untouched.
- Vite proxy `/api/ai` pointing to `https://or.flux.id/v1` is retained in `vite.config.ts`.
- Multimodal e-KTP OCR, ICR document analysis, and Audio STT verification continue to operate as currently configured.

---

## 3. UI & Configuration Cleanup

### 3.1 UI State in `src/App.tsx`
- Remove the `checkBackendHealth()` interval/refresh cycle.
- Cases and dashboard metrics load immediately on application mount from local services without network latency.
- Remove `backendOnline` state and unnecessary refresh spinners tied to backend pings.

### 3.2 Header Indicator in `src/components/layout/TopBar.tsx`
- Remove dynamic `API Connected` / `Offline Mode` toggle badges.
- Replace with a subtle, static badge (e.g. `Standalone Mode`) or remove the connection indicator cleanly to avoid UI clutter.

### 3.3 Build & Environment Configuration
- In `vite.config.ts`:
  - Remove proxy configurations for `/api/v1` and `/health` under both `server.proxy` and `preview.proxy`.
  - Retain `/api/ai` proxy.
- In `.env.example`:
  - Remove `VITE_API_BASE_URL`, `VITE_BACKEND_DIRECT_URL`, and `VITE_USE_MOCK_FALLBACK`.
  - Retain `VITE_AI_*` configuration variables.

---

## 4. Testing & Verification

1. **Unit Tests (`src/services/apiService.test.ts`):**
   - Update tests to assert local-first execution of `login`, `getApplications`, `getDashboardSummary`, `getGisPoints`, `approveApplication`, and `rejectApplication`.
   - Remove assertions that depend on network error rejection or fetch timeouts.
2. **End-to-End & Integration Suite:**
   - Run `bun test` to ensure all existing test suites pass.
   - Run `bun run lint` (or `tsc --noEmit`) to verify zero TypeScript compilation errors.
3. **Smoke Verification:**
   - Verify login with demo credentials (`dian.pratama@baf.id`).
   - Verify dashboard metrics, review queue navigation, GIS map points rendering, and case approval/rejection.
