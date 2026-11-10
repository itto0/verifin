/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FlaskConical,
  RefreshCw,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  Copy,
  Check,
  FileText,
  ScanLine,
  Headphones,
  Sliders,
  Play,
  Volume2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  FileCheck2,
  Info,
  Table as TableIcon,
} from 'lucide-react';
import {
  checkProcessingHealth,
  processKtpImage,
  processSurveyFormImage,
  analyzeVoiceAudio,
  processDocumentImage,
  processTableImage,
  HealthCheckResponse,
  ProcessEnvelope,
  Finding,
  KTPProcessResult,
  ICRFormResult,
  VoiceQAResult,
  GeneralOcrResult,
  TableExtractionResult,
  ExtractedTable,
  MAX_IMAGE_SIZE,
  MAX_AUDIO_SIZE,
} from '../../services/processingClient';

export type LabSubTab = 'ktp' | 'icr' | 'voice' | 'general' | 'table';

export interface ProcessingLabViewProps {
  initialTab?: LabSubTab;
  initialResult?: ProcessEnvelope<any> | null;
  initialFile?: File | Blob | null;
  initialPreviewUrl?: string | null;
  initialExecutionDuration?: number | null;
  initialHealth?: HealthCheckResponse | null;
  initialHealthStatus?: 'online' | 'offline' | 'checking';
}

interface DemoPreset {
  tab: LabSubTab;
  title: string;
  buttonLabel: string;
  url: string;
  fileName: string;
  mimeType: string;
  type: 'image' | 'audio';
  description: string;
}

const DEMO_PRESETS: Record<LabSubTab, DemoPreset> = {
  ktp: {
    tab: 'ktp',
    title: 'e-KTP OCR & Dukcapil Verification',
    buttonLabel: 'Load Demo e-KTP',
    url: '/ktp_demo_normal.jfif',
    fileName: 'ktp_demo_normal.jfif',
    mimeType: 'image/jpeg',
    type: 'image',
    description: 'Authentic Indonesian e-KTP image for OCR extraction and Dukcapil civil registry check.',
  },
  icr: {
    tab: 'icr',
    title: 'Survey Form ICR Reader',
    buttonLabel: 'Load Demo CMO Survey Form',
    url: '/survey_form_cmo.jfif',
    fileName: 'survey_form_cmo.jfif',
    mimeType: 'image/jpeg',
    type: 'image',
    description: 'Field survey CMO report with handwritten applicant details and signature.',
  },
  voice: {
    tab: 'voice',
    title: 'Voice Call QA & Script Adherence',
    buttonLabel: 'Load Demo Call Recording',
    url: '/voice_0941.mp3',
    fileName: 'voice_0941.mp3',
    mimeType: 'audio/mp3',
    type: 'audio',
    description: 'Tele-verification call audio (CASE-0941) for OJK checklist and acoustic hesitation tracking.',
  },
  general: {
    tab: 'general',
    title: 'General Document OCR',
    buttonLabel: 'Load Demo Salary Slip',
    url: '/slip_gaji_normal.jfif',
    fileName: 'slip_gaji_normal.jfif',
    mimeType: 'image/jpeg',
    type: 'image',
    description: 'Standard payslip document for multi-line bounding box detection and text extraction.',
  },
  table: {
    tab: 'table',
    title: 'Table Detection & Extraction',
    buttonLabel: 'Load Demo Table (Salary Slip)',
    url: '/slip_gaji_normal.jfif',
    fileName: 'slip_gaji_normal.jfif',
    mimeType: 'image/jpeg',
    type: 'image',
    description: 'Tabular document for heuristic & OCR-based grid line detection, row-column alignment, and CSV export.',
  },
};

const KTP_FIELD_LABELS: Record<string, string> = {
  nik: 'NIK',
  nama: 'Nama Lengkap',
  tempat_lahir: 'Tempat Lahir',
  tgl_lahir: 'Tanggal Lahir',
  jenis_kelamin: 'Jenis Kelamin',
  alamat: 'Alamat',
  rt_rw: 'RT / RW',
  kel_desa: 'Kel / Desa',
  kecamatan: 'Kecamatan',
  agama: 'Agama',
  status_perkawinan: 'Status Perkawinan',
  pekerjaan: 'Pekerjaan',
  kewarganegaraan: 'Kewarganegaraan',
  berlaku_hingga: 'Berlaku Hingga',
};

