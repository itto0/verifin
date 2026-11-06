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

  it('resolves default base URL containing api/v1', () => {
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

  it('handles null or undefined backend user gracefully with default demo user', () => {
    const authUser = mapBackendUserToAuthUser(null);
    expect(authUser).toBeDefined();
    expect(authUser.email).toBe(DEMO_USERS[0].email);
    expect(authUser.name).toBe(DEMO_USERS[0].name);

    const authUserUndefined = mapBackendUserToAuthUser(undefined);
    expect(authUserUndefined.email).toBe(DEMO_USERS[0].email);
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
  it('resolves with online status and verifin-standalone service name', async () => {
    const health = await checkBackendHealth();
    expect(health.online).toBe(true);
    expect(health.service).toBe('verifin-standalone');
  });

  it('resolves consistently when custom URL is passed', async () => {
    const health = await checkBackendHealth('https://custom-url/api/v1');
    expect(health.online).toBe(true);
    expect(health.service).toBe('verifin-standalone');
  });
});

describe('apiService - Authentication and Login', () => {
  beforeEach(() => {
    clearAuthToken();
  });

  it('succeeds with seeded credentials (dian.pratama@baf.id) immediately without network calls', async () => {
    const result = await login('dian.pratama@baf.id', 'any-password');

    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.token).toContain('baf_mock_token');
    expect(result.user.email).toBe('dian.pratama@baf.id');
    expect(result.user.name).toBe('Dian Pratama');
    expect(result.user.employeeNik).toBe('BAF-EMP-8842');

    // Token must be stored
    expect(getAuthToken()).toBe(result.token);
  });

  it('succeeds with arbitrary credentials (budi.santoso@baf.id) immediately without network calls', async () => {
    const result = await login('budi.santoso@baf.id', 'any-password');

    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.token).toContain('baf_mock_token');
    expect(result.user.email).toBe('budi.santoso@baf.id');
    expect(result.user.name).toBe('Budi Santoso');

    expect(getAuthToken()).toBe(result.token);
  });

  it('normalizes credentials with leading/trailing whitespace and mixed case', async () => {
    const result = await login('   DIAN.PRATAMA@BAF.ID   ', 'pass');

    expect(result.user.email).toBe('dian.pratama@baf.id');
    expect(result.user.name).toBe('Dian Pratama');
  });

  it('handles identifier without domain by generating @baf.id email', async () => {
    const result = await login('riki.hidayat', 'pass');

    expect(result.user.email).toBe('riki.hidayat@baf.id');
    expect(result.token).toBeDefined();
  });
});

describe('apiService - Dashboard Summary', () => {
  it('returns structured mock datasets without delay', async () => {
    const summary = await getDashboardSummary();

    expect(summary).toBeDefined();
    expect(summary.processed_today).toBe(mockCases.length);
    expect(summary.target_sla_minutes).toBe(15);
    expect(typeof summary.straight_through_rate).toBe('number');
    expect(typeof summary.pending_manual_review).toBe('number');
    expect(typeof summary.fraud_blocked_cases).toBe('number');
    expect(typeof summary.fraud_blocked_amount_rp).toBe('number');
    expect(summary.active_branches_count).toBeGreaterThan(0);
  });
});

describe('apiService - Applications and Detail', () => {
  it('returns structured mock datasets for getApplications without delay', async () => {
    const apps = await getApplications();

    expect(Array.isArray(apps)).toBe(true);
    expect(apps.length).toBe(mockCases.length);
    expect(apps[0].id).toBe(mockCases[0].id);
    expect(apps[0].customerName).toBe(mockCases[0].customerName);
  });

  it('returns application detail by ID', async () => {
    const app = await getApplicationDetail('CASE-0941');

    expect(app).toBeDefined();
    expect(app.id).toBe('CASE-0941');
    expect(app.customerName).toBe('Ahmad Fauzi');
  });

  it('returns application detail by applicationNumber', async () => {
    const app = await getApplicationDetail('BAF-APP-2026-0941');

    expect(app).toBeDefined();
    expect(app.id).toBe('CASE-0941');
    expect(app.customerName).toBe('Ahmad Fauzi');
  });

  it('matches application detail case-insensitively', async () => {
    const app = await getApplicationDetail('case-0941');

    expect(app).toBeDefined();
    expect(app.id).toBe('CASE-0941');
  });

  it('rejects with "Application NON-EXISTENT-ID not found" when application does not exist', async () => {
    await expect(getApplicationDetail('NON-EXISTENT-ID')).rejects.toThrow(
      'Application NON-EXISTENT-ID not found'
    );
  });
});

