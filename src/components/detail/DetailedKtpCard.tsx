import React from 'react';
import { DocumentVerification } from '../../types';
import { AlertTriangle, Shield, Sparkles } from 'lucide-react';

export const isFullKtpDocument = (url?: string): boolean => {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:image/')) return true;
  if (/ktp.*(?:demo|scan|upload|jpg|jpeg|png|webp)/i.test(trimmed)) return true;
  if (trimmed.includes('ktp_demo') || trimmed.includes('ktp-scan')) return true;
  return false;
};

export const FALLBACK_PORTRAIT_URL =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80';

export const resolveKtpPortraitUrl = (url?: string): string => {
  if (!url) return FALLBACK_PORTRAIT_URL;
  if (isFullKtpDocument(url)) return FALLBACK_PORTRAIT_URL;
  return url;
};

export interface DetailedKtpCardProps {
  document: DocumentVerification;
  customerName: string;
  showTamperOverlay: boolean;
  hoveredFieldKey?: string | null;
  onFieldHover?: (key: string | null) => void;
}

export const DetailedKtpCard: React.FC<DetailedKtpCardProps> = ({
  document,
  customerName,
  showTamperOverlay,
  hoveredFieldKey: _hoveredFieldKey,
  onFieldHover: _onFieldHover,
}) => {
  const isHighRisk = document.score >= 70 || (document.tamperScore !== undefined && document.tamperScore >= 70);

  return (
    <div className="space-y-3">
      {/* Clean Forensic Scan Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#1A1A1A]">
          <Shield className="w-4 h-4 text-[#2563EB]" />
          <span>Pratinjau Forensik Dokumen Fisik (Original Scan)</span>
        </div>
        <span className="text-[10px] text-[#6B6B6B] bg-[#F7F7F5] border border-[#E5E5E3] px-2 py-0.5 rounded font-mono">
          Tamper: {document.tamperScore ?? document.score}/100
        </span>
      </div>

      {/* Forensic Document Scan Viewer */}
      <div className="relative w-full max-w-xl mx-auto rounded-xl border border-[#E5E5E3] bg-[#0F172A] overflow-hidden shadow-sm flex flex-col">
        <div className="relative p-3 sm:p-4 flex items-center justify-center min-h-[300px] max-h-[460px] bg-slate-950/80">
          <div className="relative inline-block max-w-full">
            <img
              src={document.ktpImageUrl || '/ktp_demo_normal.jpg'}
              alt={`e-KTP Document Full Scan - ${customerName}`}
              className="max-h-[380px] w-auto max-w-full object-contain rounded-lg shadow-xl border border-slate-700 select-none"
            />

            {/* Forensic Tamper Anomaly Warning Overlay on Scan */}
            {showTamperOverlay && isHighRisk && (
              <div className="absolute inset-0 bg-[#DC2626]/20 border-2 border-dashed border-[#DC2626] rounded-lg flex flex-col items-center justify-center p-2 text-center pointer-events-none backdrop-blur-[0.5px]">
                <div className="bg-[#DC2626] text-white text-[11px] font-bold px-3 py-1 rounded shadow-lg flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Forensic Tamper Anomaly Detected</span>
                </div>
                <span className="text-[10px] text-white mt-1 drop-shadow font-medium bg-black/60 px-2 py-0.5 rounded">
                  Ketidakcocokan font OCR-B & batas piksel foto
                </span>
              </div>
            )}

            {/* LCD Moiré Screen Capture Detected Tag */}
            {document.isScreenCaptureDetected && (
              <div className="absolute bottom-2 left-2 bg-amber-500/90 text-slate-900 text-[10px] font-bold px-2 py-1 rounded shadow flex items-center gap-1 z-20">
                <Sparkles className="w-3 h-3 text-amber-900" />
                <span>Interferensi Moiré LCD Terdeteksi</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
