export interface ConfidenceParams {
    derived_state_certainty: string;
    evidence_completeness: number; // 0 to 1
    anomaly_penalty: number; // 0 to 1
    contradiction_penalty: number; // 0 to 1
    similar_case_agreement_factor: number; // e.g., 0.9 to 1.1
}

const BaseCertaintyMap: Record<string, number> = {
    'FAILED_NOT_REVERSED': 0.98,
    'COMPLETED': 0.97,
    'FAILED_REVERSED': 0.97,
    'PENDING_REVERSAL': 0.80,
    'IN_FLIGHT': 0.70,
    'INDETERMINATE': 0.50,
    'CONFLICT': 0.20
};

export function computeConfidence(params: ConfidenceParams): number {
    const base = BaseCertaintyMap[params.derived_state_certainty] || 0.5;
    
    let confidence = base 
        * params.evidence_completeness 
        * (1 - params.anomaly_penalty) 
        * (1 - params.contradiction_penalty) 
        * params.similar_case_agreement_factor;
        
    return Math.max(0, Math.min(1, confidence)); // clamp between 0 and 1
}
