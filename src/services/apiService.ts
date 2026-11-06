import { AuthUser, FinancingCase, CaseStatus, SurveyorPoint } from '../types';
import { mockCases, mockSurveyPoints, DEMO_USERS } from '../data/mockData';

const AUTH_TOKEN_KEY = 'baf_access_token';
let inMemoryToken: string | null = null;

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
 * Standalone zero-network mode: mock fallback is permanently enabled.
 */
export function isMockFallbackEnabled(): boolean {
  return true;
}

/**
 * Resolves API base URL (standalone default is '/api/v1').
 */
export function getApiBaseUrl(override?: string): string {
  return override || '/api/v1';
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
 * In standalone zero-network mode, returns online status with verifin-standalone.
 */
export async function checkBackendHealth(_baseUrl?: string): Promise<{ online: boolean; service?: string }> {
  return { online: true, service: 'verifin-standalone' };
}

/**
 * Authenticate against local DEMO_USERS or generate fallback auth profile.
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
 * Retrieve summary metrics for the operational dashboard from local mock data.
 */
export async function getDashboardSummary(
  _token?: string,
  _options?: { baseUrl?: string; useMockFallback?: boolean }
): Promise<any> {
  return buildMockDashboardSummary(mockCases);
}

/**
 * Retrieve list of financing applications from local mock data.
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
 * Finds the most relevant mockCase template to preserve visual assets (documents, geo, audio, risk score).
 */
export function findMatchingMockCase(app: any): FinancingCase {
  const appId = (app.id || '').toUpperCase();
  const applicantName = (app.consumer?.name || app.customerName || '').toLowerCase().trim();

  // Seeded case ID mappings
  if (appId === 'APP-2026-JKT-001') return mockCases.find((c) => c.id === 'CASE-0941') || mockCases[0];
  if (appId === 'APP-2026-JKT-002') return mockCases.find((c) => c.id === 'CASE-0942') || mockCases[0];
  if (appId === 'APP-2026-BKS-001') return mockCases.find((c) => c.id === 'CASE-0944') || mockCases[0];
  if (appId === 'APP-2026-BKS-002') return mockCases.find((c) => c.id === 'CASE-0943') || mockCases[0];

  // Direct ID match
  const byId = mockCases.find(
    (c) =>
      c.id.toUpperCase() === appId ||
      c.applicationNumber?.toUpperCase() === appId ||
      c.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === appId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  );
  if (byId) return byId;

  // Applicant name mapping
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
 * Map backend application responses into rich FinancingCase objects for UI consumption,
 * preserving visual assets and structure from matched mock cases.
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
 * Map backend GIS points / GeoJSON feature collection items into SurveyorPoint objects.
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
 * Approve an application in standalone client mode.
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
 * Reject an application in standalone client mode.
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
 * Retrieve GIS survey points in standalone client mode.
 */
export async function getGisPoints(
  params?: GisFilterParams,
  _token?: string,
  _options?: ApiOptions
): Promise<any[]> {
  let points = [...mockSurveyPoints];

  if (params?.branchId) {
    const b = params.branchId.toLowerCase();
    points = points.filter((p) =>
      p.branch.toLowerCase().includes(b) ||
      (b === 'jkt-sel' && p.branch.toLowerCase().includes('jakarta')) ||
      (b === 'bks-01' && p.branch.toLowerCase().includes('bekasi'))
    );
  }

  if (params?.status) {
    const s = params.status.toLowerCase();
    points = points.filter((p) => p.status.toLowerCase() === s);
  }

  if (params?.limit !== undefined && params.limit > 0) {
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
