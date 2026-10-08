# Eri: Handover & Continuity Brief

> **Project Name:** Eri (Autonomous Bank Transaction Dispute Resolution Engine)  
> **Workspace Root:** `C:\Users\HomePC\Desktop\Eri`  
> **Target Goal:** Autonomous resolution engine for NIP-style instant transfer disputes ("debit successful / beneficiary not credited") with deterministic policy governance, Gemini-assisted interpretation, simulator services, human review UI, and CBN/NIBSS regulatory compliance.

---

## 1. System Architecture & High-Level Flow

```
[ Mock Dispute System ] (Port 4004)
        │  (webhook: POST /v1/disputes)
        ▼
[ Eri Ingestion Gateway ] (Port 3000)
        │  (enqueue BullMQ)
        ▼
[ Redis Queue ] (Port 6379)
        │  (dequeue job)
        ▼
[ Eri Worker Orchestrator ]
        ├─▶ 1. Fan-out fetch evidence via @eri/connectors:
        │       • Mock Core Ledger (Port 4001)
        │       • Mock Payment Switch (Port 4002)
        │       • Mock Settlement / Recon (Port 4003)
        ├─▶ 2. Reconstruct timeline & derive state via @eri/reconstruction
        │       • Detect anomalies & source conflicts
        ├─▶ 3. Advisory AI layer via @eri/ai (Gemini 3.8 Flash):
        │       • PII redaction -> Ticket field extraction -> Contradiction check
        ├─▶ 4. Deterministic policy evaluation via @eri/policy:
        │       • YAML rules (policies/nip_transfer_v1.yaml & ecobank_ng_dispute_pack.yaml)
        ├─▶ 5. Audit & SLA tracking via @eri/audit:
        │       • Hash-chained append-only log (H(prev_hash + payload))
        │       • Nigerian working day regulatory clocks (REFUND_10M, REVERSAL_24H, etc.)
        ├─▶ 6. Action Execution via @eri/executor:
        │       • Idempotent reversal / status queries + post-flight verification
        └─▶ 7. Outbound Write-back (HMAC signed) to dispute system callback_url
```

---

## 2. Monorepo Structure & Status

The project is structured as a `pnpm` workspaces monorepo using Node.js v24 + pnpm v9:

| Path | Purpose | Build / TypeScript Status |
|---|---|---|
| `packages/core` | Shared types, enums, canonical event model, state machine, crypto, Nigerian calendar, PII redaction | ✅ **BUILT & PASSING** (`tsc` clean) |
| `packages/reconstruction` | Timeline builder (8 derivation rules), anomaly detector | ✅ **BUILT & PASSING** (`tsc` clean) |
| `packages/policy` | YAML policy parser & evaluator (precedence, thresholds, escalation triggers) | ✅ **BUILT & PASSING** (`tsc` clean) |
| `packages/connectors` | Ledger, Switch, Settlement HTTP adapters + parallel fan-out | ✅ **BUILT & PASSING** (`tsc` clean) |
| `packages/executor` | Pre/post-flight check action executor with idempotency | ✅ **BUILT & PASSING** (`tsc` clean) |
| `packages/audit` | Hash-chained audit ledger, 12 Auditor checks, SLA clock tracker | ✅ **BUILT & PASSING** (`tsc` clean) |
| `packages/ai` | Gemini 3.8 Flash integration: ticket extractor, summarizer, contradiction checker | ⚠️ **Needs minor SDK typing fix** (see Section 4) |
| `apps/gateway` | Express REST API & webhook receiver | Scaffolding complete; Dockerfile ready |
| `apps/worker` | BullMQ worker & end-to-end workflow runner | Scaffolding & workflow logic complete; Dockerfile ready |
| `apps/web` | React 18 + Vite + Tailwind + Recharts review queue & dashboard | Scaffolding & components written; Dockerfile ready |
| `simulators/mock-ledger` | Express core banking simulator (port 4001) | Ready + Dockerfile |
| `simulators/mock-switch` | Express payment switch simulator (port 4002) | Ready + Dockerfile |
| `simulators/mock-settlement` | Express settlement & recon simulator (port 4003) | Ready + Dockerfile |
| `simulators/mock-dispute` | Bank ticketing system simulator with webhook emitter (port 4004) | Ready + Dockerfile |
| `simulators/scenario-generator`| 500-case synthetic dataset generator with ground truth | Ready + Dockerfile |

