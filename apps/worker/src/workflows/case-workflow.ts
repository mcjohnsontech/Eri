import { Pool } from 'pg';
import { DerivedState, DisputeStatus, ResolutionMode } from '@eri/core';
import { fetchAllEvidence } from '@eri/connectors';
import { buildTimeline } from '@eri/reconstruction';
import { loadPolicy, evaluatePolicy } from '@eri/policy';
import { extractTicketInfo, checkContradiction, summarizeEvidence, computeConfidence } from '@eri/ai';
import { executeAction } from '@eri/executor';
import { queryStatus } from '@eri/executor';
import { AuditLedger } from '@eri/audit';
import { SLATracker } from '@eri/audit';
import { writeBackToDisputeSystem } from '../services/writeback';
import * as path from 'path';

const db = new Pool({ connectionString: process.env.DATABASE_URL });
const auditLedger = new AuditLedger(db);
const slaTracker = new SLATracker();

// Load policy at startup
let policy: any;
try {
  const { loadPolicy: lp } = require('@eri/policy');
  policy = lp(path.resolve(__dirname, '../../../../policies/nip_transfer_v1.yaml'));
} catch (e) {
  console.warn('Policy load failed, using defaults', e);
}

const updateCaseStatus = async (caseId: string, status: DisputeStatus) => {
  await db.query(
    'UPDATE cases SET status = $1 WHERE id = $2',
    [status, caseId]
  );
  await auditLedger.append(caseId, `STATUS_TRANSITION`, { to: status, at: new Date().toISOString() });
};

