CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_ref TEXT UNIQUE NOT NULL,
    transaction_ref TEXT NOT NULL,
    channel TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL,
    derived_state TEXT,
    confidence NUMERIC,
    policy_version INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    customer_text TEXT,
    callback_url TEXT
);

CREATE TABLE IF NOT EXISTS customers (
    case_id UUID PRIMARY KEY REFERENCES cases(id),
    flags TEXT[] NOT NULL DEFAULT '{}'
);

CREATE UNIQUE INDEX IF NOT EXISTS cases_transaction_ref_unique
  ON cases (transaction_ref);

CREATE TABLE IF NOT EXISTS sentinel_state (
    id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true),
    cursor TEXT NOT NULL DEFAULT '0',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sentinel_state (id, cursor) VALUES (true, '0')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS tracked_transfers (
    session_id TEXT PRIMARY KEY,
    transaction_ref TEXT NOT NULL UNIQUE,
    last_event_cursor TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'TRACKED',
    next_check_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS status_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    attempt INT NOT NULL,
    result TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error TEXT,
    UNIQUE (case_id, attempt)
);

CREATE TABLE IF NOT EXISTS evidence_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    source TEXT NOT NULL,
    raw_payload JSONB NOT NULL,
    sha256 TEXT NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    event_type TEXT NOT NULL,
    source TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    raw_ref TEXT,
    payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    rule_id TEXT NOT NULL,
    mode TEXT NOT NULL,
    action TEXT NOT NULL,
    ai_advice JSONB,
    rationale TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    type TEXT NOT NULL,
    idempotency_key TEXT UNIQUE NOT NULL,
    request JSONB NOT NULL,
    response JSONB,
    status TEXT NOT NULL,
    executed_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    reviewer TEXT NOT NULL,
    decision TEXT NOT NULL,
    reason TEXT NOT NULL,
    reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    seq BIGSERIAL PRIMARY KEY,
    case_id UUID,
    event TEXT NOT NULL,
    payload JSONB NOT NULL,
    prev_hash TEXT,
    hash TEXT,
    at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION prevent_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_update ON audit_log;
CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

CREATE TABLE IF NOT EXISTS case_embeddings (
    case_id UUID REFERENCES cases(id),
    embedding vector(768),
    outcome TEXT
);

CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    version INT NOT NULL,
    yaml TEXT NOT NULL,
    active_from TIMESTAMPTZ NOT NULL,
    active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS sla_clocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    clock TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    deadline_at TIMESTAMPTZ NOT NULL,
    stopped_at TIMESTAMPTZ,
    stop_event TEXT,
    status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS breach_register (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    clock TEXT NOT NULL,
    party TEXT NOT NULL,
    cause TEXT NOT NULL,
    exposure_ngn NUMERIC,
    corrective_action TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS counterparty_scorecards (
    bank_code TEXT NOT NULL,
    period DATE NOT NULL,
    late_returns INT DEFAULT 0,
    late_credits INT DEFAULT 0,
    cases INT DEFAULT 0,
    PRIMARY KEY (bank_code, period)
);

CREATE TABLE IF NOT EXISTS calendar_days (
    date DATE PRIMARY KEY,
    is_working_day BOOLEAN NOT NULL,
    note TEXT
);

-- Insert Nigerian public holidays 2026
INSERT INTO calendar_days (date, is_working_day, note) VALUES
('2026-01-01', false, 'New Year''s Day'),
('2026-04-03', false, 'Good Friday'),
('2026-04-06', false, 'Easter Monday'),
('2026-05-01', false, 'Workers'' Day'),
('2026-05-27', true, 'Children''s Day'),
('2026-06-12', false, 'Democracy Day'),
('2026-10-01', false, 'Independence Day'),
('2026-12-25', false, 'Christmas Day'),
('2026-12-26', false, 'Boxing Day')
ON CONFLICT (date) DO NOTHING;
