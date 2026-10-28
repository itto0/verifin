import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Headphones,
  SlidersHorizontal,
  Bike,
  Building,
  User,
  CreditCard,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Send,
  History,
  Copy,
  Check
} from 'lucide-react';
import { FinancingCase, CaseStatus } from '../../types';
import { ExecutiveSummaryTab } from './ExecutiveSummaryTab';
import { EktpDocumentTab } from './EktpDocumentTab';
import { GeoSurveyTab } from './GeoSurveyTab';
import { VoiceVerificationTab } from './VoiceVerificationTab';
import { RiskEngineDecisionTab } from './RiskEngineDecisionTab';

interface CaseDetailViewProps {
  caseData: FinancingCase;
  onBackToQueue: () => void;
  onUpdateStatus: (caseId: string, newStatus: CaseStatus, note: string) => void;
}

export type DetailPillarTab = 'summary' | 'ektp' | 'geo' | 'voice' | 'decision';

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({
  caseData,
  onBackToQueue,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<DetailPillarTab>('summary');
  const [decisionChoice, setDecisionChoice] = useState<CaseStatus>(caseData.status);
  const [decisionNotes, setDecisionNotes] = useState(caseData.decisionNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedNik, setCopiedNik] = useState(false);

  const { riskScore } = caseData;
  const isHigh = riskScore.level === 'high';
  const isMedium = riskScore.level === 'medium';

  const handleCopyNik = () => {
    navigator.clipboard.writeText(caseData.customerNik);
    setCopiedNik(true);
    setTimeout(() => setCopiedNik(false), 2000);
  };

  const handleInsertTag = (tag: string) => {
    setDecisionNotes((prev) => (prev ? `${prev}. ${tag}` : tag));
  };

  const handleSaveDecision = () => {
    setIsSubmitting(true);
    const finalNote = decisionNotes.trim() || `Keputusan ${decisionChoice} ditetapkan oleh verifikator.`;
    setTimeout(() => {
      onUpdateStatus(caseData.id, decisionChoice, finalNote);
      setIsSubmitting(false);
      setActionSuccess(
        decisionChoice === 'approved'
          ? 'Pengajuan berhasil disetujui (Approved) dan dialihkan ke LOS.'
          : decisionChoice === 'resurvey'
          ? 'Instruksi survey ulang berhasil dikirimkan ke CMO cabang.'
          : 'Pengajuan ditolak sebagai indikasi fraud & dicatat pada audit trail OJK.'
      );
      setTimeout(() => setActionSuccess(null), 4000);
    }, 400);
  };

  return (
    <div className="space-y-5">
      {/* Top Header: Navigation Breadcrumb & Quick Case Meta Strip */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToQueue}
            className="p-2 rounded-lg border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F7F5] transition-colors"
            title="Kembali ke antrean review"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">
                {caseData.customerName}
              </h2>
              <span className="font-mono text-xs bg-[#F7F7F5] border border-[#E5E5E3] px-2 py-0.5 rounded text-[#1A1A1A] font-medium">
                {caseData.applicationNumber}
              </span>
              <button
                onClick={handleCopyNik}
                className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] flex items-center gap-1 font-mono bg-[#F7F7F5] px-1.5 py-0.5 rounded border border-[#E5E5E3]"
                title="Salin NIK"
              >
                <span>NIK: {caseData.customerNik}</span>
                {copiedNik ? <Check className="w-3 h-3 text-[#16A34A]" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <div className="text-xs text-[#6B6B6B] mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium text-[#1A1A1A]">{caseData.branch}</span>
              <span>·</span>
              <span>Diajukan: {caseData.submittedAt} WIB</span>
              <span>·</span>
              <span className="capitalize">
                Status:{' '}
                <strong
                  className={`font-semibold ${
                    caseData.status === 'approved'
                      ? 'text-[#16A34A]'
                      : caseData.status === 'rejected_fraud'
                      ? 'text-[#DC2626]'
                      : caseData.status === 'resurvey'
                      ? 'text-[#D97706]'
                      : 'text-[#2563EB]'
                  }`}
                >
                  {caseData.status}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* 4 Financial Metric Chips & Composite Risk Badge */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] text-xs">
            <span className="text-[#6B6B6B]">Unit: </span>
            <span className="font-semibold text-[#1A1A1A]">{caseData.vehicleModel}</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] text-xs">
            <span className="text-[#6B6B6B]">Plafon: </span>
            <span className="font-semibold text-[#1A1A1A] font-mono">
              Rp {(caseData.loanAmount / 1000000).toFixed(1)} Jt
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] text-xs">
            <span className="text-[#6B6B6B]">Cicilan: </span>
            <span className="font-semibold text-[#2563EB] font-mono">
              Rp {caseData.monthlyInstallment.toLocaleString('id-ID')}/bln
            </span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold font-mono flex items-center gap-1.5 ${
              isHigh
                ? 'bg-[#DC2626]/10 border-[#DC2626]/30 text-[#DC2626]'
                : isMedium
                ? 'bg-[#D97706]/10 border-[#D97706]/30 text-[#D97706]'
                : 'bg-[#16A34A]/10 border-[#16A34A]/30 text-[#16A34A]'
            }`}
          >
            <span>Skor: {riskScore.totalScore}/100</span>
            <span>·</span>
            <span>{isHigh ? 'Risiko Tinggi' : isMedium ? 'Risiko Sedang' : 'Risiko Rendah'}</span>
          </div>
        </div>
      </div>

      {/* Alert Notification Toast */}
      {actionSuccess && (
        <div className="p-3.5 rounded-lg bg-[#16A34A]/10 border border-[#16A34A]/30 text-[#16A34A] text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Ergonomic 2-Column Institutional Underwriting Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (4 of 12 cols): Sticky Verifier Underwriting Console */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
          {/* Card A: Multi-Pillar Risk Engine Scorecard */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
              <div className="text-xs font-semibold text-[#1A1A1A]">
                Evaluasi Multi-Pilar Risiko
              </div>
              <span className="text-[11px] text-[#6B6B6B]">Standar BAF</span>
            </div>

            {/* Pillar Breakdown Table */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span className="text-[#1A1A1A] font-medium">1. e-KTP &amp; Biometrik (30%)</span>
                </div>
                <span
                  className={`font-mono font-bold ${
                    caseData.document.score >= 70
                      ? 'text-[#DC2626]'
                      : caseData.document.score >= 40
                      ? 'text-[#D97706]'
                      : 'text-[#16A34A]'
                  }`}
                >
                  {caseData.document.score}/100
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span className="text-[#1A1A1A] font-medium">2. Geotag &amp; Survei (30%)</span>
                </div>
                <span
                  className={`font-mono font-bold ${
                    caseData.geo.score >= 70
                      ? 'text-[#DC2626]'
                      : caseData.geo.score >= 40
                      ? 'text-[#D97706]'
                      : 'text-[#16A34A]'
                  }`}
                >
                  {caseData.geo.score}/100
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
                <div className="flex items-center gap-2">
                  <Headphones className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span className="text-[#1A1A1A] font-medium">3. Tele-Verifikasi QA (25%)</span>
                </div>
                <span
                  className={`font-mono font-bold ${
                    caseData.voice.score >= 70
                      ? 'text-[#DC2626]'
                      : caseData.voice.score >= 40
                      ? 'text-[#D97706]'
                      : 'text-[#16A34A]'
                  }`}
                >
                  {caseData.voice.score}/100
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span className="text-[#1A1A1A] font-medium">4. Dokumen &amp; ICR (15%)</span>
                </div>
                <span className="font-mono font-bold text-[#16A34A]">15/100</span>
              </div>
            </div>

            {/* Key Detected Anomalies Checklist */}
            {riskScore.reasons.length > 0 && (
              <div className="pt-2 border-t border-[#E5E5E3] space-y-1.5">
                <div className="text-[11px] font-semibold text-[#DC2626] uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Anomali Terdeteksi Mesin AI:</span>
                </div>
                <ul className="space-y-1 text-xs text-[#1A1A1A]">
                  {riskScore.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px] leading-relaxed">
                      <span className="text-[#DC2626] font-bold">·</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Card B: Konsol Keputusan Verifikator (The Action Dock) */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
              <div className="text-xs font-semibold text-[#1A1A1A]">
                Keputusan Manual Verifikator
              </div>
              <span className="text-[10px] bg-[#2563EB]/10 text-[#2563EB] px-2 py-0.5 rounded font-semibold">
                SLA Review
              </span>
            </div>

            {/* Structured Segmented Choice for Decision */}
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
                <span>Setujui</span>
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
                <span>Survey Ulang</span>
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
                <span>Tolak Fraud</span>
              </button>
            </div>

            {/* Quick Reason Insert Tags */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-[#6B6B6B] font-medium block">
                Catatan Verifikasi &amp; Alasan Keputusan:
              </label>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => handleInsertTag('NIK terverifikasi valid')}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E3] hover:bg-[#E5E5E3] text-[#1A1A1A]"
                >
                  + NIK Valid
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('Mock Location terdeteksi')}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E3] hover:bg-[#E5E5E3] text-[#DC2626]"
                >
                  + FakeGPS
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('Jarak > 1.000 meter')}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E3] hover:bg-[#E5E5E3] text-[#DC2626]"
                >
                  + Radius Merah
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('Suara konsumen ragu')}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E3] hover:bg-[#E5E5E3] text-[#D97706]"
                >
                  + Suara Ragu
                </button>
              </div>

              <textarea
                rows={3}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Tuliskan catatan pertimbangan verifikator untuk audit trail OJK..."
                className="w-full p-2.5 text-xs bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#2563EB] leading-relaxed resize-none"
              />
            </div>

            {/* Submit Action Button */}
            <button
              type="button"
              onClick={handleSaveDecision}
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Kirim & Simpan Keputusan'}</span>
            </button>
          </div>

          {/* Card C: Immutable Audit Trail Log */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
              <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span>Audit Trail Pengajuan</span>
              </div>
              <span className="text-[10px] text-[#6B6B6B] font-mono">
                {caseData.auditTrail.length} Entri
              </span>
            </div>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {caseData.auditTrail.map((log) => (
                <div key={log.id} className="text-[11px] space-y-0.5 pb-2 border-b border-[#E5E5E3] last:border-0">
                  <div className="flex items-center justify-between text-[#6B6B6B]">
                    <span className="font-semibold text-[#1A1A1A]">{log.action}</span>
                    <span className="font-mono text-[10px]">{log.timestamp.split(' ')[1]}</span>
                  </div>
                  <div className="text-[#6B6B6B] truncate">{log.actor}</div>
                  <div className="text-[#1A1A1A] text-[10px] italic">{log.notes}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (8 of 12 cols): Forensic Investigation Workspace */}
        <div className="lg:col-span-8 space-y-4">
          {/* Structured Navigation Segment Bar */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-2.5 flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'summary'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ringkasan Eksekutif (4 Pilar)</span>
            </button>

            <button
              onClick={() => setActiveTab('ektp')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'ektp'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>1. e-KTP &amp; Biometrik</span>
            </button>

            <button
              onClick={() => setActiveTab('geo')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'geo'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>2. Geotag &amp; Survei GIS</span>
            </button>

            <button
              onClick={() => setActiveTab('voice')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'voice'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>3. Tele-Verifikasi QA</span>
            </button>

            <button
              onClick={() => setActiveTab('decision')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'decision'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>4. Parameter Risiko</span>
            </button>
          </div>

          {/* ACTIVE TAB CANVAS */}
          <div>
            {/* TAB 0: Ringkasan Eksekutif (4 Pilar Side-by-Side Matrix) */}
            {activeTab === 'summary' && (
              <ExecutiveSummaryTab
                caseData={caseData}
                onNavigateTab={(tab) => {
                  if (tab === 'icr') {
                    setActiveTab('decision');
                  } else {
                    setActiveTab(tab);
                  }
                }}
              />
            )}

            {/* TAB 1: Forensik e-KTP & Biometrik */}
            {activeTab === 'ektp' && (
              <EktpDocumentTab
                document={caseData.document}
                customerName={caseData.customerName}
              />
            )}

            {/* TAB 2: Forensik Geotag & Survei GIS */}
            {activeTab === 'geo' && (
              <GeoSurveyTab
                geo={caseData.geo}
                customerName={caseData.customerName}
              />
            )}

            {/* TAB 3: Forensik Tele-Verifikasi QA */}
            {activeTab === 'voice' && (
              <VoiceVerificationTab
                voice={caseData.voice}
                customerName={caseData.customerName}
              />
            )}

            {/* TAB 4: Mesin Risiko & Parameter Bobot */}
            {activeTab === 'decision' && (
              <RiskEngineDecisionTab
                caseData={caseData}
                onUpdateStatus={onUpdateStatus}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
