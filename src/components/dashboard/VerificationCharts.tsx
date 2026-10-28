import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, TrendingUp, BarChart2, Filter } from 'lucide-react';

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

const branchDistribution = [
  { branch: 'BAF Jakarta Selatan', total: 42, clean: 31, warning: 8, fraud: 3 },
  { branch: 'BAF Kota Bekasi', total: 34, clean: 28, warning: 5, fraud: 1 },
  { branch: 'BAF Jakarta Barat', total: 29, clean: 21, warning: 6, fraud: 2 },
  { branch: 'BAF Bandung Soekarno-Hatta', total: 24, clean: 19, warning: 4, fraud: 1 },
  { branch: 'BAF Surabaya Timur', total: 19, clean: 15, warning: 3, fraud: 1 },
];

export const VerificationCharts: React.FC = () => {
  const [activeRange, setActiveRange] = useState<'7d' | '30d'>('7d');
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(sevenDaysData[6]);

  const maxTotal = 160;
  const chartHeight = 160;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Chart 1: Verification Volume & Fraud Trend (8 cols) */}
      <div className="lg:col-span-8 bg-white border border-[#E5E5E3] rounded-xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E3] pb-4 mb-4">
            <div>
              <h3 className="text-base font-semibold text-[#1A1A1A]">
                Verification volume &amp; anomaly trends
              </h3>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Daily submission breakdown: automated approvals, manual review queue, and fraud alerts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Range Toggle */}
              <div className="flex items-center rounded-lg border border-[#E5E5E3] bg-[#F7F7F5] p-0.5 text-xs font-medium">
                <button
                  onClick={() => setActiveRange('7d')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeRange === '7d'
                      ? 'bg-white text-[#1A1A1A] font-semibold'
                      : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                  }`}
                >
                  Last 7 days
                </button>
                <button
                  onClick={() => setActiveRange('30d')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeRange === '30d'
                      ? 'bg-white text-[#1A1A1A] font-semibold'
                      : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                  }`}
                >
                  Last 30 days
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
                  <span>Review ({hoveredDay ? hoveredDay.review : 26})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]" />
                  <span>Fraud ({hoveredDay ? hoveredDay.fraud : 8})</span>
                </span>
              </div>

              {hoveredDay && (
                <div className="font-mono text-xs text-[#1A1A1A] font-semibold">
                  {hoveredDay.date}: {hoveredDay.total} submissions
                </div>
              )}
            </div>

            {/* SVG Visual Bars with Grid Lines */}
            <div className="relative h-44 w-full flex items-end justify-between gap-3 pt-4 px-2 border-b border-[#E5E5E3]">
              {/* Horizontal Reference Grid Lines */}
              <div className="absolute inset-x-0 top-0 border-b border-dashed border-[#E5E5E3] pointer-events-none" />
              <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-[#E5E5E3] pointer-events-none" />

              {sevenDaysData.map((d, idx) => {
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
                    {/* Stacked Bar Container */}
                    <div
                      className={`w-full max-w-[36px] rounded-t flex flex-col-reverse overflow-hidden transition-all ${
                        isHovered ? 'ring-2 ring-[#2563EB]/40 opacity-100' : 'opacity-90 hover:opacity-100'
                      }`}
                      style={{ height: `${totalH}px` }}
                    >
                      {/* Approved slice (bottom) */}
                      <div
                        className="w-full bg-[#16A34A] transition-all"
                        style={{ height: `${approvedH}px` }}
                      />
                      {/* Review slice (middle) */}
                      <div
                        className="w-full bg-[#D97706] transition-all"
                        style={{ height: `${reviewH}px` }}
                      />
                      {/* Fraud slice (top) */}
                      <div
                        className="w-full bg-[#DC2626] transition-all"
                        style={{ height: `${fraudH}px` }}
                      />
                    </div>

                    {/* Day Label */}
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
            <span>Weekly auto-approval rate: <strong className="text-[#1A1A1A] tabular-nums">78.4%</strong></span>
          </div>
          <div className="tabular-nums font-mono">
            Weekly fraud containment: <strong>42 flagged cases</strong>
          </div>
        </div>
      </div>

      {/* Chart 2: Branch Anomaly Distribution (4 cols) */}
      <div className="lg:col-span-4 bg-white border border-[#E5E5E3] rounded-xl p-6 flex flex-col justify-between">
        <div>
          <div className="border-b border-[#E5E5E3] pb-4 mb-4">
            <h3 className="text-base font-semibold text-[#1A1A1A]">
              Branch risk distribution
            </h3>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Volume &amp; anomaly ratio across active BAF regional hubs today.
            </p>
          </div>

          {/* Branch Breakdown Bars */}
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
                      {item.total} cases
                    </span>
                  </div>

                  {/* Horizontal Bar Breakdown */}
                  <div className="h-2 w-full bg-[#E5E5E3] rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-[#16A34A]"
                      style={{ width: `${cleanPercent}%` }}
                      title={`Clean: ${item.clean}`}
                    />
                    <div
                      className="h-full bg-[#D97706]"
                      style={{ width: `${warningPercent}%` }}
                      title={`Warning: ${item.warning}`}
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
          <span>Jakarta South has highest daily throughput</span>
          <span className="font-semibold text-[#2563EB]">9 active hubs</span>
        </div>
      </div>
    </div>
  );
};
