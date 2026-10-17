"""
GramPay (BharatVoice Shield) - BFSI Call Center Cost Deflection Model (cost_model.py)
====================================================================================
Mathematical Equations, Unit Economics, and Deflection Analytics.

Unit Cost Breakdown for Modern Generative Voice Banking Agents:
---------------------------------------------------------------
1. Telephony (Inbound PSTN / SIP Trunking):        ₹1.50 / min  ($0.018/min)
2. Speech-to-Text (STT - Indic Conformer/Whisper): ₹0.80 / min  ($0.0096/min)
3. Large Language Model (LLM - Reasoning/Tools):  ₹4.00 / min  ($0.048/min)
4. Text-to-Speech (TTS - Neural Indic Synthesis):  ₹3.70 / min  ($0.0444/min)
---------------------------------------------------------------
TOTAL UN-GATED VOICEBOT RUNTIME COST:             ₹10.00 / min ($0.12/min)

The Attack Vulnerability Window:
--------------------------------
- Adversarial Voice Clone Attack Average Duration (tau_attack): 2.0 minutes
  (Adversary conversational prompt injection, social engineering, OTP phishing,
   or attempting unauthorized Kisan Credit Card beneficiary additions).
- Un-Gated Cost per Attack:
    Cost_ungated = tau_attack * Total_Runtime_Cost
                 = 2.0 min * ₹10.00/min
                 = ₹20.00 wasted per fraudulent call.

BharatVoice Shield Pre-Gating Model:
------------------------------------
- Gate Execution Latency: < 300 ms (tau_gate <= 0.005 min)
- DetectifAI Verification Unit Cost (C_gate): ₹0.20 per API call
- Action on Tier 3 (synth >= 0.62):
    Immediate call termination < 300ms.
    Skips 100% of STT, LLM inference, TTS generation, and remaining telephony.
- Gross Savings per Attack: ₹20.00
- Net Savings per Intercepted Attack:
    Net_Savings = Cost_ungated - C_gate = ₹20.00 - ₹0.20 = ₹19.80
- Deflection Ratio: 99.0%
"""

from __future__ import annotations

from typing import Dict, Any, List
from pydantic import BaseModel, Field


class VoicebotUnitEconomics(BaseModel):
    telephony_per_min_inr: float = 1.50
    stt_per_min_inr: float = 0.80
    llm_per_min_inr: float = 4.00
    tts_per_min_inr: float = 3.70
    gate_inspection_cost_inr: float = 0.20
    avg_attack_duration_mins: float = 2.00
    gate_decision_time_sec: float = 0.30  # 300ms

    @property
    def total_cost_per_minute_inr(self) -> float:
        return (
            self.telephony_per_min_inr
            + self.stt_per_min_inr
            + self.llm_per_min_inr
            + self.tts_per_min_inr
        )

    @property
    def cost_per_ungated_attack_inr(self) -> float:
        return self.total_cost_per_minute_inr * self.avg_attack_duration_mins

    @property
    def net_savings_per_attack_inr(self) -> float:
        return self.cost_per_ungated_attack_inr - self.gate_inspection_cost_inr

    @property
    def deflection_percentage(self) -> float:
        return (self.net_savings_per_attack_inr / self.cost_per_ungated_attack_inr) * 100.0


class DeflectionProjection(BaseModel):
    fraud_volume_monthly: int
    gross_loss_without_gate_inr: float
    total_gate_cost_inr: float
    net_deflected_savings_inr: float
    payout_funds_protected_inr: float
    roi_multiple: float


