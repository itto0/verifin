export interface BranchReportMetric {
  branchName: string;
  totalSubmissions: number;
  autoApproved: number;
  manualReviewed: number;
  rejectedFraud: number;
  fraudRatePercent: number;
  avgProcessTimeMinutes: number;
  mockGpsDetectedCount: number;
  voiceHesitancyRatePercent: number;
}

export const mockBranchMetrics: BranchReportMetric[] = [
  {
    branchName: 'BAF Jakarta Selatan',
    totalSubmissions: 312,
    autoApproved: 198,
    manualReviewed: 84,
    rejectedFraud: 30,
    fraudRatePercent: 9.6,
    avgProcessTimeMinutes: 14.2,
    mockGpsDetectedCount: 7,
    voiceHesitancyRatePercent: 12.4,
  },
  {
    branchName: 'BAF Kota Bekasi',
    totalSubmissions: 284,
    autoApproved: 220,
    manualReviewed: 52,
    rejectedFraud: 12,
    fraudRatePercent: 4.2,
    avgProcessTimeMinutes: 9.8,
    mockGpsDetectedCount: 2,
    voiceHesitancyRatePercent: 5.1,
  },
  {
    branchName: 'BAF Jakarta Barat',
    totalSubmissions: 245,
    autoApproved: 164,
    manualReviewed: 66,
    rejectedFraud: 15,
    fraudRatePercent: 6.1,
    avgProcessTimeMinutes: 11.5,
    mockGpsDetectedCount: 3,
    voiceHesitancyRatePercent: 7.8,
  },
  {
    branchName: 'BAF Jakarta Pusat',
    totalSubmissions: 195,
    autoApproved: 110,
    manualReviewed: 55,
    rejectedFraud: 30,
    fraudRatePercent: 15.4,
    avgProcessTimeMinutes: 16.8,
    mockGpsDetectedCount: 9,
    voiceHesitancyRatePercent: 18.2,
  },
  {
    branchName: 'BAF Bandung Soekarno-Hatta',
    totalSubmissions: 340,
    autoApproved: 275,
    manualReviewed: 53,
    rejectedFraud: 12,
    fraudRatePercent: 3.5,
    avgProcessTimeMinutes: 8.5,
    mockGpsDetectedCount: 1,
    voiceHesitancyRatePercent: 4.3,
  },
  {
    branchName: 'BAF Surabaya Timur',
    totalSubmissions: 260,
    autoApproved: 195,
    manualReviewed: 51,
    rejectedFraud: 14,
    fraudRatePercent: 5.4,
    avgProcessTimeMinutes: 10.2,
    mockGpsDetectedCount: 2,
    voiceHesitancyRatePercent: 6.0,
  }
];

export interface SystemAuditEntry {
  id: string;
  timestamp: string;
  category: 'SECURITY' | 'VERIFIER_DECISION' | 'RISK_CALCULATION' | 'COMPLIANCE_OJK';
  actor: string;
  targetRef: string;
  action: string;
  details: string;
  ipAddress: string;
  integrityHash: string; // SHA-256 simulation
}

export const mockSystemAuditEntries: SystemAuditEntry[] = [
  {
    id: 'AUD-88291',
    timestamp: '2026-10-27 14:18:12 WIB',
    category: 'RISK_CALCULATION',
    actor: 'Engine VeriFin v2.4 (Automated)',
    targetRef: 'CASE-0941',
    action: 'Multi-Pillar Score Evaluated: 84 (HIGH)',
    details: 'Flag e-KTP font mismatch (score 88) + Geo mock location detected (score 92) + Voice hesitation 3.4s.',
    ipAddress: '10.240.12.8 (Internal VPC)',
    integrityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    id: 'AUD-88290',
    timestamp: '2026-10-27 14:15:20 WIB',
    category: 'COMPLIANCE_OJK',
    actor: 'BAF Mobile Gateway',
    targetRef: 'CASE-0941',
    action: 'UU PDP Data Consent Captured',
    details: 'Konsumen mencentang klausul persetujuan pemrosesan data biometrik & pengecekan SLIK OJK.',
    ipAddress: '180.252.164.22',
    integrityHash: 'a45f92c10b7e25a894cd39e44bc601337422f981041c2c366ff2f99015091722',
  },
  {
    id: 'AUD-88289',
    timestamp: '2026-10-27 13:45:00 WIB',
    category: 'VERIFIER_DECISION',
    actor: 'Auto-Approval Service',
    targetRef: 'CASE-0942',
    action: 'Auto Approval Granted',
    details: 'Skor 16 (Risiko Rendah). Tidak ada anomali terdeteksi, diteruskan ke core LOS BAF untuk pencairan.',
    ipAddress: '10.240.12.15',
    integrityHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  },
  {
    id: 'AUD-88288',
    timestamp: '2026-10-27 11:45:00 WIB',
    category: 'VERIFIER_DECISION',
    actor: 'Dian Pratama (Senior Verifier)',
    targetRef: 'CASE-0944',
    action: 'Re-survey Requested',
    details: 'Foto fisik rumah di Surabaya buram akibat hujan lebat, ditugaskan ulang ke Dimas Wicaksono.',
    ipAddress: '192.168.10.45',
    integrityHash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
  },
  {
    id: 'AUD-88287',
    timestamp: '2026-10-27 09:40:00 WIB',
    category: 'SECURITY',
    actor: 'Aditya (Verifikator Senior)',
    targetRef: 'CASE-0946',
    action: 'Fraud Blacklist Triggered',
    details: 'Hendra Irawan diblacklist: NIK ganda dengan nasabah Bambang Hermanto & terindikasi calo sindikat.',
    ipAddress: '192.168.10.12',
    integrityHash: '88d4266fd4e6338d13b845fcf289579d209c897823b9217da3e161936f031589',
  }
];
