import React, { useState, useRef, useEffect } from 'react';
import {
  ScanLine,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Search,
  Check,
  Upload,
  Loader2,
  FileText,
  Layers,
} from 'lucide-react';
import { FinancingCase } from '../../../types';
import { IcrDocumentSample, mockIcrDocuments } from '../../../data/icrData';
import { icrDemoPresets } from '../../../data/demoPresets';
import { DetailedIcrDocumentCard } from '../../icr/DetailedIcrDocumentCard';

export type IcrPresetKey = 'clean_shm' | 'cadastral_mismatch' | 'low_confidence' | 'custom';

export const DEFAULT_ICR_BOUNDING_BOXES: Record<string, { x: number; y: number; w: number; h: number }> = {
  // Surveyor Form fields (relative % coordinates in document viewer)
  status_kepemilikan: { x: 55, y: 35, w: 40, h: 6 },
  daya_listrik: { x: 55, y: 43, w: 40, h: 6 },
  lama_tinggal: { x: 55, y: 51, w: 35, h: 6 },
  nama_penjamin: { x: 55, y: 59, w: 38, h: 6 },
  penghasilan_tambahan: { x: 55, y: 67, w: 40, h: 6 },
  catatan_lingkungan: { x: 10, y: 76, w: 80, h: 8 },

  // BPN Certificate fields (relative % coordinates in document viewer)
  shm_nomor: { x: 25, y: 22, w: 50, h: 6 },
  nib: { x: 15, y: 32, w: 35, h: 6 },
  luas_tanah: { x: 15, y: 40, w: 45, h: 6 },
  nama_pemilik: { x: 10, y: 50, w: 80, h: 10 },
  asal_hak: { x: 10, y: 62, w: 60, h: 6 },
  letak_tanah: { x: 10, y: 70, w: 70, h: 6 },
};

