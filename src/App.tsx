/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ReviewQueueView } from './components/queue/ReviewQueueView';
import { CaseDetailView } from './components/detail/CaseDetailView';
import { GisMapView } from './components/gis/GisMapView';
import { QaCallMonitoringView } from './components/qa/QaCallMonitoringView';
import { SurveyorFleetView } from './components/surveyor/SurveyorFleetView';
import { IcrDocumentView } from './components/icr/IcrDocumentView';
import { ReportsAuditView } from './components/reports/ReportsAuditView';
import { MasterDataView } from './components/master/MasterDataView';
import { RuleSettingsView } from './components/settings/RuleSettingsView';
import { mockCases } from './data/mockData';
import { FinancingCase, CaseStatus } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [cases, setCases] = useState<FinancingCase[]>(mockCases);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('CASE-0941');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Active selected case
  const currentCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  // Handler to navigate to a case's detail
  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentTab('detail');
  };

  // Handler to update status (approve, resurvey, reject)
  const handleUpdateCaseStatus = (caseId: string, newStatus: CaseStatus, note: string) => {
    const timestampStr = '2026-10-27 15:02:18';
    setCases((prev) =>
      prev.map((c) => {
        if (c.id === caseId) {
          const actionName =
            newStatus === 'approved'
              ? 'Verifier Approval'
              : newStatus === 'resurvey'
              ? 'Re-survey Requested'
              : 'Fraud Rejection & Blacklist';

          const newLog = {
            id: `A-LOG-${Date.now()}`,
            timestamp: timestampStr,
            actor: 'Dian Pratama (Senior Verifier)',
            action: actionName,
            notes: note || 'Manual verifier decision logged.',
          };

          return {
            ...c,
            status: newStatus,
            decisionNotes: note,
            decisionTimestamp: timestampStr,
            auditTrail: [...c.auditTrail, newLog],
          };
        }
        return c;
      })
    );
  };

  // Compute pending count
  const pendingCount = cases.filter((c) => c.status === 'pending').length;

  // Title per tab in English
  const tabTitles: Record<NavTab, string> = {
    dashboard: 'Financing Verification Dashboard',
    queue: 'Review Queue & Decisions',
    detail: `Verification Audit — ${currentCase.customerName} (${currentCase.id})`,
    gis: 'Geospatial Field Survey Map (GIS)',
    qa: 'Tele-Verification Audio QA & Compliance',
    surveyor: 'Field Surveyor Fleet Performance & SLA',
    icr: 'ICR Form Reader & Collateral Verification ("Sentuh Tanahku")',
    reports: 'Branch Compliance Reports & OJK Audit Trail',
    master: 'Master Data & Operational Configuration',
    settings: 'Risk Engine Rules & Parameters',
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A] flex flex-col font-sans">
      {/* 240px Fixed Left Sidebar with BAF official logo */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingCount={pendingCount}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area (offset by 240px on lg screens) */}
      <div className="lg:pl-60 flex-1 flex flex-col min-w-0">
        {/* Fixed 64px Top Bar with strictly Bell icon & Dropdown Profile */}
        <TopBar
          pageTitle={tabTitles[currentTab]}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          cases={cases}
          selectedCaseId={selectedCaseId}
          onSelectCase={handleSelectCase}
        />

        {/* Viewport Content Area with 24-32px padding */}
        <main className="p-6 md:p-8 flex-1 max-w-full">
          {currentTab === 'dashboard' && (
            <DashboardView
              cases={cases}
              onSelectCase={handleSelectCase}
              onNavigateToQueue={() => setCurrentTab('queue')}
              onNavigateToGis={() => setCurrentTab('gis')}
            />
          )}

          {currentTab === 'queue' && (
            <ReviewQueueView
              cases={cases}
              onSelectCase={handleSelectCase}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}

          {currentTab === 'detail' && (
            <CaseDetailView
              caseData={currentCase}
              onBackToQueue={() => setCurrentTab('queue')}
              onUpdateStatus={handleUpdateCaseStatus}
            />
          )}

          {currentTab === 'gis' && <GisMapView onSelectCase={handleSelectCase} />}

          {currentTab === 'qa' && (
            <QaCallMonitoringView cases={cases} onSelectCase={handleSelectCase} />
          )}

          {currentTab === 'surveyor' && (
            <SurveyorFleetView
              onSelectCase={handleSelectCase}
              onOpenGisMap={() => setCurrentTab('gis')}
            />
          )}

          {currentTab === 'icr' && <IcrDocumentView onSelectCase={handleSelectCase} />}

          {currentTab === 'reports' && <ReportsAuditView onSelectCase={handleSelectCase} />}

          {currentTab === 'master' && <MasterDataView />}

          {currentTab === 'settings' && <RuleSettingsView />}
        </main>
      </div>
    </div>
  );
}
