import React from 'react';
import { FinancingCase } from '../../../types';
import { VoiceVerificationTab } from '../VoiceVerificationTab';

interface CaseVoicePageProps {
 caseData: FinancingCase;
}

export const CaseVoicePage: React.FC<CaseVoicePageProps> = ({ caseData }) => {
 return (
 <div className="space-y-6">
 <VoiceVerificationTab
 voice={caseData.voice}
 customerName={caseData.customerName}
 />
 </div>
 );
};