export function createCustomIcrDocument(
  fileUrl: string,
  fileName: string = 'dokumen_agunan.pdf',
  options?: {
    applicantName?: string;
    caseId?: string;
    type?: 'survey_form' | 'bpn_certificate';
    forceMismatch?: boolean;
  }
): IcrDocumentSample {
  const isMismatch =
    options?.forceMismatch ||
    fileName.toLowerCase().includes('mismatch') ||
    fileName.toLowerCase().includes('sengketa');
  const applicantName = options?.applicantName || 'Bagus Prasetyo';
  const caseId = options?.caseId || 'CASE-CUSTOM';

  const lowerName = fileName.toLowerCase();
  const docType: 'survey_form' | 'bpn_certificate' =
    options?.type ||
    (lowerName.includes('form') || lowerName.includes('survei') || lowerName.includes('survey')
      ? 'survey_form'
      : 'bpn_certificate');

  if (docType === 'survey_form') {
    return {
      id: 'ICR-CUSTOM-FORM',
      type: 'survey_form',
      title: `Formulir Survei Lapangan BAF (${fileName})`,
      applicantName,
      caseId,
      scanDate: '2026-10-27 12:00 WIB',
      documentNumber: `SRV-CUST-${Date.now().toString().slice(-4)}`,
      overallConfidence: isMismatch ? 64 : 92,
      status: isMismatch ? 'needs_review' : 'verified',
      thumbnailUrl: fileUrl,
      summaryNote: isMismatch
        ? 'Ditemukan isian tulisan tangan dengan tingkat keyakinan rendah pada daya listrik dan estimasi penghasilan.'
        : 'Hasil ekstraksi tulisan tangan formulir survei lapangan tervalidasi dengan tingkat akurasi tinggi.',
      extractedFields: [
        {
          fieldKey: 'status_kepemilikan',
          label: 'Status Tempat Tinggal',
          extractedValue: 'Milik Sendiri (Keluarga)',
          normalizedValue: 'MILIK_SENDIRI',
          confidence: 94,
          isAnomaly: false,
        },
        {
          fieldKey: 'daya_listrik',
          label: 'Kapasitas Listrik (PLN)',
          extractedValue: isMismatch ? '450 VA (?)' : '1300 VA (Token)',
          normalizedValue: isMismatch ? '450_VA' : '1300_VA',
          confidence: isMismatch ? 61 : 95,
          isAnomaly: isMismatch,
          anomalyNote: isMismatch
            ? 'Angka daya listrik kabur, perlu verifikasi foto meteran kWh'
            : undefined,
        },
        {
          fieldKey: 'lama_tinggal',
          label: 'Lama Menempati Domisili',
          extractedValue: '3 Tahun 6 Bulan',
          normalizedValue: '42_BULAN',
          confidence: 93,
          isAnomaly: false,
        },
        {
          fieldKey: 'nama_penjamin',
          label: 'Nama Penjamin / Kontak Darurat',
          extractedValue: 'Hj. Siti Aminah',
          normalizedValue: 'SITI AMINAH',
          confidence: 92,
          isAnomaly: false,
        },
        {
          fieldKey: 'penghasilan_tambahan',
          label: 'Est. Penghasilan Tambahan / Usaha',
          extractedValue: isMismatch ? 'Rp 1.500.000 (?)' : 'Rp 3.500.000',
          normalizedValue: isMismatch ? '1500000' : '3500000',
          confidence: isMismatch ? 58 : 91,
          isAnomaly: isMismatch,
          anomalyNote: isMismatch ? 'Tulisan nominal penghasilan coretan tipbal' : undefined,
        },
        {
          fieldKey: 'catatan_lingkungan',
          label: 'Catatan Karakter Lingkungan RT/RW',
          extractedValue: 'Dikonfirmasi pengurus RT setempat tinggal aktif di lokasi.',
          normalizedValue: 'VALID_RT',
          confidence: 90,
          isAnomaly: false,
        },
      ],
    };
  }

  // BPN Certificate
  const ownerName = isMismatch ? 'SLAMET RIYADI' : applicantName.toUpperCase();
  return {
    id: isMismatch ? 'ICR-CUSTOM-MISMATCH' : 'ICR-CUSTOM-SHM',
    type: 'bpn_certificate',
    title: `Sertipikat Hak Milik (SHM) - Upload Mandiri (${fileName})`,
    applicantName,
    caseId,
    scanDate: '2026-10-27 12:00 WIB',
    documentNumber: `SHM-3275-01-${Date.now().toString().slice(-5)}`,
    overallConfidence: isMismatch ? 78 : 96,
    status: isMismatch ? 'mismatch_flag' : 'verified',
    thumbnailUrl: fileUrl,
    summaryNote: isMismatch
      ? 'Anomali Kadastral: Pemegang hak pada sertipikat tidak cocok dengan pemohon kredit, atau persil tanah berada di luar area survei.'
      : 'Pemeriksaan basis data kadastral Kementerian ATR/BPN Sentuh Tanahku: Data kepemilikan dan letak persil cocok 100%.',
    extractedFields: [
      {
        fieldKey: 'shm_nomor',
        label: 'Nomor Sertipikat',
        extractedValue: 'SHM No. 04821/Bekasi Timur',
        normalizedValue: 'SHM-04821',
        confidence: 98,
        isAnomaly: false,
      },
      {
        fieldKey: 'nib',
        label: 'Nomor Identifikasi Bidang (NIB)',
        extractedValue: '32.75.01.04.04821',
        normalizedValue: '32.75.01.04.04821',
        confidence: 97,
        isAnomaly: false,
      },
      {
        fieldKey: 'luas_tanah',
        label: 'Luas Tanah Terdaftar',
        extractedValue: '120 m2 (Seratus Dua Puluh Meter Persegi)',
        normalizedValue: '120',
        confidence: 96,
        isAnomaly: false,
      },
      {
        fieldKey: 'nama_pemilik',
        label: 'Nama Pemegang Hak',
        extractedValue: ownerName,
        normalizedValue: ownerName,
        confidence: 98,
        isAnomaly: isMismatch,
        anomalyNote: isMismatch
          ? `Nama pemilik pada sertipikat (${ownerName}) berbeda dengan pemohon (${applicantName.toUpperCase()})`
          : undefined,
      },
      {
        fieldKey: 'asal_hak',
        label: 'Asal Hak Milik',
        extractedValue: 'Jual Beli Akta PPAT No. 18/2019',
        normalizedValue: 'JUAL_BELI',
        confidence: 94,
        isAnomaly: false,
      },
    ],
    bpnSpatialVerification: {
      persilNib: '32.75.01.04.04821',
      shmNumber: 'SHM No. 04821/Bekasi Timur',
      surfaceAreaM2: 120,
      districtOffice: 'Kantor Pertanahan Kota Bekasi',
      registeredOwner: ownerName,
      applicantRelation: isMismatch
        ? 'Bukan Pemilik / Pihak Ketiga (Tanpa Surat Kuasa)'
        : 'Pemohon Langsung (Sesuai KTP)',
      latitude: -6.2382,
      longitude: 106.9756,
      spatialMatchWithSurveyAddress: !isMismatch,
      sentuhTanahkuStatus: isMismatch ? 'Beda Nama Pemilik' : 'Terverifikasi BPN',
    },
  };
}

