export interface ActionRequest {
  case_id: string;
  action_type: string;
  attempt_group: string;
  transaction_ref: string;
  amount: number;
}

export interface ActionResult {
  success: boolean;
  status: string;
  reason?: string;
}

// Dummy DbClient and PolicyConfig for typings since we don't have the full implementations here
export interface DbClient {
  query(sql: string, params: any[]): Promise<any>;
}
export interface PolicyConfig {
  global: {
    blocked_customer_flags: string[];
  };
}

export class ActionExecutor {
  // Simple limits for demonstration
  private static MAX_AMOUNT = 5000; 

  async executeAction(
    action: ActionRequest, 
    policy: PolicyConfig, 
    db: DbClient
  ): Promise<ActionResult> {
    
    // 1. Kill switch check
    const isKillSwitchActive = process.env.KILL_SWITCH === 'true';
    if (isKillSwitchActive) {
      return { success: false, status: 'ESCALATED', reason: 'Kill switch active' };
    }

    // 2. Limits check
    if (action.amount > ActionExecutor.MAX_AMOUNT) {
      return { success: false, status: 'ESCALATED', reason: 'Amount exceeds per-action limit' };
    }
    // (Per-hour value cap logic would be implemented by querying db)

    // 3. Pre-flight checks: customer flags, etc.
    const { rows } = await db.query('SELECT flags FROM customers WHERE case_id = $1', [action.case_id]);
    const customerFlags: string[] = rows[0]?.flags || [];
    
    const hasBlockedFlag = customerFlags.some(flag => 
      policy.global.blocked_customer_flags.includes(flag)
    );
    if (hasBlockedFlag) {
      return { success: false, status: 'ESCALATED', reason: 'Customer flag became blocked' };
    }

    // 4. Execute via connector with idempotency key
    const idempotencyKey = `${action.case_id}_${action.action_type}_${action.attempt_group}`;
    
    try {
      if (action.action_type === 'ledger.reverse_debit') {
        const { reverseDebit } = await import('./action-connectors/ledger-reversal');
        const reversed = await reverseDebit(action, idempotencyKey);
        if (!reversed) {
          return { success: false, status: 'ESCALATED', reason: 'Reversal failed' };
        }

        // 5. Post-flight verify: re-query ledger to confirm credit-back
        // Pseudo-code to verify
        const { verifyReversal } = await import('./action-connectors/ledger-reversal');
        const verified = await verifyReversal(action.transaction_ref);
        if (!verified) {
          return { success: false, status: 'ESCALATED', reason: 'Post-flight verification failed' };
        }

        return { success: true, status: 'COMPLETED' };
      } 
      else if (action.action_type === 'switch.status_query') {
        const { queryStatus } = await import('./action-connectors/switch-status-query');
        await queryStatus(action, idempotencyKey);
        return { success: true, status: 'COMPLETED' };
      }
      else {
        return { success: false, status: 'ESCALATED', reason: 'Unknown action type' };
      }
    } catch (err) {
      // 6. Failure: freeze and escalate
      return { success: false, status: 'ESCALATED', reason: err instanceof Error ? err.message : 'Unknown execution error' };
    }
  }
}

export const executeAction = new ActionExecutor().executeAction.bind(new ActionExecutor());
