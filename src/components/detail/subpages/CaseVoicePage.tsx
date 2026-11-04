import React from 'react';
import { FinancingCase } from '../../../types';
import { VoiceVerificationTab, VoicePresetKey } from '../VoiceVerificationTab';

interface CaseVoicePageProps {
  caseData: FinancingCase;
  initialPreset?: VoicePresetKey;
}

export const CaseVoicePage: React.FC<CaseVoicePageProps> = ({ caseData, initialPreset }) => {
  return (
    <div className="space-y-6">
      <VoiceVerificationTab
        voice={caseData.voice}
        customerName={caseData.customerName}
        initialPreset={initialPreset}
      />
    </div>
  );
};
