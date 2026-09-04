import React from 'react';
import { ExamChange, Stats, SourceInfo, SOURCES, TYPES } from '../types';
import { StatCard } from './StatCard';
import { TypeChart } from './TypeChart';
import { SourceStatus } from './SourceStatus';
import { ChangeCard } from './ChangeCard';

interface FeedViewProps {
  changes: ExamChange[];
  stats: Stats | null;
  sources: SourceInfo[];
  examsCount: number;
  typeFilter: string;
  setTypeFilter: (t: string) => void;
  sourceFilter: string;
  setSourceFilter: (s: string) => void;
  search: string;
  setSearch: (s: string) => void;
  loading: boolean;
  checking: boolean;
  onCheckNow: () => void;
  onSeedDemo: () => void;
  onInspect: (change: ExamChange) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  changes,
  stats,
  sources,
  examsCount,
  typeFilter,
  setTypeFilter,
  sourceFilter,
  setSourceFilter,
  search,
  setSearch,
  loading,
  checking,
  onCheckNow,
  onSeedDemo,
  onInspect,
}) => {
  const filtered = changes.filter((c) => {
    if (typeFilter !== 'all' && c.changeType !== typeFilter) return false;
    if (sourceFilter !== 'all' && c.source !== sourceFilter) return false;
    if (
      search &&
      !`${c.summary} ${c.examName ?? ''} ${c.source}`.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Updates"
          value={stats?.total ?? 0}
          hint="All time detected changes"
          icon="⚡"
          accent="bg-indigo-500"
        />
        <StatCard
          label="Boards Active"
          value={sources.filter((s) => s.lastCheckedAt).length || SOURCES.length}
          hint="Live 24/7 web monitors"
          icon="🏛️"
          accent="bg-emerald-500"
        />
        <StatCard
          label="Exams in KB"
          value={examsCount}
          hint="Versioned knowledge base"
          icon="📚"
          accent="bg-violet-500"
        />
        <StatCard
          label="Corrigendums"
          value={stats?.byType?.corrigendum ?? 0}
          hint="Official revisions tracked"
          icon="⚠️"
          accent="bg-amber-500"
        />
      </div>

      {/* Main Grid: Feed on left (2 columns), Analytics on right (1 column) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>📢</span>
                <span>Government Exam Notifications Feed</span>
              </h2>
              <span className="text-xs font-medium text-slate-400">
                {filtered.length} update{filtered.length === 1 ? '' : 's'} matching active filters
              </span>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search exam, keyword, summary..."
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl px-3.5 py-2 pl-8 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-slate-50/50"
              />
              <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
            </div>
          </div>

          {/* Classification & Board Pill Filters */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
            {/* Type Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">Type:</span>
              {[{ key: 'all', label: 'All Types' }, ...TYPES].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTypeFilter(t.key)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    typeFilter === t.key
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Source Filter */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">Board:</span>
              {['all', ...SOURCES].map((s) => (
                <button
                  key={s}
                  onClick={() => setSourceFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    sourceFilter === s
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s === 'all' ? 'All Boards' : s}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Loading latest exam notifications...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
                <div className="text-4xl">🔔</div>
                <h3 className="text-base font-bold text-slate-800">No Exam Updates On Display</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {changes.length === 0
                    ? 'Your database is fresh. Click "Seed Demo Data" to load realistic Indian exam notices, or "Scan Portals" to run live scrapers.'
                    : 'No notifications matched your active filter or search keywords.'}
                </p>
                {changes.length === 0 && (
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      onClick={onSeedDemo}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition"
                    >
                      🌱 Seed Realistic Demo Data
                    </button>
                    <button
                      onClick={onCheckNow}
                      disabled={checking}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition"
                    >
                      ⚡ Scan Live Portals
                    </button>
                  </div>
                )}
              </div>
            ) : (
              filtered.map((c) => (
                <ChangeCard
                  key={c._id}
                  change={c}
                  onInspect={() => onInspect(c)}
                />
              ))
            )}
          </div>
        </section>

        {/* Right Aside: Breakdown & Board Health */}
        <aside className="space-y-6">
          <TypeChart stats={stats} total={stats?.total ?? 0} />
          <SourceStatus sources={sources} stats={stats} />
        </aside>
      </div>
    </div>
  );
};
