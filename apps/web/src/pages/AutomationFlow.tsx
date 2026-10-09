import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpRight, CheckCircle2, Clock3, GitBranch, Radio, Search, ShieldAlert, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { EriClient } from '../api/client';

type FlowStatus = 'RUNNING' | 'COMPLETED' | 'WAITING' | 'ESCALATED' | 'FAILED';
type ActivityEvent = { case_id: string; event: string; payload: Record<string, any>; at: string };

const stageDefinitions = [
  ['01', 'Transaction detected', ['CASE_CREATED', 'DEBIT_POSTED']],
  ['02', 'Evidence collection', ['EVIDENCE_GATHERED']],
  ['03', 'State reconstruction', ['STATUS_TRANSITION']],
  ['04', 'Policy evaluation', ['POLICY_EVALUATED']],
  ['05', 'Decision', ['DECISION_MADE']],
  ['06', 'Execution or monitoring', ['REVERSAL_SUBMITTED', 'STATUS_QUERY_SCHEDULED', 'STATUS_QUERY_COMPLETED']],
  ['07', 'Post-action verification', ['REVERSAL_VERIFIED']],
  ['08', 'Audit and write-back', ['WRITEBACK_SENT', 'WRITEBACK_SKIPPED', 'HUMAN_REVIEW_COMPLETED']],
] as const;

const title = (event: string) => event.replaceAll('_', ' ').toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
const statusFor = (events: ActivityEvent[], caseData?: { status?: string }): FlowStatus => {
  const persistedStatus = caseData?.status;
  if (persistedStatus === 'CLOSED' || persistedStatus === 'RESOLVED' || persistedStatus === 'WRITTEN_BACK') return 'COMPLETED';
  if (persistedStatus === 'PENDING_HUMAN') return 'ESCALATED';
  if (persistedStatus === 'FAILED') return 'FAILED';
  if (persistedStatus === 'WAITING' || persistedStatus === 'STATUS_REQUERY') return 'WAITING';

  const names = events.map((event) => event.event);
  if (names.includes('HUMAN_REVIEW_COMPLETED')) return 'COMPLETED';
  if (names.includes('REVERSAL_VERIFIED') || names.includes('WRITEBACK_SENT')) return 'COMPLETED';
  if (names.includes('STATUS_QUERY_SCHEDULED') && !names.includes('STATUS_QUERY_COMPLETED')) return 'WAITING';
  const latestTransition = events.find((event) => event.event === 'STATUS_TRANSITION')?.payload?.to;
  if (latestTransition === 'PENDING_HUMAN') return 'ESCALATED';
  if (latestTransition === 'FAILED') return 'FAILED';
  if (latestTransition === 'WAITING' || latestTransition === 'STATUS_REQUERY') return 'WAITING';
  if (names.some((name) => name.includes('FAILED'))) return 'FAILED';
  return 'RUNNING';
};

function Tone({ status }: { status: FlowStatus }) {
  const style = status === 'COMPLETED' ? 'border-[var(--eri-moss)] text-[var(--eri-moss)]' : status === 'WAITING' ? 'border-[var(--eri-ochre)] text-[var(--eri-ochre)]' : status === 'FAILED' || status === 'ESCALATED' ? 'border-[var(--eri-clay)] text-[var(--eri-clay)]' : 'border-[var(--eri-indigo-500)] text-[var(--eri-indigo-600)]';
  return <span className={`inline-flex items-center gap-2 border px-2 py-1 text-[11px] font-semibold uppercase tracking-[.08em] ${style}`}><span className="state-dot bg-current" />{status}</span>;
}

