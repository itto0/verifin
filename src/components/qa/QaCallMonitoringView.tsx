import React, { useState } from 'react';
import {
 Headphones,
 PhoneCall,
 CheckCircle2,
 AlertTriangle,
 Clock,
 Play,
 FileText,
 Search,
 Filter,
 UserCheck,
 ShieldAlert
} from 'lucide-react';
import { FinancingCase } from '../../types';

interface QaCallMonitoringViewProps {
 cases: FinancingCase[];
 onSelectCase: (caseId: string) => void;
}

export const QaCallMonitoringView: React.FC<QaCallMonitoringViewProps> = ({
 cases,
 onSelectCase,
}) => {
 const [filterCompliance, setFilterCompliance] = useState<'all' | 'high' | 'low'>('all');

 const filteredCalls = cases.filter((c) => {
 if (filterCompliance === 'high') return c.voice.scriptComplianceScore >= 90;
 if (filterCompliance === 'low') return c.voice.scriptComplianceScore < 90;
 return true;
 });

 return (
 <div className="space-y-6">
 {/* Title & Introduction */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
 <div>
 <h2 className="text-xl font-semibold text-[#1A1A1A]">
 Tele-Verification &amp; Audio QA Monitoring
 </h2>
 <p className="text-sm text-[#6B6B6B] mt-1">
 Automated auditing for OJK call script adherence, customer hesitation pause tracking, and third-party voice detection.
 </p>
 </div>
 </div>

 {/* KPI Cards Row */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5">
 <div className="flex items-center justify-between text-xs font-medium text-[#6B6B6B]">
 <span>Average Script Compliance</span>
 <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
 </div>
 <div className="mt-3 text-2xl font-semibold text-[#1A1A1A] tabular-nums">
 92.8%
 </div>
 <div className="mt-2 text-xs text-[#16A34A] font-medium">
 Above BAF compliance standard (90%)
 </div>
 </div>

 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5">
 <div className="flex items-center justify-between text-xs font-medium text-[#6B6B6B]">
 <span>Calls with Hesitation Pauses</span>
 <Clock className="w-4 h-4 text-[#D97706]" />
 </div>
 <div className="mt-3 text-2xl font-semibold text-[#D97706] tabular-nums">
 2 Calls
 </div>
 <div className="mt-2 text-xs text-[#6B6B6B]">
 Unnatural pause &gt;2s on NIK &amp; mother\'s name
 </div>
 </div>

 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5">
 <div className="flex items-center justify-between text-xs font-medium text-[#6B6B6B]">
 <span>Third-Party Whispers Flagged</span>
 <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
 </div>
 <div className="mt-3 text-2xl font-semibold text-[#DC2626] tabular-nums">
 1 Call
 </div>
 <div className="mt-2 text-xs text-[#6B6B6B]">
 Indications of broker coaching in background
 </div>
 </div>

 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5">
 <div className="flex items-center justify-between text-xs font-medium text-[#6B6B6B]">
 <span>Average Call Duration</span>
 <PhoneCall className="w-4 h-4 text-[#2563EB]" />
 </div>
 <div className="mt-3 text-2xl font-semibold text-[#1A1A1A] tabular-nums">
 3 min 15 sec
 </div>
 <div className="mt-2 text-xs text-[#6B6B6B]">
 Standard target efficiency: 3-5 min
 </div>
 </div>
 </div>

 {/* Main Table Card */}
 <div className="bg-white border border-[#E5E5E3] rounded-xl overflow-hidden">
 <div className="p-4 border-b border-[#E5E5E3] flex flex-wrap items-center justify-between gap-3">
 <div>
 <h3 className="text-base font-semibold text-[#1A1A1A]">
 Tele-Verification Audio Recordings
 </h3>
 <p className="text-xs text-[#6B6B6B]">
 Processed via faster-whisper ASR and pyannote speaker diarization.
 </p>
 </div>

 <div className="flex items-center gap-2">
 <span className="text-xs text-[#6B6B6B]">Compliance Filter:</span>
 <select
 value={filterCompliance}
 onChange={(e) => setFilterCompliance(e.target.value as any)}
 className="bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg px-2.5 py-1 text-xs text-[#1A1A1A] focus:outline-none"
 >
 <option value="all">All Calls</option>
 <option value="high">Compliance &ge;90%</option>
 <option value="low">Compliance &lt;90%</option>
 </select>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead className="bg-[#F7F7F5] border-b border-[#E5E5E3] text-xs font-medium text-[#6B6B6B]">
 <tr>
 <th className="py-3 px-6">Call ID &amp; Time</th>
 <th className="py-3 px-6">Applicant / Consumer</th>
 <th className="py-3 px-6">Verifier Agent</th>
 <th className="py-3 px-6">Duration</th>
 <th className="py-3 px-6">Script Adherence</th>
 <th className="py-3 px-6">Hesitancy &amp; Audio Flags</th>
 <th className="py-3 px-6 text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#E5E5E3]">
 {filteredCalls.map((c) => {
 const { voice } = c;
 const isCompliant = voice.scriptComplianceScore >= 90;

 return (
 <tr
 key={c.id}
 className="hover:bg-[#F7F7F5]/50 transition-colors cursor-pointer"
 onClick={() => onSelectCase(c.id)}
 >
 <td className="py-4 px-6 whitespace-nowrap">
 <div className=" text-xs font-semibold text-[#1A1A1A]">
 {voice.callId}
 </div>
 <div className="text-xs text-[#6B6B6B] mt-0.5">
 {voice.callTimestamp.split(' ')[1]} WIB
 </div>
 </td>

 <td className="py-4 px-6">
 <div className="font-medium text-[#1A1A1A]">{c.customerName}</div>
 <div className="text-xs text-[#6B6B6B]">{c.vehicleModel}</div>
 </td>

 <td className="py-4 px-6">
 <div className="font-medium text-[#1A1A1A]">{voice.agentName}</div>
 <div className="text-xs text-[#6B6B6B]">{voice.agentId}</div>
 </td>

 <td className="py-4 px-6 text-xs tabular-nums text-[#1A1A1A]">
 {voice.audioDurationFormatted}
 </td>

 <td className="py-4 px-6 whitespace-nowrap">
 <div className="flex items-center gap-1.5 text-xs tabular-nums font-semibold">
 <span className={isCompliant ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
 {voice.scriptComplianceScore}%
 </span>
 <span className="text-[11px] text-[#6B6B6B] font-normal">
 ({isCompliant ? 'Standard Met' : 'Review Required'})
 </span>
 </div>
 </td>

 <td className="py-4 px-6 max-w-xs">
 {voice.voiceFlags.length > 0 ? (
 <div className="text-xs text-[#DC2626] line-clamp-1 font-medium">
 {voice.voiceFlags[0]}
 </div>
 ) : (
 <div className="text-xs text-[#16A34A] flex items-center gap-1">
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span>Fluent with zero hesitation</span>
 </div>
 )}
 </td>

 <td className="py-4 px-6 text-right whitespace-nowrap">
 <button
 onClick={(e) => {
 e.stopPropagation();
 onSelectCase(c.id);
 }}
 className="px-3 py-1.5 text-xs font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors flex items-center gap-1.5 ml-auto"
 >
 <Play className="w-3 h-3 ml-0.5" />
 <span>Listen to Audio</span>
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
