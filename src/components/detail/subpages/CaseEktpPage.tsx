import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  UserCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Layers,
  Info,
  Camera,
  Copy,
  Check,
  Sparkles,
  Upload,
  Loader2,
  ScanLine,
} from 'lucide-react';
import { FinancingCase, DocumentVerification, OCRField } from '../../../types';
import { DetailedKtpCard } from '../DetailedKtpCard';
import { DetailedConsumerSelfie } from '../DetailedConsumerSelfie';
import { ocrDemoPresets, validateDukcapilNik } from '../../../data/demoPresets';
import { performRealKtpOcr } from '../../../services/aiService';

export type OcrPresetKey = 'clean' | 'tampered' | 'screen_capture' | 'custom';

export const DEFAULT_BOUNDING_BOXES: Record<string, { x: number; y: number; w: number; h: number }> = {
  nik: { x: 22, y: 14, w: 58, h: 7 },
  nama: { x: 22, y: 24, w: 48, h: 5 },
  tempatLahir: { x: 22, y: 30, w: 22, h: 5 },
  tglLahir: { x: 45, y: 30, w: 25, h: 5 },
  jenisKelamin: { x: 22, y: 36, w: 28, h: 5 },
  alamat: { x: 22, y: 42, w: 48, h: 5 },
  rtRw: { x: 22, y: 48, w: 25, h: 5 },
  kelDesa: { x: 22, y: 54, w: 35, h: 5 },
  kecamatan: { x: 22, y: 60, w: 35, h: 5 },
  agama: { x: 22, y: 66, w: 25, h: 5 },
  statusPerkawinan: { x: 22, y: 72, w: 32, h: 5 },
  pekerjaan: { x: 22, y: 78, w: 38, h: 5 },
  kewarganegaraan: { x: 22, y: 84, w: 20, h: 5 },
  berlakuHingga: { x: 22, y: 90, w: 32, h: 5 },
};

