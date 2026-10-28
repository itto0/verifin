import React, { useState } from 'react';
import {
 FileCheck,
 Download,
 Shield,
 Search,
 Filter,
 CheckCircle2,
 AlertTriangle,
 Building2,
 History,
 Lock,
 ExternalLink
} from 'lucide-react';
import {
 mockBranchMetrics,
 mockSystemAuditEntries,
 BranchReportMetric,
 SystemAuditEntry
} from '../../data/reportsData';

interface ReportsAuditViewProps {
 onSelectCase: (caseId: string) => void;
}

export const ReportsAuditView: React.FC<ReportsAuditViewProps> = ({ onSelectCase }) => {
 const [activeTab, setActiveTab] = useState<'branches' | 'audit'>('branches');
 const [searchTerm, setSearchTerm] = useState('');
 const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

 const handleSimulateExport = (format: 'Excel' | 'PDF') => {
 setDownloadSuccess(`Laporan_${format}_${Date.now()}.${format === 'Excel' ? 'xlsx' : 'pdf'}`);
 setTimeout(() => setDownloadSuccess(null), 4000);
 };

 const filteredAudits = mockSystemAuditEntries.filter(
 (a) =>
 a.targetRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
 a.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
 a.action.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
 <div className="space-y-6 max-w-7xl mx-auto">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h1 className="text-xl font-semibold text-[#1A1A1A]">
 Branch Compliance Reports &amp; OJK Audit Trail
 </h1>
 <p className="text-sm text-[#6B6B6B] mt-1">
 Recap of branch fraud rejection rates and immutable audit logs of system and manual underwriter decisions in compliance with OJK and UU PDP.
 </p>
 </div>

 {/* Export Buttons */}
 <div className="flex items-center gap-2">
 <button
 onClick={() => handleSimulateExport('Excel')}
 className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E5E5E3] bg-white text-xs font-semibold text-[#1A1A1A] hover:bg-[#F7F7F5] transition-colors"
 >
 <Download className="w-3.5 h-3.5 text-[#16A34A]" />
 <span>Export Excel</span>
 </button>
 <button
 onClick={() => handleSimulateExport('PDF')}
 className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
 >
 <Download className="w-3.5 h-3.5" />
 <span>Download PDF Report</span>
 </button>
 </div>
 </div>

 {/* Export notification toast */}
 {downloadSuccess && (
 <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-[#16A34A] flex items-center justify-between">
 <div className="flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 shrink-0" />
 <span>Report file <strong>{downloadSuccess}</strong> generated successfully.</span>
 </div>
 </div>
 )}

 {/* Tab Switcher: Ringkasan Cabang vs Master Audit Trail */}
 <div className="flex border-b border-[#E5E5E3] gap-6 text-sm font-semibold">
 <button
 onClick={() => setActiveTab('branches')}
 className={`pb-3 transition-colors flex items-center gap-2 ${
 activeTab === 'branches'
 ? 'text-[#2563EB] border-b-2 border-[#2563EB]'
 : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
 }`}
 >
 <Building2 className="w-4 h-4" />
 <span>Branch Performance &amp; Fraud Ratios</span>
 </button>
 <button
 onClick={() => setActiveTab('audit')}
 className={`pb-3 transition-colors flex items-center gap-2 ${
 activeTab === 'audit'
 ? 'text-[#2563EB] border-b-2 border-[#2563EB]'
 : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
 }`}
 >
 <History className="w-4 h-4" />
 <span>System Audit Trail (OJK &amp; UU PDP)</span>
 </button>
 </div>

 {activeTab === 'branches' ? (
 <div className="space-y-4">
 {/* Branch Performance Table */}
 <div className="rounded-xl border border-[#E5E5E3] bg-white overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead>
 <tr className="bg-[#F7F7F5] border-b border-[#E5E5E3] text-[#6B6B6B] text-xs font-semibold uppercase tracking-wider">
 <th className="py-3 px-4">BAF Branch Office</th>
 <th className="py-3 px-4 text-center">Total Submissions</th>
 <th className="py-3 px-4 text-center">Auto-Approve</th>
 <th className="py-3 px-4 text-center">Manual Review</th>
 <th className="py-3 px-4 text-center">Rejected Fraud</th>
 <th className="py-3 px-4 text-center">Fraud Rate</th>
 <th className="py-3 px-4 text-center">Mock GPS Alerts</th>
 <th className="py-3 px-4 text-right">Avg. Turnaround</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#E5E5E3]">
 {mockBranchMetrics.map((b) => (
 <tr key={b.branchName} className="hover:bg-[#F7F7F5] transition-colors">
 <td className="py-3.5 px-4 font-semibold text-[#1A1A1A]">
 {b.branchName}
 </td>
 <td className="py-3.5 px-4 text-center font-medium">
 {b.totalSubmissions}
 </td>
 <td className="py-3.5 px-4 text-center">
 <span className="text-[#16A34A] font-medium">{b.autoApproved}</span>
 </td>
 <td className="py-3.5 px-4 text-center">
 <span className="text-[#D97706] font-medium">{b.manualReviewed}</span>
 </td>
 <td className="py-3.5 px-4 text-center">
 <span className="text-[#DC2626] font-semibold">{b.rejectedFraud}</span>
 </td>
 <td className="py-3.5 px-4 text-center">
 <span
 className={` font-bold px-2 py-0.5 rounded text-xs ${
 b.fraudRatePercent > 10
 ? 'bg-red-50 text-[#DC2626] border border-red-200'
 : 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
 }`}
 >
 {b.fraudRatePercent}%
 </span>
 </td>
 <td className="py-3.5 px-4 text-center">
 {b.mockGpsDetectedCount > 0 ? (
 <span className=" text-xs font-bold text-[#DC2626]">
 {b.mockGpsDetectedCount} Cases
 </span>
 ) : (
 <span className="text-xs text-[#16A34A]">0</span>
 )}
 </td>
 <td className="py-3.5 px-4 text-right text-xs text-[#6B6B6B]">
 {b.avgProcessTimeMinutes} min
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* OJK & UU PDP Regulatory Compliance Box */}
 <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-lg bg-[#2563EB]/10 flex items-center justify-center shrink-0">
 <Lock className="w-5 h-5 text-[#2563EB]" />
 </div>
 <div>
 <span className="font-semibold text-[#1A1A1A] block">
 Personal Data Protection Act (UU PDP No. 27/2022) &amp; POJK Multifinance Compliance
 </span>
 <span className="text-[#6B6B6B] mt-0.5 block">
 Applicant NIK, facial biometrics, and call recordings are encrypted with AES-256 within Indonesian data centers. Automated 6-digit middle masking is enforced for Level 1 verifiers.
 </span>
 </div>
 </div>
 <div className="shrink-0 flex items-center gap-2">
 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-100 text-[#16A34A] font-semibold text-xs">
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span>Audit Ready</span>
 </span>
 </div>
 </div>
 </div>
 ) : (
 /* Master Audit Trail Tab */
 <div className="space-y-4">
 <div className="flex items-center justify-between gap-4">
 <div className="relative flex-1 max-w-md">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
 <input
 type="text"
 placeholder="Search case reference, actor, or action..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E5E3] rounded-lg text-sm text-[#1A1A1A] focus:outline-none focus:border-[#2563EB]"
 />
 </div>
 <span className="text-xs text-[#6B6B6B]">
 Displaying {filteredAudits.length} immutable audit log entries
 </span>
 </div>

 <div className="rounded-xl border border-[#E5E5E3] bg-white overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead>
 <tr className="bg-[#F7F7F5] border-b border-[#E5E5E3] text-[#6B6B6B] text-xs font-semibold uppercase tracking-wider">
 <th className="py-3 px-4">Timestamp &amp; ID</th>
 <th className="py-3 px-4">Category</th>
 <th className="py-3 px-4">Actor / System</th>
 <th className="py-3 px-4">Case</th>
 <th className="py-3 px-4">Action &amp; Details</th>
 <th className="py-3 px-4 text-right">SHA-256 Integrity</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#E5E5E3]">
 {filteredAudits.map((a) => (
 <tr key={a.id} className="hover:bg-[#F7F7F5] transition-colors">
 <td className="py-3.5 px-4">
 <div className="text-xs font-semibold text-[#1A1A1A] ">{a.id}</div>
 <div className="text-[11px] text-[#6B6B6B] ">{a.timestamp}</div>
 </td>
 <td className="py-3.5 px-4">
 <span
 className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
 a.category === 'SECURITY'
 ? 'bg-red-50 text-[#DC2626] border border-red-200'
 : a.category === 'COMPLIANCE_OJK'
 ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
 : 'bg-slate-100 text-[#1A1A1A]'
 }`}
 >
 {a.category}
 </span>
 </td>
 <td className="py-3.5 px-4 text-xs font-medium text-[#1A1A1A]">
 {a.actor}
 <div className="text-[10px] text-[#6B6B6B] ">{a.ipAddress}</div>
 </td>
 <td className="py-3.5 px-4">
 <button
 onClick={() => onSelectCase(a.targetRef)}
 className=" text-xs text-[#2563EB] hover:underline flex items-center gap-1 font-semibold"
 >
 <span>{a.targetRef}</span>
 <ExternalLink className="w-3 h-3" />
 </button>
 </td>
 <td className="py-3.5 px-4 text-xs max-w-sm">
 <div className="font-semibold text-[#1A1A1A]">{a.action}</div>
 <div className="text-[#6B6B6B] text-[11px] mt-0.5">{a.details}</div>
 </td>
 <td className="py-3.5 px-4 text-right text-[10px] text-[#6B6B6B] truncate max-w-[120px]">
 {a.integrityHash.substring(0, 16)}...
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};
