# ERI v3 — MASTER PROJECT CONTEXT PROMPT

**Project:** Eri — proactive transaction monitoring and autonomous dispute resolution for Nigerian banks  
**Target:** Hackathon MVP, simulated banking infrastructure  
**Baseline:** Eri v3 Hackathon MVP Build & Technical Implementation Plan (8 October 2026), informed by *Eri: Project Brief, Architecture & Technical Documentation*, especially Part 5.  
**Use:** Paste this file into Cursor, Claude Code, Codex, or another coding assistant as project-level instructions.  
**Status:** Proposed implementation baseline, not a claim of real NIBSS integration or regulatory certification.

---

## 0. Your role as the engineering agent

You are the senior backend/platform engineer, fintech integration architect, and practical hackathon delivery partner responsible for implementing **Eri v3**. Build real, executable, maintainable code and tests, not a conceptual mockup. Respect the architecture and safety constraints here; ask only about decisions that are genuinely blocking, and otherwise make narrow, documented implementation choices. Before changing the repo, inspect what already exists and adapt it rather than rebuilding working modules.

Treat this document as the project contract. If later explicit instructions from the project team conflict with it, follow the team's newer instruction, flag the difference, and update the relevant docs. Do **not** invent bank access, NIBSS credentials, regulatory guarantees, live transaction authority, or unverified integration behavior.

### Expected behavior

- Prefer an **end-to-end vertical slice**: mock debit → Sentinel detects → evidence gathering → deterministic policy → (reverse, wait, or escalate) → verification → write-back → audit → live UI.
- Produce coherent incremental changes, with file-level explanations, runnable commands, and test outcomes.
- Keep TypeScript types and API schemas shared; validate incoming payloads, raw integration responses, and AI JSON outputs.
- Make all financial side effects simulated and routed exclusively through an allow-listed action gateway.
- Do not use an LLM as a payment-state oracle or decision-maker.
- Maintain working Docker Compose and demo seed commands throughout implementation.

## 1. Why Eri exists

Nigerian bank dispute operations often involve manual checks across a core ledger, NIP payment/switch records, settlement/reconciliation data, and dispute tools. Eri aims to remove repetitive investigation and resolve *proven* low-risk technical failures before customers even complain, while delivering difficult cases to analysts in their **existing** bank dispute dashboard with evidence already assembled.

**One-liner:** Eri is an embedded SDK/agent that proactively monitors transfers, reconstructs their status from bank-controlled evidence and authorised NIP status queries, automatically remediates eligible confirmed failures under deterministic policy, and preserves a tamper-evident audit trail.

**Product pillars:** (1) monitoring as a service for banks; (2) authoritative, multi-source investigation including an NIBSS-backed status-query **adapter** where institutionally permitted; (3) safe policy-gated remediation and audit. NIBSS's customer-facing NIP Transaction Tracker via USSD is a complementary external customer channel, **not** Eri's backend API or a feature we own.

**Non-negotiable product difference:** The MVP must start work on transfer events **without a customer complaint or manual resolution request**. The Sentinel is the first trigger; a complaint is the second trigger and attaches to an already-tracked transfer where applicable.

## 2. Sources, authority, and supersession

1. **Primary implementation contract:** *Eri v3 Hackathon MVP Build & Technical Implementation Plan* (8 October 2026).
2. **Architecture inheritance:** *Eri: Project Brief, Architecture & Technical Documentation*, **Part 5 (v2)** overrides its earlier Parts 2–4 when they conflict.
3. **This master context** translates those sources into implementation-oriented requirements and highlights newly suggested choices where the source does not prescribe an exact solution.
4. **Bank/NIBSS/regulatory behavior:** Anything requiring production institutional access, current response-code definitions, actual Ecobank SOPs, or legal interpretation must be marked **UNVERIFIED / REQUIRE PARTNER VALIDATION**. Mock contracts are not proof of live API access.