export const ProcessingLabView: React.FC<ProcessingLabViewProps> = ({
  initialTab = 'ktp',
  initialResult = null,
  initialFile = null,
  initialPreviewUrl = null,
  initialExecutionDuration = null,
  initialHealth = null,
  initialHealthStatus,
}) => {
  const [activeTab, setActiveTab] = useState<LabSubTab>(initialTab);

  // Health state
  const [health, setHealth] = useState<HealthCheckResponse | null>(initialHealth);
  const [healthStatus, setHealthStatus] = useState<'online' | 'offline' | 'checking'>(
    initialHealthStatus ?? (initialHealth ? 'online' : 'checking')
  );
  const [isRefreshingHealth, setIsRefreshingHealth] = useState(false);

  // Active files, previews, and results per tab
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(initialFile);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl);
  const [result, setResult] = useState<ProcessEnvelope<any> | null>(initialResult);
  const [executionDuration, setExecutionDuration] = useState<number | null>(initialExecutionDuration);

  // Interaction states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);

  // Fetch health check
  const refreshHealth = useCallback(async () => {
    setIsRefreshingHealth(true);
    try {
      const data = await checkProcessingHealth();
      setHealth(data);
      setHealthStatus('online');
    } catch {
      setHealthStatus('offline');
    } finally {
      setIsRefreshingHealth(false);
    }
  }, []);

  useEffect(() => {
    if (!initialHealth && !initialHealthStatus) {
      refreshHealth();
    }
  }, [initialHealth, initialHealthStatus, refreshHealth]);

  // Clean up object URLs on previewUrl change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handle Tab Switch
  const handleSelectTab = (tab: LabSubTab) => {
    if (tab === activeTab || isProcessing) return;
    setActiveTab(tab);
    setErrorMsg(null);
    setResult(null);
    setExecutionDuration(null);

    // If current file is not compatible with new tab type, reset
    const newIsAudio = tab === 'voice';
    const currentIsAudio = selectedFile ? selectedFile.type.startsWith('audio') : false;
    if (newIsAudio !== currentIsAudio) {
      setSelectedFile(null);
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
    }
  };

  // Validate and set chosen file
  const setFileWithValidation = (file: File | Blob, customUrl?: string) => {
    setErrorMsg(null);
    const isAudioTab = activeTab === 'voice';
    const maxSize = isAudioTab ? MAX_AUDIO_SIZE : MAX_IMAGE_SIZE;
    const typeLabel = isAudioTab ? 'Audio' : 'Image';

    if (file.size > maxSize) {
      const maxMb = Math.round(maxSize / (1024 * 1024));
      setErrorMsg(`${typeLabel} file too large (max ${maxMb}MB). Selected file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    const url = customUrl || URL.createObjectURL(file);
    setPreviewUrl(url);
    setResult(null);
    setExecutionDuration(null);
  };

  // Handle native file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileWithValidation(e.target.files[0]);
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileWithValidation(e.dataTransfer.files[0]);
    }
  };

  // Load Demo Preset
  const handleLoadDemo = async () => {
    const preset = DEMO_PRESETS[activeTab];
    setIsLoadingDemo(true);
    setErrorMsg(null);
    try {
      const res = await fetch(preset.url);
      if (!res.ok) {
        throw new Error(`Failed to load ${preset.fileName} (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const file = new File([blob], preset.fileName, { type: preset.mimeType });
      // Keep static path for reliable display or create blob url
      setFileWithValidation(file, preset.url);
    } catch (err: any) {
      setErrorMsg(err?.message || `Failed to load demo file: ${preset.fileName}`);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  // Run ML Processing
  const handleRunProcessing = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select a file or load a demo sample first.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setElapsedTime(0);
    const startTimestamp = performance.now();

    timerRef.current = setInterval(() => {
      setElapsedTime(Math.round(performance.now() - startTimestamp));
    }, 100);

    try {
      let resEnvelope: ProcessEnvelope<any>;
      if (activeTab === 'ktp') {
        resEnvelope = await processKtpImage(selectedFile);
      } else if (activeTab === 'icr') {
        resEnvelope = await processSurveyFormImage(selectedFile);
      } else if (activeTab === 'voice') {
        resEnvelope = await analyzeVoiceAudio(selectedFile);
      } else if (activeTab === 'table') {
        resEnvelope = await processTableImage(selectedFile);
      } else {
        resEnvelope = await processDocumentImage(selectedFile);
      }

      const totalDuration = Math.round(performance.now() - startTimestamp);
      setExecutionDuration(totalDuration);
      setResult(resEnvelope);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Processing failed. Check if Python ML service is running on port 8000.');
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsProcessing(false);
    }
  };

  // Copy JSON Handler
  const handleCopyJson = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      // fallback
    }
  };

  // Copy Text Handler
  const handleCopyText = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      // fallback
    }
  };

  const isAudioTab = activeTab === 'voice';
  const currentPreset = DEMO_PRESETS[activeTab];

  return (
    <div data-testid="processing-lab-view" className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Health Status Bar */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 text-[#2563EB]">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1A1A1A]">Python ML Processing Lab</h1>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Interactive testbed &amp; playground for e-KTP OCR, Survey Form ICR, Voice QA, General OCR, and Table Detection.
                </p>
              </div>
            </div>
          </div>

          {/* Health Badge & Details */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                healthStatus === 'online'
                  ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                  : healthStatus === 'checking'
                  ? 'bg-amber-50 text-[#D97706] border-amber-200'
                  : 'bg-red-50 text-[#DC2626] border-red-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  healthStatus === 'online'
                    ? 'bg-[#16A34A] animate-pulse'
                    : healthStatus === 'checking'
                    ? 'bg-[#D97706] animate-pulse'
                    : 'bg-[#DC2626]'
                }`}
              />
              <span>
                {healthStatus === 'online'
                  ? 'ML Service Online'
                  : healthStatus === 'checking'
                  ? 'Checking ML Service...'
                  : 'ML Service Offline'}
              </span>
            </div>

            {health && healthStatus === 'online' && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-[#6B6B6B] bg-[#F7F7F5] px-3 py-1.5 rounded-lg border border-[#E5E5E3]">
                <span>Device: <strong className="text-[#1A1A1A] font-semibold uppercase">{health.device}</strong></span>
                <span className="text-[#E5E5E3]">|</span>
                <span>OCR: <strong className="text-[#1A1A1A] font-semibold">{health.ocr_model_version || 'easyocr'}</strong></span>
                <span className="text-[#E5E5E3]">|</span>
                <span>Voice: <strong className="text-[#1A1A1A] font-semibold">{health.voice_model_version || 'whisper'}</strong></span>
              </div>
            )}

            <button
              type="button"
              onClick={refreshHealth}
              disabled={isRefreshingHealth}
              aria-label="Refresh Status"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E3] bg-white hover:bg-[#F7F7F5] text-xs font-medium text-[#1A1A1A] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingHealth ? 'animate-spin text-[#2563EB]' : 'text-[#6B6B6B]'}`} />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>

        {/* Offline Warning Banner */}
        {healthStatus === 'offline' && (
          <div className="mt-4 p-3.5 bg-red-50/70 border border-red-200 rounded-lg flex items-start gap-3 text-xs text-red-900">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-red-950">Python ML Service Offline or Unreachable:</span>
              <p className="mt-0.5 text-red-800 leading-relaxed">
                The FastAPI backend server is not responding at <code className="px-1 py-0.5 bg-red-100 rounded text-[11px] font-mono">http://localhost:8000</code>.
                Make sure to launch it via <code className="px-1 py-0.5 bg-red-100 rounded text-[11px] font-mono">uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload</code> from the <code className="px-1 py-0.5 bg-red-100 rounded text-[11px] font-mono">services/processing</code> directory.
                You can still load demo files to inspect UI layouts.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-[#E5E5E3] gap-1 overflow-x-auto pb-px" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ktp'}
          onClick={() => handleSelectTab('ktp')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'ktp'
              ? 'border-[#2563EB] text-[#2563EB] font-semibold bg-blue-50/30'
              : 'border-transparent text-[#6B6B6B] hover:text-[#1A1A1A] hover:border-gray-300'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>e-KTP OCR &amp; Dukcapil</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'icr'}
          onClick={() => handleSelectTab('icr')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'icr'
              ? 'border-[#2563EB] text-[#2563EB] font-semibold bg-blue-50/30'
              : 'border-transparent text-[#6B6B6B] hover:text-[#1A1A1A] hover:border-gray-300'
          }`}
        >
          <ScanLine className="w-4 h-4" />
          <span>Survey Form ICR</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'voice'}
          onClick={() => handleSelectTab('voice')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'voice'
              ? 'border-[#2563EB] text-[#2563EB] font-semibold bg-blue-50/30'
              : 'border-transparent text-[#6B6B6B] hover:text-[#1A1A1A] hover:border-gray-300'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Voice Call QA</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'general'}
          onClick={() => handleSelectTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'general'
              ? 'border-[#2563EB] text-[#2563EB] font-semibold bg-blue-50/30'
              : 'border-transparent text-[#6B6B6B] hover:text-[#1A1A1A] hover:border-gray-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>General Document OCR</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'table'}
          onClick={() => handleSelectTab('table')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'table'
              ? 'border-[#2563EB] text-[#2563EB] font-semibold bg-blue-50/30'
              : 'border-transparent text-[#6B6B6B] hover:text-[#1A1A1A] hover:border-gray-300'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          <span>Table Detection</span>
        </button>
      </div>

      {/* Main Two-Panel Playground Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Input Controls & Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
              <div className="text-sm font-bold text-[#1A1A1A]">{currentPreset.title}</div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E3] text-[#6B6B6B]">
                {isAudioTab ? 'audio/*' : 'image/*'}
              </span>
            </div>

            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              {currentPreset.description}
            </p>

            {/* Load Demo Sample Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleLoadDemo}
                disabled={isLoadingDemo || isProcessing}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-[#2563EB]/30 bg-blue-50/60 hover:bg-blue-50 text-[#2563EB] text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isLoadingDemo ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
                ) : (
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                )}
                <span>{isLoadingDemo ? 'Fetching Sample...' : currentPreset.buttonLabel}</span>
                <span className="text-[10px] text-blue-600/70 font-mono">({currentPreset.fileName})</span>
              </button>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              role="button"
              tabIndex={0}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#2563EB] bg-blue-50/40'
                  : 'border-[#E5E5E3] hover:border-gray-400 bg-[#FAFAFA]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={isAudioTab ? 'audio/*,audio/mpeg,audio/mp3,audio/wav,audio/m4a,audio/ogg,.mp3,.wav,.m4a' : 'image/*,.jfif,.jpg,.jpeg,.png,.webp'}
                onChange={handleFileChange}
                aria-label="Upload document or audio file"
              />

              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#2563EB]">
                  {isAudioTab ? <Volume2 className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                </div>
                <div className="text-xs font-medium text-[#1A1A1A]">
                  {isAudioTab ? (
                    <span>Upload or load an audio recording</span>
                  ) : (
                    <span>Click to browse or drag &amp; drop an image</span>
                  )}
                </div>
                <div className="text-[11px] text-[#6B6B6B]">
                  {isAudioTab ? 'MP3, WAV, M4A (Max 50MB)' : 'JPEG, PNG, JFIF, WebP (Max 15MB)'}
                </div>
              </div>
            </div>

            {/* Selected File Details & Preview Box */}
            {selectedFile && (
              <div className="bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-semibold text-[#1A1A1A] truncate">
                      {selectedFile instanceof File ? selectedFile.name : currentPreset.fileName}
                    </span>
                    <span className="text-[#6B6B6B] text-[11px] shrink-0">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setResult(null);
                    }}
                    className="text-[#6B6B6B] hover:text-[#DC2626] text-[11px] font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>

                {/* Media Preview */}
                {previewUrl && (
                  <div className="rounded-lg overflow-hidden border border-[#E5E5E3] bg-white flex items-center justify-center">
                    {isAudioTab ? (
                      <div className="w-full p-3 bg-white">
                        <audio
                          controls
                          src={previewUrl}
                          className="w-full h-10"
                          aria-label="Audio player preview"
                        />
                      </div>
                    ) : (
                      <div className="relative max-h-64 overflow-hidden w-full flex items-center justify-center bg-black/5">
                        <img
                          src={previewUrl}
                          alt="Input document preview"
                          className="max-h-64 object-contain w-full rounded"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-900">
                <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMsg}</div>
              </div>
            )}

            {/* Run Button with Spinner & Timer */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleRunProcessing}
                disabled={!selectedFile || isProcessing}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processing... {(elapsedTime / 1000).toFixed(1)}s</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Run Processing</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Envelope & Domain Inspection (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!result ? (
            <div className="bg-white border border-[#E5E5E3] rounded-xl p-12 text-center shadow-xs flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3">
                <ScanLine className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1A1A1A]">No Processing Result Yet</h3>
              <p className="text-xs text-[#6B6B6B] max-w-sm mt-1 leading-relaxed">
                Upload your document or click &ldquo;{currentPreset.buttonLabel}&rdquo; on the left, then click &ldquo;Run Processing&rdquo; to inspect the typed extraction envelope, confidence scores, and domain visualizers.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Envelope Header Card */}
              <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        result.status === 'success'
                          ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                          : result.status === 'partial'
                          ? 'bg-amber-50 text-[#D97706] border-amber-200'
                          : 'bg-red-50 text-[#DC2626] border-red-200'
                      }`}
                    >
                      {result.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-[#6B6B6B]">
                      Model: <strong className="text-[#1A1A1A] font-semibold">{result.model_version || 'standard'}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#6B6B6B]">
                    {executionDuration !== null && (
                      <span className="flex items-center gap-1 font-mono font-medium text-[#1A1A1A]">
                        <Clock className="w-3.5 h-3.5 text-[#6B6B6B]" />
                        {executionDuration} ms
                      </span>
                    )}
                    {result.processed_at && (
                      <span className="hidden sm:inline text-[#6B6B6B]">
                        {new Date(result.processed_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Confidence Meter */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="text-[#6B6B6B]">Overall Envelope Confidence</span>
                    <span className="text-[#1A1A1A] font-bold text-sm">
                      {typeof result.confidence === 'number' ? result.confidence.toFixed(1) : 0}%
                    </span>
                  </div>
                  <div
                    className="w-full bg-[#E5E5E3] rounded-full h-2 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.round(result.confidence || 0)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        result.confidence >= 85
                          ? 'bg-[#16A34A]'
                          : result.confidence >= 60
                          ? 'bg-[#D97706]'
                          : 'bg-[#DC2626]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, result.confidence || 0))}%` }}
                    />
                  </div>
                </div>

                {/* Findings List */}
                <div>
                  <div className="text-xs font-semibold text-[#1A1A1A] mb-2 flex items-center justify-between">
                    <span>Envelope Findings ({result.findings?.length || 0})</span>
                  </div>

                  {(!result.findings || result.findings.length === 0) ? (
                    <div className="text-xs text-[#16A34A] bg-emerald-50/60 border border-emerald-100 rounded-lg p-2.5 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                      <span>Clean envelope — No anomalies or rule flags detected.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {result.findings.map((f: Finding, idx: number) => {
                        const sev = f.severity?.toLowerCase() || 'medium';
                        const badgeColor =
                          sev === 'critical'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : sev === 'high'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : sev === 'medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200';

                        return (
                          <div
                            key={idx}
                            className="p-2.5 bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg text-xs flex items-start gap-2.5"
                          >
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border shrink-0 ${badgeColor}`}>
                              {sev}
                            </span>
                            <div className="flex-1">
                              <div className="font-semibold text-[#1A1A1A]">{f.description}</div>
                              <div className="flex items-center gap-3 text-[11px] text-[#6B6B6B] mt-0.5 font-mono">
                                <span>Type: {f.type}</span>
                                {f.field_ref && <span>Field: {f.field_ref}</span>}
                                {typeof f.timestamp === 'number' && <span>Time: {f.timestamp}s</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Domain Specific Cards */}
              {activeTab === 'ktp' && (
                <KtpDomainCard data={result.data as KTPProcessResult} />
              )}

              {activeTab === 'icr' && (
                <IcrDomainCard data={result.data as ICRFormResult} />
              )}

              {activeTab === 'voice' && (
                <VoiceDomainCard data={result.data as VoiceQAResult} />
              )}

              {activeTab === 'general' && (
                <GeneralDomainCard
                  data={result.data as GeneralOcrResult}
                  onCopyText={handleCopyText}
                  copiedText={copiedText}
                />
              )}

              {activeTab === 'table' && (
                <TableDomainCard data={result.data as TableExtractionResult} />
              )}

              {/* Collapsible JSON Accordion */}
              <div className="bg-white border border-[#E5E5E3] rounded-xl overflow-hidden shadow-xs">
                <details className="group">
                  <summary className="flex items-center justify-between p-4 bg-[#F7F7F5] hover:bg-[#F0F0EE] cursor-pointer transition-colors text-xs font-semibold text-[#1A1A1A] select-none">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#6B6B6B]" />
                      <span>Raw Response Envelope (JSON)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleCopyJson();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#E5E5E3] hover:bg-gray-50 text-[11px] text-[#1A1A1A] font-medium"
                      >
                        {copiedJson ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                            <span className="text-[#16A34A]">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#6B6B6B]" />
                            <span>Copy JSON</span>
                          </>
                        )}
                      </button>
                      <ChevronDown className="w-4 h-4 text-[#6B6B6B] transition-transform group-open:rotate-180" />
                    </div>
                  </summary>

                  <div className="p-4 bg-slate-900 overflow-x-auto">
                    <pre className="text-slate-100 text-xs font-mono leading-relaxed">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-Card Visualizers                                                       */
/* -------------------------------------------------------------------------- */

/**
 * e-KTP Domain Visualizer: 14 Fields Grid + Dukcapil Validation Card
 */
const KtpDomainCard: React.FC<{ data: KTPProcessResult }> = ({ data }) => {
  const fields = data?.fields || {};
  const validation = data?.validation || ({} as any);
  const confidences = fields.field_confidences || {};
  const imageQuality = data?.image_quality;
  const blurScore = imageQuality?.blur_score ?? data?.quality_score;
  const isBlurred = imageQuality?.is_blurred ?? data?.is_blurred;
  const hasQuality = Boolean(
    imageQuality ||
    typeof data?.quality_score === 'number' ||
    typeof data?.is_blurred === 'boolean'
  );

  // Support backend variations: province vs province_code, etc.
  const provinceVal = validation.province || validation.province_code || '—';
  const regencyVal = validation.regency || validation.regency_code || '—';
  const districtVal = validation.district || validation.district_code || '—';
  const genderVal = validation.parsed_gender || validation.gender || '—';
  const dobVal = validation.parsed_dob || validation.birth_date_str || '—';
  const tamperScoreNum = typeof validation.tamper_score === 'number' ? validation.tamper_score : 0;
  const isTampered = tamperScoreNum > 1 ? tamperScoreNum >= 50 : tamperScoreNum > 0.5;

  return (
    <div className="space-y-4">
      {/* Dukcapil Civil Registry Validation Card */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
            <h4 className="text-sm font-bold text-[#1A1A1A]">Dukcapil Civil Registry Validation</h4>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              validation.is_valid
                ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                : 'bg-red-50 text-[#DC2626] border-red-200'
            }`}
          >
            {validation.is_valid ? 'Dukcapil Verified' : 'Validation Anomaly'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#F7F7F5] rounded-lg border border-[#E5E5E3]">
            <span className="text-[#6B6B6B] block">Province (Provinsi)</span>
            <span className="font-semibold text-[#1A1A1A] mt-0.5 block truncate">{provinceVal}</span>
          </div>
          <div className="p-3 bg-[#F7F7F5] rounded-lg border border-[#E5E5E3]">
            <span className="text-[#6B6B6B] block">Regency (Kabupaten/Kota)</span>
            <span className="font-semibold text-[#1A1A1A] mt-0.5 block truncate">{regencyVal}</span>
          </div>
          <div className="p-3 bg-[#F7F7F5] rounded-lg border border-[#E5E5E3]">
            <span className="text-[#6B6B6B] block">District (Kecamatan)</span>
            <span className="font-semibold text-[#1A1A1A] mt-0.5 block truncate">{districtVal}</span>
          </div>
          <div className="p-3 bg-[#F7F7F5] rounded-lg border border-[#E5E5E3]">
            <span className="text-[#6B6B6B] block">Gender Validity</span>
            <span className="font-semibold text-[#1A1A1A] mt-0.5 block">{genderVal}</span>
          </div>
          <div className="p-3 bg-[#F7F7F5] rounded-lg border border-[#E5E5E3]">
            <span className="text-[#6B6B6B] block">DOB Validity</span>
            <span className="font-semibold text-[#1A1A1A] mt-0.5 block">{dobVal}</span>
          </div>
          <div className="p-3 bg-[#F7F7F5] rounded-lg border border-[#E5E5E3]">
            <span className="text-[#6B6B6B] block">Tamper Score</span>
            <span
              className={`font-semibold mt-0.5 block ${
                isTampered ? 'text-[#DC2626]' : 'text-[#16A34A]'
              }`}
            >
              {typeof validation.tamper_score === 'number' ? validation.tamper_score.toFixed(2) : '0.00'}
              {' '}({isTampered ? 'High Risk' : 'Low Risk'})
            </span>
          </div>
        </div>

        {hasQuality && (
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B6B6B] pt-2 border-t border-[#E5E5E3]">
            <span>Blur Score: <strong className="text-[#1A1A1A] font-semibold">{typeof blurScore === 'number' ? blurScore.toFixed(1) : '—'}</strong></span>
            <span>Image Status: <strong className={isBlurred ? 'text-[#DC2626] font-semibold' : 'text-[#16A34A] font-semibold'}>{isBlurred ? 'Blurred Warning' : 'Sharp'}</strong></span>
            {imageQuality?.width && imageQuality?.height && (
              <span>Resolution: <strong className="text-[#1A1A1A] font-semibold">{imageQuality.width} x {imageQuality.height} px</strong></span>
            )}
          </div>
        )}
      </div>

      {/* 14 Fields Extraction Grid */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
          <h4 className="text-sm font-bold text-[#1A1A1A]">14 Standard e-KTP Fields</h4>
          <span className="text-xs text-[#6B6B6B]">OCR Field Confidences</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(KTP_FIELD_LABELS).map(([key, label]) => {
            const rawVal = (fields as any)[key];
            const conf = confidences[key];
            const displayConf = typeof conf === 'number' ? `${(conf * (conf <= 1 ? 100 : 1)).toFixed(0)}%` : null;

            return (
              <div
                key={key}
                className="p-3 bg-[#FAFAFA] border border-[#E5E5E3] rounded-lg text-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[#6B6B6B] font-medium">{label}</span>
                  {displayConf && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-[#2563EB] border border-blue-100">
                      {displayConf}
                    </span>
                  )}
                </div>
                <div className="font-semibold text-[#1A1A1A] text-sm break-words">
                  {rawVal || <span className="text-[#6B6B6B] italic font-normal">Not detected</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * Survey Form ICR Domain Visualizer: Key-Value Table with Needs-Review Chips
 */
const IcrDomainCard: React.FC<{ data: ICRFormResult }> = ({ data }) => {
  const fields = data?.fields || {};
  const entries = Object.entries(fields);

  return (
    <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
        <div>
          <h4 className="text-sm font-bold text-[#1A1A1A]">Handwritten ICR Field Extractions</h4>
          <span className="text-xs text-[#6B6B6B]">Form Template: <strong className="text-[#1A1A1A] font-semibold">{data?.form_type || 'SURVEY_FORM_CMO'}</strong></span>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-md bg-blue-50 text-[#2563EB] border border-blue-100 font-semibold">
          {entries.length} Fields Extracted
        </span>
      </div>

      <div className="overflow-x-auto border border-[#E5E5E3] rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F7F7F5] border-b border-[#E5E5E3] text-[#6B6B6B] font-semibold">
            <tr>
              <th className="py-2.5 px-3">Field Label</th>
              <th className="py-2.5 px-3">Extracted Value</th>
              <th className="py-2.5 px-3">Confidence</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">BBox</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E3]">
            {entries.map(([key, item]) => {
              const confPercent = Math.round(item.confidence <= 1 ? item.confidence * 100 : item.confidence);
              const bboxStr = item.bbox && item.bbox.length > 0 ? JSON.stringify(item.bbox) : '—';

              return (
                <tr key={key} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[#1A1A1A]">{item.label || key}</td>
                  <td className="py-2.5 px-3 font-medium text-[#1A1A1A]">{item.value || '—'}</td>
                  <td className="py-2.5 px-3 font-mono">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        confPercent >= 85
                          ? 'bg-emerald-50 text-[#16A34A]'
                          : confPercent >= 70
                          ? 'bg-amber-50 text-[#D97706]'
                          : 'bg-red-50 text-[#DC2626]'
                      }`}
                    >
                      {confPercent}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {item.needs_review ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-[#D97706] border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-[#D97706]" />
                        Needs Review
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                        <Check className="w-3 h-3 text-[#16A34A]" />
                        Verified
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] font-mono text-[#6B6B6B] max-w-[120px] truncate" title={bboxStr}>
                    {bboxStr}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data?.raw_text && (
        <div className="pt-2">
          <span className="text-xs font-semibold text-[#1A1A1A] block mb-1.5">Raw Extracted Text</span>
          <pre className="p-3 bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg text-xs font-mono text-[#1A1A1A] whitespace-pre-wrap max-h-40 overflow-y-auto">
            {data.raw_text}
          </pre>
        </div>
      )}
    </div>
  );
};

/**
 * Voice Call QA Domain Visualizer: Score Gauge, OJK Script Checklist, Speaker Timeline
 */
const VoiceDomainCard: React.FC<{ data: VoiceQAResult }> = ({ data }) => {
  const qaScore = data?.qa_score ?? 0;
  const isCompliant = qaScore >= 90;
  const scriptChecks = data?.script_adherence || [];
  const transcription = data?.transcription || { duration: 0, segments: [] };
  const segments = transcription.segments || [];

  return (
    <div className="space-y-4">
      {/* Compliance Score Gauge Card */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider block">
              OJK Tele-Verification QA Score
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#1A1A1A] font-mono">{qaScore.toFixed(1)}</span>
              <span className="text-sm font-semibold text-[#6B6B6B]">/ 100</span>
            </div>
            <div className="mt-1 text-xs">
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  isCompliant ? 'text-[#16A34A]' : 'text-[#DC2626]'
                }`}
              >
                {isCompliant ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                    OJK Compliant (&gt;= 90% Passing Threshold)
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                    Below OJK Compliance Standard (&lt; 90%)
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col sm:items-end gap-2 text-xs text-[#6B6B6B]">
            <span>Call Duration: <strong className="text-[#1A1A1A] font-semibold">{typeof transcription.duration === 'number' ? transcription.duration.toFixed(1) : transcription.duration}s</strong></span>
            <span>Acoustic Pauses: <strong className="text-[#D97706] font-semibold">{data.hesitation_count || 0} hesitation pause{data.hesitation_count !== 1 ? 's' : ''}</strong></span>
          </div>
        </div>
      </div>

      {/* 4-Stage OJK Script Checklist */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-xs space-y-3">
        <h4 className="text-sm font-bold text-[#1A1A1A]">OJK Regulatory Script Checklist</h4>
        <div className="space-y-2">
          {scriptChecks.map((check, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-xs flex items-start gap-3 ${
                check.passed
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : 'bg-red-50/40 border-red-200'
              }`}
            >
              {check.passed ? (
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1A1A1A]">{check.description}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      check.passed
                        ? 'bg-emerald-100 text-[#16A34A]'
                        : 'bg-red-100 text-[#DC2626]'
                    }`}
                  >
                    {check.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
                {check.matched_utterance && (
                  <p className="mt-1 text-[#6B6B6B] italic font-mono text-[11px] bg-white/70 p-1.5 rounded border border-black/5">
                    &ldquo;{check.matched_utterance}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Speaker-Attributed Dialogue Timeline */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
          <h4 className="text-sm font-bold text-[#1A1A1A]">Speaker Dialogue Timeline</h4>
          <span className="text-xs text-[#6B6B6B]">{segments.length} Utterances</span>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {segments.map((seg) => {
            const isAgent = seg.speaker === 'agent';
            return (
              <div
                key={seg.id}
                className={`flex gap-3 text-xs ${isAgent ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-3 border ${
                    isAgent
                      ? 'bg-blue-50/50 border-blue-200 text-blue-950'
                      : 'bg-[#F7F7F5] border-[#E5E5E3] text-[#1A1A1A]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] mb-1 font-mono text-[#6B6B6B]">
                    <span className="font-bold uppercase tracking-wider">
                      {isAgent ? 'Agent (BAF Verifier)' : 'Customer (Applicant)'}
                    </span>
                    <span>
                      {seg.start?.toFixed(1)}s - {seg.end?.toFixed(1)}s
                    </span>
                  </div>
                  <div className="text-xs leading-relaxed">{seg.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * General Document OCR Domain Visualizer: Bounding Boxes & Extracted Lines
 */
const GeneralDomainCard: React.FC<{
  data: GeneralOcrResult;
  onCopyText: (text: string) => void;
  copiedText: boolean;
}> = ({ data, onCopyText, copiedText }) => {
  const lines = data?.lines || [];
  const fullText = data?.full_text || lines.map((l) => l.text).join('\n');

  return (
    <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
        <div>
          <h4 className="text-sm font-bold text-[#1A1A1A]">Extracted Document Lines &amp; Bounding Boxes</h4>
          <span className="text-xs text-[#6B6B6B]">
            Total Lines Detected: <strong className="text-[#1A1A1A] font-semibold">{data?.total_lines ?? lines.length}</strong>
          </span>
        </div>
        {fullText && (
          <button
            type="button"
            onClick={() => onCopyText(fullText)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E3] bg-white hover:bg-[#F7F7F5] text-xs font-medium text-[#1A1A1A]"
          >
            {copiedText ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                <span className="text-[#16A34A]">Copied Full Text</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span>Copy Full Text</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {lines.map((line, idx) => {
          const confPercent = Math.round(line.confidence <= 1 ? line.confidence * 100 : line.confidence);
          return (
            <div
              key={idx}
              className="p-3 bg-[#FAFAFA] border border-[#E5E5E3] rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-[11px] font-mono text-[#6B6B6B] w-6 shrink-0 mt-0.5">#{idx + 1}</span>
                <span className="font-semibold text-[#1A1A1A] break-words">{line.text}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-100">
                  {confPercent}%
                </span>
                <span className="text-[#6B6B6B] truncate max-w-[120px]" title={JSON.stringify(line.bbox)}>
                  {JSON.stringify(line.bbox)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {fullText && (
        <div className="pt-2 border-t border-[#E5E5E3]">
          <span className="text-xs font-semibold text-[#1A1A1A] block mb-1">Full Extracted Text Buffer</span>
          <pre className="p-3 bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg text-xs font-mono text-[#1A1A1A] whitespace-pre-wrap max-h-36 overflow-y-auto">
            {fullText}
          </pre>
        </div>
      )}
    </div>
  );
};

/**
 * Table Detection & Extraction Domain Visualizer: HTML Table, Zebra Striping & CSV/JSON Export
 */
const TableDomainCard: React.FC<{ data: TableExtractionResult }> = ({ data }) => {
  const [copiedCsvIdx, setCopiedCsvIdx] = useState<number | null>(null);
  const [copiedJsonIdx, setCopiedJsonIdx] = useState<number | null>(null);

  const tables = data?.tables || [];
  const tablesCount = data?.tables_found ?? tables.length;

  if (!data || tablesCount === 0 || tables.length === 0) {
    return (
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-8 text-center shadow-xs space-y-2">
        <div className="w-10 h-10 rounded-full bg-amber-50 text-[#D97706] flex items-center justify-center mx-auto mb-2">
          <TableIcon className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-[#1A1A1A]">No Tables Detected</h4>
        <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
          The table detection model could not identify any tabular structures or grid cells in this document.
        </p>
      </div>
    );
  }

  const handleCopyCsv = async (table: ExtractedTable, idx: number) => {
    const escapeCsv = (val: unknown) => {
      const str = val == null ? '' : String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const lines: string[] = [];
    if (table.headers && table.headers.length > 0) {
      lines.push(table.headers.map(escapeCsv).join(','));
    }
    if (table.rows && table.rows.length > 0) {
      for (const row of table.rows) {
        lines.push(row.map(escapeCsv).join(','));
      }
    }
    const csvContent = lines.join('\n');
    try {
      await navigator.clipboard.writeText(csvContent);
      setCopiedCsvIdx(idx);
      setTimeout(() => setCopiedCsvIdx(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyTableJson = async (table: ExtractedTable, idx: number) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(table, null, 2));
      setCopiedJsonIdx(idx);
      setTimeout(() => setCopiedJsonIdx(null), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Count & Overview Header */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
          <div className="flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-[#2563EB]" />
            <h4 className="text-sm font-bold text-[#1A1A1A]">Extracted Tables</h4>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-md bg-blue-50 text-[#2563EB] border border-blue-100 font-semibold">
            {tablesCount} Table{tablesCount !== 1 ? 's' : ''} Detected
          </span>
        </div>

        {/* Render each extracted table */}
        <div className="space-y-6">
          {tables.map((table, tIdx) => {
            const isCopiedCsv = copiedCsvIdx === tIdx;
            const isCopiedJson = copiedJsonIdx === tIdx;

            return (
              <div key={table.table_idx ?? tIdx} className="border border-[#E5E5E3] rounded-lg overflow-hidden bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#F7F7F5] border-b border-[#E5E5E3]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1A1A1A]">
                      Table #{tIdx + 1}
                    </span>
                    <span className="text-[11px] font-mono text-[#6B6B6B] px-2 py-0.5 rounded bg-white border border-[#E5E5E3]">
                      {table.num_rows} rows &times; {table.num_cols} cols
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyCsv(table, tIdx)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-[#E5E5E3] hover:bg-gray-50 text-xs font-medium text-[#1A1A1A] transition-colors"
                    >
                      {isCopiedCsv ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                          <span className="text-[#16A34A]">Copied CSV!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#6B6B6B]" />
                          <span>Copy CSV</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyTableJson(table, tIdx)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-[#E5E5E3] hover:bg-gray-50 text-xs font-medium text-[#1A1A1A] transition-colors"
                    >
                      {isCopiedJson ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                          <span className="text-[#16A34A]">Copied JSON!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#6B6B6B]" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    {table.headers && table.headers.length > 0 && (
                      <thead className="bg-[#FAFAFA] border-b border-[#E5E5E3] text-[#1A1A1A] font-semibold">
                        <tr>
                          {table.headers.map((header, hIdx) => (
                            <th key={hIdx} className="py-2.5 px-3 border-r border-[#E5E5E3] last:border-r-0 font-bold bg-[#F0F0EE]">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody className="divide-y divide-[#E5E5E3]">
                      {table.rows && table.rows.length > 0 ? (
                        table.rows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className={`transition-colors hover:bg-blue-50/20 ${
                              rIdx % 2 === 0 ? 'bg-white' : 'bg-[#F7F7F5]'
                            }`}
                          >
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className="py-2.5 px-3 border-r border-[#E5E5E3] last:border-r-0 text-[#1A1A1A]"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={Math.max(1, table.headers?.length || 1)}
                            className="py-4 px-3 text-center text-[#6B6B6B] italic"
                          >
                            No data rows extracted for this table.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {data?.raw_text && (
          <div className="pt-2 border-t border-[#E5E5E3]">
            <span className="text-xs font-semibold text-[#1A1A1A] block mb-1.5">Raw Tabular Text</span>
            <pre className="p-3 bg-[#F7F7F5] border border-[#E5E5E3] rounded-lg text-xs font-mono text-[#1A1A1A] whitespace-pre-wrap max-h-40 overflow-y-auto">
              {data.raw_text}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
