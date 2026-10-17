/**
 * GramPay (BharatVoice Shield) - Senior Citizen Voice Feedback System
 * 
 * Powered by window.speechSynthesis tailored for elderly rural citizens.
 * Supports Kannada (kn-IN), Hindi (hi-IN), and English (en-IN).
 * Includes robust gesture unlocking for iOS Safari and Android Chrome,
 * elderly-friendly pacing (rate: 0.85), volume maximization, and haptic integration.
 */

export type SupportedLanguage = 'kn-IN' | 'hi-IN' | 'en-IN';

export interface VoicePromptDictionary {
  welcome: string;
  speakPrompt: string;
  recording: string;
  processing: string;
  paymentSuccess: string;
  impostorAlert: string;
  retry: string;
  offlineNotice: string;
}

export const VOICE_PROMPTS: Record<SupportedLanguage, VoicePromptDictionary> = {
  'kn-IN': {
    welcome: 'ಗ್ರಾಮಪೇ ರಕ್ಷಾ ಕವಚಕ್ಕೆ ಸ್ವಾಗತ.',
    speakPrompt: 'ದಯವಿಟ್ಟು ಮೈಕ್ ಒತ್ತಿ: "ನಾನು ರಮೇಶನಿಗೆ ಐನೂರು ರೂಪಾಯಿ ಕಳುಹಿಸಲು ಸಮ್ಮತಿಸುತ್ತೇನೆ" ಎಂದು ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಿ.',
    recording: 'ನಿಮ್ಮ ಧ್ವನಿ ರೆಕಾರ್ಡ್ ಆಗುತ್ತಿದೆ, ಮಾತನಾಡಿ...',
    processing: 'ನಿಮ್ಮ ಧ್ವನಿಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ, ದಯವಿಟ್ಟು ಕಾಯಿರಿ...',
    paymentSuccess: 'ದೃಢೀಕರಣ ಯಶಸ್ವಿಯಾಗಿದೆ! ನಿಮ್ಮ ಐನೂರು ರೂಪಾಯಿ ಪಾವತಿ ಸುರಕ್ಷಿತವಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ.',
    impostorAlert: 'ಎಚ್ಚರಿಕೆ! ನಕಲಿ ಧ್ವನಿ ಅಥವಾ ರೆಕಾರ್ಡಿಂಗ್ ಪತ್ತೆಯಾಗಿದೆ! ಪಾವತಿಯನ್ನು ತಕ್ಷಣ ತಡೆಹಿಡಿಯಲಾಗಿದೆ!',
    retry: 'ಧ್ವನಿ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಹತ್ತಿರ ಬಂದು ಮತ್ತೆ ಮಾತನಾಡಿ.',
    offlineNotice: 'ನೆಟ್‌ವರ್ಕ್ ಸಂಪರ್ಕ ನಿಧಾನವಾಗಿದೆ. ಧ್ವನಿ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿದೆ.',
  },
  'hi-IN': {
    welcome: 'ग्रामपे सुरक्षा कवच में आपका स्वागत है।',
    speakPrompt: 'कृपया माइक दबाएं और कहें: "मैं रमेश को पांच सौ रुपये भेजने की पुष्टि करता हूँ"।',
    recording: 'आपकी आवाज रिकॉर्ड हो रही है, बोलिए...',
    processing: 'आपकी आवाज की जांच हो रही है, कृपया प्रतीक्षा करें...',
    paymentSuccess: 'सत्यापन सफल रहा! आपके पांच सौ रुपये सुरक्षित रूप से भेज दिए गए हैं।',
    impostorAlert: 'सावधान! नकली आवाज या रिकॉर्डिंग का पता चला है! भुगतान तुरंत रोक दिया गया है!',
    retry: 'आवाज साफ नहीं आई। कृपया माइक के पास आकर दोबारा बोलें।',
    offlineNotice: 'नेटवर्क धीमा है। आपकी आवाज सुरक्षित रखी गई है।',
  },
  'en-IN': {
    welcome: 'Welcome to GramPay Voice Shield.',
    speakPrompt: 'Please tap the mic and say: "I confirm sending 500 rupees to Ramesh".',
    recording: 'Recording your voice, please speak now...',
    processing: 'Verifying your authentic voice, please wait...',
    paymentSuccess: 'Voice verified! Your payment of 500 rupees is completed safely.',
    impostorAlert: 'Warning! Synthetic or cloned voice detected! Transaction has been blocked!',
    retry: 'Voice unclear. Please hold the phone closer and speak again.',
    offlineNotice: 'Slow connection. Securing voice credentials.',
  },
};

