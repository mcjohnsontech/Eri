import { db } from '../client';
import crypto from 'crypto';

export const auditRepo = {
  appendAuditEvent: async (caseId: string, event: string, payload: any, prevHash: string | null = null) => {
    const previous = prevHash || (await db.query(
      'SELECT hash FROM audit_log WHERE case_id = $1 ORDER BY seq DESC LIMIT 1', [caseId]
    )).rows[0]?.hash || 'genesis';
    const hash = crypto.createHash('sha256')
      .update(previous + JSON.stringify(payload))
      .digest('hex');

    const res = await db.query(
      'INSERT INTO audit_log (case_id, event, payload, prev_hash, hash) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [caseId, event, payload, previous, hash]
    );
    return res.rows[0];
  },

  getAuditTrail: async (caseId: string) => {
    const res = await db.query('SELECT * FROM audit_log WHERE case_id = $1 ORDER BY seq ASC', [caseId]);
    return res.rows;
  },

  verifyChain: async (caseId: string) => {
    const trail = await auditRepo.getAuditTrail(caseId);
    let previous = 'genesis';
    for (let index = 0; index < trail.length; index++) {
      const entry = trail[index];
      const hash = crypto.createHash('sha256')
        .update(previous + JSON.stringify(entry.payload))
        .digest('hex');
      if (entry.prev_hash !== previous || entry.hash !== hash) {
        return { valid: false, broken_at: index };
      }
      previous = entry.hash;
    }
    return { valid: true };
  }
};
