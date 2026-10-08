export interface EscalateIfCondition {
  confidence_below?: number;
  customer_text_contradicts_state?: boolean;
  amount_gt?: number;
  repeat_disputes_gt?: number;
}

export interface PolicyRule {
  id: string;
  derived_state?: string;
  amount_lte?: number;
  amount_gt?: number;
  anomalies?: string[];
  duplicate_case?: boolean;
  action: string;
  mode: string;
  rationale: string;
}

export interface PolicyGlobal {
  blocked_customer_flags: string[];
  escalate_if: EscalateIfCondition;
}

export interface PolicyConfig {
  global: PolicyGlobal;
  rules: PolicyRule[];
}

export interface CaseContext {
  customer_flags: string[];
  confidence_score: number;
  customer_text_contradiction: boolean;
  amount: number;
  repeat_disputes_count: number;
  duplicate_case: boolean;
}

export interface PolicyDecision {
  action: string;
  mode: string;
  rule_id: string;
  rationale: string;
  requires_human: boolean;
}
