import { PolicyConfig, CaseContext, PolicyDecision, PolicyRule } from './types';

// Simplified import from reconstruction
interface TransactionTimeline {
  derived_state: string;
  anomalies: string[];
}

export function evaluatePolicy(
  timeline: TransactionTimeline,
  caseContext: CaseContext,
  policy: PolicyConfig
): PolicyDecision {
  
  // 1. Check blocked_customer_flags
  const hasBlockedFlag = caseContext.customer_flags.some(flag => 
    policy.global.blocked_customer_flags.includes(flag)
  );
  if (hasBlockedFlag) {
    return {
      action: 'ESCALATE',
      mode: 'MANUAL',
      rule_id: 'global_blocked_flag',
      rationale: 'Customer has blocked flag',
      requires_human: true
    };
  }

  // 2. Check escalate_if conditions
  const escalateIf = policy.global.escalate_if;
  if (escalateIf.confidence_below !== undefined && caseContext.confidence_score < escalateIf.confidence_below) {
    return escalateDecision('global_confidence', 'Confidence below threshold');
  }
  if (escalateIf.customer_text_contradicts_state && caseContext.customer_text_contradiction) {
    return escalateDecision('global_text_contradiction', 'Customer text contradicts state');
  }
  if (escalateIf.amount_gt !== undefined && caseContext.amount > escalateIf.amount_gt) {
    return escalateDecision('global_amount_gt', 'Amount exceeds global threshold');
  }
  if (escalateIf.repeat_disputes_gt !== undefined && caseContext.repeat_disputes_count > escalateIf.repeat_disputes_gt) {
    return escalateDecision('global_repeat_disputes', 'Repeat disputes exceed threshold');
  }

  // 3. Find first matching rule
  for (const rule of policy.rules) {
    if (ruleMatches(rule, timeline, caseContext)) {
      return {
        action: rule.action,
        mode: rule.mode,
        rule_id: rule.id,
        rationale: rule.rationale,
        requires_human: rule.mode === 'MANUAL'
      };
    }
  }

  // 4. Default to escalate
  return escalateDecision('default_escalate', 'No policy rule matched');
}

function escalateDecision(rule_id: string, rationale: string): PolicyDecision {
  return {
    action: 'ESCALATE',
    mode: 'MANUAL',
    rule_id,
    rationale,
    requires_human: true
  };
}

function ruleMatches(rule: PolicyRule, timeline: TransactionTimeline, context: CaseContext): boolean {
  if (rule.derived_state && rule.derived_state !== timeline.derived_state) return false;
  if (rule.amount_lte !== undefined && context.amount > rule.amount_lte) return false;
  if (rule.amount_gt !== undefined && context.amount <= rule.amount_gt) return false;
  
  if (rule.anomalies) {
    const hasAllAnomalies = rule.anomalies.every(a => timeline.anomalies.includes(a));
    if (!hasAllAnomalies) return false;
  }
  
  if (rule.duplicate_case !== undefined && rule.duplicate_case !== context.duplicate_case) return false;

  return true;
}
