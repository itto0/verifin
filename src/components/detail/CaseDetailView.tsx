import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Headphones,
  SlidersHorizontal,
  Bike,
  Building,
  User,
  CreditCard
} from 'lucide-react';
import { FinancingCase, CaseStatus } from '../../types';
import { EktpDocumentTab } from './EktpDocumentTab';
import { GeoSurveyTab } from './GeoSurveyTab';
import { VoiceVerificationTab } from './VoiceVerificationTab';
import { RiskEngineDecisionTab } from './RiskEngineDecisionTab';

interface CaseDetailViewProps {
  caseData: FinancingCase;
  onBackToQueue: () => void;
  onUpdateStatus: (caseId: string, newStatus: CaseStatus, note: string) => void;
}

export type DetailTabType = 'ektp' | 'geo' | 'voice' | 'decision';

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({
  caseData,
  onBackToQueue,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTabType>('ektp');

  const { riskScore } = caseData;
  const isHigh = riskScore.level === 'high';
  const isMedium = riskScore.level === 'medium';

  return (
    <div className="space-y-6">
      {/* Top Navigation & Case Summary Card */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToQueue}
              className="p-1.5 rounded-lg border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F7F5] transition-colors"
              title="Back to queue"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-[#1A1A1A]">
                  {caseData.customerName}
                </h2>
                <span className="text-xs text-[#6B6B6B]">·</span>
                <span className="font-mono text-xs text-[#6B6B6B]">
                  {caseData.applicationNumber}
                </span>
              </div>
              <div className="text-xs text-[#6B6B6B] mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{caseData.branch}</span>
                <span>·</span>
                <span>Submitted: {caseData.submittedAt} WIB</span>
              </div>
            </div>
          </div>

          {/* Status & Risk Indicators */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="text-right">
              <div className="text-xs text-[#6B6B6B]">Multi-Pillar Risk Score</div>
              <div className="flex items-center gap-1.5 justify-end mt-0.5">
                <span
                  className={`font-mono text-lg font-bold tabular-nums ${
                    isHigh
                      ? 'text-[#DC2626]'
                      : isMedium
                      ? 'text-[#D97706]'
                      : 'text-[#16A34A]'
                  }`}
                >
                  {riskScore.totalScore}/100
                </span>
                <span
                  className={`text-xs font-semibold ${
                    isHigh
                      ? 'text-[#DC2626]'
                      : isMedium
                      ? 'text-[#D97706]'
                      : 'text-[#16A34A]'
                  }`}
                >
                  {isHigh ? 'High Risk' : isMedium ? 'Medium' : 'Low Risk'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Key Details Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
            <div className="text-[#6B6B6B] font-medium flex items-center gap-1.5">
              <Bike className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Vehicle Unit</span>
            </div>
            <div className="font-semibold text-[#1A1A1A] mt-1 truncate">
              {caseData.vehicleModel}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
            <div className="text-[#6B6B6B] font-medium flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Financing Principal</span>
            </div>
            <div className="font-semibold text-[#1A1A1A] mt-1 tabular-nums font-mono">
              IDR {caseData.loanAmount.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
            <div className="text-[#6B6B6B] font-medium flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Down Payment &amp; Tenor</span>
            </div>
            <div className="font-semibold text-[#1A1A1A] mt-1 tabular-nums">
              DP IDR {(caseData.downPayment / 1000000).toFixed(1)}M · {caseData.tenorMonths} mos
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3]">
            <div className="text-[#6B6B6B] font-medium flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Monthly Installment</span>
            </div>
            <div className="font-semibold text-[#2563EB] mt-1 tabular-nums font-mono">
              IDR {caseData.monthlyInstallment.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* 4 Pillar Segmented Tabs Bar */}
        <div className="flex items-center gap-1 pt-2 border-t border-[#E5E5E3] overflow-x-auto">
          <button
            onClick={() => setActiveTab('ektp')}
            className={`px-3 py-2 text-xs rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'ektp'
                ? 'bg-[#1A1A1A] text-white'
                : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F7F5]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>1. e-KTP &amp; Documents</span>
            <span className="font-mono text-[10px] opacity-75">
              ({caseData.document.score})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('geo')}
            className={`px-3 py-2 text-xs rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'geo'
                ? 'bg-[#1A1A1A] text-white'
                : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F7F5]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>2. Geotag &amp; Survey</span>
            <span className="font-mono text-[10px] opacity-75">
              ({caseData.geo.score})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`px-3 py-2 text-xs rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'voice'
                ? 'bg-[#1A1A1A] text-white'
                : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F7F5]'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>3. Tele-Verification</span>
            <span className="font-mono text-[10px] opacity-75">
              ({caseData.voice.score})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('decision')}
            className={`px-3 py-2 text-xs rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'decision'
                ? 'bg-[#2563EB] text-white font-semibold'
                : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F7F5]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>4. Risk Engine &amp; Decision</span>
            <span className="font-mono text-[10px] opacity-80">
              ({riskScore.totalScore})
            </span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'ektp' && (
        <EktpDocumentTab
          document={caseData.document}
          customerName={caseData.customerName}
        />
      )}

      {activeTab === 'geo' && (
        <GeoSurveyTab geo={caseData.geo} customerName={caseData.customerName} />
      )}

      {activeTab === 'voice' && (
        <VoiceVerificationTab
          voice={caseData.voice}
          customerName={caseData.customerName}
        />
      )}

      {activeTab === 'decision' && (
        <RiskEngineDecisionTab
          caseData={caseData}
          onUpdateStatus={onUpdateStatus}
        />
      )}
    </div>
  );
};
