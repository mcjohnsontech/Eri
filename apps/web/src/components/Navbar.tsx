import React from 'react';
import { Activity, ArrowUpRight, FileText, LayoutDashboard, ListTodo } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/review-queue', label: 'Review queue', icon: ListTodo },
  { to: '/policies', label: 'Policies', icon: FileText },
];

export function Navbar() {
  return (
    <header className="border-b border-[var(--eri-border)] bg-[var(--eri-paper)]">
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-8">
          <Link to="/" className="display text-[25px] font-semibold tracking-[-0.03em] text-[var(--eri-indigo-700)]">Ẹrí</Link>
          <span className="hidden h-5 w-px bg-[var(--eri-border)] md:block" />
          <span className="hidden text-sm text-[var(--eri-muted)] md:block">Dispute operations</span>
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `focus-ring inline-flex items-center gap-2 border-b-2 px-3 py-5 text-sm ${isActive
                    ? 'border-[var(--eri-indigo-600)] text-[var(--eri-indigo-700)]'
                    : 'border-transparent text-[var(--eri-muted)] hover:text-[var(--eri-ink)]'}`
                }
              >
                <Icon size={15} strokeWidth={1.8} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="hidden items-center gap-1 text-[var(--eri-muted)] hover:text-[var(--eri-ink)] sm:flex">
            Product <ArrowUpRight size={14} />
          </Link>
          <span className="hidden h-5 w-px bg-[var(--eri-border)] sm:block" />
          <span className="flex items-center gap-2 text-[var(--eri-muted)]">
            <Activity size={15} className="text-[var(--eri-moss)]" />
            <span className="hidden sm:inline">System active</span>
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--eri-indigo-700)] text-xs font-semibold text-white">AO</span>
        </div>
      </div>
    </header>
  );
}
