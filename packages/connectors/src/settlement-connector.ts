import { Connector, CanonicalEvent } from './types';
import { CanonicalEventType } from '@eri/core';

export class SettlementConnector implements Connector {
  name = 'settlement';
  
  async fetchEvidence(transactionRef: string): Promise<CanonicalEvent[]> {
    const baseUrl = process.env.MOCK_SETTLEMENT_URL || 'http://localhost:4003';
    const response = await fetch(`${baseUrl}/settlement/tx/${encodeURIComponent(transactionRef)}`);
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`Settlement evidence request failed: ${response.status}`);

    const record = await response.json() as {
      transaction_ref: string;
      status: string;
      settlement_date: string;
    };
    if (record.status === 'UNSETTLED') return [];

    return [{
      source: 'settlement',
      occurred_at: new Date(`${record.settlement_date}T00:00:00.000Z`),
      event_type: record.status === 'SETTLED'
        ? CanonicalEventType.SETTLED
        : CanonicalEventType.RECON_MISMATCH,
      raw_ref: record.transaction_ref,
      payload: record,
    }];
  }
}