## 3. Hackathon scope and exclusions

### Must implement

- NIP-style debit-not-credited transfer scenarios, simulated locally.
- Mock bank: core postings ledger, transfer service/change feed, payment switch, simulated bank-authorised NIP status query, settlement/reconciliation, mock dispute dashboard adapter.
- Eri Agent: Sentinel tracking, orchestration, evidence adapters, canonical event normalization, transaction state reconstruction, versioned policy, decision logic, reversible-where-possible simulated action execution, verification, evidence/audit ledger.
- At least three core outcomes end to end: **confirmed failure automatically reversed**, **unknown status waited/requeried**, **success without beneficiary-credit proof tracked without refund**. Add conflict/human escalation.
- Lightweight live activity wall and case detail/audit inspection; Postman collection demonstrating published interfaces and negative tests.
- One-command reproducible startup, seeded scenarios, clear logs, scenario-focused automated tests.

### Excluded from the core MVP

- Real transfers, real bank credentials, direct production NIBSS connectivity, actual money movement.
- Building a new consumer USSD product or claiming to operate the existing NIBSS NIP tracker.
- Full POS acquiring/merchant settlement stack; POS may appear as a documented/optional mocked case but follows a different workflow.
- Cross-border rails, real card chargebacks, bank-specific production certification, comprehensive compliance implementation.
- Building a replacement bank dispute application; UI is only an existing-system **mock bridge** and activity viewer.

## 4. System topology

```text
SIMULATED BANK (independent contract)
  transfer service + durable change feed ───────────────┐
  ledger postings ────────────────────────────────────┐  │
  switch response + MOCK NIP status-query endpoint ─┐│  │
  settlement/reconciliation ───────────────────────┐ ││  │
                                                 ▼ ▼▼  ▼
ERI AGENT (deployed as if inside bank's network)
  Sentinel/change-feed consumer → tracked sessions → durable scheduler
                                   │
                                   ▼
                       evidence adapters + raw snapshots
                                   │
                                   ▼
                     canonical timeline + deterministic state
                                   │
                    policy engine + advisory AI (optional)
                         │            │            │
                      REVERSE        WAIT       ESCALATE/CLOSE
                         │            │            │
                 Action Gateway   status-query  Dashboard Bridge
                         │           loop          │
                     post-verify       └───────┬───┘
                         └─────────────────────┘
                                   ▼
                        append-only audit + metrics
                                   │
                 mock bank dispute dashboard + live activity wall
                                   │
                     Postman for integration inspection
```

The **mock bank and Eri must communicate through stable HTTP/event contracts**. Keep those boundaries even if initially deployed together through Docker Compose. No Eri policy code should directly mutate the mock bank's database. A developer/operator may use Postman to **inject synthetic scenarios**, but that is not an Eri resolution trigger.

## 5. Recommended stack and monorepo

Use TypeScript/Node.js for the reference implementation, given the source build plan's recommendation. Fastify **or** Express is acceptable; choose one and document it. Use PostgreSQL for durable transactions, event cursor, cases, evidence, actions, and audit; Redis + BullMQ for asynchronous jobs/retries; React + Vite + Tailwind for lightweight monitoring UI; Docker Compose for local demo. Use OpenAPI and an exportable Postman collection. AI is optional/stubbed initially and uses strict typed outputs if included. pgvector is stretch.

```text
eri/
  apps/
    agent/             # event reader, orchestrator, scheduler, API
    mock-bank/         # independent bank simulator and contract server
    web/               # activity wall + mock dispute view
  packages/
    core/              # IDs, canonical events, states, shared schemas
    evidence/          # contract clients, normalization, raw snapshots
    policy/            # deterministic rules, evaluated version and reason
    executor/          # action gateway, idempotency, pre/post verification
    audit/             # hash-chained events, evidence integrity verification
    ai/                # optional advisory extraction / summaries
  policies/
    nip_hackathon_v3.yaml
  docs/
    openapi.yaml
    eri.postman_collection.json
    architecture.md
    decisions.md
  scripts/
    seed.ts
    run-demo.ts
  docker-compose.yml
  README.md
  PROJECT_CONTEXT.md
```