export const processCaseWorkflow = async (caseId: string, jobData: any) => {
  console.log(`[Workflow] Starting case ${caseId}`);
  
  try {
    // Get case from DB
    const { rows } = await db.query('SELECT * FROM cases WHERE id = $1', [caseId]);
    if (!rows[0]) throw new Error(`Case ${caseId} not found`);
    const caseRecord = rows[0];

    // STEP 1: ENRICHING - fan-out to all connectors
    await updateCaseStatus(caseId, DisputeStatus.ENRICHING);
    
    const { events, missing } = await fetchAllEvidence(caseRecord.transaction_ref);
    
    // Store evidence items
    for (const event of events) {
      const hash = require('crypto').createHash('sha256')
        .update(JSON.stringify(event)).digest('hex');
      await db.query(
        `INSERT INTO evidence_items (id, case_id, source, raw_payload, sha256, fetched_at) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
         ON CONFLICT DO NOTHING`,
        [caseId, event.source, JSON.stringify(event.payload), hash]
      );
      await db.query(
        `INSERT INTO timeline_events (id, case_id, event_type, source, occurred_at, raw_ref, payload)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)`,
        [caseId, event.event_type, event.source, event.occurred_at, event.raw_ref, JSON.stringify(event.payload)]
      );
    }

    // STEP 2: RECONSTRUCTED - build timeline + derive state
    await updateCaseStatus(caseId, DisputeStatus.RECONSTRUCTED);
    
    const timeline = buildTimeline(events, missing.length > 0);
    
    await db.query(
      'UPDATE cases SET derived_state = $1 WHERE id = $2',
      [timeline.derived_state, caseId]
    );
    if (timeline.derived_state === DerivedState.INDETERMINATE || timeline.derived_state === DerivedState.CONFLICT) {
      const deadline = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      await slaTracker.startClock(caseId, {
        id: `review-${caseId}`,
        type: 'INTERNAL_REVIEW',
        deadline,
      }, db);
    }

    if (timeline.derived_state === DerivedState.INDETERMINATE) {
      const nextAttempt = await db.query(
        'SELECT COALESCE(MAX(attempt), 0) + 1 AS attempt FROM status_queries WHERE case_id = $1',
        [caseId]
      );
      const attempt = Number(nextAttempt.rows[0].attempt);
      await db.query(
        `INSERT INTO status_queries (case_id, attempt, scheduled_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (case_id, attempt) DO NOTHING`,
        [caseId, attempt]
      );
      await updateCaseStatus(caseId, DisputeStatus.WAITING);
      await auditLedger.append(caseId, 'STATUS_QUERY_SCHEDULED', {
        attempt,
        reason: 'Transfer outcome is unknown; no automatic refund permitted',
      });
      try {
        await updateCaseStatus(caseId, DisputeStatus.STATUS_REQUERY);
        const result = await queryStatus({
          case_id: caseId,
          action_type: 'switch.status_query',
          attempt_group: String(attempt),
          transaction_ref: caseRecord.transaction_ref,
          amount: parseFloat(caseRecord.amount),
        }, `${caseId}:switch.status_query:${attempt}`);
        await db.query(
          'UPDATE status_queries SET result = $1, completed_at = NOW() WHERE case_id = $2 AND attempt = $3',
          [result.status || 'UNKNOWN', caseId, attempt]
        );
        await auditLedger.append(caseId, 'STATUS_QUERY_COMPLETED', { attempt, result: result.status || 'UNKNOWN' });
      } catch (error) {
        await db.query(
          'UPDATE status_queries SET error = $1, completed_at = NOW() WHERE case_id = $2 AND attempt = $3',
          [error instanceof Error ? error.message : 'Status query failed', caseId, attempt]
        );
        await auditLedger.append(caseId, 'STATUS_QUERY_FAILED', { attempt });
      }
      await updateCaseStatus(caseId, DisputeStatus.PENDING_HUMAN);
      return;
    }

    // STEP 3: DECIDING - AI extraction + policy evaluation
    await updateCaseStatus(caseId, DisputeStatus.DECIDING);

    // AI ticket extraction (advisory)
    let ticketExtraction = null;
    let contradiction = null;
    if (process.env.ENABLE_ADVISORY_AI === 'true') {
      try {
        ticketExtraction = await extractTicketInfo(caseRecord.customer_text || '');
        if (ticketExtraction) {
          contradiction = await checkContradiction(ticketExtraction, timeline);
        }
      } catch (aiErr) {
        console.warn(`[Workflow] AI extraction failed for ${caseId}:`, aiErr);
      }
    }

    // Evaluate policy (deterministic)
    const caseContext = {
      amount: parseFloat(caseRecord.amount),
      customerFlags: [],
      caseId,
      currency: caseRecord.currency,
      repeatDisputes30d: 0,
      contradictionDetected: contradiction?.contradiction || false,
      customer_flags: [],
      confidence_score: 1,
      customer_text_contradiction: contradiction?.contradiction || false,
      repeat_disputes_count: 0,
      duplicate_case: false,
    };

    let policyDecision: any;
    if (policy) {
      policyDecision = evaluatePolicy(timeline, caseContext, policy);
    } else {
      // Fallback: simple rule
      policyDecision = {
        action: timeline.derived_state === DerivedState.FAILED_NOT_REVERSED ? 
          'ledger.reverse_debit' : 'escalate',
        mode: caseContext.amount <= 100000 ? ResolutionMode.AUTO : ResolutionMode.HUMAN_APPROVAL,
        rule_id: 'fallback',
        rationale: 'Policy not loaded - using fallback',
        requires_human: caseContext.amount > 100000
      };
    }

    // Compute confidence
    const confidence = computeConfidence({
      derived_state_certainty: timeline.derived_state,
      evidence_completeness: missing.length === 0 ? 1.0 : 0.5,
      anomaly_penalty: Math.min(1, timeline.anomalies.length * 0.1),
      contradiction_penalty: contradiction?.contradiction ? 0.5 : 0,
      similar_case_agreement_factor: 1.0
    });

    await db.query(
      'UPDATE cases SET confidence = $1, policy_version = $2 WHERE id = $3',
      [confidence, policy?.version || 'fallback', caseId]
    );

    // Store decision
    await db.query(
      `INSERT INTO decisions (id, case_id, rule_id, mode, action, ai_advice, rationale, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())`,
      [caseId, policyDecision.rule_id, policyDecision.mode, policyDecision.action, 
       JSON.stringify({ ticket: ticketExtraction, contradiction }), policyDecision.rationale]
    );

    // STEP 4: Route by decision
    if (policyDecision.requires_human || policyDecision.mode !== ResolutionMode.AUTO) {
      await updateCaseStatus(caseId, DisputeStatus.PENDING_HUMAN);
      console.log(`[Workflow] Case ${caseId} routed to human review`);
      return;
    }

    if (policyDecision.action === 'close_not_upheld' || policyDecision.action === 'reject') {
      await updateCaseStatus(caseId, DisputeStatus.REJECTED_NOT_ELIGIBLE);
      // Still do write-back
      const summary = await summarizeEvidence(timeline, policyDecision, caseContext).catch(() => null);
      const writeback = await writeBackToDisputeSystem(caseId, caseRecord.callback_url, {
        status: 'CLOSED',
        resolution_category: `${timeline.derived_state}_NOT_UPHELD`,
        finding: policyDecision.rationale,
        confidence,
        customer_message: summary?.customerMessage || 'Your dispute has been reviewed and closed.'
      });
      await auditLedger.append(caseId, writeback.skipped ? 'WRITEBACK_SKIPPED' : 'WRITEBACK_SENT', writeback);
      await updateCaseStatus(caseId, DisputeStatus.WRITTEN_BACK);
      await updateCaseStatus(caseId, DisputeStatus.CLOSED);
      await slaTracker.stopClock(caseId, {
        id: `review-${caseId}`,
        type: 'INTERNAL_REVIEW',
        deadline: new Date(),
      }, 'CASE_CLOSED', db);
      return;
    }

    // STEP 5: EXECUTING
    await updateCaseStatus(caseId, DisputeStatus.AUTO_APPROVED);
    await updateCaseStatus(caseId, DisputeStatus.EXECUTING);

    const actionResult = await executeAction({
      case_id: caseId,
      action_type: policyDecision.action,
      attempt_group: '1',
      transaction_ref: caseRecord.transaction_ref,
      amount: parseFloat(caseRecord.amount),
    }, policy, db);

    // Store action
    await db.query(
      `INSERT INTO actions (id, case_id, type, idempotency_key, request, response, status, executed_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (idempotency_key) DO UPDATE SET response = EXCLUDED.response,
         status = EXCLUDED.status, executed_at = EXCLUDED.executed_at`,
      [caseId, policyDecision.action, `${caseId}:${policyDecision.action}:1`,
       JSON.stringify({ transactionRef: caseRecord.transaction_ref, amount: caseRecord.amount }),
       JSON.stringify(actionResult), actionResult.success ? 'SUCCESS' : 'FAILED']
    );

    // STEP 6: VERIFYING
    await updateCaseStatus(caseId, DisputeStatus.VERIFYING);

    if (!actionResult.success) {
      throw new Error(`Action failed: ${actionResult.reason || actionResult.status}`);
    }
    await db.query(
      'UPDATE actions SET verified_at = NOW() WHERE case_id = $1 AND idempotency_key = $2',
      [caseId, `${caseId}:${policyDecision.action}:1`]
    );

    // STEP 7: RESOLVED -> WRITTEN_BACK -> CLOSED
    await updateCaseStatus(caseId, DisputeStatus.RESOLVED);
    await db.query('UPDATE cases SET resolved_at = NOW() WHERE id = $1', [caseId]);

    const summary = await summarizeEvidence(timeline, policyDecision, caseContext).catch(() => null);

    const writeback = await writeBackToDisputeSystem(caseId, caseRecord.callback_url, {
      status: 'RESOLVED',
      resolution_category: `${timeline.derived_state}_REFUNDED`,
      action_taken: {
        type: policyDecision.action,
        reference: actionResult.status,
        amount: parseFloat(caseRecord.amount),
        executed_at: new Date().toISOString(),
        mode: 'AUTO'
      },
      finding: policyDecision.rationale,
      policy_version: `nip_transfer_v1@${policy?.version || 1}`,
      confidence,
      customer_message: summary?.customerMessage || `Your ₦${caseRecord.amount} has been returned to your account.`,
    });
    await auditLedger.append(caseId, writeback.skipped ? 'WRITEBACK_SKIPPED' : 'WRITEBACK_SENT', writeback);

    await updateCaseStatus(caseId, DisputeStatus.WRITTEN_BACK);
    await updateCaseStatus(caseId, DisputeStatus.CLOSED);
    
    console.log(`[Workflow] Case ${caseId} resolved successfully`);

  } catch (err: any) {
    console.error(`[Workflow] Failed for case ${caseId}:`, err.message);
    await updateCaseStatus(caseId, DisputeStatus.FAILED);
    // Escalate to human
    await db.query('UPDATE cases SET status = $1 WHERE id = $2', [DisputeStatus.PENDING_HUMAN, caseId]);
    throw err;
  }
};
