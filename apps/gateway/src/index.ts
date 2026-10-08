import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';

import { verifyWebhookSignature } from './middleware/webhook-auth';
import disputesRouter from './routes/disputes';
import reviewRouter from './routes/review';
import metricsRouter from './routes/metrics';

import { casesRepo } from './db/repositories/cases';
import { auditRepo } from './db/repositories/audit';
import { db } from './db/client';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
// Dispute routes with webhook auth
app.use('/v1/disputes', verifyWebhookSignature, disputesRouter);

// Case specific endpoints
app.get('/v1/cases/:case_id', async (req: Request, res: Response) => {
  const c = await casesRepo.findById(req.params.case_id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json(c);
});

app.get('/v1/cases/:case_id/evidence', async (req: Request, res: Response) => {
  const evidence = await db.query(
    `SELECT source, raw_payload, sha256, fetched_at FROM evidence_items
     WHERE case_id = $1 ORDER BY fetched_at ASC`,
    [req.params.case_id]
  );
  const timeline = await db.query(
    `SELECT event_type, source, occurred_at, raw_ref, payload
     FROM timeline_events WHERE case_id = $1 ORDER BY occurred_at ASC`,
    [req.params.case_id]
  );
  res.json({ evidence: evidence.rows, timeline: timeline.rows });
});

app.get('/v1/cases/:case_id/audit', async (req: Request, res: Response) => {
  const trail = await auditRepo.getAuditTrail(req.params.case_id);
  res.json({ audit_trail: trail, verification: await auditRepo.verifyChain(req.params.case_id) });
});

app.get('/v1/cases/:case_id/clocks', async (req: Request, res: Response) => {
  const clocks = await db.query(
    'SELECT clock, started_at, deadline_at, stopped_at, stop_event, status FROM sla_clocks WHERE case_id = $1 ORDER BY started_at',
    [req.params.case_id]
  );
  res.json({ clocks: clocks.rows });
});

app.post('/v1/cases/:case_id/regulator-pack', async (req: Request, res: Response) => {
  res.json({ status: 'GENERATING' }); // Placeholder
});

// Review endpoints
app.use('/v1', reviewRouter);

// Metrics endpoints
app.use('/v1/metrics', metricsRouter);

// Other endpoints
app.post('/v1/batches', async (req: Request, res: Response) => {
  const refs = Array.isArray(req.body?.refs) ? req.body.refs : [];
  if (refs.length === 0) return res.status(400).json({ error: 'refs must contain at least one transaction reference' });
  const created: string[] = [];
  for (const ref of refs) {
    if (await casesRepo.findByTransactionRef(ref)) continue;
    const id = require('crypto').randomUUID();
    await casesRepo.create(id, {
      external_id: `BATCH-${ref}`,
      transaction_ref: ref,
      amount: 0,
      currency: 'NGN',
      reason: 'Demo batch investigation',
      channel: 'batch',
    });
    await auditRepo.appendAuditEvent(id, 'CASE_CREATED', { source: 'batch', transaction_ref: ref });
    const { enqueueCase } = require('./queue/producer');
    await enqueueCase(id, { source: 'batch' });
    created.push(id);
  }
  res.status(202).json({ status: 'ACCEPTED', case_ids: created });
});
app.get('/v1/policies/active', (req: Request, res: Response) => {
  const fs = require('fs');
  const policyPath = require('path').resolve(__dirname, '../../../policies/nip_transfer_v1.yaml');
  res.json({ policies: [{ name: 'nip_transfer_v1', version: 1, yaml: fs.readFileSync(policyPath, 'utf8') }] });
});
app.get('/v1/audit/findings', (req: Request, res: Response) => res.json({ findings: [] }));
app.get('/v1/audit/breaches', (req: Request, res: Response) => res.json({ breaches: [] }));
app.get('/v1/audit/counterparties', (req: Request, res: Response) => res.json({ counterparties: [] }));

app.get('/v1/activity', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const send = async () => {
    const result = await db.query(
      `SELECT case_id, event, payload, at FROM audit_log ORDER BY seq DESC LIMIT 50`
    );
    res.write(`data: ${JSON.stringify(result.rows)}\n\n`);
  };
  await send();
  const timer = setInterval(() => void send(), 5000);
  req.on('close', () => clearInterval(timer));
});

app.get('/v1/health', async (req: Request, res: Response) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'ok', worker: 'external' });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Gateway listening on port ${PORT}`);
});