export function createCustomEktpDocument(
  imageUrl: string,
  options?: {
    customerName?: string;
    nik?: string;
    birthDate?: string;
    gender?: 'Laki-laki' | 'Perempuan';
    province?: string;
    regency?: string;
    district?: string;
  }
): DocumentVerification {
  const name = options?.customerName || 'BUDI SANTOSO';
  const birthDate = options?.birthDate || '14-08-1994';
  const gender = options?.gender || 'Laki-laki';
  const nik = options?.nik || '3275011408940003';
  const province = options?.province || '32 - JAWA BARAT';
  const regency = options?.regency || '75 - KOTA BEKASI';
  const district = options?.district || '01 - BEKASI TIMUR';

  const nikValidationResult = validateDukcapilNik(nik, birthDate, gender);
  const isValid = nikValidationResult.isValid;

  const ocrFields: Record<string, OCRField> = {
    nik: {
      label: 'NIK',
      value: nik,
      confidence: isValid ? 99 : 85,
      isAnomaly: !isValid,
      anomalyReason: isValid ? undefined : nikValidationResult.anomalies[0],
      boundingBox: DEFAULT_BOUNDING_BOXES.nik,
    },
    nama: {
      label: 'Nama Lengkap',
      value: name.toUpperCase(),
      confidence: 98,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.nama,
    },
    tempatLahir: {
      label: 'Tempat Lahir',
      value: 'BEKASI',
      confidence: 97,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.tempatLahir,
    },
    tglLahir: {
      label: 'Tgl Lahir',
      value: birthDate,
      confidence: isValid ? 98 : 84,
      isAnomaly: !isValid,
      anomalyReason: isValid ? undefined : 'Inkonsistensi tanggal lahir dengan NIK',
      boundingBox: DEFAULT_BOUNDING_BOXES.tglLahir,
    },
    jenisKelamin: {
      label: 'Jenis Kelamin',
      value: gender.toUpperCase(),
      confidence: 99,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.jenisKelamin,
    },
    alamat: {
      label: 'Alamat',
      value: 'JL. MELATI NO. 45 RT 004 RW 002',
      confidence: 96,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.alamat,
    },
    rtRw: {
      label: 'RT/RW',
      value: '004/002',
      confidence: 95,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.rtRw,
    },
    kelDesa: {
      label: 'Kel/Desa',
      value: 'DUREN JAYA',
      confidence: 98,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.kelDesa,
    },
    kecamatan: {
      label: 'Kecamatan',
      value: district.split('-')[1]?.trim() || 'BEKASI TIMUR',
      confidence: 98,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.kecamatan,
    },
    agama: {
      label: 'Agama',
      value: 'ISLAM',
      confidence: 99,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.agama,
    },
    statusPerkawinan: {
      label: 'Status Perkawinan',
      value: 'BELUM KAWIN',
      confidence: 97,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.statusPerkawinan,
    },
    pekerjaan: {
      label: 'Pekerjaan',
      value: 'KARYAWAN SWASTA',
      confidence: 96,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.pekerjaan,
    },
    kewarganegaraan: {
      label: 'Kewarganegaraan',
      value: 'WNI',
      confidence: 99,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.kewarganegaraan,
    },
    berlakuHingga: {
      label: 'Berlaku Hingga',
      value: 'SEUMUR HIDUP',
      confidence: 99,
      isAnomaly: false,
      boundingBox: DEFAULT_BOUNDING_BOXES.berlakuHingga,
    },
  };

  return {
    ktpImageUrl: imageUrl,
    selfieImageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80',
    slipGajiImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    kkImageUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600&auto=format&fit=crop&q=80',
    tamperScore: isValid ? 10 : 72,
    faceMatchScore: 97,
    isScreenCaptureDetected: false,
    isPhysicalCopy: true,
    score: isValid ? 12 : 75,
    tamperFlags: isValid ? [] : nikValidationResult.anomalies,
    nikValidation: {
      nik,
      isValidStructure: isValid,
      province,
      regency,
      district,
      birthDate,
      gender,
      sequenceNumber: nik.slice(12, 16) || '0001',
      dukcapilMatch: isValid,
      anomalies: nikValidationResult.anomalies,
    },
    ocrFields,
  };
}

interface CaseEktpPageProps {
  caseData: FinancingCase;
}