This layout is a **recommended v3 organization**, not evidence these files already exist. First inspect the repo and reconcile with its actual structure.

## 6. Core Evidence Contract (mock bank → Eri)

Keep endpoints separate from Eri's case/debug APIs.

| Method and path | Responsibility |
|---|---|
| `GET /eri/v1/changes?since=` | Durable, cursor-based transfer change feed; Sentinel primary trigger |
| `GET /eri/v1/transfers/{ref}` | Immutable identifiers, transfer details and internal status |
| `GET /eri/v1/postings?ref=` | Debit, reversal, and other ledger posting evidence |
| `GET /eri/v1/switch/{sessionId}` | Submitted transfer and switch responses |
| `POST /eri/v1/switch/{sessionId}/status-query` | Simulated **bank-authorised** NIP status query, not public USSD |
| `GET /eri/v1/settlement/{sessionId}` | Settlement/reconciliation corroboration and conflicts |
| `POST /eri/v1/reversals` | Narrow simulated reversal action with idempotency |
| `POST /eri/v1/dispute-cases` | Write-back into mock bank's existing dispute dashboard |

The earlier architecture also proposes beneficiary detail and service-health endpoints; implement them if needed to make the evidence contract complete. Clearly label any added demo-only endpoints.

**Normalized evidence:** stable `session_id` (prefer bank/NIP transaction key), internal transfer reference, amount and currency, channel, debit posting and timestamps, beneficiary bank/account *masked for nonprivileged views*, switch submission/code/query, settlement status, reversal status, `fetched_at`, source, raw response reference, source digest, correlation IDs. Use UTC internally and Nigeria-local rendering as needed. Avoid floating-point arithmetic for money; use integer minor units or validated decimal representation.

**Source semantics:** bank ledger establishes postings; a recognised authoritative NIP switch/status result establishes what that rail reported; receiving-bank/settlement evidence corroborates downstream credit where available. A single "success" code **is not equivalent** to proof that the beneficiary was credited. In disagreements, mark a conflict, preserve sources, and do not auto-reverse.

**NIP status code handling:** Load an explicit versioned, reviewed mapping for `SUCCESS`, `DEFINITIVE_FAILURE`, `PENDING/UNKNOWN`, `OTHER`; in the simulator use controlled synthetic codes/fixtures and do not present them as a certified NIBSS code table. Never infer failure from timeout, missing callback, or age alone.

## 7. Sentinel-first, no-complaint execution

At startup:

1. Connect to the mock bank change feed and recover the persisted cursor.
2. Observe `DEBIT_POSTED` and subsequent switch/reversal/settlement changes.
3. Track all debited sessions not yet safely finalised; use `sessionId` as the logical transaction key, with per-debit posting identity for duplicate-debit resolution.
4. Enqueue evidence fan-out, reconstruct the timeline, evaluate policy, and transition state durably.
5. If evidence is incomplete/unknown, schedule configurable status queries and retries; persist query attempts and results.
6. If **definitive failure** is corroborated, pass risk and pre-flight checks and execute one simulated reversal.
7. Verify that the corresponding ledger credit-back actually posted before marking it resolved; retain reconciliation watch to detect late credits.
8. If conflict, risk flag, missing critical source, or deadline, write a full case to the mock bank dashboard for human review.
9. On a later customer complaint with the same transaction key, attach it to the existing tracked case. Do not duplicate the resolution or reversal.

Simulate events being generated automatically (seed runner/traffic producer). `POST /demo/transactions` or `POST /demo/scenarios/{id}/play` is an **optional demo injection** surface, not a production ingestion requirement.

