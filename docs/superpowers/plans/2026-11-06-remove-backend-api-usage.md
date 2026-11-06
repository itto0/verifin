# Remove Backend API Usage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple VeriFin from FastAPI backend HTTP dependencies and convert to a standalone, zero-network service architecture while preserving AI completions.

**Architecture:** Convert `src/services/apiService.ts` to execute locally against in-memory mock datasets and `localStorage` without issuing `fetch` requests. Clean up backend health check polling and connection toggles in `App.tsx` and `TopBar.tsx`. Remove `/api/v1` and `/health` proxies in `vite.config.ts` and backend environment variables in `.env.example`, maintaining all multimodal AI completions (`src/services/aiService.ts` and `/api/ai` proxy).

**Tech Stack:** React 19, TypeScript, Vite, TailwindCSS v4, Bun test runner.

## Global Constraints

- Backend API removal only; preserve AI completions and vision/voice features intact in `src/services/aiService.ts` and `vite.config.ts`.
- Zero network requests for core business data, login, workflow decisions, GIS, and dashboard metrics.
- Keep helper types and conversion functions (`mapBackendApplicationsToFinancingCases`, `mapBackendGisPointsToSurveyorPoints`, `findMatchingMockCase`, etc.) to prevent regressions in dependent components.
- All unit and integration tests must pass (`bun test`).
- Zero TypeScript diagnostics errors (`tsc --noEmit`).

---

### Task 1: Decouple `src/services/apiService.ts` to Local Standalone Service

**Files:**
- Modify: `src/services/apiService.ts`
- Test: `src/services/apiService.test.ts`

**Interfaces:**
- Consumes: `mockCases`, `mockSurveyPoints`, `DEMO_USERS` from `src/data/mockData`
- Produces: `login(email, password?)`, `getDashboardSummary()`, `getApplications()`, `getApplicationDetail(id)`, `getGisPoints(params?)`, `approveApplication(id, notes?)`, `rejectApplication(id, reason?)`, `checkBackendHealth()`, `isMockFallbackEnabled()`, `getApiBaseUrl()`, `API_CONFIG`, and data mapping functions.

- [ ] **Step 1: Update `src/services/apiService.ts` to remove backend fetch calls and run fully in-memory**

Replace the implementation of `checkBackendHealth`, `login`, `getDashboardSummary`, `getApplications`, `getApplicationDetail`, `approveApplication`, `rejectApplication`, and `getGisPoints` with zero-network synchronous operations that return mock data and update local state:

