import React, { useState } from 'react';
import {
 ShieldAlert,
 ShieldCheck,
 MapPin,
 Headphones,
 FileCheck,
 AlertTriangle,
 CheckCircle2,
 XCircle,
 ExternalLink,
 UserCheck,
 Navigation,
 FileText,
 Clock,
 History,
 Send,
 Building,
 User,
 CreditCard,
 ArrowRight
} from 'lucide-react';
import { FinancingCase, CaseStatus, CaseSubPage } from '../../../types';

interface CaseOverviewPageProps {
 caseData: FinancingCase;
 onNavigateSubPage: (subPage: CaseSubPage) => void;
 onUpdateStatus: (caseId: string, newStatus: CaseStatus, note: string) => void;
}

export const CaseOverviewPage: React.FC<CaseOverviewPageProps> = ({
 caseData,
 onNavigateSubPage,
 onUpdateStatus,
}) => {
 const { document, geo, voice, riskScore } = caseData;
 const [decisionChoice, setDecisionChoice] = useState<CaseStatus>(caseData.status);
 const [decisionNotes, setDecisionNotes] = useState(caseData.decisionNotes || '');
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [statusMessage, setStatusMessage] = useState<string | null>(null);

 const isHigh = riskScore.level === 'high';
 const isMedium = riskScore.level === 'medium';

 // Cross-document verification matrix data
 const crossCheckMatrix = [
 {
 field: 'Nomor Induk Kependudukan (NIK)',
 ktpValue: caseData.customerNik,
 kkValue: caseData.customerNik,
 teleQaValue: caseData.customerNik,
 isMatch: document.nikValidation.dukcapilMatch && !document.nikValidation.anomalies.length,
 note: document.nikValidation.anomalies[0] || 'Matched with Dukcapil civil database'
 },
 {
 field: 'Full Debtor Name',
 ktpValue: caseData.customerName,
 kkValue: caseData.customerName,
 teleQaValue: caseData.customerName,
 isMatch: true,
 note: 'Consistent across all submitted documents'
 },
 {
 field: 'Birth Date & Age',
 ktpValue: document.nikValidation.birthDate,
 kkValue: document.nikValidation.birthDate,
 teleQaValue: document.nikValidation.birthDate,
 isMatch: document.nikValidation.isValidStructure,
 note: document.nikValidation.isValidStructure
 ? 'NIK structure matched DOB formula'
 : 'NIK birth date differs from physical card'
 },
 {
 field: 'Residential Address',
 ktpValue: geo.targetAddress.split(',')[0] || 'KTP Address',
 kkValue: 'Same as KTP',
 teleQaValue: 'Confirmed verbally in QA call',
 isMatch: geo.distanceStatus !== 'red',
 note: geo.distanceStatus === 'red'
 ? `Survey GPS ${geo.distanceMeters.toLocaleString()}m from registered address`
 : 'Surveyor GPS within acceptable radius'
 },
 {
 field: 'Reported Monthly Income',
 ktpValue: 'N/A (e-KTP)',
 kkValue: 'N/A (Family Card)',
 teleQaValue: `Verified in Voice QA (Q4)`,
 isMatch: voice.score < 60,
 note: voice.score >= 60 ? 'Hesitation & discrepancy detected' : 'Consistent with payroll slip'
 }
 ];

 const handleInsertTag = (tag: string) => {
 setDecisionNotes((prev) => (prev ? `${prev}. ${tag}` : tag));
 };

 const handleSaveDecision = () => {
 setIsSubmitting(true);
 const finalNote = decisionNotes.trim() || `Decision ${decisionChoice} confirmed by manual verifier.`;
 setTimeout(() => {
 onUpdateStatus(caseData.id, decisionChoice, finalNote);
 setIsSubmitting(false);
 setStatusMessage(
 decisionChoice === 'approved'
 ? 'Application successfully approved and transferred to LOS.'
 : decisionChoice === 'resurvey'
 ? 'Re-survey instruction dispatched to branch CMO.'
 : 'Application rejected due to fraud indicators & logged in OJK audit trail.'
 );
 setTimeout(() => setStatusMessage(null), 4000);
 }, 400);
 };

 return (
 <div className="space-y-6">
 {/* Toast Alert */}
 {statusMessage && (
 <div className="p-3.5 rounded-xl bg-[#16A34A]/10 border border-[#16A34A]/30 text-[#16A34A] text-xs font-medium flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 shrink-0" />
 <span>{statusMessage}</span>
 </div>
 )}

 {/* Top Banner: Verification Overview Summary */}
 <div className="p-5 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
 Verification Pillar Overview &amp; Underwriting
 </span>
 <span className="text-xs text-[#6B6B6B]">·</span>
 <span
 className={`text-xs font-semibold px-2 py-0.5 rounded ${
 isHigh
 ? 'bg-[#DC2626]/10 text-[#DC2626]'
 : isMedium
 ? 'bg-[#D97706]/10 text-[#D97706]'
 : 'bg-[#16A34A]/10 text-[#16A34A]'
 }`}
 >
 Composite Risk: {riskScore.totalScore}/100 ({riskScore.level.toUpperCase()})
 </span>
 </div>
 <p className="text-xs text-[#1A1A1A] mt-1.5 leading-relaxed max-w-3xl">
 This dashboard aggregates automated checks across 4 verification pillars: civil identity extraction, geospatial field inspection, tele-verification speech analysis, and collateral ICR documents.
 </p>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <button
 onClick={() => onNavigateSubPage('ektp')}
 className="px-3 py-1.5 rounded-lg border border-[#E5E5E3] bg-white text-xs font-semibold text-[#1A1A1A] hover:bg-[#F7F7F5] flex items-center gap-1.5 transition-colors"
 >
 <span>Start Step-by-Step Audit</span>
 <ArrowRight className="w-3.5 h-3.5 text-[#2563EB]" />
 </button>
 </div>
 </div>

 {/* Financial & Contract Specs Bar */}
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
 <div className="p-3.5 bg-white border border-[#E5E5E3] rounded-xl space-y-1">
 <div className="text-[11px] text-[#6B6B6B]">Financed Unit</div>
 <div className="text-xs font-semibold text-[#1A1A1A] truncate">{caseData.vehicleModel}</div>
 <div className="text-[10px] text-[#6B6B6B]">Engine: 155 cc</div>
 </div>
 <div className="p-3.5 bg-white border border-[#E5E5E3] rounded-xl space-y-1">
 <div className="text-[11px] text-[#6B6B6B]">Loan Principal</div>
 <div className="text-xs font-semibold text-[#1A1A1A] ">
 Rp {(caseData.loanAmount / 1000000).toFixed(1)} Million
 </div>
 <div className="text-[10px] text-[#6B6B6B]">OTR: Rp 35.2 M</div>
 </div>
 <div className="p-3.5 bg-white border border-[#E5E5E3] rounded-xl space-y-1">
 <div className="text-[11px] text-[#6B6B6B]">Down Payment (DP)</div>
 <div className="text-xs font-semibold text-[#16A34A] ">
 Rp {(caseData.downPayment / 1000000).toFixed(1)} M (20%)
 </div>
 <div className="text-[10px] text-[#6B6B6B]">Min required: 15%</div>
 </div>
 <div className="p-3.5 bg-white border border-[#E5E5E3] rounded-xl space-y-1">
 <div className="text-[11px] text-[#6B6B6B]">Tenor &amp; Rate</div>
 <div className="text-xs font-semibold text-[#1A1A1A] ">{caseData.tenorMonths} Months</div>
 <div className="text-[10px] text-[#6B6B6B]">Flat: 11.5% p.a.</div>
 </div>
 <div className="p-3.5 bg-white border border-[#E5E5E3] rounded-xl space-y-1">
 <div className="text-[11px] text-[#6B6B6B]">Monthly Installment</div>
 <div className="text-xs font-semibold text-[#2563EB] ">
 Rp {caseData.monthlyInstallment.toLocaleString('id-ID')}/mo
 </div>
 <div className="text-[10px] text-[#6B6B6B]">Due: 15th each month</div>
 </div>
 <div className="p-3.5 bg-white border border-[#E5E5E3] rounded-xl space-y-1">
 <div className="text-[11px] text-[#6B6B6B]">Branch &amp; CMO</div>
 <div className="text-xs font-semibold text-[#1A1A1A] truncate">{caseData.branch}</div>
 <div className="text-[10px] text-[#6B6B6B] truncate">{geo.surveyorName}</div>
 </div>
 </div>

 {/* 4 Pillars Interactive Summary Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {/* Pillar 1: e-KTP & Biometrics */}
 <div
 onClick={() => onNavigateSubPage('ektp')}
 className="bg-white border border-[#E5E5E3] rounded-xl p-4 space-y-3 cursor-pointer hover:border-[#2563EB] hover:bg-[#F7F7F5]/50 transition-all group"
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
 <ShieldCheck className="w-4 h-4" />
 </div>
 <div>
 <div className="text-xs font-semibold text-[#1A1A1A] group-hover:text-[#2563EB] transition-colors">
 1. e-KTP &amp; Biometrics
 </div>
 <div className="text-[10px] text-[#6B6B6B]">Weight: 30%</div>
 </div>
 </div>
 <span
 className={`text-xs font-bold px-1.5 py-0.5 rounded ${
 document.score >= 70
 ? 'bg-[#DC2626]/10 text-[#DC2626]'
 : document.score >= 40
 ? 'bg-[#D97706]/10 text-[#D97706]'
 : 'bg-[#16A34A]/10 text-[#16A34A]'
 }`}
 >
 {document.score}/100
 </span>
 </div>

 <div className="space-y-1.5 text-xs">
 <div className="flex items-center justify-between text-[#6B6B6B]">
 <span>Dukcapil Match:</span>
 <span className={`font-medium ${document.nikValidation.dukcapilMatch ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
 {document.nikValidation.dukcapilMatch ? 'Verified' : 'Failed'}
 </span>
 </div>
 <div className="flex items-center justify-between text-[#6B6B6B]">
 <span>Face Match:</span>
 <span className={`font-medium ${document.faceMatchScore >= 80 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
 {document.faceMatchScore}%
 </span>
 </div>
 <div className="flex items-center justify-between text-[#6B6B6B]">
 <span>Tamper Heuristics:</span>
 <span className={`font-medium ${document.tamperFlags.length > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
 {document.tamperFlags.length > 0 ? `${document.tamperFlags.length} Flagged` : 'Clean'}
 </span>
 </div>
 </div>

 <div className="pt-2 border-t border-[#E5E5E3] flex items-center justify-between text-[11px] text-[#2563EB] font-medium">
 <span>View Full Biometric Page</span>
 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
 </div>
 </div>

 {/* Pillar 2: Geospatial & Survey */}
 <div
 onClick={() => onNavigateSubPage('geo')}
 className="bg-white border border-[#E5E5E3] rounded-xl p-4 space-y-3 cursor-pointer hover:border-[#2563EB] hover:bg-[#F7F7F5]/50 transition-all group"
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
 <MapPin className="w-4 h-4" />
 </div>
 <div>
 <div className="text-xs font-semibold text-[#1A1A1A] group-hover:text-[#2563EB] transition-colors">
 2. Geotag &amp; Field Survey
 </div>
 <div className="text-[10px] text-[#6B6B6B]">Weight: 30%</div>
 </div>
 </div>
 <span
 className={`text-xs font-bold px-1.5 py-0.5 rounded ${
 geo.score >= 70
 ? 'bg-[#DC2626]/10 text-[#DC2626]'
 : geo.score >= 40
 ? 'bg-[#D97706]/10 text-[#D97706]'
 : 'bg-[#16A34A]/10 text-[#16A34A]'
 }`}
 >
 {geo.score}/100
 </span>
 </div>

 <div className="space-y-1.5 text-xs">
 <div className="flex items-center justify-between text-[#6B6B6B]">
 <span>Geofence Distance:</span>
 <span
 className={` font-medium ${
 geo.distanceStatus === 'red'
 ? 'text-[#DC2626]'
 : geo.distanceStatus === 'yellow'
 ? 'text-[#D97706]'
 : 'text-[#16A34A]'
 }`}
 >
 {geo.distanceMeters.toLocaleString()}m
 </span>
 </div>
 <div className="flex items-center justify-between text-[#6B6B6B]">
 <span>Mock Location (Fake GPS):</span>
 <span className={`font-medium ${geo.isMockLocationDetected ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
 {geo.isMockLocationDetected ? 'DETECTED' : 'Clean (Hardware)'}
 </span>
 </div>
 <div className="flex items-center justify-between text-[#6B6B6B]">
 <span>Surveyor SLA:</span>
 <span className="text-[#1A1A1A] font-medium">On-time (24m)</span>
 </div>
 </div>

 <div className="pt-2 border-t border-[#E5E5E3] flex items-center justify-between text-[11px] text-[#2563EB] font-medium">
 <span>View Full Survey Map</span>
 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
 </div>
 </div>

 {/* Pillar 3: Tele-Verification QA */}
 <div
 onClick={() => onNavigateSubPage('voice')}
 className="bg-white border border-[#E5E5E3] rounded-xl p-4 space-y-3 cursor-pointer hover:border-[#2563EB] hover:bg-[#F7F7F5]/50 transition-all group"
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
 <Headphones className="w-4 h-4" />
 </div>
 <div>
 <div className="text-xs font-semibold text-[#1A1A1A] group-hover:text-[#2563EB] transition-colors">
 3. Tele-QA Audio Call
 </div>
 <div className="text-[10px] text-[#6B6B6B]">Weight: 25%</div>
 </div>
 </div>
 <span
 className={`text-xs font-bold px-1.5 py-0.5 rounded ${
 voice.score >= 70
 ? 'bg-[#DC2626]/10 text-[#DC2626]'
 : voice.score >= 40
 ? 'bg-[#D97706]/10 text-[#D97706]'
 : 'bg-[#16A34A]/10 text-[#16A34A]'
 }`}
 >
 {voice.score}/100
 </span>
 </div>

 <div className="space-y-1.5 text-xs">
 <div className="flex items-center justify-between text-[#6B6B6B]">
 <span>Hesitancy Pauses:</span>
 <span className={` font-medium ${voice.overallHesitancyCount > 0 ? 'text-[#D97706]' : 'text-[#16A34A]'}`}>
 {voice.overallHesitancyCount} Anomaly Events
 </span>
 </div>
 <div className="flex items-center justify-between text-[#6B6B6B]">
 <span>Script Adherence:</span>
 <span className={`font-medium ${voice.scriptComplianceScore >= 85 ? 'text-[#16A34A]' : 'text-[#D97706]'}`}>
 {voice.scriptComplianceScore}% Compliant
 </span>
 </div>
 <div className="flex items-center justify-between text-[#6B6B6B]">
 <span>Call Duration:</span>
 <span className="text-[#1A1A1A] font-medium">{voice.audioDurationFormatted}</span>
 </div>
 </div>

 <div className="pt-2 border-t border-[#E5E5E3] flex items-center justify-between text-[11px] text-[#2563EB] font-medium">
 <span>Listen &amp; View Transcript</span>
 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
 </div>
 </div>

 {/* Pillar 4: ICR & Collateral */}
 <div
 onClick={() => onNavigateSubPage('icr')}
 className="bg-white border border-[#E5E5E3] rounded-xl p-4 space-y-3 cursor-pointer hover:border-[#2563EB] hover:bg-[#F7F7F5]/50 transition-all group"
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center">
 <FileCheck className="w-4 h-4" />
 </div>
 <div>
 <div className="text-xs font-semibold text-[#1A1A1A] group-hover:text-[#2563EB] transition-colors">
 4. ICR &amp; Collateral
 </div>
 <div className="text-[10px] text-[#6B6B6B]">Weight: 15%</div>
 </div>
 </div>
 <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-[#16A34A]/10 text-[#16A34A]">
 15/100
 </span>
 </div>

 <div className="space-y-1.5 text-xs">
 <div className="flex items-center justify-between text-[#6B6B6B]">
 <span>ICR Confidence:</span>
 <span className=" text-[#16A34A] font-medium">96.8% Average</span>
 </div>
 <div className="flex items-center justify-between text-[#6B6B6B]">
 <span>Sentuh Tanahku:</span>
 <span className="text-[#16A34A] font-medium">ATR/BPN Validated</span>
 </div>
 <div className="flex items-center justify-between text-[#6B6B6B]">
 <span>Asset Proof:</span>
 <span className="text-[#1A1A1A] font-medium">PLN Meter / Stake</span>
 </div>
 </div>

 <div className="pt-2 border-t border-[#E5E5E3] flex items-center justify-between text-[11px] text-[#2563EB] font-medium">
 <span>View ICR Documents</span>
 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
 </div>
 </div>
 </div>

 {/* Cross-Check Consistency Matrix & Decision Console (2 Columns) */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
 {/* Left Column (7 cols): Cross-Check Consistency Matrix */}
 <div className="lg:col-span-7 bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
 <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
 <div>
 <h3 className="text-xs font-semibold text-[#1A1A1A]">
 Cross-Document Data Consistency Matrix
 </h3>
 <p className="text-[11px] text-[#6B6B6B] mt-0.5">
 Automated comparison between e-KTP, Family Card, Tele-QA, and ICR Form
 </p>
 </div>
 <span className="text-[11px] px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E3] ">
 5 Fields Audited
 </span>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-xs text-left border-collapse">
 <thead>
 <tr className="border-b border-[#E5E5E3] text-[#6B6B6B] bg-[#F7F7F5]/50">
 <th className="py-2.5 px-3 font-semibold">Verification Field</th>
 <th className="py-2.5 px-3 font-semibold">e-KTP OCR</th>
 <th className="py-2.5 px-3 font-semibold">Tele-QA Audio</th>
 <th className="py-2.5 px-3 font-semibold text-right">Audit Result</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#E5E5E3]">
 {crossCheckMatrix.map((item, idx) => (
 <tr key={idx} className="hover:bg-[#F7F7F5]/40 transition-colors">
 <td className="py-2.5 px-3 font-medium text-[#1A1A1A]">
 {item.field}
 </td>
 <td className="py-2.5 px-3 text-[#6B6B6B] text-[11px] truncate max-w-[140px]">
 {item.ktpValue}
 </td>
 <td className="py-2.5 px-3 text-[#6B6B6B] text-[11px] truncate max-w-[140px]">
 {item.teleQaValue}
 </td>
 <td className="py-2.5 px-3 text-right">
 {item.isMatch ? (
 <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A]">
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span>Matched</span>
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626]" title={item.note}>
 <AlertTriangle className="w-3.5 h-3.5" />
 <span>Mismatch</span>
 </span>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* AI Detected Anomalies Banner */}
 {riskScore.reasons.length > 0 && (
 <div className="p-3.5 rounded-lg bg-[#DC2626]/5 border border-[#DC2626]/20 space-y-1.5">
 <div className="text-xs font-semibold text-[#DC2626] flex items-center gap-1.5">
 <AlertTriangle className="w-3.5 h-3.5" />
 <span>Detected Risk Engine Flags:</span>
 </div>
 <ul className="space-y-1 text-xs text-[#1A1A1A]">
 {riskScore.reasons.map((r, i) => (
 <li key={i} className="flex items-start gap-1.5 text-[11px] leading-relaxed">
 <span className="text-[#DC2626] font-bold">·</span>
 <span>{r}</span>
 </li>
 ))}
 </ul>
 </div>
 )}
 </div>

 {/* Right Column (5 cols): Manual Decision Console & Audit Trail */}
 <div className="lg:col-span-5 space-y-5">
 {/* Decision Box */}
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
 <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
 <div className="text-xs font-semibold text-[#1A1A1A]">
 Underwriter Decision Console
 </div>
 <span className="text-[10px] bg-[#2563EB]/10 text-[#2563EB] px-2 py-0.5 rounded font-semibold">
 SLA Review
 </span>
 </div>

 <div className="grid grid-cols-3 gap-2">
 <button
 type="button"
 onClick={() => setDecisionChoice('approved')}
 className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all flex flex-col items-center gap-1 ${
 decisionChoice === 'approved'
 ? 'bg-[#16A34A] text-white border-[#16A34A]'
 : 'bg-white text-[#1A1A1A] border-[#E5E5E3] hover:bg-[#F7F7F5]'
 }`}
 >
 <CheckCircle2 className="w-4 h-4" />
 <span>Approve</span>
 </button>

 <button
 type="button"
 onClick={() => setDecisionChoice('resurvey')}
 className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all flex flex-col items-center gap-1 ${
 decisionChoice === 'resurvey'
 ? 'bg-[#D97706] text-white border-[#D97706]'
 : 'bg-white text-[#1A1A1A] border-[#E5E5E3] hover:bg-[#F7F7F5]'
 }`}
 >
 <AlertTriangle className="w-4 h-4" />
 <span>Re-Survey</span>
 </button>

 <button
 type="button"
 onClick={() => setDecisionChoice('rejected_fraud')}
 className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all flex flex-col items-center gap-1 ${
 decisionChoice === 'rejected_fraud'
 ? 'bg-[#DC2626] text-white border-[#DC2626]'
 : 'bg-white text-[#1A1A1A] border-[#E5E5E3] hover:bg-[#F7F7F5]'
 }`}
 >
 <XCircle className="w-4 h-4" />
 <span>Reject Fraud</span>
 </button>
 </div>

 <div className="space-y-1.5">
 <label className="text-[11px] text-[#6B6B6B] font-medium block">
 Verification Notes &amp; Justification:
 </label>
 <div className="flex flex-wrap gap-1">
 <button
 type="button"
 onClick={() => handleInsertTag('NIK verified against Dukcapil')}
 className="text-[10px] px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E3] text-[#1A1A1A] hover:bg-[#E5E5E3]"
 >
 + Valid NIK
 </button>
 <button
 type="button"
 onClick={() => handleInsertTag('Mock Location provider detected')}
 className="text-[10px] px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E3] text-[#DC2626] hover:bg-[#E5E5E3]"
 >
 + Fake GPS
 </button>
 <button
 type="button"
 onClick={() => handleInsertTag('Survey radius > 1,000 meters from home')}
 className="text-[10px] px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E3] text-[#DC2626] hover:bg-[#E5E5E3]"
 >
 + Red Radius
 </button>
 <button
 type="button"
 onClick={() => handleInsertTag('Customer speech hesitancy in tele-QA')}
 className="text-[10px] px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E3] text-[#D97706] hover:bg-[#E5E5E3]"
 >
 + Hesitant Voice
 </button>
 </div>

 <textarea
 rows={3}
 value={decisionNotes}
 onChange={(e) => setDecisionNotes(e.target.value)}
 placeholder="Enter underwriting notes and justification for OJK audit trail..."
 className="w-full p-2.5 text-xs bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#2563EB] leading-relaxed resize-none"
 />
 </div>

 <button
 type="button"
 onClick={handleSaveDecision}
 disabled={isSubmitting}
 className="w-full py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
 >
 <Send className="w-3.5 h-3.5" />
 <span>{isSubmitting ? 'Recording...' : 'Submit Decision'}</span>
 </button>
 </div>

 {/* Audit Trail Log */}
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-3">
 <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
 <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
 <History className="w-3.5 h-3.5 text-[#6B6B6B]" />
 <span>Application Audit Trail</span>
 </div>
 <span className="text-[10px] text-[#6B6B6B] ">
 {caseData.auditTrail.length} Entries
 </span>
 </div>

 <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
 {caseData.auditTrail.map((log) => (
 <div key={log.id} className="text-[11px] space-y-0.5 pb-2 border-b border-[#E5E5E3] last:border-0">
 <div className="flex items-center justify-between text-[#6B6B6B]">
 <span className="font-semibold text-[#1A1A1A]">{log.action}</span>
 <span className=" text-[10px]">{log.timestamp.split(' ')[1]}</span>
 </div>
 <div className="text-[#6B6B6B] truncate">{log.actor}</div>
 <div className="text-[#1A1A1A] text-[10px] italic">{log.notes}</div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};
