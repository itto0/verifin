import React, { useState } from 'react';
import {
 ShieldAlert,
 CheckCircle2,
 XCircle,
 RotateCcw,
 Send,
 History,
 FileText,
 AlertTriangle,
 Scale
} from 'lucide-react';
import { FinancingCase, CaseStatus } from '../../types';

interface RiskEngineDecisionTabProps {
 caseData: FinancingCase;
 onUpdateStatus: (caseId: string, newStatus: CaseStatus, note: string) => void;
}

export const RiskEngineDecisionTab: React.FC<RiskEngineDecisionTabProps> = ({
 caseData,
 onUpdateStatus,
}) => {
 const [decisionNote, setDecisionNote] = useState(caseData.decisionNotes || '');
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [showSuccessToast, setShowSuccessToast] = useState(false);

 const { riskScore, auditTrail, status } = caseData;
 const { totalScore, level, recommendation, pillars, reasons } = riskScore;

 const handleDecision = (newStatus: CaseStatus) => {
 if (!decisionNote.trim() && newStatus !== 'approved') {
 alert('Please provide verifier decision notes/justification before submitting.');
 return;
 }
 setIsSubmitting(true);
 setTimeout(() => {
 onUpdateStatus(caseData.id, newStatus, decisionNote);
 setIsSubmitting(false);
 setShowSuccessToast(true);
 setTimeout(() => setShowSuccessToast(false), 3000);
 }, 400);
 };

 return (
 <div className="space-y-6">
 {/* Toast Alert */}
 {showSuccessToast && (
 <div className="p-3 bg-[#16A34A]/10 border border-[#16A34A]/30 text-[#16A34A] rounded-lg text-xs font-medium flex items-center justify-between">
 <span>Verifier decision successfully recorded in the BAF audit trail.</span>
 </div>
 )}

 {/* Top Banner: Composite Score & Formula */}
 <div className="p-5 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
 Composite Multi-Pillar Risk Calculation
 </span>
 <span className="text-xs text-[#6B6B6B]">·</span>
 <span
 className={`text-xs font-semibold ${
 level === 'high'
 ? 'text-[#DC2626]'
 : level === 'medium'
 ? 'text-[#D97706]'
 : 'text-[#16A34A]'
 }`}
 >
 {level === 'high' ? 'High Risk Tier (70-100)' : level === 'medium' ? 'Medium Risk Tier (40-69)' : 'Low Risk Tier (0-39)'}
 </span>
 </div>
 <p className="text-sm font-semibold text-[#1A1A1A] mt-1.5">
 {recommendation}
 </p>
 </div>

 <div className="flex items-center gap-4 shrink-0 bg-white p-3 rounded-lg border border-[#E5E5E3]">
 <div className="text-center">
 <div className="text-[10px] text-[#6B6B6B] uppercase font-semibold">Risk Score</div>
 <div
 className={`text-2xl font-bold tabular-nums ${
 level === 'high'
 ? 'text-[#DC2626]'
 : level === 'medium'
 ? 'text-[#D97706]'
 : 'text-[#16A34A]'
 }`}
 >
 {totalScore}
 <span className="text-xs text-[#6B6B6B] font-normal">/100</span>
 </div>
 </div>
 </div>
 </div>

 {/* Grid: 4 Pillars Breakdown & Reasons Table */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* Left Column (5 cols): Mathematical Pillar Weights */}
 <div className="lg:col-span-5 space-y-4">
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
 <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
 <div>
 <h4 className="text-sm font-semibold text-[#1A1A1A]">
 4-Pillar Risk Weightings
 </h4>
 <p className="text-xs text-[#6B6B6B] mt-0.5">
 Formula: &sum; (Pillar Score &times; Weight) = Composite Score
 </p>
 </div>
 <Scale className="w-4 h-4 text-[#2563EB]" />
 </div>

 {/* Pillar List */}
 <div className="space-y-3 text-xs">
 {/* Pillar 1: e-KTP */}
 <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
 <div className="flex items-center justify-between font-medium text-[#1A1A1A]">
 <span>Pillar 1: e-KTP &amp; Identity</span>
 <span className=" tabular-nums text-[#2563EB]">
 {pillars.ektp.weightedScore.toFixed(1)} pts
 </span>
 </div>
 <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] mt-1">
 <span>Score: {pillars.ektp.score}/100</span>
 <span>Weight: {pillars.ektp.weight}%</span>
 </div>
 <div className="w-full h-1.5 bg-[#E5E5E3] rounded-full mt-2 overflow-hidden">
 <div
 className={`h-full ${
 pillars.ektp.score >= 70 ? 'bg-[#DC2626]' : pillars.ektp.score >= 40 ? 'bg-[#D97706]' : 'bg-[#16A34A]'
 }`}
 style={{ width: `${pillars.ektp.score}%` }}
 />
 </div>
 </div>

 {/* Pillar 2: Location */}
 <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
 <div className="flex items-center justify-between font-medium text-[#1A1A1A]">
 <span>Pillar 2: Geotag &amp; Survey Location</span>
 <span className=" tabular-nums text-[#2563EB]">
 {pillars.location.weightedScore.toFixed(1)} pts
 </span>
 </div>
 <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] mt-1">
 <span>Score: {pillars.location.score}/100</span>
 <span>Weight: {pillars.location.weight}%</span>
 </div>
 <div className="w-full h-1.5 bg-[#E5E5E3] rounded-full mt-2 overflow-hidden">
 <div
 className={`h-full ${
 pillars.location.score >= 70 ? 'bg-[#DC2626]' : pillars.location.score >= 40 ? 'bg-[#D97706]' : 'bg-[#16A34A]'
 }`}
 style={{ width: `${pillars.location.score}%` }}
 />
 </div>
 </div>

 {/* Pillar 3: Voice */}
 <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
 <div className="flex items-center justify-between font-medium text-[#1A1A1A]">
 <span>Pillar 3: Tele-Verification &amp; Voice</span>
 <span className=" tabular-nums text-[#2563EB]">
 {pillars.voice.weightedScore.toFixed(1)} pts
 </span>
 </div>
 <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] mt-1">
 <span>Score: {pillars.voice.score}/100</span>
 <span>Weight: {pillars.voice.weight}%</span>
 </div>
 <div className="w-full h-1.5 bg-[#E5E5E3] rounded-full mt-2 overflow-hidden">
 <div
 className={`h-full ${
 pillars.voice.score >= 70 ? 'bg-[#DC2626]' : pillars.voice.score >= 40 ? 'bg-[#D97706]' : 'bg-[#16A34A]'
 }`}
 style={{ width: `${pillars.voice.score}%` }}
 />
 </div>
 </div>

 {/* Pillar 4: Documents */}
 <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
 <div className="flex items-center justify-between font-medium text-[#1A1A1A]">
 <span>Pillar 4: Supporting Documents</span>
 <span className=" tabular-nums text-[#2563EB]">
 {pillars.document.weightedScore.toFixed(1)} pts
 </span>
 </div>
 <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] mt-1">
 <span>Score: {pillars.document.score}/100</span>
 <span>Weight: {pillars.document.weight}%</span>
 </div>
 <div className="w-full h-1.5 bg-[#E5E5E3] rounded-full mt-2 overflow-hidden">
 <div
 className={`h-full ${
 pillars.document.score >= 70 ? 'bg-[#DC2626]' : pillars.document.score >= 40 ? 'bg-[#D97706]' : 'bg-[#16A34A]'
 }`}
 style={{ width: `${pillars.document.score}%` }}
 />
 </div>
 </div>
 </div>

 {/* Sum equation */}
 <div className="pt-2 border-t border-[#E5E5E3] flex items-center justify-between text-xs ">
 <span className="text-[#6B6B6B]">Total Weighted Score:</span>
 <span className="font-bold text-[#1A1A1A]">
 {(
 pillars.ektp.weightedScore +
 pillars.location.weightedScore +
 pillars.voice.weightedScore +
 pillars.document.weightedScore
 ).toFixed(1)} / 100
 </span>
 </div>
 </div>
 </div>

 {/* Right Column (7 cols): Flag Reasons & Decision Form */}
 <div className="lg:col-span-7 space-y-4">
 {/* Card: Explicit Reasons for Flags */}
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5">
 <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3 mb-3">
 <div>
 <h4 className="text-sm font-semibold text-[#1A1A1A]">
 Detected Anomaly &amp; Flag Reasons
 </h4>
 <p className="text-xs text-[#6B6B6B] mt-0.5">
 Every automated flag requires explicit human-readable reasons for auditability.
 </p>
 </div>
 <span className="text-xs font-medium text-[#6B6B6B]">
 {reasons.length} Reasons
 </span>
 </div>

 <div className="space-y-2">
 {reasons.map((reason, index) => (
 <div
 key={index}
 className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
 level === 'high'
 ? 'bg-[#DC2626]/5 border-[#DC2626]/20 text-[#DC2626]'
 : level === 'medium'
 ? 'bg-[#D97706]/5 border-[#D97706]/20 text-[#D97706]'
 : 'bg-[#16A34A]/5 border-[#16A34A]/20 text-[#16A34A]'
 }`}
 >
 <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
 <span className="text-[#1A1A1A] leading-relaxed font-medium">
 {reason}
 </span>
 </div>
 ))}
 </div>
 </div>

 {/* Card: Verifier Action Form */}
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
 <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
 <div>
 <h4 className="text-sm font-semibold text-[#1A1A1A]">
 Human Verifier Decision Console
 </h4>
 <p className="text-xs text-[#6B6B6B] mt-0.5">
 Current Status:{' '}
 <strong className="text-[#1A1A1A] capitalize">
 {status === 'pending'
 ? 'Pending Decision'
 : status === 'approved'
 ? 'Approved'
 : status === 'resurvey'
 ? 'Re-survey Required'
 : 'Rejected / Fraud'}
 </strong>
 </p>
 </div>
 </div>

 {/* Verifier Notes Input */}
 <div>
 <label className="block text-xs font-medium text-[#1A1A1A] mb-1">
 Verifier Assessment Notes &amp; Justification:
 </label>
 <textarea
 rows={3}
 value={decisionNote}
 onChange={(e) => setDecisionNote(e.target.value)}
 placeholder="Enter specific audit remarks regarding e-KTP data, surveyor coordinates, or tele-verification audio cues..."
 className="w-full bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg p-3 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
 />
 </div>

 {/* Decision Action Buttons */}
 <div className="pt-2 flex flex-wrap items-center gap-3">
 {/* Button 1: Approve */}
 <button
 disabled={isSubmitting}
 onClick={() => handleDecision('approved')}
 className="flex-1 py-2.5 px-4 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-medium transition-colors flex items-center justify-center gap-2"
 >
 <CheckCircle2 className="w-4 h-4" />
 <span>Approve Application</span>
 </button>

 {/* Button 2: Resurvey */}
 <button
 disabled={isSubmitting}
 onClick={() => handleDecision('resurvey')}
 className="flex-1 py-2.5 px-4 rounded-lg bg-white border border-[#D97706] text-[#D97706] hover:bg-[#D97706]/10 text-xs font-medium transition-colors flex items-center justify-center gap-2"
 >
 <RotateCcw className="w-4 h-4" />
 <span>Request Re-survey</span>
 </button>

 {/* Button 3: Reject / Fraud */}
 <button
 disabled={isSubmitting}
 onClick={() => handleDecision('rejected_fraud')}
 className="flex-1 py-2.5 px-4 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-medium transition-colors flex items-center justify-center gap-2"
 >
 <XCircle className="w-4 h-4" />
 <span>Reject &amp; Blacklist Fraud</span>
 </button>
 </div>
 </div>

 {/* Audit Trail Section */}
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5">
 <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3 mb-3">
 <div className="flex items-center gap-2">
 <History className="w-4 h-4 text-[#6B6B6B]" />
 <h4 className="text-sm font-semibold text-[#1A1A1A]">
 Audit Trail &amp; Chronological Log
 </h4>
 </div>
 <span className="text-[11px] text-[#6B6B6B]">
 Encrypted Logging compliant with OJK Regulations
 </span>
 </div>

 <div className="space-y-2.5">
 {auditTrail.map((item) => (
 <div
 key={item.id}
 className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] text-xs space-y-0.5"
 >
 <div className="flex items-center justify-between">
 <span className="font-semibold text-[#1A1A1A]">{item.action}</span>
 <span className="text-[10px] text-[#6B6B6B]">{item.timestamp}</span>
 </div>
 <div className="text-[11px] text-[#2563EB] font-medium">Actor: {item.actor}</div>
 <p className="text-[11px] text-[#6B6B6B]">{item.notes}</p>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};
