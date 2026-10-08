import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import 'express-async-errors';

import { verifyWebhookSignature } from './middleware/webhook-auth';
import disputesRouter from './routes/disputes';
import reviewRouter from './routes/review';
import metricsRouter from './routes/metrics';

import { casesRepo } from './db/repositories/cases';
import { auditRepo } from './db/repositories/audit';
import { db } from './db/client';

const app = express();

const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Eri API',
    version: '0.1.0',
    description: 'Evidence-first transaction monitoring and dispute resolution API. Simulation only.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local gateway' }],
  tags: [
    { name: 'System', description: 'Health, policies, metrics, and activity' },
    { name: 'Disputes', description: 'Signed dispute ingestion' },
    { name: 'Cases', description: 'Case inspection and review' },
    { name: 'Batches', description: 'Batch transaction ingestion' },
    { name: 'Audit', description: 'Audit and compliance views' },
  ],
  paths: {
    '/v1/health': {
      get: {
        tags: ['System'],
        summary: 'Check gateway and database health',
        responses: { '200': { description: 'Healthy' }, '503': { description: 'Database unavailable' } },
      },
    },
    '/v1/disputes': {
      post: {
        tags: ['Disputes'],
        summary: 'Submit a signed dispute',
        description: 'Requires x-eri-timestamp and x-eri-signature HMAC headers.',
        parameters: [{ $ref: '#/components/parameters/EriTimestamp' }, { $ref: '#/components/parameters/EriSignature' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Dispute' } } } },
        responses: {
          '202': { description: 'Accepted', content: { 'application/json': { schema: { $ref: '#/components/schemas/AcceptedCase' } } } },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { description: 'Missing or invalid HMAC signature' },
        },
      },
    },
    '/v1/cases/{case_id}': {
      get: {
        tags: ['Cases'], summary: 'Get a case', parameters: [{ $ref: '#/components/parameters/CaseId' }],
        responses: { '200': { description: 'Case record', content: { 'application/json': { schema: { $ref: '#/components/schemas/Case' } } } }, '404': { $ref: '#/components/responses/NotFound' } },
      },
    },
    '/v1/cases/{case_id}/evidence': {
      get: {
        tags: ['Cases'], summary: 'Get evidence and reconstructed timeline', parameters: [{ $ref: '#/components/parameters/CaseId' }],
        responses: { '200': { description: 'Evidence bundle and timeline' } },
      },
    },
    '/v1/cases/{case_id}/audit': {
      get: {
        tags: ['Audit'], summary: 'Get and verify a case audit trail', parameters: [{ $ref: '#/components/parameters/CaseId' }],
        responses: { '200': { description: 'Audit entries and chain verification' } },
      },
    },
    '/v1/cases/{case_id}/clocks': {
      get: {
        tags: ['Cases'], summary: 'Get SLA clocks for a case', parameters: [{ $ref: '#/components/parameters/CaseId' }],
        responses: { '200': { description: 'SLA clocks' } },
      },
    },
    '/v1/cases/{case_id}/review': {
      post: {
        tags: ['Cases'], summary: 'Submit a human review decision', parameters: [{ $ref: '#/components/parameters/CaseId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Review' } } } },
        responses: { '200': { description: 'Review recorded' }, '400': { $ref: '#/components/responses/BadRequest' }, '404': { $ref: '#/components/responses/NotFound' } },
      },
    },
    '/v1/review-queue': {
      get: { tags: ['Cases'], summary: 'List cases awaiting human review', responses: { '200': { description: 'Pending review cases' } } },
    },
    '/v1/batches': {
      post: {
        tags: ['Batches'], summary: 'Create cases for transaction references',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Batch' } } } },
        responses: { '202': { description: 'Batch accepted' }, '400': { $ref: '#/components/responses/BadRequest' } },
      },
    },
    '/v1/metrics/summary': {
      get: { tags: ['System'], summary: 'Get operational metrics', responses: { '200': { description: 'Metrics summary' } } },
    },
    '/v1/policies/active': {
      get: { tags: ['System'], summary: 'Get active policy YAML', responses: { '200': { description: 'Active policy' } } },
    },
    '/v1/audit/findings': {
      get: { tags: ['Audit'], summary: 'List audit findings', responses: { '200': { description: 'Audit findings' } } },
    },
    '/v1/audit/breaches': {
      get: { tags: ['Audit'], summary: 'List SLA breaches', responses: { '200': { description: 'SLA breaches' } } },
    },
    '/v1/audit/counterparties': {
      get: { tags: ['Audit'], summary: 'List counterparty scorecards', responses: { '200': { description: 'Counterparty scorecards' } } },
    },
    '/v1/activity': {
      get: { tags: ['System'], summary: 'Stream recent audit activity', responses: { '200': { description: 'Server-sent events stream', content: { 'text/event-stream': {} } } } },
    },
  },
  components: {
    parameters: {
      CaseId: { name: 'case_id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      EriTimestamp: { name: 'x-eri-timestamp', in: 'header', required: true, schema: { type: 'string' } },
      EriSignature: { name: 'x-eri-signature', in: 'header', required: true, schema: { type: 'string', description: 'HMAC-SHA256(timestamp + "." + exact JSON body)' } },
    },
    schemas: {
      Dispute: {
        type: 'object',
        required: ['external_id', 'amount', 'currency', 'reason', 'customer_id'],
        properties: {
          external_id: { type: 'string', example: 'TX1004' },
          amount: { type: 'number', minimum: 0, example: 50 },
          currency: { type: 'string', minLength: 3, maxLength: 3, example: 'USD' },
          reason: { type: 'string', example: 'Debit posted but beneficiary was not credited.' },
          customer_id: { type: 'string', example: 'SMOKE-CUSTOMER' },
        },
      },
      Batch: { type: 'object', required: ['refs'], properties: { refs: { type: 'array', minItems: 1, items: { type: 'string' }, example: ['TX1001', 'TX1004'] } } },
      Review: {
        type: 'object',
        required: ['decision', 'reason', 'reviewer_id'],
        properties: {
          decision: { type: 'string', enum: ['APPROVED', 'REJECTED'] },
          reason: { type: 'string', minLength: 1 },
          reviewer_id: { type: 'string', minLength: 1 },
        },
      },
      AcceptedCase: { type: 'object', properties: { case_id: { type: 'string', format: 'uuid' }, status: { type: 'string', example: 'RECEIVED' } } },
      Case: { type: 'object', additionalProperties: true, properties: { id: { type: 'string' }, status: { type: 'string' }, derived_state: { type: 'string' }, transaction_ref: { type: 'string' } } },
    },
    responses: {
      BadRequest: { description: 'Invalid request' },
      NotFound: { description: 'Resource not found' },
    },
  },
} as const;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, {
  customSiteTitle: 'Eri API Swagger',
}));
app.get('/openapi.json', (req: Request, res: Response) => res.json(openApiDocument));

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
