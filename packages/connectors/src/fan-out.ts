import { CanonicalEvent, Connector } from './types';
import { LedgerConnector } from './ledger-connector';
import { SwitchConnector } from './switch-connector';
import { SettlementConnector } from './settlement-connector';

const connectors: Connector[] = [
  new LedgerConnector(),
  new SwitchConnector(),
  new SettlementConnector()
];

export async function fetchAllEvidence(transactionRef: string): Promise<{ events: CanonicalEvent[], missing: string[] }> {
  const events: CanonicalEvent[] = [];
  const missing: string[] = [];
  
  const promises = connectors.map(async (connector) => {
    try {
      // 5-second timeout implementation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const connectorPromise = connector.fetchEvidence(transactionRef);
      // Wait for either the connector to finish or a timeout error
      // Note: In real node-fetch, you'd pass the signal to fetch.
      // Here we simulate the timeout wrapping
      
      const result = await Promise.race([
        connectorPromise,
        new Promise<CanonicalEvent[]>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 5000);
        })
      ]);
      
      clearTimeout(timeoutId);
      return { name: connector.name, events: result };
    } catch (err) {
      return { name: connector.name, error: err };
    }
  });

  const results = await Promise.all(promises);

  for (const result of results) {
    if ('error' in result) {
      missing.push(result.name);
    } else {
      events.push(...result.events);
    }
  }

  return { events, missing };
}
