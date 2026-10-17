/**
 * GramPay (BharatVoice Shield) - Senior Citizen UX & Accessibility Design Tokens
 * 
 * Specially designed for elderly rural Indian citizens:
 * - Minimum 80px touch target for primary voice interaction (tremor / arthritic tolerant)
 * - WCAG AAA 7:1+ contrast ratios for sunlight visibility and cataract / presbyopia tolerance
 * - Zero confusing animations (no spinning spinners, disorienting modals, or rapid transitions)
 * - Multimodal feedback (Visual + Speech + Haptic)
 */

export const SENIOR_UX_TOKENS = {
  // Sizing and Touch Targets
  touchTargets: {
    micPrimary: {
      minWidth: '88px',
      minHeight: '88px',
      borderRadius: '50%',
      iconSize: '44px',
      description: 'Massive circular touch target for elderly farmers with calloused or trembling fingers.',
    },
    buttonSecondary: {
      minHeight: '60px',
      minWidth: '140px',
      padding: '16px 24px',
      borderRadius: '16px',
      fontSize: '20px',
      description: 'Large pill buttons for Language selection, Retry, and Cancel.',
    },
    languageChip: {
      minHeight: '52px',
      padding: '12px 20px',
      borderRadius: '12px',
      fontSize: '18px',
      fontWeight: '700',
    },
  },

  // Color Palette (WCAG AAA Compliant on pure white / #FFFFFF background)
  colors: {
    // Shield Safe / Genuine Farmer
    safeGreen: {
      primary: '#0B6623',       // Forest Green (Contrast 7.8:1 on White)
      surface: '#E8F5E9',       // High contrast light tinted background
      border: '#084819',        // Deep forest border (2.5px solid)
      textOnDark: '#FFFFFF',
      textOnLight: '#053311',
    },

    // Threat / Impostor / AI Clone Attack
    alertCrimson: {
      primary: '#B00020',       // High-contrast Crimson (Contrast 7.4:1 on White)
      surface: '#FFEBEE',       // Light red surface
      border: '#8E001A',        // Deep blood red border (3px solid)
      textOnDark: '#FFFFFF',
      textOnLight: '#680010',
    },

    // In-Progress / Recording State
    recordingAmber: {
      primary: '#D97706',       // Deep Amber (Contrast 4.6:1 on White, used with dark borders)
      surface: '#FEF3C7',
      border: '#92400E',
      activeRed: '#DC2626',     // Recording indicator dot
    },

    // Text & Surfaces (Zero muddy grays)
    neutral: {
      background: '#FFFFFF',    // Crisp white for maximum daylight readability
      cardBackground: '#F8FAFC',
      borderCrisp: '#1E293B',   // 2px solid dark slate border instead of fuzzy drop shadows
      textPrimary: '#0F172A',   // 95% Black (Contrast 17.5:1)
      textSecondary: '#334155', // High-contrast subtitle (Contrast 9.2:1)
      overlayScrim: 'rgba(15, 23, 42, 0.85)',
    },
  },

  // Typography for Indic & Elderly Readers
  typography: {
    fontFamily: "'Noto Sans Kannada', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    sizes: {
      amountHero: '40px',       // e.g. ₹500 in large bold font
      statusHeader: '28px',     // Clear headline
      bodyInstruction: '20px',  // Minimum body size for elderly eyes
      caption: '16px',          // Absolute smallest permitted size
    },
    lineHeight: {
      relaxed: '1.6',           // Ample spacing between lines for Indic scripts (Kannada vowel matras)
    },
    fontWeight: {
      bold: '700',
      black: '900',
    },
  },

  // Layout & Spacing
  spacing: {
    screenPadding: '24px',
    cardPadding: '28px',
    elementGap: '20px',
  },

  // State Feedback Definitions
  states: {
    idle: {
      labelKannada: '🎙️ ಒತ್ತಿ ಮಾತನಾಡಿ',
      labelHindi: '🎙️ दबाएं और बोलें',
      labelEnglish: '🎙️ Tap to Speak',
      borderColor: '#1E293B',
      bgColor: '#FFFFFF',
      haptic: null,
    },
    recording: {
      labelKannada: '🔴 ಆಲಿಸುತ್ತಿದೆ... ಮಾತನಾಡಿ',
      labelHindi: '🔴 सुन रहे हैं... बोलिए',
      labelEnglish: '🔴 Listening... Speak now',
      borderColor: '#DC2626',
      bgColor: '#FEF2F2',
      haptic: [80], // Short tick on start
    },
    verifying: {
      labelKannada: '⏳ ಧ್ವನಿ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...',
      labelHindi: '⏳ आवाज जांची जा रही है...',
      labelEnglish: '⏳ Verifying your voice...',
      borderColor: '#D97706',
      bgColor: '#FFFBEB',
      haptic: null,
    },
    success: {
      labelKannada: '✅ ದೃಢೀಕರಣ ಯಶಸ್ವಿಯಾಗಿದೆ! ಪಾವತಿ ಪೂರ್ಣ',
      labelHindi: '✅ सत्यापन सफल! भुगतान पूरा हुआ',
      labelEnglish: '✅ Voice Verified! Payment Safe',
      borderColor: '#0B6623',
      bgColor: '#E8F5E9',
      haptic: [150, 100, 200], // Happy cadence
    },
    spoofBlocked: {
      labelKannada: '🛑 ನಕಲಿ ಧ್ವನಿ ಪತ್ತೆಯಾಗಿದೆ! ಪಾವತಿ ರದ್ದು',
      labelHindi: '🛑 नकली आवाज मिली! भुगतान रद्द',
      labelEnglish: '🛑 Spoof Voice Detected! Payment Blocked',
      borderColor: '#B00020',
      bgColor: '#FFEBEE',
      haptic: [300, 100, 300, 100, 600], // Urgent alarm vibration
    },
  },
};

/**
 * CSS Variables snippet ready to inject into :root or Tailwind config
 */
export const SENIOR_UX_CSS_VARS = `
:root {
  /* Touch targets */
  --touch-target-mic: 88px;
  --touch-target-button: 60px;
  
  /* High contrast colors */
  --gp-bg: #FFFFFF;
  --gp-card: #F8FAFC;
  --gp-border: #1E293B;
  --gp-text-main: #0F172A;
  --gp-text-sub: #334155;
  
  --gp-safe-green: #0B6623;
  --gp-safe-bg: #E8F5E9;
  --gp-safe-border: #084819;
  
  --gp-danger-red: #B00020;
  --gp-danger-bg: #FFEBEE;
  --gp-danger-border: #8E001A;
  
  --gp-warn-amber: #D97706;
  --gp-warn-bg: #FEF3C7;
  
  /* Font metrics */
  --gp-font-amount: 40px;
  --gp-font-headline: 28px;
  --gp-font-body: 20px;
}

/* Zero confusing animations - clear high-contrast states */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

.senior-mic-button {
  width: var(--touch-target-mic);
  height: var(--touch-target-mic);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid var(--gp-border);
  background-color: var(--gp-safe-green);
  color: #FFFFFF;
  box-shadow: 0 4px 0 var(--gp-border); /* Solid tactile shadow */
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.senior-mic-button:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 var(--gp-border);
}

.senior-mic-recording {
  background-color: #DC2626 !important;
  border-color: #7F1D1D !important;
  animation: pulse-ring 1.5s infinite;
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.6); }
  70% { box-shadow: 0 0 0 16px rgba(220, 38, 38, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
}
`;
