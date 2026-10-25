import React from 'react';
import { MoonStar, Search, Sparkles, SunMedium, Zap } from 'lucide-react';
import { relativeTime } from '../types';

interface HeaderProps {
  title: string;
  description: string;
  icon: React.ElementType;
  checking: boolean;
  onCheckNow: () => void;
  onSeedDemo: () => void;
  seeding: boolean;
  lastSynced: string | null;
  sseConnected: boolean;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  search: string;
  setSearch: (value: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  description,
  icon: Icon,
  checking,
  onCheckNow,
  onSeedDemo,
  seeding,
  lastSynced,
  sseConnected,
  theme,
  setTheme,
  search,
  setSearch,
}) => {
  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 md:px-6 xl:px-8">
        <div className="mr-auto hidden min-w-0 items-center gap-3 md:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-alt)] text-[var(--text)]">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-[var(--text)]">{title}</div>
            <div className="truncate text-[11px] text-[var(--muted)]">{description}</div>
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-center md:flex">
          <label className="relative block w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notices, boards, exam names..."
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] py-2.5 pl-10 pr-11 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[#E11D48] focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
              ⌘K
            </span>
          </label>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-2.5">
          <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text)]">
            <span className={`h-2 w-2 rounded-full ${sseConnected ? 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]' : 'bg-amber-400'}`} />
            {sseConnected ? 'Live' : 'Reconnecting'}
            {lastSynced && (
              <span className="hidden text-[var(--muted)] md:inline">{relativeTime(lastSynced)}</span>
            )}
          </div>

          <button
            type="button"
            onClick={onSeedDemo}
            disabled={seeding}
            className="hidden items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-xs font-medium text-[var(--text)] transition hover:border-[#E11D48]/50 md:inline-flex"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#E11D48]" />
            {seeding ? 'Loading...' : 'Demo data'}
          </button>

          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text)] transition hover:border-[#E11D48]/50"
            aria-label="Toggle theme"
          >
            {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onCheckNow}
            disabled={checking}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E11D48] to-[#F97316] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(225,29,72,0.18)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 md:px-4"
          >
            {checking ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Zap className="h-3.5 w-3.5" />}
            <span>{checking ? 'Scanning...' : 'Scan Portals'}</span>
          </button>
        </div>
      </div>

      <div className="mx-auto flex h-11 max-w-[1280px] items-center gap-2 border-t border-[var(--border)] px-4 md:hidden">
        <Search className="h-4 w-4 text-[var(--muted)]" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search..."
          className="w-full bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none"
        />
      </div>
    </header>
  );
};
