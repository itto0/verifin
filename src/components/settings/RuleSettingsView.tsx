import React, { useState } from 'react';
import {
  Sliders,
  Scale,
  MapPin,
  Clock,
  ShieldCheck,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { RiskEngineRules } from '../../types';
import { initialRules } from '../../data/mockData';

export const RuleSettingsView: React.FC = () => {
  const [rules, setRules] = useState<RiskEngineRules>(initialRules);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simulator state
  const [simEktp, setSimEktp] = useState<number>(75);
  const [simLocation, setSimLocation] = useState<number>(85);
  const [simVoice, setSimVoice] = useState<number>(60);
  const [simDoc, setSimDoc] = useState<number>(70);

  const totalWeight =
    rules.weightEktp + rules.weightLocation + rules.weightVoice + rules.weightDocument;
  const isWeightValid = totalWeight === 100;

  // Calculate simulated score
  const simCompositeScore = Math.round(
    (simEktp * rules.weightEktp) / 100 +
    (simLocation * rules.weightLocation) / 100 +
    (simVoice * rules.weightVoice) / 100 +
    (simDoc * rules.weightDocument) / 100
  );

  const simLevel =
    simCompositeScore >= rules.autoRejectMinScore
      ? 'high'
      : simCompositeScore > rules.autoApproveMaxScore
      ? 'medium'
      : 'low';

  const handleSave = () => {
    if (!isWeightValid) {
      alert('Total 4-pillar weight sum must equal exactly 100%.');
      return;
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    setRules(initialRules);
  };

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-xl font-semibold text-[#1A1A1A]">
            Risk Engine Rules &amp; Parameters Configuration
          </h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Fine-tune multi-pillar weightings, survey GPS radius tolerance zones, and BAF risk thresholds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-2 border border-[#E5E5E3] text-[#1A1A1A] hover:bg-[#F7F7F5] rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-[#16A34A]/10 border border-[#16A34A]/30 text-[#16A34A] rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Risk Engine parameters updated successfully and applied to incoming applications.</span>
        </div>
      )}

      {/* Grid: 2 Columns for Rules & Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Configuration Forms */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Bobot 4 Pilar */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
              <div>
                <h4 className="text-sm font-semibold text-[#1A1A1A]">
                  1. Multi-Sector Risk Pillar Weights
                </h4>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  The aggregate sum of all 4 pillars must equal 100%.
                </p>
              </div>
              <span
                className={`text-xs font-mono font-bold ${
                  isWeightValid ? 'text-[#16A34A]' : 'text-[#DC2626]'
                }`}
              >
                Total: {totalWeight}% {isWeightValid ? '✓' : '(Must be 100%)'}
              </span>
            </div>

            <div className="space-y-4">
              {/* Weight e-KTP */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#1A1A1A]">e-KTP &amp; Identity Weight</span>
                  <span className="font-mono font-semibold text-[#2563EB]">{rules.weightEktp}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={rules.weightEktp}
                  onChange={(e) => setRules({ ...rules, weightEktp: Number(e.target.value) })}
                  className="w-full accent-[#2563EB] cursor-pointer"
                />
                <span className="text-[11px] text-[#6B6B6B]">Covers Dukcapil NIK structure, OCR-B font matching, and biometric face match</span>
              </div>

              {/* Weight Lokasi */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#1A1A1A]">Geotag &amp; Field Survey Weight</span>
                  <span className="font-mono font-semibold text-[#2563EB]">{rules.weightLocation}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={rules.weightLocation}
                  onChange={(e) => setRules({ ...rules, weightLocation: Number(e.target.value) })}
                  className="w-full accent-[#2563EB] cursor-pointer"
                />
                <span className="text-[11px] text-[#6B6B6B]">Covers geodesic distance to residence and mock location provider checks</span>
              </div>

              {/* Weight Voice */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#1A1A1A]">Tele-Verification Voice Weight</span>
                  <span className="font-mono font-semibold text-[#2563EB]">{rules.weightVoice}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={40}
                  step={5}
                  value={rules.weightVoice}
                  onChange={(e) => setRules({ ...rules, weightVoice: Number(e.target.value) })}
                  className="w-full accent-[#2563EB] cursor-pointer"
                />
                <span className="text-[11px] text-[#6B6B6B]">Covers ASR diarization, customer hesitation pauses (&gt;2s), and SOP script adherence</span>
              </div>

              {/* Weight Document */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-[#1A1A1A]">Supporting Documents Weight</span>
                  <span className="font-mono font-semibold text-[#2563EB]">{rules.weightDocument}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={5}
                  value={rules.weightDocument}
                  onChange={(e) => setRules({ ...rules, weightDocument: Number(e.target.value) })}
                  className="w-full accent-[#2563EB] cursor-pointer"
                />
                <span className="text-[11px] text-[#6B6B6B]">Covers Family Card consistency, salary slip authentication, and stamp integrity</span>
              </div>
            </div>
          </div>

          {/* Section 2: Ambang Batas Toleransi & Radius */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
            <div className="border-b border-[#E5E5E3] pb-3">
              <h4 className="text-sm font-semibold text-[#1A1A1A]">
                2. Geodesic Radius &amp; Quality Thresholds
              </h4>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Survey distance boundaries and automated warning thresholds.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-[#1A1A1A] mb-1">
                  Green Zone Ceiling (Compliant Radius):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={rules.greenRadiusMeters}
                    onChange={(e) => setRules({ ...rules, greenRadiusMeters: Number(e.target.value) })}
                    className="w-full bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg px-3 py-1.5 text-xs text-[#1A1A1A] font-mono"
                  />
                  <span className="text-[#6B6B6B]">meters</span>
                </div>
                <span className="text-[11px] text-[#6B6B6B] mt-1 block">Default: 200 meters</span>
              </div>

              <div>
                <label className="block font-medium text-[#1A1A1A] mb-1">
                  Yellow Warning Zone Ceiling:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={rules.yellowRadiusMeters}
                    onChange={(e) => setRules({ ...rules, yellowRadiusMeters: Number(e.target.value) })}
                    className="w-full bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg px-3 py-1.5 text-xs text-[#1A1A1A] font-mono"
                  />
                  <span className="text-[#6B6B6B]">meters</span>
                </div>
                <span className="text-[11px] text-[#6B6B6B] mt-1 block">Beyond this triggers Red Zone (&gt;1,000m)</span>
              </div>

              <div>
                <label className="block font-medium text-[#1A1A1A] mb-1">
                  Minimum OCR Confidence Floor:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={rules.ocrConfidenceThreshold}
                    onChange={(e) => setRules({ ...rules, ocrConfidenceThreshold: Number(e.target.value) })}
                    className="w-full bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg px-3 py-1.5 text-xs text-[#1A1A1A] font-mono"
                  />
                  <span className="text-[#6B6B6B]">%</span>
                </div>
                <span className="text-[11px] text-[#6B6B6B] mt-1 block">Below 90% is highlighted in amber</span>
              </div>

              <div>
                <label className="block font-medium text-[#1A1A1A] mb-1">
                  Speech Hesitancy Pause Threshold:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step={0.1}
                    value={rules.hesitancyThresholdSeconds}
                    onChange={(e) => setRules({ ...rules, hesitancyThresholdSeconds: Number(e.target.value) })}
                    className="w-full bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg px-3 py-1.5 text-xs text-[#1A1A1A] font-mono"
                  />
                  <span className="text-[#6B6B6B]">seconds</span>
                </div>
                <span className="text-[11px] text-[#6B6B6B] mt-1 block">Pauses &gt;2.0s flag customer hesitancy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Real-Time Interactive Simulator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#F7F7F5] border border-[#E5E5E3] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
              <div>
                <h4 className="text-sm font-semibold text-[#1A1A1A]">
                  Rule Simulation Sandbox
                </h4>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Test custom weight configurations on synthetic case scores.
                </p>
              </div>
              <Sliders className="w-4 h-4 text-[#2563EB]" />
            </div>

            {/* Slider inputs for 4 pillars */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Simulated e-KTP Score:</span>
                  <span className="font-mono font-semibold">{simEktp}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={simEktp}
                  onChange={(e) => setSimEktp(Number(e.target.value))}
                  className="w-full accent-[#2563EB]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Simulated Location Score:</span>
                  <span className="font-mono font-semibold">{simLocation}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={simLocation}
                  onChange={(e) => setSimLocation(Number(e.target.value))}
                  className="w-full accent-[#2563EB]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Simulated Voice Score:</span>
                  <span className="font-mono font-semibold">{simVoice}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={simVoice}
                  onChange={(e) => setSimVoice(Number(e.target.value))}
                  className="w-full accent-[#2563EB]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Simulated Document Score:</span>
                  <span className="font-mono font-semibold">{simDoc}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={simDoc}
                  onChange={(e) => setSimDoc(Number(e.target.value))}
                  className="w-full accent-[#2563EB]"
                />
              </div>
            </div>

            {/* Calculated Composite Output Card */}
            <div className="bg-white border border-[#E5E5E3] rounded-lg p-4 text-center space-y-1">
              <div className="text-[11px] text-[#6B6B6B] uppercase font-semibold">
                Simulated Composite Score
              </div>
              <div
                className={`text-3xl font-bold font-mono tabular-nums ${
                  simLevel === 'high'
                    ? 'text-[#DC2626]'
                    : simLevel === 'medium'
                    ? 'text-[#D97706]'
                    : 'text-[#16A34A]'
                }`}
              >
                {simCompositeScore}
                <span className="text-sm font-normal text-[#6B6B6B]">/100</span>
              </div>
              <div
                className={`text-xs font-semibold ${
                  simLevel === 'high'
                    ? 'text-[#DC2626]'
                    : simLevel === 'medium'
                    ? 'text-[#D97706]'
                    : 'text-[#16A34A]'
                }`}
              >
                {simLevel === 'high'
                  ? 'Classification: High Risk (Flagged for Rejection / Fraud Audit)'
                  : simLevel === 'medium'
                  ? 'Classification: Medium Risk (Mandatory Human Review)'
                  : 'Classification: Low Risk (Auto-Approval Eligible)'}
              </div>
            </div>

            {/* Explanatory Note */}
            <div className="p-3 bg-white border border-[#E5E5E3] rounded-lg text-[11px] text-[#6B6B6B] leading-relaxed">
              These rules are calibrated for the BAF branch pilot before rollout into the core Loan Origination System (LOS).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