## 8. Payment-state model and policy matrix

Distinguish the **technical case lifecycle** from the **derived transaction state**. Recommended transaction states:

| Derived state | Evidence | Allowed action |
|---|---|---|
| `FAILED_NOT_REVERSED` | Explicit definitive failure, debit exists, no reversal/credit | Preflight → policy-gated **instant simulated reversal** → verify posting |
| `PRE_SWITCH_FAILURE` | Proof bank never submitted transaction externally and debit exists | Eligible pre-switch reversal following separate policy |
| `INDETERMINATE` | Timeout, no answer, unclear or inconsistent-unverified outcome | **Never auto-refund**; status query, recheck, escalation |
| `SUCCESS_CREDIT_UNCONFIRMED` | Switch reports success, beneficiary claims no credit / downstream evidence incomplete | Wait for receiving-bank/industry investigation or definitive reversal evidence; monitor; no premature refund |
| `COMPLETED` | Authoritative confirmation beneficiary credited and settlement consistent | Close with proof; no refund |
| `PENDING_REVERSAL` | Reversal requested/initiated, not yet posted | Continue tracking, do not count as refunded |
| `FAILED_REVERSED` / `REFUND_VERIFIED` | Reversal posting confirmed by ledger and linked to debit | Close eligible case, message and audit; monitor for late settlement |
| `CONFLICT` | Credible sources materially disagree | Freeze auto-actions; escalate with evidence |
| `HUMAN_REVIEW` | Above limits, flags, missing critical evidence or policy not matched | Human approval/override only through bank dashboard |

Additional optional case stages: `AWAITING_RECEIVING_BANK`, `REVERSAL_CONFIRMED`, `REFUND_VERIFIED`; do not treat a request or receiving-bank promise as an actual refund.

**Critical invariants:**

- **UNKNOWN ≠ FAILED.** A timeout must not trigger automatic reversal.
- **SWITCH SUCCESS ≠ BENEFICIARY CREDIT PROVEN.** Keep investigating where appropriate.
- **REVERSAL REQUESTED ≠ REFUND COMPLETED.** Require post-action ledger evidence.
- **Never double refund** a debit, even on retries, duplicate webhooks, process restarts, or race with an existing bank reversal.
- AI must never decide transaction truth or call action tools to move funds.

### Auto-reversal prerequisites

All must hold: verified definitive failure (or proven pre-switch failure under its separate rule); valid debit posting; no prior reversal or beneficiary credit evidence; no material evidence conflicts; amount and rate caps; no fraud/hold blocks; eligible autonomy level; current signed/approved policy version; fresh pre-flight reread. The action gateway must enforce a unique idempotency key tied to the original session/debit ID, followed by post-flight verification.

### Channel-specific timing

- **NIP confirmed failure:** simulate seconds-scale reversal to show the intended product experience. Production timing requires actual bank/rail authorisation and applicable regulation.
- **NIP success without credit confirmation:** wait, query, track receiving-bank reversal/reconciliation; a refund within hours is a *desired* experience **only after** documented, verified authorisation—not an unconditional SLA.
- **NIP unknown:** widening requery cadence and deadline escalation, with **no automatic refund from elapsed time alone**.
- **POS merchant disputes:** separate merchant/acquirer-initiated process and settlement-driven timers. The proposed **24–48 business-hour** window is an assumption to validate and **not a universal regulatory promise**.
- **NIBSS public customer USSD:** external customer-information complement; not an SDK integration endpoint.

## 9. Workflow state machine

Suggested case lifecycle:

```text
TRACKED → ENRICHING → RECONSTRUCTED → DECIDING
                             ├─ WAITING → STATUS_REQUERY → ENRICHING
                             ├─ PENDING_HUMAN → (approve/reject/override)
                             ├─ AUTO_APPROVED → EXECUTING → VERIFYING
                             │                                  ├─ RESOLVED → WRITTEN_BACK → CLOSED
                             │                                  └─ FAILED_REVIEW → PENDING_HUMAN
                             └─ NOT_UPHELD / INFORMATION_PROVIDED → WRITTEN_BACK → CLOSED
```

