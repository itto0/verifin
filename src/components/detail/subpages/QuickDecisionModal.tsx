import React, { useState } from 'react';
import {
 X,
 CheckCircle2,
 AlertTriangle,
 XCircle,
 Send,
 ShieldAlert,
 Info
} from 'lucide-react';
import { FinancingCase, CaseStatus } from '../../../types';

interface QuickDecisionModalProps {
 isOpen: boolean;
 onClose: () => void;
 caseData: FinancingCase;
 onUpdateStatus: (caseId: string, newStatus: CaseStatus, note: string) => void;
}

export const QuickDecisionModal: React.FC<QuickDecisionModalProps> = ({
 isOpen,
 onClose,
 caseData,
 onUpdateStatus,
}) => {
 const [decisionChoice, setDecisionChoice] = useState<CaseStatus>(caseData.status);
 const [decisionNotes, setDecisionNotes] = useState(caseData.decisionNotes || '');
 const [isSubmitting, setIsSubmitting] = useState(false);

 if (!isOpen) return null;

 const handleInsertTag = (tag: string) => {
 setDecisionNotes((prev: string) => (prev ? `${prev}. ${tag}` : tag));
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 setIsSubmitting(true);
 const finalNote = decisionNotes.trim() || `Decision ${decisionChoice} confirmed by manual verifier.`;
 setTimeout(() => {
 onUpdateStatus(caseData.id, decisionChoice, finalNote);
 setIsSubmitting(false);
 onClose();
 }, 300);
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
 <div className="bg-white border border-[#E5E5E3] rounded-xl max-w-lg w-full p-6 space-y-5 shadow-none animate-in fade-in zoom-in-95 duration-150">
 {/* Header */}
 <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
 <div>
 <h3 className="text-base font-semibold text-[#1A1A1A]">
 Underwriting Decision Console
 </h3>
 <p className="text-xs text-[#6B6B6B] mt-0.5">
 Case {caseData.applicationNumber} · {caseData.customerName}
 </p>
 </div>
 <button
 onClick={onClose}
 className="p-1.5 rounded-lg border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F7F5] transition-colors"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 {/* Current Risk Snapshot */}
 <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] flex items-center justify-between text-xs">
 <div className="flex items-center gap-2">
 <ShieldAlert className="w-4 h-4 text-[#2563EB]" />
 <span className="text-[#1A1A1A] font-medium">Composite Risk Score:</span>
 </div>
 <span
 className={` font-bold px-2 py-0.5 rounded text-xs ${
 caseData.riskScore.level === 'high'
 ? 'bg-[#DC2626]/10 text-[#DC2626]'
 : caseData.riskScore.level === 'medium'
 ? 'bg-[#D97706]/10 text-[#D97706]'
 : 'bg-[#16A34A]/10 text-[#16A34A]'
 }`}
 >
 {caseData.riskScore.totalScore}/100 ({caseData.riskScore.level.toUpperCase()} RISK)
 </span>
 </div>

 {/* Form */}
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="text-xs font-semibold text-[#1A1A1A] block mb-2">
 Select Verification Action:
 </label>
 <div className="grid grid-cols-3 gap-2">
 <button
 type="button"
 onClick={() => setDecisionChoice('approved')}
 className={`py-2.5 px-2 text-xs font-semibold rounded-lg border transition-all flex flex-col items-center gap-1.5 ${
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
 className={`py-2.5 px-2 text-xs font-semibold rounded-lg border transition-all flex flex-col items-center gap-1.5 ${
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
 className={`py-2.5 px-2 text-xs font-semibold rounded-lg border transition-all flex flex-col items-center gap-1.5 ${
 decisionChoice === 'rejected_fraud'
 ? 'bg-[#DC2626] text-white border-[#DC2626]'
 : 'bg-white text-[#1A1A1A] border-[#E5E5E3] hover:bg-[#F7F7F5]'
 }`}
 >
 <XCircle className="w-4 h-4" />
 <span>Reject Fraud</span>
 </button>
 </div>
 </div>

 {/* Quick Tags */}
 <div className="space-y-1.5">
 <span className="text-[11px] text-[#6B6B6B] block">Quick Rationale Tags:</span>
 <div className="flex flex-wrap gap-1">
 <button
 type="button"
 onClick={() => handleInsertTag('e-KTP and Dukcapil verification passed')}
 className="text-[10px] px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E3] text-[#1A1A1A] hover:bg-[#E5E5E3]"
 >
 + Valid Dukcapil
 </button>
 <button
 type="button"
 onClick={() => handleInsertTag('Mock location app detected on surveyor device')}
 className="text-[10px] px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E3] text-[#DC2626] hover:bg-[#E5E5E3]"
 >
 + Fake GPS
 </button>
 <button
 type="button"
 onClick={() => handleInsertTag('Survey radius mismatch > 1000m from residence')}
 className="text-[10px] px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E3] text-[#DC2626] hover:bg-[#E5E5E3]"
 >
 + Geofence Breach
 </button>
 <button
 type="button"
 onClick={() => handleInsertTag('Customer speech hesitancy in tele-verification')}
 className="text-[10px] px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E3] text-[#D97706] hover:bg-[#E5E5E3]"
 >
 + Voice Hesitancy
 </button>
 <button
 type="button"
 onClick={() => handleInsertTag('ICR document signature & BPN registry verified')}
 className="text-[10px] px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E3] text-[#16A34A] hover:bg-[#E5E5E3]"
 >
 + ICR Valid
 </button>
 </div>
 </div>

 {/* Notes textarea */}
 <div>
 <label className="text-xs font-semibold text-[#1A1A1A] block mb-1">
 Audit Notes &amp; Verifier Justification:
 </label>
 <textarea
 rows={3}
 value={decisionNotes}
 onChange={(e) => setDecisionNotes(e.target.value)}
 placeholder="Enter comprehensive verification notes for OJK audit trail..."
 className="w-full p-2.5 text-xs bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#2563EB] leading-relaxed resize-none"
 />
 </div>

 {/* Actions */}
 <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E5E5E3]">
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#E5E5E3] text-[#1A1A1A] hover:bg-[#F7F7F5] transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={isSubmitting}
 className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors flex items-center gap-1.5"
 >
 <Send className="w-3.5 h-3.5" />
 <span>{isSubmitting ? 'Recording...' : 'Confirm Decision'}</span>
 </button>
 </div>
 </form>
 </div>
 </div>
 );
};
