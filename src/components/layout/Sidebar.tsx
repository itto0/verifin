import React, { useState } from 'react';
import {
 LayoutDashboard,
 ShieldAlert,
 MapPin,
 Headphones,
 Sliders,
 Users,
 ScanLine,
 FileCheck,
 Database,
 Sparkles,
 ShieldCheck,
 ChevronRight
} from 'lucide-react';
import { CaseSubPage } from '../../types';

export type NavTab =
 | 'dashboard'
 | 'queue'
 | 'detail'
 | 'gis'
 | 'qa'
 | 'surveyor'
 | 'icr'
 | 'reports'
 | 'master'
 | 'settings';

interface SidebarProps {
 currentTab: NavTab;
 onSelectTab: (tab: NavTab) => void;
 pendingCount: number;
 isOpenMobile: boolean;
 onCloseMobile: () => void;
 selectedCaseId?: string;
 activeCaseSubPage?: CaseSubPage;
 onSelectCaseSubPage?: (subPage: CaseSubPage) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
 currentTab,
 onSelectTab,
 pendingCount,
 isOpenMobile,
 onCloseMobile,
 selectedCaseId = 'CASE-0941',
 activeCaseSubPage = 'overview',
 onSelectCaseSubPage,
}) => {
 const [logoError, setLogoError] = useState(false);

 const navItems = [
 {
 id: 'dashboard' as NavTab,
 label: 'Dashboard',
 icon: LayoutDashboard,
 desc: 'Operational summary'
 },
 {
 id: 'queue' as NavTab,
 label: 'Review Queue',
 icon: ShieldAlert,
 badge: pendingCount > 0 ? pendingCount : undefined,
 desc: 'Pending decisions'
 },
 {
 id: 'gis' as NavTab,
 label: 'GIS Survey Map',
 icon: MapPin,
 desc: 'Geotags & surveyor routes'
 },
 {
 id: 'qa' as NavTab,
 label: 'Audio QA Monitoring',
 icon: Headphones,
 desc: 'Call compliance & audio'
 },
 {
 id: 'surveyor' as NavTab,
 label: 'Surveyor Fleet & SLA',
 icon: Users,
 desc: 'Field surveyor fleet & SLA'
 },
 {
 id: 'icr' as NavTab,
 label: 'ICR & Collateral Verification',
 icon: ScanLine,
 desc: 'Handwritten & Sentuh Tanahku'
 },
 {
 id: 'reports' as NavTab,
 label: 'Reports & Audit Trail',
 icon: FileCheck,
 desc: 'Compliance & audit logs'
 },
 {
 id: 'master' as NavTab,
 label: 'Master Data Management',
 icon: Database,
 desc: 'Branches, products & scripts'
 },
 {
 id: 'settings' as NavTab,
 label: 'Risk Rules & Weights',
 icon: Sliders,
 desc: 'Risk engine parameters'
 }
 ];

 const caseSubPages: { id: CaseSubPage; label: string; icon: React.ElementType }[] = [
 { id: 'overview', label: '1. Overview & Decision', icon: Sparkles },
 { id: 'ektp', label: '2. e-KTP & Biometrics', icon: ShieldCheck },
 { id: 'geo', label: '3. Geotag & Survey', icon: MapPin },
 { id: 'voice', label: '4. Audio QA & Call', icon: Headphones },
 { id: 'icr', label: '5. ICR & Collateral', icon: ScanLine },
 ];

 return (
 <>
 {/* Mobile Backdrop */}
 {isOpenMobile && (
 <div
 className="fixed inset-0 bg-black/20 z-40 lg:hidden"
 onClick={onCloseMobile}
 />
 )}

 <aside
 className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-white border-r border-[#E5E5E3] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
 isOpenMobile ? 'translate-x-0' : '-translate-x-full'
 }`}
 >
 {/* Top Header / Branding with BAF official logo */}
 <div className="flex-1 overflow-y-auto">
 <div className="h-20 px-4 flex items-center justify-center border-b border-[#E5E5E3] shrink-0 sticky top-0 bg-white z-10">
 <div className="flex items-center justify-center w-full">
 {!logoError ? (
 <img
 src="https://cdn-jk01.kabaroto.com/media/6f/4d/b9/6f4db95441531a1b78f188073be60248_800x450.jpeg"
 alt="BAF Logo"
 referrerPolicy="no-referrer"
 onError={() => setLogoError(true)}
 className="h-14 w-auto max-w-[205px] object-contain rounded"
 />
 ) : (
 <div className="w-10 h-10 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-sm tracking-wider">
 BAF
 </div>
 )}
 </div>
 </div>

 {/* Navigation Items */}
 <nav className="p-3 space-y-1">
 <div className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">
 Main Navigation
 </div>
 {navItems.map((item) => {
 const Icon = item.icon;
 const isActive = currentTab === item.id;

 return (
 <div key={item.id} className="space-y-1">
 <button
 onClick={() => {
 onSelectTab(item.id);
 onCloseMobile();
 }}
 className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
 isActive
 ? 'bg-[#2563EB]/10 text-[#2563EB] font-medium border-l-2 border-[#2563EB]'
 : 'text-[#1A1A1A] hover:bg-[#F7F7F5] font-normal'
 }`}
 >
 <div className="flex items-center gap-3">
 <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-[#6B6B6B]'}`} />
 <span>{item.label}</span>
 </div>
 {item.badge !== undefined && (
 <span className="text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded bg-[#DC2626]/10 text-[#DC2626]">
 {item.badge}
 </span>
 )}
 </button>

 {/* If in 'detail' and on 'queue', show nested sub-pages */}
 {item.id === 'queue' && currentTab === 'detail' && (
 <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-[#E5E5E3] ml-5 my-1">
 <div className="px-2 py-1 text-[10px] text-[#6B6B6B] flex items-center justify-between">
 <span>{selectedCaseId} PAGES</span>
 </div>
 {caseSubPages.map((sub) => {
 const SubIcon = sub.icon;
 const isSubActive = activeCaseSubPage === sub.id;

 return (
 <button
 key={sub.id}
 onClick={() => {
 if (onSelectCaseSubPage) {
 onSelectCaseSubPage(sub.id);
 }
 onCloseMobile();
 }}
 className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors text-left ${
 isSubActive
 ? 'bg-[#1A1A1A] text-white font-medium'
 : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F7F5]'
 }`}
 >
 <SubIcon className="w-3 h-3 shrink-0" />
 <span className="truncate">{sub.label}</span>
 </button>
 );
 })}
 </div>
 )}
 </div>
 );
 })}
 </nav>
 </div>

 {/* Bottom Sidebar Footer */}
 <div className="p-3 border-t border-[#E5E5E3] shrink-0 text-center">
 <div className="text-[11px] font-medium text-[#1A1A1A]">PT Bussan Auto Finance</div>
 <div className="text-[10px] text-[#6B6B6B] mt-0.5">VeriFin Underwriting Platform</div>
 </div>
 </aside>
 </>
 );
};
