import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  UserCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Layers,
  Info
} from 'lucide-react';
import { DocumentVerification } from '../../types';
import { DetailedKtpCard } from './DetailedKtpCard';
import { DetailedConsumerSelfie } from './DetailedConsumerSelfie';

interface EktpDocumentTabProps {
  document: DocumentVerification;
  customerName: string;
}

export const EktpDocumentTab: React.FC<EktpDocumentTabProps> = ({
  document,
  customerName,
}) => {
  const [showTamperHeatmap, setShowTamperHeatmap] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<'ktp' | 'selfie' | 'slip'>('ktp');

  const { nikValidation, ocrFields, tamperFlags, tamperScore, faceMatchScore, isScreenCaptureDetected } = document;

  return (
    <div className="space-y-6">
      {/* Top Banner: Verification Status */}
      <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
              Pillar 1: e-KTP &amp; Document Extraction (Weight: 30%)
            </span>
            <span className="text-xs text-[#6B6B6B]">·</span>
            <span
              className={`text-xs font-medium ${
                document.score >= 70
                  ? 'text-[#DC2626]'
                  : document.score >= 40
                  ? 'text-[#D97706]'
                  : 'text-[#16A34A]'
              }`}
            >
              Anomaly Score: {document.score}/100 ({document.score >= 70 ? 'High Risk' : document.score >= 40 ? 'Medium' : 'Clean / Low'})
            </span>
          </div>
          <p className="text-xs text-[#1A1A1A] mt-1">
            Automated OCR extraction with Dukcapil 16-digit NIK structure verification, biometric facial comparison, and font tamper heuristics.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-xs text-[#6B6B6B]">Face Match: KTP vs Selfie</div>
            <div
              className={`text-sm font-semibold tabular-nums font-mono ${
                faceMatchScore >= 80 ? 'text-[#16A34A]' : 'text-[#DC2626]'
              }`}
            >
              {faceMatchScore}% {faceMatchScore >= 80 ? 'Verified Match' : 'Mismatch Alert'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Document Viewer + OCR & NIK Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Document Image Viewer */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-4">
            {/* Document Selector Tabs */}
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDoc('ktp')}
                  className={`text-xs font-medium px-2.5 py-1 rounded transition-colors ${
                    selectedDoc === 'ktp'
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                  }`}
                >
                  Applicant e-KTP
                </button>
                <button
                  onClick={() => setSelectedDoc('selfie')}
                  className={`text-xs font-medium px-2.5 py-1 rounded transition-colors ${
                    selectedDoc === 'selfie'
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                  }`}
                >
                  Consumer Selfie
                </button>
                <button
                  onClick={() => setSelectedDoc('slip')}
                  className={`text-xs font-medium px-2.5 py-1 rounded transition-colors ${
                    selectedDoc === 'slip'
                      ? 'bg-[#1A1A1A] text-white'
                      : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                  }`}
                >
                  Salary Slip
                </button>
              </div>

              {selectedDoc === 'ktp' && (
                <button
                  onClick={() => setShowTamperHeatmap(!showTamperHeatmap)}
                  className={`text-[11px] px-2 py-0.5 rounded border flex items-center gap-1 transition-colors ${
                    showTamperHeatmap
                      ? 'bg-[#DC2626]/10 border-[#DC2626] text-[#DC2626] font-medium'
                      : 'border-[#E5E5E3] text-[#6B6B6B] hover:text-[#1A1A1A]'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Tamper Overlay</span>
                </button>
              )}
            </div>

            {/* Document Render Canvas */}
            <div className="relative rounded-xl overflow-hidden border border-[#E5E5E3] bg-[#F7F7F5] p-2 flex items-center justify-center">
              {selectedDoc === 'ktp' && (
                <DetailedKtpCard
                  document={document}
                  customerName={customerName}
                  showTamperOverlay={showTamperHeatmap}
                />
              )}

              {selectedDoc === 'selfie' && (
                <DetailedConsumerSelfie
                  document={document}
                  customerName={customerName}
                />
              )}

              {selectedDoc === 'slip' && (
                <div className="w-full h-full bg-white p-4 text-[#1A1A1A] text-[10px] flex flex-col justify-between">
                  <div className="border-b border-[#E5E5E3] pb-2 flex justify-between">
                    <div>
                      <div className="font-bold text-xs">PT MULTI KENCANA MANDIRI</div>
                      <div className="text-[#6B6B6B]">Employee Payroll Slip · October 2026</div>
                    </div>
                    <div className="text-right text-[#6B6B6B] font-mono">SLIP/2026/X/084</div>
                  </div>
                  <div className="space-y-1 my-2">
                    <div className="flex justify-between">
                      <span>Employee Name:</span>
                      <span className="font-semibold">{customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Salary:</span>
                      <span className="font-mono">IDR 5,800,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Allowances:</span>
                      <span className="font-mono">IDR 1,450,000</span>
                    </div>
                    <div className="flex justify-between border-t border-[#E5E5E3] pt-1 font-bold">
                      <span>Net Take Home Pay:</span>
                      <span className="font-mono text-[#2563EB]">IDR 7,250,000</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-[#6B6B6B] flex items-center justify-between border-t border-[#E5E5E3] pt-1">
                    <span>Corporate Stamp: HR &amp; Personnel</span>
                    <span className="text-[#16A34A] font-medium">Verified</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tamper Flags Summary */}
            <div className="mt-4 pt-3 border-t border-[#E5E5E3] space-y-2">
              <div className="text-xs font-semibold text-[#1A1A1A] flex items-center justify-between">
                <span>Physical Authenticity Indicators</span>
                <span className="text-xs font-mono tabular-nums text-[#6B6B6B]">
                  Tamper Score: {tamperScore}/100
                </span>
              </div>

              {tamperFlags.length > 0 ? (
                <div className="space-y-1.5">
                  {tamperFlags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="text-xs p-2 rounded bg-[#DC2626]/5 text-[#DC2626] border border-[#DC2626]/20 flex items-start gap-2"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs p-2 rounded bg-[#16A34A]/5 text-[#16A34A] border border-[#16A34A]/20 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>No visual tampering or digital paste artifacts detected on physical card.</span>
                </div>
              )}

              {isScreenCaptureDetected && (
                <div className="text-xs p-2 rounded bg-[#D97706]/5 text-[#D97706] border border-[#D97706]/20 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Moiré Pattern Detected: KTP likely photographed from a computer display rather than physical plastic.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): NIK Breakdown & OCR Field Confidence */}
        <div className="lg:col-span-7 space-y-4">
          {/* Section 1: 16-Digit NIK Structure Validator */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3 mb-3">
              <div>
                <h4 className="text-sm font-semibold text-[#1A1A1A]">
                  16-Digit NIK Structural Validation
                </h4>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Algorithmic parsing of regional codes and birth date per Indonesian Population Law.
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs font-medium flex items-center gap-1 ${
                    nikValidation.isValidStructure
                      ? 'text-[#16A34A]'
                      : 'text-[#DC2626]'
                  }`}
                >
                  {nikValidation.isValidStructure ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Structure Valid</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Structural Anomaly</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Digits segmentation badge bar */}
            <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
              <div className="text-center font-mono text-lg font-semibold tracking-widest text-[#1A1A1A] select-all">
                <span className="text-[#2563EB]" title="Province Code">
                  {nikValidation.nik.substring(0, 2)}
                </span>
                <span className="text-[#6B6B6B]">·</span>
                <span className="text-[#2563EB]" title="Regency/City Code">
                  {nikValidation.nik.substring(2, 4)}
                </span>
                <span className="text-[#6B6B6B]">·</span>
                <span className="text-[#2563EB]" title="District Code">
                  {nikValidation.nik.substring(4, 6)}
                </span>
                <span className="text-[#6B6B6B]">·</span>
                <span className="text-[#D97706] font-bold" title="Birth Date (DDMMYY)">
                  {nikValidation.nik.substring(6, 12)}
                </span>
                <span className="text-[#6B6B6B]">·</span>
                <span className="text-[#6B6B6B]" title="Registration Sequence">
                  {nikValidation.nik.substring(12, 16)}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-3 text-[11px] text-center border-t border-[#E5E5E3] pt-2 text-[#6B6B6B]">
                <div>
                  <div className="font-medium text-[#1A1A1A]">Province</div>
                  <div>{nikValidation.province}</div>
                </div>
                <div>
                  <div className="font-medium text-[#1A1A1A]">City &amp; District</div>
                  <div>{nikValidation.regency}</div>
                </div>
                <div>
                  <div className="font-medium text-[#1A1A1A]">Date of Birth</div>
                  <div>{nikValidation.birthDate} ({nikValidation.gender === 'Perempuan' ? 'Female' : 'Male'})</div>
                </div>
                <div>
                  <div className="font-medium text-[#1A1A1A]">Sequence ID</div>
                  <div className="font-mono">{nikValidation.sequenceNumber}</div>
                </div>
              </div>
            </div>

            {/* NIK Anomalies list */}
            {nikValidation.anomalies.length > 0 && (
              <div className="mt-3 p-2.5 rounded-lg bg-[#DC2626]/5 border border-[#DC2626]/20 text-xs text-[#DC2626] space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>NIK Inconsistency Alert:</span>
                </div>
                {nikValidation.anomalies.map((a, i) => (
                  <p key={i} className="pl-5 text-[11px] leading-relaxed">
                    {a}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: OCR Fields Confidence Table */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3 mb-3">
              <div>
                <h4 className="text-sm font-semibold text-[#1A1A1A]">
                  Field-by-Field OCR Extraction Results
                </h4>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Fields with confidence &lt;90% highlighted in amber for verifier attention.
                </p>
              </div>
              <span className="text-[11px] text-[#6B6B6B]">
                Threshold: 90%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E5E3] text-[#6B6B6B]">
                    <th className="py-2 px-2 font-medium">Field</th>
                    <th className="py-2 px-2 font-medium">Extracted Value</th>
                    <th className="py-2 px-2 font-medium text-right">Confidence</th>
                    <th className="py-2 px-2 font-medium">Status &amp; Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E3]">
                  {Object.entries(ocrFields).map(([key, field]) => {
                    const isLowConfidence = field.confidence < 90;
                    return (
                      <tr
                        key={key}
                        className={`transition-colors ${
                          field.isAnomaly
                            ? 'bg-[#DC2626]/5'
                            : isLowConfidence
                            ? 'bg-[#D97706]/5'
                            : 'hover:bg-[#F7F7F5]'
                        }`}
                      >
                        <td className="py-2.5 px-2 font-medium text-[#1A1A1A] whitespace-nowrap">
                          {field.label}
                        </td>
                        <td className="py-2.5 px-2 font-mono text-[#1A1A1A]">
                          {field.value}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums font-medium">
                          <span
                            className={
                              field.isAnomaly
                                ? 'text-[#DC2626]'
                                : isLowConfidence
                                ? 'text-[#D97706]'
                                : 'text-[#16A34A]'
                            }
                          >
                            {field.confidence}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          {field.anomalyReason ? (
                            <span className="text-[#DC2626] font-medium flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{field.anomalyReason}</span>
                            </span>
                          ) : isLowConfidence ? (
                            <span className="text-[#D97706] font-medium flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>Below 90% threshold</span>
                            </span>
                          ) : (
                            <span className="text-[#16A34A] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              <span>Valid</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
