import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { casesRepo } from '../db/repositories/cases';
import { auditRepo } from '../db/repositories/audit';
import { enqueueCase } from '../queue/producer';

const router = Router();

const disputeSchema = z.object({
  external_id: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  reason: z.string(),
  customer_id: z.string(),
});

router.post('/', async (req: Request, res: Response) => {
  const result = disputeSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.errors });
  }

  const caseId = uuidv4();
  
  // Save to DB
  await casesRepo.create(caseId, result.data);
  
  // Audit log
  await auditRepo.appendAuditEvent(caseId, 'CASE_CREATED', { external_id: result.data.external_id });

  // Enqueue
  await enqueueCase(caseId, result.data);

  res.status(202).json({ case_id: caseId, status: 'RECEIVED' });
});

export default router;