Not all terminal closures mean a refund. Every transition is validated, durable, compare-and-set/version guarded and appended to the audit ledger. A failed/ambiguous external action is **verified before retry**. Maintain a waiting loop for NIP status, and keep a separate settlement follow-up after credited-back cases to catch late destination credit.

## 10. Persistence and data integrity

Suggested tables/entities:

- `tracked_transfers`: session, posting identity, status, next check, last cursor/event, timestamps.
- `transfer_events`: source event identity, type, occurred_at, payload digest; unique source/event id.
- `cases`: original dispute ref if one exists, session, derived payment state, lifecycle status, policy version, confidence, resolution and owner.
- `evidence_items`: source, raw response as JSONB, captured_at, sha256, raw reference; immutable.
- `timeline_events`: canonical event type, source, event time, raw evidence pointer.
- `status_queries`: attempt, request/ref, result, scheduled_at, completed_at, error.
- `decisions`: matched rule, evaluated facts, permitted/blocked actions, reason, AI advisory output.
- `actions`: idempotency key, action type, payload, response, posting reference, verification status, timestamps.
- `reviews`: reviewer, maker/checker where applicable, decision and mandatory reason.
- `audit_log`: append-only sequence, case/session, event, previous hash, current hash and timestamp.
- `incidents` and `counterparty_stats`: stretch outage grouping, receiving-bank failure trend.
- `policies`: versioned rules, effective time, checksum and activation metadata.

Use proper database constraints for uniqueness and side-effect safety, not application checks alone. Seed hidden ground-truth outcome labels in **test fixtures only**, never in evidence visible to Eri's policy engine.

## 11. Policy engine, audit, and safeguards

- Policies are versioned YAML/JSON configuration evaluated **deterministically** and auditable per case. Implement explicit precedence for mandatory blocks and source conflicts over allowed actions.
- Allow-lists, per-action max, per-customer/hour caps, global kill switch, `observe | shadow | auto` autonomy modes.
- Default to safe inaction and escalation when a condition is missing, a connector fails, or the status is unknown.
- A privileged bank-controlled action gateway is the **only** component that can call mock bank reversal endpoints.
- Requery ledger and switch before and after a reversal. Verify-after-timeout before trying again. Persist idempotency key across restarts.
- Evidence stored with SHA-256 and a chained append-only audit: rule version, sources, decision, attempted actions, verified postings, elapsed clocks.
- Separate review recommendation from approval and use maker-checker for high-risk operations where configured.
- Mask PII before logs, UI views, and any AI call. Never send unredacted customer data to a public model.
- CBN/NIBSS timers in the original Part 4 are **candidate policy parameters**, not certified current law. Do not hardcode unverified legal deadlines or penalties as definitive production requirements.

## 12. AI is advisory, not a dependency for financial truth

Potential roles: extract fields from customer complaint text, interpret unstructured log messages after known codes have been mapped deterministically, summarise evidence for a bank analyst, and retrieve similar cases for analysis. Require schema-valid JSON, low-variance settings, redaction, stored model/prompt version, and a canned/cached offline fallback. It may **lower** decision confidence or trigger human escalation; it may never upgrade an unknown transfer to failed, override policy, invent ledger postings, or instruct money movement.

Build the deterministic core and simulator before optional AI.

## 13. Public-facing Eri API and Postman

Keep the mock bank contract above separate from these case/demo interfaces:

