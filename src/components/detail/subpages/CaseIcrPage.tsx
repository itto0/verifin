import React, { useState } from 'react';
import {
 ScanLine,
 FileCheck,
 CheckCircle2,
 AlertTriangle,
 XCircle,
 Building2,
 MapPin,
 ExternalLink,
 ShieldCheck,
 Sparkles,
 Search,
 Check
} from 'lucide-react';
import { FinancingCase } from '../../../types';
import { mockIcrDocuments, IcrDocumentSample } from '../../../data/icrData';
import { DetailedIcrDocumentCard } from '../../icr/DetailedIcrDocumentCard';

interface CaseIcrPageProps {
 caseData: FinancingCase;
}

export const CaseIcrPage: React.FC<CaseIcrPageProps> = ({ caseData }) => {
 // Find associated ICR document for this case, fallback to first
 const relatedDoc: IcrDocumentSample =
 mockIcrDocuments.find((d) => d.caseId === caseData.id) || mockIcrDocuments[0];

 const [highlightedField, setHighlightedField] = useState<string | null>(null);

 return (
 <div className="space-y-6">
 {/* Top Banner: Verification Status */}
 <div className="p-5 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
 Page 5: ICR Form Reader &amp; Collateral Verification (&quot;Sentuh Tanahku&quot;)
 </span>
 <span className="text-xs text-[#6B6B6B]">·</span>
 <span
 className={`text-xs font-semibold px-2 py-0.5 rounded ${
 relatedDoc.status === 'mismatch_flag'
 ? 'bg-[#DC2626]/10 text-[#DC2626]'
 : relatedDoc.status === 'needs_review'
 ? 'bg-[#D97706]/10 text-[#D97706]'
 : 'bg-[#16A34A]/10 text-[#16A34A]'
 }`}
 >
 ICR Confidence: {relatedDoc.overallConfidence}% ({relatedDoc.status === 'mismatch_flag' ? 'Tamper / Mismatch' : relatedDoc.status === 'needs_review' ? 'Needs Review' : 'Verified'})
 </span>
 </div>
 <p className="text-xs text-[#1A1A1A] mt-1.5 leading-relaxed max-w-3xl">
 Performs intelligent character recognition (ICR) on handwritten surveyor forms, cross-checks physical asset evidence, and verifies land certificates against the Ministry of ATR/BPN &quot;Sentuh Tanahku&quot; spatial registry.
 </p>
 </div>

 <div className="flex items-center gap-4 shrink-0 bg-white p-3 rounded-xl border border-[#E5E5E3]">
 <div>
 <div className="text-[11px] text-[#6B6B6B]">Document Class</div>
 <div className="text-sm font-semibold text-[#1A1A1A]">
 {relatedDoc.type === 'survey_form' ? 'BAF Surveyor Form' : 'BPN SHM Certificate'}
 </div>
 </div>
 <div className="w-px h-8 bg-[#E5E5E3]" />
 <div>
 <div className="text-[11px] text-[#6B6B6B]">Registry Check</div>
 <div className="text-xs font-semibold flex items-center gap-1">
 {relatedDoc.bpnSpatialVerification ? (
 <span className="text-[#16A34A] flex items-center gap-1">
 <CheckCircle2 className="w-3.5 h-3.5" /> ATR/BPN Linked
 </span>
 ) : (
 <span className="text-[#2563EB] flex items-center gap-1">
 <CheckCircle2 className="w-3.5 h-3.5" /> Form Signed
 </span>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Main Grid: Detailed Document Viewer & Extracted ICR Fields */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
 {/* Left Column (7 cols): Detailed Document Card with CameraX & Cadastral Views */}
 <div className="lg:col-span-7 space-y-4">
 <DetailedIcrDocumentCard
 document={relatedDoc}
 onSelectCase={() => {}}
 highlightedFieldKey={highlightedField}
 />
 </div>

 {/* Right Column (5 cols): Extracted Handwritten Fields & Cadastral Spatial Check */}
 <div className="lg:col-span-5 space-y-4">
 {/* Extracted Fields Table */}
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
 <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
 <div>
 <h3 className="text-xs font-semibold text-[#1A1A1A]">
 ICR Handwritten Extracted Fields
 </h3>
 <p className="text-[11px] text-[#6B6B6B] mt-0.5">
 Click any row to pinpoint bounding box
 </p>
 </div>
 <span className="text-[10px] text-[#6B6B6B]">
 {relatedDoc.extractedFields.length} Fields
 </span>
 </div>

 <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
 {relatedDoc.extractedFields.map((field) => (
 <div
 key={field.fieldKey}
 onClick={() => setHighlightedField(field.fieldKey)}
 className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
 highlightedField === field.fieldKey
 ? 'bg-[#2563EB]/5 border-[#2563EB]'
 : 'bg-[#F7F7F5] border-[#E5E5E3] hover:border-[#CBD5E1]'
 }`}
 >
 <div className="flex items-center justify-between mb-1">
 <span className="font-medium text-[#1A1A1A]">{field.label}</span>
 <span
 className={` text-[10px] px-1.5 py-0.5 rounded font-semibold ${
 field.confidence >= 90
 ? 'bg-[#16A34A]/10 text-[#16A34A]'
 : field.confidence >= 70
 ? 'bg-[#D97706]/10 text-[#D97706]'
 : 'bg-[#DC2626]/10 text-[#DC2626]'
 }`}
 >
 {field.confidence}% Confidence
 </span>
 </div>

 <div className=" text-[11px] text-[#1A1A1A] font-semibold">
 {field.extractedValue}
 </div>

 {field.isAnomaly && (
 <div className="mt-1 text-[10px] font-semibold text-[#DC2626] flex items-center gap-1">
 <AlertTriangle className="w-3 h-3" />
 <span>{field.anomalyNote || 'Potential anomaly detected'}</span>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>

 {/* ATR/BPN Sentuh Tanahku Spatial Card */}
 {relatedDoc.bpnSpatialVerification ? (
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-3">
 <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
 <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
 <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
 <span>ATR/BPN &quot;Sentuh Tanahku&quot; Cadastral Plot</span>
 </div>
 <span className="text-[10px] text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded font-semibold">
 NIB: {relatedDoc.bpnSpatialVerification.persilNib}
 </span>
 </div>

 <div className="space-y-2 text-xs">
 <div className="flex items-center justify-between text-[#6B6B6B] pb-1.5 border-b border-[#E5E5E3]">
 <span>Registered SHM / SHGB:</span>
 <span className=" font-semibold text-[#1A1A1A]">
 {relatedDoc.bpnSpatialVerification.shmNumber}
 </span>
 </div>
 <div className="flex items-center justify-between text-[#6B6B6B] pb-1.5 border-b border-[#E5E5E3]">
 <span>Registered Land Area:</span>
 <span className=" font-semibold text-[#1A1A1A]">
 {relatedDoc.bpnSpatialVerification.surfaceAreaM2} m²
 </span>
 </div>
 <div className="flex items-center justify-between text-[#6B6B6B] pb-1.5 border-b border-[#E5E5E3]">
 <span>Certified Owner:</span>
 <span className="font-semibold text-[#1A1A1A]">
 {relatedDoc.bpnSpatialVerification.registeredOwner} ({relatedDoc.bpnSpatialVerification.applicantRelation})
 </span>
 </div>
 <div className="flex items-center justify-between text-[#6B6B6B]">
 <span>Spatial Alignment:</span>
 <span className={`font-semibold flex items-center gap-1 ${
 relatedDoc.bpnSpatialVerification.spatialMatchWithSurveyAddress
 ? 'text-[#16A34A]'
 : 'text-[#DC2626]'
 }`}>
 {relatedDoc.bpnSpatialVerification.spatialMatchWithSurveyAddress ? (
 <>
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span>Coordinates Match Surveyed Lot</span>
 </>
 ) : (
 <>
 <AlertTriangle className="w-3.5 h-3.5" />
 <span>Lot Coordinate Mismatch</span>
 </>
 )}
 </span>
 </div>
 </div>
 </div>
 ) : (
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-3">
 <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
 <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
 <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
 <span>Collateral Asset Verification</span>
 </div>
 <span className="text-[10px] text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded font-semibold">
 Motorcycle BPKB
 </span>
 </div>
 <p className="text-xs text-[#6B6B6B] leading-relaxed">
 Unit {caseData.vehicleModel} verified against dealer delivery order and PLN 900 VA meter serial number on site.
 </p>
 </div>
 )}
 </div>
 </div>
 </div>
 );
};
