import { describe, expect, it } from 'bun:test';
import {
  ELEVENLABS_CASE_0941_CLEAN_SCRIPT,
  ELEVENLABS_VOICE_CONFIG,
  case0941CleanVoiceVerification,
} from './elevenlabsCallPrompts';

describe('ElevenLabs Call Audio Prompt', () => {
  it('contains dialogue script with phonetic Indonesian spelling for NIK and installment', () => {
    expect(ELEVENLABS_CASE_0941_CLEAN_SCRIPT).toContain('Ahmad Fauzi');
    expect(ELEVENLABS_CASE_0941_CLEAN_SCRIPT).toContain('Tiga satu tujuh empat');
    expect(ELEVENLABS_CASE_0941_CLEAN_SCRIPT).toContain('Nurhasanah');
    expect(ELEVENLABS_CASE_0941_CLEAN_SCRIPT).toContain('Yamaha N-MAX seratus lima puluh lima');
    expect(ELEVENLABS_CASE_0941_CLEAN_SCRIPT).toContain('satu juta tiga ratus sembilan puluh lima ribu rupiah');
    expect(ELEVENLABS_CASE_0941_CLEAN_SCRIPT).toContain('Otoritas Jasa Keuangan');
  });

  it('provides voice casting configuration for Agent and Customer', () => {
    expect(ELEVENLABS_VOICE_CONFIG.modelId).toBe('eleven_multilingual_v2');
    expect(ELEVENLABS_VOICE_CONFIG.agentVoice.stability).toBeGreaterThanOrEqual(0.6);
    expect(ELEVENLABS_VOICE_CONFIG.customerVoice.stability).toBeGreaterThanOrEqual(0.5);
  });

  it('matches VeriFin VoiceVerification data structure with 100% compliance', () => {
    const voice = case0941CleanVoiceVerification;
    expect(voice.callId).toBe('CALL-20261027-0941-CLN');
    expect(voice.overallHesitancyCount).toBe(0);
    expect(voice.spellingAccuracyScore).toBe(100);
    expect(voice.scriptComplianceScore).toBe(100);
    expect(voice.score).toBeLessThanOrEqual(25);
    expect(voice.complianceChecklist.length).toBe(6);
    expect(voice.complianceChecklist.every((item) => item.isCompliant)).toBe(true);
    expect(voice.voiceFlags.length).toBe(0);
    expect(voice.transcripts.length).toBeGreaterThanOrEqual(14);
  });
});
