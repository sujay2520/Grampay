/**
 * GramPay (BharatVoice Shield) - Senior Citizen UX & Accessibility Design Tokens
 * 
 * Specially designed for elderly rural Indian citizens:
 * - Minimum 88px touch target for primary voice interaction (tremor / arthritic tolerant)
 * - WCAG AAA 7:1+ contrast ratios for sunlight visibility and cataract / presbyopia tolerance
 * - Zero confusing animations (no spinning spinners, disorienting modals, or rapid transitions)
 * - Multimodal feedback (Visual + Speech + Haptic)
 */

export const SENIOR_UX_TOKENS = {
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

  colors: {
    safeGreen: {
      primary: '#0B6623',       // Forest Green (Contrast 7.8:1 on White)
      surface: '#E8F5E9',       // High contrast light tinted background
      border: '#084819',        // Deep forest border (2.5px solid)
      textOnDark: '#FFFFFF',
      textOnLight: '#053311',
    },
    alertCrimson: {
      primary: '#B00020',       // High-contrast Crimson (Contrast 7.4:1 on White)
      surface: '#FFEBEE',       // Light red surface
      border: '#8E001A',        // Deep blood red border (3px solid)
      textOnDark: '#FFFFFF',
      textOnLight: '#680010',
    },
    recordingAmber: {
      primary: '#D97706',       // Deep Amber
      surface: '#FEF3C7',
      border: '#92400E',
      activeRed: '#DC2626',     // Recording indicator dot
    },
    neutral: {
      background: '#FFFFFF',    // Crisp white for maximum daylight readability
      cardBackground: '#F8FAFC',
      borderCrisp: '#1E293B',   // 2px solid dark slate border instead of fuzzy drop shadows
      textPrimary: '#0F172A',   // 95% Black (Contrast 17.5:1)
      textSecondary: '#334155', // High-contrast subtitle (Contrast 9.2:1)
      overlayScrim: 'rgba(15, 23, 42, 0.85)',
    },
  },

  typography: {
    fontFamily: "'Noto Sans Kannada', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    sizes: {
      amountHero: '40px',       // e.g. ₹1,000 in large bold font
      statusHeader: '28px',     // Clear headline
      bodyInstruction: '20px',  // Minimum body size for elderly eyes
      caption: '16px',          // Smallest permitted size
    },
    lineHeight: {
      relaxed: '1.6',
    },
    fontWeight: {
      bold: '700',
      black: '900',
    },
  },

  spacing: {
    screenPadding: '24px',
    cardPadding: '28px',
    elementGap: '20px',
  },
};
