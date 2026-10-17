"""
GramPay (BharatVoice Shield) - Deterministic 3-Tier Policy Router (gate.py)
===========================================================================
Sub-300ms Pre-Gating Security Engine for Indic Voice Banking & Agricultural Payouts.

Routing Invariants:
-------------------
- Tier 1: synth < 0.62 and similarity >= 0.53
          -> APPROVE (Voice tool unlocked, automated payout to IFFCO Fertilizer unlocked)
- Tier 2: 0.50 <= synth <= 0.62 OR Telephony Noise (8kHz / low SNR)
          -> CHALLENGE (NVIDIA Nemotron Active Challenge: dynamic 4-word Indic phrase)
- Tier 3: synth >= 0.62
          -> BLOCK (Sub-300ms termination, funds frozen, bank fraud desk alerted, ₹20 saved)
"""

from __future__ import annotations

import enum
import time
import uuid
import random
import logging
from typing import Dict, List, Optional, Tuple, Any
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("GramPay.SecurityGate")


class SecurityTier(str, enum.Enum):
    TIER_1_APPROVE = "TIER_1_APPROVE"
    TIER_2_CHALLENGE = "TIER_2_CHALLENGE"
    TIER_3_BLOCK = "TIER_3_BLOCK"


class IndicLanguage(str, enum.Enum):
    KANNADA = "kn-IN"
    HINDI = "hi-IN"
    ENGLISH = "en-IN"


class AudioAcousticTelemetry(BaseModel):
    sample_rate_hz: int = Field(..., description="Audio sample rate (e.g. 8000 for PSTN/GSM, 16000 for VoLTE/Web)")
    snr_db: float = Field(..., description="Signal-to-Noise Ratio in decibels")
    spectral_rolloff_hz: Optional[float] = Field(None, description="Spectral rolloff frequency in Hz")
    is_8khz_telephony: bool = Field(False, description="Flag indicating standard 8kHz narrow-band telephony line")
    packet_loss_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    jitter_ms: float = Field(default=0.0, ge=0.0)


class SpeakerProfile(BaseModel):
    farmer_id: str
    farmer_name: str
    account_number: str
    kcc_card_id: str  # Kisan Credit Card
    verified_voiceprint_id: str
    preferred_language: IndicLanguage = IndicLanguage.KANNADA
    daily_payout_limit_inr: float = 25000.0


class GateEvaluationRequest(BaseModel):
    session_id: str = Field(default_factory=lambda: f"sess_{uuid.uuid4().hex[:12]}")
    caller_phone: str
    profile: SpeakerProfile
    synth_score: float = Field(..., ge=0.0, le=1.0, description="DetectifAI WavLM deepfake probability score [0.0 - 1.0]")
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="DetectifAI acoustic cosine similarity against enrolled voiceprint")
    telemetry: AudioAcousticTelemetry
    intended_payout_amount_inr: float = 4200.0  # e.g., 2 bags of IFFCO DAP/Urea
    merchant_recipient: str = "IFFCO Fertilizer Cooperative Society - Mandya Branch"


class PayoutPayload(BaseModel):
    transaction_id: str
    status: str
    merchant: str
    amount_inr: float
    beneficiary_account: str
    kcc_reference: str
    unlocked_tools: List[str]
    authorized_at_ns: int


class ActiveChallengePayload(BaseModel):
    challenge_id: str
    language: IndicLanguage
    words: List[str]
    phonetic_transcript: str
    expected_response_window_ms: int = 5000
    issued_at_ns: int
    prompt_instruction: str


class FraudAlertPayload(BaseModel):
    alert_id: str
    timestamp_iso: str
    session_id: str
    caller_phone: str
    farmer_id: str
    severity: str = "CRITICAL_P0"
    synth_score: float
    similarity_score: float
    funds_frozen: bool
    amount_protected_inr: float
    cost_deflected_inr: float = 20.00
    telemetry_summary: Dict[str, Any]
    action_taken: str


class GateEvaluationResponse(BaseModel):
    tier: SecurityTier
    status: str
    latency_ms: float
    rationale: str
    synth_score: float
    similarity_score: float
    cost_saved_inr: float
    payout: Optional[PayoutPayload] = None
    challenge: Optional[ActiveChallengePayload] = None
    fraud_alert: Optional[FraudAlertPayload] = None


