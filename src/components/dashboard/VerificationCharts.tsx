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
 Filter,
 PieChart,
 BarChart3,
 MapPin,
 Headphones,
 ShieldCheck,
 Building,
 Zap,
 Sliders,
 Scale
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
 { day: 'Mon', date: 'Oct 21', total: 118, approved: 92, review: 21, fraud: 5 },
 { day: 'Tue', date: 'Oct 22', total: 126, approved: 98, review: 23, fraud: 5 },
 { day: 'Wed', date: 'Oct 23', total: 134, approved: 104, review: 24, fraud: 6 },
 { day: 'Thu', date: 'Oct 24', total: 122, approved: 95, review: 22, fraud: 5 },
 { day: 'Fri', date: 'Oct 25', total: 142, approved: 110, review: 26, fraud: 6 },
 { day: 'Sat', date: 'Oct 26', total: 138, approved: 106, review: 25, fraud: 7 },
 { day: 'Sun', date: 'Oct 27', total: 148, approved: 114, review: 26, fraud: 8 },
];

const thirtyDaysData: DayData[] = [
 { day: 'W1', date: 'Oct 1-7', total: 840, approved: 672, review: 138, fraud: 30 },
 { day: 'W2', date: 'Oct 8-14', total: 895, approved: 716, review: 145, fraud: 34 },
 { day: 'W3', date: 'Oct 15-21', total: 932, approved: 745, review: 152, fraud: 35 },
 { day: 'W4', date: 'Oct 22-28', total: 980, approved: 784, review: 158, fraud: 38 },
];

// Branch Distribution
const branchDistribution = [
 { branch: 'BAF Jakarta Selatan', total: 42, clean: 31, warning: 8, fraud: 3, avgSla: '3.8 min' },
 { branch: 'BAF Kota Bekasi', total: 34, clean: 28, warning: 5, fraud: 1, avgSla: '4.1 min' },
 { branch: 'BAF Jakarta Barat', total: 29, clean: 21, warning: 6, fraud: 2, avgSla: '4.5 min' },
 { branch: 'BAF Bandung Soekarno-Hatta', total: 24, clean: 19, warning: 4, fraud: 1, avgSla: '3.9 min' },
 { branch: 'BAF Surabaya Timur', total: 19, clean: 15, warning: 3, fraud: 1, avgSla: '4.6 min' },
];

// Multi-Pillar Risk Engine Distribution
const pillarRiskDistribution = [
 {
 pillar: 'e-KTP & Biometrics',
 share: 30,
 anomalies: 39,
 color: '#2563EB',
 icon: ShieldCheck,
 detail: 'Font tampering, NIK mismatch, selfie 3D liveness'
 },
 {
 pillar: 'Geotag & Survey GIS',
 share: 30,
 anomalies: 32,
 color: '#0284C7',
 icon: MapPin,
 detail: 'Mock location apps, radius > 1,000m'
 },
 {
 pillar: 'Tele-QA Audio Call',
 share: 25,
 anomalies: 9,
 color: '#D97706',
 icon: Headphones,
 detail: 'Speech hesitancy > 2.5s, script compliance'
 },
 {
 pillar: 'ICR & Sentuh Tanahku',
 share: 15,
 anomalies: 4,
 color: '#16A34A',
 icon: Layers,
 detail: 'Handwriting mismatch, unplotted BPN NIB'
 },
];

// Fraud Typologies
const fraudTypologies = [
 {
 type: 'Mock Location & Fake GPS',
 count: 32,
 percent: 38,
 desc: 'Android mock provider active on field surveyor device',
 riskImpact: 'High (Geofence Blacklist)'
 },
 {
 type: 'e-KTP Font & Microtext Tampering',
 count: 23,
 percent: 27,
 desc: 'Dukcapil microtext degradation & font weight anomaly',
 riskImpact: 'High (Document Syndicate)'
 },
 {
 type: 'Face Liveness Spoofing',
 count: 16,
 percent: 19,
 desc: 'Screen replay / printed photo failed 3D liveness test',
 riskImpact: 'High (Identity Theft)'
 },
 {
 type: 'Tele-QA Audio Hesitancy',
 count: 9,
 percent: 11,
 desc: 'Response latency discrepancy on debt questions',
 riskImpact: 'Medium (Secondary QA Review)'
 },
 {
 type: 'Collateral BPN Discrepancy',
 count: 4,
 percent: 5,
 desc: 'NIB land parcel unverified in Sentuh Tanahku registry',
 riskImpact: 'Medium (Physical Re-audit)'
 },
];

