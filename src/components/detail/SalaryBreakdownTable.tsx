import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck, Building2, Calendar } from 'lucide-react';
import { SalarySlipBreakdown } from '../../types';

export interface SalaryBreakdownTableProps {
  salaryData: SalarySlipBreakdown;
  applicantName: string;
  onFieldHover?: (key: string | null) => void;
}

export const SalaryBreakdownTable: React.FC<SalaryBreakdownTableProps> = ({
  salaryData,
  applicantName,
  onFieldHover,
}) => {
  const isKtpMatch =
    salaryData.employeeName.trim().toLowerCase() === applicantName.trim().toLowerCase();

  const formatCurrency = (val: number): string =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const deviasiPercentage =
    salaryData.declaredIncome && salaryData.declaredIncome > 0
      ? Math.abs(
          ((salaryData.takeHomePay - salaryData.declaredIncome) /
            salaryData.declaredIncome) *
            100
        ).toFixed(1)
      : '0.0';

  const clampedDsr = Math.min(Math.max(salaryData.dsrPercentage, 0), 100);

  const renderRow = (
    label: string,
    amount: number,
    fieldKey: string,
    options?: {
      isBold?: boolean;
      isHighlighted?: boolean;
      customTextColor?: string;
    }
  ) => {
    const anomaly = salaryData.anomalies?.find((a) => a.fieldKey === fieldKey);

    return (
      <div
        key={fieldKey}
        onMouseEnter={() => onFieldHover?.(fieldKey)}
        onMouseLeave={() => onFieldHover?.(null)}
        className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs transition-colors cursor-pointer hover:bg-[#F7F7F5] ${
          options?.isHighlighted ? 'bg-[#F7F7F5] font-medium' : ''
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span
            className={
              options?.isBold
                ? `font-bold ${options?.customTextColor || 'text-[#1A1A1A]'}`
                : options?.customTextColor || 'text-[#1A1A1A]'
            }
          >
            {label}
          </span>
          {anomaly && (
            <span
              title={anomaly.description}
              className="inline-flex items-center text-[#DC2626]"
            >
              <AlertTriangle className="w-3 h-3" />
            </span>
          )}
        </div>
        <span
          className={`font-mono ${
            options?.isBold
              ? `font-bold ${options?.customTextColor || 'text-[#1A1A1A]'}`
              : options?.customTextColor || 'font-medium text-[#1A1A1A]'
          }`}
        >
          {formatCurrency(amount)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Section */}
      <div className="p-4 rounded-xl border border-[#E5E5E3] bg-white space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#E5E5E3]">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#1A1A1A]">
              <Building2 className="w-4 h-4 text-[#2563EB]" />
              <span>{salaryData.companyName}</span>
            </div>
            {salaryData.companyAddress && (
              <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                {salaryData.companyAddress}
              </p>
            )}
          </div>

          {/* Period / Payment Date Badge */}
          <div className="inline-flex items-center gap-1.5 text-xs text-[#6B6B6B] bg-[#F7F7F5] px-2.5 py-1 rounded-md border border-[#E5E5E3] shrink-0">
            <Calendar className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <span>
              {salaryData.period} · {salaryData.paymentDate}
            </span>
          </div>
        </div>

        {/* Badges: KTP Match and Stamp Verification */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* KTP Match Check Badge */}
          {isKtpMatch ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
              <span>100% Cocok: {salaryData.employeeName}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20">
              <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
              <span>
                Nama Beda: {salaryData.employeeName} vs {applicantName}
              </span>
            </div>
          )}

          {/* Stamp Verification Pill */}
          {salaryData.stampStatus === 'verified' && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20">
              <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Stempel Asli</span>
            </div>
          )}
          {salaryData.stampStatus === 'suspicious' && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20">
              <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Stempel Meragukan</span>
            </div>
          )}
          {salaryData.stampStatus === 'missing' && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F7F7F5] text-[#6B6B6B] border border-[#E5E5E3]">
              <span>Tanpa Stempel</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Itemized Earnings Section */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-4 space-y-2">
        <div className="text-xs font-bold text-[#1A1A1A] pb-2 border-b border-[#E5E5E3]">
          Rincian Penghasilan (Earnings)
        </div>
        <div className="space-y-0.5">
          {renderRow('Gaji Pokok', salaryData.earnings.gajiPokok, 'gajiPokok')}
          {renderRow('Tunjangan Transport', salaryData.earnings.tunjanganTransport, 'tunjanganTransport')}
          {renderRow('Tunjangan Makan', salaryData.earnings.tunjanganMakan, 'tunjanganMakan')}
          {renderRow('Tunjangan Kehadiran', salaryData.earnings.tunjanganKehadiran, 'tunjanganKehadiran')}
          {renderRow('Total Tunjangan', salaryData.earnings.totalTunjangan, 'totalTunjangan', {
            isHighlighted: true,
          })}
          <div className="pt-1 mt-1 border-t border-[#E5E5E3]">
            {renderRow('Penghasilan Kotor (Gross Income)', salaryData.earnings.grossIncome, 'grossIncome', {
              isBold: true,
            })}
          </div>
        </div>
      </div>

      {/* 3. Itemized Deductions Section */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-4 space-y-2">
        <div className="text-xs font-bold text-[#1A1A1A] pb-2 border-b border-[#E5E5E3]">
          Potongan Resmi (Deductions)
        </div>
        <div className="space-y-0.5">
          {renderRow('BPJS Kesehatan', salaryData.deductions.bpjsKesehatan, 'bpjsKesehatan')}
          {renderRow('BPJS Ketenagakerjaan', salaryData.deductions.bpjsKetenagakerjaan, 'bpjsKetenagakerjaan')}
          {renderRow('PPh 21', salaryData.deductions.pph21, 'pph21')}
          <div className="pt-1 mt-1 border-t border-[#E5E5E3]">
            {renderRow('Total Potongan', salaryData.deductions.totalPotongan, 'totalPotongan', {
              isBold: true,
              customTextColor: 'text-[#DC2626]',
            })}
          </div>
        </div>
      </div>

      {/* 4. Take Home Pay Highlight Card */}
      <div className="bg-[#1A1A1A] text-white rounded-xl p-4 shadow-sm space-y-2">
        <div className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
          TOTAL GAJI BERSIH (TAKE HOME PAY)
        </div>
        <div className="text-2xl font-bold font-mono text-white">
          {new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
          }).format(salaryData.takeHomePay)}
        </div>
        <div className="text-xs text-gray-400 pt-1 border-t border-gray-800">
          <span>
            Declared Income: {formatCurrency(salaryData.declaredIncome)} (Deviasi: {deviasiPercentage}%)
          </span>
        </div>
      </div>

      {/* 5. OJK Debt Service Ratio (DSR) Card */}
      <div className="border border-[#E5E5E3] bg-[#F7F7F5] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#1A1A1A]">
              Analisis Rasio Beban Utang (DSR)
            </div>
            <div className="text-[11px] text-[#6B6B6B] mt-0.5">
              Formula: Angsuran Kendaraan / Take Home Pay
            </div>
          </div>
        </div>

        {/* Calculation Row */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#E5E5E3] text-xs bg-white/70 px-3 rounded-lg">
          <div>
            <div className="text-[11px] text-[#6B6B6B]">Angsuran Kendaraan</div>
            <div className="font-semibold text-[#1A1A1A] mt-0.5">
              Rp {salaryData.monthlyInstallment.toLocaleString('id-ID')}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#6B6B6B]">Take Home Pay</div>
            <div className="font-semibold text-[#1A1A1A] mt-0.5">
              Rp {salaryData.takeHomePay.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-[#6B6B6B]">Rasio DSR</div>
            <div
              className={`font-bold text-sm mt-0.5 ${
                salaryData.isDsrHealthy ? 'text-[#16A34A]' : 'text-[#DC2626]'
              }`}
            >
              {salaryData.dsrPercentage}%
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="relative h-2.5 w-full bg-[#E5E5E3] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                salaryData.isDsrHealthy ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
              }`}
              style={{ width: `${clampedDsr}%` }}
            />
            {/* Indicator line at 35% mark */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#1A1A1A]/40 z-10"
              style={{ left: '35%' }}
            />
          </div>
          <div className="relative flex items-center justify-between text-[10px] text-[#6B6B6B]">
            <span>0%</span>
            <span
              className="absolute -translate-x-1/2 font-medium text-[10px] text-[#6B6B6B] whitespace-nowrap"
              style={{ left: '35%' }}
            >
              Batas Maksimal OJK (35%)
            </span>
            <span>100%</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="pt-1">
          {salaryData.isDsrHealthy ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Memenuhi Syarat OJK (DSR ≤ 35%)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20">
              <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Melebihi Batas Risiko OJK (DSR &gt; 35%)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