interface CaseIcrPageProps {
  caseData: FinancingCase;
}

export const CaseIcrPage: React.FC<CaseIcrPageProps> = ({ caseData }) => {
  const [activePresetKey, setActivePresetKey] = useState<IcrPresetKey>('clean_shm');
  const [activeDoc, setActiveDoc] = useState<IcrDocumentSample>(icrDemoPresets.clean_shm);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [hoveredField, setHoveredField] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const triggerScanning = () => {
    setIsScanning(true);
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    scanTimeoutRef.current = setTimeout(() => {
      setIsScanning(false);
    }, 1200);
  };

  const handleSelectPreset = (key: 'clean_shm' | 'cadastral_mismatch' | 'low_confidence') => {
    setActivePresetKey(key);
    setActiveDoc(icrDemoPresets[key]);
    setHighlightedField(null);
    triggerScanning();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const custom = createCustomIcrDocument(dataUrl, file.name, {
          applicantName: caseData.customerName,
          caseId: caseData.id,
        });
        setActiveDoc(custom);
        setActivePresetKey('custom');
        setHighlightedField(null);
        triggerScanning();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const activeHighlight = highlightedField || hoveredField;

  return (
    <div className="space-y-6">
      {/* Interactive Demo Preset Switcher Bar */}
      <div className="p-3.5 rounded-xl border border-[#E5E5E3] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-600 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
              <span>Interactive ICR &amp; ATR/BPN Demo</span>
              <span className="text-[10px] font-normal text-[#6B6B6B] bg-[#F7F7F5] px-1.5 py-0.5 rounded border border-[#E5E5E3]">
                Preset Switcher
              </span>
            </div>
            <p className="text-[11px] text-[#6B6B6B]">
              Switch between land certificate &amp; surveyor ICR scenarios or upload custom documents to evaluate Sentuh Tanahku registry cross-checking.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSelectPreset('clean_shm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activePresetKey === 'clean_shm'
                ? 'bg-[#16A34A] text-white shadow-xs font-semibold'
                : 'bg-[#F7F7F5] text-[#1A1A1A] border border-[#E5E5E3] hover:bg-[#EFEFEF]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Clean SHM (Verified 1:1)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('cadastral_mismatch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activePresetKey === 'cadastral_mismatch'
                ? 'bg-[#DC2626] text-white shadow-xs font-semibold'
                : 'bg-[#F7F7F5] text-[#1A1A1A] border border-[#E5E5E3] hover:bg-[#EFEFEF]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Cadastral Mismatch (Spatial Discrepancy)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('low_confidence')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activePresetKey === 'low_confidence'
                ? 'bg-[#D97706] text-white shadow-xs font-semibold'
                : 'bg-[#F7F7F5] text-[#1A1A1A] border border-[#E5E5E3] hover:bg-[#EFEFEF]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Handwritten Form (Low Legibility)</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activePresetKey === 'custom'
                ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
                : 'bg-[#F7F7F5] text-[#1A1A1A] border border-[#E5E5E3] hover:bg-[#EFEFEF]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Custom Document...</span>
          </button>
        </div>
      </div>

      {/* 1.2s Scanning Animation Progress Banner */}
      {isScanning && (
        <div className="p-3.5 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 text-blue-900 shadow-xs animate-pulse space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white shrink-0">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div>
                <div className="text-xs font-bold text-blue-900 flex items-center gap-2">
                  <span>Intelligent Character Recognition &amp; Cadastral Engine Active</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                </div>
                <div className="text-[11px] text-blue-700 mt-0.5">
                  Performing Intelligent Character Recognition (ICR) on handwritten forms and querying ATR/BPN Sentuh Tanahku registry...
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-blue-800 bg-white/80 px-2.5 py-1 rounded-md border border-blue-200">
              <ScanLine className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>Matching Spatial Coordinates</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-blue-200/70 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 rounded-full w-full" />
          </div>
        </div>
      )}

      {/* Top Banner: Verification Status */}
      <div className="p-5 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
              Page 5: ICR Form Reader &amp; Collateral Verification (&quot;Sentuh Tanahku&quot;)
            </span>
            <span className="text-xs text-[#6B6B6B]">·</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                activeDoc.status === 'mismatch_flag'
                  ? 'bg-[#DC2626]/10 text-[#DC2626]'
                  : activeDoc.status === 'needs_review'
                  ? 'bg-[#D97706]/10 text-[#D97706]'
                  : 'bg-[#16A34A]/10 text-[#16A34A]'
              }`}
            >
              ICR Confidence: {activeDoc.overallConfidence}% ({activeDoc.status === 'mismatch_flag' ? 'Tamper / Mismatch' : activeDoc.status === 'needs_review' ? 'Needs Review' : 'Verified'})
            </span>
            {activePresetKey !== 'clean_shm' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                Preset: {activePresetKey.replace('_', ' ')}
              </span>
            )}
          </div>
          <p className="text-xs text-[#1A1A1A] mt-1.5 leading-relaxed max-w-3xl">
            Performs intelligent character recognition (ICR) on handwritten surveyor forms, cross-checks physical asset evidence, and verifies land certificates against the Ministry of ATR/BPN &quot;Sentuh Tanahku&quot; spatial registry.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 bg-white p-3 rounded-xl border border-[#E5E5E3]">
          <div>
            <div className="text-[11px] text-[#6B6B6B]">Document Class</div>
            <div className="text-sm font-semibold text-[#1A1A1A]">
              {activeDoc.type === 'survey_form' ? 'BAF Surveyor Form' : 'BPN SHM Certificate'}
            </div>
          </div>
          <div className="w-px h-8 bg-[#E5E5E3]" />
          <div>
            <div className="text-[11px] text-[#6B6B6B]">Registry Check</div>
            <div className="text-xs font-semibold flex items-center gap-1">
              {activeDoc.bpnSpatialVerification ? (
                activeDoc.bpnSpatialVerification.spatialMatchWithSurveyAddress ? (
                  <span className="text-[#16A34A] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ATR/BPN Linked
                  </span>
                ) : (
                  <span className="text-[#DC2626] flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Spatial Mismatch
                  </span>
                )
              ) : (
                <span className="text-[#2563EB] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Form Signed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Detailed Document Viewer & Extracted ICR Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Detailed Document Card with CameraX & Cadastral Views */}
        <div className="lg:col-span-7 space-y-4">
          <DetailedIcrDocumentCard
            document={activeDoc}
            onSelectCase={() => {}}
            highlightedFieldKey={activeHighlight}
          />
        </div>

        {/* Right Column (5 cols): Extracted Handwritten Fields & Cadastral Spatial Check */}
        <div className="lg:col-span-5 space-y-4">
          {/* Extracted Fields Table */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
              <div>
                <h3 className="text-xs font-semibold text-[#1A1A1A]">
                  ICR Handwritten Extracted Fields
                </h3>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                  Click or hover any row to pinpoint bounding box
                </p>
              </div>
              <span className="text-[10px] text-[#6B6B6B]">
                {activeDoc.extractedFields.length} Fields
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {activeDoc.extractedFields.map((field) => (
                <div
                  key={field.fieldKey}
                  onClick={() =>
                    setHighlightedField(
                      highlightedField === field.fieldKey ? null : field.fieldKey
                    )
                  }
                  onMouseEnter={() => setHoveredField(field.fieldKey)}
                  onMouseLeave={() => setHoveredField(null)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    activeHighlight === field.fieldKey
                      ? 'bg-[#2563EB]/10 border-[#2563EB] ring-1 ring-[#2563EB]/30'
                      : 'bg-[#F7F7F5] border-[#E5E5E3] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-[#1A1A1A]">{field.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        field.confidence >= 90
                          ? 'bg-[#16A34A]/10 text-[#16A34A]'
                          : field.confidence >= 70
                          ? 'bg-[#D97706]/10 text-[#D97706]'
                          : 'bg-[#DC2626]/10 text-[#DC2626]'
                      }`}
                    >
                      {field.confidence}% Confidence
                    </span>
                  </div>

                  <div className="text-[11px] text-[#1A1A1A] font-semibold">
                    {field.extractedValue}
                  </div>

                  {field.isAnomaly && (
                    <div className="mt-1 text-[10px] font-semibold text-[#DC2626] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{field.anomalyNote || 'Potential anomaly detected'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ATR/BPN Sentuh Tanahku Spatial Card */}
          {activeDoc.bpnSpatialVerification ? (
            <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
                <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>ATR/BPN &quot;Sentuh Tanahku&quot; Cadastral Plot</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                  activeDoc.bpnSpatialVerification.spatialMatchWithSurveyAddress
                    ? 'text-[#16A34A] bg-[#16A34A]/10'
                    : 'text-[#DC2626] bg-[#DC2626]/10'
                }`}>
                  NIB: {activeDoc.bpnSpatialVerification.persilNib}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#6B6B6B] pb-1.5 border-b border-[#E5E5E3]">
                  <span>Registered SHM / SHGB:</span>
                  <span className="font-semibold text-[#1A1A1A]">
                    {activeDoc.bpnSpatialVerification.shmNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#6B6B6B] pb-1.5 border-b border-[#E5E5E3]">
                  <span>Registered Land Area:</span>
                  <span className="font-semibold text-[#1A1A1A]">
                    {activeDoc.bpnSpatialVerification.surfaceAreaM2} m²
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#6B6B6B] pb-1.5 border-b border-[#E5E5E3]">
                  <span>Certified Owner:</span>
                  <span className="font-semibold text-[#1A1A1A]">
                    {activeDoc.bpnSpatialVerification.registeredOwner} ({activeDoc.bpnSpatialVerification.applicantRelation})
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#6B6B6B] pb-1.5 border-b border-[#E5E5E3]">
                  <span>Kantor Pertanahan:</span>
                  <span className="font-semibold text-[#1A1A1A]">
                    {activeDoc.bpnSpatialVerification.districtOffice}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#6B6B6B]">
                  <span>Spatial Alignment:</span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      activeDoc.bpnSpatialVerification.spatialMatchWithSurveyAddress
                        ? 'text-[#16A34A]'
                        : 'text-[#DC2626]'
                    }`}
                  >
                    {activeDoc.bpnSpatialVerification.spatialMatchWithSurveyAddress ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Coordinates Match Surveyed Lot ({activeDoc.bpnSpatialVerification.sentuhTanahkuStatus})</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Lot Coordinate Mismatch ({activeDoc.bpnSpatialVerification.sentuhTanahkuStatus})</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
                <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Collateral Asset Verification</span>
                </div>
                <span className="text-[10px] text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded font-semibold">
                  Motorcycle BPKB
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                Unit {caseData.vehicleModel} verified against dealer delivery order and PLN 900 VA meter serial number on site.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