| Endpoint | Purpose |
|---|---|
| `POST /demo/transactions` | Demo-only synthetic injection; mock bank publishes normal change events |
| `POST /demo/scenarios/{id}/play` | Demo-only deterministic scenario runner |
| `GET /v1/cases/{caseId}` | Case, state, decision and action status |
| `GET /v1/cases/{caseId}/evidence` | Evidence bundle, raw-source references and hashes |
| `GET /v1/cases/{caseId}/audit` | Chronological chained audit |
| `GET /v1/metrics/summary` | Auto-resolution, wrong-action, latency, exceptions and backlog |
| `GET /v1/health` | Component and adapter health |

Deliver `docs/openapi.yaml` plus `docs/eri.postman_collection.json` with collection variables `baseUrl`, `sessionId`, `caseId`, canned payloads, expected error cases, and assertions. Postman is for **contract demonstration, synthetic test injection, and inspection**. Do not rely on Postman button presses to make Eri detect or decide a reversal.

## 14. Minimal UI and demo observability

One functional page is enough to tell the story:

- **Live activity wall**: events, automatic detection, statuses, actions, delayed queries, verified results; preferably via SSE/WebSocket.
- **Compact case inspector**: ordered transaction timeline, evidence provenance, policy rule and version, no-action explanation, idempotency and verification status.
- **Existing-system dispute mock**: escalated cases, recommendation, owner, clock, evidence and approval/rejection/override.
- **Metrics**: count of eligible auto-resolutions; false/wrong action count; duration to verified refund; unresolved unknowns; exceptions; audit completeness. Any 'complaints avoided' figure derived from hypothetical behavior must be visibly labeled an **estimate**, unless actually measured.

No elaborate customer app, consumer dashboard, or custom bank portal is necessary.

## 15. Required scenarios and acceptance tests

Each fixture must define a *hidden* expected state and action. The policy engine must never read the oracle label.

| ID | Synthetic scenario | Must happen |
|---|---|---|
| A | Debit + definitive failed NIP/switch status + no reversal | Exactly one immediate simulated reversal, actual ledger credit-back confirmed, full audit |
| B | Debit + switch timeout/unknown | No refund; status query scheduled; waiting state and trace |
| C | Unknown later becomes confirmed successful and credited | Never refund; close with proof |
| D | Switch success, beneficiary reports no credit and receiving evidence incomplete | Monitor; no premature refund |
| E | Switch/settlement/ledger material conflict | Human escalation and zero automated money-moving actions |
| F | Duplicate webhook and late pre-existing reversal | Deduplicate; never second reversal; verify-before-retry |
| G | NIP status source unavailable | Preserve unknown/incomplete evidence; retry or escalate; never invent failure |
| H | POS failed payment logged by merchant (optional) | Route to separate policy/clock; no NIP auto-reversal |

Also unit-test canonical event mapping, rule precedence, pending reversal, replay cursor persistence, crash/restart, kill switch, cap enforcement, approval flow, audit-chain tamper detection, and permission separation. Do not confuse synthetic expected outcome labels with independent live-world verification.

**Release gates:** (1) zero wrongful auto-reversals across seeded scenarios, (2) zero duplicate reversal postings, (3) 100% verified auto-actions before a case is marked refunded, (4) evidence and policy version linked to every action, (5) offline deterministic demo works. A seeded 500-case backlog and counterparty outage/incident are stretch after the eight gold-standard tests pass.

## 16. Build in this order (48–72-hour reference plan)

1. **Setup (2–3h):** monorepo, Compose, schemas, DB migrations, OpenAPI skeleton, reproducible seed runner.
2. **Mock bank (6–8h):** ledger + switch + mocked authorised NIP query + durable change feed + three core scenarios.
3. **Sentinel (5–7h):** consume events autonomously, persist cursor, track incomplete sessions, schedule requery.
4. **Reconstruction and policy (6–8h):** canonical state machine, status code map, explicit safe decision rules, tests.
5. **Reversal and audit (6–8h):** preflight, idempotent synthetic reversal, postflight verification, ledger and audit proof.
6. **Dashboard and Postman (7–9h):** live wall, case details, mock bank escalation bridge, OpenAPI and runnable collection.
7. **Hardening and pitch (6–9h):** chaos/duplicate/source-outage tests, fallback offline flows, five-minute rehearsal.