// Hourly Velocity
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

// Vehicle Model Portfolio
const vehicleModelPortfolio = [
 { model: 'Yamaha NMAX 155 Connected', apps: 48, approvalRate: 85, defaultRisk: 'Low (2.1%)', totalLoan: 'Rp 1.68 B' },
 { model: 'Yamaha Aerox 155 VVA', apps: 38, approvalRate: 81, defaultRisk: 'Moderate (3.8%)', totalLoan: 'Rp 1.25 B' },
 { model: 'Yamaha Grand Filano Hybrid', apps: 28, approvalRate: 92, defaultRisk: 'Very Low (1.2%)', totalLoan: 'Rp 868 M' },
 { model: 'Yamaha XMAX 250 Tech MAX', apps: 16, approvalRate: 68, defaultRisk: 'Watchlist (5.9%)', totalLoan: 'Rp 1.05 B' },
 { model: 'Yamaha Mio M3 125', apps: 18, approvalRate: 83, defaultRisk: 'Low (2.6%)', totalLoan: 'Rp 342 M' },
];

export const VerificationCharts: React.FC = () => {
 const [activeRange, setActiveRange] = useState<'7d' | '30d'>('7d');
 const activeDataset = activeRange === '7d' ? sevenDaysData : thirtyDaysData;
 const [hoveredDay, setHoveredDay] = useState<DayData | null>(activeDataset[activeDataset.length - 1]);
 const [selectedTypology, setSelectedTypology] = useState<string | null>(null);
 const [selectedPillar, setSelectedPillar] = useState<string | null>(null);

 const maxTotal = activeRange === '7d' ? 160 : 1100;
 const chartHeight = 160;

 return (
 <div className="space-y-6">
 {/* =========================================================================
 SECTION 1: 2-COLUMN MACRO VIEW (8 COLS WIDE BAR CHART + 4 COLS DONUT)
 ========================================================================= */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
 {/* CHART 1 (8 Cols): Daily Verification Volume & Anomaly Trends */}
 <div className="lg:col-span-8 bg-white border border-[#E5E5E3] rounded-xl p-5 flex flex-col justify-between">
 <div>
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3] mb-4">
 <div>
 <h3 className="text-base font-semibold text-[#1A1A1A]">
 Daily Verification Volume &amp; Anomaly Trends
 </h3>
 <p className="text-xs text-[#6B6B6B] mt-0.5">
 Macro underwriting throughput across straight-through approvals, manual review, and fraud flags.
 </p>
 </div>

 {/* Time Range Toggle */}
 <div className="flex items-center rounded-lg border border-[#E5E5E3] bg-[#F7F7F5] p-0.5 text-xs">
 <button
 type="button"
 onClick={() => {
 setActiveRange('7d');
 setHoveredDay(sevenDaysData[6]);
 }}
 className={`px-3 py-1 rounded font-medium transition-colors ${
 activeRange === '7d'
 ? 'bg-white text-[#1A1A1A] font-semibold border border-[#E5E5E3] shadow-xs'
 : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
 }`}
 >
 Last 7 Days
 </button>
 <button
 type="button"
 onClick={() => {
 setActiveRange('30d');
 setHoveredDay(thirtyDaysData[3]);
 }}
 className={`px-3 py-1 rounded font-medium transition-colors ${
 activeRange === '30d'
 ? 'bg-white text-[#1A1A1A] font-semibold border border-[#E5E5E3] shadow-xs'
 : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
 }`}
 >
 Last 30 Days
 </button>
 </div>
 </div>

 {/* Legend & Hover Data Bar */}
 <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-4">
 <div className="flex items-center gap-4 flex-wrap">
 <span className="flex items-center gap-1.5">
 <span className="w-2.5 h-2.5 rounded-xs bg-[#16A34A]" />
 <span>Approved ({hoveredDay ? hoveredDay.approved : 114})</span>
 </span>
 <span className="flex items-center gap-1.5">
 <span className="w-2.5 h-2.5 rounded-xs bg-[#D97706]" />
 <span>Manual Review ({hoveredDay ? hoveredDay.review : 26})</span>
 </span>
 <span className="flex items-center gap-1.5">
 <span className="w-2.5 h-2.5 rounded-xs bg-[#DC2626]" />
 <span>Flagged Fraud ({hoveredDay ? hoveredDay.fraud : 8})</span>
 </span>
 </div>

 {hoveredDay && (
 <div className=" text-xs text-[#1A1A1A] font-semibold bg-[#F7F7F5] px-2.5 py-1 rounded-lg border border-[#E5E5E3]">
 {hoveredDay.date}: <strong>{hoveredDay.total}</strong> applications
 </div>
 )}
 </div>

 {/* Interactive Multi-Bar Chart Canvas */}
 <div className="relative h-44 w-full flex items-end justify-between gap-3 pt-3 px-2 border-b border-[#E5E5E3]">
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
 className={`w-full max-w-[38px] rounded-t flex flex-col-reverse overflow-hidden transition-all ${
 isHovered ? 'ring-2 ring-[#2563EB]/40 opacity-100 scale-y-[1.02]' : 'opacity-90 hover:opacity-100'
 }`}
 style={{ height: `${totalH}px` }}
 >
 <div className="w-full bg-[#16A34A] transition-all" style={{ height: `${approvedH}px` }} />
 <div className="w-full bg-[#D97706] transition-all" style={{ height: `${reviewH}px` }} />
 <div className="w-full bg-[#DC2626] transition-all" style={{ height: `${fraudH}px` }} />
 </div>

 <div className="mt-2 text-xs font-medium text-[#6B6B6B] group-hover:text-[#1A1A1A]">
 {d.day}
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Footer Summary Strip */}
 <div className="pt-3 mt-3 border-t border-[#E5E5E3] flex flex-wrap items-center justify-between text-xs text-[#6B6B6B]">
 <div className="flex items-center gap-1.5 text-[#16A34A] font-medium">
 <TrendingUp className="w-4 h-4" />
 <span>Straight-Through Processing (STP) ratio: <strong className="text-[#1A1A1A] tabular-nums ">78.4%</strong></span>
 </div>
 <div className="tabular-nums ">
 Fraud intercepted: <strong className="text-[#DC2626]">8 cases today (42 this week)</strong>
 </div>
 </div>
 </div>

 {/* CHART 2 (4 Cols): Multi-Pillar Risk Engine Donut & Weights */}
 <div className="lg:col-span-4 bg-white border border-[#E5E5E3] rounded-xl p-5 flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3] mb-3">
 <div>
 <h3 className="text-base font-semibold text-[#1A1A1A]">
 Multi-Pillar Anomaly Mix
 </h3>
 <p className="text-xs text-[#6B6B6B] mt-0.5">
 Fraud distribution across BAF verification pillars
 </p>
 </div>
 <ShieldAlert className="w-4 h-4 text-[#2563EB]" />
 </div>

 {/* Circular Donut Visual + Pillar Breakdown */}
 <div className="flex flex-col items-center py-2">
 <div className="relative w-32 h-32 flex items-center justify-center my-2">
 <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
 <circle
 cx="18"
 cy="18"
 r="14"
 fill="transparent"
 stroke="#F7F7F5"
 strokeWidth="4"
 />
 {/* Slice 1: e-KTP (30%) */}
 <circle
 cx="18"
 cy="18"
 r="14"
 fill="transparent"
 stroke="#2563EB"
 strokeWidth="4"
 strokeDasharray="26.4 61.6"
 strokeDashoffset="0"
 className="transition-all hover:opacity-80 cursor-pointer"
 />
 {/* Slice 2: Geotag (30%) */}
 <circle
 cx="18"
 cy="18"
 r="14"
 fill="transparent"
 stroke="#0284C7"
 strokeWidth="4"
 strokeDasharray="26.4 61.6"
 strokeDashoffset="-26.4"
 className="transition-all hover:opacity-80 cursor-pointer"
 />
 {/* Slice 3: Tele-QA (25%) */}
 <circle
 cx="18"
 cy="18"
 r="14"
 fill="transparent"
 stroke="#D97706"
 strokeWidth="4"
 strokeDasharray="22 66"
 strokeDashoffset="-52.8"
 className="transition-all hover:opacity-80 cursor-pointer"
 />
 {/* Slice 4: ICR (15%) */}
 <circle
 cx="18"
 cy="18"
 r="14"
 fill="transparent"
 stroke="#16A34A"
 strokeWidth="4"
 strokeDasharray="13.2 74.8"
 strokeDashoffset="-74.8"
 className="transition-all hover:opacity-80 cursor-pointer"
 />
 </svg>
 <div className="absolute flex flex-col items-center justify-center text-center">
 <span className="text-xl font-bold text-[#1A1A1A]">84</span>
 <span className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium">Anomalies</span>
 </div>
 </div>

 {/* Legend List */}
 <div className="w-full space-y-1.5 mt-2">
 {pillarRiskDistribution.map((item) => (
 <div
 key={item.pillar}
 onClick={() => setSelectedPillar(selectedPillar === item.pillar ? null : item.pillar)}
 className={`p-2 rounded-lg text-xs cursor-pointer transition-colors flex items-center justify-between border ${
 selectedPillar === item.pillar ? 'bg-[#F7F7F5] border-[#2563EB] font-semibold' : 'border-transparent hover:bg-[#F7F7F5]'
 }`}
 >
 <div className="flex items-center gap-2 truncate">
 <span
 className="w-2.5 h-2.5 rounded-full shrink-0"
 style={{ backgroundColor: item.color }}
 />
 <span className="text-[#1A1A1A] truncate">{item.pillar}</span>
 </div>
 <span className=" text-xs font-semibold text-[#1A1A1A] shrink-0">
 {item.anomalies} ({item.share}%)
 </span>
 </div>
 ))}
 </div>
 </div>

 {/* Selected Pillar Detail Banner */}
 <div className="mt-2 p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] text-[11px] text-[#6B6B6B]">
 <span className="font-semibold text-[#1A1A1A]">
 {selectedPillar || 'Dominant Threat'}:
 </span>{' '}
 {pillarRiskDistribution.find(p => p.pillar === selectedPillar)?.detail || 'e-KTP font tampering and fake GPS spoofing account for 60% of all risk events.'}
 </div>
 </div>

 <div className="pt-3 mt-3 border-t border-[#E5E5E3] flex items-center justify-between text-xs text-[#6B6B6B]">
 <span>Active Algorithm Weights</span>
 <span className=" text-[#2563EB] font-semibold">100% Balanced Engine</span>
 </div>
 </div>
 </div>

 {/* =========================================================================
 SECTION 2: 3-COLUMN OPERATIONAL FORENSICS GRID (1:1:1 RATIO)
 ========================================================================= */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
 {/* CHART 3: Hourly Verification Velocity & SLA */}
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3] mb-3">
 <div>
 <h3 className="text-sm font-semibold text-[#1A1A1A]">
 Hourly Processing Velocity
 </h3>
 <p className="text-[11px] text-[#6B6B6B] mt-0.5">
 Automated STP vs. manual verifier volume by hour
 </p>
 </div>
 <Clock className="w-4 h-4 text-[#2563EB]" />
 </div>

 {/* Hourly Micro-Timeline */}
 <div className="space-y-2">
 <div className="grid grid-cols-12 text-[10px] font-semibold text-[#6B6B6B] px-1 pb-1">
 <span className="col-span-3">HOUR (WIB)</span>
 <span className="col-span-6">THROUGHPUT RATIO</span>
 <span className="col-span-3 text-right">VOLUME</span>
 </div>

 {hourlyVelocity.slice(1, 8).map((h) => {
 const autoWidth = (h.autoDecided / 25) * 100;
 const manualWidth = (h.manualReview / 25) * 100;

 return (
 <div
 key={h.hour}
 className="grid grid-cols-12 items-center text-xs p-1.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]"
 >
 <span className="col-span-3 font-medium text-[11px] text-[#1A1A1A]">
 {h.hour}
 </span>

 <div className="col-span-6 px-1">
 <div className="h-2.5 w-full bg-[#E5E5E3] rounded-sm flex overflow-hidden">
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

 <div className="col-span-3 text-right font-semibold text-[11px] text-[#1A1A1A]">
 {h.volume} units
 </div>
 </div>
 );
 })}
 </div>
 </div>

 <div className="pt-3 mt-3 border-t border-[#E5E5E3] flex items-center justify-between text-xs text-[#6B6B6B]">
 <div className="flex items-center gap-2 text-[10px]">
 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-[#2563EB]" /> STP</span>
 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-[#D97706]" /> Review</span>
 </div>
 <span className="font-semibold text-[#1A1A1A] text-[11px]">Peak: 10:00–14:00 WIB</span>
 </div>
 </div>

 {/* CHART 4: Fraud Typology & Intercepted Threats */}
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3] mb-3">
 <div>
 <h3 className="text-sm font-semibold text-[#1A1A1A]">
 Fraud Typology Breakdown
 </h3>
 <p className="text-[11px] text-[#6B6B6B] mt-0.5">
 Classification of 84 intercepted threats this month
 </p>
 </div>
 <XCircle className="w-4 h-4 text-[#DC2626]" />
 </div>

 {/* Typologies List */}
 <div className="space-y-2">
 {fraudTypologies.map((item) => {
 const isSelected = selectedTypology === item.type;
 return (
 <div
 key={item.type}
 onClick={() => setSelectedTypology(isSelected ? null : item.type)}
 className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
 isSelected
 ? 'border-[#2563EB] bg-[#2563EB]/5'
 : 'border-[#E5E5E3] bg-[#F7F7F5] hover:border-[#CBD5E1]'
 }`}
 >
 <div className="flex items-center justify-between text-[11px]">
 <span className="font-medium text-[#1A1A1A] truncate">{item.type}</span>
 <div className="flex items-center gap-1.5 shrink-0">
 <span className=" text-[#6B6B6B]">{item.count}</span>
 <span className=" font-bold text-[#DC2626] bg-[#DC2626]/10 px-1 py-0.2 rounded text-[10px]">
 {item.percent}%
 </span>
 </div>
 </div>

 <div className="mt-1.5 h-1 w-full bg-[#E5E5E3] rounded-full overflow-hidden">
 <div
 className="h-full bg-[#DC2626] rounded-full"
 style={{ width: `${item.percent}%` }}
 />
 </div>
 </div>
 );
 })}
 </div>
 </div>

 <div className="pt-3 mt-3 border-t border-[#E5E5E3] flex items-center justify-between text-xs text-[#6B6B6B]">
 <span>Financial loss prevented:</span>
 <span className=" font-semibold text-[#16A34A]">Rp 2.8 Billion</span>
 </div>
 </div>

 {/* CHART 5: Regional Branch Risk Distribution */}
 <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3] mb-3">
 <div>
 <h3 className="text-sm font-semibold text-[#1A1A1A]">
 Branch Risk &amp; SLA Breakdown
 </h3>
 <p className="text-[11px] text-[#6B6B6B] mt-0.5">
 Anomaly ratios and turnaround speed per regional branch
 </p>
 </div>
 <Building className="w-4 h-4 text-[#2563EB]" />
 </div>

 {/* Branch Progress Bars */}
 <div className="space-y-3 text-xs">
 {branchDistribution.map((item) => {
 const cleanPercent = Math.round((item.clean / item.total) * 100);
 const warningPercent = Math.round((item.warning / item.total) * 100);
 const fraudPercent = 100 - cleanPercent - warningPercent;

 return (
 <div key={item.branch} className="space-y-1">
 <div className="flex items-center justify-between text-[11px]">
 <span className="font-medium text-[#1A1A1A] truncate max-w-[170px]">{item.branch}</span>
 <span className=" text-[#6B6B6B] shrink-0">
 {item.total} apps · <strong className="text-[#16A34A]">{item.avgSla}</strong>
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
 </div>
 );
 })}
 </div>
 </div>

 <div className="pt-3 mt-3 border-t border-[#E5E5E3] flex items-center justify-between text-xs text-[#6B6B6B]">
 <div className="flex items-center gap-2 text-[10px]">
 <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> Clean</span>
 <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" /> Review</span>
 <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" /> Fraud</span>
 </div>
 <span className="font-semibold text-[#1A1A1A] text-[11px]">Fastest: Jaksel (3.8m)</span>
 </div>
 </div>
 </div>

 {/* =========================================================================
 SECTION 3: 2-COLUMN BALANCED ROW (7 COLS VEHICLE PORTFOLIO + 5 COLS POLICY)
 ========================================================================= */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
 {/* CHART 6 (7 Cols): Vehicle Financing Risk Exposure */}
 <div className="lg:col-span-7 bg-white border border-[#E5E5E3] rounded-xl p-5 flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3] mb-3">
 <div>
 <h3 className="text-base font-semibold text-[#1A1A1A]">
 Financing Risk Exposure by Vehicle Model
 </h3>
 <p className="text-xs text-[#6B6B6B] mt-0.5">
 Approval rates and loan distribution by Yamaha unit
 </p>
 </div>
 <Bike className="w-4 h-4 text-[#2563EB]" />
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-[#F7F7F5] text-[#6B6B6B] font-medium border-b border-[#E5E5E3]">
 <tr>
 <th className="py-2.5 px-3">Vehicle Model</th>
 <th className="py-2.5 px-3">Volume</th>
 <th className="py-2.5 px-3">Pass Rate</th>
 <th className="py-2.5 px-3">Risk Tier</th>
 <th className="py-2.5 px-3 text-right">Loan Value</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#E5E5E3]">
 {vehicleModelPortfolio.map((item) => (
 <tr key={item.model} className="hover:bg-[#F7F7F5]/50 transition-colors">
 <td className="py-2.5 px-3 font-semibold text-[#1A1A1A]">
 {item.model}
 </td>
 <td className="py-2.5 px-3 text-[#6B6B6B]">
 {item.apps} apps
 </td>
 <td className="py-2.5 px-3">
 <div className="flex items-center gap-1.5">
 <div className="w-16 h-1.5 bg-[#E5E5E3] rounded-full overflow-hidden">
 <div
 className="h-full bg-[#16A34A] rounded-full"
 style={{ width: `${item.approvalRate}%` }}
 />
 </div>
 <span className=" font-medium text-[#1A1A1A] text-[11px]">
 {item.approvalRate}%
 </span>
 </div>
 </td>
 <td className="py-2.5 px-3">
 <span
 className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
 item.defaultRisk.includes('Low')
 ? 'bg-[#16A34A]/10 text-[#16A34A]'
 : item.defaultRisk.includes('Moderate')
 ? 'bg-[#D97706]/10 text-[#D97706]'
 : 'bg-[#DC2626]/10 text-[#DC2626]'
 }`}
 >
 {item.defaultRisk}
 </span>
 </td>
 <td className="py-2.5 px-3 text-right font-semibold text-[#2563EB]">
 {item.totalLoan}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 <div className="pt-3 mt-3 border-t border-[#E5E5E3] flex items-center justify-between text-xs text-[#6B6B6B]">
 <span>Active Unit Range: 125cc – 250cc</span>
 <span className="font-semibold text-[#1A1A1A]">Yamaha Motor Indonesia Official Link</span>
 </div>
 </div>

 {/* POLICY / GUARDRAILS (5 Cols): Risk Engine Directives & OJK SLA */}
 <div className="lg:col-span-5 bg-white border border-[#E5E5E3] rounded-xl p-5 flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3] mb-3">
 <div>
 <h3 className="text-base font-semibold text-[#1A1A1A]">
 Risk Engine Guardrails &amp; Directives
 </h3>
 <p className="text-xs text-[#6B6B6B] mt-0.5">
 Automated decision gates &amp; underwriting thresholds
 </p>
 </div>
 <Scale className="w-4 h-4 text-[#2563EB]" />
 </div>

 <div className="space-y-2.5 text-xs">
 {/* Gate 1 */}
 <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] space-y-1">
 <div className="flex items-center justify-between">
 <span className="font-semibold text-[#16A34A] flex items-center gap-1.5">
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span>Auto-Approval Gate (STP)</span>
 </span>
 <span className=" text-[10px] text-[#6B6B6B]">Composite Score &lt; 35</span>
 </div>
 <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
 Dukcapil 100% matched, Geofence radius &le; 200m, Genuine CameraX hardware, and zero tele-QA hesitancy flags.
 </p>
 </div>

 {/* Gate 2 */}
 <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] space-y-1">
 <div className="flex items-center justify-between">
 <span className="font-semibold text-[#D97706] flex items-center gap-1.5">
 <AlertTriangle className="w-3.5 h-3.5" />
 <span>Manual Underwriter Escalation</span>
 </span>
 <span className=" text-[10px] text-[#6B6B6B]">Score 36 – 69</span>
 </div>
 <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
 Geofence radius 200–1,000m, tele-verification speech hesitation &gt; 2.5s, or ICR handwriting confidence &lt; 80%.
 </p>
 </div>

 {/* Gate 3 */}
 <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] space-y-1">
 <div className="flex items-center justify-between">
 <span className="font-semibold text-[#DC2626] flex items-center gap-1.5">
 <XCircle className="w-3.5 h-3.5" />
 <span>Instant Fraud Rejection</span>
 </span>
 <span className=" text-[10px] text-[#6B6B6B]">Score &ge; 70</span>
 </div>
 <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
 Active Android Mock Location provider, e-KTP microtext font manipulation, or failed 3D face liveness test.
 </p>
 </div>
 </div>
 </div>

 <div className="pt-3 mt-3 border-t border-[#E5E5E3] flex items-center justify-between text-xs text-[#6B6B6B]">
 <span>Governance Framework:</span>
 <span className=" font-semibold text-[#2563EB]">POJK 35/POJK.05/2018</span>
 </div>
 </div>
 </div>
 </div>
 );
};
