import { Pool } from 'pg';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { randomUUID } from 'crypto';

const db = new Pool({ connectionString: process.env.DATABASE_URL });
const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});
const queue = new Queue('case-processing', { connection: redis });

interface Change {
  cursor: string;
  session_id: string;
  transaction_ref: string;
  event_type: string;
  occurred_at: string;
  payload?: {
    transaction_ref?: string;
    amount?: number;
    currency?: string;
  };
}

export async function pollSentinel(): Promise<number> {
  const state = await db.query('SELECT cursor FROM sentinel_state WHERE id = true');
  const since = state.rows[0]?.cursor || '0';
  const baseUrl = process.env.MOCK_LEDGER_URL || 'http://localhost:4001';
  const response = await fetch(`${baseUrl}/eri/v1/changes?since=${encodeURIComponent(since)}`);
  if (!response.ok) throw new Error(`Sentinel change feed failed: ${response.status}`);
  const body = await response.json() as { cursor: string; changes: Change[] };
  let processed = 0;

  for (const change of body.changes) {
    if (change.event_type !== 'DEBIT_POSTED') continue;
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const tracked = await client.query(
        `INSERT INTO tracked_transfers (session_id, transaction_ref, last_event_cursor)
         VALUES ($1, $2, $3)
         ON CONFLICT (transaction_ref) DO NOTHING
         RETURNING transaction_ref`,
        [change.session_id, change.transaction_ref, change.cursor]
      );
      if (tracked.rowCount !== 1) {
        await client.query('COMMIT');
        continue;
      }
      const existing = await client.query(
        'SELECT id FROM cases WHERE transaction_ref = $1 FOR UPDATE',
        [change.transaction_ref]
      );
      const caseId = existing.rows[0]?.id || randomUUID();
      if (!existing.rows[0]) {
        await client.query(
          `INSERT INTO cases
           (id, dispute_ref, transaction_ref, channel, category, status, amount, currency, customer_text)
           VALUES ($1, $2, $3, 'sentinel', 'NIP_TRANSFER', 'RECEIVED', $4, $5, NULL)`,
          [
            caseId,
            `SENTINEL-${change.transaction_ref}`,
            change.transaction_ref,
            change.payload?.amount || 0,
            change.payload?.currency || 'NGN',
          ]
        );
      }
      await client.query(
        `INSERT INTO sentinel_state (id, cursor) VALUES (true, $1)
         ON CONFLICT (id) DO UPDATE SET cursor = GREATEST(sentinel_state.cursor::bigint, EXCLUDED.cursor::bigint)::text,
           updated_at = NOW()`,
        [change.cursor]
      );
      await client.query('COMMIT');
      await queue.add('process-case', { caseId, payload: { source: 'sentinel' } }, {
        jobId: caseId,
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
      processed++;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  return processed;
}
