import { DocumentVerification, VoiceVerification } from '../types';
import { IcrDocumentSample } from './icrData';
import { defaultSalarySlip } from './salarySlipHelper';

/**
 * Validates an Indonesian 16-digit NIK against the recorded birth date and gender
 * per Dukcapil (Ditjen Kependudukan dan Pencatatan Sipil) algorithmic standards.
 *
 * Structure:
 * Digits 1-2: Province code
 * Digits 3-4: Regency/City code
 * Digits 5-6: District/Kecamatan code
 * Digits 7-12: Date of birth (DDMMYY). For females, DD is offset by +40 (41-71).
 * Digits 13-16: Sequential registration index.
 */
export function validateDukcapilNik(
  nik: string,
  birthDate: string,
  gender: string
): { isValid: boolean; anomalies: string[] } {
  const anomalies: string[] = [];

  const cleanNik = nik.trim();
  if (!/^\d{16}$/.test(cleanNik)) {
    anomalies.push('NIK must be exactly 16 digits numeric');
    return { isValid: false, anomalies };
  }

  let day: number | null = null;
  let month: number | null = null;
  let year: number | null = null;

  const cleanDate = birthDate.trim();
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(cleanDate)) {
    const parts = cleanDate.split(/[-/.]/);
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(cleanDate)) {
    const parts = cleanDate.split(/[-/.]/);
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  }

  if (day === null || month === null || year === null || isNaN(day) || isNaN(month) || isNaN(year)) {
    anomalies.push(`Birth date format invalid on document: "${birthDate}"`);
    return { isValid: false, anomalies };
  }

  const isFemale = /perempuan|wanita|female/i.test(gender);
  const expectedDay = isFemale ? day + 40 : day;
  const expectedMonth = month;
  const expectedYear = year % 100;

  const nikDay = parseInt(cleanNik.slice(6, 8), 10);
  const nikMonth = parseInt(cleanNik.slice(8, 10), 10);
  const nikYear = parseInt(cleanNik.slice(10, 12), 10);

  const dayMatches = nikDay === expectedDay;
  const monthMatches = nikMonth === expectedMonth;
  const yearMatches = nikYear === expectedYear;

  if (!dayMatches || !monthMatches || !yearMatches) {
    const formattedNikDob = `${String(nikDay).padStart(2, '0')}-${String(nikMonth).padStart(2, '0')}-${String(nikYear).padStart(2, '0')}`;
    anomalies.push(
      `Birth date mismatch: NIK indicates ${formattedNikDob} (${isFemale ? 'Female (+40)' : 'Male'}) but document states ${birthDate}`
    );
  }

  return {
    isValid: anomalies.length === 0,
    anomalies,
  };
}

/**
 * OCR Presets for e-KTP verification demos:
 * - clean: Authentic physical KTP with clean Dukcapil match and low risk score (< 30).
 * - tampered: High-risk altered KTP with mismatched font and NIK date inconsistency (score >= 70).
 * - screen_capture: Moiré pattern detected from photographing an LCD monitor.
 */
export const ocrDemoPresets: Record<string, DocumentVerification> = {
};

export const casePresets = ocrDemoPresets;

/**
 * ICR Presets for surveyor handwriting and BPN Sentuh Tanahku collateral verification:
 * - survey_clean: Verified surveyor field inspection form with clean legible handwriting.
 * - clean_shm: Valid SHM certificate matching ATR/BPN land registry and surveyed geolocation.
 * - cadastral_mismatch: BPN spatial mismatch flag (coordinates differ from surveyed property).
 * - low_confidence: Hand-written survey form with blurry handwriting and illegible numbers.
 */
export const icrDemoPresets: Record<string, IcrDocumentSample> = {

};

/**
 * Voice STT & Compliance Presets:
 * - nominal: Compliant call, high compliance score (>= 90), zero hesitancy flags.
 * - hesitant_noncompliant: Low compliance score (< 80), lengthy pauses (> 3s), missed mandatory disclosures.
 * - coaching_suspicion: Moderate compliance but background whispering/coaching cues detected.
 */
export const voiceDemoPresets: Record<string, VoiceVerification> = {

};