```typescript
import { AuthUser, FinancingCase, CaseStatus, SurveyorPoint } from '../types';
import { mockCases, mockSurveyPoints, DEMO_USERS } from '../data/mockData';

const AUTH_TOKEN_KEY = 'baf_access_token';
let inMemoryToken: string | null = null;

/**
 * Safely access an environment variable across Vite browser, Node, and Bun test environments.
 */
function getEnvVar(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
}

/**
 * Helper to compute two-letter initials from full name.
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Check if graceful fallback to mock data is enabled (always true in standalone mode).
 */
export function isMockFallbackEnabled(): boolean {
  return true;
}

/**
 * Resolves the client API base URL (standalone mock).
 */
export function getApiBaseUrl(override?: string): string {
  if (override) return override;
  return '/api/v1';
}

/**
 * Read the current authentication token.
 */
export function getAuthToken(): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
  return inMemoryToken;
}

/**
 * Persist the authentication token.
 */
export function setAuthToken(token: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
  inMemoryToken = token;
}

/**
 * Remove the stored authentication token.
 */
export function clearAuthToken(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
  inMemoryToken = null;
}

/**
 * Build request headers with optional Bearer authorization.
 */
export function buildAuthHeaders(token?: string): Record<string, string> {
  const effectiveToken = token || getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (effectiveToken) {
    headers['Authorization'] = `Bearer ${effectiveToken}`;
  }
  return headers;
}

/**
 * Map user response to frontend AuthUser interface.
 */
export function mapBackendUserToAuthUser(backendUser: any, fallbackEmail?: string): AuthUser {
  if (!backendUser) {
    return { ...DEMO_USERS[0] };
  }

  const email = backendUser.email || fallbackEmail || '';
  const demoMatch = DEMO_USERS.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() ||
      u.name.toLowerCase() === (backendUser.full_name || '').toLowerCase()
  );

  const fullName = backendUser.full_name || backendUser.name || demoMatch?.name || 'BAF Verifier';
  return {
    id: backendUser.id ? String(backendUser.id) : (demoMatch?.id || 'USR-001'),
    name: fullName,
    email: email || demoMatch?.email || 'user@baf.id',
    role: demoMatch?.role || (backendUser.role ? String(backendUser.role) : 'Senior Verifier'),
    level: demoMatch?.level || 'Level 2 Verifier',
    branch: backendUser.branch_name || demoMatch?.branch || 'BAF Jakarta Selatan',
    avatarInitials: demoMatch?.avatarInitials || getInitials(fullName),
    employeeNik: demoMatch?.employeeNik || 'BAF-EMP-8842',
  };
}

/**
 * Compute aggregated dashboard metrics from mockCases.
 */
export function buildMockDashboardSummary(cases: FinancingCase[] = mockCases) {
  const pendingCases = cases.filter((c) => c.status === 'pending');
  const approvedCases = cases.filter((c) => c.status === 'approved');
  const rejectedCases = cases.filter((c) => c.status === 'rejected_fraud' || c.riskScore?.level === 'high');

  const fraudBlockedAmount = rejectedCases.reduce((sum, c) => sum + (c.loanAmount || 0), 0);
  const total = cases.length || 1;
  const strRate = Math.round((approvedCases.length / total) * 100);

  return {
    processed_today: cases.length,
    pending_manual_review: pendingCases.length,
    auto_approved_count: approvedCases.length,
    fraud_blocked_cases: rejectedCases.length,
    fraud_blocked_amount_rp: fraudBlockedAmount,
    straight_through_rate: strRate,
    avg_sla_minutes: 4.2,
    target_sla_minutes: 15,
    active_branches_count: new Set(cases.map((c) => c.branch)).size,
    processed_growth_pct: 18,
    total_cases: cases.length,
    high_risk_count: rejectedCases.length,
  };
}

/**
 * Check backend service health (standalone client returns online: true).
 */
export async function checkBackendHealth(_baseUrl?: string): Promise<{ online: boolean; service?: string }> {
  return {
    online: true,
    service: 'verifin-standalone',
  };
}

/**
 * Authenticate with demo accounts (zero network call).
 */
export async function login(
  email: string,
  _password?: string,
  _options?: { baseUrl?: string; useMockFallback?: boolean }
): Promise<{ user: AuthUser; token: string }> {
  const normalized = email.trim().toLowerCase();
  const matched = DEMO_USERS.find(
    (u) =>
      u.email.toLowerCase() === normalized ||
      u.employeeNik.toLowerCase() === normalized ||
      u.name.toLowerCase() === normalized
  );

  const fallbackUser: AuthUser = matched || {
    id: `USR-${Date.now().toString().slice(-4)}`,
    name: normalized.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    email: normalized.includes('@') ? normalized : `${normalized}@baf.id`,
    role: 'Senior Verifier',
    level: 'Level 2 Verifier',
    branch: 'Jakarta South Hub',
    avatarInitials: normalized.slice(0, 2).toUpperCase(),
    employeeNik: 'BAF-EMP-8842',
  };

  const syntheticToken = `baf_mock_token_${fallbackUser.id}_${Date.now()}`;
  setAuthToken(syntheticToken);
  return { user: fallbackUser, token: syntheticToken };
}

/**
 * Retrieve summary metrics for the operational dashboard.
 */
export async function getDashboardSummary(
  _token?: string,
  _options?: { baseUrl?: string; useMockFallback?: boolean }
): Promise<any> {
  return buildMockDashboardSummary(mockCases);
}

/**
 * Retrieve list of financing applications.
 */
export async function getApplications(
  _token?: string,
  _options?: { baseUrl?: string; useMockFallback?: boolean }
): Promise<any[]> {
  return mockCases;
}

/**
 * Retrieve detail of a single application by ID or applicationNumber.
 */
export async function getApplicationDetail(
  id: string,
  _token?: string,
  _options?: { baseUrl?: string; useMockFallback?: boolean }
): Promise<any> {
  const normalizedId = id.trim().toLowerCase();
  const found = mockCases.find(
    (c) =>
      c.id.toLowerCase() === normalizedId ||
      c.applicationNumber?.toLowerCase() === normalizedId ||
      c.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === normalizedId.replace(/[^a-zA-Z0-9]/g, '')
  );

  if (found) {
    return found;
  }

  throw new Error(`Application ${id} not found`);
}

export interface GisFilterParams {
  branchId?: string;
  status?: string;
  limit?: number;
}

export interface ApiOptions {
  baseUrl?: string;
  useMockFallback?: boolean;
}

/**
 * Normalizes backend application status to UI CaseStatus.
 */
function mapBackendStatusToCaseStatus(rawStatus?: string): CaseStatus {
  if (!rawStatus) return 'pending';
  const s = rawStatus.toLowerCase();
  switch (s) {
    case 'siap_analisa':
    case 'review_manual':
    case 'verifikasi_dokumen':
    case 'verifikasi_lapangan':
    case 'draft':
    case 'pending':
      return 'pending';
    case 'disetujui':
    case 'approved':
      return 'approved';
    case 'ditolak':
    case 'rejected':
    case 'rejected_fraud':
      return 'rejected_fraud';
    case 'resurvey':
      return 'resurvey';
    default:
      return 'pending';
  }
}

/**
 * Finds the most relevant mockCase template to preserve visual assets.
 */
export function findMatchingMockCase(app: any): FinancingCase {
  const appId = (app.id || '').toUpperCase();
  const applicantName = (app.consumer?.name || app.customerName || '').toLowerCase().trim();

  if (appId === 'APP-2026-JKT-001') return mockCases.find((c) => c.id === 'CASE-0941') || mockCases[0];
  if (appId === 'APP-2026-JKT-002') return mockCases.find((c) => c.id === 'CASE-0942') || mockCases[0];
  if (appId === 'APP-2026-BKS-001') return mockCases.find((c) => c.id === 'CASE-0944') || mockCases[0];
  if (appId === 'APP-2026-BKS-002') return mockCases.find((c) => c.id === 'CASE-0943') || mockCases[0];

  const byId = mockCases.find(
    (c) =>
      c.id.toUpperCase() === appId ||
      c.applicationNumber?.toUpperCase() === appId ||
      c.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === appId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  );
  if (byId) return byId;

  if (applicantName.includes('ahmad') || applicantName.includes('fauzi')) {
    if (applicantName.includes('pratama')) {
      return mockCases.find((c) => c.id === 'CASE-0945') || mockCases[0];
    }
    return mockCases.find((c) => c.id === 'CASE-0941') || mockCases[0];
  }
  if (applicantName.includes('siti') || applicantName.includes('nurhaliza')) {
    return mockCases.find((c) => c.id === 'CASE-0942') || mockCases[0];
  }
  if (applicantName.includes('doni') || applicantName.includes('kurniawan')) {
    return mockCases.find((c) => c.id === 'CASE-0943') || mockCases[0];
  }
  if (applicantName.includes('irawan')) {
    return mockCases.find((c) => c.id === 'CASE-0946') || mockCases[0];
  }
  if (applicantName.includes('hendra') || applicantName.includes('wijaya')) {
    return mockCases.find((c) => c.id === 'CASE-0944') || mockCases[0];
  }
  if (applicantName.includes('ratna') || applicantName.includes('sari')) {
    return mockCases.find((c) => c.id === 'CASE-0945') || mockCases[0];
  }
  if (applicantName.includes('budi') || applicantName.includes('santoso')) {
    return mockCases.find((c) => c.id === 'CASE-0946') || mockCases[0];
  }

  const byName = mockCases.find((c) => c.customerName.toLowerCase() === applicantName);
  if (byName) return byName;

  return mockCases[0];
}

/**
 * Map applications into rich FinancingCase objects for UI consumption.
 */
export function mapBackendApplicationsToFinancingCases(apps: any[]): FinancingCase[] {
  if (!Array.isArray(apps)) return [];

  return apps.map((app) => {
    const matched = findMatchingMockCase(app);
    const base: FinancingCase = JSON.parse(JSON.stringify(matched));

    const customerName = app.consumer?.name || app.customerName || base.customerName || 'Applicant';
    const customerNik = app.consumer?.nik || app.customerNik || app.nik || base.customerNik || '';
    const customerPhone = app.consumer?.phone || app.customerPhone || base.customerPhone || '0812-3456-7890';
    const branch =
      app.branch_name ||
      app.branch?.name ||
      (app.branch_code === 'JKT-SEL'
        ? 'BAF Jakarta Selatan'
        : app.branch_code === 'BKS-01'
        ? 'BAF Kota Bekasi'
        : app.branch) ||
      base.branch ||
      'BAF Jakarta Selatan';

    const status = mapBackendStatusToCaseStatus(app.status);

    if (customerNik && base.document?.nikValidation) {
      base.document.nikValidation.nik = customerNik;
    }
    if (customerName && base.document?.ocrFields?.['Nama']) {
      base.document.ocrFields['Nama'].value = customerName;
    }
    if (app.consumer?.domicile_address && base.geo) {
      base.geo.targetAddress = app.consumer.domicile_address;
    }

    if (app.risk_score !== undefined && base.riskScore) {
      const scoreVal =
        typeof app.risk_score === 'number'
          ? app.risk_score <= 1.0 && app.risk_score > 0
            ? Math.round(app.risk_score * 100)
            : Math.round(app.risk_score)
          : base.riskScore.totalScore;
      base.riskScore.totalScore = scoreVal;
      if (status === 'rejected_fraud' || scoreVal >= 70) {
        base.riskScore.level = 'high';
      } else if (scoreVal >= 40) {
        base.riskScore.level = 'medium';
      } else {
        base.riskScore.level = 'low';
      }
    }

    return {
      ...base,
      id: app.id || base.id,
      applicationNumber: app.application_number || app.applicationNumber || app.id || base.applicationNumber,
      customerName,
      customerNik,
      customerPhone,
      branch,
      status,
      submittedAt: app.created_at || app.submittedAt || base.submittedAt || new Date().toISOString(),
      vehicleModel:
        app.vehicle_model ||
        app.vehicleModel ||
        (app.product_type === 'car' ? 'Toyota Avanza 1.5 G' : 'Yamaha NMAX 155') ||
        base.vehicleModel,
      downPayment: app.down_payment ?? app.downPayment ?? base.downPayment ?? 5000000,
      loanAmount: app.loan_amount ?? app.loanAmount ?? base.loanAmount ?? 25000000,
      tenorMonths: app.tenor_months ?? app.tenorMonths ?? base.tenorMonths ?? 35,
      monthlyInstallment: app.monthly_installment ?? app.monthlyInstallment ?? base.monthlyInstallment ?? 1250000,
      assignedVerifier: app.assigned_verifikator_name || base.assignedVerifier,
      decisionNotes: app.notes || base.decisionNotes,
      decisionTimestamp: app.updated_at || base.decisionTimestamp,
    };
  });
}

/**
 * Map GIS points / GeoJSON feature collection items into SurveyorPoint objects.
 */
export function mapBackendGisPointsToSurveyorPoints(points: any[]): SurveyorPoint[] {
  if (!Array.isArray(points)) return [];

  return points.map((item, index) => {
    const p = item.properties
      ? {
          ...item.properties,
          longitude: item.geometry?.coordinates?.[0],
          latitude: item.geometry?.coordinates?.[1],
        }
      : item;

    const rawStatus = (p.status || 'green').toLowerCase();
    const status: 'green' | 'yellow' | 'red' =
      rawStatus === 'red' ? 'red' : rawStatus === 'yellow' ? 'yellow' : 'green';

    return {
      id: p.id || p.survey_id || `PT-0${index + 1}`,
      caseId: p.application_id || p.caseId || p.id || `APP-${index + 1}`,
      applicantName: p.consumer_name || p.applicantName || 'Applicant',
      vehicleModel: p.vehicle_model || p.vehicleModel || 'Yamaha NMAX 155',
      branch: p.branch_code || p.branch || 'JKT-SEL',
      surveyorName: p.surveyor_name || p.surveyorName || 'Surveyor',
      targetLat: Number(p.target_latitude ?? p.targetLat ?? p.latitude ?? -6.2383),
      targetLng: Number(p.target_longitude ?? p.targetLng ?? p.longitude ?? 106.8532),
      surveyLat: Number(p.latitude ?? p.surveyLat ?? -6.2385),
      surveyLng: Number(p.longitude ?? p.surveyLng ?? 106.8534),
      distanceMeters: Number(p.distance_meters ?? p.distanceMeters ?? 0),
      status,
      isMockLocation: Boolean(p.is_mock_location ?? p.mock_location_detected ?? p.isMockLocation),
      surveyTime: p.survey_time || p.device_timestamp || p.surveyTime || new Date().toISOString(),
    };
  });
}

/**
 * Approve an application synchronously.
 */
export async function approveApplication(
  id: string,
  notes?: string,
  _token?: string,
  _options?: ApiOptions
): Promise<any> {
  const effectiveNotes = notes && notes.trim().length >= 10 ? notes.trim() : 'Approved by verifikator';
  return {
    id,
    status: 'approved',
    notes: effectiveNotes,
    success: true,
  };
}

/**
 * Reject an application synchronously.
 */
export async function rejectApplication(
  id: string,
  reason?: string,
  _token?: string,
  _options?: ApiOptions
): Promise<any> {
  const effectiveReason = reason && reason.trim().length >= 5 ? reason.trim() : 'Rejected by verifikator';
  return {
    id,
    status: 'rejected_fraud',
    reason: effectiveReason,
    success: true,
  };
}

/**
 * Retrieve GIS survey points.
 */
export async function getGisPoints(
  params?: GisFilterParams,
  _token?: string,
  _options?: ApiOptions
): Promise<any[]> {
  let points = [...mockSurveyPoints];
  if (params?.branchId) {
    points = points.filter((p) => p.branch === params.branchId);
  }
  if (params?.status) {
    points = points.filter((p) => p.status.toLowerCase() === params.status!.toLowerCase());
  }
  if (params?.limit && params.limit > 0) {
    points = points.slice(0, params.limit);
  }
  return points;
}

export const API_CONFIG = {
  get baseUrl() {
    return getApiBaseUrl();
  },
  get isMockFallback() {
    return isMockFallbackEnabled();
  },
};
```

