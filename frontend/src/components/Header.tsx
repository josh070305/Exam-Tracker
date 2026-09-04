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
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 ring-2 ring-white/10">
            <span className="text-xl">🎯</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                GovExam Tracker
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Agentic v2
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Autonomous multi-board intelligence & alert system
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* SSE Live Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300 font-medium">
              {sseConnected ? 'Live Stream' : 'Polling'}
            </span>
            {lastSynced && (
              <span className="text-slate-500 border-l border-slate-700 pl-2 hidden md:inline">
                Synced {relativeTime(lastSynced)}
              </span>
            )}
          </div>

          {/* Seed Demo Data Button */}
          <button
            onClick={onSeedDemo}
            disabled={seeding}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold shadow transition duration-150 disabled:opacity-50"
            title="Populate realistic Indian exam updates across SSC, RRB, UPSC, TNPSC"
          >
            <span>{seeding ? '⏳' : '🌱'}</span>
            <span>{seeding ? 'Seeding...' : 'Demo Data'}</span>
          </button>

          {/* Trigger Scan Button */}
          <button
            onClick={onCheckNow}
            disabled={checking}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-60 transition duration-150"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 sm:gap-2 border-t border-slate-800/80 pt-1 overflow-x-auto">
        {[
          { id: 'feed', label: 'Feed & Analytics', icon: '📢' },
          { id: 'kb', label: 'Knowledge Base', icon: '📚' },
          { id: 'console', label: 'Agent Console', icon: '🤖' },
          { id: 'telegram', label: 'Telegram Simulator', icon: '💬' },
          { id: 'prefs', label: 'Alert Settings', icon: '⚙️' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all duration-150 whitespace-nowrap ${
              tab === t.id
                ? 'border-indigo-500 text-white bg-slate-800/60 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
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