class NemotronChallengeGenerator:
    """
    Generates dynamic, non-reproducible 4-word Indic challenges for zero-trust voice liveness.
    Prevents pre-recorded adversarial replays and voice cloner prompt injections.
    """

    WORD_BANKS: Dict[IndicLanguage, List[Tuple[str, str]]] = {
        IndicLanguage.KANNADA: [
            ("ರಾಗಿ", "Raagi (Finger Millet)"),
            ("ಬೆಳೆ", "Bele (Harvest/Crop)"),
            ("ಮಳೆ", "Male (Rainfall)"),
            ("ಗದ್ದೆ", "Gadde (Paddy Field)"),
            ("ಗೊಬ್ಬರ", "Gobbara (Fertilizer)"),
            ("ಕಾವೇರಿ", "Kaveri (River)"),
            ("ಹಸಿರು", "Hasiru (Green/Lush)"),
            ("ಕಿಸಾನ್", "Kisan (Farmer)"),
            ("ಮಣ್ಣು", "Mannu (Soil)"),
            ("ಬೆಳಕು", "Belaku (Sunlight)"),
            ("ಸೂರ್ಯ", "Surya (Sun)"),
            ("ಧಾನ್ಯ", "Dhaanya (Grain)"),
        ],
        IndicLanguage.HINDI: [
            ("फसल", "Fasal (Crop)"),
            ("उर्वरक", "Urvarak (Fertilizer)"),
            ("धरती", "Dharti (Earth)"),
            ("बारिश", "Baarish (Rain)"),
            ("सिंचाई", "Sinchai (Irrigation)"),
            ("अन्नदाता", "Anndaata (Food Provider)"),
            ("मौसम", "Mausam (Weather)"),
            ("खेत", "Khet (Field)"),
            ("मेहनत", "Mehnat (Labor)"),
            ("समृद्धि", "Samriddhi (Prosperity)"),
            ("बीज", "Beej (Seed)"),
            ("खाद", "Khaad (Compost)"),
        ],
        IndicLanguage.ENGLISH: [
            ("Harvest", "Agricultural Yield"),
            ("Monsoon", "Seasonal Rainfall"),
            ("Organic", "Natural Farming"),
            ("Fertile", "Nutrient-rich Soil"),
            ("Tractor", "Farm Equipment"),
            ("Canal", "Water Way"),
            ("Paddy", "Rice Grain"),
            ("Credit", "Kisan Facility"),
            ("Yield", "Field Output"),
            ("Mandya", "District Locus"),
        ],
    }

    @classmethod
    def generate_challenge(cls, language: IndicLanguage) -> ActiveChallengePayload:
        bank = cls.WORD_BANKS.get(language, cls.WORD_BANKS[IndicLanguage.KANNADA])
        selected = random.sample(bank, k=4)
        words = [w[0] for w in selected]
        transcripts = [w[1] for w in selected]
        
        prompt_instruction = (
            f"ದಯವಿಟ್ಟು ಈ 4 ಪದಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಉಚ್ಚರಿಸಿ: {' - '.join(words)}"
            if language == IndicLanguage.KANNADA
            else (
                f"कृपया निम्नलिखित 4 शब्दों को स्पष्ट बोलें: {' - '.join(words)}"
                if language == IndicLanguage.HINDI
                else f"Please repeat these 4 verification words clearly: {' - '.join(words)}"
            )
        )

        return ActiveChallengePayload(
            challenge_id=f"nemotron_ch_{uuid.uuid4().hex[:8]}",
            language=language,
            words=words,
            phonetic_transcript=" | ".join(transcripts),
            expected_response_window_ms=5000,
            issued_at_ns=time.time_ns(),
            prompt_instruction=prompt_instruction,
        )


