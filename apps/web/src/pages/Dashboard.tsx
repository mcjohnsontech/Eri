import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Clock3, RefreshCw, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EriClient } from '../api/client';

type Metrics = {
  total: number;
  closed: number;
  pending_human: number;
  failed: number;
  verified_reversals: number;
  auto_resolution_rate: number;
};

const initialMetrics: Metrics = {
  total: 0, closed: 0, pending_human: 0, failed: 0, verified_reversals: 0, auto_resolution_rate: 0,
};

const causeGroups = [
  ['Confirmed failure', 'moss'],
  ['Unknown / awaiting status', 'ochre'],
  ['Conflicting evidence', 'clay'],
  ['Already resolved', 'indigo'],
] as const;

function Metric({ label, value, note, tone = 'ink' }: { label: string; value: string | number; note: string; tone?: string }) {
  const color = tone === 'moss' ? 'text-[var(--eri-moss)]' : tone === 'ochre' ? 'text-[var(--eri-ochre)]' : tone === 'clay' ? 'text-[var(--eri-clay)]' : 'text-[var(--eri-ink)]';
  return (
    <div className="panel min-h-[128px] p-[18px]">
      <div className="eyebrow">{label}</div>
      <div className={`mono mt-4 text-3xl font-medium ${color}`}>{value}</div>
      <div className="mt-2 text-xs text-[var(--eri-muted)]">{note}</div>
    </div>
  );
}

