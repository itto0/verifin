import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  MapPin,
  Headphones,
  Sliders
} from 'lucide-react';

export type NavTab = 'dashboard' | 'queue' | 'detail' | 'gis' | 'qa' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingCount,
  isOpenMobile,
  onCloseMobile,
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
      id: 'settings' as NavTab,
      label: 'Risk Rules & Weights',
      icon: Sliders,
      desc: 'Risk engine parameters'
    }
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
        <div>
          <div className="h-16 px-5 flex items-center justify-center border-b border-[#E5E5E3]">
            <div className="flex items-center content-center gap-3">
              {/* BAF Official SVG Logo from https://www.baf.id/static/images/logos/baf.svg */}
              <div className="h-8 flex items-center">
                {!logoError ? (
                  <img
                    src="https://www.baf.id/static/images/logos/baf.svg"
                    alt="BAF Logo"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoError(true)}
                    className="h-7 w-auto object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-xs tracking-wider">
                    BAF
                  </div>
                )}
              </div>
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
                <button
                  key={item.id}
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
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};
