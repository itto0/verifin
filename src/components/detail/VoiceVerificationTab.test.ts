import { describe, expect, it } from 'bun:test';
import { voiceDemoPresets } from '../../data/demoPresets';
import {
  createCustomVoiceVerification,
  calculateScriptCompliance,
  VoicePresetKey,
} from './VoiceVerificationTab';

describe('VoiceVerificationTab & Audio QA Demo Logic', () => {
  describe('1. Transcript timestamps and hesitation tags for hesitant_noncompliant', () => {
    const preset = voiceDemoPresets.hesitant_noncompliant;

    it('verifies transcript structure and chronological ordering', () => {
      expect(preset).toBeDefined();
      expect(preset.transcripts.length).toBeGreaterThan(5);

      for (const snippet of preset.transcripts) {
        expect(snippet.startTime).toBeLessThan(snippet.endTime);
        expect(snippet.startTime).toBeGreaterThanOrEqual(0);
        expect(['agent', 'customer']).toContain(snippet.speaker);
        expect(snippet.text.length).toBeGreaterThan(0);
      }
    });

    it('identifies hesitation pauses and anomaly reasons in hesitant preset', () => {
      const hesitantSnippets = preset.transcripts.filter((t) => t.hasHesitancy);
      expect(hesitantSnippets.length).toBeGreaterThanOrEqual(2);

      for (const item of hesitantSnippets) {
        expect(item.hesitancyDuration).toBeGreaterThan(0);
        expect(item.flagReason).toBeDefined();
        expect(item.flagReason?.length).toBeGreaterThan(0);
      }

      // Check specific security question pause (mother maiden name)
      const motherQuestionSnippet = preset.transcripts.find(
        (t) => t.hasHesitancy && t.text.includes('Nurhasanah')
      );
      expect(motherQuestionSnippet).toBeDefined();
      expect(motherQuestionSnippet?.hesitancyDuration).toBe(3.4);
      expect(motherQuestionSnippet?.pitchTremor).toBe(true);

      // Check total overall hesitancy count
      expect(preset.overallHesitancyCount).toBe(3);
    });

    it('flags high risk anomaly score for hesitant scenario', () => {
      expect(preset.score).toBeGreaterThanOrEqual(70);
      expect(preset.voiceFlags.length).toBeGreaterThanOrEqual(3);
      expect(preset.voiceFlags.some((f) => f.includes('Jeda keraguan'))).toBe(true);
    });
  });

  describe('2. OJK script compliance calculations between nominal and hesitant_noncompliant', () => {
    it('calculates 100% compliance for nominal fluent call preset', () => {
      const nominal = voiceDemoPresets.nominal;
      const stats = calculateScriptCompliance(nominal.complianceChecklist);

      expect(stats.total).toBe(6);
      expect(stats.passed).toBe(6);
      expect(stats.failed).toBe(0);
      expect(stats.percentage).toBe(100);
      expect(nominal.scriptComplianceScore).toBeGreaterThanOrEqual(90);
    });

    it('calculates reduced compliance for hesitant and non-compliant preset', () => {
      const hesitant = voiceDemoPresets.hesitant_noncompliant;
      const stats = calculateScriptCompliance(hesitant.complianceChecklist);

      expect(stats.total).toBe(6);
      expect(stats.passed).toBe(3);
      expect(stats.failed).toBe(3);
      expect(stats.percentage).toBe(50);
      expect(hesitant.scriptComplianceScore).toBeLessThan(80);

      const failedItems = hesitant.complianceChecklist.filter((c) => !c.isCompliant);
      expect(failedItems.length).toBe(3);
      for (const item of failedItems) {
        expect(item.note).toBeDefined();
        expect(item.note?.length).toBeGreaterThan(0);
      }
    });

    it('ensures each compliance item provides valid timestamp references', () => {
      const nominal = voiceDemoPresets.nominal;
      for (const item of nominal.complianceChecklist) {
        expect(item.timestampRef).toBeDefined();
        expect(item.timestampRef).toBeGreaterThanOrEqual(0);
        expect(item.timestampRef).toBeLessThanOrEqual(nominal.callDuration);
      }
    });
  });

  describe('3. Custom audio document creation & preset switching data structures', () => {
    it('creates nominal custom voice verification from uploaded audio file', () => {
      const custom = createCustomVoiceVerification('rekaman_televerifikasi_001.mp3', {
        customerName: 'BUDI SANTOSO',
        agentName: 'Fitri Handayani',
        duration: 190,
      });

      expect(custom.callId).toContain('CALL-UPLOAD-');
      expect(custom.callDuration).toBe(190);
      expect(custom.audioDurationFormatted).toBe('03:10');
      expect(custom.agentName).toBe('Fitri Handayani');
      expect(custom.transcripts.length).toBeGreaterThan(3);
      expect(custom.complianceChecklist.length).toBeGreaterThan(0);
      expect(custom.score).toBeLessThan(30);
      expect(custom.voiceFlags.length).toBe(0);
      expect(custom.transcripts.some((t) => t.text.includes('BUDI SANTOSO'))).toBe(true);
    });

    it('creates custom voice verification with flagged hesitancy when specified', () => {
      const custom = createCustomVoiceVerification('tele_ragu_ragu.wav', {
        customerName: 'JOKO SUSILO',
        hasHesitancy: true,
      });

      expect(custom.overallHesitancyCount).toBeGreaterThan(0);
      expect(custom.transcripts.some((t) => t.hasHesitancy)).toBe(true);
      expect(custom.score).toBeGreaterThanOrEqual(60);
      expect(custom.voiceFlags.length).toBeGreaterThan(0);
    });

    it('supports valid preset switching keys', () => {
      const validKeys: VoicePresetKey[] = [
        'nominal',
        'hesitant_noncompliant',
        'coaching_suspicion',
        'custom',
      ];

      for (const key of validKeys) {
        if (key !== 'custom') {
          expect(voiceDemoPresets[key]).toBeDefined();
          expect(voiceDemoPresets[key].transcripts.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('4. Voice flags and whisper anomaly detection for coaching_suspicion', () => {
    const coachingPreset = voiceDemoPresets.coaching_suspicion;

    it('detects whisper coaching anomalies in preset', () => {
      expect(coachingPreset.score).toBeGreaterThanOrEqual(75);
      expect(coachingPreset.voiceFlags.some((f) => f.toLowerCase().includes('bisikan'))).toBe(true);
      expect(coachingPreset.voiceFlags.some((f) => f.toLowerCase().includes('coaching'))).toBe(true);

      const whisperSnippet = coachingPreset.transcripts.find(
        (t) => t.flagReason && t.flagReason.toLowerCase().includes('bisikan')
      );
      expect(whisperSnippet).toBeDefined();
      expect(whisperSnippet?.speaker).toBe('customer');
      expect(whisperSnippet?.hasHesitancy).toBe(true);
    });

    it('generates whisper coaching flags for uploaded audio with forceWhisperAnomaly or whisper filename', () => {
      const customWhisper = createCustomVoiceVerification('tele_audio_whisper_prompt.m4a', {
        customerName: 'HENDRA WIJAYA',
        forceWhisperAnomaly: true,
      });

      expect(customWhisper.score).toBeGreaterThanOrEqual(75);
      expect(
        customWhisper.voiceFlags.some(
          (f) => f.toLowerCase().includes('bisikan') || f.toLowerCase().includes('coaching')
        )
      ).toBe(true);
      expect(
        customWhisper.transcripts.some(
          (t) => t.flagReason && t.flagReason.toLowerCase().includes('bisikan')
        )
      ).toBe(true);
    });
  });
});
