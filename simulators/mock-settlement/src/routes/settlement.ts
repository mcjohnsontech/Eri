import { Router, Request, Response } from 'express';
import { settlementRecords } from '../data/settlement-records';

const router = Router();

router.post('/eri/v1/seed', (req: Request, res: Response) => {
  const records = Array.isArray(req.body) ? req.body : req.body.records;
  if (!Array.isArray(records)) return res.status(400).json({ error: 'records must be an array' });
  for (const record of records) settlementRecords.set(record.transaction_ref, record);
  res.status(201).json({ seeded: records.length });
});

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

router.get('/settlement/tx/:ref', (req: Request, res: Response) => {
  const record = settlementRecords.get(req.params.ref);
  if (!record) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  res.json(record);
});

router.get('/settlement/recon/:date', (req: Request, res: Response) => {
  const records = Array.from(settlementRecords.values()).filter(r => r.settlement_date === req.params.date);
  res.json(records);
});

export default router;
