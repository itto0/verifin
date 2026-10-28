import React, { useState, useEffect, useRef } from 'react';
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
  Info
} from 'lucide-react';
import { VoiceVerification } from '../../types';

interface VoiceVerificationTabProps {
  voice: VoiceVerification;
  customerName: string;
}

export const VoiceVerificationTab: React.FC<VoiceVerificationTabProps> = ({
  voice,
  customerName,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const duration = voice.callDuration; // in seconds

  // Simulated audio playback progress
  useEffect(() => {
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
  }, [isPlaying, duration, playbackSpeed]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Verification Status */}
      <div className="p-4 rounded-xl border border-[#E5E5E3] bg-[#F7F7F5] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
              Pillar 3: Tele-Verification &amp; Audio QA (Weight: 25%)
            </span>
            <span className="text-xs text-[#6B6B6B]">·</span>
            <span
              className={`text-xs font-medium ${
                voice.score >= 70
                  ? 'text-[#DC2626]'
                  : voice.score >= 40
                  ? 'text-[#D97706]'
                  : 'text-[#16A34A]'
              }`}
            >
              Anomaly Score: {voice.score}/100 ({voice.score >= 70 ? 'High Risk' : voice.score >= 40 ? 'Medium' : 'Nominal / Fluent'})
            </span>
          </div>
          <p className="text-xs text-[#1A1A1A] mt-1">
            Indonesian ASR pipeline with speaker diarization, customer hesitancy tracking, and mandatory OJK script compliance auditing.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-xs text-[#6B6B6B]">OJK Script Compliance</div>
            <div
              className={`text-sm font-semibold tabular-nums font-mono ${
                voice.scriptComplianceScore >= 90
                  ? 'text-[#16A34A]'
                  : voice.scriptComplianceScore >= 75
                  ? 'text-[#D97706]'
                  : 'text-[#DC2626]'
              }`}
            >
              {voice.scriptComplianceScore}% Adherence
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
                <h4 className="text-sm font-semibold text-[#1A1A1A]">
                  Call Audio Waveform Player
                </h4>
                <div className="text-[11px] text-[#6B6B6B] mt-0.5 font-mono">
                  ID: {voice.callId} · {voice.audioDurationFormatted}
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
                  <span>Channel 1: Agent ({voice.agentName})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                  <span>Channel 2: Consumer ({customerName})</span>
                </span>
              </div>

              {/* Waveform Bars */}
              <div
                className="h-16 flex items-center gap-[2px] cursor-pointer relative py-2"
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
                  const isHesitantZone = voice.transcripts.some(
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
                          : '#D1D5DB'
                      }}
                    />
                  );
                })}

                {/* Scrubber pointer line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-[#1A1A1A] z-10 pointer-events-none"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
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
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] flex items-center justify-center text-white transition-colors"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-2 rounded-lg border border-[#E5E5E3] bg-white hover:bg-[#F7F7F5] text-[#1A1A1A] transition-colors"
                    title="Reset to beginning"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-lg border border-[#E5E5E3] bg-white hover:bg-[#F7F7F5] text-[#1A1A1A] transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs font-mono tabular-nums text-[#6B6B6B]">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>

                  {/* Playback Speed Segment */}
                  <div className="flex items-center rounded border border-[#E5E5E3] bg-white p-0.5 text-[10px] font-mono">
                    {[1, 1.25, 1.5].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-1.5 py-0.5 rounded transition-colors ${
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
                <span className="text-[11px] font-mono text-[#6B6B6B]">
                  {voice.voiceFlags.length} Flagged
                </span>
              </div>

              {voice.voiceFlags.length > 0 ? (
                <div className="space-y-1.5">
                  {voice.voiceFlags.map((flag, idx) => (
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
              <span className="text-xs font-mono font-medium text-[#1A1A1A]">
                {voice.complianceChecklist.filter((c) => c.isCompliant).length} / {voice.complianceChecklist.length} Passed
              </span>
            </div>

            <div className="space-y-2">
              {voice.complianceChecklist.map((item) => (
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
                        <span className="text-[#6B6B6B] font-mono mr-1">[{item.category}]</span>
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
                      onClick={() => handleSeek(item.timestampRef!)}
                      className="text-[10px] font-mono text-[#2563EB] hover:underline shrink-0 bg-[#2563EB]/5 px-1.5 py-0.5 rounded"
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
                  Timestamped transcript (ASR diarization)
                </h4>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Click any dialogue line to seek audio playback directly to that timestamp.
                </p>
              </div>
            </div>

            {/* Transcript Timeline Items */}
            <div className="space-y-3 overflow-y-auto max-h-[580px] pr-2">
              {voice.transcripts.map((snippet) => {
                const isAgent = snippet.speaker === 'agent';
                const isActive = currentTime >= snippet.startTime && currentTime <= snippet.endTime;

                return (
                  <div
                    key={snippet.id}
                    onClick={() => handleSeek(snippet.startTime)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'border-[#2563EB] bg-[#2563EB]/5 shadow-sm'
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
                          {isAgent ? `Verifier (${voice.agentName})` : `Consumer (${customerName})`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {snippet.hasHesitancy && (
                          <span className="text-[10px] font-semibold text-[#D97706] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Pause {snippet.hesitancyDuration}s</span>
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-[#6B6B6B]">
                          {formatTime(snippet.startTime)} - {formatTime(snippet.endTime)}
                        </span>
                      </div>
                    </div>

                    <p className="text-[#1A1A1A] leading-relaxed pl-3.5">
                      {snippet.text}
                    </p>

                    {snippet.flagReason && (
                      <div className="mt-2 pl-3.5 text-[11px] text-[#DC2626] font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
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
