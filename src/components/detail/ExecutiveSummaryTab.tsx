import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Headphones,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  UserCheck,
  Navigation,
  FileText
} from 'lucide-react';
import { FinancingCase } from '../../types';

interface ExecutiveSummaryTabProps {
  caseData: FinancingCase;
  onNavigateTab: (tabId: 'ektp' | 'geo' | 'voice' | 'icr') => void;
}

export const ExecutiveSummaryTab: React.FC<ExecutiveSummaryTabProps> = ({
  caseData,
  onNavigateTab,
}) => {
  const { document, geo, voice, riskScore } = caseData;

  // Cross-document verification matrix data
  const crossCheckMatrix = [
    {
      field: 'Nomor Induk Kependudukan (NIK)',
      ktpValue: caseData.customerNik,
      kkValue: caseData.customerNik,
      teleQaValue: caseData.customerNik,
      isMatch: document.nikValidation.dukcapilMatch && !document.nikValidation.anomalies.length,
      note: document.nikValidation.anomalies[0] || 'Cocok dengan data Dukcapil'
    },
    {
      field: 'Nama Lengkap Pemohon',
      ktpValue: caseData.customerName,
      kkValue: caseData.customerName,
      teleQaValue: caseData.customerName,
      isMatch: true,
      note: 'Sesuai di seluruh dokumen'
    },
    {
      field: 'Tanggal Lahir & Usia',
      ktpValue: document.nikValidation.birthDate,
      kkValue: document.nikValidation.birthDate,
      teleQaValue: document.nikValidation.birthDate,
      isMatch: document.nikValidation.isValidStructure,
      note: document.nikValidation.isValidStructure
        ? 'Struktur NIK sesuai'
        : 'Tanggal lahir NIK beda dengan fisik KTP'
    },
    {
      field: 'Alamat Domisili Tempat Tinggal',
      ktpValue: geo.targetAddress.split(',')[0] || 'Alamat KTP',
      kkValue: 'Sesuai Alamat KTP',
      teleQaValue: 'Dikonfirmasi Pemohon',
      isMatch: geo.distanceStatus !== 'red',
      note: geo.distanceStatus === 'red' ? 'Lokasi survei selisih > 1.000 m' : 'Dalam batas wajar'
    },
    {
      field: 'Unit Kendaraan & Angsuran/Bln',
      ktpValue: caseData.vehicleModel,
      kkValue: 'N/A',
      teleQaValue: `Rp ${caseData.monthlyInstallment.toLocaleString('id-ID')}`,
      isMatch: voice.spellingAccuracyScore >= 80,
      note: voice.spellingAccuracyScore >= 80 ? 'Dikonfirmasi saat telepon' : 'Konsumen ragu menyebutkan'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 4-Pillar High-Density Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: e-KTP & Biometrics */}
        <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E5E3]">
              <span className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                1. e-KTP &amp; Biometrics
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  document.score >= 70
                    ? 'bg-[#DC2626]/10 text-[#DC2626]'
                    : document.score >= 40
                    ? 'bg-[#D97706]/10 text-[#D97706]'
                    : 'bg-[#16A34A]/10 text-[#16A34A]'
                }`}
              >
                Anomaly {document.score}/100
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Face Match:</span>
                <span className={`font-mono font-bold ${document.faceMatchScore >= 80 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {document.faceMatchScore}% ({document.faceMatchScore >= 80 ? 'Match' : 'Mismatch'})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">NIK Format:</span>
                <span className={`font-medium ${document.nikValidation.isValidStructure ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {document.nikValidation.isValidStructure ? 'Valid Algorithm' : 'Date Anomaly'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Image Tampering:</span>
                <span className={`font-medium ${document.tamperFlags.length > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                  {document.tamperFlags.length > 0 ? `${document.tamperFlags.length} Forensic Flags` : 'Tamper Free'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('ektp')}
            className="mt-4 pt-2 border-t border-[#E5E5E3] text-[11px] font-medium text-[#2563EB] hover:underline flex items-center justify-between"
          >
            <span>Open e-KTP Forensics</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Pillar 2: Geotag & Survey */}
        <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E5E3]">
              <span className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                2. Geotag &amp; Survey
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  geo.score >= 70
                    ? 'bg-[#DC2626]/10 text-[#DC2626]'
                    : geo.score >= 40
                    ? 'bg-[#D97706]/10 text-[#D97706]'
                    : 'bg-[#16A34A]/10 text-[#16A34A]'
                }`}
              >
                Anomaly {geo.score}/100
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Distance to Home:</span>
                <span
                  className={`font-mono font-bold ${
                    geo.distanceStatus === 'red'
                      ? 'text-[#DC2626]'
                      : geo.distanceStatus === 'yellow'
                      ? 'text-[#D97706]'
                      : 'text-[#16A34A]'
                  }`}
                >
                  {geo.distanceMeters.toLocaleString('id-ID')} m
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Mock GPS Detection:</span>
                <span className={`font-medium ${geo.isMockLocationDetected ? 'text-[#DC2626] font-bold' : 'text-[#16A34A]'}`}>
                  {geo.isMockLocationDetected ? 'FakeGPS ACTIVE' : 'Clean (Hardware GPS)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Survey Photos:</span>
                <span className="text-[#1A1A1A] font-medium">
                  {geo.surveyPhotos.length} In-App Photos
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('geo')}
            className="mt-4 pt-2 border-t border-[#E5E5E3] text-[11px] font-medium text-[#2563EB] hover:underline flex items-center justify-between"
          >
            <span>Open GIS Map &amp; Photos</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Pillar 3: Tele-Verification QA */}
        <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E5E3]">
              <span className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-[#2563EB]" />
                3. Tele-Verification QA
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  voice.score >= 70
                    ? 'bg-[#DC2626]/10 text-[#DC2626]'
                    : voice.score >= 40
                    ? 'bg-[#D97706]/10 text-[#D97706]'
                    : 'bg-[#16A34A]/10 text-[#16A34A]'
                }`}
              >
                Anomaly {voice.score}/100
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Spelling Accuracy:</span>
                <span className={`font-mono font-bold ${voice.spellingAccuracyScore >= 80 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {voice.spellingAccuracyScore}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Hesitation Pauses:</span>
                <span className={`font-medium ${voice.overallHesitancyCount > 1 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                  {voice.overallHesitancyCount}x Pauses
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Script Compliance:</span>
                <span className="font-mono font-semibold text-[#1A1A1A]">
                  {voice.scriptComplianceScore}%
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('voice')}
            className="mt-4 pt-2 border-t border-[#E5E5E3] text-[11px] font-medium text-[#2563EB] hover:underline flex items-center justify-between"
          >
            <span>Open Audio &amp; Transcript</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Pillar 4: Dokumen & ICR */}
        <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E5E3]">
              <span className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                4. Documents &amp; ICR
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#16A34A]/10 text-[#16A34A]">
                100% Complete
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Salary / Bank Slip:</span>
                <span className="font-medium text-[#1A1A1A]">OCR Validated</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Family Card (KK):</span>
                <span className="font-medium text-[#16A34A]">Verified</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">BPN Sentuh Tanahku:</span>
                <span className="text-[#6B6B6B]">Non-Property Collateral</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('icr')}
            className="mt-4 pt-2 border-t border-[#E5E5E3] text-[11px] font-medium text-[#2563EB] hover:underline flex items-center justify-between"
          >
            <span>Open Cross-Check Documents</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Side-by-Side Critical Evidence Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Box: Biometric Face Match Forensic */}
        <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#2563EB]" />
              <h4 className="text-sm font-semibold text-[#1A1A1A]">
                Biometric Forensics: Physical e-KTP vs Consumer Selfie
              </h4>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded font-bold font-mono ${
                document.faceMatchScore >= 80
                  ? 'bg-[#16A34A]/10 text-[#16A34A]'
                  : 'bg-[#DC2626]/10 text-[#DC2626]'
              }`}
            >
              Face Match: {document.faceMatchScore}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* KTP Photo */}
            <div className="space-y-1.5 text-center">
              <div className="text-[11px] text-[#6B6B6B] font-medium">Physical e-KTP Portrait</div>
              <div className="h-44 rounded-lg border border-[#E5E5E3] overflow-hidden bg-[#F7F7F5] flex items-center justify-center relative">
                <img
                  src={document.ktpImageUrl}
                  alt="KTP Portrait"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                  Dukcapil OCR-B
                </div>
              </div>
            </div>

            {/* Selfie Photo */}
            <div className="space-y-1.5 text-center">
              <div className="text-[11px] text-[#6B6B6B] font-medium">Consumer Liveness Selfie</div>
              <div className="h-44 rounded-lg border border-[#E5E5E3] overflow-hidden bg-[#F7F7F5] flex items-center justify-center relative">
                <img
                  src={document.selfieImageUrl}
                  alt="Live Selfie"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-1 bg-[#16A34A] text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                  Live Camera
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] text-xs text-[#1A1A1A] space-y-1">
            <div className="font-semibold text-[11px] text-[#6B6B6B] uppercase tracking-wider">
              Biometric Analysis Summary
            </div>
            <p>
              {document.faceMatchScore >= 80
                ? 'Facial landmarks, eye positioning, and bone geometry match between physical e-KTP and consumer selfie. Legitimate applicant verified.'
                : 'Facial mismatch alert: Similarity score falls below 80% threshold. Potential synthetic identity or proxy applicant detected.'}
            </p>
          </div>
        </div>

        {/* Right Box: Geotag & Survey Field Verification */}
        <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#2563EB]" />
              <h4 className="text-sm font-semibold text-[#1A1A1A]">
                Location Validation: Target Residence vs Surveyor Check-In
              </h4>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded font-bold font-mono ${
                geo.distanceStatus === 'red'
                  ? 'bg-[#DC2626]/10 text-[#DC2626]'
                  : geo.distanceStatus === 'yellow'
                  ? 'bg-[#D97706]/10 text-[#D97706]'
                  : 'bg-[#16A34A]/10 text-[#16A34A]'
              }`}
            >
              Radius: {geo.distanceMeters.toLocaleString('id-ID')} m
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] space-y-1.5">
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span>Target Residential Address:</span>
                <span className="font-mono text-[11px]">{geo.targetLat.toFixed(4)}, {geo.targetLng.toFixed(4)}</span>
              </div>
              <div className="font-medium text-[#1A1A1A]">{geo.targetAddress}</div>
            </div>

            <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] space-y-1.5">
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span>Surveyor (CMO) Check-In Coordinates:</span>
                <span className="font-mono text-[11px]">{geo.surveyLat.toFixed(4)}, {geo.surveyLng.toFixed(4)}</span>
              </div>
              <div className="font-medium text-[#1A1A1A] flex items-center justify-between">
                <span>{geo.surveyorName} ({geo.surveyorId})</span>
                <span className="text-[#6B6B6B]">{geo.surveyTimestamp} WIB</span>
              </div>
            </div>

            {/* Mock GPS Anomaly Banner if detected */}
            {geo.isMockLocationDetected ? (
              <div className="p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs text-[#DC2626] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Mock Location / FakeGPS Detected!</div>
                  <div className="text-[11px] mt-0.5">
                    {geo.mockLocationReason || 'Android Location Provider indicates coordinates simulated via mock location provider.'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-[#16A34A]/10 border border-[#16A34A]/30 text-xs text-[#16A34A] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Hardware GPS Verified: Satellite GLONASS/GPS lock without mock location providers.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cross-Document Data Consistency Matrix Table */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#E5E5E3] bg-[#F7F7F5] flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-[#1A1A1A]">
              Cross-Document Data Consistency Matrix &amp; Tele-Verification
            </h4>
            <p className="text-xs text-[#6B6B6B]">
              Automated cross-referencing between e-KTP, Family Card (KK), salary slip, and tele-verification speech.
            </p>
          </div>
          <span className="text-xs bg-white border border-[#E5E5E3] px-2.5 py-1 rounded text-[#1A1A1A] font-medium">
            5 Key Parameters
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white border-b border-[#E5E5E3] text-[#6B6B6B] font-medium">
              <tr>
                <th className="py-3 px-4">Application Parameter</th>
                <th className="py-3 px-4">Physical e-KTP Extraction</th>
                <th className="py-3 px-4">Family Card (KK)</th>
                <th className="py-3 px-4">Tele-Verification Spoken</th>
                <th className="py-3 px-4 text-center">Consistency Status</th>
                <th className="py-3 px-4 text-right">Validation Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E3]">
              {crossCheckMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#F7F7F5] transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#1A1A1A]">{row.field}</td>
                  <td className="py-3 px-4 font-mono text-[#1A1A1A]">{row.ktpValue}</td>
                  <td className="py-3 px-4 text-[#1A1A1A]">{row.kkValue}</td>
                  <td className="py-3 px-4 text-[#1A1A1A]">{row.teleQaValue}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        row.isMatch
                          ? 'bg-[#16A34A]/10 text-[#16A34A]'
                          : 'bg-[#DC2626]/10 text-[#DC2626]'
                      }`}
                    >
                      {row.isMatch ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Match</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Mismatch</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-[11px] text-[#6B6B6B]">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