class BFSICostDeflectionCalculator:
    """
    Mathematical cost deflection calculator for Indian Enterprise BFSI Voice Systems.
    """

    def __init__(self, economics: VoicebotUnitEconomics = VoicebotUnitEconomics()):
        self.eco = economics

    def calculate_attack_comparison(self) -> Dict[str, Any]:
        """
        Returns step-by-step breakdown comparing un-gated vs BharatVoice Shield gated pipeline.
        """
        return {
            "un_gated_pipeline": {
                "telephony_cost_inr": self.eco.telephony_per_min_inr * self.eco.avg_attack_duration_mins,
                "stt_cost_inr": self.eco.stt_per_min_inr * self.eco.avg_attack_duration_mins,
                "llm_cost_inr": self.eco.llm_per_min_inr * self.eco.avg_attack_duration_mins,
                "tts_cost_inr": self.eco.tts_per_min_inr * self.eco.avg_attack_duration_mins,
                "total_wasted_per_call_inr": self.eco.cost_per_ungated_attack_inr,
                "agent_steps_executed": ["ASR_Streaming", "LLM_Context_Retrieval", "Tool_Authorization_Attempt", "TTS_Synthesis"],
                "payout_risk": "HIGH_COMPROMISE",
            },
            "bharatvoice_shield_gated_pipeline": {
                "gate_inspection_cost_inr": self.eco.gate_inspection_cost_inr,
                "stt_cost_inr": 0.0,
                "llm_cost_inr": 0.0,
                "tts_cost_inr": 0.0,
                "telephony_terminated_at_sec": self.eco.gate_decision_time_sec,
                "total_incurred_per_attack_inr": self.eco.gate_inspection_cost_inr,
                "agent_steps_executed": ["GATE_TERMINATION_ONLY"],
                "gross_savings_inr": self.eco.cost_per_ungated_attack_inr,
                "net_savings_inr": self.eco.net_savings_per_attack_inr,
                "deflection_efficiency_percent": round(self.eco.deflection_percentage, 2),
                "payout_risk": "FUNDS_FROZEN_ZERO_LOSS",
            },
        }

    def project_volume_scale(
        self,
        monthly_fraud_attacks: int = 50000,
        avg_payout_amount_inr: float = 4200.0,
    ) -> DeflectionProjection:
        """
        Calculates organizational monthly savings and protected transaction capital.
        """
        gross_loss = monthly_fraud_attacks * self.eco.cost_per_ungated_attack_inr
        gate_costs = monthly_fraud_attacks * self.eco.gate_inspection_cost_inr
        net_savings = gross_loss - gate_costs
        funds_protected = monthly_fraud_attacks * avg_payout_amount_inr
        roi = round(gross_loss / gate_costs, 2) if gate_costs > 0 else 0.0

        return DeflectionProjection(
            fraud_volume_monthly=monthly_fraud_attacks,
            gross_loss_without_gate_inr=gross_loss,
            total_gate_cost_inr=gate_costs,
            net_deflected_savings_inr=net_savings,
            payout_funds_protected_inr=funds_protected,
            roi_multiple=roi,
        )


if __name__ == "__main__":
    calc = BFSICostDeflectionCalculator()
    comp = calc.calculate_attack_comparison()
    
    print("\n--- VOICEBOT RUNTIME COST BREAKDOWN ---")
    print(f"Telephony:       INR {calc.eco.telephony_per_min_inr:.2f} / min")
    print(f"STT (Indic):     INR {calc.eco.stt_per_min_inr:.2f} / min")
    print(f"LLM (Gemini/Nem):INR {calc.eco.llm_per_min_inr:.2f} / min")
    print(f"TTS:             INR {calc.eco.tts_per_min_inr:.2f} / min")
    print(f"TOTAL RATE:      INR {calc.eco.total_cost_per_minute_inr:.2f} / min")
    print(f"Un-Gated 2m Attk:INR {calc.eco.cost_per_ungated_attack_inr:.2f} wasted")
    print(f"Shield Pre-Gate: INR {calc.eco.gate_inspection_cost_inr:.2f} cost -> Net Saved: INR {calc.eco.net_savings_per_attack_inr:.2f} (99%)")

    proj = calc.project_volume_scale(monthly_fraud_attacks=50000)
    print("\n--- 50,000 MONTHLY ATTACK DEFLECTION PROJECTION ---")
    print(f"Gross Agent Runtime Deflected: INR {proj.gross_loss_without_gate_inr:,.2f} (Rs. 10 Lakhs)")
    print(f"DetectifAI Gate Cost:          INR {proj.total_gate_cost_inr:,.2f}")
    print(f"Net Operational Savings:       INR {proj.net_deflected_savings_inr:,.2f}")
    print(f"Direct Fraud Payouts Frozen:   INR {proj.payout_funds_protected_inr:,.2f} (Rs. 21 Crores)")
    print(f"Security ROI Multiple:         {proj.roi_multiple}x")
