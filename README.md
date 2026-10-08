<div align="center">

# Eri

**Autonomous transaction monitoring and evidence-first dispute resolution.**

A policy-driven engine that investigates simulated Nigerian instant-transfer failures, safely reverses confirmed failures, and escalates uncertain cases with a full audit trail.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

**[Quick start](#quick-start) · [Architecture](#architecture--services) · [API](#rest-api-reference) · [Testing](#build--test)**

</div>

> [!IMPORTANT]
> **Hackathon / simulation only.** Eri uses mock banking services and demonstration policy parameters. It is **not CBN/NIBSS-certified**, does not connect to production banking infrastructure, and must **never** be used to make real financial decisions.

## Overview

Eri tracks debit events, assembles evidence from the mock ledger, payment switch, and settlement service, reconstructs transaction states, and applies versioned YAML policies. It can:

- **Automatically reverse** eligible, definitively failed transfers using idempotent actions and post-action verification.
- **Close resolved cases** when a beneficiary credit or an existing reversal is supported by evidence.
- **Monitor or escalate uncertainty** when transactions are pending, unknown, or contradictory.
- **Keep an audit trail** of evidence, decisions, and actions for bank operators.

**AI is advisory, never authoritative.** Optional Gemini integration may extract or summarise information, but it cannot establish financial truth or invoke reversal actions.

### Core safety principle

> **Unknown ≠ Failed. A reversal request ≠ a verified refund.**

## Quick start

**Requirements:** Docker Desktop with Compose, Node.js 20+, and pnpm 9. These commands use PowerShell.

```powershell
# From the repository root
Copy-Item .env.example .env
pnpm install

# Start the API, worker, web UI, databases and mock bank services
docker compose up -d --build
docker compose ps

# Check API health
Invoke-RestMethod http://localhost:3000/v1/health
```

Then open **[http://localhost:5173](http://localhost:5173)** to inspect the dashboard. Update local secrets in `.env` before running and **never commit `.env`**. AI is disabled by default.

For a guided first run, see [Windows setup](#windows-setup), [Seed mock banking data](#seed-mock-banking-data), and [Verify the core workflow](#verify-the-core-workflow).

## Table of contents

- [Overview](#overview)
- [Quick start](#quick-start)
- [Architecture & services](#architecture--services)
- [Prerequisites](#prerequisites)
- [Windows setup](#windows-setup)
- [Run the stack](#run-the-stack)
- [Database migration & reset](#database-migration--reset)
- [Seed mock banking data](#seed-mock-banking-data)
- [Verify the core workflow](#verify-the-core-workflow)
- [REST API reference](#rest-api-reference)
- [Web dashboard](#web-dashboard)
- [Transaction safety rules](#transaction-safety-rules)
- [Optional Gemini advisory AI](#optional-gemini-advisory-ai)
- [Build & test](#build--test)
- [Repository structure](#repository-structure)
- [Troubleshooting](#troubleshooting)
- [Cleanup](#cleanup)
- [License](#license)

## Architecture & services

```mermaid
flowchart LR
  Ledger[Mock ledger] --> Worker[Eri worker]
  Switch[Mock switch] --> Worker
  Settlement[Mock settlement] --> Worker
  Dispute[Mock dispute system] --> Gateway[API gateway]
  Gateway --> Worker
  Worker <--> Postgres[(PostgreSQL / audit store)]
  Worker <--> Redis[(Redis / BullMQ)]
  Gateway <--> UI[React review dashboard]
```

<details>
<summary>Plain-text architecture (if Mermaid is unavailable)</summary>

```text
Mock Ledger ─┐
Mock Switch ─┼─▶ Eri Worker ─▶ PostgreSQL audit/case store
Settlement ──┘        │
                      ├─▶ Redis/BullMQ
Mock Dispute ─▶ Gateway┘
                     │
                     └─▶ React review UI
```

</details>

| Component | Default URL/port | Purpose |
|---|---:|---|
| Gateway | `http://localhost:3000` | REST API, webhook receiver, metrics |
| Web UI | `http://localhost:5173` | Dashboard, review queue, case inspection |
| Mock ledger | `http://localhost:4001` | Debit, reversal, and change-feed evidence |
| Mock switch | `http://localhost:4002` | Submission, acknowledgement, timeout, rejection, credit |
| Mock settlement | `http://localhost:4003` | Settlement and reconciliation evidence |
| Mock dispute system | `http://localhost:4004` | Upstream ticketing-system simulator |
| PostgreSQL | `localhost:5432` | Cases, evidence, actions, audit, SLA data |
| Redis | `localhost:6379` | BullMQ queue and worker coordination |

---

## Prerequisites

For the recommended workflow, install:

- Docker Desktop with Compose support;
- Node.js 20 or later;
- pnpm 9;
- Git, if cloning the project.

Gemini is optional. Compose disables advisory AI by default so model outages
cannot block deterministic processing. Only configure a Gemini key if you
explicitly want to exercise the advisory path.

---

## Windows setup

Open PowerShell in the project directory:

```powershell
Set-Location "C:\path\to\Eri"

# Create the local environment file.
Copy-Item .env.example .env

# Install workspace dependencies.
pnpm install
```

Edit `.env` and set local development values. Do not commit `.env` or place
secrets in source control:

```dotenv
DATABASE_URL=postgresql://eri:eri@localhost:5432/eri
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_key_here
WEBHOOK_HMAC_SECRET=change_me_in_development
JWT_SECRET=change_me_in_development
```

The Docker Compose file overrides internal service URLs for the gateway and
worker, so they use Docker DNS names such as `postgres` and `mock-ledger`.

---

## Run the stack

Build and start every service:

```powershell
docker compose up -d --build
docker compose ps
```

Wait until `postgres` and `redis` show `healthy`, then check the gateway:

```powershell
Invoke-RestMethod http://localhost:3000/v1/health
```

Expected shape:

```json
{
  "status": "ok",
  "database": "ok",
  "worker": "external"
}
```

View logs when diagnosing a startup problem:

```powershell
docker compose logs -f gateway
docker compose logs -f worker
```

Open the UI at <http://localhost:5173>.

### Host-based development alternative

If you do not want to build application containers, start only infrastructure
and run the Node services from the host:

```powershell
docker compose up -d postgres redis mock-ledger mock-switch mock-settlement mock-dispute
pnpm --filter "@eri/gateway" dev
pnpm --filter "@eri/worker" dev
pnpm --filter "@eri/web" dev
```

When running from the host, use `localhost` service URLs in the process
environment. Do not start both host and container copies of the same service:
they will compete for ports 3000, 4001-4004, or 5173.

---

## Database migration & reset

Compose applies `scripts/migrate.sql` when a new PostgreSQL volume is created.
For an existing database, run the migration explicitly:

```powershell
Get-Content .\scripts\migrate.sql |
  docker compose exec -T postgres psql -U eri -d eri
```

To reset the local demo database and recreate all tables, stop the stack and
remove only the named PostgreSQL volume:

```powershell
docker compose down
docker volume ls
docker volume rm eri_postgres_data
docker compose up -d --build
```

The exact volume name can include a project-directory prefix; use the name
reported by `docker volume ls`. This removes local demo data, including audit
history, cases, and review records. Never use this procedure against a
production database.

---

## Seed mock banking data

The scenario generator creates 500 deterministic-shape cases and writes the
hidden oracle labels to `simulators/ground_truth.json`. The oracle is for
evaluation only and is not sent to Eri as evidence.

### Generate labels only

```powershell
pnpm --filter "@eri/scenario-generator" build
pnpm seed
```

### Generate and seed the mock ledger, switch, and settlement services

Set the opt-in flag before running the generator:

```powershell
$env:SEED_SIMULATORS = "true"
$env:SIMULATOR_HOST = "http://localhost"
pnpm --filter "@eri/scenario-generator" build
pnpm seed
Remove-Item Env:SEED_SIMULATORS
Remove-Item Env:SIMULATOR_HOST
```

This uses the simulators' demo-only `POST /eri/v1/seed` endpoints. It does not
insert the oracle labels into the Eri database.

---

## Verify the core workflow

The fixed fixtures are the fastest way to confirm that the core safety path is
working.

### Confirmed failure: reversal is allowed

`TX1004` and `TX1005` represent:

1. the ledger debited the sender;
2. the switch definitively rejected the destination;
3. settlement has no successful settlement record;
4. the policy allows a reversal within the configured amount limit;
5. the ledger reversal is sent with an idempotency key;
6. the ledger is reread before the case can close.

Submit a dispute through the gateway:

```powershell
$body = @{
  dispute_ref = "DSP-TX1004"
  transaction_ref = "TX1004"
  channel = "demo"
  category_hint = "DEBIT_NO_CREDIT"
  customer_text = "The sender was debited but the beneficiary was not credited."
  amount = 50
  currency = "USD"
  opened_at = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
$secret = "change_me_in_development"
$mac = [System.Security.Cryptography.HMACSHA256]::new(
  [Text.Encoding]::UTF8.GetBytes($secret)
)
$signature = [Convert]::ToHexString(
  $mac.ComputeHash([Text.Encoding]::UTF8.GetBytes("$timestamp.$body"))
).ToLowerInvariant()

Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:3000/v1/disputes `
  -ContentType "application/json" `
  -Headers @{
    "x-eri-timestamp" = $timestamp
    "x-eri-signature" = $signature
  } `
  -Body $body
```

The signature is an HMAC-SHA256 digest of
`<unix-timestamp>.<exact-request-body>`, using `WEBHOOK_HMAC_SECRET` from
`.env`. In a real integration, the upstream dispute system generates this
signature; never hard-code a production secret in a script.

Inspect the resulting case using the returned `case_id`:

```powershell
$caseId = "replace-with-case-id"
Invoke-RestMethod "http://localhost:3000/v1/cases/$caseId"
Invoke-RestMethod "http://localhost:3000/v1/cases/$caseId/evidence"
Invoke-RestMethod "http://localhost:3000/v1/cases/$caseId/audit"
```

The successful path should eventually show a closed case with a verified
reversal. The action record should contain a stable key in this form:

```text
<case-id>:REVERSE:1
```

Retrying the same workflow must not create a second ledger posting.

### Unknown timeout: no reversal

`TX1001` has a debit and switch timeout. It is intentionally
`INDETERMINATE`, not a confirmed failure. Eri schedules/persists a status query
and escalates or waits; it must not refund the customer based on timeout alone:

```powershell
# Change the transaction_ref and dispute_ref from the previous example.
$body = $body -replace "TX1004", "TX1001" -replace "DSP-TX1004", "DSP-TX1001"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
$signature = [Convert]::ToHexString(
  $mac.ComputeHash([Text.Encoding]::UTF8.GetBytes("$timestamp.$body"))
).ToLowerInvariant()
Invoke-RestMethod -Method Post -Uri http://localhost:3000/v1/disputes `
  -ContentType "application/json" `
  -Headers @{"x-eri-timestamp" = $timestamp; "x-eri-signature" = $signature} `
  -Body $body
```

### Already reversed and beneficiary credited

- `TX1002` is already reversed and should not receive a duplicate reversal.
- `TX1003` has switch credit and settlement proof and should not be refunded.

These scenarios demonstrate that a debit alone is not enough to authorize a
money-moving action.

---

## REST API reference

### Submit a dispute

```http
POST http://localhost:3000/v1/disputes
Content-Type: application/json

{
  "dispute_ref": "DSP-2026-004812",
  "transaction_ref": "TX1004",
  "channel": "mobile_app",
  "category_hint": "DEBIT_NO_CREDIT",
  "customer_text": "I was debited but the recipient was not credited",
  "amount": 75000,
  "currency": "NGN",
  "opened_at": "2026-10-08T09:14:00Z"
}
```

The endpoint returns `202 Accepted` with a `case_id`. Processing is
asynchronous, so poll the case rather than assuming it is complete immediately.

### Batch existing transaction references

`POST /v1/batches` accepts a bounded list of transaction references. It creates
only references that are not already present and enqueues them for processing:

```powershell
$batch = @{ refs = @("TX1001", "TX1002", "TX1003", "TX1004") } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3000/v1/batches `
  -ContentType "application/json" -Body $batch
```

Do not send `{"drain_all": true}`; that is an obsolete example and is not the
current batch contract.

### Inspect evidence, clocks, audit, and metrics

```powershell
$caseId = "replace-with-case-id"
Invoke-RestMethod "http://localhost:3000/v1/cases/$caseId"
Invoke-RestMethod "http://localhost:3000/v1/cases/$caseId/evidence"
Invoke-RestMethod "http://localhost:3000/v1/cases/$caseId/clocks"
Invoke-RestMethod "http://localhost:3000/v1/cases/$caseId/audit"
Invoke-RestMethod "http://localhost:3000/v1/metrics/summary"
Invoke-RestMethod "http://localhost:3000/v1/policies/active"
```

The audit response includes a verification result. A valid chain is required
for trustworthy review; a broken chain must be investigated rather than
silently ignored.

### Review an escalated case

List cases awaiting a human:

```powershell
Invoke-RestMethod http://localhost:3000/v1/review-queue
```

Submit a decision with a non-empty reason and reviewer identity:

```powershell
$review = @{
  decision = "APPROVED"
  reason = "Evidence confirms the transaction is a permitted confirmed failure."
  reviewer_id = "demo-reviewer-01"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/v1/cases/$caseId/review" `
  -ContentType "application/json" `
  -Body $review
```

The current demo review endpoint records the decision and audit event. It is
not a production maker-checker implementation.

---

## Web dashboard

1. Open <http://localhost:5173>.
2. Use the dashboard to view case totals, closed cases, pending reviews, and
   verified reversals.
3. Open **Review Queue** to inspect `PENDING_HUMAN` cases.
4. Open a case to inspect the evidence and lifecycle history.
5. Use the audit view to check the hash-chain verification result.
6. Use the policy view to inspect the active YAML policy returned by the
   gateway.

If the UI shows a network error, first verify that the gateway is reachable at
<http://localhost:3000/v1/health>. The UI calls `/v1/...` endpoints directly;
it does not use the old `/api/...` path.

The `/v1/activity` endpoint provides an SSE activity stream for integrations:

```javascript
const activity = new EventSource("http://localhost:3000/v1/activity");
activity.onmessage = (event) => console.log(JSON.parse(event.data));
```

---

## Transaction safety rules

| Evidence state | Expected behavior |
|---|---|
| Debit + definitive destination rejection + no reversal | Candidate for policy-approved reversal |
| Debit + switch timeout | Wait/status query/escalation; never infer failure |
| Switch credited and/or settlement proof | Close without refund |
| Existing reversal | Close without duplicate action |
| Conflicting sources | `CONFLICT`; no money-moving action |
| Amount over configured autonomous limit | Human approval/escalation |
| Kill switch enabled | Block autonomous actions |

Every action uses an idempotency key. A reversal request is not treated as
complete until a subsequent ledger read verifies the reversed state.

---

## Optional Gemini advisory AI

AI is disabled by default in Compose:

```dotenv
ENABLE_ADVISORY_AI=false
```

To exercise Gemini locally, set a valid key and opt in explicitly:

```powershell
docker compose down
# Set ENABLE_ADVISORY_AI=true in the environment used by the worker.
docker compose up -d --build
```

AI receives redacted ticket text and evidence context. Its output can explain,
extract, summarize, or lower confidence, but deterministic reconstruction and
policy remain authoritative. If Gemini is unavailable, keep AI disabled and
rerun the deterministic workflow.

---

## Build & test

```powershell
$env:PATH = "$env:APPDATA\npm;$env:PATH"

# Build every workspace package and application.
pnpm -r build

# Run the focused reconstruction regression tests.
pnpm --filter "@eri/reconstruction" test

# Run the complete configured test suite.
pnpm test
```

The web build may report a bundle-size warning; it does not fail the build.

---

## Repository structure

```text
apps/
  gateway/       REST API, webhook receiver, metrics, review endpoints
  worker/        Sentinel polling and BullMQ case orchestration
  web/           React dashboard and review interface
packages/
  core/          Shared types, state machine, calendar, redaction
  connectors/    Ledger, switch, settlement adapters
  reconstruction/ Deterministic timeline and derived state
  policy/        YAML policy parser/evaluator
  ai/            Optional Gemini advisory services
  executor/      Idempotent action execution and verification
  audit/         Hash-chain audit ledger and SLA tracker
simulators/
  mock-ledger/       Ledger/change-feed/reversal simulator
  mock-switch/       Switch/status-query simulator
  mock-settlement/   Settlement/reconciliation simulator
  mock-dispute/      Upstream dispute-system simulator
  scenario-generator Synthetic scenarios and hidden ground truth
policies/             Versioned demo policy YAML
scripts/migrate.sql   PostgreSQL schema
docs/                 OpenAPI and Postman artifacts
```

---

## Troubleshooting

### Docker port already in use

Find the process using a port:

```powershell
Get-NetTCPConnection -LocalPort 3000,4001,4002,4003,4004,5173 -ErrorAction SilentlyContinue
```

Stop only the specific process after confirming it is an old local Eri
process. Alternatively, stop the Compose stack and use one runtime mode
(containers or host processes), not both.

### Worker cannot resolve `mock-ledger`

The worker is configured for Docker DNS when running in Compose. Check that
all mock services are started and inspect:

```powershell
docker compose ps
docker compose logs worker mock-ledger mock-switch mock-settlement
```

### Database schema appears stale

The migration script is applied automatically only when the PostgreSQL data
volume is first initialized. Apply it manually or reset the local volume as
described in [Database migration & reset](#database-migration--reset).

### Gemini returns 503 or rate-limit errors

Set `ENABLE_ADVISORY_AI=false`, rebuild/restart the worker, and rerun the
deterministic scenario. Financial processing must remain independent of the
model provider.

### Docker build fails during pnpm workspace resolution

Build from the repository root so Docker has the workspace manifests:

```powershell
docker compose build gateway worker web
```

Do not run an application Dockerfile with a package directory as its build
context unless that Dockerfile has been specifically adapted for it.

---

## Cleanup

Stop containers but retain local database data:

```powershell
docker compose down
```

Stop containers and remove the local PostgreSQL/Redis volumes:

```powershell
docker compose down -v
```

The second command is destructive to local demo state. Never use it for a
shared or production database.

---

## License

Hackathon build. Not for production use.
#
#   E r i  
 