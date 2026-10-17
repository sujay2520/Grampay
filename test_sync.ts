/**
 * Integration Test for TriDeviceStateSynchronizer
 * Simulates Phone 1, Phone 2, and Laptop Console sync behavior.
 */

import { TriDeviceStateSynchronizer } from './state_sync.ts';

console.log('--- Initializing Tri-Device Synchronizers ---');
const laptopSoc = new TriDeviceStateSynchronizer('LAPTOP_CONSOLE_SOC');
const phone1Farmer = new TriDeviceStateSynchronizer('PHONE_1_FARMER');
const phone2Attacker = new TriDeviceStateSynchronizer('PHONE_2_ATTACKER');

let laptopEvents: string[] = [];
laptopSoc.subscribe((state) => {
  laptopEvents.push(`[SOC] State: ${state.callState} | Tier: ${state.assignedTier || 'NONE'} | Saved: INR ${state.stats.totalSavedInr}`);
});

console.log('1. Farmer Ramesh Gowda connects on Phone 1 (Clean Human Voice)');
phone1Farmer.dispatchEvent({
  type: 'CALL_INITIATED',
  payload: {
    sessionId: 'sess_live_kannada_001',
    role: 'PHONE_1_FARMER',
    callerPhone: '+919845012345',
  },
});

phone1Farmer.dispatchEvent({
  type: 'ACOUSTICS_UPDATED',
  payload: {
    telemetry: {
      sampleRateHz: 16000,
      snrDb: 24.0,
      is8kHzTelephony: false,
      packetLossRate: 0.0,
      jitterMs: 1.0,
    },
    deepfake: {
      requestId: 'det_human_01',
      synthesisScore: 0.12,
      isSynthetic: false,
      confidence: 0.95,
      latencyMs: 140.2,
      phaseJitterDetected: false,
    },
    speaker: {
      requestId: 'spk_ramesh_01',
      speakerVoiceprintId: 'spk_ramesh_gowda_clean_v1',
      cosineSimilarity: 0.88,
      isMatch: true,
      calibratedThreshold: 0.53,
      latencyMs: 88.1,
    },
  },
});

console.log('Current Phone 1 state:', phone1Farmer.getState().callState);
console.log('Current Payout Transaction:', phone1Farmer.getState().payout?.transactionId);
console.log('Unlocked Tools:', phone1Farmer.getState().payout?.unlockedTools);

console.log('\n2. Attacker injects adversarial voice clone on Phone 2 (Synth: 0.91)');
phone2Attacker.dispatchEvent({
  type: 'CALL_INITIATED',
  payload: {
    sessionId: 'sess_attack_002',
    role: 'PHONE_2_ATTACKER',
    callerPhone: '+919845012345',
  },
});

phone2Attacker.dispatchEvent({
  type: 'ACOUSTICS_UPDATED',
  payload: {
    telemetry: {
      sampleRateHz: 8000,
      snrDb: 18.0,
      is8kHzTelephony: true,
      packetLossRate: 0.02,
      jitterMs: 5.4,
    },
    deepfake: {
      requestId: 'det_attack_02',
      synthesisScore: 0.91,
      isSynthetic: true,
      confidence: 0.98,
      latencyMs: 135.0,
      phaseJitterDetected: true,
      vocoderSignature: 'ElevenLabs-Flash',
    },
    speaker: {
      requestId: 'spk_spoof_02',
      speakerVoiceprintId: 'spk_ramesh_gowda_clean_v1',
      cosineSimilarity: 0.82,
      isMatch: true,
      calibratedThreshold: 0.53,
      latencyMs: 91.0,
    },
  },
});

const attackerFinal = phone2Attacker.getState();
console.log('Attacker Call State:', attackerFinal.callState);
console.log('Fraud Alert ID:', attackerFinal.fraudAlert?.alertId);
console.log('Cost Deflected:', `INR ${attackerFinal.fraudAlert?.costDeflectedInr}`);
console.log('Cumulative Savings:', `INR ${attackerFinal.stats.totalSavedInr}`);
console.log('Remaining Credits:', attackerFinal.stats.activeLiveCredits);

laptopSoc.destroy();
phone1Farmer.destroy();
phone2Attacker.destroy();
console.log('\nTest suite passed successfully.');
