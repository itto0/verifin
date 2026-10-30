import React, { useState } from 'react';
import {
 ArrowLeft,
 Send
} from 'lucide-react';
import { FinancingCase, CaseStatus, CaseSubPage } from '../../types';
import { CaseOverviewPage } from './subpages/CaseOverviewPage';
import { CaseEktpPage } from './subpages/CaseEktpPage';
import { CaseGeoPage } from './subpages/CaseGeoPage';
import { CaseVoicePage } from './subpages/CaseVoicePage';
import { CaseIcrPage } from './subpages/CaseIcrPage';
import { QuickDecisionModal } from './subpages/QuickDecisionModal';

interface CaseDetailViewProps {
 caseData: FinancingCase;
 allCases?: FinancingCase[];
 onSelectCase?: (caseId: string) => void;
 onBackToQueue: () => void;
 onUpdateStatus: (caseId: string, newStatus: CaseStatus, note: string) => void;
 activeSubPage?: CaseSubPage;
 onSubPageChange?: (subPage: CaseSubPage) => void;
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({
 caseData,
 allCases = [],
 onSelectCase,
 onBackToQueue,
 onUpdateStatus,
 activeSubPage: controlledSubPage,
 onSubPageChange,
}) => {
 const [internalSubPage, setInternalSubPage] = useState<CaseSubPage>('overview');
 const activeSubPage = controlledSubPage !== undefined ? controlledSubPage : internalSubPage;

 const setSubPage = (subPage: CaseSubPage) => {
 if (onSubPageChange) {
 onSubPageChange(subPage);
 } else {
 setInternalSubPage(subPage);
 }
 };

 const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

 const { riskScore } = caseData;
 const isHigh = riskScore.level === 'high';
 const isMedium = riskScore.level === 'medium';

 const pillarStatusItems: { id: CaseSubPage; label: string; statusColor: string; title: string }[] = [
 {
 id: 'overview',
 label: '1. Overview',
 statusColor: isHigh ? 'bg-[#DC2626]' : isMedium ? 'bg-[#D97706]' : 'bg-[#16A34A]',
 title: `Risk Score: ${riskScore.totalScore}/100 (${riskScore.level.toUpperCase()})`
 },
 {
 id: 'ektp',
 label: '2. e-KTP',
 statusColor: caseData.document.score >= 70 ? 'bg-[#DC2626]' : 'bg-[#16A34A]',
 title: `Biometrics: ${caseData.document.faceMatchScore}% Match`
 },
 {
 id: 'geo',
 label: '3. Geo',
 statusColor: caseData.geo.distanceStatus === 'red' ? 'bg-[#DC2626]' : caseData.geo.distanceStatus === 'yellow' ? 'bg-[#D97706]' : 'bg-[#16A34A]',
 title: `Survey Geotag: ${caseData.geo.distanceMeters}m from residence`
 },
 {
 id: 'voice',
 label: '4. Voice',
 statusColor: caseData.voice.score >= 60 ? 'bg-[#D97706]' : 'bg-[#16A34A]',
 title: `Tele-survey Audio: ${caseData.voice.audioDurationFormatted}`
 },
 {
 id: 'icr',
 label: '5. ICR',
 statusColor: 'bg-[#16A34A]',
 title: 'Collateral BPKB & Form ICR'
 }
 ];

 return (
 <div className="space-y-4">
 {/* Sticky Top Header: Essential Case ID, Customer, Pillar Status, Status & Action */}
 <div className="sticky top-16 z-20 bg-white border border-[#E5E5E3] rounded-xl p-3 sm:p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
 {/* Left: Back button, Customer Name, Case ID & Quick Switcher */}
 <div className="flex items-center gap-3 min-w-0">
 <button
 onClick={onBackToQueue}
 className="p-2 rounded-lg border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F7F5] transition-colors shrink-0"
 title="Back to Review Queue"
 >
 <ArrowLeft className="w-4 h-4" />
 </button>

 <div className="flex items-center gap-2 flex-wrap min-w-0">
 <h2 className="text-base sm:text-lg font-semibold text-[#1A1A1A] truncate">
 {caseData.customerName}
 </h2>
 <span className="text-xs bg-[#F7F7F5] border border-[#E5E5E3] px-2 py-0.5 rounded text-[#6B6B6B] font-medium shrink-0">
 {caseData.id}
 </span>
 </div>
 </div>

 {/* Center: Simple Status Indicator Per Pillar */}
 <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-lg border border-[#E5E5E3] bg-[#F7F7F5] text-xs shrink-0 overflow-x-auto">
 {pillarStatusItems.map((pillar) => {
 const isPillarActive = activeSubPage === pillar.id;
 return (
 <button
 key={pillar.id}
 onClick={() => setSubPage(pillar.id)}
 title={pillar.title}
 className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors shrink-0 ${
 isPillarActive
 ? 'bg-white text-[#1A1A1A] font-semibold border border-[#E5E5E3]'
 : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-white/60'
 }`}
 >
 <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pillar.statusColor}`} />
 <span>{pillar.label}</span>
 </button>
 );
 })}
 </div>

 {/* Right: Simple Status Indicator & Make Decision Button */}
 <div className="flex items-center gap-2.5 shrink-0 self-end xl:self-auto">
 {/* Simple Underwriting Status Indicator */}
 <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#E5E5E3] bg-[#F7F7F5] text-xs">
 <span
 className={`w-2 h-2 rounded-full shrink-0 ${
 caseData.status === 'approved'
 ? 'bg-[#16A34A]'
 : caseData.status === 'rejected_fraud'
 ? 'bg-[#DC2626]'
 : caseData.status === 'resurvey'
 ? 'bg-[#D97706]'
 : 'bg-[#2563EB]'
 }`}
 />
 <span className="font-medium text-[#1A1A1A]">
 {caseData.status === 'approved'
 ? 'Approved'
 : caseData.status === 'rejected_fraud'
 ? 'Rejected'
 : caseData.status === 'resurvey'
 ? 'Re-survey'
 : 'Pending Review'}
 </span>
 </div>

 {/* Decision Action Trigger */}
 <button
 onClick={() => setIsDecisionModalOpen(true)}
 className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
 >
 <Send className="w-3.5 h-3.5" />
 <span>Make Decision</span>
 </button>
 </div>
 </div>

 {/* DEDICATED SUB-PAGE CANVAS */}
 <div className="min-h-[500px]">
 {activeSubPage === 'overview' && (
 <CaseOverviewPage
 caseData={caseData}
 onNavigateSubPage={setSubPage}
 onUpdateStatus={onUpdateStatus}
 />
 )}

 {activeSubPage === 'ektp' && <CaseEktpPage caseData={caseData} />}

 {activeSubPage === 'geo' && <CaseGeoPage caseData={caseData} />}

 {activeSubPage === 'voice' && <CaseVoicePage caseData={caseData} />}

 {activeSubPage === 'icr' && <CaseIcrPage caseData={caseData} />}
 </div>

 {/* Quick Underwriting Decision Modal */}
 <QuickDecisionModal
 isOpen={isDecisionModalOpen}
 onClose={() => setIsDecisionModalOpen(false)}
 caseData={caseData}
 onUpdateStatus={onUpdateStatus}
 />
 </div>
 );
};
