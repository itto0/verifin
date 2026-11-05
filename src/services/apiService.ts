import { AuthUser, FinancingCase } from '../types';
import { mockCases } from '../data/mockData';
import { DEMO_USERS } from '../components/auth/LoginView';

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
 * Check if graceful fallback to mock data is enabled (defaults to true).
 */
export function isMockFallbackEnabled(): boolean {
  const val = getEnvVar('VITE_USE_MOCK_FALLBACK');
  if (val === undefined || val === '') return true;
  return val.toLowerCase() !== 'false';
}

/**
 * Resolves the backend API base URL:
 * - If custom override provided, returns it.
 * - In browser environment: prefers `/api/v1` for Vite reverse proxy.
 * - In test / server runtime: resolves to VITE_BACKEND_DIRECT_URL or `http://localhost:8074/api/v1`.
 */
export function getApiBaseUrl(override?: string): string {
  if (override) return override;

  const envApiBase = getEnvVar('VITE_API_BASE_URL');
  const envDirect = getEnvVar('VITE_BACKEND_DIRECT_URL');

  if (typeof window !== 'undefined') {
    if (!envApiBase || envApiBase.includes('localhost:8074') || envApiBase.startsWith('/')) {
      return '/api/v1';
    }
    return envApiBase;
  }

  // Non-browser (Bun / Node / Vitest)
  if (envApiBase && (envApiBase.startsWith('http://') || envApiBase.startsWith('https://'))) {
    return envApiBase;
  }
  if (envDirect) {
    return envDirect;
  }
  if (envApiBase && envApiBase.startsWith('/')) {
    return `http://localhost:8074${envApiBase}`;
  }
  return 'http://localhost:8074/api/v1';
}

/**
 * Read the current JWT authentication token.
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
 * Persist the JWT authentication token.
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
 * Map FastAPI user response to frontend AuthUser interface,
 * augmenting with DEMO_USERS metadata where applicable.
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
 * Compute aggregated dashboard metrics from mockCases for mock fallback.
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
 * Check backend service health.
 * Attempts root `/health` then `/api/v1/health` with a 3s timeout.
 */
export async function checkBackendHealth(baseUrl?: string): Promise<{ online: boolean; service?: string }> {
  const targetBase = baseUrl || getApiBaseUrl();
  const rootUrl = targetBase.replace(/\/api\/v1\/?$/, '');

  const candidates: string[] = [];
  if (rootUrl) {
    candidates.push(`${rootUrl}/health`);
  } else {
    candidates.push('/health');
  }
  candidates.push(`${targetBase}/health`);

  for (const url of candidates) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          online: true,
          service: (data && data.service) ? data.service : 'verifin-backend',
        };
      }
    } catch {
      // Try next candidate
    } finally {
      clearTimeout(timer);
    }
  }

  return { online: false };
}

/**
 * Authenticate with the backend or fall back to demo accounts.
 */
export async function login(
  email: string,
  password: string,
  options?: { baseUrl?: string; useMockFallback?: boolean }
): Promise<{ user: AuthUser; token: string }> {
  const base = options?.baseUrl || getApiBaseUrl();
  const allowFallback = options?.useMockFallback !== undefined ? options.useMockFallback : isMockFallbackEnabled();

  try {
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: email,
        password: password,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const token = data.access_token;
      if (token) {
        setAuthToken(token);
      }
      const user = mapBackendUserToAuthUser(data.user, email);
      return { user, token };
    }

    if (!allowFallback) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.detail || `Login failed with status ${res.status}`);
    }
  } catch (err: any) {
    if (!allowFallback) {
      throw err;
    }
  }

  // Graceful fallback to DEMO_USERS
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
  token?: string,
  options?: { baseUrl?: string; useMockFallback?: boolean }
): Promise<any> {
  const base = options?.baseUrl || getApiBaseUrl();
  const allowFallback = options?.useMockFallback !== undefined ? options.useMockFallback : isMockFallbackEnabled();
  const headers = buildAuthHeaders(token);

  try {
    const res = await fetch(`${base}/dashboard/summary`, {
      method: 'GET',
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
    if (!allowFallback) {
      throw new Error(`Failed to fetch dashboard summary: status ${res.status}`);
    }
  } catch (err) {
    if (!allowFallback) {
      throw err;
    }
  }

  return buildMockDashboardSummary(mockCases);
}

/**
 * Retrieve list of financing applications.
 */
export async function getApplications(
  token?: string,
  options?: { baseUrl?: string; useMockFallback?: boolean }
): Promise<any[]> {
  const base = options?.baseUrl || getApiBaseUrl();
  const allowFallback = options?.useMockFallback !== undefined ? options.useMockFallback : isMockFallbackEnabled();
  const headers = buildAuthHeaders(token);

  try {
    const res = await fetch(`${base}/applications`, {
      method: 'GET',
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
    if (!allowFallback) {
      throw new Error(`Failed to fetch applications: status ${res.status}`);
    }
  } catch (err) {
    if (!allowFallback) {
      throw err;
    }
  }

  return mockCases;
}

/**
 * Retrieve detail of a single application by ID or applicationNumber.
 */
export async function getApplicationDetail(
  id: string,
  token?: string,
  options?: { baseUrl?: string; useMockFallback?: boolean }
): Promise<any> {
  const base = options?.baseUrl || getApiBaseUrl();
  const allowFallback = options?.useMockFallback !== undefined ? options.useMockFallback : isMockFallbackEnabled();
  const headers = buildAuthHeaders(token);

  try {
    const res = await fetch(`${base}/applications/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
    if (!allowFallback) {
      throw new Error(`Failed to fetch application ${id}: status ${res.status}`);
    }
  } catch (err) {
    if (!allowFallback) {
      throw err;
    }
  }

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

export const API_CONFIG = {
  get baseUrl() {
    return getApiBaseUrl();
  },
  get isMockFallback() {
    return isMockFallbackEnabled();
  },
};
