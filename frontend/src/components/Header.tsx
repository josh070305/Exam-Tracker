import React from 'react';
import { relativeTime } from '../types';

interface HeaderProps {
  tab: 'feed' | 'kb' | 'console' | 'telegram' | 'prefs';
  setTab: (tab: 'feed' | 'kb' | 'console' | 'telegram' | 'prefs') => void;
  checking: boolean;
  onCheckNow: () => void;
  onSeedDemo: () => void;
  seeding: boolean;
  lastSynced: string | null;
  sseConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  tab,
  setTab,
  checking,
  onCheckNow,
  onSeedDemo,
  seeding,
  lastSynced,
  sseConnected,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-800/80 text-zinc-100 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center text-white font-black text-sm shadow-[0_0_15px_rgba(99,102,241,0.35)] ring-1 ring-white/20">
            🎯
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-sm sm:text-base text-zinc-100">
                GovExam
              </span>
              <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                AI Agent v2
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 hidden sm:block font-medium">
              Autonomous multi-portal intelligence system
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live SSE Stream Pulse */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium">
            <span
              className={`h-2 w-2 rounded-full ${
                sseConnected ? 'bg-emerald-400 live-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-zinc-300 text-[11px] font-semibold">
              {sseConnected ? 'Real-time' : 'Reconnecting'}
            </span>
            {lastSynced && (
              <span className="text-zinc-500 border-l border-zinc-800 pl-2 hidden md:inline text-[11px]">
                {relativeTime(lastSynced)}
              </span>
            )}
          </div>

          {/* Seed Demo Button */}
          <button
            onClick={onSeedDemo}
            disabled={seeding}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
            title="Populate realistic Indian exam updates across SSC, RRB, UPSC, TNPSC"
          >
            <span>{seeding ? '⏳' : '🌱'}</span>
            <span>{seeding ? 'Seeding...' : 'Load Demo Data'}</span>
          </button>

          {/* Run Scan Button */}
          <button
            onClick={onCheckNow}
            disabled={checking}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] active:scale-95 transition disabled:opacity-50"
          >
            {checking ? (
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <span>⚡</span>
            )}
            <span>{checking ? 'Scanning...' : 'Scan Portals'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 sm:gap-2 border-t border-zinc-800/60 pt-0.5 overflow-x-auto">
        {[
          { id: 'feed', label: 'Activity Feed', icon: '⚡' },
          { id: 'kb', label: 'Knowledge Base', icon: '📚' },
          { id: 'console', label: 'Agent Console', icon: '🤖' },
          { id: 'telegram', label: 'Telegram Bot', icon: '💬' },
          { id: 'prefs', label: 'Settings', icon: '⚙️' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition duration-150 whitespace-nowrap ${
              tab === t.id
                ? 'border-indigo-500 text-zinc-100 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
