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
import { mockCases } from '../data/mockData';
import { DEMO_USERS } from '../components/auth/LoginView';

const liveBackendHealth = await checkBackendHealth('http://localhost:8074/api/v1');
const isLiveBackend = liveBackendHealth.online;

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
  it.skipIf(!isLiveBackend)('detects live backend at http://localhost:8074', async () => {
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

  it.skipIf(!isLiveBackend)('authenticates against live backend with valid seeded credentials', async () => {
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
  it.skipIf(!isLiveBackend)('retrieves summary from live backend', async () => {
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
    if (!isLiveBackend) return;
    const auth = await login('dian.pratama@baf.id', 'BafSecure2026!', {
      baseUrl: 'http://localhost:8074/api/v1',
    });
    liveToken = auth.token;
  });

  it.skipIf(!isLiveBackend)('retrieves applications list from live backend', async () => {
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

  it.skipIf(!isLiveBackend)('retrieves application detail from live backend by ID', async () => {
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
    expect(app.customerName).toBe('Ahmad Fauzi');
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

describe('Workflow & GIS Services', () => {
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
    // Verify default structure preserved for unknown applicant
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

  test('getGisPoints returns survey points from backend or fallback', async () => {
    const points = await getGisPoints();
    expect(Array.isArray(points)).toBe(true);
    expect(points.length).toBeGreaterThan(0);
  });

  test('getGisPoints throws error when backend is offline and fallback is disabled', async () => {
    await expect(
      getGisPoints(undefined, undefined, {
        baseUrl: 'http://127.0.0.1:59999/api/v1',
        useMockFallback: false,
      })
    ).rejects.toThrow();
  });

  test('approveApplication executes against backend or mock fallback', async () => {
    const res = await approveApplication('APP-2026-JKT-001', 'Verified and approved');
    expect(res).toBeDefined();
    expect(res.status === 'approved' || res.status === 'disetujui' || res.success === true).toBe(true);
  });

  test('approveApplication executes against live backend with fallback support', async () => {
    const { token } = await login('dian.pratama@baf.id', 'BafSecure2026!', {
      baseUrl: 'http://localhost:8074/api/v1',
    });
    const res = await approveApplication('APP-2026-JKT-001', 'Verified and approved by Dian Pratama', token, {
      baseUrl: 'http://localhost:8074/api/v1',
    });
    expect(res).toBeDefined();
    expect(res.status === 'approved' || res.status === 'disetujui' || res.success === true).toBe(true);
  });

  test('approveApplication throws error when backend is offline and fallback is disabled', async () => {
    await expect(
      approveApplication('APP-2026-JKT-001', 'Verified and approved', undefined, {
        baseUrl: 'http://127.0.0.1:59999/api/v1',
        useMockFallback: false,
      })
    ).rejects.toThrow();
  });

  test('rejectApplication executes against backend or mock fallback', async () => {
    const res = await rejectApplication('APP-2026-BKS-002', 'Fake GPS flagged');
    expect(res).toBeDefined();
    expect(res.status === 'rejected_fraud' || res.status === 'ditolak' || res.success === true).toBe(true);
  });

  test('rejectApplication throws error when backend is offline and fallback is disabled', async () => {
    await expect(
      rejectApplication('APP-2026-BKS-002', 'Fake GPS flagged', undefined, {
        baseUrl: 'http://127.0.0.1:59999/api/v1',
        useMockFallback: false,
      })
    ).rejects.toThrow();
  });

  test.skipIf(!isLiveBackend)('getGisPoints retrieves GIS points with live token from backend', async () => {
    const { token } = await login('dian.pratama@baf.id', 'BafSecure2026!', {
      baseUrl: 'http://localhost:8074/api/v1',
    });
    const points = await getGisPoints(undefined, token, {
      baseUrl: 'http://localhost:8074/api/v1',
      useMockFallback: false,
    });
    expect(Array.isArray(points)).toBe(true);
    expect(points.length).toBeGreaterThan(0);
  });

  test.skipIf(!isLiveBackend)('maps live backend GIS points to SurveyorPoint format', async () => {
    const { token } = await login('dian.pratama@baf.id', 'BafSecure2026!', {
      baseUrl: 'http://localhost:8074/api/v1',
    });
    const rawPoints = await getGisPoints(undefined, token, {
      baseUrl: 'http://localhost:8074/api/v1',
      useMockFallback: false,
    });
    const surveyorPoints = mapBackendGisPointsToSurveyorPoints(rawPoints);
    expect(surveyorPoints.length).toBeGreaterThan(0);
    expect(surveyorPoints[0].caseId).toBeDefined();
    expect(['green', 'yellow', 'red']).toContain(surveyorPoints[0].status);
  });

  test.skipIf(!isLiveBackend)('maps live backend applications to FinancingCase array', async () => {
    const { token } = await login('dian.pratama@baf.id', 'BafSecure2026!', {
      baseUrl: 'http://localhost:8074/api/v1',
    });
    const rawApps = await getApplications(token, {
      baseUrl: 'http://localhost:8074/api/v1',
      useMockFallback: false,
    });
    const cases = mapBackendApplicationsToFinancingCases(rawApps);
    expect(cases.length).toBeGreaterThan(0);
    expect(cases[0].id).toBeDefined();
    expect(cases[0].customerName).toBeDefined();
    expect(cases[0].document).toBeDefined();
    expect(cases[0].geo).toBeDefined();
    expect(cases[0].voice).toBeDefined();
    expect(cases[0].riskScore).toBeDefined();
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

  it('resolves consumer object format from backend payload', () => {
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