- [ ] **Step 2: Commit Task 1 changes**

```bash
git add src/services/apiService.ts
git commit -m "feat(apiService): convert to zero-network standalone client service"
```

---

### Task 2: Update Unit Tests in `src/services/apiService.test.ts` for Standalone Operation

**Files:**
- Modify: `src/services/apiService.test.ts`

**Interfaces:**
- Consumes: `apiService.ts` functions (`login`, `getDashboardSummary`, `getApplications`, `getApplicationDetail`, `getGisPoints`, `approveApplication`, `rejectApplication`, `checkBackendHealth`, mapping helpers)
- Produces: 100% passing test assertions without skipped tests, timeouts, or network calls.

- [ ] **Step 1: Write standalone assertions in `src/services/apiService.test.ts`**

Update `src/services/apiService.test.ts` to:
1. Remove `const liveBackendHealth = await checkBackendHealth(...)` top-level await and `isLiveBackend` checks.
2. Assert `checkBackendHealth()` resolves with `{ online: true, service: 'verifin-standalone' }`.
3. Assert `login()` succeeds with seeded credentials and fallback accounts immediately without network calls.
4. Assert `getDashboardSummary()`, `getApplications()`, and `getGisPoints()` return structured mock datasets without delay.
5. Retain data mapping tests (`mapBackendApplicationsToFinancingCases`, `mapBackendGisPointsToSurveyorPoints`, `findMatchingMockCase`).