---

## 3. Key Environment & Database Configurations

- **`.env.example`** and **`.env`** variables:
  ```env
  DATABASE_URL=postgresql://eri:eri@localhost:5432/eri
  REDIS_URL=redis://localhost:6379
  GEMINI_API_KEY=your_gemini_api_key_here
  PORT=3000
  MOCK_LEDGER_URL=http://localhost:4001
  MOCK_SWITCH_URL=http://localhost:4002
  MOCK_SETTLEMENT_URL=http://localhost:4003
  MOCK_DISPUTE_URL=http://localhost:4004
  ```
- **Postgres Schema**: Located at `scripts/migrate.sql`. Contains:
  - Extensions: `pgcrypto`, `vector` (pgvector).
  - Tables: `cases`, `evidence_items`, `timeline_events`, `decisions`, `actions`, `reviews`, `audit_log` (with hash chaining), `case_embeddings`, `policies`, `sla_clocks`, `breach_register`, `counterparty_scorecards`, `calendar_days` (seeded with 2026 Nigerian public holidays).

---

## 4. Current Work in Progress & Immediate Next Steps

The next AI agent should execute these specific items in sequence:

### Step 1: Fix TypeScript Errors in `packages/ai`
In `packages/ai/src/services/`:
1. **`ticket-extractor.ts`**, **`contradiction-checker.ts`**, and **`evidence-summarizer.ts`**:
   - The `@google/genai` (v2.3.0) SDK `client.interactions.create` params:
     - Remove unsupported `config: { temperature: 0 }`. Pass `temperature` directly or through `generation_config` if typed, or cast as necessary.
     - On the returned object, the SDK exposes `response.output_text` (or parse steps), not `response.text`.
   - Run verification:
     ```powershell
     $env:PATH = "$env:APPDATA\npm;$env:PATH"
     pnpm --filter "@eri/ai" build
     ```

### Step 2: Build Apps (`apps/gateway`, `apps/worker`, `apps/web`)
Ensure all apps compile:
```powershell
pnpm --filter "@eri/gateway" build
pnpm --filter "@eri/worker" build
pnpm --filter "@eri/web" build
```

### Step 3: Run Database Migrations & Test Simulators
1. Start PostgreSQL with pgvector and Redis via Docker Compose:
   ```powershell
   docker-compose up -d postgres redis
   ```
2. Apply the migration schema:
   ```powershell
   node scripts/migrate.js
   ```
3. Test start simulator servers (`mock-ledger`, `mock-switch`, `mock-settlement`, `mock-dispute`).

### Step 4: Run the Scenario Generator
Execute the generator to create the 500-case dataset with ground-truth labels:
```powershell
pnpm --filter "@eri/scenario-generator" build
node simulators/scenario-generator/dist/index.js
```

### Step 5: End-to-End Batch Test & Web UI Verification
1. Start the gateway, worker, and frontend:
   ```powershell
   pnpm --filter "@eri/gateway" dev
   pnpm --filter "@eri/worker" dev
   pnpm --filter "@eri/web" dev
   ```
2. Trigger the batch ingestion:
   ```bash
   POST http://localhost:3000/v1/batches
   ```
3. Open `http://localhost:5173` to verify:
   - Live burn-down chart
   - Auto-resolution rate gauge (~70% target)
   - Review queue showing escalations with SLA countdown badges
   - Audit trail hash-chain validation badge

---

## 5. Architectural Guardrails (Do Not Violate)
1. **Deterministic Authority**: The LLM is strictly advisory. Financial decisions, reversals, and ledger operations are governed deterministically by YAML policy rules.
2. **PII Masking**: Always run `redactPII()` before sending ticket text to Gemini.
3. **Audit Immutability**: Every lifecycle transition must write a hash-chained entry to `audit_log`.
4. **Idempotency**: All executor actions must pass an idempotency key (`caseId:action:attempt`).

