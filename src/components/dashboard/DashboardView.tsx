import React from 'react';
import {
  FileText,
  Clock,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { FinancingCase } from '../../types';
import { VerificationCharts } from './VerificationCharts';

interface DashboardViewProps {
  cases: FinancingCase[];
  onSelectCase: (caseId: string) => void;
  onNavigateToQueue: () => void;
  onNavigateToGis: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cases,
  onSelectCase,
  onNavigateToQueue,
  onNavigateToGis,
}) => {
  const pendingCases = cases.filter((c) => c.status === 'pending');
  const highRiskCases = cases.filter((c) => c.riskScore.level === 'high');
  const approvedCases = cases.filter((c) => c.status === 'approved');

  return (
    <div className="space-y-6">
      {/* Editorial Page Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-semibold text-[#1A1A1A]">
            Operational Overview &amp; Financing Risk Intelligence
          </h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Automated multi-pillar risk scoring across Dukcapil e-KTP identity, surveyor geospatial audits, and tele-verification across BAF branch network.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToQueue}
            className="px-4 py-2 text-xs font-medium text-white bg-[#2563EB] rounded-lg hover:bg-[#1D4ED8] transition-colors whitespace-nowrap"
          >
            Open Review Queue ({pendingCases.length})
          </button>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-[#E5E5E3] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#6B6B6B] text-xs font-medium">
            <span>Applications Processed Today</span>
            <FileText className="w-4 h-4 text-[#6B6B6B]" />
          </div>
          <div className="mt-3 text-2xl font-semibold text-[#1A1A1A] tabular-nums">
            148
          </div>
          <div className="mt-2 text-xs text-[#6B6B6B] flex items-center gap-1.5">
            <span className="text-[#16A34A] font-medium">+18%</span>
            <span>vs yesterday · 9 active branches</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-[#E5E5E3] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#6B6B6B] text-xs font-medium">
            <span>Pending Manual Review</span>
            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="mt-3 text-2xl font-semibold text-[#1A1A1A] tabular-nums">
            {pendingCases.length}
          </div>
          <div className="mt-2 text-xs text-[#6B6B6B]">
            Medium &amp; high risk applications requiring underwriter decision
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-[#E5E5E3] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#6B6B6B] text-xs font-medium">
            <span>Fraud &amp; Anomalies Blocked</span>
            <XCircle className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="mt-3 text-2xl font-semibold text-[#DC2626] tabular-nums">
            {highRiskCases.length}
          </div>
          <div className="mt-2 text-xs text-[#6B6B6B]">
            Fake GPS, duplicate NIK, e-KTP font tampering
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-[#E5E5E3] rounded-xl p-5">
          <div className="flex items-center justify-between text-[#6B6B6B] text-xs font-medium">
            <span>Average Turnaround SLA</span>
            <Clock className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="mt-3 text-2xl font-semibold text-[#1A1A1A] tabular-nums">
            4.2 min
          </div>
          <div className="mt-2 text-xs text-[#16A34A] font-medium">
            Significantly ahead of 15 min SLA target
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <VerificationCharts />


      {/* Recent Applications Table */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#1A1A1A]">
              Recent Financing Applications
            </h3>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Live Yamaha vehicle financing submissions evaluated by the VeriFin Risk Engine.
            </p>
          </div>
          <button
            onClick={onNavigateToQueue}
            className="text-xs text-[#2563EB] hover:underline font-medium self-start sm:self-auto"
          >
            View all applications &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F7F5] border-b border-[#E5E5E3] text-xs font-medium text-[#6B6B6B]">
              <tr>
                <th className="py-3 px-6">ID &amp; Time</th>
                <th className="py-3 px-6">Applicant / NIK</th>
                <th className="py-3 px-6">Branch &amp; Vehicle</th>
                <th className="py-3 px-6">Risk Score</th>
                <th className="py-3 px-6">Primary Flag</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E3]">
              {cases.slice(0, 5).map((item) => {
                const isHigh = item.riskScore.level === 'high';
                const isMedium = item.riskScore.level === 'medium';

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F7F7F5]/50 transition-colors cursor-pointer"
                    onClick={() => onSelectCase(item.id)}
                  >
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="font-mono text-xs font-medium text-[#1A1A1A]">
                        {item.id}
                      </div>
                      <div className="text-xs text-[#6B6B6B] tabular-nums mt-0.5">
                        {item.submittedAt.split(' ')[1]} WIB
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-medium text-[#1A1A1A]">
                        {item.customerName}
                      </div>
                      <div className="text-xs font-mono text-[#6B6B6B] mt-0.5">
                        {item.customerNik}
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="text-xs font-medium text-[#1A1A1A]">
                        {item.branch}
                      </div>
                      <div className="text-xs text-[#6B6B6B] mt-0.5">
                        {item.vehicleModel}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-sm font-semibold tabular-nums ${
                            isHigh
                              ? 'text-[#DC2626]'
                              : isMedium
                              ? 'text-[#D97706]'
                              : 'text-[#16A34A]'
                          }`}
                        >
                          {item.riskScore.totalScore}/100
                        </span>
                        <span className="text-xs text-[#6B6B6B]">
                          {isHigh ? 'High Risk' : isMedium ? 'Medium' : 'Low Risk'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 max-w-xs">
                      <p className="text-xs text-[#1A1A1A] truncate">
                        {item.riskScore.reasons[0] || 'No anomalies detected'}
                      </p>
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(item.id);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-[#2563EB] hover:bg-[#2563EB]/10 rounded-lg transition-colors"
                      >
                        Review &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
