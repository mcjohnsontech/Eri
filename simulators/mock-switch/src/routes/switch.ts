import { Router, Request, Response } from 'express';
import { switchRecords } from '../data/switch-records';

const router = Router();

router.post('/eri/v1/seed', (req: Request, res: Response) => {
  const records = Array.isArray(req.body) ? req.body : req.body.records;
  if (!Array.isArray(records)) return res.status(400).json({ error: 'records must be an array' });
  for (const record of records) switchRecords.set(record.transaction_ref, record);
  res.status(201).json({ seeded: records.length });
});

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

router.get('/switch/tx/:ref', (req: Request, res: Response) => {
  const record = switchRecords.get(req.params.ref);
  if (!record) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  res.json(record);
});

router.post('/switch/status-query', (req: Request, res: Response) => {
  const { transaction_ref } = req.body;
  const record = switchRecords.get(transaction_ref);
  if (!record) {
    return res.json({ status: 'INDETERMINATE' });
  }
  res.json({ status: record.status });
});

export default router;
