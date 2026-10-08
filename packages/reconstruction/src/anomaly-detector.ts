import { CanonicalEvent, CanonicalEventType } from '@eri/core';

/**
 * Detects anomalies in a set of canonical events.
 * Anomalies are first-class citizens — they push cases toward escalation.
 */
export function detectAnomalies(events: CanonicalEvent[]): string[] {
  const anomalies: string[] = [];

  // Conflict: settlement says SETTLED but switch says FAILED/REJECTED
  const settlementSettled = events.some(
    e => e.source === 'settlement' && e.event_type === CanonicalEventType.SETTLED
  );
  const switchFailed = events.some(
    e => e.source === 'switch' && 
    (e.event_type === CanonicalEventType.DESTINATION_REJECTED || e.event_type === CanonicalEventType.SWITCH_TIMEOUT)
  );
  const switchCredited = events.some(
    e => e.source === 'switch' && e.event_type === CanonicalEventType.DESTINATION_CREDITED
  );

  if (settlementSettled && switchFailed && !switchCredited) {
    anomalies.push('CONFLICTING_SOURCES');
  }

  // Recon mismatch: explicitly flagged
  const hasReconMismatch = events.some(e => e.event_type === CanonicalEventType.RECON_MISMATCH);
  if (hasReconMismatch) {
    anomalies.push('RECON_MISMATCH');
  }

  // Duplicate reversal
  const reversalPostings = events.filter(
    e => e.event_type === CanonicalEventType.AUTO_REVERSAL_POSTED || 
         e.event_type === CanonicalEventType.MANUAL_REVERSAL_POSTED
  );
  if (reversalPostings.length > 1) {
    anomalies.push('DUPLICATE_REVERSAL');
  }

  // Amount mismatch across sources
  const amounts = events
    .filter(e => typeof e.payload?.amount === 'number')
    .map(e => e.payload.amount as number);
  const uniqueAmounts = new Set(amounts);
  if (uniqueAmounts.size > 1) {
    anomalies.push('AMOUNT_MISMATCH');
  }

  // Reversal without a prior debit
  const hasDebit = events.some(e => e.event_type === CanonicalEventType.DEBITED);
  const hasReversal = reversalPostings.length > 0;
  if (hasReversal && !hasDebit) {
    anomalies.push('REVERSAL_WITHOUT_DEBIT');
  }

  return anomalies;
}
