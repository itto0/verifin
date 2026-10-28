import React, { useState } from 'react';
import {
 FileText,
 CheckCircle2,
 AlertTriangle,
 MapPin,
 Sparkles,
 Building2,
 Search,
 ExternalLink,
 ShieldCheck,
 Check
} from 'lucide-react';
import { mockIcrDocuments, IcrDocumentSample } from '../../data/icrData';
import { DetailedIcrDocumentCard } from './DetailedIcrDocumentCard';

interface IcrDocumentViewProps {
 onSelectCase: (caseId: string) => void;
}

export const IcrDocumentView: React.FC<IcrDocumentViewProps> = ({ onSelectCase }) => {
 const [selectedDocId, setSelectedDocId] = useState<string>(mockIcrDocuments[0].id);
 const [correctedFields, setCorrectedFields] = useState<Record<string, string>>({});
 const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
 const [highlightedFieldKey, setHighlightedFieldKey] = useState<string | null>(null);

 const activeDoc: IcrDocumentSample =
 mockIcrDocuments.find((d) => d.id === selectedDocId) || mockIcrDocuments[0];

 const handleFieldValueChange = (fieldKey: string, newValue: string) => {
 setCorrectedFields((prev) => ({
 ...prev,
 [fieldKey]: newValue,
 }));
 };

 const handleSaveCorrection = () => {
 setSaveSuccess(true);
 setTimeout(() => setSaveSuccess(false), 3000);
 };

 return (
 <div className="space-y-6 max-w-7xl mx-auto">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h1 className="text-xl font-semibold text-[#1A1A1A]">
 ICR Document Reader &amp; Collateral Verification (&ldquo;Sentuh Tanahku&rdquo;)
 </h1>
 <p className="text-sm text-[#6B6B6B] mt-1">
 Intelligent Character Recognition (ICR) for handwritten field survey forms and ATR/BPN land parcel spatial matching.
 </p>
 </div>
 <div className="flex items-center gap-2">
 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E3] bg-[#F7F7F5] text-xs text-[#6B6B6B]">
 <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
 <span>ICR Engine v2.1 + BPN Persil API</span>
 </span>
 </div>
 </div>

 {/* Document Selection Tabs */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 {mockIcrDocuments.map((doc) => {
 const isSelected = doc.id === activeDoc.id;
 const isVerified = doc.status === 'verified';
 const isReview = doc.status === 'needs_review';

 return (
 <button
 key={doc.id}
 onClick={() => setSelectedDocId(doc.id)}
 className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
 isSelected
 ? 'border-[#2563EB] bg-blue-50/20 shadow-xs'
 : 'border-[#E5E5E3] bg-white hover:bg-[#F7F7F5]'
 }`}
 >
 <div>
 <div className="flex items-center justify-between text-xs mb-1">
 <span className=" text-[#6B6B6B]">{doc.caseId}</span>
 <span
 className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
 isVerified
 ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
 : isReview
 ? 'bg-amber-50 text-[#D97706] border border-amber-200'
 : 'bg-red-50 text-[#DC2626] border border-red-200'
 }`}
 >
 {isVerified ? 'BPN Validated' : isReview ? 'Needs Review' : 'Anomaly Detected'}
 </span>
 </div>
 <div className="font-semibold text-sm text-[#1A1A1A] line-clamp-1">{doc.title}</div>
 <div className="text-xs text-[#6B6B6B] mt-1">Applicant: {doc.applicantName}</div>
 </div>

 <div className="mt-3 pt-2 border-t border-[#E5E5E3] flex items-center justify-between text-xs">
 <span className="text-[#6B6B6B]">ICR Confidence:</span>
 <span
 className={` font-bold ${
 doc.overallConfidence >= 90
 ? 'text-[#16A34A]'
 : doc.overallConfidence >= 70
 ? 'text-[#D97706]'
 : 'text-[#DC2626]'
 }`}
 >
 {doc.overallConfidence}%
 </span>
 </div>
 </button>
 );
 })}
 </div>

 {/* Main Content: Left Document Preview + Right Extraction Data */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* Left Column: Authentic Document Scan & Related Photos (5 Cols) */}
 <div className="lg:col-span-5 space-y-4">
 <DetailedIcrDocumentCard
 document={activeDoc}
 onSelectCase={onSelectCase}
 highlightedFieldKey={highlightedFieldKey}
 />

 <div className="p-4 rounded-xl border border-[#E5E5E3] bg-white text-xs text-[#6B6B6B] space-y-1.5">
 <div className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
 <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
 <span>Multi-Pillar Verification Notes:</span>
 </div>
 <p className="leading-relaxed">{activeDoc.summaryNote}</p>
 </div>
 </div>

 {/* Right Column: Extracted Fields & Sentuh Tanahku BPN Persil (7 Cols) */}
 <div className="lg:col-span-7 space-y-4">
 {/* ATR/BPN Sentuh Tanahku Spasial Matching (If Certificate) */}
 {activeDoc.bpnSpatialVerification && (
 <div className="p-5 rounded-xl border border-[#E5E5E3] bg-white space-y-3">
 <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
 <div className="flex items-center gap-2">
 <Building2 className="w-4 h-4 text-[#2563EB]" />
 <span className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
 ATR/BPN Spatial Land Parcel Verification (&ldquo;Sentuh Tanahku&rdquo;)
 </span>
 </div>
 <span
 className={`px-2 py-0.5 rounded text-xs font-semibold ${
 activeDoc.bpnSpatialVerification.spatialMatchWithSurveyAddress
 ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
 : 'bg-red-50 text-[#DC2626] border border-red-200'
 }`}
 >
 {activeDoc.bpnSpatialVerification.sentuhTanahkuStatus}
 </span>
 </div>

 <div className="grid grid-cols-2 gap-3 text-xs">
 <div className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
 <span className="text-[#6B6B6B] block">Land Parcel NIB:</span>
 <strong className=" text-[#1A1A1A]">
 {activeDoc.bpnSpatialVerification.persilNib}
 </strong>
 </div>
 <div className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
 <span className="text-[#6B6B6B] block">Registered Surface Area:</span>
 <strong className="text-[#1A1A1A]">
 {activeDoc.bpnSpatialVerification.surfaceAreaM2} m²
 </strong>
 </div>
 <div className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
 <span className="text-[#6B6B6B] block">Registered Owner (Land Registry):</span>
 <strong className="text-[#1A1A1A]">
 {activeDoc.bpnSpatialVerification.registeredOwner}
 </strong>
 </div>
 <div className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
 <span className="text-[#6B6B6B] block">District Land Office:</span>
 <strong className="text-[#1A1A1A]">
 {activeDoc.bpnSpatialVerification.districtOffice}
 </strong>
 </div>
 </div>

 {/* Spatial Match Warning or Confirmation */}
 {activeDoc.bpnSpatialVerification.spatialMatchWithSurveyAddress ? (
 <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-[#16A34A] flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 shrink-0" />
 <span>
 Land certificate parcel coordinates match applicant home survey geolocation (&lt;10 meters distance).
 </span>
 </div>
 ) : (
 <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-[#DC2626] flex items-start gap-2">
 <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
 <div>
 <strong>Collateral Discrepancy Warning:</strong>
 <p className="mt-0.5 text-[11px]">
 Certificate registered under third-party enterprise name and does not match applicant identity.
 Potential proxy document or fictitious collateral.
 </p>
 </div>
 </div>
 )}
 </div>
 )}

 {/* Extracted Fields Table with Inline Verifier Correction */}
 <div className="p-5 rounded-xl border border-[#E5E5E3] bg-white space-y-4">
 <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
 <div>
 <h3 className="text-sm font-semibold text-[#1A1A1A]">
 Extracted ICR / Form Fields
 </h3>
 <p className="text-xs text-[#6B6B6B] mt-0.5">
 Highlighted fields have confidence &lt;80% and require manual verifier review.
 </p>
 </div>
 {saveSuccess && (
 <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A]">
 <Check className="w-4 h-4" />
 <span>Corrections Saved!</span>
 </span>
 )}
 </div>

 <div className="space-y-3">
 {activeDoc.extractedFields.map((field) => {
 const isLowConfidence = field.confidence < 80;
 const currentValue =
 correctedFields[field.fieldKey] !== undefined
 ? correctedFields[field.fieldKey]
 : field.extractedValue;

 return (
 <div
 key={field.fieldKey}
 onMouseEnter={() => setHighlightedFieldKey(field.fieldKey)}
 onMouseLeave={() => setHighlightedFieldKey(null)}
 className={`p-3 rounded-lg border transition-all ${
 highlightedFieldKey === field.fieldKey
 ? 'border-[#2563EB] ring-2 ring-[#2563EB]/20 bg-blue-50/20'
 : isLowConfidence
 ? 'border-amber-300 bg-amber-50/30'
 : 'border-[#E5E5E3] bg-[#F7F7F5]'
 }`}
 >
 <div className="flex items-center justify-between text-xs mb-1.5">
 <span className="font-semibold text-[#1A1A1A]">{field.label}</span>
 <div className="flex items-center gap-2">
 <span
 className={` text-[11px] font-semibold ${
 isLowConfidence ? 'text-[#D97706]' : 'text-[#16A34A]'
 }`}
 >
 {field.confidence}% Confidence
 </span>
 {field.isAnomaly && (
 <span className="px-1.5 py-0.5 rounded bg-red-100 text-[#DC2626] text-[10px] font-semibold">
 Anomaly
 </span>
 )}
 </div>
 </div>

 <div className="flex items-center gap-2">
 <input
 type="text"
 value={currentValue}
 onChange={(e) => handleFieldValueChange(field.fieldKey, e.target.value)}
 className={`w-full px-3 py-1.5 text-xs rounded border bg-white focus:outline-none ${
 isLowConfidence
 ? 'border-amber-400 focus:border-[#2563EB]'
 : 'border-[#E5E5E3] focus:border-[#2563EB]'
 }`}
 />
 </div>

 {field.anomalyNote && (
 <div className="text-[11px] text-[#D97706] mt-1.5 flex items-start gap-1">
 <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
 <span>{field.anomalyNote}</span>
 </div>
 )}
 </div>
 );
 })}
 </div>

 {/* Action Buttons */}
 <div className="pt-3 border-t border-[#E5E5E3] flex items-center justify-between">
 <span className="text-xs text-[#6B6B6B]">
 Manual corrections are continuously fed into model retraining.
 </span>
 <button
 onClick={handleSaveCorrection}
 className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
 >
 Save &amp; Update Fields
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};
