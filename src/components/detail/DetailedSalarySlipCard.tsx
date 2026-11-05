import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Calendar,
  Camera,
  Layers,
} from 'lucide-react';
import { SalarySlipBreakdown } from '../../types';

export interface DetailedSalarySlipCardProps {
  salaryData: SalarySlipBreakdown;
  highlightedFieldKey?: string | null;
}

export const DetailedSalarySlipCard: React.FC<DetailedSalarySlipCardProps> = ({
  salaryData,
  highlightedFieldKey,
}) => {
  const [activeTab, setActiveTab] = useState<'document' | 'rawScan'>('document');

  const formatCurrency = (val: number = 0): string =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val ?? 0);

  const getFieldBoxClass = (fieldKey: string) => {
    const isHighlighted = highlightedFieldKey === fieldKey;
    const isAnomaly = salaryData.anomalies?.some((a) => a.fieldKey === fieldKey);

    if (isHighlighted) {
      return 'border-2 border-[#2563EB] bg-[#2563EB]/15 shadow-[0_0_12px_rgba(37,99,235,0.4)] z-20 transition-all duration-200';
    }
    if (isAnomaly) {
      return 'border-2 border-dashed border-[#DC2626] bg-[#DC2626]/10 transition-all duration-200';
    }
    return 'border border-transparent hover:border-gray-200 transition-all duration-200';
  };

  const getTakeHomePayClass = () => {
    const isHighlighted = highlightedFieldKey === 'takeHomePay';
    const isAnomaly = salaryData.anomalies?.some((a) => a.fieldKey === 'takeHomePay');

    if (isHighlighted) {
      return 'bg-slate-900 border-2 border-[#2563EB] shadow-[0_0_12px_rgba(37,99,235,0.4)] z-20 text-white';
    }
    if (isAnomaly) {
      return 'bg-[#1A1A1A] border-2 border-dashed border-[#DC2626] text-white';
    }
    return 'bg-[#1A1A1A] border border-transparent text-white';
  };

  const getStampBadge = () => {
    switch (salaryData.stampStatus) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/30">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Stempel Asli Terverifikasi</span>
          </span>
        );
      case 'suspicious':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30">
            <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Indikasi Digital Overlay / Editing</span>
          </span>
        );
      case 'missing':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/30">
            <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Tanpa Stempel Perusahaan</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-[#E5E5E3] rounded-xl shadow-xs overflow-hidden flex flex-col space-y-0">
      {/* 1. Card Header */}
      <div className="p-3.5 sm:p-4 bg-white border-b border-[#E5E5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#1A1A1A] leading-tight">
              Pratinjau Forensik Slip Gaji (Corporate Payroll Scan)
            </h3>
            <p className="text-[11px] text-[#6B6B6B] mt-0.5">
              Inspeksi keaslian dokumen, ekstraksi OCR, dan verifikasi stempel
            </p>
          </div>
        </div>

        {/* Header Badges */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* Stamp Status Badge */}
          {getStampBadge()}
        </div>
      </div>

      {/* Sub-header Controls / View Switcher (if image URL exists) */}
      {salaryData.slipImageUrl && (
        <div className="px-4 py-2 bg-[#F7F7F5] border-b border-[#E5E5E3] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#E5E5E3]">
            <button
              type="button"
              onClick={() => setActiveTab('document')}
              className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'document'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dokumen Forensik (OCR)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rawScan')}
              className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'rawScan'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Foto Scan Asli</span>
            </button>
          </div>
          <span className="text-[11px] text-[#6B6B6B] font-mono hidden sm:inline">
            Koordinat: PP-OCRv4 Multi-Hop
          </span>
        </div>
      )}

      {/* 2. Main Forensic Scan Document Container */}
      <div className="relative p-3 sm:p-5 bg-[#F0F2F5] min-h-[520px] flex items-center justify-center overflow-x-auto">
        {activeTab === 'rawScan' && salaryData.slipImageUrl ? (
          <div className="relative w-full max-w-xl rounded-xl border border-slate-700 bg-[#0F172A] p-3 flex flex-col items-center justify-center shadow-lg">
            <img
              src={salaryData.slipImageUrl}
              alt={`Slip Gaji Scan - ${salaryData.employeeName}`}
              className="max-h-[460px] w-auto max-w-full object-contain rounded-lg shadow border border-slate-800"
            />
            <div className="mt-2 text-center text-[11px] text-slate-400 font-mono">
              Raw Capture Scan · Resolution: 300 DPI · MD5 Checksum Valid
            </div>
          </div>
        ) : (
          /* HIGH-FIDELITY STRUCTURED PAYROLL DOCUMENT CONTAINER */
          <div className="w-full max-w-2xl bg-[#FAF8F5] rounded-lg shadow-md border border-[#D1D5DB] overflow-hidden text-[#1A1A1A] font-sans relative select-none p-5 sm:p-7 space-y-4">
            {/* Watermark background indication */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none overflow-hidden">
              <span className="text-7xl font-black font-mono tracking-widest -rotate-45 uppercase">
                CONFIDENTIAL
              </span>
            </div>

            {/* LETTERHEAD HEADER */}
            <div className="border-b-2 border-[#1A1A1A] pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#1E3A8A]" />
                    <h2 className="font-extrabold text-sm sm:text-base text-[#1E3A8A] tracking-tight uppercase">
                      {salaryData.companyName || 'PT Citra Nusantara Mandiri'}
                    </h2>
                  </div>
                  <p className="text-[10px] text-[#6B6B6B] mt-0.5 max-w-md">
                    {salaryData.companyAddress ||
                      'Kawasan Industri Pulogadung, Blok B No. 12, Jakarta Timur'}
                  </p>
                </div>
                <div className="sm:text-right">
                  <div className="text-xs font-black tracking-widest text-[#1A1A1A] uppercase">
                    SLIP GAJI KARYAWAN
                  </div>
                  <span className="text-[9px] font-mono font-semibold text-[#6B6B6B] block">
                    CONFIDENTIAL / PRIBADI &amp; RAHASIA
                  </span>
                </div>
              </div>
            </div>

            {/* METADATA GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2.5 bg-white/80 rounded-md border border-[#E5E5E3] text-xs">
              <div>
                <span className="text-[10px] text-[#6B6B6B] block">Nama:</span>
                <strong className="font-semibold text-[#1A1A1A] block truncate">
                  {salaryData.employeeName}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-[#6B6B6B] block">NIK:</span>
                <strong className="font-mono text-[#1A1A1A] block">
                  {salaryData.employeeNik}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-[#6B6B6B] block">Periode:</span>
                <strong className="font-medium text-[#1A1A1A] block">
                  {salaryData.period}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-[#6B6B6B] block">Tanggal Bayar:</span>
                <strong className="font-medium text-[#1A1A1A] block">
                  {salaryData.paymentDate}
                </strong>
              </div>
            </div>

            {/* FINANCIAL GRID: 2 COLUMNS (EARNINGS & DEDUCTIONS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Left Column: Penghasilan (Earnings) */}
              <div className="p-3 bg-white/70 rounded-md border border-[#E5E5E3] space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-[#1E3A8A] uppercase pb-1 mb-1.5 border-b border-[#E5E5E3] flex items-center justify-between">
                    <span>PENGHASILAN (EARNINGS)</span>
                    <span className="text-[10px] text-[#6B6B6B] font-mono">IDR</span>
                  </div>

                  <div className="space-y-1">
                    {/* Gaji Pokok */}
                    <div
                      data-field-key="gajiPokok"
                      className={`flex items-center justify-between px-2 py-1 rounded ${getFieldBoxClass(
                        'gajiPokok'
                      )}`}
                    >
                      <span className="text-[#374151]">Gaji Pokok</span>
                      <span className="font-mono font-medium text-[#1A1A1A]">
                        {formatCurrency(salaryData.earnings.gajiPokok)}
                      </span>
                    </div>

                    {/* Tunjangan Transport */}
                    <div
                      data-field-key="tunjanganTransport"
                      className={`flex items-center justify-between px-2 py-1 rounded ${getFieldBoxClass(
                        'tunjanganTransport'
                      )}`}
                    >
                      <span className="text-[#374151]">Tunjangan Transport</span>
                      <span className="font-mono font-medium text-[#1A1A1A]">
                        {formatCurrency(salaryData.earnings.tunjanganTransport)}
                      </span>
                    </div>

                    {/* Tunjangan Makan */}
                    <div
                      data-field-key="tunjanganMakan"
                      className={`flex items-center justify-between px-2 py-1 rounded ${getFieldBoxClass(
                        'tunjanganMakan'
                      )}`}
                    >
                      <span className="text-[#374151]">Tunjangan Makan</span>
                      <span className="font-mono font-medium text-[#1A1A1A]">
                        {formatCurrency(salaryData.earnings.tunjanganMakan)}
                      </span>
                    </div>

                    {/* Tunjangan Kehadiran */}
                    <div
                      data-field-key="tunjanganKehadiran"
                      className={`flex items-center justify-between px-2 py-1 rounded ${getFieldBoxClass(
                        'tunjanganKehadiran'
                      )}`}
                    >
                      <span className="text-[#374151]">Tunjangan Kehadiran</span>
                      <span className="font-mono font-medium text-[#1A1A1A]">
                        {formatCurrency(salaryData.earnings.tunjanganKehadiran)}
                      </span>
                    </div>

                    {/* Total Tunjangan */}
                    <div
                      data-field-key="totalTunjangan"
                      className={`flex items-center justify-between px-2 py-1 rounded bg-[#F7F7F5] font-medium ${getFieldBoxClass(
                        'totalTunjangan'
                      )}`}
                    >
                      <span className="text-[#1A1A1A]">Total Tunjangan</span>
                      <span className="font-mono text-[#1A1A1A]">
                        {formatCurrency(salaryData.earnings.totalTunjangan)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gross Income Subtotal */}
                <div className="pt-2 border-t border-[#E5E5E3] mt-2">
                  <div
                    data-field-key="grossIncome"
                    className={`flex items-center justify-between px-2 py-1.5 rounded font-bold ${getFieldBoxClass(
                      'grossIncome'
                    )}`}
                  >
                    <span className="text-[#1A1A1A]">Penghasilan Kotor</span>
                    <span className="font-mono text-[#1E3A8A]">
                      {formatCurrency(salaryData.earnings.grossIncome)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Potongan (Deductions) */}
              <div className="p-3 bg-white/70 rounded-md border border-[#E5E5E3] space-y-1.5 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-[#DC2626] uppercase pb-1 mb-1.5 border-b border-[#E5E5E3] flex items-center justify-between">
                    <span>POTONGAN (DEDUCTIONS)</span>
                    <span className="text-[10px] text-[#6B6B6B] font-mono">IDR</span>
                  </div>

                  <div className="space-y-1">
                    {/* BPJS Kesehatan */}
                    <div
                      data-field-key="bpjsKesehatan"
                      className={`flex items-center justify-between px-2 py-1 rounded ${getFieldBoxClass(
                        'bpjsKesehatan'
                      )}`}
                    >
                      <span className="text-[#374151]">BPJS Kesehatan</span>
                      <span className="font-mono font-medium text-[#DC2626]">
                        {formatCurrency(salaryData.deductions.bpjsKesehatan)}
                      </span>
                    </div>

                    {/* BPJS Ketenagakerjaan */}
                    <div
                      data-field-key="bpjsKetenagakerjaan"
                      className={`flex items-center justify-between px-2 py-1 rounded ${getFieldBoxClass(
                        'bpjsKetenagakerjaan'
                      )}`}
                    >
                      <span className="text-[#374151]">BPJS Ketenagakerjaan</span>
                      <span className="font-mono font-medium text-[#DC2626]">
                        {formatCurrency(salaryData.deductions.bpjsKetenagakerjaan)}
                      </span>
                    </div>

                    {/* PPh 21 */}
                    <div
                      data-field-key="pph21"
                      className={`flex items-center justify-between px-2 py-1 rounded ${getFieldBoxClass(
                        'pph21'
                      )}`}
                    >
                      <span className="text-[#374151]">PPh 21</span>
                      <span className="font-mono font-medium text-[#DC2626]">
                        {formatCurrency(salaryData.deductions.pph21)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Deductions Subtotal */}
                <div className="pt-2 border-t border-[#E5E5E3] mt-2">
                  <div
                    data-field-key="totalPotongan"
                    className={`flex items-center justify-between px-2 py-1.5 rounded font-bold ${getFieldBoxClass(
                      'totalPotongan'
                    )}`}
                  >
                    <span className="text-[#DC2626]">Total Potongan</span>
                    <span className="font-mono text-[#DC2626]">
                      {formatCurrency(salaryData.deductions.totalPotongan)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* TAKE HOME PAY BANNER / ROW */}
            <div
              data-field-key="takeHomePay"
              className={`p-3 rounded-md flex items-center justify-between transition-all duration-200 ${getTakeHomePayClass()}`}
            >
              <div>
                <span className="text-[10px] tracking-wider uppercase text-gray-400 font-semibold block">
                  GAJI BERSIH (TAKE HOME PAY)
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  (Penghasilan Kotor - Total Potongan)
                </span>
              </div>
              <div className="text-base sm:text-lg font-extrabold font-mono text-white">
                {formatCurrency(salaryData.takeHomePay)}
              </div>
            </div>

            {/* CORPORATE SEAL & STAMP & SIGNATURE SECTION */}
            <div className="pt-3 border-t border-dashed border-[#D1D5DB] flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left / Middle: Digital Company Seal / Stamp */}
              <div className="flex items-center gap-3">
                {salaryData.stampStatus === 'verified' && (
                  <div className="relative border-2 border-double border-[#2563EB] text-[#2563EB] rounded-full p-2.5 w-28 h-28 flex flex-col items-center justify-center text-center transform -rotate-6 shadow-xs select-none">
                    <span className="text-[7px] font-black uppercase tracking-tighter leading-none mb-1">
                      {salaryData.companyName || 'PT CITRA NUSANTARA MANDIRI'}
                    </span>
                    <div className="border-y border-[#2563EB] py-0.5 w-full my-0.5">
                      <span className="text-[10px] font-black tracking-widest text-[#2563EB] uppercase block">
                        VERIFIED
                      </span>
                      <span className="text-[8px] font-bold block">LUNAS</span>
                    </div>
                    <span className="text-[6px] font-mono tracking-tighter uppercase mt-0.5">
                      PAYROLL &amp; FINANCE
                    </span>
                  </div>
                )}

                {salaryData.stampStatus === 'suspicious' && (
                  <div className="relative border-2 border-dashed border-[#DC2626] text-[#DC2626] rounded-full p-2.5 w-28 h-28 flex flex-col items-center justify-center text-center transform rotate-3 shadow-xs select-none bg-red-50/50">
                    <span className="text-[7px] font-black uppercase tracking-tighter leading-none mb-1">
                      FLAGGED STAMP
                    </span>
                    <div className="border-y border-[#DC2626] py-0.5 w-full my-0.5">
                      <span className="text-[9px] font-black tracking-tight text-[#DC2626] uppercase block">
                        OVERLAY?
                      </span>
                    </div>
                    <span className="text-[6px] font-mono tracking-tighter uppercase mt-0.5">
                      DIGITAL EDIT DETECTED
                    </span>
                  </div>
                )}

                {salaryData.stampStatus === 'missing' && (
                  <div className="border-2 border-dashed border-gray-300 text-gray-400 rounded-lg p-2.5 w-28 h-20 flex flex-col items-center justify-center text-center select-none bg-gray-50/50">
                    <span className="text-[9px] font-bold">TANPA STEMPEL</span>
                    <span className="text-[7px] font-mono mt-0.5">No Seal Detected</span>
                  </div>
                )}

                {salaryData.stampNote && (
                  <p className="text-[10px] text-[#6B6B6B] italic max-w-xs leading-tight hidden sm:block">
                    {salaryData.stampNote}
                  </p>
                )}
              </div>

              {/* Right: Signature Line */}
              <div className="text-right text-xs space-y-1">
                <span className="text-[11px] text-[#6B6B6B] block">
                  Jakarta, {salaryData.paymentDate}
                </span>
                <span className="text-[11px] text-[#1A1A1A] block">Disetujui oleh,</span>
                <div className="h-10 flex items-center justify-end">
                  {/* Digital Signature mark */}
                  <span className="font-serif italic text-base text-blue-900 opacity-80 tracking-widest font-bold">
                    BudiSantoso_Fin
                  </span>
                </div>
                <div className="border-t border-[#1A1A1A] pt-1">
                  <strong className="block text-xs text-[#1A1A1A]">
                    ( Direktur HRD &amp; Finance )
                  </strong>
                  <span className="text-[10px] text-[#6B6B6B] block">
                    {salaryData.companyName || 'PT Citra Nusantara Mandiri'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Footer Information */}
      <div className="p-3 bg-[#F7F7F5] border-t border-[#E5E5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#6B6B6B]">
        <div className="flex items-center gap-2">
          <span>
            Doc ID:{' '}
            <strong className="font-mono text-[#1A1A1A]">
              SLIP-2026-{salaryData.employeeNik ? salaryData.employeeNik.slice(-4) : '0001'}
            </strong>
          </span>
          <span className="text-gray-300">·</span>
          <span>
            OCR Engine:{' '}
            <strong className="font-medium text-[#1A1A1A]">PP-OCRv4 + LayoutLMv3</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-[#6B6B6B]" />
          <span>Scan Verifikasi: {salaryData.paymentDate}</span>
        </div>
      </div>
    </div>
  );
};
