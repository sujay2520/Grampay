/**
 * GramPay (BharatVoice Shield) - Core Types & Telemetry Protocol
 * ==============================================================
 * Shared type definitions for Policy Router, DetectifAI API, and Tri-Device State Sync.
 */

export type DeviceRole = 'PHONE_1_FARMER' | 'PHONE_2_ATTACKER' | 'LAPTOP_CONSOLE_SOC';

export type SecurityTier = 'TIER_1_APPROVE' | 'TIER_2_CHALLENGE' | 'TIER_3_BLOCK';

export type IndicLanguage = 'kn-IN' | 'hi-IN' | 'en-IN';

export type CallState =
  | 'IDLE'
  | 'CALL_RINGING'
  | 'CALL_CONNECTED'
  | 'ACOUSTIC_PROFILING'
  | 'TIER1_APPROVED'
  | 'TIER2_CHALLENGE_ISSUED'
  | 'TIER2_CHALLENGE_VERIFYING'
  | 'TIER2_CHALLENGE_PASSED'
  | 'TIER3_BLOCKED'
  | 'PAYOUT_INITIATED'
  | 'PAYOUT_SETTLED'
  | 'CALL_TERMINATED';

export interface FarmerProfile {
  farmerId: string;
  farmerName: string;
  phoneNumber: string;
  accountNumber: string;
  kccCardId: string;
  preferredLanguage: IndicLanguage;
  dailyPayoutLimitInr: number;
  enrolledVoiceprintId: string;
}

export interface AcousticTelemetry {
  sampleRateHz: number;
  snrDb: number;
  is8kHzTelephony: boolean;
  spectralCentroidHz?: number;
  packetLossRate: number;
  jitterMs: number;
}

export interface DetectifAiDeepfakeResult {
  requestId: string;
  synthesisScore: number; // 0.0 - 1.0 (WavLM probability)
  isSynthetic: boolean;
  confidence: number;
  latencyMs: number;
  vocoderSignature?: 'ElevenLabs-Flash' | 'HiFi-GAN' | 'Natural_Human' | string;
  phaseJitterDetected: boolean;
}

export interface DetectifAiSpeakerResult {
  requestId: string;
  speakerVoiceprintId: string;
  cosineSimilarity: number; // -1.0 - 1.0
  isMatch: boolean;
  calibratedThreshold: number; // 0.53 default
  latencyMs: number;
}

export interface ActiveChallenge {
  challengeId: string;
  language: IndicLanguage;
  words: string[];
  phoneticTranscript: string;
  expectedResponseWindowMs: number;
  issuedAtNs: number;
  promptInstruction: string;
}

export interface PayoutAuthorization {
  transactionId: string;
  status: 'AUTHORIZED' | 'SETTLED' | 'FROZEN';
  merchant: string;
  amountInr: number;
  beneficiaryAccount: string;
  kccReference: string;
  unlockedTools: string[];
  timestampIso: string;
}

export interface FraudSecurityAlert {
  alertId: string;
  sessionId: string;
  callerPhone: string;
  farmerId: string;
  synthScore: number;
  similarityScore: number;
  fundsFrozen: boolean;
  amountProtectedInr: number;
  costDeflectedInr: number; // ₹20.00
  actionTaken: string;
  timestampIso: string;
}

export interface DeflectionStats {
  totalDeflectedAttacks: number;
  totalSavedInr: number; // ₹20 * attacks
  directFundsProtectedInr: number;
  activeLiveCredits: number; // 1,750 base
}

export interface GlobalSessionState {
  sessionId: string;
  sequenceNumber: number;
  lastUpdatedTimestamp: number;
  callState: CallState;
  activeRole: DeviceRole;
  callerPhone: string;
  profile: FarmerProfile;
  telemetry: AcousticTelemetry;
  deepfake?: DetectifAiDeepfakeResult;
  speaker?: DetectifAiSpeakerResult;
  assignedTier?: SecurityTier;
  challenge?: ActiveChallenge;
  payout?: PayoutAuthorization;
  fraudAlert?: FraudSecurityAlert;
  stats: DeflectionStats;
}

export type TelemetrySyncEvent =
  | { type: 'CALL_INITIATED'; payload: { sessionId: string; role: DeviceRole; callerPhone: string } }
  | { type: 'ACOUSTICS_UPDATED'; payload: { telemetry: AcousticTelemetry; deepfake: DetectifAiDeepfakeResult; speaker: DetectifAiSpeakerResult } }
  | { type: 'TIER1_DISPATCHED'; payload: { payout: PayoutAuthorization } }
  | { type: 'TIER2_CHALLENGE_GENERATED'; payload: { challenge: ActiveChallenge } }
  | { type: 'TIER2_CHALLENGE_RESPONSE_SUBMITTED'; payload: { spokenWords: string[]; passed: boolean } }
  | { type: 'TIER3_BLOCKED_DISPATCHED'; payload: { alert: FraudSecurityAlert } }
  | { type: 'RESET_STATE'; payload: { sessionId: string } };
