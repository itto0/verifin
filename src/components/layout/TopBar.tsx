import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Menu,
  ChevronDown,
  User,
  Shield,
  Building,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Layers
} from 'lucide-react';
import { FinancingCase } from '../../types';

interface TopBarProps {
  pageTitle: string;
  onOpenMobileMenu: () => void;
  cases: FinancingCase[];
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  pageTitle,
  onOpenMobileMenu,
  cases,
  selectedCaseId,
  onSelectCase,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const highRiskCount = cases.filter((c) => c.riskScore.level === 'high').length;

  return (
    <header className="h-16 bg-white border-b border-[#E5E5E3] px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left Zone: Mobile Menu Toggle & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg border border-[#E5E5E3] text-[#1A1A1A] hover:bg-[#F7F7F5] lg:hidden shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right Zone: Strictly Bell Icon & Dropdown Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Bell Icon Notification Trigger & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsProfileOpen(false);
            }}
            className="relative p-2 rounded-lg border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F7F5] transition-colors"
            aria-label="System notifications"
            title="System alerts"
          >
            <Bell className="w-4 h-4" />
            {highRiskCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626]" />
            )}
          </button>

          {/* Notifications Dropdown Modal */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E5E3] rounded-xl p-3 z-50 text-xs">
              <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-2 mb-2 font-medium">
                <span className="text-[#1A1A1A] font-semibold">Notifications</span>
                <span className="text-[11px] text-[#DC2626] font-mono">{highRiskCount} alerts</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div
                  onClick={() => {
                    onSelectCase('CASE-0941');
                    setIsNotifOpen(false);
                  }}
                  className="p-2 rounded-lg bg-[#DC2626]/5 border border-[#DC2626]/20 cursor-pointer hover:bg-[#DC2626]/10 transition-colors"
                >
                  <div className="flex items-center justify-between text-[#DC2626] font-semibold">
                    <span>CASE-0941 (Rian Hendrawan)</span>
                    <span className="text-[10px] font-mono">14:18 WIB</span>
                  </div>
                  <p className="text-[11px] text-[#1A1A1A] mt-1">
                    Mock GPS detected (1,420m radius) &amp; e-KTP font mismatch.
                  </p>
                </div>
                <div
                  onClick={() => {
                    onSelectCase('CASE-0946');
                    setIsNotifOpen(false);
                  }}
                  className="p-2 rounded-lg bg-[#DC2626]/5 border border-[#DC2626]/20 cursor-pointer hover:bg-[#DC2626]/10 transition-colors"
                >
                  <div className="flex items-center justify-between text-[#DC2626] font-semibold">
                    <span>CASE-0946 (Hendra Irawan)</span>
                    <span className="text-[10px] font-mono">09:40 WIB</span>
                  </div>
                  <p className="text-[11px] text-[#1A1A1A] mt-1">
                    Duplicate NIK alert with different applicant photo.
                  </p>
                </div>
                <div
                  onClick={() => {
                    onSelectCase('CASE-0943');
                    setIsNotifOpen(false);
                  }}
                  className="p-2 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-between text-[#D97706] font-semibold">
                    <span>CASE-0943 (Bagus Prasetyo)</span>
                    <span className="text-[10px] font-mono">12:12 WIB</span>
                  </div>
                  <p className="text-[11px] text-[#1A1A1A] mt-1">
                    Yellow zone survey radius (430m) requires review.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dropdown Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-2.5 p-1.5 pl-2 rounded-lg border border-[#E5E5E3] hover:bg-[#F7F7F5] transition-colors text-left"
            aria-label="User account menu"
          >
            <div className="w-7 h-7 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs font-semibold">
              DP
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-xs font-semibold text-[#1A1A1A]">Dian Pratama</div>
              <div className="text-[11px] text-[#6B6B6B]">Senior verifier</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B6B6B] ml-0.5" />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E5E5E3] rounded-xl p-3 z-50 text-xs">
              {/* Profile Card Header */}
              <div className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] mb-3">
                <div className="font-semibold text-sm text-[#1A1A1A]">Dian Pratama</div>
                <div className="text-[11px] text-[#6B6B6B] mt-0.5">dian.pratama@baf.id</div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E5E5E3] text-[11px] text-[#6B6B6B]">
                  <span className="flex items-center gap-1 font-medium text-[#2563EB]">
                    <Shield className="w-3 h-3" />
                    <span>Level 2 verifier</span>
                  </span>
                  <span>·</span>
                  <span>Jakarta South</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