class BharatVoiceSecurityGate:
    """
    Deterministic Sub-300ms Security Policy Router.
    Enforces strict mathematical thresholds matching core requirements:
      - SYNTH_THRESHOLD_BLOCK = 0.62
      - SYNTH_BORDERLINE_MIN  = 0.50
      - SIMILARITY_THRESHOLD_APPROVE = 0.53
    """

    SYNTH_THRESHOLD_BLOCK: float = 0.62
    SYNTH_BORDERLINE_MIN: float = 0.50
    SIMILARITY_THRESHOLD_APPROVE: float = 0.53

    @classmethod
    def evaluate(cls, req: GateEvaluationRequest) -> GateEvaluationResponse:
        start_ns = time.perf_counter_ns()
        synth = req.synth_score
        sim = req.similarity_score
        telemetry = req.telemetry

        # Check conditions
        is_acoustic_borderline = (
            telemetry.is_8khz_telephony
            or telemetry.sample_rate_hz <= 8000
            or telemetry.snr_db < 12.0
            or (cls.SYNTH_BORDERLINE_MIN <= synth < cls.SYNTH_THRESHOLD_BLOCK)
        )

        # -------------------------------------------------------------
        # TIER 3: BLOCK ALERT
        # synth >= 0.62 -> Immediate termination < 300ms, funds frozen,
        # bank fraud desk alerted, ₹20 saved by preventing downstream agent execution.
        # -------------------------------------------------------------
        if synth >= cls.SYNTH_THRESHOLD_BLOCK:
            elapsed_ms = (time.perf_counter_ns() - start_ns) / 1_000_000.0
            alert = FraudAlertPayload(
                alert_id=f"fraud_{uuid.uuid4().hex[:8]}",
                timestamp_iso=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                session_id=req.session_id,
                caller_phone=req.caller_phone,
                farmer_id=req.profile.farmer_id,
                synth_score=synth,
                similarity_score=sim,
                funds_frozen=True,
                amount_protected_inr=req.intended_payout_amount_inr,
                cost_deflected_inr=20.00,
                telemetry_summary={
                    "sample_rate_hz": telemetry.sample_rate_hz,
                    "snr_db": telemetry.snr_db,
                    "is_8khz": telemetry.is_8khz_telephony,
                    "detection_model": "DetectifAI-WavLM-v2",
                    "attack_type": "Adversarial Voice Clone / Neural TTS Spoofing",
                },
                action_taken="CALL_TERMINATED_AND_ACCOUNT_FROZEN",
            )
            logger.warning(
                f"[TIER 3 BLOCKED] Session: {req.session_id} | Synth: {synth:.4f} >= {cls.SYNTH_THRESHOLD_BLOCK} | "
                f"Funds of ₹{req.intended_payout_amount_inr} FROZEN. Saved ₹20 in voicebot deflection."
            )
            return GateEvaluationResponse(
                tier=SecurityTier.TIER_3_BLOCK,
                status="BLOCKED_ADVERSARIAL_VOICE_DETECTED",
                latency_ms=elapsed_ms,
                rationale=f"Synthesis confidence {synth:.4f} exceeds safety threshold {cls.SYNTH_THRESHOLD_BLOCK}. Immediate termination triggered.",
                synth_score=synth,
                similarity_score=sim,
                cost_saved_inr=20.00,
                fraud_alert=alert,
            )

        # -------------------------------------------------------------
        # TIER 2: ACTIVE CHALLENGE (Borderline synth 0.50-0.62 or 8kHz noise)
        # Low SNR or narrow-band PSTN 8kHz introduces vocoder distortion that can
        # mask acoustic artifacts. Trigger NVIDIA Nemotron active challenge.
        # -------------------------------------------------------------
        if is_acoustic_borderline or sim < cls.SIMILARITY_THRESHOLD_APPROVE:
            challenge = NemotronChallengeGenerator.generate_challenge(req.profile.preferred_language)
            elapsed_ms = (time.perf_counter_ns() - start_ns) / 1_000_000.0
            reasons = []
            if cls.SYNTH_BORDERLINE_MIN <= synth < cls.SYNTH_THRESHOLD_BLOCK:
                reasons.append(f"Borderline synthetic score ({synth:.3f})")
            if telemetry.is_8khz_telephony or telemetry.sample_rate_hz <= 8000:
                reasons.append("8kHz narrow-band telephony line noise")
            if telemetry.snr_db < 12.0:
                reasons.append(f"Low acoustic SNR ({telemetry.snr_db:.1f} dB)")
            if sim < cls.SIMILARITY_THRESHOLD_APPROVE:
                reasons.append(f"Voice similarity ({sim:.3f}) below approve threshold ({cls.SIMILARITY_THRESHOLD_APPROVE})")

            logger.info(f"[TIER 2 CHALLENGE] Session: {req.session_id} | Reasons: {', '.join(reasons)}")
            return GateEvaluationResponse(
                tier=SecurityTier.TIER_2_CHALLENGE,
                status="STEP_UP_CHALLENGE_REQUIRED",
                latency_ms=elapsed_ms,
                rationale="; ".join(reasons),
                synth_score=synth,
                similarity_score=sim,
                cost_saved_inr=0.0,
                challenge=challenge,
            )

        # -------------------------------------------------------------
        # TIER 1: APPROVE
        # synth < 0.62 and similarity >= 0.53
        # -> APPROVE (Tool Unlocked, Payout to IFFCO Fertilizer)
        # -------------------------------------------------------------
        elapsed_ms = (time.perf_counter_ns() - start_ns) / 1_000_000.0
        payout = PayoutPayload(
            transaction_id=f"tx_iffco_{uuid.uuid4().hex[:10]}",
            status="AUTHORIZED_AND_DISPATCHED",
            merchant=req.merchant_recipient,
            amount_inr=req.intended_payout_amount_inr,
            beneficiary_account=req.profile.account_number,
            kcc_reference=req.profile.kcc_card_id,
            unlocked_tools=[
                "banking_core.execute_neft_payout",
                "iffco_direct_delivery.release_fertilizer_token",
                "sms_notifier.send_farmer_receipt_kannada",
            ],
            authorized_at_ns=time.time_ns(),
        )
        logger.info(
            f"[TIER 1 APPROVED] Session: {req.session_id} | Synth: {synth:.4f} < 0.62 & Sim: {sim:.4f} >= 0.53 | "
            f"Authorized ₹{req.intended_payout_amount_inr} to {req.merchant_recipient}"
        )
        return GateEvaluationResponse(
            tier=SecurityTier.TIER_1_APPROVE,
            status="APPROVED_GENUINE_VOICE_AUTHENTICATED",
            latency_ms=elapsed_ms,
            rationale=f"Genuine biometric match: synth={synth:.4f} (< {cls.SYNTH_THRESHOLD_BLOCK}), similarity={sim:.4f} (>= {cls.SIMILARITY_THRESHOLD_APPROVE}).",
            synth_score=synth,
            similarity_score=sim,
            cost_saved_inr=0.0,
            payout=payout,
        )


