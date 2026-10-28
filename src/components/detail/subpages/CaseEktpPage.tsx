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
  Info,
  Camera,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';
import { FinancingCase } from '../../../types';
import { DetailedKtpCard } from '../DetailedKtpCard';
import { DetailedConsumerSelfie } from '../DetailedConsumerSelfie';

interface CaseEktpPageProps {
  caseData: FinancingCase;
}

export const CaseEktpPage: React.FC<CaseEktpPageProps> = ({ caseData }) => {
  const { document, customerName, customerNik } = caseData;
  const [showTamperHeatmap, setShowTamperHeatmap] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<'ktp' | 'selfie' | 'slip'>('ktp');
  const [copiedNik, setCopiedNik] = useState(false);

  const { nikValidation, ocrFields, tamperFlags, tamperScore, faceMatchScore, isScreenCaptureDetected } = document;

  const handleCopyNik = () => {
    navigator.clipboard.writeText(customerNik);
    setCopiedNik(true);
    setTimeout(() => setCopiedNik(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Verification Status */}
      <div className="p-5 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
              Page 2: Civil Identity &amp; Biometric Verification
            </span>
            <span className="text-xs text-[#6B6B6B]">·</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                document.score >= 70
                  ? 'bg-[#DC2626]/10 text-[#DC2626]'
                  : document.score >= 40
                  ? 'bg-[#D97706]/10 text-[#D97706]'
                  : 'bg-[#16A34A]/10 text-[#16A34A]'
              }`}
            >
              Document Anomaly Score: {document.score}/100 ({document.score >= 70 ? 'High Risk' : document.score >= 40 ? 'Medium' : 'Clean / Verified'})
            </span>
          </div>
          <p className="text-xs text-[#1A1A1A] mt-1.5 leading-relaxed max-w-3xl">
            Automated OCR extraction cross-referenced against the Ministry of Home Affairs (Dukcapil) 16-digit civil algorithm, real-time 3D CameraX selfie liveness, and microtext font tamper analysis.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 bg-white p-3 rounded-xl border border-[#E5E5E3]">
          <div>
            <div className="text-[11px] text-[#6B6B6B]">Biometric Face Match</div>
            <div
              className={`text-base font-bold font-mono ${
                faceMatchScore >= 80 ? 'text-[#16A34A]' : 'text-[#DC2626]'
              }`}
            >
              {faceMatchScore}% {faceMatchScore >= 80 ? 'Verified' : 'Mismatch'}
            </div>
          </div>
          <div className="w-px h-8 bg-[#E5E5E3]" />
          <div>
            <div className="text-[11px] text-[#6B6B6B]">Civil NIK Status</div>
            <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1">
              {nikValidation.dukcapilMatch ? (
                <span className="text-[#16A34A] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Dukcapil Active
                </span>
              ) : (
                <span className="text-[#DC2626] flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Unregistered
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Document Image Viewer + OCR & NIK Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Document Viewer */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-4">
            {/* Document Selector Tabs */}
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3 mb-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedDoc('ktp')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedDoc === 'ktp'
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#1A1A1A]'
                  }`}
                >
                  e-KTP Card
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDoc('selfie')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    selectedDoc === 'selfie'
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#1A1A1A]'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Consumer Selfie</span>
                </button>
                {document.slipGajiImageUrl && (
                  <button
                    type="button"
                    onClick={() => setSelectedDoc('slip')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedDoc === 'slip'
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#1A1A1A]'
                    }`}
                  >
                    Salary Slip
                  </button>
                )}
              </div>

              {selectedDoc === 'ktp' && (
                <button
                  type="button"
                  onClick={() => setShowTamperHeatmap(!showTamperHeatmap)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 ${
                    showTamperHeatmap
                      ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30 font-semibold'
                      : 'bg-[#F7F7F5] text-[#6B6B6B] border-[#E5E5E3] hover:text-[#1A1A1A]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showTamperHeatmap ? 'Hide Heatmap' : 'Tamper Heatmap'}</span>
                </button>
              )}
            </div>

            {/* Document Render Canvas */}
            <div className="space-y-3">
              {selectedDoc === 'ktp' ? (
                <DetailedKtpCard
                  document={document}
                  customerName={customerName}
                  showTamperOverlay={showTamperHeatmap}
                />
              ) : selectedDoc === 'selfie' ? (
                <DetailedConsumerSelfie
                  document={document}
                  customerName={customerName}
                />
              ) : (
                <div className="p-4 bg-[#F7F7F5] border border-[#E5E5E3] rounded-xl text-center space-y-2">
                  <FileText className="w-8 h-8 text-[#6B6B6B] mx-auto" />
                  <div className="text-xs font-medium text-[#1A1A1A]">Official Corporate Payroll Slip</div>
                  <div className="text-[11px] text-[#6B6B6B]">PT Citra Nusantara Mandiri · Verified</div>
                </div>
              )}
            </div>
          </div>

          {/* Tamper Detection Box */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
              <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Forensic Tamper Detection</span>
              </div>
              <span
                className={`text-xs font-mono font-bold ${
                  tamperScore > 50 ? 'text-[#DC2626]' : 'text-[#16A34A]'
                }`}
              >
                Tamper Score: {tamperScore}/100
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span>Screen Capture Detection:</span>
                <span className={`font-medium ${isScreenCaptureDetected ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                  {isScreenCaptureDetected ? 'Detected (Display Moire Pattern)' : 'Passed (Physical ID Card)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span>Font Microtext Consistency:</span>
                <span className={`font-medium ${tamperFlags.some(f => f.includes('Font')) ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                  {tamperFlags.some(f => f.includes('Font')) ? 'Font Weight Anomaly' : 'Standard Dukcapil Font'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span>Official Garuda Hologram:</span>
                <span className="text-[#16A34A] font-medium">Reflective Luster Intact</span>
              </div>
            </div>

            {tamperFlags.length > 0 && (
              <div className="p-2.5 rounded-lg bg-[#DC2626]/5 border border-[#DC2626]/20 space-y-1">
                <div className="text-[11px] font-semibold text-[#DC2626] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Tamper Alerts:</span>
                </div>
                {tamperFlags.map((flag, idx) => (
                  <div key={idx} className="text-[11px] text-[#DC2626] pl-2 border-l-2 border-[#DC2626]">
                    {flag}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Dukcapil Algorithmic Analysis & OCR Table */}
        <div className="lg:col-span-7 space-y-4">
          {/* NIK Breakdown Card */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
              <div>
                <h3 className="text-xs font-semibold text-[#1A1A1A]">
                  Dukcapil 16-Digit NIK Structure Analysis
                </h3>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                  Civil Registry Permendagri No. 109/2019 Algorithmic Validation
                </p>
              </div>
              <button
                onClick={handleCopyNik}
                className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] flex items-center gap-1 bg-[#F7F7F5] border border-[#E5E5E3] px-2.5 py-1 rounded-lg"
              >
                <span className="font-mono">{customerNik}</span>
                {copiedNik ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* 16-Digit Visual Breakdown */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-3 bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg">
                <div className="text-[10px] text-[#6B6B6B] uppercase font-semibold">Province &amp; City</div>
                <div className="text-sm font-bold font-mono text-[#1A1A1A] mt-0.5">
                  {nikValidation.nik.slice(0, 4)}
                </div>
                <div className="text-[11px] text-[#6B6B6B] mt-1 truncate">
                  {nikValidation.province}, {nikValidation.regency}
                </div>
              </div>

              <div className="p-3 bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg">
                <div className="text-[10px] text-[#6B6B6B] uppercase font-semibold">District Code</div>
                <div className="text-sm font-bold font-mono text-[#1A1A1A] mt-0.5">
                  {nikValidation.nik.slice(4, 6)}
                </div>
                <div className="text-[11px] text-[#6B6B6B] mt-1 truncate">
                  Kec. {nikValidation.district}
                </div>
              </div>

              <div className="p-3 bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg">
                <div className="text-[10px] text-[#6B6B6B] uppercase font-semibold">DOB + Gender Code</div>
                <div className="text-sm font-bold font-mono text-[#1A1A1A] mt-0.5">
                  {nikValidation.nik.slice(6, 12)}
                </div>
                <div className="text-[11px] text-[#6B6B6B] mt-1 truncate">
                  {nikValidation.birthDate} ({nikValidation.gender})
                </div>
              </div>

              <div className="p-3 bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg">
                <div className="text-[10px] text-[#6B6B6B] uppercase font-semibold">Serial Index</div>
                <div className="text-sm font-bold font-mono text-[#1A1A1A] mt-0.5">
                  {nikValidation.nik.slice(12, 16)}
                </div>
                <div className="text-[11px] text-[#6B6B6B] mt-1 truncate">
                  Registered #{nikValidation.sequenceNumber}
                </div>
              </div>
            </div>

            {/* Validation Outcome Bar */}
            <div
              className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                nikValidation.isValidStructure && nikValidation.dukcapilMatch
                  ? 'bg-[#16A34A]/5 border-[#16A34A]/20 text-[#16A34A]'
                  : 'bg-[#DC2626]/5 border-[#DC2626]/20 text-[#DC2626]'
              }`}
            >
              <div className="flex items-center gap-2">
                {nikValidation.isValidStructure && nikValidation.dukcapilMatch ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
                <span className="font-semibold">
                  {nikValidation.isValidStructure && nikValidation.dukcapilMatch
                    ? 'NIK structure adheres to Ministry of Home Affairs civil algorithms.'
                    : 'Algorithmic or Dukcapil Civil Discrepancy Detected.'}
                </span>
              </div>
              <span className="font-mono text-[11px]">
                {nikValidation.anomalies.length > 0 ? `${nikValidation.anomalies.length} Anomaly` : '0 Anomalies'}
              </span>
            </div>
          </div>

          {/* OCR Extracted Fields Table */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
              <div>
                <h3 className="text-xs font-semibold text-[#1A1A1A]">
                  OCR Extracted Field Values &amp; Confidence
                </h3>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                  Bilingual OCR Engine confidence levels and validation tags
                </p>
              </div>
              <span className="text-[11px] text-[#6B6B6B] font-mono">
                {Object.keys(ocrFields).length} Fields Extracted
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E5E3] text-[#6B6B6B] bg-[#F7F7F5]/50">
                    <th className="py-2.5 px-3 font-semibold">Field Name</th>
                    <th className="py-2.5 px-3 font-semibold">Extracted Value</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Confidence</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E3]">
                  {Object.entries(ocrFields).map(([key, field]) => (
                    <tr key={key} className="hover:bg-[#F7F7F5]/40 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-[#1A1A1A]">{field.label}</td>
                      <td className="py-2.5 px-3 font-mono text-[#1A1A1A]">{field.value}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                            field.confidence >= 95
                              ? 'bg-[#16A34A]/10 text-[#16A34A]'
                              : field.confidence >= 80
                              ? 'bg-[#D97706]/10 text-[#D97706]'
                              : 'bg-[#DC2626]/10 text-[#DC2626]'
                          }`}
                        >
                          {field.confidence}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {field.isAnomaly ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{field.anomalyReason || 'Anomaly'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Clean</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
