# GramPay (BharatVoice Shield) - Client-Side Audio & Senior Citizen UX Specs

## Architectural Overview
This directory contains production-ready TypeScript/JavaScript modules providing client-side audio capture, resampling, WAV encoding, and elderly rural UX feedback for GramPay across **Phone 1 (Farmer)** and **Phone 2 (Impostor)**.

---

### File Structure
- `audioRecorder.ts`: In-browser Web Audio API recorder. Captures user microphone, decodes via `AudioContext.decodeAudioData()`, resamples to exactly **16,000 Hz Mono** via `OfflineAudioContext`, and encodes a standard **16-bit linear PCM Little-Endian WAV** file with complete 44-byte RIFF header.
- `voiceFeedback.ts`: Senior-citizen speech synthesizer using `window.speechSynthesis`. Paced at `0.85x` for cognitive clarity, supports **Kannada (`kn-IN`)**, **Hindi (`hi-IN`)**, and **English (`en-IN`)**, and implements iOS Safari & Android Chrome silent user-gesture unlocking.
- `seniorUxTokens.ts`: Accessibility design tokens for rural seniors. Minimum **88px primary mic target**, **WCAG AAA (>7:1)** high-contrast palette, zero confusing animations, and synchronized visual + auditory + haptic feedback.

---

### Phone 1 vs. Phone 2 Implementation Guide

#### Phone 1: Genuine Farmer (Authorized Voice Verification)
1. **User Gesture Initialization**:
   - On page load or first tap on the Language button (`kn-IN` / `hi-IN`), call `SeniorVoiceFeedback.unlockAudioGesture()` to unlock speech synthesis on iOS/Android.
2. **Auditory Prompt**:
   - Call `voiceFeedback.speakPromptKey('speakPrompt')`:
     - Kannada: *"ದಯವಿಟ್ಟು ಮೈಕ್ ಒತ್ತಿ: 'ನಾನು ರಮೇಶನಿಗೆ ಐನೂರು ರೂಪಾಯಿ ಕಳುಹಿಸಲು ಸಮ್ಮತಿಸುತ್ತೇನೆ' ಎಂದು ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಿ."*
3. **Capture & Resample**:
   - Farmer taps the 88px mic button.
   - `recorder.startRecording({ onVolumeChange: updateMicMeter })`.
   - On completion (or 4s timer), `const { wavBlob } = await recorder.stopRecording()`.
   - Result: Pure 16 kHz Mono 16-bit PCM WAV (100% compliant with Wav2Vec2 / Resemblyzer / SpeechBrain backend).
4. **Success State**:
   - Backend confirms speaker match and anti-spoof liveness score > 0.95.
   - UI switches to `SENIOR_UX_TOKENS.colors.safeGreen` (`#0B6623`).
   - TTS announces: *"ದೃಢೀಕರಣ ಯಶಸ್ವಿಯಾಗಿದೆ! ನಿಮ್ಮ ಐನೂರು ರೂಪಾಯಿ ಪಾವತಿ ಸುರಕ್ಷಿತವಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ."*
   - Haptic feedback: `[150, 100, 200]` ms vibration.

---

#### Phone 2: Impostor (Spoofing / Cloned Voice / Replay Attack)
1. **Challenge Utterance**:
   - Impostor plays a recorded voice clone or speaks the stolen phrase into Phone 2.
2. **Capture**:
   - Uses identical 16 kHz mono WAV pipeline to ensure backend receives uncompressed linear PCM without lossy WebM compression artifacts distorting phase/spectral cues.
3. **Impostor Interception**:
   - Backend anti-spoof model detects synthetic artifacts / replay reverberation / speaker mismatch.
   - Immediate audio preemption: `voiceFeedback.stop()` cancels any existing speech.
   - Urgent alert triggered:
     - Voice: *"ಎಚ್ಚರಿಕೆ! ನಕಲಿ ಧ್ವನಿ ಅಥವಾ ರೆಕಾರ್ಡಿಂಗ್ ಪತ್ತೆಯಾಗಿದೆ! ಪಾವತಿಯನ್ನು ತಕ್ಷಣ ತಡೆಹಿಡಿಯಲಾಗಿದೆ!"*
     - Haptic alarm cadence: `[200, 100, 200, 100, 400]` ms.
     - Visual state: `SENIOR_UX_TOKENS.colors.alertCrimson` (`#B00020`), with distinct 3px red border and static warning shield badge.