```typescript
import { describe, expect, it, test, beforeEach, afterEach } from 'bun:test';
import {
  getApiBaseUrl,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  buildAuthHeaders,
  checkBackendHealth,
  mapBackendUserToAuthUser,
  buildMockDashboardSummary,
  login,
  getDashboardSummary,
  getApplications,
  getApplicationDetail,
  isMockFallbackEnabled,
  API_CONFIG,
  approveApplication,
  rejectApplication,
  getGisPoints,
  mapBackendApplicationsToFinancingCases,
  mapBackendGisPointsToSurveyorPoints,
  findMatchingMockCase,
} from './apiService';
import { mockCases, mockSurveyPoints } from '../data/mockData';
import { DEMO_USERS } from '../components/auth/LoginView';

describe('apiService - URL Resolution and Environment Config', () => {
  it('returns explicit override when supplied to getApiBaseUrl', () => {
    const customUrl = 'https://custom-gateway.baf.id/api/v1';
    expect(getApiBaseUrl(customUrl)).toBe(customUrl);
  });

  it('resolves a valid base URL containing api/v1', () => {
    const url = getApiBaseUrl();
    expect(url).toBe('/api/v1');
  });

  it('exposes API_CONFIG with getters', () => {
    expect(API_CONFIG.baseUrl).toBe('/api/v1');
    expect(API_CONFIG.isMockFallback).toBe(true);
  });

  it('defaults isMockFallbackEnabled to true', () => {
    expect(isMockFallbackEnabled()).toBe(true);
  });
});

describe('apiService - Token Storage and Auth Headers', () => {
  beforeEach(() => {
    clearAuthToken();
  });

  afterEach(() => {
    clearAuthToken();
  });

  it('manages auth token lifecycle (set, get, clear)', () => {
    expect(getAuthToken()).toBeNull();

    const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample';
    setAuthToken(sampleToken);
    expect(getAuthToken()).toBe(sampleToken);

    clearAuthToken();
    expect(getAuthToken()).toBeNull();
  });

  it('builds auth headers with stored token', () => {
    setAuthToken('test-token-12345');
    const headers = buildAuthHeaders();

    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Authorization']).toBe('Bearer test-token-12345');
  });

  it('builds auth headers with explicit token override', () => {
    setAuthToken('stored-token');
    const headers = buildAuthHeaders('override-token');

    expect(headers['Authorization']).toBe('Bearer override-token');
  });

  it('builds auth headers without Authorization when no token is present', () => {
    clearAuthToken();
    const headers = buildAuthHeaders();

    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Authorization']).toBeUndefined();
  });
});

describe('apiService - User Mapping and Dashboard Calculation', () => {
  it('maps backend user to AuthUser and enriches with demo profile metadata', () => {
    const backendUser = {
      id: '4d4d823f-bbcf-4245-884d-1ebe91d82930',
      username: 'dian_pratama',
      email: 'dian.pratama@baf.id',
      full_name: 'Dian Pratama',
      role: 'verifikator',
      branch_name: 'BAF Jakarta Selatan',
      is_active: true,
    };

    const authUser = mapBackendUserToAuthUser(backendUser);
    expect(authUser.name).toBe('Dian Pratama');
    expect(authUser.email).toBe('dian.pratama@baf.id');
    expect(authUser.avatarInitials).toBe('DP');
    expect(authUser.employeeNik).toBe('BAF-EMP-8842');
    expect(authUser.role).toBe('Senior Verifier');
    expect(authUser.level).toBe('Level 2 Verifier');
  });

  it('generates initials for new/unmatched backend users', () => {
    const customUser = {
      id: 'custom-uuid',
      username: 'agung_saputra',
      email: 'agung.saputra@baf.id',
      full_name: 'Agung Saputra',
      role: 'surveyor',
      branch_name: 'BAF Kota Bekasi',
    };

    const authUser = mapBackendUserToAuthUser(customUser);
    expect(authUser.name).toBe('Agung Saputra');
    expect(authUser.avatarInitials).toBe('AS');
  });

  it('computes mock dashboard summary correctly from mockCases', () => {
    const summary = buildMockDashboardSummary(mockCases);

    expect(summary.processed_today).toBe(mockCases.length);
    expect(summary.target_sla_minutes).toBe(15);
    expect(typeof summary.straight_through_rate).toBe('number');
    expect(typeof summary.pending_manual_review).toBe('number');
    expect(typeof summary.fraud_blocked_cases).toBe('number');
    expect(typeof summary.fraud_blocked_amount_rp).toBe('number');
    expect(summary.active_branches_count).toBeGreaterThan(0);
  });
});

describe('apiService - Standalone Service Health & Authentication', () => {
  beforeEach(() => {
    clearAuthToken();
  });

  it('reports standalone service health', async () => {
    const health = await checkBackendHealth();
    expect(health.online).toBe(true);
    expect(health.service).toBe('verifin-standalone');
  });

  it('authenticates demo users synchronously', async () => {
    const result = await login('dian.pratama@baf.id', 'BafSecure2026!');
    expect(result.token).toBeDefined();
    expect(result.token).toContain('baf_mock_token');
    expect(result.user.email).toBe('dian.pratama@baf.id');
    expect(result.user.name).toBe('Dian Pratama');
    expect(getAuthToken()).toBe(result.token);
  });

  it('authenticates arbitrary user with generated fallback profile', async () => {
    const result = await login('budi.santoso@baf.id', 'any-password');
    expect(result.token).toBeDefined();
    expect(result.token).toContain('baf_mock_token');
    expect(result.user.email).toBe('budi.santoso@baf.id');
    expect(result.user.name).toBe('Budi Santoso');
  });
});

describe('apiService - Standalone Dashboard, Applications & Workflow', () => {
  it('retrieves summary directly from mock dataset', async () => {
    const summary = await getDashboardSummary();
    expect(summary).toBeDefined();
    expect(summary.processed_today).toBe(mockCases.length);
    expect(summary.target_sla_minutes).toBe(15);
  });

  it('retrieves applications list from mockCases', async () => {
    const apps = await getApplications();
    expect(Array.isArray(apps)).toBe(true);
    expect(apps.length).toBe(mockCases.length);
    expect(apps[0].id).toBe(mockCases[0].id);
  });

  it('retrieves application detail by ID', async () => {
    const app = await getApplicationDetail('CASE-0941');
    expect(app).toBeDefined();
    expect(app.id).toBe('CASE-0941');
    expect(app.customerName).toBe('Ahmad Fauzi');
  });

  it('retrieves application detail by applicationNumber', async () => {
    const app = await getApplicationDetail('BAF-APP-2026-0941');
    expect(app).toBeDefined();
    expect(app.id).toBe('CASE-0941');
  });

  it('throws when application is not found', async () => {
    await expect(getApplicationDetail('NON-EXISTENT-ID')).rejects.toThrow('Application NON-EXISTENT-ID not found');
  });

  it('executes approveApplication synchronously', async () => {
    const res = await approveApplication('CASE-0941', 'Manual verification approved');
    expect(res).toBeDefined();
    expect(res.status).toBe('approved');
    expect(res.success).toBe(true);
  });

  it('executes rejectApplication synchronously', async () => {
    const res = await rejectApplication('CASE-0942', 'Fake GPS flagged');
    expect(res).toBeDefined();
    expect(res.status).toBe('rejected_fraud');
    expect(res.success).toBe(true);
  });

  it('retrieves and filters GIS survey points', async () => {
    const allPoints = await getGisPoints();
    expect(Array.isArray(allPoints)).toBe(true);
    expect(allPoints.length).toBe(mockSurveyPoints.length);

    const limited = await getGisPoints({ limit: 2 });
    expect(limited.length).toBe(2);
  });
});

describe('Workflow & Mapping Helpers', () => {
  test('mapBackendApplicationsToFinancingCases converts backend items to FinancingCase', () => {
    const rawApps = [
      {
        id: 'APP-2026-JKT-001',
        product_type: 'motorcycle',
        status: 'siap_analisa',
        risk_score: 0.15,
        consumer: {
          name: 'Ahmad Fauzi',
          nik: '317401******0001',
          domicile_address: 'Jl. Tebet Barat Dalam No. 12',
        },
      },
    ];
    const cases = mapBackendApplicationsToFinancingCases(rawApps);
    expect(cases.length).toBe(1);
    expect(cases[0].id).toBe('APP-2026-JKT-001');
    expect(cases[0].customerName).toBe('Ahmad Fauzi');
    expect(cases[0].status).toBe('pending');
    expect(cases[0].document).toBeDefined();
    expect(cases[0].geo).toBeDefined();
    expect(cases[0].voice).toBeDefined();
  });

  test('mapBackendApplicationsToFinancingCases handles status mapping and fallback defaults', () => {
    const rawApps = [
      { id: 'APP-01', status: 'siap_analisa', consumer: { name: 'Siti Nurhaliza' } },
      { id: 'APP-02', status: 'review_manual', consumer: { name: 'Hendra Wijaya' } },
      { id: 'APP-03', status: 'disetujui', consumer: { name: 'Doni Kurniawan' } },
      { id: 'APP-04', status: 'ditolak', consumer: { name: 'Ratna Sari' } },
      { id: 'APP-05', status: 'unknown_status', consumer: { name: 'Unknown User' } },
    ];
    const mapped = mapBackendApplicationsToFinancingCases(rawApps);
    expect(mapped[0].status).toBe('pending');
    expect(mapped[1].status).toBe('pending');
    expect(mapped[2].status).toBe('approved');
    expect(mapped[3].status).toBe('rejected_fraud');
    expect(mapped[4].status).toBe('pending');
    expect(mapped[4].document).toBeDefined();
    expect(mapped[4].riskScore).toBeDefined();
  });

  test('mapBackendGisPointsToSurveyorPoints converts GIS payload to SurveyorPoint list', () => {
    const rawPoints = [
      {
        id: 'PT-01',
        application_id: 'APP-2026-JKT-001',
        consumer_name: 'Ahmad Fauzi',
        surveyor_name: 'Bambang Sudirgo',
        latitude: -6.2385,
        longitude: 106.8534,
        target_latitude: -6.2383,
        target_longitude: 106.8532,
        distance_meters: 32.0,
        status: 'GREEN',
        is_mock_location: false,
        survey_time: '2026-11-05T08:30:00Z',
      },
    ];
    const pts = mapBackendGisPointsToSurveyorPoints(rawPoints);
    expect(pts.length).toBe(1);
    expect(pts[0].caseId).toBe('APP-2026-JKT-001');
    expect(pts[0].status).toBe('green');
    expect(pts[0].isMockLocation).toBe(false);
  });
});

describe('apiService - findMatchingMockCase Alignment', () => {
  it('maps seeded application IDs to corresponding core cases', () => {
    expect(findMatchingMockCase({ id: 'APP-2026-JKT-001' }).id).toBe('CASE-0941');
    expect(findMatchingMockCase({ id: 'APP-2026-JKT-002' }).id).toBe('CASE-0942');
    expect(findMatchingMockCase({ id: 'APP-2026-BKS-001' }).id).toBe('CASE-0944');
    expect(findMatchingMockCase({ id: 'APP-2026-BKS-002' }).id).toBe('CASE-0943');
  });

  it('maps synchronized customer names to corresponding cases', () => {
    expect(findMatchingMockCase({ customerName: 'Ahmad Fauzi' }).id).toBe('CASE-0941');
    expect(findMatchingMockCase({ customerName: 'Siti Nurhaliza' }).id).toBe('CASE-0942');
    expect(findMatchingMockCase({ customerName: 'Hendra Wijaya' }).id).toBe('CASE-0944');
    expect(findMatchingMockCase({ customerName: 'Doni Kurniawan' }).id).toBe('CASE-0943');
  });

  it('resolves consumer object format from payload', () => {
    expect(findMatchingMockCase({ consumer: { name: 'Ahmad Fauzi' } }).id).toBe('CASE-0941');
    expect(findMatchingMockCase({ consumer: { name: 'Siti Nurhaliza' } }).id).toBe('CASE-0942');
    expect(findMatchingMockCase({ consumer: { name: 'Hendra Wijaya' } }).id).toBe('CASE-0944');
    expect(findMatchingMockCase({ consumer: { name: 'Doni Kurniawan' } }).id).toBe('CASE-0943');
  });

  it('handles partial name matches via first and last names', () => {
    expect(findMatchingMockCase({ customerName: 'ahmad' }).id).toBe('CASE-0941');
    expect(findMatchingMockCase({ customerName: 'fauzi' }).id).toBe('CASE-0941');
    expect(findMatchingMockCase({ customerName: 'siti' }).id).toBe('CASE-0942');
    expect(findMatchingMockCase({ customerName: 'nurhaliza' }).id).toBe('CASE-0942');
    expect(findMatchingMockCase({ customerName: 'doni' }).id).toBe('CASE-0943');
    expect(findMatchingMockCase({ customerName: 'kurniawan' }).id).toBe('CASE-0943');
    expect(findMatchingMockCase({ customerName: 'hendra' }).id).toBe('CASE-0944');
    expect(findMatchingMockCase({ customerName: 'wijaya' }).id).toBe('CASE-0944');
  });

  it('disambiguates between Hendra Wijaya and Hendra Irawan', () => {
    expect(findMatchingMockCase({ customerName: 'Hendra Wijaya' }).id).toBe('CASE-0944');
    expect(findMatchingMockCase({ customerName: 'Hendra Irawan' }).id).toBe('CASE-0946');
  });

  it('disambiguates between Ahmad Fauzi and Ahmad Fauzi Pratama', () => {
    expect(findMatchingMockCase({ customerName: 'Ahmad Fauzi' }).id).toBe('CASE-0941');
    expect(findMatchingMockCase({ customerName: 'Ahmad Fauzi Pratama' }).id).toBe('CASE-0945');
  });

  it('preserves direct case ID lookups', () => {
    expect(findMatchingMockCase({ id: 'CASE-0941' }).id).toBe('CASE-0941');
    expect(findMatchingMockCase({ id: 'CASE-0942' }).id).toBe('CASE-0942');
    expect(findMatchingMockCase({ id: 'CASE-0943' }).id).toBe('CASE-0943');
    expect(findMatchingMockCase({ id: 'CASE-0944' }).id).toBe('CASE-0944');
    expect(findMatchingMockCase({ id: 'CASE-0945' }).id).toBe('CASE-0945');
    expect(findMatchingMockCase({ id: 'CASE-0946' }).id).toBe('CASE-0946');
  });

  it('falls back safely to default mock case for completely unknown app', () => {
    const unknown = findMatchingMockCase({ id: 'UNKNOWN-ID', customerName: 'Non Existent' });
    expect(unknown).toBeDefined();
    expect(unknown.id).toBe('CASE-0941');
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `bun test src/services/apiService.test.ts`
Expected: PASS (0 skipped, 0 failed)

- [ ] **Step 3: Commit Task 2 changes**

```bash
git add src/services/apiService.test.ts
git commit -m "test(apiService): update unit tests for standalone client execution"
```

---

### Task 3: Clean up UI Polling and Connectivity Status in `src/App.tsx` & `src/components/layout/TopBar.tsx`

**Files:**
- Modify: `src/App.tsx:21-79`, `src/App.tsx:112-156`, `src/App.tsx:191-204`
- Modify: `src/components/layout/TopBar.tsx:17-41`, `src/components/layout/TopBar.tsx:77-106`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `buildMockDashboardSummary`, `mockCases`
- Produces: Clean client UI lifecycle without background network polling loops or connection toggles.

- [ ] **Step 1: Update `src/components/layout/TopBar.tsx`**

Make `backendOnline`, `onRefreshBackend`, and `isRefreshing` optional or replaced with a static `Standalone Mode` badge:

```tsx
// in src/components/layout/TopBar.tsx
interface TopBarProps {
  pageTitle: string;
  onOpenMobileMenu: () => void;
  cases: FinancingCase[];
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  backendOnline?: boolean | null;
  onRefreshBackend?: () => void;
  isRefreshing?: boolean;
}
```

In the header JSX, replace the dynamic button with:

```tsx
      {/* Right Zone: Strictly Bell Icon & Dropdown Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Standalone Client Mode Pill */}
        <div
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/30"
          title="VeriFin running in Standalone Client Mode"
        >
          <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
          <span className="font-semibold">Standalone Mode</span>
        </div>
