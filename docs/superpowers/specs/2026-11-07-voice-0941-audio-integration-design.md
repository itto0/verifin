# Design Spec: Integration of `voice_0941.mp3` for Case 0941 (Ahmad Fauzi)

- **Date:** 2026-11-07
- **Status:** Approved
- **Target Case:** `CASE-0941` (Ahmad Fauzi) / Tele-verification Voice Audit
- **Related Assets:** `public/voice_0941.mp3`

---

## 1. Overview & Objectives

VeriFin incorporates an AI-powered tele-verification voice audit module assessing applicant identity confirmations, OJK regulatory script compliance, hesitancy pauses, and background anomalies. An authentic dual-speaker recording generated via ElevenLabs matching Ahmad Fauzi's application profile exists at `public/voice_0941.mp3`.

This specification formalizes:
1. Associating `recordingUrl: '/voice_0941.mp3'` with `case0941CleanVoiceVerification` in `src/data/prompts/elevenlabsCallPrompts.ts`.
2. Flowing this asset into `mockCases[0].voice` (CASE-0941 in `src/data/mockData.ts`) and `voiceDemoPresets.nominal` (`src/data/demoPresets.ts`).
3. Upgrading `src/components/detail/VoiceVerificationTab.tsx` so that when `activeAudioSrc` (`audioObjectUrl || activeVoice.recordingUrl`) is present, it binds directly to the HTML5 `<audio>` element with native playback, pause, seek, speed control, mute toggle, and transcript-seeking synchronization, while preserving timer simulation fallback for presets without an audio file (`hesitant_noncompliant`, `coaching_suspicion`).
4. Displaying a visual badge (`Authentic Audio Recording (voice_0941.mp3)`) in the Call Audio Waveform Player header.
5. Providing automated test coverage across unit tests without regressions.

---

## 2. Architecture & Data Flow

### 2.1 Data Layer

- **File:** `src/data/prompts/elevenlabsCallPrompts.ts`
- **Entity:** `case0941CleanVoiceVerification: VoiceVerification`
- **Field Addition:**
  ```typescript
  recordingUrl: '/voice_0941.mp3',
  ```
- **Downstream Consumers:**
  - `src/data/mockData.ts`: `mockCases[0].voice` imports and reuses `case0941CleanVoiceVerification`.
  - `src/data/demoPresets.ts`: `voiceDemoPresets.nominal` imports and reuses `case0941CleanVoiceVerification`.

### 2.2 Audio Player Logic (`VoiceVerificationTab.tsx`)

- **Audio Source Derivation:**
  ```typescript
  const activeAudioSrc = audioObjectUrl || activeVoice.recordingUrl || null;
  ```
- **Playback Control Lifecycle:**
  - When `activeAudioSrc` is present:
    - `<audio ref={audioRef} src={activeAudioSrc} ... />` is rendered in DOM.
    - `togglePlay()` calls `audioRef.current.play()` / `audioRef.current.pause()`.
    - `onTimeUpdate` updates `currentTime` state, smoothly driving the progress bar and waveform scrubber.
    - `handleSeek(time)` sets `audioRef.current.currentTime = time`.
    - `handleReset()` resets time to `0` and pauses.
    - `onEnded` resets playback state to paused and time to `0`.
  - When `!activeAudioSrc` (e.g. `hesitant_noncompliant` or `coaching_suspicion` presets):
    - Synthetic timer `setInterval` advances `currentTime` once per second (scaled by `playbackSpeed`).
- **Transcript Synchronization:**
  - Clicking any transcript dialogue entry calls `handleSeek(snippet.startTime)`.
  - With `activeAudioSrc` bound, this immediately seeks the real audio element to that exact point in the dialogue.

### 2.3 User Interface Enhancements

- In `Call Audio Waveform Player` header (`src/components/detail/VoiceVerificationTab.tsx`):
  - When `activeAudioSrc` is active from `recordingUrl`:
    - Display an authentic recording badge:
      `Authentic Audio Recording (voice_0941.mp3)` with a green indicator dot and `FileAudio` / `Volume2` icon.
  - When `audioObjectUrl` is active (custom upload):
    - Display `Custom Upload: {uploadedFileName}`.
  - When synthetic preset without audio file is active:
    - Display `Simulated Tele-survey Waveform`.

---

## 3. Testing & Verification

1. **Preset & Prompt Tests (`src/data/prompts/elevenlabsCallPrompts.test.ts` & `src/data/demoPresets.test.ts`):**
   - Assert `case0941CleanVoiceVerification.recordingUrl === '/voice_0941.mp3'`.
   - Assert `voiceDemoPresets.nominal.recordingUrl === '/voice_0941.mp3'`.
2. **Audio QA Logic Tests (`src/components/detail/VoiceVerificationTab.test.ts`):**
   - Assert `activeVoice` resolution correctly retains `recordingUrl` when selecting `nominal`.
3. **Full Suite Regression:**
   - Execute `bun test` ensuring 100% pass across all test suites.
   - Execute `bun run build` ensuring bundle compile succeeds.
