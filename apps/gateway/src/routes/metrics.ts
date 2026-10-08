import { Router, Request, Response } from 'express';
import { db } from '../db/client';

const router = Router();

// GET /v1/metrics/summary
router.get('/summary', async (req: Request, res: Response) => {
  // Mock implementations for demonstration
  const autoResQuery = await db.query(`
    SELECT 
      COUNT(*) FILTER (WHERE status = 'CLOSED') * 100.0 / NULLIF(COUNT(*), 0) as auto_resolution_rate
    FROM cases
  `);
  
  const counts = await db.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'CLOSED')::int AS closed,
      COUNT(*) FILTER (WHERE status = 'PENDING_HUMAN')::int AS pending_human,
      COUNT(*) FILTER (WHERE status = 'FAILED')::int AS failed,
      COUNT(*) FILTER (WHERE status = 'CLOSED' AND derived_state = 'FAILED_REVERSED')::int AS verified_reversals
    FROM cases
  `);
  const row = counts.rows[0] || {};
  res.json({
    auto_resolution_rate: Number(autoResQuery.rows[0]?.auto_resolution_rate || 0),
    total: row.total || 0,
    closed: row.closed || 0,
    pending_human: row.pending_human || 0,
    failed: row.failed || 0,
    verified_reversals: row.verified_reversals || 0,
    top_escalation_reasons: [],
  });
});

export default router;
