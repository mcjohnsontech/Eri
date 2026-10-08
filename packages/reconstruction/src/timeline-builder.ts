import { CanonicalEvent, CanonicalEventType, DerivedState, TransactionTimeline } from '@eri/core';
import { detectAnomalies } from './anomaly-detector';

const PROCESSING_WINDOW_MINUTES = 30;

function isWithinProcessingWindow(events: CanonicalEvent[]): boolean {
  const earliest = events.reduce((min, e) => 
    e.occurred_at < min ? e.occurred_at : min, 
    events[0]?.occurred_at || new Date()
  );
  const ageMinutes = (Date.now() - earliest.getTime()) / 60000;
  return ageMinutes < PROCESSING_WINDOW_MINUTES;
}

/**
 * Builds a TransactionTimeline by applying derivation rules in priority order.
 * Implements the state reconstruction algorithm from Section 3.5 of the architecture.
 */
export function buildTimeline(events: CanonicalEvent[], hasSourceMissing: boolean): TransactionTimeline {
  // Sort by time, de-duplicate
  const sorted = [...events].sort((a, b) => 
    a.occurred_at.getTime() - b.occurred_at.getTime()
  );

  const anomalies = detectAnomalies(sorted);
  const missing_sources = hasSourceMissing ? ['unknown'] : [];

  // Rule 1: Source unavailable -> INDETERMINATE
  if (hasSourceMissing) {
    return {
      events: sorted,
      derived_state: DerivedState.INDETERMINATE,
      anomalies: [...anomalies, 'SOURCE_UNAVAILABLE'],
      missing_sources,
    };
  }

  // Rule 2: Sources contradict -> CONFLICT
  if (anomalies.includes('CONFLICTING_SOURCES')) {
    return {
      events: sorted,
      derived_state: DerivedState.CONFLICT,
      anomalies,
      missing_sources,
    };
  }

  // Derive boolean flags from canonical events
  const hasEvent = (type: CanonicalEventType, source?: string) =>
    sorted.some(e => e.event_type === type && (!source || e.source === source));

  const hasLedgerDebited = hasEvent(CanonicalEventType.DEBITED, 'ledger');
  const hasDestCredited = hasEvent(CanonicalEventType.DESTINATION_CREDITED, 'switch');
  const hasSettled = hasEvent(CanonicalEventType.SETTLED, 'settlement');
  const hasAutoReversalPosted = hasEvent(CanonicalEventType.AUTO_REVERSAL_POSTED);
  const hasManualReversalPosted = hasEvent(CanonicalEventType.MANUAL_REVERSAL_POSTED);
  const hasReversalPosted = hasAutoReversalPosted || hasManualReversalPosted;
  const hasReversalInitiated = hasEvent(CanonicalEventType.AUTO_REVERSAL_INITIATED);
  const hasSwitchTimeout = hasEvent(CanonicalEventType.SWITCH_TIMEOUT, 'switch');
  const hasDestRejected = hasEvent(CanonicalEventType.DESTINATION_REJECTED, 'switch');

  // Rule 3: COMPLETED — debited + credited + settled
  if (hasLedgerDebited && hasDestCredited && hasSettled) {
    return { events: sorted, derived_state: DerivedState.COMPLETED, anomalies, missing_sources };
  }

  // Rule 4: FAILED_REVERSED — reversal confirmed
  if (hasLedgerDebited && hasReversalPosted) {
    return { events: sorted, derived_state: DerivedState.FAILED_REVERSED, anomalies, missing_sources };
  }

  // Rule 5: PENDING_REVERSAL — initiated but not posted
  if (hasReversalInitiated && !hasReversalPosted) {
    return { events: sorted, derived_state: DerivedState.PENDING_REVERSAL, anomalies, missing_sources };
  }

  // Rule 6: INDETERMINATE — switch timeout, outcome unknown
  if (hasLedgerDebited && hasSwitchTimeout) {
    return {
      events: sorted,
      derived_state: DerivedState.INDETERMINATE,
      anomalies: [...anomalies, 'NEEDS_STATUS_QUERY'],
      missing_sources,
    };
  }

  // Rule 8: FAILED_NOT_REVERSED — rejected, no reversal in flight
  if (hasLedgerDebited && hasDestRejected && !hasReversalPosted && !hasReversalInitiated) {
    return { events: sorted, derived_state: DerivedState.FAILED_NOT_REVERSED, anomalies, missing_sources };
  }

  // Rule 9: IN_FLIGHT — still within processing window
  if (hasLedgerDebited && isWithinProcessingWindow(sorted)) {
    return { events: sorted, derived_state: DerivedState.IN_FLIGHT, anomalies, missing_sources };
  }

  // Also FAILED_NOT_REVERSED when debited but no credit/reversal events and past window
  if (hasLedgerDebited && !hasDestCredited && !hasReversalPosted && !hasReversalInitiated) {
    return { events: sorted, derived_state: DerivedState.FAILED_NOT_REVERSED, anomalies, missing_sources };
  }

  // Default: INDETERMINATE
  return {
    events: sorted,
    derived_state: DerivedState.INDETERMINATE,
    anomalies: [...anomalies, 'UNRESOLVED_STATE'],
    missing_sources,
  };
}
