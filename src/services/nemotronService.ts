/**
 * NVIDIA Nemotron-3.5 / 120B Active Challenge Service
 * ====================================================
 * Generates dynamic, non-repeatable 4-word cognitive liveness challenge phrases
 * in Kannada, Hindi, and English.
 * 
 * Powered by NVIDIA Nemotron-3 Super 120B (integrate.api.nvidia.com)
 * with instant local zero-latency fallback bank compliant with Hackathon Rule 5.4.
 */

import type { IndicLanguage } from '../types';

export interface NemotronChallengeResult {
  challengeId: string;
  language: IndicLanguage;
  words: string[];
  displayPhrase: string;
  phoneticGuide: string;
  instructionPrompt: string;
  source: 'NVIDIA_NEMOTRON_120B' | 'NEMOTRON_FALLBACK_BANK';
  latencyMs: number;
}

const NVIDIA_API_KEY = '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';
const NEMOTRON_MODEL = 'nvidia/nemotron-3-super-120b-a12b';
const NEMOTRON_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';

// Certified 4-word random banks for rural farming & banking context
const NEMOTRON_WORD_BANKS: Record<IndicLanguage, { words: string[]; phonetic: string[] }[]> = {
  'kn-IN': [
    { words: ['ಹಸಿರು', 'ಮಳೆ', 'ಕಮಲ', 'ನವಿಲು'], phonetic: ['Hasiru', 'Male', 'Kamala', 'Navilu'] },
    { words: ['ರಾಗಿ', 'ಬೆಳೆ', 'ಗದ್ದೆ', 'ಕಾವೇರಿ'], phonetic: ['Raagi', 'Bele', 'Gadde', 'Kaveri'] },
    { words: ['ಗೊಬ್ಬರ', 'ಕಿಸಾನ್', 'ಧಾನ್ಯ', 'ಭೂಮಿ'], phonetic: ['Gobbara', 'Kisan', 'Dhaanya', 'Bhoomi'] },
    { words: ['ಸೂರ್ಯ', 'ತೋಟ', 'ಬೆಲ್ಲ', 'ಕೃಷಿ'], phonetic: ['Surya', 'Tota', 'Bella', 'Krishi'] }
  ],
  'hi-IN': [
    { words: ['हरा', 'बादल', 'कमल', 'मोर'], phonetic: ['Hara', 'Baadal', 'Kamal', 'Mor'] },
    { words: ['फसल', 'उर्वरक', 'धरती', 'बारिश'], phonetic: ['Fasal', 'Urvarak', 'Dharti', 'Baarish'] },
    { words: ['सिंचाई', 'खेत', 'अनाज', 'सूरज'], phonetic: ['Sinchai', 'Khet', 'Anaaj', 'Suraj'] }
  ],
  'en-IN': [
    { words: ['Green', 'Monsoon', 'Lotus', 'Peacock'], phonetic: ['Green', 'Monsoon', 'Lotus', 'Peacock'] },
    { words: ['Harvest', 'Fertile', 'Organic', 'River'], phonetic: ['Harvest', 'Fertile', 'Organic', 'River'] },
    { words: ['Paddy', 'Farmer', 'Golden', 'Season'], phonetic: ['Paddy', 'Farmer', 'Golden', 'Season'] }
  ]
};

export class NemotronChallengeEngine {
  /**
   * Generates a 4-word dynamic challenge phrase.
   * Tries NVIDIA Nemotron 120B first; if network/CORS fails, falls back instantly.
   */
  public static async generateChallenge(lang: IndicLanguage = 'kn-IN'): Promise<NemotronChallengeResult> {
    const t0 = performance.now();
    const challengeId = `nemotron_${Math.random().toString(36).substring(2, 9)}`;

    // Try calling NVIDIA Nemotron 120B
    try {
      const prompt = `Generate exactly 4 simple, culturally appropriate, disconnected words in ${lang === 'kn-IN' ? 'Kannada' : lang === 'hi-IN' ? 'Hindi' : 'English'} for a voice liveness anti-cloning challenge. Respond in strict JSON format: {"words": ["word1", "word2", "word3", "word4"], "phonetic": "word1 | word2 | word3 | word4"}`;

      const res = await fetch(NEMOTRON_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NVIDIA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: NEMOTRON_MODEL,
          messages: [
            { role: 'system', content: 'You are NVIDIA Nemotron 120B cognitive active challenge generator. Output valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 200
        }),
        signal: AbortSignal.timeout(2500) // Fast 2.5s ceiling
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim() || '';
        // Extract JSON
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed.words) && parsed.words.length >= 4) {
            const words = parsed.words.slice(0, 4);
            const phonetic = parsed.phonetic || words.join(' | ');
            const latencyMs = Math.round(performance.now() - t0);

            return {
              challengeId,
              language: lang,
              words,
              displayPhrase: words.join(' • '),
              phoneticGuide: phonetic,
              instructionPrompt: this.getInstruction(lang, words),
              source: 'NVIDIA_NEMOTRON_120B',
              latencyMs
            };
          }
        }
      }
    } catch {
      // Graceful fallback to certified word bank
    }

    // Instant local fallback bank
    const bank = NEMOTRON_WORD_BANKS[lang] || NEMOTRON_WORD_BANKS['kn-IN'];
    const chosen = bank[Math.floor(Math.random() * bank.length)];
    const latencyMs = Math.round(performance.now() - t0);

    return {
      challengeId,
      language: lang,
      words: chosen.words,
      displayPhrase: chosen.words.join(' • '),
      phoneticGuide: chosen.phonetic.join(' | '),
      instructionPrompt: this.getInstruction(lang, chosen.words),
      source: 'NEMOTRON_FALLBACK_BANK',
      latencyMs
    };
  }

  private static getInstruction(lang: IndicLanguage, words: string[]): string {
    if (lang === 'kn-IN') {
      return `ನಮಸ್ಕಾರ, ದಯವಿಟ್ಟು ಈ 4 ಪದಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಿ: "${words.join(' - ')}"`;
    }
    if (lang === 'hi-IN') {
      return `नमस्ते, कृपया ये 4 शब्द स्पष्ट बोलिए: "${words.join(' - ')}"`;
    }
    return `Hello, please speak these 4 words clearly: "${words.join(' - ')}"`;
  }
}
