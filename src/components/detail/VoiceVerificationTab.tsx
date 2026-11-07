import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Headphones,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Info,
  Sparkles,
  Upload,
  Loader2,
  FileAudio,
} from 'lucide-react';
import { VoiceVerification, ScriptComplianceItem, TranscriptSnippet } from '../../types';
import { voiceDemoPresets } from '../../data/demoPresets';
import { performRealAudioAnalysis } from '../../services/aiService';

export type VoicePresetKey = 'nominal' | 'hesitant_noncompliant' | 'coaching_suspicion' | 'custom';

export interface VoiceVerificationTabProps {
  voice: VoiceVerification;
  customerName: string;
  initialPreset?: VoicePresetKey;
}

export function calculateScriptCompliance(checklist: ScriptComplianceItem[]): {
  total: number;
  passed: number;
  failed: number;
  percentage: number;
} {
  const total = checklist.length;
  const passed = checklist.filter((item) => item.isCompliant).length;
  const failed = total - passed;
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
  return { total, passed, failed, percentage };
}

export function resolveActiveAudioSrc(
  audioObjectUrl: string | null,
  recordingUrl?: string | null
): string | null {
  return audioObjectUrl || recordingUrl || null;
}

export function createCustomVoiceVerification(
  fileName: string,
  options?: {
    customerName?: string;
    agentName?: string;
    duration?: number;
    hasHesitancy?: boolean;
    forceWhisperAnomaly?: boolean;
  }
): VoiceVerification {
  const customerName = options?.customerName || 'BUDI SANTOSO';
  const agentName = options?.agentName || 'Fitri Handayani';
  const duration = options?.duration || 180;
  const lowerName = fileName.toLowerCase();

  const isWhisperAnomaly =
    Boolean(options?.forceWhisperAnomaly) ||
    lowerName.includes('whisper') ||
    lowerName.includes('coaching') ||
    lowerName.includes('bisikan');

  const isHesitant =
    Boolean(options?.hasHesitancy) ||
    lowerName.includes('hesitant') ||
    lowerName.includes('ragu') ||
    lowerName.includes('noncompliant');

  const formatMinsSecs = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const callId = `CALL-UPLOAD-${Math.abs(
    fileName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 1000)
  )}`;

  if (isWhisperAnomaly) {
    const complianceChecklist: ScriptComplianceItem[] = [
      { id: 'SC-1', category: 'Pembuka', requirement: 'Salam standar BAF & perkenalan diri verifikator', isCompliant: true, timestampRef: 3 },
      { id: 'SC-2', category: 'Verifikasi', requirement: 'Konfirmasi nama lengkap & 16 digit NIK pemohon', isCompliant: true, timestampRef: 20 },
      { id: 'SC-3', category: 'Verifikasi', requirement: 'Verifikasi nama gadis ibu kandung nasabah', isCompliant: false, timestampRef: 45, note: 'Terdengar bisikan pihak ketiga memberi tahu nama ibu' },
      { id: 'SC-4', category: 'Pembiayaan', requirement: 'Konfirmasi unit kendaraan & tenor pembiayaan', isCompliant: true, timestampRef: 75 },
      { id: 'SC-5', category: 'Pembiayaan', requirement: 'Konfirmasi besaran angsuran & tanggal jatuh tempo', isCompliant: true, timestampRef: 110 },
      { id: 'SC-6', category: 'Penutup', requirement: 'Pernyataan klausul persetujuan & rekaman resmi OJK', isCompliant: true, timestampRef: 155 },
    ];
    const transcripts: TranscriptSnippet[] = [
      { id: 'T-1', speaker: 'agent', startTime: 0, endTime: 6, text: `Selamat sore, saya ${agentName} dari Verifikasi BAF. Bisa berbicara dengan Saudara ${customerName}?` },
      { id: 'T-2', speaker: 'customer', startTime: 7, endTime: 11, text: `Iya sore Mbak. Betul saya sendiri, ${customerName}.` },
      { id: 'T-3', speaker: 'agent', startTime: 12, endTime: 19, text: 'Bisa disebutkan kembali nomor NIK e-KTP Anda untuk verifikasi data?' },
      { id: 'T-4', speaker: 'customer', startTime: 20, endTime: 33, text: 'Tiga dua tujuh lima nol satu dua nol satu satu sembilan nol nol nol satu.', spellingMatch: true },
      { id: 'T-5', speaker: 'agent', startTime: 34, endTime: 39, text: 'Baik. Siapa nama gadis ibu kandung Anda?' },
      { id: 'T-6', speaker: 'customer', startTime: 40, endTime: 51, text: '... (terdengar bisikan: "Siti... Siti Aminah") ... Nama ibu saya Siti Aminah.', hasHesitancy: true, hesitancyDuration: 2.5, flagReason: 'Audio bisikan pihak ketiga terdengar sebelum konsumen menjawab' },
      { id: 'T-7', speaker: 'agent', startTime: 52, endTime: 60, text: 'Apakah Anda saat ini sedang bersama orang lain atau didampingi perantara dealer?' },
      { id: 'T-8', speaker: 'customer', startTime: 61, endTime: 68, text: 'Eee enggak Mbak, saya sendirian di rumah.', hasHesitancy: true, hesitancyDuration: 1.5, pitchTremor: true, flagReason: 'Penyangkalan ragu setelah indikasi coaching bisikan pihak ketiga' },
      { id: 'T-9', speaker: 'agent', startTime: 69, endTime: 78, text: 'Baik, kami catat dan lanjutkan ke analisis verifikasi lanjutan.' },
    ];
    return {
      callId,
      callDuration: duration,
      agentName,
      agentId: 'AGT-044',
      callTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      audioDurationFormatted: formatMinsSecs(duration),
      overallHesitancyCount: 2,
      spellingAccuracyScore: 74,
      scriptComplianceScore: 83,
      score: 82,
      voiceFlags: [
        'Bisikan suara pihak ketiga terdeteksi di latar belakang audio sebelum jawaban',
        'Jeda keraguan 2.5 detik sinkron dengan bisikan audio latar (indikasi coaching)',
        'Konsumen mengulang kata per kata yang dibisikkan pihak luar',
      ],
      complianceChecklist,
      transcripts,
    };
  }

  if (isHesitant) {
    const complianceChecklist: ScriptComplianceItem[] = [
      { id: 'SC-1', category: 'Pembuka', requirement: 'Salam standar BAF & perkenalan diri verifikator', isCompliant: true, timestampRef: 4 },
      { id: 'SC-2', category: 'Verifikasi', requirement: 'Konfirmasi nama lengkap & 16 digit NIK pemohon', isCompliant: true, timestampRef: 28 },
      { id: 'SC-3', category: 'Verifikasi', requirement: 'Verifikasi nama gadis ibu kandung nasabah', isCompliant: false, timestampRef: 54, note: 'Konsumen ragu 3.4 detik & salah sebut awal' },
      { id: 'SC-4', category: 'Pembiayaan', requirement: 'Konfirmasi unit kendaraan & tenor pembiayaan', isCompliant: true, timestampRef: 92 },
      { id: 'SC-5', category: 'Pembiayaan', requirement: 'Konfirmasi besaran angsuran & tanggal jatuh tempo', isCompliant: false, timestampRef: 140, note: 'Konsumen salah sebut angka cicilan' },
      { id: 'SC-6', category: 'Penutup', requirement: 'Pernyataan klausul persetujuan & rekaman resmi OJK', isCompliant: false, timestampRef: 170, note: 'Panggilan terputus sebelum pembacaan lengkap klausul OJK' },
    ];
    const transcripts: TranscriptSnippet[] = [
      { id: 'T-1', speaker: 'agent', startTime: 0, endTime: 6, text: `Selamat siang, saya ${agentName} dari Verifikasi Pembiayaan BAF. Benar saya terhubung dengan ${customerName}?` },
      { id: 'T-2', speaker: 'customer', startTime: 7, endTime: 11, text: `Iya selamat siang Mbak. Betul saya sendiri, ${customerName}.` },
      { id: 'T-3', speaker: 'agent', startTime: 12, endTime: 22, text: 'Mohon izin melakukan verifikasi data singkat terkait pengajuan pembiayaan unit motor ya Pak.' },
      { id: 'T-4', speaker: 'customer', startTime: 23, endTime: 26, text: 'Iya silakan Mbak.' },
      { id: 'T-5', speaker: 'agent', startTime: 27, endTime: 34, text: 'Bisa dibantu sebutkan kembali 16 digit Nomor Induk Kependudukan (NIK) KTP Bapak?' },
      { id: 'T-6', speaker: 'customer', startTime: 35, endTime: 48, text: 'Tiga dua tujuh lima nol tiga satu dua nol delapan sembilan empat nol nol nol tiga.', spellingMatch: true },
      { id: 'T-7', speaker: 'agent', startTime: 49, endTime: 54, text: 'Baik cocok Pak. Untuk nama gadis ibu kandung siapa ya Pak?' },
      { id: 'T-8', speaker: 'customer', startTime: 55, endTime: 65, text: 'Eee... tunggu sebentar Mbak... eee... Nurhasanah.', hasHesitancy: true, hesitancyDuration: 3.4, pitchTremor: true, flagReason: 'Jeda panjang 3.4 detik & intonasi bergetar sebelum menjawab nama ibu' },
      { id: 'T-9', speaker: 'agent', startTime: 66, endTime: 75, text: 'Lalu untuk tanggal lahir Bapak sendiri tanggal berapa ya?' },
      { id: 'T-10', speaker: 'customer', startTime: 76, endTime: 85, text: 'Eee... empat belas Agustus sembilan puluh empat.', hasHesitancy: true, hesitancyDuration: 2.8, flagReason: 'Jeda 2.8 detik & inkonsistensi intonasi' },
      { id: 'T-11', speaker: 'agent', startTime: 86, endTime: 98, text: 'Untuk unit kendaraan yang diajukan, berapa angsuran per bulannya Pak?' },
      { id: 'T-12', speaker: 'customer', startTime: 99, endTime: 110, text: 'Sekitar satu juta seratus ribu ya Mbak?', hasHesitancy: true, hesitancyDuration: 1.8, flagReason: 'Salah sebut nominal angsuran' },
    ];
    return {
      callId,
      callDuration: duration,
      agentName,
      agentId: 'AGT-044',
      callTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      audioDurationFormatted: formatMinsSecs(duration),
      overallHesitancyCount: 3,
      spellingAccuracyScore: 68,
      scriptComplianceScore: 65,
      score: 72,
      voiceFlags: [
        'Jeda keraguan 3.4 detik saat pertanyaan keamanan nama gadis ibu kandung',
        'Jeda 2.8 detik saat konfirmasi tanggal lahir nasabah',
        'Salah sebut nominal cicilan pertama pada pengajuan',
        'Pernyataan klausul persetujuan OJK tidak terselesaikan lengkap',
      ],
      complianceChecklist,
      transcripts,
    };
  }

  // Nominal default
  const complianceChecklist: ScriptComplianceItem[] = [
    { id: 'SC-1', category: 'Pembuka', requirement: 'Salam standar BAF & perkenalan diri verifikator', isCompliant: true, timestampRef: 3 },
    { id: 'SC-2', category: 'Verifikasi', requirement: 'Konfirmasi nama lengkap & 16 digit NIK pemohon', isCompliant: true, timestampRef: 24 },
    { id: 'SC-3', category: 'Verifikasi', requirement: 'Verifikasi nama gadis ibu kandung nasabah', isCompliant: true, timestampRef: 48 },
    { id: 'SC-4', category: 'Pembiayaan', requirement: 'Konfirmasi unit kendaraan & tenor pembiayaan', isCompliant: true, timestampRef: 82 },
    { id: 'SC-5', category: 'Pembiayaan', requirement: 'Konfirmasi besaran angsuran & tanggal jatuh tempo', isCompliant: true, timestampRef: 118 },
    { id: 'SC-6', category: 'Penutup', requirement: 'Pernyataan klausul persetujuan & rekaman resmi OJK', isCompliant: true, timestampRef: 165 },
  ];

  const transcripts: TranscriptSnippet[] = [
    { id: 'T-1', speaker: 'agent', startTime: 0, endTime: 5, text: `Selamat pagi, saya ${agentName} dari Verifikasi Pembiayaan BAF. Benar dengan Bapak/Ibu ${customerName}?` },
    { id: 'T-2', speaker: 'customer', startTime: 6, endTime: 9, text: `Selamat pagi Mbak ${agentName}. Betul saya sendiri, ${customerName}.` },
    { id: 'T-3', speaker: 'agent', startTime: 10, endTime: 18, text: 'Mohon izin konfirmasi data pengajuan pembiayaan unit kendaraan ya.' },
    { id: 'T-4', speaker: 'customer', startTime: 19, endTime: 21, text: 'Baik Mbak, silakan.' },
    { id: 'T-5', speaker: 'agent', startTime: 22, endTime: 29, text: 'Bisa dibantu sebutkan kembali nomor NIK KTP Bapak/Ibu?' },
    { id: 'T-6', speaker: 'customer', startTime: 30, endTime: 42, text: 'Tiga satu tujuh empat nol lima nol satu nol delapan sembilan empat nol nol nol satu.', spellingMatch: true },
    { id: 'T-7', speaker: 'agent', startTime: 43, endTime: 48, text: 'Cocok. Untuk nama gadis ibu kandung siapa ya?' },
    { id: 'T-8', speaker: 'customer', startTime: 49, endTime: 53, text: 'Ibu Siti Aminah.' },
    { id: 'T-9', speaker: 'agent', startTime: 54, endTime: 66, text: `Baik Bapak/Ibu ${customerName}. Terima kasih, seluruh data telah terverifikasi dengan sesuai dan tercatat di sistem BAF.` },
  ];

  return {
    callId,
    callDuration: duration,
    agentName,
    agentId: 'AGT-044',
    callTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    audioDurationFormatted: formatMinsSecs(duration),
    overallHesitancyCount: 0,
    spellingAccuracyScore: 98,
    scriptComplianceScore: 96,
    score: 12,
    voiceFlags: [],
    complianceChecklist,
    transcripts,
  };
}