export class SeniorVoiceFeedback {
  private currentLang: SupportedLanguage = 'kn-IN';
  private isUnlocked: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  private rate: number = 0.85; // Slightly slower pace for elderly cognitive processing
  private pitch: number = 1.0;
  private volume: number = 1.0; // Max volume for mild age-related hearing loss

  constructor(defaultLang: SupportedLanguage = 'kn-IN') {
    this.currentLang = defaultLang;
    this.initVoiceList();
  }

  /**
   * Populate available voices and listen for async voiceschanged event (Chrome Android)
   */
  private initVoiceList(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      this.voices = window.speechSynthesis.getVoices();
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  /**
   * CRITICAL FOR IOS SAFARI & ANDROID CHROME:
   * Browsers block speech synthesis until triggered by a direct user tap/click.
   * Call this in the `touchstart` or `click` event of the language selector or initial CTA.
   */
  public unlockAudioGesture(): void {
    if (this.isUnlocked || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      // Speak a silent micro-utterance to unlock the audio channel on iOS Safari
      const silentUtterance = new SpeechSynthesisUtterance(' ');
      silentUtterance.volume = 0.01;
      silentUtterance.rate = 2.0; // finish quickly
      window.speechSynthesis.speak(silentUtterance);
      this.isUnlocked = true;
      console.log('[GramPay Audio] SpeechSynthesis successfully unlocked by user gesture.');
    } catch (e) {
      console.warn('[GramPay Audio] Audio gesture unlock failed:', e);
    }
  }

  public setLanguage(lang: SupportedLanguage): void {
    this.currentLang = lang;
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLang;
  }

  /**
   * Find the best matching natural voice for the target Indian language
   */
  private getBestVoice(targetLang: SupportedLanguage): SpeechSynthesisVoice | null {
    if (!this.voices || this.voices.length === 0) {
      this.voices = window.speechSynthesis.getVoices();
    }

    // Exact BCP-47 match (e.g. "kn-IN", "hi-IN", "en-IN")
    const exact = this.voices.find(v => v.lang.toLowerCase() === targetLang.toLowerCase());
    if (exact) return exact;

    // Prefix match (e.g. "kn", "hi", "en")
    const prefix = targetLang.split('-')[0].toLowerCase();
    const prefixMatch = this.voices.find(v => v.lang.toLowerCase().startsWith(prefix));
    if (prefixMatch) return prefixMatch;

    // Fallback to Google Indian English or standard English
    const fallback = this.voices.find(v => v.lang.includes('IN') || v.lang.includes('en'));
    return fallback || null;
  }

  /**
   * Speak a designated prompt key with high clarity and optional haptic alert.
   */
  public async speakPromptKey(
    key: keyof VoicePromptDictionary,
    overrideLang?: SupportedLanguage
  ): Promise<void> {
    const lang = overrideLang || this.currentLang;
    const text = VOICE_PROMPTS[lang][key] || VOICE_PROMPTS['en-IN'][key];
    await this.speak(text, lang, key === 'impostorAlert');
  }

  /**
   * Speak custom text with automatic queue pre-emption for urgent warnings.
   */
  public speak(
    text: string,
    langOverride?: SupportedLanguage,
    isUrgentAlert: boolean = false
  ): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('[GramPay Audio] SpeechSynthesis not supported on this device.');
        return resolve();
      }

      // Ensure gesture unlocked
      this.unlockAudioGesture();

      // For urgent alerts (e.g. impostor detected), stop any prior chatter immediately
      if (isUrgentAlert) {
        window.speechSynthesis.cancel();
        // Trigger tactile alert for elderly users with hearing loss
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200, 100, 400]); // Alarm cadence
        }
      }

      const lang = langOverride || this.currentLang;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = this.rate; // 0.85 pacing
      utterance.pitch = this.pitch;
      utterance.volume = this.volume;

      const voice = this.getBestVoice(lang);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        console.warn('[GramPay Audio] Speech error:', e);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Stop any ongoing speech playback immediately.
   */
  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