export function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [cases, setCases] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [metricData, caseData] = await Promise.all([EriClient.getMetrics(), EriClient.getCases()]);
      setMetrics({ ...initialMetrics, ...metricData });
      setCases(Array.isArray(caseData) ? caseData : caseData.cases || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const groupCounts = useMemo(() => {
    const counts = cases.reduce<Record<string, number>>((acc, item) => {
      const state = String(item.derived_state || item.status || '').toUpperCase();
      const key = state.includes('FAILED') ? 'Confirmed failure' : state.includes('INDETERMINATE') || state.includes('WAITING') ? 'Unknown / awaiting status' : state.includes('CONFLICT') ? 'Conflicting evidence' : 'Already resolved';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return causeGroups.map(([label, tone]) => ({ label, tone, count: counts[label] || 0 }));
  }, [cases]);

  const recentCases = cases.slice(0, 6);

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-5 border-b border-[var(--eri-border)] pb-7 md:flex-row md:items-end">
        <div>
          <div className="eyebrow">Dispute operations · live view</div>
          <h1 className="display mt-3 text-4xl leading-tight tracking-[-0.035em] text-[var(--eri-ink)] sm:text-5xl">Evidence to resolution.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--eri-muted)]">A current view of cases, deterministic findings, and the work that still needs an officer.</p>
        </div>
        <button onClick={() => void load()} className="focus-ring inline-flex items-center gap-2 self-start border border-[var(--eri-indigo-600)] px-4 py-2.5 text-sm font-semibold text-[var(--eri-indigo-700)] hover:bg-white md:self-auto">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </section>

      {error && <div className="border-l-4 border-[var(--eri-clay)] bg-white p-4 text-sm text-[var(--eri-clay)]">{error}. Check that the gateway is running.</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Cases monitored" value={metrics.total} note="Current persisted case volume" />
        <Metric label="Verified reversals" value={metrics.verified_reversals} note={`${Number(metrics.auto_resolution_rate || 0).toFixed(1)}% automatic resolution rate`} tone="moss" />
        <Metric label="Awaiting officer" value={metrics.pending_human} note="Requires human decision" tone="ochre" />
        <Metric label="Failed / unresolved" value={metrics.failed} note="Needs investigation or recovery" tone="clay" />
      </section>

      <section className="grid items-start gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--eri-border)] p-[18px]">
            <div>
              <div className="eyebrow">Live queue</div>
              <h2 className="display mt-1 text-xl">Recent cases</h2>
            </div>
            <Link to="/review-queue" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--eri-indigo-600)]">Review queue <ArrowUpRight size={14} /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="border-b border-[var(--eri-border)] text-[11px] uppercase tracking-[.12em] text-[var(--eri-muted)]">
                  <th className="px-[18px] py-3 font-semibold">Reference</th>
                  <th className="px-3 py-3 font-semibold">State</th>
                  <th className="px-3 py-3 font-semibold">Created</th>
                  <th className="px-[18px] py-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map((item) => {
                  const state = String(item.derived_state || item.status || 'UNKNOWN');
                  const failed = state.includes('FAILED') || state.includes('CONFLICT');
                  const pending = state.includes('INDETERMINATE') || state.includes('WAITING') || state.includes('PENDING');
                  return (
                    <tr key={item.id} className="border-b border-[var(--eri-border)] last:border-0 hover:bg-[var(--eri-paper)]">
                      <td className="px-[18px] py-4"><Link to={`/cases/${item.id}`} className="mono text-sm text-[var(--eri-indigo-600)] hover:underline">{item.transaction_ref || item.id}</Link></td>
                      <td className="px-3 py-4 text-sm"><span className="inline-flex items-center gap-2"><span className={`state-dot ${failed ? 'bg-[var(--eri-clay)]' : pending ? 'bg-[var(--eri-ochre)]' : 'bg-[var(--eri-moss)]'}`} />{state.replaceAll('_', ' ')}</span></td>
                      <td className="mono px-3 py-4 text-xs text-[var(--eri-muted)]">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</td>
                      <td className="mono px-[18px] py-4 text-right text-sm">₦{Number(item.amount || 0).toLocaleString()}</td>
                    </tr>
                  );
                })}
                {!loading && recentCases.length === 0 && <tr><td colSpan={4} className="px-[18px] py-10 text-center text-sm text-[var(--eri-muted)]">No cases have been ingested yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel p-[18px]">
          <div className="eyebrow">System reading</div>
          <h2 className="display mt-1 text-xl">Case composition</h2>
          <div className="mt-6 space-y-5">
            {groupCounts.map(({ label, count, tone }) => (
              <div key={label}>
                <div className="mb-2 flex justify-between gap-4 text-sm"><span>{label}</span><span className="mono text-[var(--eri-muted)]">{count}</span></div>
                <div className="h-2 bg-[var(--eri-border)]"><div className={`h-full ${tone === 'moss' ? 'bg-[var(--eri-moss)]' : tone === 'ochre' ? 'bg-[var(--eri-ochre)]' : tone === 'clay' ? 'bg-[var(--eri-clay)]' : 'bg-[var(--eri-indigo-500)]'}`} style={{ width: `${Math.max(count ? 10 : 0, Math.min(100, cases.length ? (count / cases.length) * 100 : 0))}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-7 border-t border-[var(--eri-border)] pt-4 text-xs leading-5 text-[var(--eri-muted)]">Eri separates financial evidence from interpretation. Unknown states remain unknown until a permitted status query resolves them.</div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="panel flex gap-3 p-[18px]"><CheckCircle2 className="mt-0.5 text-[var(--eri-moss)]" size={18} /><div><div className="text-sm font-semibold">Deterministic authority</div><p className="mt-1 text-xs leading-5 text-[var(--eri-muted)]">Policies, not an LLM, govern money-moving actions.</p></div></div>
        <div className="panel flex gap-3 p-[18px]"><Clock3 className="mt-0.5 text-[var(--eri-ochre)]" size={18} /><div><div className="text-sm font-semibold">SLA aware</div><p className="mt-1 text-xs leading-5 text-[var(--eri-muted)]">Indeterminate cases are monitored rather than guessed.</p></div></div>
        <div className="panel flex gap-3 p-[18px]"><TriangleAlert className="mt-0.5 text-[var(--eri-clay)]" size={18} /><div><div className="text-sm font-semibold">Audit by default</div><p className="mt-1 text-xs leading-5 text-[var(--eri-muted)]">Lifecycle transitions remain visible and verifiable.</p></div></div>
      </section>
    </div>
  );
}