function Inspector({ caseId, events, onClose }: { caseId: string; events: ActivityEvent[]; onClose: () => void }) {
  const [caseData, setCaseData] = useState<any>(null);
  const [evidence, setEvidence] = useState<any>(null);
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void Promise.all([EriClient.getCase(caseId), EriClient.getCaseEvidence(caseId), EriClient.getCaseAudit(caseId)])
      .then(([nextCase, nextEvidence, nextAudit]) => {
        if (!active) return;
        setCaseData(nextCase);
        setEvidence(nextEvidence);
        setAudit(nextAudit);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : 'Unable to load the execution record.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [caseId]);
  const names = events.map((event) => event.event);
  return (
    <aside className="fixed inset-y-0 right-0 z-20 w-full max-w-2xl overflow-y-auto border-l border-[var(--eri-border)] bg-[var(--eri-paper)] p-5 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between gap-5 border-b border-[var(--eri-border)] pb-5"><div><div className="eyebrow">Automation instance</div><h2 className="display mt-2 text-3xl">{caseData?.transaction_ref || caseId}</h2><div className="mt-3"><Tone status={statusFor(events)} /></div></div><button onClick={onClose} className="focus-ring p-2 text-[var(--eri-muted)] hover:text-[var(--eri-ink)]" aria-label="Close inspector"><X size={20} /></button></div>
      {loading && <div className="mt-5 border border-[var(--eri-border)] bg-[var(--eri-surface)] p-4 text-sm text-[var(--eri-muted)]">Loading case, evidence, and audit records...</div>}
      {error && <div role="alert" className="mt-5 border border-[var(--eri-clay)] bg-[var(--eri-surface)] p-4 text-sm text-[var(--eri-clay)]">Unable to load this execution: {error}</div>}
      <section className="mt-7 space-y-3">
        {stageDefinitions.map(([number, label, eventNames], index) => {
          const matching = events.filter((event) => eventNames.includes(event.event as never));
          const completed = matching.length > 0;
          const active = !completed && index === Math.min(events.length, stageDefinitions.length - 1);
          return <div key={number} className={`panel flex gap-4 p-4 ${completed ? 'border-l-4 border-l-[var(--eri-moss)]' : active ? 'border-l-4 border-l-[var(--eri-ochre)]' : ''}`}><div className="mono w-7 text-xs text-[var(--eri-muted)]">{number}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{label}</h3><span className={`text-[11px] font-semibold uppercase ${completed ? 'text-[var(--eri-moss)]' : active ? 'text-[var(--eri-ochre)]' : 'text-[var(--eri-muted)]'}`}>{completed ? 'Completed' : active ? 'Waiting' : 'Not started'}</span></div>{matching.length > 0 && <div className="mt-3 space-y-2">{matching.map((event) => <div key={`${event.event}-${event.at}`} className="flex justify-between gap-3 text-xs text-[var(--eri-muted)]"><span>{title(event.event)}</span><span className="mono">{new Date(event.at).toLocaleTimeString()}</span></div>)}</div>}</div></div>;
        })}
      </section>
      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="panel p-4"><div className="eyebrow">Case state</div><div className="mono mt-3 text-sm">{caseData?.derived_state || 'Unavailable'}</div><div className="mt-2 text-xs text-[var(--eri-muted)]">Source: persisted case record</div></div>
        <div className="panel p-4"><div className="eyebrow">Evidence records</div><div className="mono mt-3 text-sm">{evidence?.evidence?.length ?? 'Unavailable'}</div><div className="mt-2 text-xs text-[var(--eri-muted)]">Raw source snapshots available</div></div>
      </section>
      <section className="mt-3 bg-[var(--eri-deep)] p-5 text-[var(--eri-paper)]"><div className="eyebrow !text-[var(--eri-indigo-200)]">Determination</div><p className="display mt-3 text-xl leading-8">{caseData?.derived_state ? `Ẹrí classified this execution as ${String(caseData.derived_state).replaceAll('_', ' ').toLowerCase()}.` : 'Determination unavailable until the case record is loaded.'}</p><div className="mt-4 border-t border-white/15 pt-4 text-xs text-white/60">AI may assist with interpretation. Policy and evidence govern action.</div></section>
      <section className="mt-6 panel p-4"><div className="flex items-center justify-between"><div className="eyebrow">Audit integrity</div>{audit?.verification?.valid ? <CheckCircle2 size={17} className="text-[var(--eri-moss)]" /> : <ShieldAlert size={17} className="text-[var(--eri-ochre)]" />}</div><div className="mono mt-3 text-xs text-[var(--eri-muted)]">{audit?.audit_trail?.length ?? names.length} persisted events · {audit?.verification?.valid === true ? 'chain verified' : 'verification unavailable'}</div></section>
      <Link to={`/cases/${caseId}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--eri-indigo-600)]">Open full case <ArrowUpRight size={15} /></Link>
    </aside>
  );
}

export function AutomationFlow() {
  const location = useLocation();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | FlowStatus>('ALL');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;
    void EriClient.getCases().then((response) => { if (active) setCases(Array.isArray(response) ? response : response.cases || []); });
    const close = EriClient.getActivity((next) => { if (!active) return; setConnected(true); setEvents((current) => { const merged = [...current, ...next.map((event) => ({ ...event, payload: event.payload || {} }))]; const unique = new Map(merged.map((event) => [`${event.case_id}-${event.event}-${event.at}`, event])); return [...unique.values()].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 250); }); }, () => setConnected(false));
    return () => { active = false; close(); };
  }, [location.key]);

  const groups = useMemo(() => {
    const grouped = new Map<string, ActivityEvent[]>();
    events.forEach((event) => grouped.set(event.case_id, [...(grouped.get(event.case_id) || []), event]));
    cases.forEach((item) => { if (!grouped.has(item.id)) grouped.set(item.id, []); });
    return [...grouped.entries()].map(([caseId, caseEvents]) => {
      const caseData = cases.find((item) => item.id === caseId);
      return { caseId, events: caseEvents, caseData, status: statusFor(caseEvents, caseData) };
    });
  }, [events, cases]);

  const visible = groups.filter((item) => {
    const reference = item.caseData?.transaction_ref || item.caseId;
    return (filter === 'ALL' || item.status === filter) && reference.toLowerCase().includes(query.toLowerCase());
  });
  const counts = { tracked: groups.length, running: groups.filter((item) => item.status === 'RUNNING').length, waiting: groups.filter((item) => item.status === 'WAITING').length, escalated: groups.filter((item) => item.status === 'ESCALATED').length, completed: groups.filter((item) => item.status === 'COMPLETED').length };

  return <div className="space-y-8">
    <section className="flex flex-col justify-between gap-5 border-b border-[var(--eri-border)] pb-7 md:flex-row md:items-end"><div><div className="eyebrow flex items-center gap-3"><span className={`state-dot ${connected ? 'bg-[var(--eri-moss)]' : 'bg-[var(--eri-ochre)]'}`} />{connected ? 'Sentinel activity stream connected' : 'Sentinel activity stream unavailable'}</div><h1 className="display mt-3 text-4xl tracking-[-0.04em]">Automation Flow</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--eri-muted)]">Observe how Ẹrí detects, investigates, and resolves transactions autonomously.</p></div><div className="flex items-center gap-2 text-xs text-[var(--eri-muted)]"><Radio size={15} className={connected ? 'text-[var(--eri-moss)]' : 'text-[var(--eri-ochre)]'} /> Persisted audit activity</div></section>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[['Tracked', counts.tracked, ''], ['Running', counts.running, ''], ['Completed', counts.completed, 'moss'], ['Waiting', counts.waiting, 'ochre'], ['Escalated', counts.escalated, 'clay']].map(([label, value, tone]) => <div key={String(label)} className="panel p-[18px]"><div className="eyebrow">{label}</div><div className={`mono mt-4 text-3xl ${tone === 'moss' ? 'text-[var(--eri-moss)]' : tone === 'ochre' ? 'text-[var(--eri-ochre)]' : tone === 'clay' ? 'text-[var(--eri-clay)]' : ''}`}>{value}</div><div className="mt-2 text-xs text-[var(--eri-muted)]">{label === 'Tracked' ? 'Persisted cases observed' : label === 'Running' ? 'Current processing' : label === 'Completed' ? 'Verified or written back' : label === 'Waiting' ? 'Awaiting reliable evidence' : 'Requires officer review'}</div></div>)}</section>
    <section className="panel overflow-hidden"><div className="flex flex-col justify-between gap-4 border-b border-[var(--eri-border)] p-[18px] lg:flex-row lg:items-center"><div><div className="eyebrow">Live automation activity</div><h2 className="display mt-1 text-xl">Execution instances</h2></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search size={15} className="absolute left-3 top-3 text-[var(--eri-muted)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transaction" className="focus-ring h-10 border border-[var(--eri-border)] bg-[var(--eri-paper)] pl-9 pr-3 text-sm outline-none" /></label><select value={filter} onChange={(event) => setFilter(event.target.value as 'ALL' | FlowStatus)} className="focus-ring h-10 border border-[var(--eri-border)] bg-[var(--eri-paper)] px-3 text-sm outline-none"><option value="ALL">All executions</option><option value="RUNNING">Running</option><option value="COMPLETED">Completed</option><option value="WAITING">Waiting</option><option value="ESCALATED">Escalated</option><option value="FAILED">Failed</option></select></div></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-[var(--eri-border)] text-[11px] uppercase tracking-[.12em] text-[var(--eri-muted)]"><th className="px-[18px] py-3">Transaction</th><th className="px-3 py-3">Current step</th><th className="px-3 py-3">State</th><th className="px-3 py-3">Last update</th><th className="px-[18px] py-3 text-right">Result</th></tr></thead><tbody>{visible.map((item) => { const latest = item.events[0]; const reference = item.caseData?.transaction_ref || item.caseId; return <tr key={item.caseId} onClick={() => setSelected(item.caseId)} className="cursor-pointer border-b border-[var(--eri-border)] last:border-0 hover:bg-[var(--eri-paper)]"><td className="px-[18px] py-4"><div className="mono text-sm text-[var(--eri-indigo-600)]">{reference}</div><div className="mt-1 text-xs text-[var(--eri-muted)]">{item.caseData?.channel || 'Persisted case'}</div></td><td className="px-3 py-4 text-sm">{latest ? title(latest.event) : 'Awaiting activity'}</td><td className="px-3 py-4"><Tone status={item.status} /></td><td className="mono px-3 py-4 text-xs text-[var(--eri-muted)]">{latest ? new Date(latest.at).toLocaleTimeString() : 'Unavailable'}</td><td className="px-[18px] py-4 text-right text-sm">{item.caseData?.derived_state ? item.caseData.derived_state.replaceAll('_', ' ') : 'Inspect record'} <ArrowUpRight className="ml-1 inline" size={14} /></td></tr>; })}{visible.length === 0 && <tr><td colSpan={5} className="px-[18px] py-12 text-center text-sm text-[var(--eri-muted)]">No executions match this filter.</td></tr>}</tbody></table></div></section>
    <div className="grid gap-3 md:grid-cols-3"><div className="panel flex gap-3 p-[18px]"><GitBranch size={18} className="text-[var(--eri-indigo-600)]" /><span className="text-xs leading-5 text-[var(--eri-muted)]">Stages are derived from persisted audit events, not frontend timers.</span></div><div className="panel flex gap-3 p-[18px]"><Clock3 size={18} className="text-[var(--eri-ochre)]" /><span className="text-xs leading-5 text-[var(--eri-muted)]">Waiting means evidence is incomplete. It is never rendered as failure.</span></div><div className="panel flex gap-3 p-[18px]"><Activity size={18} className="text-[var(--eri-moss)]" /><span className="text-xs leading-5 text-[var(--eri-muted)]">The dashboard observes the agent and is not required for processing.</span></div></div>
    {selected && <Inspector caseId={selected} events={events.filter((event) => event.case_id === selected)} onClose={() => setSelected(null)} />}
  </div>;
}
