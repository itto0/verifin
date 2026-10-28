import React, { useState } from 'react';
import {
  FileText,
  Camera,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ShieldCheck,
  Maximize2,
  Zap,
  Building,
  Building2,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { IcrDocumentSample } from '../../data/icrData';

interface DetailedIcrDocumentCardProps {
  document: IcrDocumentSample;
  onSelectCase: (caseId: string) => void;
  highlightedFieldKey?: string | null;
}

export const DetailedIcrDocumentCard: React.FC<DetailedIcrDocumentCardProps> = ({
  document,
  onSelectCase,
  highlightedFieldKey,
}) => {
  const [activeView, setActiveView] = useState<'document' | 'evidence' | 'cadastral'>('document');
  const [showIcrBoxes, setShowIcrBoxes] = useState(true);

  const isForm = document.id === 'ICR-DOC-001';
  const isShm = document.id === 'ICR-DOC-002';
  const isShgb = document.id === 'ICR-DOC-003';

  return (
    <div className="bg-white border border-[#E5E5E3] rounded-xl overflow-hidden shadow-xs flex flex-col">
      {/* Top Header & View Mode Switcher */}
      <div className="p-3 bg-[#F7F7F5] border-b border-[#E5E5E3] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-white p-0.5 rounded-lg border border-[#E5E5E3] text-xs">
          <button
            onClick={() => setActiveView('document')}
            className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
              activeView === 'document'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Document Scan</span>
          </button>
          <button
            onClick={() => setActiveView('evidence')}
            className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
              activeView === 'evidence'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>On-Site Photo</span>
          </button>
          {document.bpnSpatialVerification && (
            <button
              onClick={() => setActiveView('cadastral')}
              className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                activeView === 'cadastral'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>BPN Cadastral</span>
            </button>
          )}
        </div>

        {activeView === 'document' && (
          <button
            onClick={() => setShowIcrBoxes(!showIcrBoxes)}
            className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors flex items-center gap-1 ${
              showIcrBoxes
                ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30'
                : 'bg-white text-[#6B6B6B] border-[#E5E5E3] hover:text-[#1A1A1A]'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>{showIcrBoxes ? 'Hide ICR Boxes' : 'Show ICR Boxes'}</span>
          </button>
        )}
      </div>

      {/* Main Document / Photo Display Area */}
      <div className="relative p-3 bg-[#F0F2F5] min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* VIEW 1: PHYSICAL DOCUMENT SCAN WITH AUTHENTIC RELATED DATA */}
        {activeView === 'document' && (
          <div className="w-full max-w-lg bg-white rounded-lg shadow-md border border-[#D1D5DB] overflow-hidden text-[#1A1A1A] font-sans relative select-none">
            {/* 1A: BAF FIELD SURVEY FORM (RIAN HENDRAWAN - CASE-0941) */}
            {isForm && (
              <div className="p-4 sm:p-5 text-[11px] leading-tight space-y-3 bg-[#FAF8F5]">
                {/* Official BAF Header */}
                <div className="border-b-2 border-[#1E3A8A] pb-2 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-xs">
                        BAF
                      </div>
                      <div>
                        <div className="font-extrabold text-[#1E3A8A] text-xs sm:text-sm tracking-tight">
                          PT BUSSAN AUTO FINANCE
                        </div>
                        <div className="text-[9px] text-[#6B6B6B]">
                          KANTOR CABANG KOTA BEKASI · DIVISI PEMBIAYAAN KONSUMEN
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-[#6B6B6B] block">No. Formulir:</span>
                    <strong className="font-mono text-[10px] text-[#1A1A1A]">SRV-FORM-2026-0941</strong>
                  </div>
                </div>

                {/* Form Title */}
                <div className="text-center py-1 bg-[#F1F5F9] rounded border border-[#CBD5E1]">
                  <h4 className="font-bold text-[11px] text-[#0F172A] tracking-wider uppercase">
                    FORMULIR HASIL SURVEI LAPANGAN &amp; VERIFIKASI DOMISILI
                  </h4>
                </div>

                {/* Metadata Row */}
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-white p-2 rounded border border-[#E2E8F0]">
                  <div>
                    <span className="text-[#64748B]">Nama Pemohon: </span>
                    <strong className="font-semibold text-[#0F172A]">RIAN HENDRAWAN</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B]">NIK: </span>
                    <strong className="font-mono font-semibold text-[#0F172A]">3275031208940003</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Unit Dimohon: </span>
                    <strong className="font-semibold text-[#0F172A]">Yamaha All New NMAX 155</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Surveyor / CMO: </span>
                    <strong className="font-semibold text-[#0F172A]">Bambang Sudirgo (SRV-104)</strong>
                  </div>
                </div>

                {/* Handwritten Survey Table with ICR Overlays */}
                <div className="space-y-2 border border-[#CBD5E1] rounded p-2.5 bg-white">
                  <div className="text-[10px] font-bold text-[#1E3A8A] border-b border-[#E2E8F0] pb-1 uppercase">
                    I. KONDISI TEMPAT TINGGAL &amp; LINGKUNGAN
                  </div>

                  {/* Field 1: Status Tempat Tinggal */}
                  <div className="relative py-1 border-b border-dashed border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-[#475569]">Status Rumah:</span>
                    <span className="font-medium font-serif italic text-blue-900 bg-blue-50/50 px-2 py-0.5 rounded border border-blue-200">
                      [✓] Kontrak / Sewa Bulanan
                    </span>
                    {showIcrBoxes && (
                      <div className="absolute right-0 inset-y-0.5 w-44 border border-emerald-500 bg-emerald-500/10 rounded pointer-events-none flex items-center justify-end pr-1">
                        <span className="text-[8px] font-mono text-emerald-700 bg-white/90 px-1 rounded">
                          ICR 94%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Field 2: Daya Listrik (PLN) - Flagged */}
                  <div className="relative py-1 border-b border-dashed border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-[#475569]">Daya Listrik (PLN):</span>
                    <span className="font-medium font-serif italic text-blue-900 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-300">
                      900 VA (Token)
                    </span>
                    {showIcrBoxes && (
                      <div className="absolute right-0 inset-y-0.5 w-40 border-2 border-dashed border-amber-500 bg-amber-500/15 rounded pointer-events-none flex items-center justify-between px-1">
                        <span className="text-[8px] font-mono font-bold text-amber-800 bg-white/90 px-1 rounded">
                          ICR 76%
                        </span>
                        <span className="text-[8px] font-semibold text-amber-800">
                          Konfirmasi Meteran
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Field 3: Lama Tinggal */}
                  <div className="relative py-1 border-b border-dashed border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-[#475569]">Lama Menempati:</span>
                    <span className="font-medium font-serif italic text-blue-900 px-2 py-0.5">
                      1 Tahun 4 Bulan
                    </span>
                    {showIcrBoxes && (
                      <div className="absolute right-0 inset-y-0.5 w-32 border border-emerald-500 bg-emerald-500/10 rounded pointer-events-none flex items-center justify-end pr-1">
                        <span className="text-[8px] font-mono text-emerald-700 bg-white/90 px-1 rounded">
                          ICR 91%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Field 4: Nama Penjamin */}
                  <div className="relative py-1 border-b border-dashed border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-[#475569]">Nama Penjamin:</span>
                    <span className="font-medium font-serif italic text-blue-900 px-2 py-0.5">
                      Hasan Basri (Paman)
                    </span>
                    {showIcrBoxes && (
                      <div className="absolute right-0 inset-y-0.5 w-36 border border-emerald-500 bg-emerald-500/10 rounded pointer-events-none flex items-center justify-end pr-1">
                        <span className="text-[8px] font-mono text-emerald-700 bg-white/90 px-1 rounded">
                          ICR 88%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Field 5: Penghasilan Tambahan - Flagged */}
                  <div className="relative py-1 border-b border-dashed border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-[#475569]">Est. Pendapatan Usaha:</span>
                    <span className="font-medium font-serif italic text-blue-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                      Rp 2.500.000 / bln
                    </span>
                    {showIcrBoxes && (
                      <div className="absolute right-0 inset-y-0.5 w-44 border-2 border-dashed border-amber-500 bg-amber-500/15 rounded pointer-events-none flex items-center justify-between px-1">
                        <span className="text-[8px] font-mono font-bold text-amber-800 bg-white/90 px-1 rounded">
                          ICR 71%
                        </span>
                        <span className="text-[8px] font-semibold text-amber-800">
                          Coretan Tip-ex
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Field 6: Catatan RT/RW */}
                  <div className="py-1">
                    <span className="text-[#475569] block mb-0.5">Catatan Verifikasi RT:</span>
                    <p className="font-serif italic text-blue-950 bg-slate-50 p-1.5 rounded border border-[#E2E8F0] text-[10px]">
                      &ldquo;Dikonfirmasi ketua RT 04 (Bpk. Mamat) konsumen aktif berdomisili di alamat Jl. Melati Kranji.&rdquo;
                    </p>
                  </div>
                </div>

                {/* Signatures & Official Ink Stamp */}
                <div className="pt-2 flex items-center justify-between text-[9px] text-[#475569]">
                  <div className="text-center">
                    <div>Pemohon Kredit,</div>
                    <div className="font-serif italic text-blue-900 mt-3 font-semibold">Rian Hendrawan</div>
                    <div className="border-t border-[#94A3B8] w-24 mx-auto mt-0.5">Tanda Tangan</div>
                  </div>

                  {/* Round Surveyor Stamp */}
                  <div className="w-20 h-20 rounded-full border-2 border-red-600/70 p-1 flex flex-col items-center justify-center text-center text-red-600/80 -rotate-12 select-none">
                    <span className="text-[7px] font-bold uppercase">PT BAF BEKASI</span>
                    <span className="text-[8px] font-extrabold uppercase">SURVEI OK</span>
                    <span className="text-[6px]">27 OKT 2026</span>
                  </div>

                  <div className="text-center">
                    <div>Surveyor Lapangan (CMO),</div>
                    <div className="font-serif italic text-blue-900 mt-3 font-semibold">Bambang Sudirgo</div>
                    <div className="border-t border-[#94A3B8] w-24 mx-auto mt-0.5">SRV-JKT-104</div>
                  </div>
                </div>
              </div>
            )}

            {/* 1B: BPN SERTIPIKAT HAK MILIK (BAGUS PRASETYO - CASE-0943) */}
            {isShm && (
              <div className="p-4 sm:p-5 text-[11px] leading-tight space-y-3 bg-[#FDFEFA] border-4 border-[#15803D]/30 m-2 rounded-lg">
                {/* Garuda Pancasila Header */}
                <div className="text-center pb-2 border-b-2 border-[#15803D]">
                  <div className="w-10 h-10 mx-auto mb-1 text-amber-600">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M12 2L15 8H9L12 2ZM3 9L9 12L3 15V9ZM21 9V15L15 12L21 9ZM7 14L12 22L17 14H7Z" />
                    </svg>
                  </div>
                  <div className="font-extrabold text-xs tracking-wider text-[#15803D] uppercase">
                    REPUBLIK INDONESIA
                  </div>
                  <div className="font-bold text-[10px] text-[#1E293B] uppercase">
                    KEMENTERIAN AGRARIA DAN TATA RUANG / BPN
                  </div>
                  <div className="font-serif italic text-[13px] font-bold text-[#14532D] mt-1 tracking-widest uppercase">
                    SERTIPIKAT HAK MILIK
                  </div>
                  <div className="font-mono text-xs font-semibold text-[#166534]">
                    NO. 01294 / KEBON JERUK
                  </div>
                </div>

                {/* Spatial NIB & Registry */}
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-emerald-50/50 p-2 rounded border border-emerald-200">
                  <div>
                    <span className="text-[#64748B]">NIB Bidang: </span>
                    <strong className="font-mono font-semibold text-[#0F172A]">09.01.05.02.04581</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Surat Ukur: </span>
                    <strong className="font-mono text-[#0F172A]">No. 342/KJ/2018</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Luas Tanah: </span>
                    <strong className="font-semibold text-[#0F172A]">142 m² (Seratus empat puluh dua)</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Kantor BPN: </span>
                    <strong className="font-semibold text-[#0F172A]">Jakarta Barat</strong>
                  </div>
                </div>

                {/* Pemegang Hak Row */}
                <div className="relative p-2.5 bg-white rounded border border-[#CBD5E1] space-y-1">
                  <div className="text-[10px] font-bold text-[#15803D]">
                    PEMEGANG HAK YANG SAH:
                  </div>
                  <div className="text-sm font-bold tracking-wider text-[#0F172A] uppercase">
                    BAGUS PRASETYO
                  </div>
                  <div className="text-[9px] text-[#64748B]">
                    Lahir: 23-06-1992 · NIK: 3174052306920005 (Cocok 100% dengan KTP Pemohon)
                  </div>

                  {showIcrBoxes && (
                    <div className="absolute right-2 top-2 px-2 py-0.5 rounded bg-emerald-100 border border-emerald-400 text-emerald-800 text-[9px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>ICR Conf 99% · BPN Validated</span>
                    </div>
                  )}
                </div>

                {/* Sentuh Tanahku Barcode / QR Section */}
                <div className="pt-2 border-t border-[#CBD5E1] flex items-center justify-between text-[9px] text-[#64748B]">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-[#0F172A] p-1 rounded flex items-center justify-center text-white text-[7px] font-mono text-center">
                      QR CODE BPN VALID
                    </div>
                    <div>
                      <strong className="text-[#15803D] block">LAYANAN SENTUH TANAHKU</strong>
                      <span>Terdaftar pada Geo-Spatial Database ATR/BPN</span>
                    </div>
                  </div>

                  {/* Circular Blue BPN Stamp */}
                  <div className="w-16 h-16 rounded-full border-2 border-blue-700 p-1 flex flex-col items-center justify-center text-center text-blue-800 text-[6px] font-bold -rotate-6">
                    <span>KANTOR PERTANAHAN</span>
                    <span className="text-[7px]">JAKARTA BARAT</span>
                    <span>SAH ATR/BPN</span>
                  </div>
                </div>
              </div>
            )}

            {/* 1C: BPN SERTIPIKAT HAK GUNA BANGUNAN (TAMPERED FRAUD - CASE-0946) */}
            {isShgb && (
              <div className="p-4 sm:p-5 text-[11px] leading-tight space-y-3 bg-[#FEF2F2] border-4 border-[#DC2626]/40 m-2 rounded-lg">
                {/* Garuda Header */}
                <div className="text-center pb-2 border-b-2 border-[#DC2626]">
                  <div className="w-9 h-9 mx-auto mb-1 text-red-700">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                      <path d="M12 2L15 8H9L12 2ZM3 9L9 12L3 15V9ZM21 9V15L15 12L21 9ZM7 14L12 22L17 14H7Z" />
                    </svg>
                  </div>
                  <div className="font-extrabold text-xs tracking-wider text-[#991B1B] uppercase">
                    KEMENTERIAN AGRARIA DAN TATA RUANG / BPN
                  </div>
                  <div className="font-serif italic text-xs font-bold text-[#991B1B] mt-0.5 tracking-wider uppercase">
                    SERTIPIKAT HAK GUNA BANGUNAN (SHGB)
                  </div>
                  <div className="font-mono text-[10px] font-semibold text-[#7F1D1D]">
                    NO. 08492 / GAMBIR, JAKARTA PUSAT
                  </div>
                </div>

                {/* Spatial Record */}
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-red-100/60 p-2 rounded border border-red-300">
                  <div>
                    <span className="text-[#7F1D1D]">NIB Tertera: </span>
                    <strong className="font-mono font-semibold text-[#0F172A]">09.02.01.03.01199</strong>
                  </div>
                  <div>
                    <span className="text-[#7F1D1D]">Luas Bangunan: </span>
                    <strong className="font-semibold text-[#0F172A]">210 m² (Ruko 3 Lantai)</strong>
                  </div>
                </div>

                {/* Tampered Pemegang Hak Row */}
                <div className="relative p-2.5 bg-white rounded border-2 border-dashed border-[#DC2626] space-y-1">
                  <div className="text-[10px] font-bold text-[#991B1B] flex items-center justify-between">
                    <span>NAMA PEMEGANG HAK (FISIK SERTIPIKAT):</span>
                    <span className="bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                      EDIT TEMPELAN DIGITAL
                    </span>
                  </div>

                  {/* Cut-and-paste altered font rectangle */}
                  <div className="p-1.5 bg-red-50/80 border border-red-400 rounded flex items-center justify-between">
                    <span className="text-sm font-black tracking-widest text-red-950 font-mono">
                      HENDRA IRAWAN
                    </span>
                    <span className="text-[8px] font-mono text-red-700 bg-white px-1 border border-red-300 rounded">
                      Font Discrepancy
                    </span>
                  </div>

                  {/* True Database Discrepancy Alert */}
                  <div className="p-1.5 bg-red-100/80 rounded border border-red-300 text-[9px] text-[#991B1B] leading-tight">
                    <strong>DATABASE ATR/BPN ASLI:</strong> Terdaftar atas nama{' '}
                    <span className="font-bold underline">PT CITRA GRAHA ABADI</span> (Bukan Hendra Irawan).
                  </div>

                  {showIcrBoxes && (
                    <div className="absolute -top-3 right-3 px-2 py-0.5 rounded bg-red-600 text-white text-[9px] font-mono font-bold shadow-xs">
                      [!] ICR Anomaly Score: 95/100
                    </div>
                  )}
                </div>

                {/* Distorted Seal */}
                <div className="pt-2 border-t border-red-300 flex items-center justify-between text-[9px]">
                  <div className="text-red-900 leading-tight max-w-[200px]">
                    ⚠️ Stempel BPN Jakarta Pusat memiliki blur artifacts pada boundary stempel, terindikasi hasil clone stamp image editing.
                  </div>

                  {/* Blurred Stamp Indicator */}
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-red-600 p-1 flex flex-col items-center justify-center text-center text-red-700 text-[6px] font-bold blur-[0.6px]">
                    <span>BPN JAKPUS</span>
                    <span className="text-[7px]">TAMPERED</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: ON-SITE PHOTOGRAPHIC EVIDENCE CAPTURED VIA HARDWARE CAMERAX */}
        {activeView === 'evidence' && (
          <div className="w-full max-w-lg bg-[#0F172A] rounded-lg shadow-md border border-[#334155] overflow-hidden text-white flex flex-col">
            {/* Top Camera Header */}
            <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Camera className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="font-mono text-[11px]">CameraX Hardware Lock</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600/50 text-emerald-400 font-mono text-[10px]">
                Authentic EXIF
              </span>
            </div>

            {/* Photo Canvas Display */}
            <div className="relative aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden">
              {/* Evidence 1: Rian Hendrawan - PLN Electricity Meter & House Front */}
              {isForm && (
                <div className="w-full h-full relative flex flex-col justify-between p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                  {/* Visual SVG illustration of the PLN meter box & house front */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-85">
                    <svg viewBox="0 0 320 240" className="w-full h-full max-w-md">
                      {/* House Wall & Door Frame */}
                      <rect x="20" y="20" width="280" height="200" fill="#334155" />
                      <rect x="40" y="70" width="70" height="150" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                      <line x1="100" y1="140" x2="105" y2="140" stroke="#FBBF24" strokeWidth="3" />
                      {/* House Number Sign: Jl. Melati No. 45 RT 04 */}
                      <rect x="45" y="40" width="60" height="20" rx="2" fill="#0F172A" stroke="#E2E8F0" strokeWidth="1" />
                      <text x="50" y="54" fill="#FFFFFF" fontSize="8" fontFamily="monospace" fontWeight="bold">NO. 45 RT 04</text>

                      {/* PLN Electricity Meter (KWH Token) Box */}
                      <rect x="150" y="60" width="130" height="140" rx="8" fill="#1E293B" stroke="#E2E8F0" strokeWidth="2" />
                      <rect x="165" y="75" width="100" height="25" rx="3" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
                      <text x="175" y="92" fill="#38BDF8" fontSize="12" fontFamily="monospace" fontWeight="bold">0900.4 KWh</text>
                      <rect x="165" y="110" width="100" height="50" rx="4" fill="#0284C7" opacity="0.15" />
                      <text x="170" y="125" fill="#E2E8F0" fontSize="8" fontWeight="bold">PLN PRABAYAR</text>
                      <text x="170" y="137" fill="#FBBF24" fontSize="9" fontWeight="bold">DAYA: 900 VA / 4A</text>
                      <text x="170" y="149" fill="#94A3B8" fontSize="7" fontFamily="monospace">ID: 1420894103</text>
                      <circle cx="250" cy="130" r="8" fill="#16A34A" />
                      {/* Barcode strip */}
                      <line x1="170" y1="170" x2="260" y2="170" stroke="#94A3B8" strokeWidth="8" strokeDasharray="2 3 4 2 1" />
                    </svg>
                  </div>

                  {/* Overlaid Verification Callout */}
                  <div className="relative z-10 bg-slate-900/90 backdrop-blur-xs p-2.5 rounded border border-amber-500/50 text-xs text-amber-200">
                    <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                      <Zap className="w-3.5 h-3.5" />
                      <span>PLN Meter Reading Confirmed: 900 VA</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Photo proves the handwriting &ldquo;900 VA&rdquo; on the survey form is valid, resolving the OCR confidence alert.
                    </p>
                  </div>

                  {/* Geotag & Time Watermark */}
                  <div className="relative z-10 font-mono text-[9px] text-slate-400 bg-black/60 p-1.5 rounded flex items-center justify-between">
                    <span>GPS: -6.241850, 106.984200</span>
                    <span>2026-10-27 11:31:05 WIB</span>
                  </div>
                </div>
              )}

              {/* Evidence 2: Bagus Prasetyo - Land Parcel Frontage at Kebon Jeruk */}
              {isShm && (
                <div className="w-full h-full relative flex flex-col justify-between p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                  <div className="absolute inset-0 flex items-center justify-center opacity-85">
                    <svg viewBox="0 0 320 240" className="w-full h-full max-w-md">
                      {/* House Front & Garden Fence */}
                      <rect x="30" y="40" width="260" height="180" fill="#334155" />
                      <polygon points="160,10 20,60 300,60" fill="#991B1B" />
                      <rect x="70" y="100" width="60" height="120" fill="#0F172A" />
                      <rect x="160" y="90" width="80" height="60" fill="#38BDF8" opacity="0.4" stroke="#FFFFFF" strokeWidth="2" />
                      {/* BPN Boundary Stake (Patok Batas Tanah BPN) */}
                      <rect x="240" y="170" width="25" height="50" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.5" />
                      <rect x="240" y="170" width="25" height="10" fill="#DC2626" />
                      <text x="243" y="195" fill="#0F172A" fontSize="7" fontWeight="bold">BPN</text>
                      <text x="243" y="205" fill="#0F172A" fontSize="6" fontFamily="monospace">01294</text>
                    </svg>
                  </div>

                  <div className="relative z-10 bg-slate-900/90 backdrop-blur-xs p-2.5 rounded border border-emerald-500/50 text-xs text-emerald-200">
                    <div className="font-semibold flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>BPN Boundary Marker (Patok) Verified</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Surveyor photographic proof confirms residential frontage and official BPN boundary stake matching SHM 01294.
                    </p>
                  </div>

                  <div className="relative z-10 font-mono text-[9px] text-slate-400 bg-black/60 p-1.5 rounded flex items-center justify-between">
                    <span>GPS: -6.195420, 106.772410 (Kebon Jeruk)</span>
                    <span>2026-10-27 10:45:00 WIB</span>
                  </div>
                </div>
              )}

              {/* Evidence 3: Hendra Irawan - Commercial Ruko with PT Citra Graha Abadi Sign */}
              {isShgb && (
                <div className="w-full h-full relative flex flex-col justify-between p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                  <div className="absolute inset-0 flex items-center justify-center opacity-85">
                    <svg viewBox="0 0 320 240" className="w-full h-full max-w-md">
                      {/* Commercial Shophouse / Ruko Building */}
                      <rect x="50" y="20" width="220" height="200" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                      {/* Glass storefront */}
                      <rect x="70" y="120" width="180" height="100" fill="#0284C7" opacity="0.3" stroke="#94A3B8" strokeWidth="2" />
                      {/* Prominent Company Billboard Sign */}
                      <rect x="60" y="35" width="200" height="40" rx="3" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1.5" />
                      <text x="75" y="52" fill="#FFFFFF" fontSize="11" fontWeight="extrabold" fontFamily="sans-serif">
                        PT CITRA GRAHA ABADI
                      </text>
                      <text x="75" y="66" fill="#FEE2E2" fontSize="7" fontWeight="bold" fontFamily="monospace">
                        KANTOR PUSAT &amp; LOGISTIK · GAMBIR JAKPUS
                      </text>
                    </svg>
                  </div>

                  <div className="relative z-10 bg-slate-900/90 backdrop-blur-xs p-2.5 rounded border border-red-500/50 text-xs text-red-200">
                    <div className="font-semibold flex items-center gap-1.5 text-red-300">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Corporate Signboard Contradicts Applicant</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      On-site photo clearly shows &ldquo;PT Citra Graha Abadi&rdquo; billboard. Applicant Hendra Irawan does not operate here.
                    </p>
                  </div>

                  <div className="relative z-10 font-mono text-[9px] text-slate-400 bg-black/60 p-1.5 rounded flex items-center justify-between">
                    <span>GPS: -6.182410, 106.831200 (Gambir)</span>
                    <span>2026-10-27 09:25:00 WIB</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: ATR/BPN CADASTRAL PERSIL SPATIAL MAP */}
        {activeView === 'cadastral' && document.bpnSpatialVerification && (
          <div className="w-full max-w-lg bg-white rounded-lg shadow-md border border-[#E5E5E3] overflow-hidden p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-2">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-semibold text-[#1A1A1A]">
                  Kementerian ATR/BPN Cadastral Spatial Parcel
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
                NIB: {document.bpnSpatialVerification.persilNib}
              </span>
            </div>

            {/* Simulated Cadastral Vector Map */}
            <div className="relative aspect-[16/9] bg-[#E8EDF2] rounded-lg border border-[#CBD5E1] overflow-hidden flex items-center justify-center p-2">
              <svg viewBox="0 0 400 220" className="w-full h-full">
                {/* Cadastral Land Parcel Grid */}
                <rect x="20" y="20" width="80" height="70" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
                <text x="35" y="60" fontSize="9" fill="#64748B" fontFamily="monospace">Persil 4579</text>

                <rect x="110" y="20" width="100" height="70" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
                <text x="135" y="60" fontSize="9" fill="#64748B" fontFamily="monospace">Persil 4580</text>

                {/* Target Land Parcel Highlighted */}
                <polygon
                  points="110,100 230,100 220,180 95,180"
                  fill={document.bpnSpatialVerification.spatialMatchWithSurveyAddress ? '#86EFAC' : '#FCA5A5'}
                  fillOpacity="0.4"
                  stroke={document.bpnSpatialVerification.spatialMatchWithSurveyAddress ? '#16A34A' : '#DC2626'}
                  strokeWidth="2.5"
                />
                <text x="125" y="140" fontSize="10" fontWeight="bold" fill="#0F172A">
                  NIB {document.bpnSpatialVerification.persilNib}
                </text>
                <text x="135" y="155" fontSize="9" fill="#334155" fontWeight="semibold">
                  Luas: {document.bpnSpatialVerification.surfaceAreaM2} m²
                </text>

                {/* Neighboring Parcels */}
                <rect x="240" y="100" width="140" height="80" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
                <text x="270" y="145" fontSize="9" fill="#64748B" fontFamily="monospace">Persil 4582</text>

                {/* Road / Jalan */}
                <rect x="0" y="185" width="400" height="35" fill="#475569" />
                <line x1="0" y1="202" x2="400" y2="202" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="8 8" />
                <text x="140" y="206" fill="#F8FAFC" fontSize="9" fontWeight="bold">JALAN LINGKUNGAN / AKSES</text>

                {/* Geotag Marker Pin */}
                <circle
                  cx="160"
                  cy="135"
                  r="6"
                  fill={document.bpnSpatialVerification.spatialMatchWithSurveyAddress ? '#16A34A' : '#DC2626'}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              </svg>

              <div className="absolute top-2 left-2 bg-white/95 px-2 py-1 rounded text-[10px] font-mono text-[#1A1A1A] border border-[#CBD5E1]">
                Lat: {document.bpnSpatialVerification.latitude}, Lng: {document.bpnSpatialVerification.longitude}
              </div>
            </div>

            <div className="text-xs text-[#6B6B6B] leading-relaxed">
              <strong>Sentuh Tanahku Result:</strong> {document.bpnSpatialVerification.sentuhTanahkuStatus} ·
              Owner registered: <span className="font-semibold text-[#1A1A1A]">{document.bpnSpatialVerification.registeredOwner}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Info Bar */}
      <div className="p-3 bg-white border-t border-[#E5E5E3] flex items-center justify-between text-xs">
        <div>
          <span className="font-semibold text-[#1A1A1A]">{document.applicantName}</span>
          <span className="text-[#6B6B6B] ml-2">Scan: {document.scanDate}</span>
        </div>
        <button
          onClick={() => onSelectCase(document.caseId)}
          className="text-[#2563EB] hover:underline font-medium flex items-center gap-1"
        >
          <span>Open Full Underwriting Audit</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