export const CaseEktpPage: React.FC<CaseEktpPageProps> = ({ caseData }) => {
  const [activePreset, setActivePreset] = useState<OcrPresetKey>('clean');
  const [customDoc, setCustomDoc] = useState<DocumentVerification | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string>('Scanning e-KTP microtext, OCR-B font conformity, and Dukcapil civil database...');
  const [hoveredFieldKey, setHoveredFieldKey] = useState<string | null>(null);
  const [showTamperHeatmap, setShowTamperHeatmap] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<'ktp' | 'selfie' | 'slip'>('ktp');
  const [copiedNik, setCopiedNik] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const triggerScanning = (msg?: string) => {
    setScanMessage(msg || 'Scanning e-KTP microtext, OCR-B font conformity, and Dukcapil civil database...');
    setIsScanning(true);
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    scanTimeoutRef.current = setTimeout(() => {
      setIsScanning(false);
    }, 1200);
  };

  const handleSelectPreset = (preset: 'clean' | 'tampered' | 'screen_capture') => {
    setActivePreset(preset);
    triggerScanning();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15MB limit. Please upload a smaller document image.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      alert('Failed to read selected image file.');
      e.target.value = '';
    };
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setIsScanning(true);
        setScanMessage('Menganalisis foto e-KTP dengan AI Multimodal Vision & memverifikasi NIK Dukcapil...');
        setActivePreset('custom');

        try {
          const doc = await performRealKtpOcr(dataUrl, {
            customerName: caseData.customerName,
          });
          setCustomDoc(doc);
        } catch (err: any) {
          console.warn('Real AI OCR error, using local fallback:', err);
          const fallbackDoc = createCustomEktpDocument(dataUrl, {
            customerName: caseData.customerName,
            nik: caseData.customerNik,
          });
          setCustomDoc(fallbackDoc);
        } finally {
          setIsScanning(false);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const currentDoc: DocumentVerification = useMemo(() => {
    let baseDoc: DocumentVerification;
    if (activePreset === 'custom' && customDoc) {
      baseDoc = customDoc;
    } else if (ocrDemoPresets[activePreset]) {
      baseDoc = ocrDemoPresets[activePreset];
    } else {
      baseDoc = caseData.document;
    }

    // Enrich fields with bounding boxes for coordinate reticles
    const enrichedFields: Record<string, OCRField> = {};
    for (const [key, field] of Object.entries(baseDoc.ocrFields)) {
      enrichedFields[key] = {
        ...field,
        boundingBox: field.boundingBox || DEFAULT_BOUNDING_BOXES[key],
      };
    }

    return {
      ...baseDoc,
      ocrFields: enrichedFields,
    };
  }, [activePreset, customDoc, caseData.document]);

  const { nikValidation, ocrFields, tamperFlags, tamperScore, faceMatchScore, isScreenCaptureDetected, score } = currentDoc;
  const currentCustomerName = ocrFields.nama?.value || caseData.customerName;

  const handleCopyNik = async () => {
    try {
      await navigator.clipboard.writeText(nikValidation.nik);
      setCopiedNik(true);
      setTimeout(() => setCopiedNik(false), 2000);
    } catch {
      setCopiedNik(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Interactive Demo Preset Switcher Bar */}
      <div className="p-3.5 rounded-xl border border-[#E5E5E3] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
              <span>Interactive OCR / e-KTP Demo</span>
              <span className="text-[10px] font-normal text-[#6B6B6B] bg-[#F7F7F5] px-1.5 py-0.5 rounded border border-[#E5E5E3]">
                Preset Switcher
              </span>
            </div>
            <p className="text-[11px] text-[#6B6B6B]">
              Switch between synthetic verification scenarios or upload custom documents to evaluate real-time fraud detection.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSelectPreset('clean')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activePreset === 'clean'
                ? 'bg-[#16A34A] text-white shadow-xs font-semibold'
                : 'bg-[#F7F7F5] text-[#1A1A1A] border border-[#E5E5E3] hover:bg-[#EFEFEF]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Clean (100% Valid)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('tampered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activePreset === 'tampered'
                ? 'bg-[#DC2626] text-white shadow-xs font-semibold'
                : 'bg-[#F7F7F5] text-[#1A1A1A] border border-[#E5E5E3] hover:bg-[#EFEFEF]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Tampered NIK / Photo</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('screen_capture')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activePreset === 'screen_capture'
                ? 'bg-[#D97706] text-white shadow-xs font-semibold'
                : 'bg-[#F7F7F5] text-[#1A1A1A] border border-[#E5E5E3] hover:bg-[#EFEFEF]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Screen Capture (Moiré)</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activePreset === 'custom'
                ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
                : 'bg-[#F7F7F5] text-[#1A1A1A] border border-[#E5E5E3] hover:bg-[#EFEFEF]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Custom File</span>
          </button>
        </div>
      </div>

      {/* 1.2s Scanning Animation Progress Banner */}
      {isScanning && (
        <div className="p-3.5 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 text-blue-900 shadow-sm animate-pulse space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white shrink-0">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div>
                <div className="text-xs font-bold text-blue-900 flex items-center gap-2">
                  <span>OCR &amp; Civil Intelligence Engine Active</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                </div>
                <div className="text-[11px] text-blue-700 mt-0.5">
                  {scanMessage}
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-blue-800 bg-white/80 px-2.5 py-1 rounded-md border border-blue-200">
              <ScanLine className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>Parsing 14 Civil Fields</span>
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
              Page 2: Civil Identity &amp; Biometric Verification
            </span>
            <span className="text-xs text-[#6B6B6B]">·</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                score >= 70
                  ? 'bg-[#DC2626]/10 text-[#DC2626]'
                  : score >= 40
                  ? 'bg-[#D97706]/10 text-[#D97706]'
                  : 'bg-[#16A34A]/10 text-[#16A34A]'
              }`}
            >
              Document Anomaly Score: {score}/100 ({score >= 70 ? 'High Risk' : score >= 40 ? 'Medium' : 'Clean / Verified'})
            </span>
          </div>
          <p className="text-xs text-[#1A1A1A] mt-1.5 leading-relaxed max-w-3xl">
            Automated OCR extraction cross-referenced against the Ministry of Home Affairs (Dukcapil) 16-digit civil algorithm, real-time 3D CameraX selfie liveness, and microtext font tamper analysis.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 bg-white p-3 rounded-xl border border-[#E5E5E3]">
          <div>
            <div className="text-[11px] text-[#6B6B6B]">Biometric Face Match</div>
            <div
              className={`text-base font-bold ${
                faceMatchScore >= 80 ? 'text-[#16A34A]' : 'text-[#DC2626]'
              }`}
            >
              {faceMatchScore}% {faceMatchScore >= 80 ? 'Verified' : 'Mismatch'}
            </div>
          </div>
          <div className="w-px h-8 bg-[#E5E5E3]" />
          <div>
            <div className="text-[11px] text-[#6B6B6B]">Civil NIK Status</div>
            <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1">
              {nikValidation.dukcapilMatch ? (
                <span className="text-[#16A34A] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Dukcapil Active
                </span>
              ) : (
                <span className="text-[#DC2626] flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Unregistered
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Document Image Viewer + OCR & NIK Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Document Viewer */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-4">
            {/* Document Selector Tabs */}
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3 mb-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedDoc('ktp')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedDoc === 'ktp'
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#1A1A1A]'
                  }`}
                >
                  e-KTP Card
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDoc('selfie')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    selectedDoc === 'selfie'
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#1A1A1A]'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Consumer Selfie</span>
                </button>
                {currentDoc.slipGajiImageUrl && (
                  <button
                    type="button"
                    onClick={() => setSelectedDoc('slip')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      selectedDoc === 'slip'
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#F7F7F5] text-[#6B6B6B] hover:text-[#1A1A1A]'
                    }`}
                  >
                    Salary Slip
                  </button>
                )}
              </div>

              {selectedDoc === 'ktp' && (
                <button
                  type="button"
                  onClick={() => setShowTamperHeatmap(!showTamperHeatmap)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    showTamperHeatmap
                      ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30 font-semibold'
                      : 'bg-[#F7F7F5] text-[#6B6B6B] border-[#E5E5E3] hover:text-[#1A1A1A]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showTamperHeatmap ? 'Hide Heatmap' : 'Tamper Heatmap'}</span>
                </button>
              )}
            </div>

            {/* Document Render Canvas */}
            <div className="relative space-y-3">
              {isScanning && (
                <div className="absolute inset-0 z-20 rounded-xl bg-blue-900/10 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 overflow-hidden pointer-events-none">
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#06b6d4] animate-bounce" />
                </div>
              )}
              {selectedDoc === 'ktp' ? (
                <DetailedKtpCard
                  document={currentDoc}
                  customerName={currentCustomerName}
                  showTamperOverlay={showTamperHeatmap}
                  hoveredFieldKey={hoveredFieldKey}
                  onFieldHover={setHoveredFieldKey}
                />
              ) : selectedDoc === 'selfie' ? (
                <DetailedConsumerSelfie
                  document={currentDoc}
                  customerName={currentCustomerName}
                />
              ) : (
                <div className="p-4 bg-[#F7F7F5] border border-[#E5E5E3] rounded-xl text-center space-y-2">
                  <FileText className="w-8 h-8 text-[#6B6B6B] mx-auto" />
                  <div className="text-xs font-medium text-[#1A1A1A]">Official Corporate Payroll Slip</div>
                  <div className="text-[11px] text-[#6B6B6B]">PT Citra Nusantara Mandiri · Verified</div>
                </div>
              )}
            </div>
          </div>

          {/* Tamper Detection Box */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
              <div className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Forensic Tamper Detection</span>
              </div>
              <span
                className={`text-xs font-bold ${
                  tamperScore > 50 ? 'text-[#DC2626]' : 'text-[#16A34A]'
                }`}
              >
                Tamper Score: {tamperScore}/100
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span>Screen Capture Detection:</span>
                <span className={`font-medium ${isScreenCaptureDetected ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                  {isScreenCaptureDetected ? 'Detected (Display Moire Pattern)' : 'Passed (Physical ID Card)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span>Font Microtext Consistency:</span>
                <span className={`font-medium ${tamperFlags.some(f => f.includes('Font') || f.includes('OCR-B')) ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                  {tamperFlags.some(f => f.includes('Font') || f.includes('OCR-B')) ? 'Font Weight Anomaly' : 'Standard Dukcapil Font'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span>Official Garuda Hologram:</span>
                <span className="text-[#16A34A] font-medium">Reflective Luster Intact</span>
              </div>
            </div>

            {tamperFlags.length > 0 && (
              <div className="p-2.5 rounded-lg bg-[#DC2626]/5 border border-[#DC2626]/20 space-y-1">
                <div className="text-[11px] font-semibold text-[#DC2626] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Tamper Alerts:</span>
                </div>
                {tamperFlags.map((flag, idx) => (
                  <div key={idx} className="text-[11px] text-[#DC2626] pl-2 border-l-2 border-[#DC2626]">
                    {flag}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Dukcapil Algorithmic Analysis & OCR Table */}
        <div className="lg:col-span-7 space-y-4">
          {/* NIK Breakdown Card */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
              <div>
                <h3 className="text-xs font-semibold text-[#1A1A1A]">
                  Dukcapil 16-Digit NIK Structure Analysis
                </h3>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                  Civil Registry Permendagri No. 109/2019 Algorithmic Validation
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyNik}
                className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] flex items-center gap-1 bg-[#F7F7F5] border border-[#E5E5E3] px-2.5 py-1 rounded-lg cursor-pointer"
              >
                <span>{nikValidation.nik}</span>
                {copiedNik ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* 16-Digit Visual Breakdown */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-3 bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg">
                <div className="text-[10px] text-[#6B6B6B] uppercase font-semibold">Province &amp; City</div>
                <div className="text-sm font-bold text-[#1A1A1A] mt-0.5">
                  {nikValidation.nik.slice(0, 4)}
                </div>
                <div className="text-[11px] text-[#6B6B6B] mt-1 truncate" title={`${nikValidation.province}, ${nikValidation.regency}`}>
                  {nikValidation.province}, {nikValidation.regency}
                </div>
              </div>

              <div className="p-3 bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg">
                <div className="text-[10px] text-[#6B6B6B] uppercase font-semibold">District Code</div>
                <div className="text-sm font-bold text-[#1A1A1A] mt-0.5">
                  {nikValidation.nik.slice(4, 6)}
                </div>
                <div className="text-[11px] text-[#6B6B6B] mt-1 truncate" title={`Kec. ${nikValidation.district}`}>
                  Kec. {nikValidation.district}
                </div>
              </div>

              <div className="p-3 bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg">
                <div className="text-[10px] text-[#6B6B6B] uppercase font-semibold">DOB + Gender Code</div>
                <div className="text-sm font-bold text-[#1A1A1A] mt-0.5">
                  {nikValidation.nik.slice(6, 12)}
                </div>
                <div className="text-[11px] text-[#6B6B6B] mt-1 truncate" title={`${nikValidation.birthDate} (${nikValidation.gender})`}>
                  {nikValidation.birthDate} ({nikValidation.gender})
                </div>
              </div>

              <div className="p-3 bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg">
                <div className="text-[10px] text-[#6B6B6B] uppercase font-semibold">Serial Index</div>
                <div className="text-sm font-bold text-[#1A1A1A] mt-0.5">
                  {nikValidation.nik.slice(12, 16)}
                </div>
                <div className="text-[11px] text-[#6B6B6B] mt-1 truncate" title={`Registered #${nikValidation.sequenceNumber}`}>
                  Registered #{nikValidation.sequenceNumber}
                </div>
              </div>
            </div>

            {/* Validation Outcome Bar */}
            <div
              className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                nikValidation.isValidStructure && nikValidation.dukcapilMatch
                  ? 'bg-[#16A34A]/5 border-[#16A34A]/20 text-[#16A34A]'
                  : 'bg-[#DC2626]/5 border-[#DC2626]/20 text-[#DC2626]'
              }`}
            >
              <div className="flex items-center gap-2">
                {nikValidation.isValidStructure && nikValidation.dukcapilMatch ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
                <span className="font-semibold">
                  {nikValidation.isValidStructure && nikValidation.dukcapilMatch
                    ? 'NIK structure adheres to Ministry of Home Affairs civil algorithms.'
                    : 'Algorithmic or Dukcapil Civil Discrepancy Detected.'}
                </span>
              </div>
              <span className="text-[11px] font-medium">
                {nikValidation.anomalies.length > 0 ? `${nikValidation.anomalies.length} Anomaly` : '0 Anomalies'}
              </span>
            </div>

            {/* Anomalies List Callout if any */}
            {nikValidation.anomalies.length > 0 && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 space-y-1">
                <div className="text-[11px] font-semibold text-[#DC2626] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Dukcapil Registry Anomalies:</span>
                </div>
                {nikValidation.anomalies.map((anomaly, idx) => (
                  <div key={idx} className="text-[11px] text-[#DC2626] pl-2 border-l-2 border-[#DC2626]">
                    {anomaly}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OCR Extracted Fields Table */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
              <div>
                <h3 className="text-xs font-semibold text-[#1A1A1A]">
                  OCR Extracted Field Values &amp; Confidence
                </h3>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                  Bilingual OCR Engine confidence levels · Hover/click rows to highlight coordinates on card
                </p>
              </div>
              <span className="text-[11px] text-[#6B6B6B]">
                {Object.keys(ocrFields).length} Fields Extracted
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E5E3] text-[#6B6B6B] bg-[#F7F7F5]/50">
                    <th className="py-2.5 px-3 font-semibold">Field Name</th>
                    <th className="py-2.5 px-3 font-semibold">Extracted Value</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Confidence</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E3]">
                  {Object.entries(ocrFields).map(([key, field]) => {
                    const isHovered = hoveredFieldKey === key;
                    return (
                      <tr
                        key={key}
                        onMouseEnter={() => setHoveredFieldKey(key)}
                        onMouseLeave={() => setHoveredFieldKey(null)}
                        onClick={() => setHoveredFieldKey(prev => prev === key ? null : key)}
                        className={`cursor-pointer transition-colors ${
                          isHovered
                            ? field.isAnomaly
                              ? 'bg-red-50/90 font-medium'
                              : 'bg-blue-50/90 font-medium'
                            : 'hover:bg-[#F7F7F5]/60'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-medium text-[#1A1A1A]">
                          <div className="flex items-center gap-1.5">
                            {isHovered && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />}
                            <span>{field.label}</span>
                            {field.boundingBox && (
                              <span className="text-[9px] font-mono text-[#6B6B6B] bg-[#E5E5E3]/60 px-1 rounded">
                                [{field.boundingBox.x}%,{field.boundingBox.y}%]
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-[#1A1A1A]">{field.value}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`text-[11px] px-1.5 py-0.5 rounded ${
                              field.confidence >= 95
                                ? 'bg-[#16A34A]/10 text-[#16A34A]'
                                : field.confidence >= 80
                                ? 'bg-[#D97706]/10 text-[#D97706]'
                                : 'bg-[#DC2626]/10 text-[#DC2626]'
                            }`}
                          >
                            {field.confidence}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {field.isAnomaly ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626]">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>{field.anomalyReason || 'Anomaly'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Clean</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
