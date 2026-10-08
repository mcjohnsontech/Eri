import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { transactions } from '../data/transactions';

const router = Router();
const idempotencyStore = new Map<string, string>();

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

router.get('/eri/v1/changes', (req: Request, res: Response) => {
  const since = Number(req.query.since || 0);
  const changes = Array.from(transactions.values()).map((record, index) => ({
    cursor: String(index + 1),
    session_id: record.transaction_ref,
    transaction_ref: record.transaction_ref,
    event_type: 'DEBIT_POSTED',
    occurred_at: record.debited_at,
    payload: record,
  })).filter(change => Number(change.cursor) > since);
  res.json({ cursor: String(transactions.size), changes });
});

router.post('/eri/v1/seed', (req: Request, res: Response) => {
  const records = Array.isArray(req.body) ? req.body : req.body.records;
  if (!Array.isArray(records)) return res.status(400).json({ error: 'records must be an array' });
  for (const record of records) transactions.set(record.transaction_ref, record);
  res.status(201).json({ seeded: records.length });
});

router.get('/ledger/tx/:ref', (req: Request, res: Response) => {
  const record = transactions.get(req.params.ref);
  if (!record) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  res.json(record);
});

router.post('/ledger/reversals', (req: Request, res: Response) => {
  const idempotencyKey = req.headers['idempotency-key'] as string;
  if (idempotencyKey && idempotencyStore.has(idempotencyKey)) {
    return res.json({ reversal_ref: idempotencyStore.get(idempotencyKey) });
  }

  const { transaction_ref } = req.body;
  const record = transactions.get(transaction_ref);
  if (!record) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  if (record.status === 'REVERSED') {
    return res.status(400).json({ error: 'Already reversed' });
  }

  const reversal_ref = uuidv4();
  record.status = 'REVERSED';
  record.reversed_at = new Date().toISOString();
  record.reversal_ref = reversal_ref;
  
  if (idempotencyKey) {
    idempotencyStore.set(idempotencyKey, reversal_ref);
  }

  res.json({ reversal_ref });
});

export default router;