```

- [ ] **Step 2: Update `src/App.tsx`**

1. Remove `checkBackendHealth` from imports.
2. Replace `refreshBackendData` and polling with initial synchronous state setup:
```typescript
  const [dashboardSummary, setDashboardSummary] = useState<any>(() => buildMockDashboardSummary(mockCases));
```
3. Remove `backendOnline` state and `isRefreshing` state.
4. In `handleUpdateCaseStatus`, remove `await refreshBackendData()` so local updates are not re-fetched.
5. In `<TopBar>`, remove the unused backend status props.

- [ ] **Step 3: Run `bun test src/App.test.tsx`**

Run: `bun test src/App.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit Task 3 changes**

```bash
git add src/App.tsx src/components/layout/TopBar.tsx
git commit -m "refactor(ui): remove backend health polling and add standalone mode badge"
```

---

### Task 4: Remove Backend Proxy & Environment Configuration

**Files:**
- Modify: `vite.config.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: Vite configuration
- Produces: Proxies `/api/ai` only; removes `/api/v1` and `/health`.

- [ ] **Step 1: Clean up `vite.config.ts`**

Remove `/api/v1` and `/health` proxies from both `server.proxy` and `preview.proxy`:

```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api/ai': {
          target: 'https://or.flux.id/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ai/, ''),
          secure: false,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      port: 3000,
      proxy: {
        '/api/ai': {
          target: 'https://or.flux.id/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ai/, ''),
          secure: false,
        },
      },
    },
  };
});
```

- [ ] **Step 2: Clean up `.env.example`**

Remove backend integration lines:

```bash
VITE_AI_BASE_URL="/api/ai"
VITE_AI_API_KEY="sk-your-ai-api-key"
VITE_AI_MODEL="antigravity/gemini-3-flash-preview"
```

- [ ] **Step 3: Commit Task 4 changes**

```bash
git add vite.config.ts .env.example
git commit -m "build(config): remove backend api proxies and environment variables"
```

---

### Task 5: End-to-End Test Suite Verification & Type Check

**Files:**
- Test all files in repository

- [ ] **Step 1: Run TypeScript compiler check**

Run: `bun x tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Run full test suite**

Run: `bun test`
Expected: 158 tests pass (0 fail) across all 16 test files.

- [ ] **Step 3: Commit any final cleanup if needed**
