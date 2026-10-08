import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { disputes } from '../data/disputes';
import axios from 'axios';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

router.post('/cases', (req: Request, res: Response) => {
  const { transaction_ref, amount, customer_id } = req.body;
  const id = uuidv4();
  const dispute = {
    id,
    transaction_ref,
    amount,
    customer_id,
    status: 'OPEN',
    created_at: new Date().toISOString()
  };
  disputes.set(id, dispute);
  
  // Fire webhook to Eri asynchronously (ignore errors in mock)
  axios.post('http://localhost:3000/api/webhooks/dispute', { event: 'DISPUTE_CREATED', data: dispute }).catch(() => {});
  
  res.status(201).json(dispute);
});

router.get('/cases', (req: Request, res: Response) => {
  res.json(Array.from(disputes.values()));
});

router.get('/cases/:id', (req: Request, res: Response) => {
  const dispute = disputes.get(req.params.id);
  if (!dispute) return res.status(404).json({ error: 'Not found' });
  res.json(dispute);
});

router.patch('/cases/:id', (req: Request, res: Response) => {
  const dispute = disputes.get(req.params.id);
  if (!dispute) return res.status(404).json({ error: 'Not found' });
  
  Object.assign(dispute, req.body);
  res.json(dispute);
});

router.post('/api/cases/:id/resolution', (req: Request, res: Response) => {
  const dispute = disputes.get(req.params.id);
  if (!dispute) return res.status(404).json({ error: 'Not found' });
  
  const { resolution } = req.body;
  dispute.status = 'RESOLVED';
  dispute.resolution = resolution;
  dispute.resolution_at = new Date().toISOString();
  
  res.json(dispute);
});

export default router;
