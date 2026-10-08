import { Connector, CanonicalEvent } from './types';
import { CanonicalEventType } from '@eri/core';

export class SwitchConnector implements Connector {
  name = 'switch';
  
  async fetchEvidence(transactionRef: string): Promise<CanonicalEvent[]> {
    const baseUrl = process.env.MOCK_SWITCH_URL || 'http://localhost:4002';
    const response = await fetch(`${baseUrl}/switch/tx/${encodeURIComponent(transactionRef)}`);
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`Switch evidence request failed: ${response.status}`);

    const record = await response.json() as {
      transaction_ref: string;
      status: string;
      submitted_at: string;
      acked_at?: string;
      credited_at?: string;
    };
    const events: CanonicalEvent[] = [{
      source: 'switch',
      occurred_at: new Date(record.submitted_at),
      event_type: record.status === 'TIMEOUT'
        ? CanonicalEventType.SWITCH_TIMEOUT
        : record.status === 'REJECTED'
          ? CanonicalEventType.DESTINATION_REJECTED
          : record.status === 'CREDITED'
            ? CanonicalEventType.DESTINATION_CREDITED
            : CanonicalEventType.SWITCH_ACKED,
      raw_ref: record.transaction_ref,
      payload: record,
    }];
    if (record.acked_at && record.status === 'ACKED') {
      events[0].occurred_at = new Date(record.acked_at);
    }
    if (record.credited_at && record.status === 'CREDITED') {
      events[0].occurred_at = new Date(record.credited_at);
    }
    return events;
  }
}
