import { describe, it, expect } from 'bun:test';
import { mockCases, mockSurveyPoints, branchList, DEMO_USERS } from '../../src/data/mockData';
import { mockSurveyorProfiles } from '../../src/data/surveyorData';
import { mockMasterBranches, mockMasterSurveyors } from '../../src/data/mockMasterData';
import { mockSystemAuditEntries } from '../../src/data/reportsData';

describe('Cross-Dataset Mock Data Consistency', () => {
  describe('CASE-0941 Verification & Risk Score Alignment', () => {
    const case0941 = mockCases.find((c) => c.id === 'CASE-0941');

    it('should exist and have low risk status', () => {
      expect(case0941).toBeDefined();
      expect(case0941?.riskScore.totalScore).toBe(15);
      expect(case0941?.riskScore.level).toBe('low');
    });

    it('should have consistent mathematical pillar weights totaling totalScore', () => {
      const pillars = case0941!.riskScore.pillars;
      const calculatedTotal =
        (pillars.ektp.score * pillars.ektp.weight) / 100 +
        (pillars.location.score * pillars.location.weight) / 100 +
        (pillars.voice.score * pillars.voice.weight) / 100 +
        (pillars.document.score * pillars.document.weight) / 100;

      expect(Math.round(calculatedTotal)).toBe(case0941!.riskScore.totalScore);
    });

    it('should have voice verification aligned with low-risk profile', () => {
      expect(case0941?.voice.score).toBe(case0941?.riskScore.pillars.voice.score);
      expect(case0941?.voice.overallHesitancyCount).toBe(0);
      expect(case0941?.voice.voiceFlags).toHaveLength(0);
      expect(case0941?.voice.scriptComplianceScore).toBe(100);
      expect(case0941?.voice.spellingAccuracyScore).toBe(100);
    });

    it('should have geo survey score aligned with location pillar', () => {
      expect(case0941?.geo.score).toBe(case0941?.riskScore.pillars.location.score);
      expect(case0941?.geo.isMockLocationDetected).toBe(false);
      expect(case0941?.geo.distanceStatus).toBe('green');
    });

    it('should have matching audit log entry in reportsData', () => {
      const audit0941 = mockSystemAuditEntries.find(
        (a) => a.targetRef === 'CASE-0941' && a.action.includes('Multi-Pillar Score Evaluated')
      );
      expect(audit0941).toBeDefined();
      expect(audit0941?.action).toContain('15 (LOW)');
      expect(audit0941?.details).toContain('Voice: 18');
      expect(audit0941?.details).toContain('Geo: 10');
    });
  });

  describe('Surveyor Profiles and Cases Alignment', () => {
    it('should assign CASE-0942 to Bambang Sudirgo (BAF Jakarta Selatan)', () => {
      const bambang = mockSurveyorProfiles.find((s) => s.id === 'SRV-JKT-104');
      expect(bambang).toBeDefined();
      const case0942 = bambang?.assignedCases.find((c) => c.caseId === 'CASE-0942');
      expect(case0942).toBeDefined();
      expect(case0942?.applicantName).toBe('Siti Nurhaliza');
      expect(case0942?.vehicleModel).toBe('Yamaha Grand Filano Hybrid');
      expect(case0942?.targetAddress).toContain('Jakarta Selatan');
    });

    it('should match case details in mockCases for all assigned surveyor cases', () => {
      for (const surveyor of mockSurveyorProfiles) {
        for (const assigned of surveyor.assignedCases) {
          const matchingCase = mockCases.find((c) => c.id === assigned.caseId);
          if (matchingCase) {
            expect(matchingCase.customerName).toBe(assigned.applicantName);
            expect(matchingCase.vehicleModel).toBe(assigned.vehicleModel);
          }
        }
      }
    });

    it('should match surveyor IDs between mockMasterSurveyors and mockSurveyorProfiles', () => {
      const masterIds = new Set(mockMasterSurveyors.map((s) => s.id));
      for (const surveyor of mockSurveyorProfiles) {
        expect(masterIds.has(surveyor.id)).toBe(true);
      }
    });
  });

  describe('Branch & Master Data Alignment', () => {
    it('should ensure all mockSurveyPoints branches are present in branchList', () => {
      for (const pt of mockSurveyPoints) {
        expect(branchList).toContain(pt.branch);
      }
    });

    it('should ensure DEMO_USERS use standardized branch names', () => {
      for (const user of DEMO_USERS) {
        if (user.branch !== 'Head Office (Risk Engine)') {
          expect(user.branch.startsWith('BAF ')).toBe(true);
        }
      }
    });

    it('should ensure mockMasterBranches has unique IDs and codes', () => {
      const ids = mockMasterBranches.map((b) => b.id);
      const codes = mockMasterBranches.map((b) => b.code);
      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(codes).size).toBe(codes.length);
    });
  });
});
