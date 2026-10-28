import React, { useState } from 'react';
import {
  TrendingUp,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Layers,
  Bike,
  Filter
} from 'lucide-react';

interface DayData {
  day: string;
  date: string;
  total: number;
  approved: number;
  review: number;
  fraud: number;
}

const sevenDaysData: DayData[] = [
  { day: 'Sen', date: '21 Okt', total: 118, approved: 92, review: 21, fraud: 5 },
  { day: 'Sel', date: '22 Okt', total: 126, approved: 98, review: 23, fraud: 5 },
  { day: 'Rab', date: '23 Okt', total: 134, approved: 104, review: 24, fraud: 6 },
  { day: 'Kam', date: '24 Okt', total: 122, approved: 95, review: 22, fraud: 5 },
  { day: 'Jum', date: '25 Okt', total: 142, approved: 110, review: 26, fraud: 6 },
  { day: 'Sab', date: '26 Okt', total: 138, approved: 106, review: 25, fraud: 7 },
  { day: 'Min', date: '27 Okt', total: 148, approved: 114, review: 26, fraud: 8 },
];

const thirtyDaysData: DayData[] = [
  { day: 'M1', date: '1-7 Okt', total: 840, approved: 672, review: 138, fraud: 30 },
  { day: 'M2', date: '8-14 Okt', total: 895, approved: 716, review: 145, fraud: 34 },
  { day: 'M3', date: '15-21 Okt', total: 932, approved: 745, review: 152, fraud: 35 },
  { day: 'M4', date: '22-28 Okt', total: 980, approved: 784, review: 158, fraud: 38 },
];

const branchDistribution = [
  { branch: 'BAF Jakarta Selatan', total: 42, clean: 31, warning: 8, fraud: 3, avgSla: '3.8 min' },
  { branch: 'BAF Kota Bekasi', total: 34, clean: 28, warning: 5, fraud: 1, avgSla: '4.1 min' },
  { branch: 'BAF Jakarta Barat', total: 29, clean: 21, warning: 6, fraud: 2, avgSla: '4.5 min' },
  { branch: 'BAF Bandung Soekarno-Hatta', total: 24, clean: 19, warning: 4, fraud: 1, avgSla: '3.9 min' },
  { branch: 'BAF Surabaya Timur', total: 19, clean: 15, warning: 3, fraud: 1, avgSla: '4.6 min' },
];

// Fraud Typology Data
const fraudTypologies = [
  {
    type: 'Fake GPS / Mock Location Spoofing',
    count: 32,
    percent: 38,
    desc: 'Deteksi mock provider & freeze sensor ponsel surveyor/nasabah',
    riskImpact: 'Tinggi (Blacklist Geofence)'
  },
  {
    type: 'Manipulasi Font & OCR e-KTP Tampering',
    count: 23,
    percent: 27,
    desc: 'Ketidaksesuaian font Dukcapil, NIK tidak sinkron database nasional',
    riskImpact: 'Tinggi (Sindikat Pemalsuan Dokumen)'
  },
  {
    type: 'Face Liveness Spoofing / Deepfake',
    count: 16,
    percent: 19,
    desc: 'Selfie foto dari layar monitor / foto cetak tidak lolos liveness 3D',
    riskImpact: 'Tinggi (Impersonasi Nasabah)'
  },
  {
    type: 'Tele-QA Inconsistency & Voice Stress',
    count: 9,
    percent: 11,
    desc: 'Ketidaksesuaian jawaban verifikasi telepon vs data aplikasi',
    riskImpact: 'Sedang (Butuh Verifikasi Ulang)'
  },
  {
    type: 'Agunan & Data BPN Tidak Sesuai',
    count: 4,
    percent: 5,
    desc: 'Lokasi persil atau NIB BPN tidak terdaftar pada Sentuh Tanahku',
    riskImpact: 'Sedang (Audit Dokumen Agunan)'
  },
];

// Hourly Velocity Today
const hourlyVelocity = [
  { hour: '08:00', volume: 8, autoDecided: 7, manualReview: 1, avgSla: 3.2 },
  { hour: '09:00', volume: 15, autoDecided: 12, manualReview: 3, avgSla: 3.8 },
  { hour: '10:00', volume: 22, autoDecided: 17, manualReview: 5, avgSla: 4.1 },
  { hour: '11:00', volume: 24, autoDecided: 19, manualReview: 5, avgSla: 4.4 },
  { hour: '12:00', volume: 12, autoDecided: 10, manualReview: 2, avgSla: 3.9 },
  { hour: '13:00', volume: 18, autoDecided: 14, manualReview: 4, avgSla: 4.2 },
  { hour: '14:00', volume: 21, autoDecided: 16, manualReview: 5, avgSla: 4.5 },
  { hour: '15:00', volume: 16, autoDecided: 12, manualReview: 4, avgSla: 4.0 },
  { hour: '16:00', volume: 12, autoDecided: 10, manualReview: 2, avgSla: 3.6 },
];

