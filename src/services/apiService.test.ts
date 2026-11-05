import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
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
} from './apiService';
import { mockCases } from '../data/mockData';
import { DEMO_USERS } from '../components/auth/LoginView';

describe('apiService - URL Resolution and Environment Config', () => {
  it('returns explicit override when supplied to getApiBaseUrl', () => {
    const customUrl = 'https://custom-gateway.baf.id/api/v1';
    expect(getApiBaseUrl(customUrl)).toBe(customUrl);
  });

  it('resolves a valid base URL containing api/v1', () => {
    const url = getApiBaseUrl();
    expect(url).toContain('/api/v1');
  });

  it('exposes API_CONFIG with getters', () => {
    expect(API_CONFIG.baseUrl).toContain('/api/v1');
    expect(typeof API_CONFIG.isMockFallback).toBe('boolean');
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

describe('apiService - Backend Health Check', () => {
  it('detects live backend at http://localhost:8074', async () => {
    const health = await checkBackendHealth('http://localhost:8074/api/v1');
    expect(health.online).toBe(true);
    expect(health.service).toBe('verifin-backend');
  });

  it('returns offline when endpoint is unreachable', async () => {
    // Port 59999 is guaranteed unreachable locally
    const health = await checkBackendHealth('http://127.0.0.1:59999/api/v1');
    expect(health.online).toBe(false);
  });
});

describe('apiService - Authentication and Login', () => {
  beforeEach(() => {
    clearAuthToken();
  });

  it('authenticates against live backend with valid seeded credentials', async () => {
    const result = await login('dian.pratama@baf.id', 'BafSecure2026!', {
      baseUrl: 'http://localhost:8074/api/v1',
      useMockFallback: false,
    });

    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(20);
    expect(result.user.email).toBe('dian.pratama@baf.id');
    expect(result.user.name).toBe('Dian Pratama');

    // Token must be stored
    expect(getAuthToken()).toBe(result.token);
  });

  it('gracefully falls back to DEMO_USERS when backend login fails and fallback is enabled', async () => {
    const result = await login('dian.pratama@baf.id', 'wrong-password', {
      baseUrl: 'http://localhost:8074/api/v1',
      useMockFallback: true,
    });

    expect(result.token).toBeDefined();
    expect(result.token).toContain('baf_mock_token');
    expect(result.user.email).toBe('dian.pratama@baf.id');
    expect(result.user.name).toBe('Dian Pratama');
    expect(getAuthToken()).toBe(result.token);
  });

  it('gracefully falls back to DEMO_USERS when backend is completely offline', async () => {
    const result = await login('budi.santoso@baf.id', 'any-password', {
      baseUrl: 'http://127.0.0.1:59999/api/v1',
      useMockFallback: true,
    });

    expect(result.token).toBeDefined();
    expect(result.token).toContain('baf_mock_token');
    expect(result.user.email).toBe('budi.santoso@baf.id');
    expect(result.user.name).toBe('Budi Santoso');
  });

  it('throws error on failure when mock fallback is disabled', async () => {
    await expect(
      login('dian.pratama@baf.id', 'wrong-password', {
        baseUrl: 'http://localhost:8074/api/v1',
        useMockFallback: false,
      })
    ).rejects.toThrow();
  });
});

describe('apiService - Dashboard Summary', () => {
  it('retrieves summary from live backend', async () => {
    // Obtain live token first
    const { token } = await login('dian.pratama@baf.id', 'BafSecure2026!', {
      baseUrl: 'http://localhost:8074/api/v1',
    });

    const summary = await getDashboardSummary(token, {
      baseUrl: 'http://localhost:8074/api/v1',
      useMockFallback: false,
    });

    expect(summary).toBeDefined();
    expect(summary.processed_today).toBeGreaterThanOrEqual(1);
    expect(typeof summary.straight_through_rate).toBe('number');
    expect(typeof summary.avg_sla_minutes).toBe('number');
    expect(typeof summary.fraud_blocked_cases).toBe('number');
    expect(typeof summary.active_branches_count).toBe('number');
  });

  it('falls back to mock summary when backend is unreachable and fallback is enabled', async () => {
    const summary = await getDashboardSummary(undefined, {
      baseUrl: 'http://127.0.0.1:59999/api/v1',
      useMockFallback: true,
    });

    expect(summary).toBeDefined();
    expect(summary.processed_today).toBe(mockCases.length);
    expect(summary.target_sla_minutes).toBe(15);
  });

  it('throws error when backend is offline and fallback is disabled', async () => {
    await expect(
      getDashboardSummary(undefined, {
        baseUrl: 'http://127.0.0.1:59999/api/v1',
        useMockFallback: false,
      })
    ).rejects.toThrow();
  });
});

describe('apiService - Applications and Detail', () => {
  let liveToken: string;

  beforeEach(async () => {
    const auth = await login('dian.pratama@baf.id', 'BafSecure2026!', {
      baseUrl: 'http://localhost:8074/api/v1',
    });
    liveToken = auth.token;
  });

  it('retrieves applications list from live backend', async () => {
    const apps = await getApplications(liveToken, {
      baseUrl: 'http://localhost:8074/api/v1',
      useMockFallback: false,
    });

    expect(Array.isArray(apps)).toBe(true);
    expect(apps.length).toBeGreaterThan(0);
    expect(apps[0].id).toBeDefined();
    expect(apps[0].nik).toBeDefined();
  });

  it('falls back to mockCases when backend is unreachable and fallback is enabled', async () => {
    const apps = await getApplications(undefined, {
      baseUrl: 'http://127.0.0.1:59999/api/v1',
      useMockFallback: true,
    });

    expect(Array.isArray(apps)).toBe(true);
    expect(apps.length).toBe(mockCases.length);
    expect(apps[0].id).toBe(mockCases[0].id);
  });

  it('throws when getting applications fails and fallback is disabled', async () => {
    await expect(
      getApplications(undefined, {
        baseUrl: 'http://127.0.0.1:59999/api/v1',
        useMockFallback: false,
      })
    ).rejects.toThrow();
  });

  it('retrieves application detail from live backend by ID', async () => {
    const app = await getApplicationDetail('APP-2026-JKT-001', liveToken, {
      baseUrl: 'http://localhost:8074/api/v1',
      useMockFallback: false,
    });

    expect(app).toBeDefined();
    expect(app.id).toBe('APP-2026-JKT-001');
    expect(app.consumer).toBeDefined();
  });

  it('retrieves application detail from mockCases fallback by ID', async () => {
    const app = await getApplicationDetail('CASE-0941', undefined, {
      baseUrl: 'http://127.0.0.1:59999/api/v1',
      useMockFallback: true,
    });

    expect(app).toBeDefined();
    expect(app.id).toBe('CASE-0941');
    expect(app.customerName).toBe('Rian Hendrawan');
  });

  it('retrieves application detail from mockCases fallback by applicationNumber', async () => {
    const app = await getApplicationDetail('BAF-APP-2026-0941', undefined, {
      baseUrl: 'http://127.0.0.1:59999/api/v1',
      useMockFallback: true,
    });

    expect(app).toBeDefined();
    expect(app.id).toBe('CASE-0941');
  });

  it('throws when application is not found in fallback mock data', async () => {
    await expect(
      getApplicationDetail('NON-EXISTENT-ID', undefined, {
        baseUrl: 'http://127.0.0.1:59999/api/v1',
        useMockFallback: true,
      })
    ).rejects.toThrow('Application NON-EXISTENT-ID not found');
  });
});