describe('apiService - GIS Services and Actions', () => {
  it('returns structured mock datasets for getGisPoints without delay', async () => {
    const points = await getGisPoints();

    expect(Array.isArray(points)).toBe(true);
    expect(points.length).toBe(mockSurveyPoints.length);
    expect(points[0].id).toBe(mockSurveyPoints[0].id);
    expect(points[0].targetLat).toBeDefined();
    expect(points[0].surveyLat).toBeDefined();
  });

  it('filters GIS points by branchId and status', async () => {
    const jktPoints = await getGisPoints({ branchId: 'JKT-SEL' });
    expect(jktPoints.length).toBeGreaterThan(0);
    expect(jktPoints.every((p) => p.branch.toLowerCase().includes('jakarta') || p.branch === 'JKT-SEL')).toBe(true);

    const greenPoints = await getGisPoints({ status: 'green' });
    expect(greenPoints.length).toBeGreaterThan(0);
    expect(greenPoints.every((p) => p.status === 'green')).toBe(true);
  });

  it('limits result count correctly without off-by-one errors', async () => {
    const onePoint = await getGisPoints({ limit: 1 });
    expect(onePoint.length).toBe(1);

    const twoPoints = await getGisPoints({ limit: 2 });
    expect(twoPoints.length).toBe(2);

    const zeroLimit = await getGisPoints({ limit: 0 });
    expect(zeroLimit.length).toBe(mockSurveyPoints.length);
  });

  it('approveApplication returns success with appropriate status synchronously', async () => {
    const res = await approveApplication('APP-2026-JKT-001', 'Verified document and approved');

    expect(res).toBeDefined();
    expect(res.id).toBe('APP-2026-JKT-001');
    expect(res.status).toBe('approved');
    expect(res.success).toBe(true);
    expect(res.notes).toBe('Verified document and approved');
  });

  it('approveApplication applies default notes when notes are omitted or short', async () => {
    const res = await approveApplication('APP-2026-JKT-001');

    expect(res.notes).toBe('Approved by verifikator');

    const resShort = await approveApplication('APP-2026-JKT-001', 'Short');
    expect(resShort.notes).toBe('Approved by verifikator');
  });

  it('rejectApplication returns success with appropriate status synchronously', async () => {
    const res = await rejectApplication('APP-2026-BKS-002', 'Fake GPS flagged');

    expect(res).toBeDefined();
    expect(res.id).toBe('APP-2026-BKS-002');
    expect(res.status).toBe('rejected_fraud');
    expect(res.success).toBe(true);
    expect(res.reason).toBe('Fake GPS flagged');
  });

  it('rejectApplication applies default reason when reason is omitted or short', async () => {
    const res = await rejectApplication('APP-2026-BKS-002');

    expect(res.reason).toBe('Rejected by verifikator');

    const resShort = await rejectApplication('APP-2026-BKS-002', 'Bad');
    expect(resShort.reason).toBe('Rejected by verifikator');
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
    // Verify default structure preserved for unknown applicant
    expect(mapped[4].document).toBeDefined();
    expect(mapped[4].riskScore).toBeDefined();
  });

  test('mapBackendApplicationsToFinancingCases handles null or non-array gracefully', () => {
    expect(mapBackendApplicationsToFinancingCases(null as any)).toEqual([]);
    expect(mapBackendApplicationsToFinancingCases(undefined as any)).toEqual([]);
    expect(mapBackendApplicationsToFinancingCases({} as any)).toEqual([]);
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

  test('mapBackendGisPointsToSurveyorPoints handles null or non-array gracefully', () => {
    expect(mapBackendGisPointsToSurveyorPoints(null as any)).toEqual([]);
    expect(mapBackendGisPointsToSurveyorPoints(undefined as any)).toEqual([]);
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

  it('handles empty or null-like application objects gracefully', () => {
    expect(findMatchingMockCase({}).id).toBe('CASE-0941');
    expect(findMatchingMockCase({ consumer: null } as any).id).toBe('CASE-0941');
  });
});
