import { Router, Request, Response } from 'express';
import { casesRepo } from '../db/repositories/cases';
import { auditRepo } from '../db/repositories/audit';
import { z } from 'zod';

const router = Router();

// GET /v1/review-queue
router.get('/review-queue', async (req: Request, res: Response) => {
  // In a real app we would query cases with status PENDING_HUMAN
  res.json({ cases: await casesRepo.findPendingReview(50) });
});

const reviewSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().min(1),
  reviewer_id: z.string()
});

// POST /v1/cases/:case_id/review
router.post('/cases/:case_id/review', async (req: Request, res: Response) => {
  const { case_id } = req.params;
  const result = reviewSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json({ errors: result.error.errors });
  }

  const c = await casesRepo.findById(case_id);
  if (!c) {
    return res.status(404).json({ error: 'Case not found' });
  }
  
  if (c.status !== 'PENDING_HUMAN') {
    return res.status(400).json({ error: 'Case is not pending human review' });
  }

  const nextStatus = result.data.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
  await casesRepo.updateStatus(case_id, nextStatus);
  await auditRepo.appendAuditEvent(case_id, 'HUMAN_REVIEW_COMPLETED', result.data);

  res.json({ status: nextStatus });
});

export default router;
