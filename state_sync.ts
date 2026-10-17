/**
 * GramPay (BharatVoice Shield) - Multi-Device State Synchronization Protocol
 * ===========================================================================
 * Orchestrates live biometric state across:
 *   1. Phone 1 (Legitimate Farmer: Ramesh Gowda, Mandya)
 *   2. Phone 2 (Voice Cloner / Attacker: Synthetic Audio Injection)
 *   3. Laptop Console (Bank SOC & Fraud Operations Dashboard)
 *
 * Transport Modes:
 *   - Tier A: BroadcastChannel API ("grampay_voice_shield_bus") for instant < 2ms cross-window sync
 *   - Tier B: LocalStorage event bus with monotonic sequence numbering and collision prevention
 *   - Tier C: Polling & SSE stream fallback for remote network topology
 */

import type {
  DeviceRole,
  SecurityTier,
  CallState,
  GlobalSessionState,
  TelemetrySyncEvent,
  FarmerProfile,
  AcousticTelemetry,
  DetectifAiDeepfakeResult,
  DetectifAiSpeakerResult,
  ActiveChallenge,
  PayoutAuthorization,
  FraudSecurityAlert,
  DeflectionStats,
} from './types.ts';

export const BUS_CHANNEL_NAME = 'grampay_voice_shield_bus';
export const LOCAL_STORAGE_KEY = 'grampay_voice_shield_state';

const DEFAULT_FARMER_PROFILE: FarmerProfile = {
  farmerId: 'FRM_KA_MND_8832',
  farmerName: 'Ramesh Gowda',
  phoneNumber: '+919845012345',
  accountNumber: 'SBIN0040182_992144321',
  kccCardId: 'KCC-KA-2024-99812',
  preferredLanguage: 'kn-IN',
  dailyPayoutLimitInr: 25000.0,
  enrolledVoiceprintId: 'spk_ramesh_gowda_clean_v1',
};

const INITIAL_DEFLECTION_STATS: DeflectionStats = {
  totalDeflectedAttacks: 0,
  totalSavedInr: 0,
  directFundsProtectedInr: 0,
  activeLiveCredits: 1750,
};

export class TriDeviceStateSynchronizer {
  private role: DeviceRole;
  private state: GlobalSessionState;
  private broadcastChannel: BroadcastChannel | null = null;
  private subscribers: Array<(state: GlobalSessionState) => void> = [];
  private backendPollTimer: any = null;

  constructor(role: DeviceRole) {
    this.role = role;
    this.state = this.loadInitialState();
    this.initTransports();
  }

