import { db } from '../client';

export interface Case {
  id: string;
  dispute_ref: string;
  transaction_ref: string;
  channel: string;
  category: string;
  status: string;
  amount: number;
  currency: string;
  customer_text: string | null;
  callback_url: string | null;
  created_at: Date;
  resolved_at: Date | null;
}

export const casesRepo = {
  findById: async (id: string): Promise<Case | null> => {
    const res = await db.query('SELECT * FROM cases WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  findAll: async (limit = 50, offset = 0): Promise<Case[]> => {
    const res = await db.query('SELECT * FROM cases ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    return res.rows;
  },

  findPendingReview: async (limit = 50): Promise<Case[]> => {
    const res = await db.query(
      `SELECT * FROM cases WHERE status = 'PENDING_HUMAN'
       ORDER BY created_at ASC LIMIT $1`,
      [limit]
    );
    return res.rows;
  },

  findByTransactionRef: async (transactionRef: string): Promise<Case | null> => {
    const res = await db.query('SELECT * FROM cases WHERE transaction_ref = $1', [transactionRef]);
    return res.rows[0] || null;
  },

  create: async (id: string, payload: any): Promise<Case> => {
    const res = await db.query(
      `INSERT INTO cases
       (id, dispute_ref, transaction_ref, channel, category, status, amount, currency, customer_text, callback_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id,
        payload.dispute_ref || payload.external_id,
        payload.transaction_ref || payload.external_id,
        payload.channel || 'gateway',
        payload.category_hint || payload.reason || 'OTHER',
        'RECEIVED',
        payload.amount,
        payload.currency || 'NGN',
        payload.customer_text || payload.reason || null,
        payload.callback_url || null,
      ]
    );
    return res.rows[0];
  },

  updateStatus: async (id: string, status: string): Promise<Case> => {
    const res = await db.query(
      'UPDATE cases SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return res.rows[0];
  },

  updateDerivedState: async (id: string, state: any): Promise<Case> => {
    const res = await db.query(
      'UPDATE cases SET derived_state = $1 WHERE id = $2 RETURNING *',
      [state, id]
    );
    return res.rows[0];
  }
};