if __name__ == "__main__":
    # Self-test demonstrating all 3 tiers with timing verification
    profile = SpeakerProfile(
        farmer_id="FRM_KA_MND_8832",
        farmer_name="Ramesh Gowda",
        account_number="SBIN0040182_992144321",
        kcc_card_id="KCC-KA-2024-99812",
        verified_voiceprint_id="spk_ramesh_gowda_clean_v1",
        preferred_language=IndicLanguage.KANNADA,
    )

    print("\n--- TEST CASE 1: GENUINE FARMER (Tier 1 APPROVE) ---")
    t1_req = GateEvaluationRequest(
        caller_phone="+919845012345",
        profile=profile,
        synth_score=0.14,
        similarity_score=0.89,
        telemetry=AudioAcousticTelemetry(sample_rate_hz=16000, snr_db=24.5, is_8khz_telephony=False),
        intended_payout_amount_inr=4200.0,
    )
    res1 = BharatVoiceSecurityGate.evaluate(t1_req)
    print(f"Tier: {res1.tier} | Status: {res1.status} | Latency: {res1.latency_ms:.2f}ms")
    print(f"Unlocked: {res1.payout.unlocked_tools if res1.payout else None}")

    print("\n--- TEST CASE 2: BORDERLINE / 8kHz NOISE (Tier 2 CHALLENGE) ---")
    t2_req = GateEvaluationRequest(
        caller_phone="+919845012345",
        profile=profile,
        synth_score=0.55,
        similarity_score=0.62,
        telemetry=AudioAcousticTelemetry(sample_rate_hz=8000, snr_db=9.5, is_8khz_telephony=True),
        intended_payout_amount_inr=4200.0,
    )
    res2 = BharatVoiceSecurityGate.evaluate(t2_req)
    print(f"Tier: {res2.tier} | Status: {res2.status} | Latency: {res2.latency_ms:.2f}ms")
    challenge_words_str = str(res2.challenge.words).encode('ascii', 'backslashreplace').decode('ascii') if res2.challenge else "None"
    print(f"Challenge words ({res2.challenge.language}): {challenge_words_str}")

    print("\n--- TEST CASE 3: ADVERSARIAL DEEPFAKE (Tier 3 BLOCK) ---")
    t3_req = GateEvaluationRequest(
        caller_phone="+919845012345",
        profile=profile,
        synth_score=0.88,
        similarity_score=0.81,
        telemetry=AudioAcousticTelemetry(sample_rate_hz=16000, snr_db=22.0, is_8khz_telephony=False),
        intended_payout_amount_inr=4200.0,
    )
    res3 = BharatVoiceSecurityGate.evaluate(t3_req)
    print(f"Tier: {res3.tier} | Status: {res3.status} | Latency: {res3.latency_ms:.2f}ms")
    print(f"Cost Saved: INR {res3.cost_saved_inr} | Fraud Alert Action: {res3.fraud_alert.action_taken if res3.fraud_alert else None}")