  private loadInitialState(): GlobalSessionState {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            ...parsed,
            activeRole: this.role,
          };
        }
      } catch (err) {
        console.warn('[Sync] Failed reading initial state from storage:', err);
      }
    }

    return {
      sessionId: `sess_${Date.now().toString(36)}`,
      sequenceNumber: 1,
      lastUpdatedTimestamp: Date.now(),
      callState: 'IDLE',
      activeRole: this.role,
      callerPhone: '+919845012345',
      profile: DEFAULT_FARMER_PROFILE,
      telemetry: {
        sampleRateHz: 16000,
        snrDb: 22.0,
        is8kHzTelephony: false,
        packetLossRate: 0.0,
        jitterMs: 1.2,
      },
      stats: INITIAL_DEFLECTION_STATS,
    };
  }

  private initTransports(): void {
    // 1. BroadcastChannel setup (Modern browser zero-latency IPC)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(BUS_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event: MessageEvent<TelemetrySyncEvent>) => {
          this.handleInboundEvent(event.data);
        };
      } catch (e) {
        console.warn('[Sync] BroadcastChannel unavailable, falling back to storage:', e);
      }
    }

    // 2. Window Storage Event listener (Cross-tab synchronization fallback)
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('storage', (event: StorageEvent) => {
        if (event.key === LOCAL_STORAGE_KEY && event.newValue) {
          try {
            const newState: GlobalSessionState = JSON.parse(event.newValue);
            if (newState.sequenceNumber > this.state.sequenceNumber) {
              this.state = { ...newState, activeRole: this.role };
              this.notifySubscribers();
            }
          } catch (e) {
            console.error('[Sync] Error processing storage event:', e);
          }
        }
      });
    }
  }

  public subscribe(callback: (state: GlobalSessionState) => void): () => void {
    this.subscribers.push(callback);
    callback(this.state);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private notifySubscribers(): void {
    for (const sub of this.subscribers) {
      try {
        sub(this.state);
      } catch (err) {
        console.error('[Sync] Subscriber notification error:', err);
      }
    }
  }

  public getState(): GlobalSessionState {
    return this.state;
  }

  public dispatchEvent(event: TelemetrySyncEvent): void {
    this.handleInboundEvent(event);

    // Broadcast across local bus
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(event);
    }

    // Persist to localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.warn('[Sync] LocalStorage write failed:', e);
      }
    }
  }

  private handleInboundEvent(event: TelemetrySyncEvent): void {
    this.state.sequenceNumber += 1;
    this.state.lastUpdatedTimestamp = Date.now();

    switch (event.type) {
      case 'CALL_INITIATED':
        this.state.sessionId = event.payload.sessionId;
        this.state.callState = 'CALL_CONNECTED';
        this.state.callerPhone = event.payload.callerPhone;
        this.state.assignedTier = undefined;
        this.state.challenge = undefined;
        this.state.payout = undefined;
        this.state.fraudAlert = undefined;
        break;

      case 'ACOUSTICS_UPDATED':
        this.state.telemetry = event.payload.telemetry;
        this.state.deepfake = event.payload.deepfake;
        this.state.speaker = event.payload.speaker;
        this.state.callState = 'ACOUSTIC_PROFILING';
        this.evaluatePolicyRouter();
        break;

      case 'TIER1_DISPATCHED':
        this.state.callState = 'TIER1_APPROVED';
        this.state.assignedTier = 'TIER_1_APPROVE';
        this.state.payout = event.payload.payout;
        break;

      case 'TIER2_CHALLENGE_GENERATED':
        this.state.callState = 'TIER2_CHALLENGE_ISSUED';
        this.state.assignedTier = 'TIER_2_CHALLENGE';
        this.state.challenge = event.payload.challenge;
        break;

      case 'TIER2_CHALLENGE_RESPONSE_SUBMITTED':
        if (event.payload.passed) {
          this.state.callState = 'TIER2_CHALLENGE_PASSED';
          this.dispatchTier1Payout();
        } else {
          this.state.callState = 'TIER3_BLOCKED';
          this.dispatchTier3Block('ACTIVE_CHALLENGE_PHRASE_FAILED');
        }
        break;

      case 'TIER3_BLOCKED_DISPATCHED':
        this.state.callState = 'TIER3_BLOCKED';
        this.state.assignedTier = 'TIER_3_BLOCK';
        this.state.fraudAlert = event.payload.alert;
        this.state.stats.totalDeflectedAttacks += 1;
        this.state.stats.totalSavedInr += event.payload.alert.costDeflectedInr;
        this.state.stats.directFundsProtectedInr += event.payload.alert.amountProtectedInr;
        break;

      case 'RESET_STATE':
        this.state.callState = 'IDLE';
        this.state.sessionId = event.payload.sessionId;
        this.state.challenge = undefined;
        this.state.payout = undefined;
        this.state.fraudAlert = undefined;
        break;
    }

    this.notifySubscribers();
  }

  /**
   * Deterministic 3-Tier Policy Router in TypeScript matching gate.py:
   *   - Tier 1: synth < 0.62 and similarity >= 0.53 -> APPROVE (IFFCO Fertilizer payout)
   *   - Tier 2: borderline synth 0.50-0.62 or 8kHz noise -> Nemotron Challenge
   *   - Tier 3: synth >= 0.62 -> BLOCK ALERT (Immediate drop <300ms, ₹20 saved)
   */
  public evaluatePolicyRouter(): void {
    if (!this.state.deepfake || !this.state.speaker) return;

    const synth = this.state.deepfake.synthesisScore;
    const sim = this.state.speaker.cosineSimilarity;
    const telem = this.state.telemetry;

    // Deduct DetectifAI credit
    if (this.state.stats.activeLiveCredits > 0) {
      this.state.stats.activeLiveCredits -= 1;
    }

    // TIER 3: BLOCK
    if (synth >= 0.62) {
      this.dispatchTier3Block('SYNTHESIS_SCORE_EXCEEDS_0.62');
      return;
    }

    // TIER 2: CHALLENGE
    const isBorderline = (synth >= 0.50 && synth < 0.62);
    const isNoiseRisk = telem.is8kHzTelephony || telem.sampleRateHz <= 8000 || telem.snrDb < 12.0;
    const isSimLow = sim < 0.53;

    if (isBorderline || isNoiseRisk || isSimLow) {
      this.dispatchTier2NemotronChallenge();
      return;
    }

    // TIER 1: APPROVE
    if (synth < 0.62 && sim >= 0.53) {
      this.dispatchTier1Payout();
      return;
    }
  }

  private dispatchTier1Payout(): void {
    const payout: PayoutAuthorization = {
      transactionId: `tx_iffco_${Math.random().toString(36).substring(2, 9)}`,
      status: 'AUTHORIZED',
      merchant: 'IFFCO Fertilizer Cooperative - Mandya',
      amountInr: 4200.0,
      beneficiaryAccount: this.state.profile.accountNumber,
      kccReference: this.state.profile.kccCardId,
      unlockedTools: [
        'banking_core.execute_neft_payout',
        'iffco_direct_delivery.release_fertilizer_token',
        'sms_notifier.send_farmer_receipt_kannada',
      ],
      timestampIso: new Date().toISOString(),
    };

    this.state.callState = 'TIER1_APPROVED';
    this.state.assignedTier = 'TIER_1_APPROVE';
    this.state.payout = payout;
  }

  private dispatchTier2NemotronChallenge(): void {
    const kannadaWords = ['ರಾಗಿ', 'ಬೆಳೆ', 'ಮಳೆ', 'ಗದ್ದೆ', 'ಗೊಬ್ಬರ', 'ಕಾವೇರಿ', 'ಹಸಿರು', 'ಕಿಸಾನ್'];
    const chosen: string[] = [];
    const pool = [...kannadaWords];
    for (let i = 0; i < 4; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      chosen.push(pool.splice(idx, 1)[0]);
    }

    const challenge: ActiveChallenge = {
      challengeId: `nemotron_${Math.random().toString(36).substring(2, 8)}`,
      language: 'kn-IN',
      words: chosen,
      phoneticTranscript: chosen.join(' - '),
      expectedResponseWindowMs: 5000,
      issuedAtNs: Date.now() * 1000000,
      promptInstruction: `ದಯವಿಟ್ಟು ಈ 4 ಪರಿಶೀಲನಾ ಪದಗಳನ್ನು ಹೇಳಿ: ${chosen.join(' - ')}`,
    };

    this.state.callState = 'TIER2_CHALLENGE_ISSUED';
    this.state.assignedTier = 'TIER_2_CHALLENGE';
    this.state.challenge = challenge;
  }

  private dispatchTier3Block(reason: string): void {
    const alert: FraudSecurityAlert = {
      alertId: `fraud_p0_${Math.random().toString(36).substring(2, 8)}`,
      sessionId: this.state.sessionId,
      callerPhone: this.state.callerPhone,
      farmerId: this.state.profile.farmerId,
      synthScore: this.state.deepfake?.synthesisScore || 0.88,
      similarityScore: this.state.speaker?.cosineSimilarity || 0.45,
      fundsFrozen: true,
      amountProtectedInr: 4200.0,
      costDeflectedInr: 20.0, // ₹20 saved by preventing 2m voicebot runtime
      actionTaken: `TERMINATED_CALL_AND_ALERTED_SOC (${reason})`,
      timestampIso: new Date().toISOString(),
    };

    this.state.callState = 'TIER3_BLOCKED';
    this.state.assignedTier = 'TIER_3_BLOCK';
    this.state.fraudAlert = alert;
    this.state.stats.totalDeflectedAttacks += 1;
    this.state.stats.totalSavedInr += 20.0;
    this.state.stats.directFundsProtectedInr += 4200.0;
  }

  public destroy(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    if (this.backendPollTimer) {
      clearInterval(this.backendPollTimer);
    }
    this.subscribers = [];
  }
}