**Suggested ownership:** backend/orchestration; bank simulator/connectors; policy/executor/audit; frontend/demo; AI/product/Postman/presenter. Combine roles if team size is smaller. Decide API schemas and IDs before parallel work begins.

**If under severe time pressure:** retain one vertical slice, A (reversal), B (unknown), E (conflict), a single activity page, audit and Postman. Cut fancy analytics and AI, **never** remove idempotency, verification, or unknown-state safety.

## 17. Five-minute demo sequence

- `0:00–0:40` — bank dispute friction; Eri monitors without waiting for a complaint.
- `0:40–1:25` — simulated transfer traffic starts by itself; Sentinel detects a failed transaction.
- `1:25–2:10` — Eri checks authoritative sources, auto-reverses confirmed failure once, verifies ledger credit-back.
- `2:10–2:55` — inject/show unknown transaction; Eri refuses to refund and schedules status query.
- `2:55–3:35` — Postman: inspect bank Core Evidence Contract, case endpoint, policy/evidence/audit records.
- `3:35–4:20` — successful-but-uncredited waiting path and an escalated conflict appear in the mock bank dashboard.
- `4:20–5:00` — metrics, safeguards, why real banks can pilot in shadow mode with no replacement of their dispute system.

Prepare a pre-seeded offline script and a short fallback recording. The operator can control the demo traffic, but **Eri's investigation and reversal decisions must be autonomous**.

## 18. Definition of done and operational commands

At minimum, the repo should support reproducible equivalents of:

```bash
# Illustrative commands; implement and document exact project scripts.
docker compose up --build
npm run db:migrate
npm run seed:demo
npm run test
npm run demo
```

Produce `README.md` with prerequisites, service ports, credential-free mock setup, what scripts run, how to show a confirmed failure versus unknown state, how to import and run Postman, and what is simulated. Document error troubleshooting and reset commands.

Before claiming completion, run tests and report actual results; never claim passing tests if they were not executed.

## 19. Explicitly unresolved / partner-dependent questions

These are **not** blockers for the mock MVP; annotate them rather than guessing:

- Current official NIBSS NIP status response-code specification and institution-authorised access terms.
- Whether a particular bank's core/ledger/dispute dashboard can implement the proposed contract as written.
- Which NIBSS interbank dispute channels support APIs versus files or a portal.
- Ecobank internal SLA/policy, approval limits, AML/fraud flags, and authorised refund powers.
- Current precise CBN/NIBSS resolution clocks and regulatory interpretation, including POS merchant policies.
- Whether a receiving bank's reversal confirmation provides sufficient authority for an automatic credit in a real implementation.

The hackathon uses simulated services and deliberately configurable policies. Production rollout should start in observe/shadow mode, validate evidence quality and analyst agreement, secure formal bank/compliance approval, and only then enable limited auto-action.

## 20. Instructions for the coding agent's first response

When asked to begin implementing Eri:

1. Check repository contents and identify pre-existing modules, incomplete work, and current build/test state.
2. Summarise the proposed milestone and affected files concisely.
3. Implement the next smallest independently verifiable vertical slice; avoid speculative features.
4. Supply tests and runnable commands; run what is available.
5. Report changes, observed results, and any remaining blockers or unverified external assumptions.
6. Keep `PROJECT_CONTEXT.md`, `README.md`, OpenAPI, policy fixtures, and Postman synchronized with actual implemented code.

**Final directive:** Build an *autonomous, evidence-first fintech infrastructure demo*, not an AI chatbot, manual Postman workflow, or fictional direct NIBSS integration. Proven failure may trigger an authorised simulated reversal. Unknown must never trigger a refund. Every action must be verifiable, traceable, and safe to repeat.
