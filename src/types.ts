export type RiskLevel = 'low' | 'medium' | 'high';
export type CaseStatus = 'pending' | 'approved' | 'resurvey' | 'rejected_fraud';

export interface NIKValidation {
  nik: string;
  isValidStructure: boolean;
  province: string;
  regency: string;
  district: string;
  birthDate: string;
  gender: 'Laki-laki' | 'Perempuan';
  sequenceNumber: string;
  dukcapilMatch: boolean;
  anomalies: string[];
}

export interface OCRField {
  label: string;
  value: string;
  confidence: number; // 0 - 100
  isAnomaly: boolean;
  anomalyReason?: string;
  boundingBox?: { x: number; y: number; w: number; h: number };
}

export interface DocumentVerification {
  ktpImageUrl: string;
  selfieImageUrl: string;
  slipGajiImageUrl?: string;
  kkImageUrl?: string;
  nikValidation: NIKValidation;
  ocrFields: Record<string, OCRField>;
  tamperScore: number; // 0 - 100
  tamperFlags: string[];
  faceMatchScore: number; // 0 - 100
  isScreenCaptureDetected: boolean;
  isPhysicalCopy: boolean;
  score: number; // Document pillar score (0-100)
}

export interface GeoSurvey {
  surveyorName: string;
  surveyorId: string;
  surveyTimestamp: string;
  targetAddress: string;
  targetLat: number;
  targetLng: number;
  surveyLat: number;
  surveyLng: number;
  distanceMeters: number;
  distanceStatus: 'green' | 'yellow' | 'red'; // <=200m green, 201-1000m yellow, >1000m red
  isMockLocationDetected: boolean;
  mockLocationReason?: string;
  surveyPhotos: {
    id: string;
    caption: string;
    timestamp: string;
    lat: number;
    lng: number;
    isFromInAppCamera: boolean;
    hasExifTamper: boolean;
    photoType: 'house_front' | 'electricity_meter' | 'selfie_with_applicant' | 'street_view';
  }[];
  score: number; // Geo pillar score (0-100)
}

export interface TranscriptSnippet {
  id: string;
  speaker: 'agent' | 'customer';
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
  hasHesitancy?: boolean;
  hesitancyDuration?: number; // seconds
  pitchTremor?: boolean;
  spellingMatch?: boolean; // e.g. for NIK or name
  flagReason?: string;
}

export interface ScriptComplianceItem {
  id: string;
  category: string;
  requirement: string;
  isCompliant: boolean;
  timestampRef?: number;
  note?: string;
}

export interface VoiceVerification {
  callId: string;
  callDuration: number; // in seconds
  agentName: string;
  agentId: string;
  callTimestamp: string;
  audioDurationFormatted: string;
  overallHesitancyCount: number;
  spellingAccuracyScore: number; // 0 - 100
  scriptComplianceScore: number; // 0 - 100
  complianceChecklist: ScriptComplianceItem[];
  transcripts: TranscriptSnippet[];
  voiceFlags: string[];
  score: number; // Voice pillar score (0-100)
}

export interface RiskScoreBreakdown {
  totalScore: number; // 0 - 100
  level: RiskLevel;
  recommendation: string;
  pillars: {
    ektp: { score: number; weight: number; weightedScore: number };
    location: { score: number; weight: number; weightedScore: number };
    voice: { score: number; weight: number; weightedScore: number };
    document: { score: number; weight: number; weightedScore: number };
  };
  reasons: string[];
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  notes: string;
}

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
  riskScore: RiskScoreBreakdown;
  document: DocumentVerification;
  geo: GeoSurvey;
  voice: VoiceVerification;
  auditTrail: AuditLogItem[];
  assignedVerifier?: string;
  decisionNotes?: string;
  decisionTimestamp?: string;
}

export interface SurveyorPoint {
  id: string;
  caseId: string;
  applicantName: string;
  vehicleModel: string;
  branch: string;
  surveyorName: string;
  targetLat: number;
  targetLng: number;
  surveyLat: number;
  surveyLng: number;
  distanceMeters: number;
  status: 'green' | 'yellow' | 'red';
  isMockLocation: boolean;
  surveyTime: string;
}

export interface RiskEngineRules {
  weightEktp: number; // 30
  weightLocation: number; // 30
  weightVoice: number; // 25
  weightDocument: number; // 15
  greenRadiusMeters: number; // 200
  yellowRadiusMeters: number; // 1000
  ocrConfidenceThreshold: number; // 90
  hesitancyThresholdSeconds: number; // 2.0
  autoApproveMaxScore: number; // 39
  autoRejectMinScore: number; // 70
}
