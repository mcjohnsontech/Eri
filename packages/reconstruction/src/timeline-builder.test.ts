import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline } from './timeline-builder';
import { CanonicalEventType, DerivedState } from '@eri/core';

function event(event_type: CanonicalEventType, source: string) {
  return {
    source,
    occurred_at: new Date(Date.now() - 60 * 60 * 1000),
    event_type,
    raw_ref: `${source}-${event_type}`,
    payload: {},
  };
}

test('reconstructs a definitive rejection as failed and not reversed', () => {
  const timeline = buildTimeline([
    event(CanonicalEventType.DEBITED, 'ledger'),
    event(CanonicalEventType.DESTINATION_REJECTED, 'switch'),
  ], false);

  assert.equal(timeline.derived_state, DerivedState.FAILED_NOT_REVERSED);
});

test('keeps a switch timeout indeterminate and never treats it as failure', () => {
  const timeline = buildTimeline([
    event(CanonicalEventType.DEBITED, 'ledger'),
    event(CanonicalEventType.SWITCH_TIMEOUT, 'switch'),
  ], false);

  assert.equal(timeline.derived_state, DerivedState.INDETERMINATE);
  assert.ok(timeline.anomalies.includes('NEEDS_STATUS_QUERY'));
});
