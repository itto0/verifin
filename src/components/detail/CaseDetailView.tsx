import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Headphones,
  SlidersHorizontal,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Copy,
  Check,
  Send,
  ScanLine
} from 'lucide-react';
import { FinancingCase, CaseStatus, CaseSubPage } from '../../types';
import { CaseOverviewPage } from './subpages/CaseOverviewPage';
import { CaseEktpPage } from './subpages/CaseEktpPage';
import { CaseGeoPage } from './subpages/CaseGeoPage';
import { CaseVoicePage } from './subpages/CaseVoicePage';
import { CaseIcrPage } from './subpages/CaseIcrPage';
import { QuickDecisionModal } from './subpages/QuickDecisionModal';

interface CaseDetailViewProps {
  caseData: FinancingCase;
  allCases?: FinancingCase[];
  onSelectCase?: (caseId: string) => void;
  onBackToQueue: () => void;
  onUpdateStatus: (caseId: string, newStatus: CaseStatus, note: string) => void;
  activeSubPage?: CaseSubPage;
  onSubPageChange?: (subPage: CaseSubPage) => void;
}

interface PageDef {
  id: CaseSubPage;
  pageNumber: number;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}

const PAGES: PageDef[] = [
  { id: 'overview', pageNumber: 1, label: 'Overview & Underwriting Decision', shortLabel: 'Overview & Decision', icon: Sparkles },
  { id: 'ektp', pageNumber: 2, label: 'e-KTP & Biometric Verification', shortLabel: 'e-KTP & Biometrics', icon: ShieldCheck },
  { id: 'geo', pageNumber: 3, label: 'Geospatial & Field Survey Forensics', shortLabel: 'Geotag & Survey', icon: MapPin },
  { id: 'voice', pageNumber: 4, label: 'Tele-Verification Audio QA & Compliance', shortLabel: 'Audio QA & Call', icon: Headphones },
  { id: 'icr', pageNumber: 5, label: 'ICR Form Reader & Collateral Verification', shortLabel: 'ICR & Collateral', icon: ScanLine },
];

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({
  caseData,
  allCases = [],
  onSelectCase,
  onBackToQueue,
  onUpdateStatus,
  activeSubPage: controlledSubPage,
  onSubPageChange,
}) => {
  const [internalSubPage, setInternalSubPage] = useState<CaseSubPage>('overview');
  const activeSubPage = controlledSubPage !== undefined ? controlledSubPage : internalSubPage;

  const setSubPage = (subPage: CaseSubPage) => {
    if (onSubPageChange) {
      onSubPageChange(subPage);
    } else {
      setInternalSubPage(subPage);
    }
  };

  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [copiedNik, setCopiedNik] = useState(false);
  const [isCaseSelectorOpen, setIsCaseSelectorOpen] = useState(false);

  const { riskScore } = caseData;
  const isHigh = riskScore.level === 'high';
  const isMedium = riskScore.level === 'medium';

  const currentIndex = PAGES.findIndex((p) => p.id === activeSubPage);
  const currentPage = PAGES[currentIndex] || PAGES[0];
  const prevPage = currentIndex > 0 ? PAGES[currentIndex - 1] : null;
  const nextPage = currentIndex < PAGES.length - 1 ? PAGES[currentIndex + 1] : null;

  const handleCopyNik = () => {
    navigator.clipboard.writeText(caseData.customerNik);
    setCopiedNik(true);
    setTimeout(() => setCopiedNik(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Top Header: Breadcrumbs, Case Quick Switcher & Case Meta */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToQueue}
            className="p-2 rounded-lg border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F7F5] transition-colors"
            title="Back to Review Queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            {/* Breadcrumb line */}
            <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] mb-1">
              <button
                onClick={onBackToQueue}
                className="hover:text-[#1A1A1A] transition-colors underline-offset-2 hover:underline"
              >
                Review Queue
              </button>
              <ChevronRight className="w-3 h-3 text-[#6B6B6B]" />
              <span className="font-mono text-[#1A1A1A] font-medium">{caseData.id}</span>
              <ChevronRight className="w-3 h-3 text-[#6B6B6B]" />
              <span className="text-[#2563EB] font-medium">Page {currentPage.pageNumber}: {currentPage.shortLabel}</span>
            </div>

            {/* Title & Quick Switcher */}
            <div className="flex items-center gap-2 flex-wrap relative">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">
                {caseData.customerName}
              </h2>

              <span className="font-mono text-xs bg-[#F7F7F5] border border-[#E5E5E3] px-2 py-0.5 rounded text-[#1A1A1A] font-medium">
                {caseData.applicationNumber}
              </span>

              <button
                onClick={handleCopyNik}
                className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] flex items-center gap-1 font-mono bg-[#F7F7F5] px-2 py-0.5 rounded border border-[#E5E5E3]"
                title="Copy NIK"
              >
                <span>NIK: {caseData.customerNik}</span>
                {copiedNik ? <Check className="w-3 h-3 text-[#16A34A]" /> : <Copy className="w-3 h-3" />}
              </button>

              {/* Case Dropdown Switcher */}
              {allCases.length > 1 && onSelectCase && (
                <div className="relative">
                  <button
                    onClick={() => setIsCaseSelectorOpen(!isCaseSelectorOpen)}
                    className="text-xs font-semibold text-[#2563EB] bg-[#2563EB]/10 hover:bg-[#2563EB]/15 px-2.5 py-1 rounded-lg border border-[#2563EB]/20 flex items-center gap-1 transition-colors"
                  >
                    <span>Switch Case</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {isCaseSelectorOpen && (
                    <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-[#E5E5E3] rounded-xl shadow-lg z-30 p-2 space-y-1">
                      <div className="text-[10px] uppercase font-semibold text-[#6B6B6B] px-2 py-1">
                        Select Verification Case
                      </div>
                      {allCases.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            onSelectCase(c.id);
                            setIsCaseSelectorOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                            c.id === caseData.id
                              ? 'bg-[#2563EB]/10 text-[#2563EB] font-semibold'
                              : 'text-[#1A1A1A] hover:bg-[#F7F7F5]'
                          }`}
                        >
                          <div>
                            <div className="font-medium">{c.customerName}</div>
                            <div className="text-[10px] text-[#6B6B6B] font-mono">{c.id} · {c.branch}</div>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                              c.riskScore.level === 'high'
                                ? 'bg-[#DC2626]/10 text-[#DC2626]'
                                : c.riskScore.level === 'medium'
                                ? 'bg-[#D97706]/10 text-[#D97706]'
                                : 'bg-[#16A34A]/10 text-[#16A34A]'
                            }`}
                          >
                            {c.riskScore.totalScore}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Financial Metrics & Status Badge */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] text-xs">
            <span className="text-[#6B6B6B]">Unit: </span>
            <span className="font-semibold text-[#1A1A1A]">{caseData.vehicleModel}</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] text-xs">
            <span className="text-[#6B6B6B]">Loan: </span>
            <span className="font-semibold text-[#1A1A1A] font-mono">
              Rp {(caseData.loanAmount / 1000000).toFixed(1)} M
            </span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold font-mono flex items-center gap-1.5 ${
              isHigh
                ? 'bg-[#DC2626]/10 border-[#DC2626]/30 text-[#DC2626]'
                : isMedium
                ? 'bg-[#D97706]/10 border-[#D97706]/30 text-[#D97706]'
                : 'bg-[#16A34A]/10 border-[#16A34A]/30 text-[#16A34A]'
            }`}
          >
            <span>Score: {riskScore.totalScore}/100</span>
            <span>·</span>
            <span>{isHigh ? 'High Risk' : isMedium ? 'Medium' : 'Low Risk'}</span>
          </div>

          <button
            onClick={() => setIsDecisionModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3 h-3" />
            <span>Make Decision</span>
          </button>
        </div>
      </div>

      {/* Dedicated Multi-Page Stepper Navigation Bar */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-2 flex items-center gap-1 overflow-x-auto text-xs">
        {PAGES.map((page) => {
          const Icon = page.icon;
          const isActive = activeSubPage === page.id;

          // Status indicator per pillar
          let statusBadge: React.ReactNode = null;
          if (page.id === 'overview') {
            statusBadge = (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                isHigh ? 'bg-[#DC2626]/10 text-[#DC2626]' : isMedium ? 'bg-[#D97706]/10 text-[#D97706]' : 'bg-[#16A34A]/10 text-[#16A34A]'
              }`}>
                {riskScore.totalScore}
              </span>
            );
          } else if (page.id === 'ektp') {
            statusBadge = (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                caseData.document.score >= 70 ? 'bg-[#DC2626]/10 text-[#DC2626]' : 'bg-[#16A34A]/10 text-[#16A34A]'
              }`}>
                {caseData.document.faceMatchScore}%
              </span>
            );
          } else if (page.id === 'geo') {
            statusBadge = (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                caseData.geo.distanceStatus === 'red' ? 'bg-[#DC2626]/10 text-[#DC2626]' : 'bg-[#16A34A]/10 text-[#16A34A]'
              }`}>
                {caseData.geo.distanceMeters}m
              </span>
            );
          } else if (page.id === 'voice') {
            statusBadge = (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                caseData.voice.score >= 60 ? 'bg-[#D97706]/10 text-[#D97706]' : 'bg-[#16A34A]/10 text-[#16A34A]'
              }`}>
                {caseData.voice.audioDurationFormatted}
              </span>
            );
          } else if (page.id === 'icr') {
            statusBadge = (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#16A34A]/10 text-[#16A34A]">
                ICR
              </span>
            );
          }

          return (
            <button
              key={page.id}
              onClick={() => setSubPage(page.id)}
              className={`px-3.5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#E5E5E3]/70'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold font-mono ${
                isActive ? 'bg-white text-[#1A1A1A]' : 'bg-[#E5E5E3] text-[#1A1A1A]'
              }`}>
                {page.pageNumber}
              </span>
              <Icon className="w-3.5 h-3.5" />
              <span>{page.shortLabel}</span>
              {statusBadge}
            </button>
          );
        })}
      </div>

      {/* DEDICATED SUB-PAGE CANVAS */}
      <div className="min-h-[500px]">
        {activeSubPage === 'overview' && (
          <CaseOverviewPage
            caseData={caseData}
            onNavigateSubPage={setSubPage}
            onUpdateStatus={onUpdateStatus}
          />
        )}

        {activeSubPage === 'ektp' && <CaseEktpPage caseData={caseData} />}

        {activeSubPage === 'geo' && <CaseGeoPage caseData={caseData} />}

        {activeSubPage === 'voice' && <CaseVoicePage caseData={caseData} />}

        {activeSubPage === 'icr' && <CaseIcrPage caseData={caseData} />}
      </div>

      {/* Persistent Bottom Stepper & Decision Bar */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-20 shadow-xs">
        {/* Previous Button */}
        <div>
          {prevPage ? (
            <button
              onClick={() => setSubPage(prevPage.id)}
              className="px-4 py-2 rounded-lg border border-[#E5E5E3] text-xs font-semibold text-[#1A1A1A] hover:bg-[#F7F7F5] transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous: Page {prevPage.pageNumber} ({prevPage.shortLabel})</span>
            </button>
          ) : (
            <button
              onClick={onBackToQueue}
              className="px-4 py-2 rounded-lg border border-[#E5E5E3] text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F7F5] transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Review Queue</span>
            </button>
          )}
        </div>

        {/* Center: Underwriting Status Pill & Quick Decision Trigger */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-[#6B6B6B] hidden md:block">
            Current Status:{' '}
            <strong
              className={`font-semibold capitalize ${
                caseData.status === 'approved'
                  ? 'text-[#16A34A]'
                  : caseData.status === 'rejected_fraud'
                  ? 'text-[#DC2626]'
                  : caseData.status === 'resurvey'
                  ? 'text-[#D97706]'
                  : 'text-[#2563EB]'
              }`}
            >
              {caseData.status === 'approved'
                ? 'Approved'
                : caseData.status === 'resurvey'
                ? 'Re-Survey Requested'
                : caseData.status === 'rejected_fraud'
                ? 'Rejected Fraud'
                : 'Pending Review'}
            </strong>
          </div>

          <button
            onClick={() => setIsDecisionModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Underwriter Decision</span>
          </button>
        </div>

        {/* Next Button */}
        <div>
          {nextPage ? (
            <button
              onClick={() => setSubPage(nextPage.id)}
              className="px-4 py-2 rounded-lg bg-[#1A1A1A] hover:bg-[#333333] text-white text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <span>Next: Page {nextPage.pageNumber} ({nextPage.shortLabel})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setSubPage('overview')}
              className="px-4 py-2 rounded-lg border border-[#E5E5E3] text-xs font-semibold text-[#1A1A1A] hover:bg-[#F7F7F5] transition-colors flex items-center gap-2"
            >
              <span>Return to Overview</span>
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Underwriting Decision Modal */}
      <QuickDecisionModal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        caseData={caseData}
        onUpdateStatus={onUpdateStatus}
      />
    </div>
  );
};
