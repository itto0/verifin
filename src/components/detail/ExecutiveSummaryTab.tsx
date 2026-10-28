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
        {/* Pillar 1: e-KTP & Biometrik */}
        <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E5E3]">
              <span className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                1. e-KTP &amp; Biometrik
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
                Anomali {document.score}/100
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
                <span className="text-[#6B6B6B]">Format NIK:</span>
                <span className={`font-medium ${document.nikValidation.isValidStructure ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {document.nikValidation.isValidStructure ? 'Valid Algoritma' : 'Anomali Tanggal'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Manipulasi Gambar:</span>
                <span className={`font-medium ${document.tamperFlags.length > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                  {document.tamperFlags.length > 0 ? `${document.tamperFlags.length} Flag Forensik` : 'Bebas Rekayasa'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('ektp')}
            className="mt-4 pt-2 border-t border-[#E5E5E3] text-[11px] font-medium text-[#2563EB] hover:underline flex items-center justify-between"
          >
            <span>Buka Forensik e-KTP</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Pillar 2: Geotag & Survei */}
        <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E5E3]">
              <span className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                2. Geotag &amp; Survei
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
                Anomali {geo.score}/100
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Jarak ke Domisili:</span>
                <span
                  className={`font-mono font-bold ${
                    geo.distanceStatus === 'red'
                      ? 'text-[#DC2626]'
                      : geo.distanceStatus === 'yellow'
                      ? 'text-[#D97706]'
                      : 'text-[#16A34A]'
                  }`}
                >
                  {geo.distanceMeters.toLocaleString('id-ID')} meter
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Deteksi Mock GPS:</span>
                <span className={`font-medium ${geo.isMockLocationDetected ? 'text-[#DC2626] font-bold' : 'text-[#16A34A]'}`}>
                  {geo.isMockLocationDetected ? 'FakeGPS AKTIF' : 'Bersih (Hardware GPS)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Foto Survei:</span>
                <span className="text-[#1A1A1A] font-medium">
                  {geo.surveyPhotos.length} Foto In-App
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('geo')}
            className="mt-4 pt-2 border-t border-[#E5E5E3] text-[11px] font-medium text-[#2563EB] hover:underline flex items-center justify-between"
          >
            <span>Buka Peta GIS &amp; Foto</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Pillar 3: Tele-Verifikasi QA */}
        <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E5E3]">
              <span className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-[#2563EB]" />
                3. Tele-Verifikasi QA
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
                Anomali {voice.score}/100
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Akurasi Spelling:</span>
                <span className={`font-mono font-bold ${voice.spellingAccuracyScore >= 80 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {voice.spellingAccuracyScore}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Keraguan Konsumen:</span>
                <span className={`font-medium ${voice.overallHesitancyCount > 1 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                  {voice.overallHesitancyCount}x Jeda Ragu
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Kepatuhan Script:</span>
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
            <span>Buka Audio &amp; Transkrip</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Pillar 4: Dokumen & ICR */}
        <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E5E5E3]">
              <span className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                4. Dokumen &amp; ICR
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#16A34A]/10 text-[#16A34A]">
                Kelengkapan 100%
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Slip Gaji / Rekening:</span>
                <span className="font-medium text-[#1A1A1A]">Tervalidasi OCR</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Kartu Keluarga (KK):</span>
                <span className="font-medium text-[#16A34A]">Terverifikasi</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6B6B]">Agunan Sentuh Tanahku:</span>
                <span className="text-[#6B6B6B]">Non-Agunan Properti</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('icr')}
            className="mt-4 pt-2 border-t border-[#E5E5E3] text-[11px] font-medium text-[#2563EB] hover:underline flex items-center justify-between"
          >
            <span>Buka Cross-Check Dokumen</span>
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
                Forensik Biometrik: Foto e-KTP vs Selfie Konsumen
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
              <div className="text-[11px] text-[#6B6B6B] font-medium">Pasfoto Fisik e-KTP</div>
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
              <div className="text-[11px] text-[#6B6B6B] font-medium">Selfie Liveness Konsumen</div>
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
              Hasil Analisis Biometrik
            </div>
            <p>
              {document.faceMatchScore >= 80
                ? 'Struktur tulang wajah, mata, dan jarak hidung-bibir identik antara foto e-KTP dan foto selfie. Terverifikasi pemilik sah.'
                : 'Peringatan ketidakcocokan wajah: nilai kemiripan berada di bawah batas ambang 80%. Potensi pengajuan fiktif atau menggunakan identitas orang lain.'}
            </p>
          </div>
        </div>

        {/* Right Box: Geotag & Survey Field Verification */}
        <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#2563EB]" />
              <h4 className="text-sm font-semibold text-[#1A1A1A]">
                Validasi Lokasi: Domisili KTP vs Titik Survei CMO
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
                <span>Alamat Target Pengajuan:</span>
                <span className="font-mono text-[11px]">{geo.targetLat.toFixed(4)}, {geo.targetLng.toFixed(4)}</span>
              </div>
              <div className="font-medium text-[#1A1A1A]">{geo.targetAddress}</div>
            </div>

            <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E3] space-y-1.5">
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span>Titik Check-In Surveyor (CMO):</span>
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
                  <div className="font-semibold">Indikasi Mock Location / FakeGPS Aktif!</div>
                  <div className="text-[11px] mt-0.5">
                    {geo.mockLocationReason || 'Android Location Provider mengindikasikan koordinat disimulasikan dari luar lokasi asli.'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-[#16A34A]/10 border border-[#16A34A]/30 text-xs text-[#16A34A] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Hardware GPS Asli: Koordinat terverifikasi satelit GLONASS/GPS tanpa mock provider.</span>
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
              Matriks Konsistensi Data Lintas Dokumen &amp; Tele-Verifikasi
            </h4>
            <p className="text-xs text-[#6B6B6B]">
              Otomasi pencocokan silang antara e-KTP, Kartu Keluarga, Slip Gaji, dan ucapan konsumen saat telepon.
            </p>
          </div>
          <span className="text-xs bg-white border border-[#E5E5E3] px-2.5 py-1 rounded text-[#1A1A1A] font-medium">
            5 Parameter Kunci
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white border-b border-[#E5E5E3] text-[#6B6B6B] font-medium">
              <tr>
                <th className="py-3 px-4">Parameter Pengajuan</th>
                <th className="py-3 px-4">Ekstraksi Fisik e-KTP</th>
                <th className="py-3 px-4">Kartu Keluarga (KK)</th>
                <th className="py-3 px-4">Ucapan Tele-Verifikasi</th>
                <th className="py-3 px-4 text-center">Status Konsistensi</th>
                <th className="py-3 px-4 text-right">Catatan Validasi</th>
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
                          <span>Cocok</span>
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