// Vehicle Model Risk Analysis
const vehicleModelPortfolio = [
  { model: 'Yamaha NMAX 155 Connected', apps: 48, approvalRate: 85, defaultRisk: 'Rendah (2.1%)', totalLoan: 'Rp 1.68 M' },
  { model: 'Yamaha Aerox 155 VVA', apps: 38, approvalRate: 81, defaultRisk: 'Moderat (3.8%)', totalLoan: 'Rp 1.25 M' },
  { model: 'Yamaha Grand Filano Hybrid', apps: 28, approvalRate: 92, defaultRisk: 'Sangat Rendah (1.2%)', totalLoan: 'Rp 868 Jt' },
  { model: 'Yamaha XMAX 250 Tech MAX', apps: 16, approvalRate: 68, defaultRisk: 'Waspada (5.9%)', totalLoan: 'Rp 1.05 M' },
  { model: 'Yamaha Mio M3 125', apps: 18, approvalRate: 83, defaultRisk: 'Rendah (2.6%)', totalLoan: 'Rp 342 Jt' },
];

export const VerificationCharts: React.FC = () => {
  const [activeRange, setActiveRange] = useState<'7d' | '30d'>('7d');
  const activeDataset = activeRange === '7d' ? sevenDaysData : thirtyDaysData;
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(activeDataset[activeDataset.length - 1]);
  const [selectedTypology, setSelectedTypology] = useState<string | null>(null);

  const maxTotal = activeRange === '7d' ? 160 : 1100;
  const chartHeight = 160;

  return (
    <div className="space-y-6">
      {/* 1st Row: Volume & Trends (8 cols) + Branch Risk Distribution (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Daily Verification Volume & Fraud Trend */}
        <div className="lg:col-span-8 bg-white border border-[#E5E5E3] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E3] pb-4 mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#1A1A1A]">
                  Verification Volume &amp; Anomaly Trends
                </h3>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Daily application breakdown: straight-through approvals, manual review queue, and fraud flags.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-[#E5E5E3] bg-[#F7F7F5] p-0.5 text-xs font-medium">
                  <button
                    onClick={() => {
                      setActiveRange('7d');
                      setHoveredDay(sevenDaysData[6]);
                    }}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      activeRange === '7d'
                        ? 'bg-white text-[#1A1A1A] font-semibold'
                        : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                    }`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => {
                      setActiveRange('30d');
                      setHoveredDay(thirtyDaysData[3]);
                    }}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      activeRange === '30d'
                        ? 'bg-white text-[#1A1A1A] font-semibold'
                        : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                    }`}
                  >
                    Last 30 Days
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Bar Chart Canvas */}
            <div className="pt-2">
              {/* Legend */}
              <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#16A34A]" />
                    <span>Approved ({hoveredDay ? hoveredDay.approved : 114})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#D97706]" />
                    <span>Manual Review ({hoveredDay ? hoveredDay.review : 26})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]" />
                    <span>Flagged Fraud ({hoveredDay ? hoveredDay.fraud : 8})</span>
                  </span>
                </div>

                {hoveredDay && (
                  <div className="font-mono text-xs text-[#1A1A1A] font-semibold">
                    {hoveredDay.date}: {hoveredDay.total} applications
                  </div>
                )}
              </div>

              {/* Visual Bars with Reference Lines */}
              <div className="relative h-44 w-full flex items-end justify-between gap-3 pt-4 px-2 border-b border-[#E5E5E3]">
                <div className="absolute inset-x-0 top-0 border-b border-dashed border-[#E5E5E3] pointer-events-none" />
                <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-[#E5E5E3] pointer-events-none" />

                {activeDataset.map((d) => {
                  const totalH = (d.total / maxTotal) * chartHeight;
                  const approvedH = (d.approved / d.total) * totalH;
                  const reviewH = (d.review / d.total) * totalH;
                  const fraudH = (d.fraud / d.total) * totalH;

                  const isHovered = hoveredDay?.day === d.day;

                  return (
                    <div
                      key={d.day}
                      onMouseEnter={() => setHoveredDay(d)}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                    >
                      <div
                        className={`w-full max-w-[36px] rounded-t flex flex-col-reverse overflow-hidden transition-all ${
                          isHovered ? 'ring-2 ring-[#2563EB]/40 opacity-100' : 'opacity-90 hover:opacity-100'
                        }`}
                        style={{ height: `${totalH}px` }}
                      >
                        <div
                          className="w-full bg-[#16A34A] transition-all"
                          style={{ height: `${approvedH}px` }}
                        />
                        <div
                          className="w-full bg-[#D97706] transition-all"
                          style={{ height: `${reviewH}px` }}
                        />
                        <div
                          className="w-full bg-[#DC2626] transition-all"
                          style={{ height: `${fraudH}px` }}
                        />
                      </div>

                      <div className="mt-2 text-[11px] font-medium text-[#6B6B6B] group-hover:text-[#1A1A1A]">
                        {d.day}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Summary Strip */}
          <div className="mt-4 pt-3 flex flex-wrap items-center justify-between text-xs text-[#6B6B6B]">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#16A34A]" />
              <span>Straight-Through Processing (STP) ratio: <strong className="text-[#1A1A1A] tabular-nums">78.4%</strong></span>
            </div>
            <div className="tabular-nums font-mono">
              Fraud intercepted: <strong className="text-[#DC2626]">8 cases today (42 this week)</strong>
            </div>
          </div>
        </div>

        {/* Chart 2: Branch Risk Distribution */}
        <div className="lg:col-span-4 bg-white border border-[#E5E5E3] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#E5E5E3] pb-4 mb-4">
              <h3 className="text-base font-semibold text-[#1A1A1A]">
                Risk Distribution by Branch
              </h3>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Volume and anomaly ratios across active BAF operational branches.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              {branchDistribution.map((item) => {
                const cleanPercent = Math.round((item.clean / item.total) * 100);
                const warningPercent = Math.round((item.warning / item.total) * 100);
                const fraudPercent = 100 - cleanPercent - warningPercent;

                return (
                  <div key={item.branch} className="space-y-1">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-[#1A1A1A]">{item.branch}</span>
                      <span className="font-mono tabular-nums text-[#6B6B6B]">
                        {item.total} cases ({item.avgSla})
                      </span>
                    </div>

                    <div className="h-2 w-full bg-[#E5E5E3] rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-[#16A34A]"
                        style={{ width: `${cleanPercent}%` }}
                        title={`Clean: ${item.clean}`}
                      />
                      <div
                        className="h-full bg-[#D97706]"
                        style={{ width: `${warningPercent}%` }}
                        title={`Review: ${item.warning}`}
                      />
                      <div
                        className="h-full bg-[#DC2626]"
                        style={{ width: `${fraudPercent}%` }}
                        title={`Fraud: ${item.fraud}`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#6B6B6B] font-mono">
                      <span className="text-[#16A34A]">{cleanPercent}% clean</span>
                      <span className="text-[#D97706]">{warningPercent}% review</span>
                      <span className="text-[#DC2626]">{fraudPercent}% fraud</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E5E5E3] text-[11px] text-[#6B6B6B] flex items-center justify-between">
            <span>Fastest SLA: Jakarta Selatan (3.8 min)</span>
            <span className="font-semibold text-[#2563EB]">5 Regional Hubs</span>
          </div>
        </div>
      </div>

      {/* 2nd Row: Fraud Typologies (6 cols) & Hourly Verification Velocity / SLA (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 3: Fraud Typology & Anomaly Breakdown */}
        <div className="lg:col-span-6 bg-white border border-[#E5E5E3] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-4 mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#1A1A1A]">
                  Fraud Typologies &amp; Anomaly Categories
                </h3>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Breakdown of fraud patterns and anomaly types intercepted by VeriFin this month.
                </p>
              </div>
              <ShieldAlert className="w-5 h-5 text-[#DC2626]" />
            </div>

            <div className="space-y-3">
              {fraudTypologies.map((item) => {
                const isSelected = selectedTypology === item.type;
                return (
                  <div
                    key={item.type}
                    onClick={() => setSelectedTypology(isSelected ? null : item.type)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#2563EB] bg-[#2563EB]/5'
                        : 'border-[#E5E5E3] bg-[#F7F7F5] hover:border-[#1A1A1A]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-[#1A1A1A] font-semibold">{item.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#6B6B6B]">{item.count} cases</span>
                        <span className="font-mono font-bold text-[#DC2626] bg-[#DC2626]/10 px-1.5 py-0.5 rounded text-[11px]">
                          {item.percent}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 h-1.5 w-full bg-[#E5E5E3] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#DC2626] rounded-full transition-all"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-[#6B6B6B] mt-1.5">
                      {item.desc}
                    </p>
                    <div className="mt-1 text-[10px] font-mono text-[#2563EB] font-medium">
                      Mitigation Protocol: {item.riskImpact}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E5E5E3] text-xs text-[#6B6B6B] flex items-center justify-between">
            <span>Total 84 anomalies intercepted</span>
            <span className="text-[#16A34A] font-medium">Estimated loss prevented: IDR 2.8 Billion</span>
          </div>
        </div>

        {/* Chart 4: Hourly Verification Velocity & Turnaround SLA */}
        <div className="lg:col-span-6 bg-white border border-[#E5E5E3] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-4 mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#1A1A1A]">
                  Hourly Processing Velocity &amp; SLA
                </h3>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Throughput per hour and average verification duration (SLA target: 15 min).
                </p>
              </div>
              <Clock className="w-5 h-5 text-[#2563EB]" />
            </div>

            {/* Hourly Timeline Grid */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-12 text-[10px] font-medium text-[#6B6B6B] px-2 pb-1">
                <span className="col-span-2">HOUR (WIB)</span>
                <span className="col-span-6">VOLUME (AUTO vs MANUAL)</span>
                <span className="col-span-2 text-right">TOTAL</span>
                <span className="col-span-2 text-right">AVG SLA</span>
              </div>

              {hourlyVelocity.map((h) => {
                const autoWidth = (h.autoDecided / 25) * 100;
                const manualWidth = (h.manualReview / 25) * 100;

                return (
                  <div
                    key={h.hour}
                    className="grid grid-cols-12 items-center text-xs p-2 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]"
                  >
                    <span className="col-span-2 font-mono font-medium text-[#1A1A1A]">
                      {h.hour}
                    </span>

                    <div className="col-span-6 px-1">
                      <div className="h-3 w-full bg-[#E5E5E3] rounded flex overflow-hidden">
                        <div
                          className="h-full bg-[#2563EB]"
                          style={{ width: `${autoWidth}%` }}
                          title={`Automated: ${h.autoDecided}`}
                        />
                        <div
                          className="h-full bg-[#D97706]"
                          style={{ width: `${manualWidth}%` }}
                          title={`Manual Review: ${h.manualReview}`}
                        />
                      </div>
                    </div>

                    <div className="col-span-2 text-right font-mono font-semibold text-[#1A1A1A]">
                      {h.volume} units
                    </div>

                    <div className="col-span-2 text-right font-mono font-semibold text-[#16A34A]">
                      {h.avgSla} min
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E5E5E3] text-xs text-[#6B6B6B] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" />
                <span>Automated Approval (STP)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#D97706]" />
                <span>Verifier Intervention</span>
              </span>
            </div>
            <span className="font-semibold text-[#1A1A1A]">Peak: 10:00 - 14:00 WIB</span>
          </div>
        </div>
      </div>

      {/* 3rd Row: Vehicle Model Portfolio & Risk Analytics */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E3] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <Bike className="w-5 h-5 text-[#2563EB]" />
            <div>
              <h3 className="text-base font-semibold text-[#1A1A1A]">
                Financing Risk Exposure by Vehicle Model
              </h3>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Application portfolio quality tracking by applied Yamaha vehicle model line.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-[#6B6B6B]">Real-time BAF Core System Link</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F7F5] text-[#6B6B6B] font-medium border-b border-[#E5E5E3]">
              <tr>
                <th className="py-2.5 px-4">Vehicle Model</th>
                <th className="py-2.5 px-4">Applications</th>
                <th className="py-2.5 px-4">Approval Rate</th>
                <th className="py-2.5 px-4">BAF Risk Tier</th>
                <th className="py-2.5 px-4 text-right">Active Financing Portfolio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E3]">
              {vehicleModelPortfolio.map((item) => (
                <tr key={item.model} className="hover:bg-[#F7F7F5]/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#1A1A1A]">
                    {item.model}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#1A1A1A]">
                    {item.apps} apps
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-[#E5E5E3] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#16A34A] rounded-full"
                          style={{ width: `${item.approvalRate}%` }}
                        />
                      </div>
                      <span className="font-mono font-medium text-[#1A1A1A]">
                        {item.approvalRate}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        item.defaultRisk.includes('Sangat Rendah') || item.defaultRisk.includes('Rendah')
                          ? 'bg-[#16A34A]/10 text-[#16A34A]'
                          : item.defaultRisk.includes('Moderat')
                          ? 'bg-[#D97706]/10 text-[#D97706]'
                          : 'bg-[#DC2626]/10 text-[#DC2626]'
                      }`}
                    >
                      {item.defaultRisk}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-[#2563EB]">
                    {item.totalLoan}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
