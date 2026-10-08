import React from 'react';
import { ArrowRight, Check, Database, FileCheck2, GitBranch, LockKeyhole, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Landing() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="min-h-screen overflow-hidden bg-[var(--eri-paper)]">
      <header className="border-b border-[var(--eri-border)]">
        <div className="mx-auto flex min-h-[76px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="display text-[28px] font-semibold tracking-[-0.04em] text-[var(--eri-indigo-700)]">Ẹrí</Link>
          <nav className="hidden items-center gap-7 text-sm text-[var(--eri-muted)] md:flex">
            <a href="#product" className="hover:text-[var(--eri-ink)]">Product</a>
            <a href="#method" className="hover:text-[var(--eri-ink)]">How it works</a>
            <a href="#infrastructure" className="hover:text-[var(--eri-ink)]">Infrastructure</a>
            <a href="#safety" className="hover:text-[var(--eri-ink)]">Safety</a>
          </nav>
          <div className="hidden items-center gap-5 md:flex">
            <Link to="/dashboard" className="text-sm text-[var(--eri-muted)] hover:text-[var(--eri-ink)]">Open console</Link>
            <Link to="/dashboard" className="focus-ring inline-flex items-center gap-2 bg-[var(--eri-indigo-700)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--eri-indigo-600)]">Explore the demo <ArrowRight size={15} /></Link>
          </div>
          <button aria-label="Toggle navigation" onClick={() => setOpen(!open)} className="p-2 md:hidden">{open ? <X /> : <Menu />}</button>
        </div>
        {open && <nav className="flex flex-col gap-4 border-t border-[var(--eri-border)] px-5 py-5 text-sm md:hidden"><a href="#product" onClick={() => setOpen(false)}>Product</a><a href="#method" onClick={() => setOpen(false)}>How it works</a><Link to="/dashboard">Open console</Link></nav>}
      </header>

      <main>
        <section id="product" className="mx-auto grid max-w-[1280px] gap-14 px-5 pb-24 pt-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-20 lg:pb-32 lg:pt-28">
          <div>
            <div className="eyebrow flex items-center gap-3"><span className="h-px w-8 bg-[var(--eri-indigo-600)]" /> Evidence-first resolution infrastructure</div>
            <h1 className="display mt-7 max-w-3xl text-5xl leading-[1.06] tracking-[-0.055em] text-[var(--eri-ink)] sm:text-6xl lg:text-[76px]">From transaction evidence to resolution.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--eri-muted)]">Ẹrí monitors instant-transfer disputes, reconstructs what happened across banking systems, and resolves confirmed failures before the customer needs to complain.</p>
            <div className="mt-9 flex flex-wrap items-center gap-5"><Link to="/dashboard" className="focus-ring inline-flex items-center gap-3 bg-[var(--eri-indigo-700)] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[var(--eri-indigo-600)]">Explore the demo <ArrowRight size={16} /></Link><a href="#method" className="text-sm font-semibold text-[var(--eri-indigo-600)] hover:underline">See how it works</a></div>
            <p className="mt-8 text-xs text-[var(--eri-muted)]">Built for bank operations teams. Designed to sit on top of existing infrastructure.</p>
          </div>
          <div className="relative">
            <div className="panel overflow-hidden bg-[var(--eri-deep)] text-[var(--eri-paper)]">
              <div className="flex items-center justify-between border-b border-white/10 px-[18px] py-4"><span className="eyebrow !text-[var(--eri-indigo-200)]">Live reconstruction</span><span className="mono text-[11px] text-[var(--eri-moss-on-dark)]">CASE 8F2A · 2.9s</span></div>
              <div className="space-y-6 p-6">
                <div><div className="text-xs text-[var(--eri-indigo-200)]">TRANSACTION STATE</div><div className="display mt-2 text-3xl">Failed, not reversed</div></div>
                <div className="space-y-3">
                  {['Core banking · debit successful', 'Switch · message submitted', 'Beneficiary · no acknowledgement', 'Settlement · unconfirmed'].map((item, i) => <div key={item} className={`flex items-center justify-between border-l-2 py-2 pl-3 text-sm ${i > 1 ? 'border-[var(--eri-clay-on-dark)] text-[var(--eri-clay-on-dark)]' : 'border-[var(--eri-moss-on-dark)]'}`}><span>{item}</span><span className="mono text-[11px] text-white/45">{i < 2 ? `14:22:0${6 + i}` : ''}</span></div>)}
                </div>
                <div className="border-t border-white/15 pt-5"><div className="eyebrow !text-[var(--eri-indigo-200)]">Finding</div><p className="display mt-2 text-xl leading-8">The beneficiary institution never acknowledged the credit.</p></div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden border border-[var(--eri-border)] bg-[var(--eri-surface)] px-4 py-3 text-xs text-[var(--eri-muted)] sm:block"><span className="mono text-[var(--eri-moss)]">✓</span> Evidence chain verified</div>
          </div>
        </section>

        <section id="method" className="border-y border-[var(--eri-border)] bg-white">
          <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 lg:py-24"><div className="max-w-2xl"><div className="eyebrow">A different kind of dispute system</div><h2 className="display mt-4 text-4xl tracking-[-0.04em] sm:text-5xl">Not a ticket queue. A chain of evidence.</h2></div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {[{icon: Database, n: '01', title: 'Gather the record', body: 'Connect to the ledger, payment switch, settlement and reconciliation systems already in your bank.'}, {icon: GitBranch, n: '02', title: 'Reconstruct the event', body: 'Eri places independent records on one timeline and calls out gaps, conflicts and missing acknowledgements.'}, {icon: FileCheck2, n: '03', title: 'Resolve with control', body: 'Versioned policy determines whether to act, wait or escalate. Every action is idempotent and verified.'}].map(({ icon: Icon, n, title, body }) => <div key={n} className="border-t-2 border-[var(--eri-indigo-700)] pt-5"><div className="flex items-center justify-between"><Icon size={20} className="text-[var(--eri-indigo-600)]" /><span className="mono text-xs text-[var(--eri-muted)]">{n}</span></div><h3 className="display mt-8 text-2xl">{title}</h3><p className="mt-3 text-sm leading-6 text-[var(--eri-muted)]">{body}</p></div>)}
            </div>
          </div>
        </section>

        <section id="infrastructure" className="mx-auto grid max-w-[1280px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:py-28">
          <div><div className="eyebrow">Works with what you have</div><h2 className="display mt-4 text-4xl tracking-[-0.04em] sm:text-5xl">A control layer, not a replacement.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[var(--eri-muted)]">Ẹrí connects to existing bank services through explicit adapters. It adds a deterministic reasoning and execution layer without asking operations teams to replace their core systems.</p></div>
          <div className="grid gap-3 sm:grid-cols-2"><div className="panel p-5"><div className="mono text-xs text-[var(--eri-indigo-600)]">INPUTS</div><div className="mt-5 space-y-3 text-sm"><div>Core banking ledger</div><div>Payment switch</div><div>Settlement and recon</div><div>Customer dispute system</div></div></div><div className="bg-[var(--eri-deep)] p-5 text-white"><div className="mono text-xs text-[var(--eri-indigo-200)]">OUTPUTS</div><div className="mt-5 space-y-3 text-sm"><div>Verified determination</div><div>Policy-controlled action</div><div>Hash-chained audit</div><div>Human review pack</div></div></div></div>
        </section>

        <section id="safety" className="bg-[var(--eri-deep)] text-[var(--eri-paper)]"><div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-10 px-5 py-20 sm:px-8 lg:flex-row lg:items-end lg:py-24"><div className="max-w-2xl"><div className="eyebrow !text-[var(--eri-indigo-200)]">The governing principle</div><h2 className="display mt-4 text-4xl tracking-[-0.04em] sm:text-5xl">Unknown is not failed.</h2><p className="mt-5 text-sm leading-7 text-white/65">AI can help read language and summarise evidence. It cannot establish financial truth, choose a reversal, or move money. Those decisions remain deterministic, inspectable and policy-governed.</p></div><div className="flex gap-3 text-sm text-white/75"><LockKeyhole size={18} className="mt-0.5 text-[var(--eri-moss-on-dark)]" /><span>Append-only audit<br />Idempotent actions<br />Evidence before execution</span></div></div></section>
      </main>
      <footer className="mx-auto flex max-w-[1280px] flex-col justify-between gap-4 px-5 py-8 text-xs text-[var(--eri-muted)] sm:flex-row sm:px-8"><span className="display text-lg text-[var(--eri-indigo-700)]">Ẹrí</span><span className="flex items-center gap-1"><Check size={14} /> Evidence-first transaction operations</span><span>Simulation environment · not for live banking</span></footer>
    </div>
  );
}
