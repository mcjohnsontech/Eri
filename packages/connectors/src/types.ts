import { CanonicalEvent } from '@eri/core';

export type { CanonicalEvent };

export interface Connector {
  name: string;
  fetchEvidence(transactionRef: string): Promise<CanonicalEvent[]>;
}

export interface ActionConnector {
  name: string;
  execute(actionType: string, payload: any, idempotencyKey: string): Promise<any>;
}