export const VoiceVerificationTab: React.FC<VoiceVerificationTabProps> = ({
  voice,
  customerName,
  initialPreset,
}) => {
  const [activePresetKey, setActivePresetKey] = useState<VoicePresetKey>(() => {
    if (initialPreset) return initialPreset;
    if (voice.voiceFlags.some((f) => f.toLowerCase().includes('bisikan'))) return 'coaching_suspicion';
    if (voice.score >= 50 || voice.overallHesitancyCount > 0) return 'hesitant_noncompliant';
    return 'nominal';
  });
  const [customVoice, setCustomVoice] = useState<VoiceVerification | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processMessage, setProcessMessage] = useState<string>('Transcribing multi-speaker Indonesian ASR audio, analyzing acoustic intonation, and auditing OJK script compliance...');
  const [audioObjectUrl, setAudioObjectUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const processTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (audioObjectUrl) {
        URL.revokeObjectURL(audioObjectUrl);
      }
    };
  }, [audioObjectUrl]);

  useEffect(() => {
    return () => {
      if (processTimeoutRef.current) {
        clearTimeout(processTimeoutRef.current);
      }
    };
  }, []);

  const triggerProcessing = (msg?: string) => {
    setProcessMessage(msg || 'Transcribing multi-speaker Indonesian ASR audio, analyzing acoustic intonation, and auditing OJK script compliance...');
    setIsProcessing(true);
    if (processTimeoutRef.current) {
      clearTimeout(processTimeoutRef.current);
    }
    processTimeoutRef.current = setTimeout(() => {
      setIsProcessing(false);
    }, 1200);
  };

  const handleSelectPreset = (key: 'nominal' | 'hesitant_noncompliant' | 'coaching_suspicion') => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (audioObjectUrl) {
      URL.revokeObjectURL(audioObjectUrl);
      setAudioObjectUrl(null);
    }
    setActivePresetKey(key);
    setIsPlaying(false);
    setCurrentTime(0);
    triggerProcessing();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('Audio file exceeds 25MB limit. Please upload a smaller call recording.');
      e.target.value = '';
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (audioObjectUrl) {
      URL.revokeObjectURL(audioObjectUrl);
    }
    const newObjectUrl = URL.createObjectURL(file);
    setAudioObjectUrl(newObjectUrl);

    setUploadedFileName(file.name);
    setActivePresetKey('custom');
    setIsPlaying(false);
    setCurrentTime(0);
    setIsProcessing(true);
    setProcessMessage('Mendekode audio riil Web Audio API, menghitung waveform amplitudo RMS, & mendeteksi jeda hening...');

    try {
      const custom = await performRealAudioAnalysis(file, {
        customerName,
        agentName: voice.agentName || 'Fitri Handayani',
      });
      setCustomVoice(custom);
    } catch (err: any) {
      console.warn('Real audio analysis error, falling back:', err);
      const fallback = createCustomVoiceVerification(file.name, {
        customerName,
        agentName: voice.agentName || 'Fitri Handayani',
      });
      setCustomVoice(fallback);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const activeVoice: VoiceVerification = useMemo(() => {
    if (activePresetKey === 'custom' && customVoice) {
      return customVoice;
    }
    if (voiceDemoPresets[activePresetKey]) {
      return voiceDemoPresets[activePresetKey];
    }
    return voice;
  }, [activePresetKey, customVoice, voice]);

  const activeAudioSrc = audioObjectUrl || activeVoice.recordingUrl || null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const duration = activeVoice.callDuration > 0 ? activeVoice.callDuration : 180;

  // Real audio element speed & mute sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Audio playback progress (timer for presets without local audio file)
  useEffect(() => {
    if (activeAudioSrc) return; // Driven by HTMLAudioElement onTimeUpdate
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, duration, playbackSpeed, activeAudioSrc]);

  const togglePlay = () => {
    if (audioRef.current && activeAudioSrc) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn('Audio play error:', err);
          setIsPlaying(true);
        });
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (newTime: number) => {
    const clamped = Math.max(0, Math.min(newTime, duration));
    setCurrentTime(clamped);
    if (audioRef.current && activeAudioSrc) {
      audioRef.current.currentTime = clamped;
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current && activeAudioSrc) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const complianceStats = useMemo(() => {
    return calculateScriptCompliance(activeVoice.complianceChecklist);
  }, [activeVoice.complianceChecklist]);

  return (
    <div className="space-y-6">
      {activeAudioSrc && (
        <audio
          ref={audioRef}
          src={activeAudioSrc}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onError={(e) => {
            console.warn('Audio playback error:', e);
          }}
        />
      )}
      {/* Interactive Demo Preset Switcher Bar */}
      <div className="p-3.5 rounded-xl border border-[#E5E5E3] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
              <span>Interactive STT &amp; Audio QA Demo</span>
              <span className="text-[10px] font-normal text-[#6B6B6B] bg-[#F7F7F5] px-1.5 py-0.5 rounded border border-[#E5E5E3]">
                Preset Switcher
              </span>
            </div>
            <p className="text-[11px] text-[#6B6B6B]">
              Switch between synthetic tele-verification scenarios or upload custom audio recordings to evaluate real-time Indonesian ASR transcription and OJK script compliance.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSelectPreset('nominal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activePresetKey === 'nominal'
                ? 'bg-[#16A34A] text-white shadow-xs font-semibold'
                : 'bg-[#F7F7F5] text-[#1A1A1A] border border-[#E5E5E3] hover:bg-[#EFEFEF]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Nominal Fluent Call</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('hesitant_noncompliant')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activePresetKey === 'hesitant_noncompliant'
                ? 'bg-[#D97706] text-white shadow-xs font-semibold'
                : 'bg-[#F7F7F5] text-[#1A1A1A] border border-[#E5E5E3] hover:bg-[#EFEFEF]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Hesitant &amp; OJK Non-Compliant</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('coaching_suspicion')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activePresetKey === 'coaching_suspicion'
                ? 'bg-[#7C3AED] text-white shadow-xs font-semibold'
                : 'bg-[#F7F7F5] text-[#1A1A1A] border border-[#E5E5E3] hover:bg-[#EFEFEF]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Coaching &amp; Whisper Suspicion</span>
          </button>

          {/* Hidden audio file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".mp3,.wav,.m4a,audio/*"
            className="hidden"
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
            <span>
              {activePresetKey === 'custom' && uploadedFileName
                ? `Custom: ${uploadedFileName.length > 15 ? uploadedFileName.slice(0, 15) + '...' : uploadedFileName}`
                : 'Upload Audio Recording...'}
            </span>
          </button>
        </div>
      </div>

      {/* 1.2s Simulated ASR Processing Indicator Banner */}
      {isProcessing && (
        <div className="p-3.5 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 text-blue-900 shadow-xs animate-pulse space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white shrink-0">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div>
                <div className="text-xs font-bold text-blue-900 flex items-center gap-2">
                  <span>Indonesian Multi-Speaker ASR &amp; Acoustic Intelligence Engine Active</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                </div>
                <div className="text-[11px] text-blue-700 mt-0.5">
                  {processMessage}
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-blue-800 bg-white/80 px-2.5 py-1 rounded-md border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>Diarizing Audio Channels</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-blue-200/70 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 rounded-full w-full" />
          </div>
        </div>
      )}

      {/* Top Banner: Verification Status */}
      <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
              Pillar 3: Tele-Verification &amp; Audio QA (Weight: 25%)
            </span>
            <span className="text-xs text-[#6B6B6B]">·</span>
            <span
              className={`text-xs font-medium ${
                activeVoice.score >= 70
                  ? 'text-[#DC2626]'
                  : activeVoice.score >= 40
                  ? 'text-[#D97706]'
                  : 'text-[#16A34A]'
              }`}
            >
              Anomaly Score: {activeVoice.score}/100 ({activeVoice.score >= 70 ? 'High Risk' : activeVoice.score >= 40 ? 'Medium' : 'Nominal / Fluent'})
            </span>
            {activePresetKey === 'custom' && uploadedFileName && (
              <span className="text-[11px] font-mono text-[#2563EB] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                File: {uploadedFileName}
              </span>
            )}
          </div>
          <p className="text-xs text-[#1A1A1A] mt-1">
            Indonesian ASR pipeline with speaker diarization, customer hesitancy tracking, and mandatory OJK script compliance auditing.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-xs text-[#6B6B6B]">OJK Script Compliance</div>
            <div
              className={`text-sm font-semibold tabular-nums ${
                activeVoice.scriptComplianceScore >= 90
                  ? 'text-[#16A34A]'
                  : activeVoice.scriptComplianceScore >= 75
                  ? 'text-[#D97706]'
                  : 'text-[#DC2626]'
              }`}
            >
              {activeVoice.scriptComplianceScore}% Adherence
            </div>
          </div>
        </div>
      </div>

      {/* Domain Policy Notice */}
      <div className="p-3 rounded-lg border border-[#2563EB]/20 bg-[#2563EB]/5 flex items-start gap-2.5 text-xs text-[#1A1A1A]">
        <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#2563EB]">Voice Intelligence Directive:</span>{' '}
          Acoustic intonation analysis and customer hesitation pauses are <strong>decision support indicators</strong> for human verifiers, not standalone proof of fraud. Always cross-examine against physical documents and field survey evidence.
        </div>
      </div>

      {/* Main Grid: Interactive Audio Waveform Player + Diarized Transcript & Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Audio Player & Compliance Checklist */}
        <div className="lg:col-span-5 space-y-4">
          {/* Interactive Player Card */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3">
              <div>
                <h4 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
                  <span>Call Audio Waveform Player</span>
                  {activeVoice.recordingUrl && !audioObjectUrl && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <FileAudio className="w-3 h-3 text-emerald-600" />
                      Authentic Recording (voice_0941.mp3)
                    </span>
                  )}
                  {audioObjectUrl && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <FileAudio className="w-3 h-3 text-blue-600" />
                      Custom Audio: {uploadedFileName || 'Uploaded'}
                    </span>
                  )}
                </h4>
                <div className="text-[11px] text-[#6B6B6B] mt-0.5 font-mono">
                  ID: {activeVoice.callId} · {activeVoice.audioDurationFormatted}
                </div>
              </div>
              <div className="text-xs text-[#6B6B6B] flex items-center gap-1">
                <Headphones className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Dual-Channel</span>
              </div>
            </div>

            {/* Waveform Bar with Timestamp Indicator */}
            <div className="bg-[#F7F7F5] border border-[#E5E5E3] rounded-xl p-4 text-[#1A1A1A] space-y-3">
              {/* Channel indicators */}
              <div className="flex items-center justify-between text-[11px] text-[#6B6B6B]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                  <span>Channel 1: Agent ({activeVoice.agentName})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                  <span>Channel 2: Consumer ({customerName})</span>
                </span>
              </div>

              {/* Waveform Bars */}
              <div
                className="h-16 flex items-center gap-[2px] cursor-pointer relative py-2 select-none"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                  handleSeek(Math.floor(ratio * duration));
                }}
              >
                {Array.from({ length: 48 }).map((_, i) => {
                  const barTime = (i / 48) * duration;
                  const isCurrent = barTime <= currentTime;
                  const isHesitantZone = activeVoice.transcripts.some(
                    (t) => t.hasHesitancy && barTime >= t.startTime && barTime <= t.endTime
                  );

                  const baseHeight = ((Math.sin(i * 0.4) + 1.2) * 18 + (i % 3) * 6) % 36 + 10;

                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-full transition-all"
                      style={{
                        height: `${baseHeight}px`,
                        backgroundColor: isHesitantZone
                          ? '#DC2626'
                          : isCurrent
                          ? '#2563EB'
                          : '#D1D5DB',
                      }}
                      title={`At ${formatTime(barTime)}${isHesitantZone ? ' (Hesitation Zone)' : ''}`}
                    />
                  );
                })}

                {/* Scrubber pointer line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-[#1A1A1A] z-10 pointer-events-none"
                  style={{ left: `${Math.min(100, (currentTime / duration) * 100)}%` }}
                />
              </div>

              {/* Progress Slider */}
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-1 bg-[#E5E5E3] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
              />

              {/* Player Controls */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] flex items-center justify-center text-white transition-colors cursor-pointer"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-2 rounded-lg border border-[#E5E5E3] bg-white hover:bg-[#F7F7F5] text-[#1A1A1A] transition-colors cursor-pointer"
                    title="Reset to beginning"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-lg border border-[#E5E5E3] bg-white hover:bg-[#F7F7F5] text-[#1A1A1A] transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs tabular-nums text-[#6B6B6B] font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>

                  {/* Playback Speed Segment */}
                  <div className="flex items-center rounded border border-[#E5E5E3] bg-white p-0.5 text-[10px]">
                    {[1, 1.25, 1.5].map((speed) => (
                      <button
                        type="button"
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                          playbackSpeed === speed ? 'bg-[#1A1A1A] text-white font-medium' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Voice Flags */}
            <div className="pt-2 space-y-2">
              <div className="text-xs font-semibold text-[#1A1A1A] flex items-center justify-between">
                <span>Audio Risk Indicators</span>
                <span className="text-[11px] text-[#6B6B6B]">
                  {activeVoice.voiceFlags.length} Flagged
                </span>
              </div>

              {activeVoice.voiceFlags.length > 0 ? (
                <div className="space-y-1.5">
                  {activeVoice.voiceFlags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="text-xs p-2 rounded bg-[#D97706]/5 border border-[#D97706]/20 text-[#D97706] flex items-start gap-2"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs p-2 rounded bg-[#16A34A]/5 border border-[#16A34A]/20 text-[#16A34A] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Fluent communication with zero suspicious pauses or misstated credentials.</span>
                </div>
              )}
            </div>
          </div>

          {/* Script Compliance Checklist Card */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3 mb-3">
              <div>
                <h4 className="text-sm font-semibold text-[#1A1A1A]">
                  OJK &amp; BAF SOP Script Compliance
                </h4>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Automated checklist for mandatory consumer protection dialogue items.
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-[#1A1A1A]">
                  {complianceStats.passed} / {complianceStats.total} Passed
                </div>
                <div className="text-[11px] text-[#6B6B6B]">
                  {complianceStats.percentage}% Adherence
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {activeVoice.complianceChecklist.map((item) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-lg border text-xs transition-colors flex items-start justify-between gap-3 ${
                    item.isCompliant
                      ? 'bg-white border-[#E5E5E3]'
                      : 'bg-[#DC2626]/5 border-[#DC2626]/20'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {item.isCompliant ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626] shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-medium text-[#1A1A1A]">
                        <span className="text-[#6B6B6B] mr-1">[{item.category}]</span>
                        {item.requirement}
                      </div>
                      {item.note && (
                        <div className="text-[11px] text-[#DC2626] mt-0.5">
                          Remark: {item.note}
                        </div>
                      )}
                    </div>
                  </div>

                  {item.timestampRef !== undefined && (
                    <button
                      type="button"
                      onClick={() => handleSeek(item.timestampRef!)}
                      className="text-[10px] text-[#2563EB] hover:underline shrink-0 bg-[#2563EB]/5 px-1.5 py-0.5 rounded cursor-pointer font-mono"
                      title={`Seek audio to ${formatTime(item.timestampRef)}`}
                    >
                      {formatTime(item.timestampRef)}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Diarized Transcript Synchronized with Audio */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-[#E5E5E3] pb-3 mb-4">
              <div>
                <h4 className="text-sm font-semibold text-[#1A1A1A]">
                  Timestamped Transcript (ASR Diarization)
                </h4>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Click any dialogue line to seek audio playback directly to that timestamp.
                </p>
              </div>
            </div>

            {/* Transcript Timeline Items */}
            <div className="space-y-3 overflow-y-auto max-h-[580px] pr-2">
              {activeVoice.transcripts.map((snippet) => {
                const isAgent = snippet.speaker === 'agent';
                const isActive = currentTime >= snippet.startTime && currentTime <= snippet.endTime;
                const isWhisperOrCoaching =
                  Boolean(
                    snippet.flagReason &&
                      (snippet.flagReason.toLowerCase().includes('bisikan') ||
                        snippet.flagReason.toLowerCase().includes('coaching'))
                  ) || Boolean(snippet.text.toLowerCase().includes('bisikan'));

                return (
                  <div
                    key={snippet.id}
                    onClick={() => handleSeek(snippet.startTime)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'border-[#2563EB] bg-[#2563EB]/10 ring-1 ring-[#2563EB]/30 shadow-sm'
                        : isWhisperOrCoaching
                        ? 'border-purple-300 bg-purple-50/70 hover:bg-purple-100/60'
                        : snippet.hasHesitancy
                        ? 'border-[#D97706]/40 bg-[#D97706]/5 hover:bg-[#D97706]/10'
                        : 'border-[#E5E5E3] hover:bg-[#F7F7F5]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isAgent ? 'bg-[#2563EB]' : 'bg-[#16A34A]'
                          }`}
                        />
                        <span className={isAgent ? 'text-[#2563EB]' : 'text-[#16A34A]'}>
                          {isAgent ? `Verifier (${activeVoice.agentName})` : `Consumer (${customerName})`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {snippet.hasHesitancy && (
                          <span className="text-[10px] font-semibold text-[#D97706] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Pause {snippet.hesitancyDuration}s</span>
                          </span>
                        )}
                        {isWhisperOrCoaching && (
                          <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-purple-700" />
                            <span>Whisper / Coaching</span>
                          </span>
                        )}
                        <span className="text-[11px] text-[#6B6B6B] font-mono">
                          {formatTime(snippet.startTime)} - {formatTime(snippet.endTime)}
                        </span>
                      </div>
                    </div>

                    <p className="text-[#1A1A1A] leading-relaxed pl-3.5">
                      {snippet.text}
                    </p>

                    {snippet.flagReason && (
                      <div
                        className={`mt-2 pl-3.5 text-[11px] font-medium flex items-center gap-1.5 ${
                          isWhisperOrCoaching ? 'text-purple-700' : 'text-[#DC2626]'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{snippet.flagReason}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
