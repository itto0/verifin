import React, { useState } from 'react';
import {
 Search,
 Filter,
 ArrowUpDown,
 AlertTriangle,
 CheckCircle2,
 Clock,
 XCircle,
 FileCheck2,
 MapPin,
 Headphones,
 ShieldAlert
} from 'lucide-react';
import { FinancingCase, RiskLevel, CaseStatus } from '../../types';
import { branchList } from '../../data/mockData';

interface ReviewQueueViewProps {
 cases: FinancingCase[];
 onSelectCase: (caseId: string) => void;
 searchQuery: string;
 onSearchChange: (query: string) => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
 cases,
 onSelectCase,
 searchQuery,
 onSearchChange,
}) => {
 const [statusFilter, setStatusFilter] = useState<string>('all');
 const [riskFilter, setRiskFilter] = useState<string>('all');
 const [branchFilter, setBranchFilter] = useState<string>('All Branches');
 const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'time_desc'>('score_desc');

 // Filter cases
 const filteredCases = cases.filter((c) => {
 // Search match
 const q = searchQuery.toLowerCase();
 const matchesSearch =
 !q ||
 c.id.toLowerCase().includes(q) ||
 c.customerName.toLowerCase().includes(q) ||
 c.customerNik.includes(q) ||
 c.vehicleModel.toLowerCase().includes(q);

 // Status filter
 const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

 // Risk filter
 const matchesRisk = riskFilter === 'all' || c.riskScore.level === riskFilter;

 // Branch filter
 const matchesBranch = branchFilter === 'All Branches' || c.branch === branchFilter;

 return matchesSearch && matchesStatus && matchesRisk && matchesBranch;
 });

 // Sort
 const sortedCases = [...filteredCases].sort((a, b) => {
 if (sortBy === 'score_desc') return b.riskScore.totalScore - a.riskScore.totalScore;
 if (sortBy === 'score_asc') return a.riskScore.totalScore - b.riskScore.totalScore;
 return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
 });

 return (
 <div className="space-y-6">
 {/* Title & Stats */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
 <div>
 <h2 className="text-xl font-semibold text-[#1A1A1A]">
 Financing Review Queue
 </h2>
 <p className="text-sm text-[#6B6B6B] mt-1">
 Applications requiring human verifier decision based on automated multi-pillar risk scoring.
 </p>
 </div>
 <div className="text-xs text-[#6B6B6B] flex items-center gap-2">
 <span>
 Showing <strong className="text-[#1A1A1A] tabular-nums">{sortedCases.length}</strong> of{' '}
 <strong className="text-[#1A1A1A] tabular-nums">{cases.length}</strong> applications
 </span>
 </div>
 </div>

 {/* Filter Bar */}
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-4 space-y-3">
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
 {/* Search */}
 <div>
 <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Search Applications</label>
 <div className="relative">
 <Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 placeholder="Name / NIK / Application ID..."
 value={searchQuery}
 onChange={(e) => onSearchChange(e.target.value)}
 className="w-full bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#1A1A1A] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#2563EB]"
 />
 </div>
 </div>

 {/* Status Filter */}
 <div>
 <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Application Status</label>
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="w-full bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#2563EB]"
 >
 <option value="all">All Statuses</option>
 <option value="pending">Pending Verification</option>
 <option value="approved">Approved</option>
 <option value="resurvey">Re-survey Required</option>
 <option value="rejected_fraud">Rejected / Fraud Flagged</option>
 </select>
 </div>

 {/* Risk Level Filter */}
 <div>
 <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Risk Classification</label>
 <select
 value={riskFilter}
 onChange={(e) => setRiskFilter(e.target.value)}
 className="w-full bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#2563EB]"
 >
 <option value="all">All Risk Tiers</option>
 <option value="high">High Risk (70-100)</option>
 <option value="medium">Medium Risk (40-69)</option>
 <option value="low">Low Risk (0-39)</option>
 </select>
 </div>

 {/* Branch Filter */}
 <div>
 <label className="block text-xs font-medium text-[#6B6B6B] mb-1">BAF Branch</label>
 <select
 value={branchFilter}
 onChange={(e) => setBranchFilter(e.target.value)}
 className="w-full bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#2563EB]"
 >
 {branchList.map((b) => (
 <option key={b} value={b}>
 {b}
 </option>
 ))}
 </select>
 </div>
 </div>

 {/* Quick Segmented Sorting */}
 <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5E5E3] text-xs">
 <div className="flex items-center gap-1 text-[#6B6B6B]">
 <span>Sort by:</span>
 <button
 onClick={() => setSortBy('score_desc')}
 className={`px-2.5 py-1 rounded text-xs transition-colors ${
 sortBy === 'score_desc' ? 'bg-[#1A1A1A] text-white font-medium' : 'hover:bg-[#F7F7F5] text-[#1A1A1A]'
 }`}
 >
 Highest Risk Score
 </button>
 <button
 onClick={() => setSortBy('score_asc')}
 className={`px-2.5 py-1 rounded text-xs transition-colors ${
 sortBy === 'score_asc' ? 'bg-[#1A1A1A] text-white font-medium' : 'hover:bg-[#F7F7F5] text-[#1A1A1A]'
 }`}
 >
 Lowest Risk Score
 </button>
 <button
 onClick={() => setSortBy('time_desc')}
 className={`px-2.5 py-1 rounded text-xs transition-colors ${
 sortBy === 'time_desc' ? 'bg-[#1A1A1A] text-white font-medium' : 'hover:bg-[#F7F7F5] text-[#1A1A1A]'
 }`}
 >
 Submission Time
 </button>
 </div>

 <div className="text-[#6B6B6B]">
 Triage Priority: Cases with score &ge;70 should be investigated first
 </div>
 </div>
 </div>

 {/* Main Data Table */}
 <div className="bg-white border border-[#E5E5E3] rounded-xl overflow-hidden">
 {sortedCases.length === 0 ? (
 <div className="py-16 text-center text-sm text-[#6B6B6B]">
 No applications match the current filter criteria.
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead className="bg-[#F7F7F5] border-b border-[#E5E5E3] text-xs font-medium text-[#6B6B6B]">
 <tr>
 <th className="py-3 px-6">Application ID &amp; Time</th>
 <th className="py-3 px-6">Applicant / Identity</th>
 <th className="py-3 px-6">Vehicle &amp; Installment</th>
 <th className="py-3 px-6">Risk Score</th>
 <th className="py-3 px-6">Primary Anomaly</th>
 <th className="py-3 px-6">Status</th>
 <th className="py-3 px-6 text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#E5E5E3]">
 {sortedCases.map((c) => {
 const isHigh = c.riskScore.level === 'high';
 const isMedium = c.riskScore.level === 'medium';

 return (
 <tr
 key={c.id}
 onClick={() => onSelectCase(c.id)}
 className="hover:bg-[#F7F7F5]/60 transition-colors cursor-pointer"
 >
 {/* Column 1: Application ID */}
 <td className="py-4 px-6 whitespace-nowrap">
 <div className=" text-xs font-semibold text-[#1A1A1A]">
 {c.applicationNumber}
 </div>
 <div className="text-xs text-[#6B6B6B] mt-0.5 tabular-nums">
 {c.submittedAt}
 </div>
 </td>

 {/* Column 2: Customer */}
 <td className="py-4 px-6">
 <div className="font-medium text-[#1A1A1A]">{c.customerName}</div>
 <div className="text-xs text-[#6B6B6B] flex items-center gap-1.5 mt-0.5">
 <span className="">{c.customerNik}</span>
 <span>·</span>
 <span>{c.branch}</span>
 </div>
 </td>

 {/* Column 3: Vehicle & Loan */}
 <td className="py-4 px-6">
 <div className="text-xs font-medium text-[#1A1A1A]">{c.vehicleModel}</div>
 <div className="text-xs text-[#6B6B6B] mt-0.5 tabular-nums">
 IDR {(c.monthlyInstallment).toLocaleString('id-ID')}/mo · {c.tenorMonths} mos
 </div>
 </td>

 {/* Column 4: Risk Score */}
 <td className="py-4 px-6 whitespace-nowrap">
 <div className="flex items-center gap-1.5">
 <span
 className={` text-base font-semibold tabular-nums ${
 isHigh
 ? 'text-[#DC2626]'
 : isMedium
 ? 'text-[#D97706]'
 : 'text-[#16A34A]'
 }`}
 >
 {c.riskScore.totalScore}
 </span>
 <span className="text-xs text-[#6B6B6B]">/100</span>
 <span className="text-xs text-[#6B6B6B]">·</span>
 <span
 className={`text-xs font-medium ${
 isHigh
 ? 'text-[#DC2626]'
 : isMedium
 ? 'text-[#D97706]'
 : 'text-[#16A34A]'
 }`}
 >
 {isHigh ? 'High' : isMedium ? 'Medium' : 'Low'}
 </span>
 </div>
 </td>

 {/* Column 5: Anomaly Flags Breakdown */}
 <td className="py-4 px-6 max-w-xs">
 <div className="text-xs text-[#1A1A1A] line-clamp-1">
 {c.riskScore.reasons[0]}
 </div>
 {c.riskScore.reasons.length > 1 && (
 <div className="text-[11px] text-[#6B6B6B] mt-0.5">
 +{c.riskScore.reasons.length - 1} additional flags
 </div>
 )}
 </td>

 {/* Column 6: Status */}
 <td className="py-4 px-6 whitespace-nowrap text-xs">
 {c.status === 'pending' && (
 <span className="text-[#D97706] font-medium flex items-center gap-1">
 <Clock className="w-3.5 h-3.5" />
 <span>Pending</span>
 </span>
 )}
 {c.status === 'approved' && (
 <span className="text-[#16A34A] font-medium flex items-center gap-1">
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span>Approved</span>
 </span>
 )}
 {c.status === 'resurvey' && (
 <span className="text-[#2563EB] font-medium flex items-center gap-1">
 <MapPin className="w-3.5 h-3.5" />
 <span>Re-survey</span>
 </span>
 )}
 {c.status === 'rejected_fraud' && (
 <span className="text-[#DC2626] font-medium flex items-center gap-1">
 <XCircle className="w-3.5 h-3.5" />
 <span>Fraud / Rejected</span>
 </span>
 )}
 </td>

 {/* Column 7: Action */}
 <td className="py-4 px-6 text-right whitespace-nowrap">
 <button
 onClick={(e) => {
 e.stopPropagation();
 onSelectCase(c.id);
 }}
 className="px-3 py-1.5 text-xs font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors"
 >
 Audit Case
 </button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 );
};
