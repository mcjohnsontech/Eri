import { Connector, CanonicalEvent } from './types';
import { CanonicalEventType } from '@eri/core';

export class LedgerConnector implements Connector {
  name = 'ledger';
  
  async fetchEvidence(transactionRef: string): Promise<CanonicalEvent[]> {
    const baseUrl = process.env.MOCK_LEDGER_URL || 'http://localhost:4001';
    const response = await fetch(`${baseUrl}/ledger/tx/${encodeURIComponent(transactionRef)}`);
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`Ledger evidence request failed: ${response.status}`);

    const record = await response.json() as {
      transaction_ref: string;
      status: string;
      debited_at: string;
      reversed_at?: string;
      reversal_ref?: string;
    };
    const events: CanonicalEvent[] = [{
      source: 'ledger',
      occurred_at: new Date(record.debited_at),
      event_type: CanonicalEventType.DEBITED,
      raw_ref: record.transaction_ref,
      payload: record,
    }];

    if (record.status === 'REVERSED' && record.reversed_at) {
      events.push({
        source: 'ledger',
        occurred_at: new Date(record.reversed_at),
        event_type: CanonicalEventType.AUTO_REVERSAL_POSTED,
        raw_ref: record.reversal_ref || record.transaction_ref,
        payload: record,
      });
    }
    return events;
  }
}
