# Voice 0941 Audio Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `public/voice_0941.mp3` into CASE-0941 clean voice verification and update the Tele-verification player in `VoiceVerificationTab` to support real audio playback, time/scrubber synchronization, transcript seeking, and authentic audio status indicators.

**Architecture:** Connect `recordingUrl: '/voice_0941.mp3'` to `case0941CleanVoiceVerification` in `src/data/prompts/elevenlabsCallPrompts.ts`, propagating through `mockCases[0].voice` (CASE-0941) and `voiceDemoPresets.nominal`. Update `src/components/detail/VoiceVerificationTab.tsx` to derive `activeAudioSrc = audioObjectUrl || activeVoice.recordingUrl || null`, binding it to the HTML5 `<audio>` element with fallback simulation timers for presets without audio files, and rendering an authentic audio badge in the waveform header.

**Tech Stack:** React 19, TypeScript, Bun Test, Lucide React, HTML5 Audio API.

## Global Constraints

- Retain local public asset path `/voice_0941.mp3`; do not introduce remote URLs.
- Maintain existing preset behaviors: `hesitant_noncompliant` and `coaching_suspicion` must remain functional with their simulated hesitation zones and acoustic flags.
- Preserve 100% test pass rate across `bun test` (174+ passing tests) without regressions.
- All code changes must pass TypeScript compilation and production build (`bun run build`).

---

### Task 1: Wire `recordingUrl` to `case0941CleanVoiceVerification` and Tests

**Files:**
- Modify: `src/data/prompts/elevenlabsCallPrompts.ts:77-88`
- Modify: `src/data/prompts/elevenlabsCallPrompts.test.ts:28-40`
- Modify: `src/data/demoPresets.test.ts:65-73`

**Interfaces:**
- Consumes: `VoiceVerification` from `src/types.ts`
- Produces: `case0941CleanVoiceVerification` with `recordingUrl: '/voice_0941.mp3'`

- [ ] **Step 1: Write the failing test in `src/data/prompts/elevenlabsCallPrompts.test.ts`**

Update `src/data/prompts/elevenlabsCallPrompts.test.ts`:

```typescript
  it('matches VeriFin VoiceVerification data structure with 100% compliance', () => {
    const voice = case0941CleanVoiceVerification;
    expect(voice.callId).toBe('CALL-20261027-0941-CLN');
    expect(voice.overallHesitancyCount).toBe(0);
    expect(voice.spellingAccuracyScore).toBe(100);
    expect(voice.scriptComplianceScore).toBe(100);
    expect(voice.score).toBeLessThanOrEqual(25);
    expect(voice.recordingUrl).toBe('/voice_0941.mp3');
    expect(voice.complianceChecklist.length).toBe(6);
    expect(voice.complianceChecklist.every((item) => item.isCompliant)).toBe(true);
    expect(voice.voiceFlags.length).toBe(0);
    expect(voice.transcripts.length).toBe(18);
    expect(voice.transcripts[voice.transcripts.length - 1].endTime).toBeLessThanOrEqual(voice.callDuration);
  });
```

And in `src/data/demoPresets.test.ts`:

```typescript
    expect(voiceDemoPresets.nominal.recordingUrl).toBe('/voice_0941.mp3');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/data/prompts/elevenlabsCallPrompts.test.ts`
Expected: FAIL asserting `expect(voice.recordingUrl).toBe('/voice_0941.mp3')` where received is `undefined`.

- [ ] **Step 3: Implement minimal code in `src/data/prompts/elevenlabsCallPrompts.ts`**

In `src/data/prompts/elevenlabsCallPrompts.ts`, add `recordingUrl: '/voice_0941.mp3'` to `case0941CleanVoiceVerification`:

```typescript
export const case0941CleanVoiceVerification: VoiceVerification = {
  callId: 'CALL-20261027-0941-CLN',
  callDuration: 165,
  agentName: 'Fitri Handayani',
  agentId: 'AGT-044',
  callTimestamp: '2026-10-27 14:18:10',
  audioDurationFormatted: '02:45',
  overallHesitancyCount: 0,
  spellingAccuracyScore: 100,
  scriptComplianceScore: 100,
  score: 18,
  recordingUrl: '/voice_0941.mp3',
  voiceFlags: [],
  complianceChecklist: [
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/data/prompts/elevenlabsCallPrompts.test.ts src/data/demoPresets.test.ts`
Expected: PASS (all tests pass).

- [ ] **Step 5: Commit**

```bash
git add src/data/prompts/elevenlabsCallPrompts.ts src/data/prompts/elevenlabsCallPrompts.test.ts src/data/demoPresets.test.ts
git commit -m "feat(voice): link voice_0941.mp3 to clean case 0941 voice verification"
```

---

### Task 2: Update `VoiceVerificationTab.tsx` Audio Player and Status Badge

**Files:**
- Modify: `src/components/detail/VoiceVerificationTab.tsx:320-430, 610-630`
- Modify: `src/components/detail/VoiceVerificationTab.test.ts:90-130`

**Interfaces:**
- Consumes: `activeVoice.recordingUrl` from `VoiceVerification`
- Produces: HTML5 `<audio>` playback wired to `activeAudioSrc = audioObjectUrl || activeVoice.recordingUrl || null`, transcript seeking, and status badge.

- [ ] **Step 1: Write test in `src/components/detail/VoiceVerificationTab.test.ts`**

In `src/components/detail/VoiceVerificationTab.test.ts`, add a test verifying `recordingUrl` handling for nominal preset:

```typescript
  describe('4. Audio recording asset resolution', () => {
    it('provides valid local recordingUrl for nominal clean preset', () => {
      const nominal = voiceDemoPresets.nominal;
      expect(nominal.recordingUrl).toBe('/voice_0941.mp3');
    });

    it('keeps synthetic presets free from recordingUrl so timer simulation operates', () => {
      expect(voiceDemoPresets.hesitant_noncompliant.recordingUrl).toBeUndefined();
      expect(voiceDemoPresets.coaching_suspicion.recordingUrl).toBeUndefined();
    });
  });
```

- [ ] **Step 2: Run test to verify it fails if prerequisite not present**

Run: `bun test src/components/detail/VoiceVerificationTab.test.ts`
Expected: PASS (or fail if step 1 hasn't landed).

- [ ] **Step 3: Update `VoiceVerificationTab.tsx`**

1. Import `FileAudio` from `'lucide-react'`:
```typescript
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
```

2. Derive `activeAudioSrc`:
```typescript
  const activeAudioSrc = audioObjectUrl || activeVoice.recordingUrl || null;
```

3. Update timer playback progress to run only when `!activeAudioSrc`:
```typescript
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
```

4. Update `togglePlay`, `handleSeek`, and `handleReset` to check `activeAudioSrc`:
```typescript
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
```

5. Update audio element rendering:
```tsx
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
```

6. Add authentic recording status badge in Call Audio Waveform Player header:
```tsx
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test src/components/detail/VoiceVerificationTab.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/detail/VoiceVerificationTab.tsx src/components/detail/VoiceVerificationTab.test.ts
git commit -m "feat(voice): support native audio playback and authentic recording indicator in VoiceVerificationTab"
```

---

### Task 3: Full Verification & Build Validation

**Files:**
- Test all: `tests/` and `src/**/*.test.ts`

- [ ] **Step 1: Run full test suite**

Run: `bun test`
Expected: 175+ tests passing across all suites.

- [ ] **Step 2: Run production build**

Run: `bun run build`
Expected: Clean build into `dist/` with 0 TypeScript or packaging errors.

- [ ] **Step 3: Conduct whole-branch code review**
