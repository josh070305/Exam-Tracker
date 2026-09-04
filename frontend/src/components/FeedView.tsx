import React from 'react';
import { ExamChange, Stats, SourceInfo, SOURCES, TYPES, TYPE_MAP, relativeTime, formatDate } from '../types';

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
    <div className="space-y-6 max-w-6xl mx-auto animate-fade">
      {/* Sleek Top Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-4 shadow-sm backdrop-blur-md">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Total Updates</div>
          <div className="text-2xl font-black text-zinc-100 mt-1">{stats?.total ?? 0}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5 font-medium">All-time tracked</div>
        </div>

        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-4 shadow-sm backdrop-blur-md">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Portals Monitored</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 flex items-center gap-2">
            <span>{sources.filter((s) => s.lastCheckedAt).length || SOURCES.length}</span>
            <span className="text-xs font-semibold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
              Live
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5 font-medium">SSC, RRB, UPSC, etc.</div>
        </div>

        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-4 shadow-sm backdrop-blur-md">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Knowledge Base</div>
          <div className="text-2xl font-black text-violet-400 mt-1">{examsCount}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5 font-medium">Versioned exams</div>
        </div>

        <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-4 shadow-sm backdrop-blur-md">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Corrigenda</div>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {stats?.byType?.corrigendum ?? 0}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5 font-medium">Official rule corrections</div>
        </div>
      </div>

      {/* Modern Filter & Search Bar */}
      <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 p-4 space-y-3.5 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Search Input with ⌘K badge */}
          <div className="relative flex-1 min-w-[260px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exam name, notice summary, or keyword..."
              className="w-full text-xs sm:text-sm border border-zinc-800 rounded-xl px-4 py-2.5 pl-9 bg-zinc-950/70 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
            />
            <span className="absolute left-3 top-3 text-zinc-500 text-xs">🔍</span>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-xs text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            )}
          </div>

          <div className="text-xs text-zinc-400 font-mono">
            Showing <span className="text-zinc-200 font-bold">{filtered.length}</span> / {changes.length} updates
          </div>
        </div>

        {/* Board & Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/60">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mr-1">Board:</span>
          {['all', ...SOURCES].map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono transition ${
                sourceFilter === s
                  ? 'bg-zinc-100 text-zinc-900 shadow'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {s === 'all' ? 'All Boards' : s}
            </button>
          ))}

          <span className="mx-2 h-4 w-px bg-zinc-800 hidden sm:inline-block" />

          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mr-1 hidden sm:inline-block">
            Type:
          </span>
          {[{ key: 'all', label: 'All' }, ...TYPES].map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                typeFilter === t.key
                  ? 'bg-indigo-600 text-white font-semibold shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Linear-Style Unified Feed Table */}
      <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 shadow-2xl backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-zinc-500 flex items-center justify-center gap-2 font-mono text-xs">
            <svg className="animate-spin h-4 w-4 text-indigo-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span>Connecting to live portal streams...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="text-4xl">📭</div>
            <h3 className="text-base font-bold text-zinc-200">No Exam Notices Recorded</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {changes.length === 0
                ? 'Your local database is fresh. Click below to load realistic Indian government exam notices, or scan live portals.'
                : 'No notifications matched your active filter or search keywords.'}
            </p>
            {changes.length === 0 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={onSeedDemo}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold rounded-xl border border-zinc-700 shadow-sm transition"
                >
                  🌱 Load Demo Notices
                </button>
                <button
                  onClick={onCheckNow}
                  disabled={checking}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] transition"
                >
                  ⚡ Scan Portals Now
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {filtered.map((c) => {
              const typeConfig = TYPE_MAP[c.changeType] ?? TYPES[0];

              return (
                <div
                  key={c._id}
                  onClick={() => onInspect(c)}
                  className="p-4 sm:p-5 hover:bg-zinc-800/40 transition duration-150 cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Metadata & Summary */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] font-bold tracking-wide border border-zinc-700/60">
                        {c.source}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${typeConfig.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${typeConfig.dot}`} />
                        {typeConfig.label}
                      </span>
                      {c.examName && (
                        <span className="text-xs font-bold text-zinc-300 truncate">
                          {c.examName}
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-500 font-mono">
                        • {relativeTime(c.detectedAt)}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-zinc-100 group-hover:text-indigo-400 transition leading-snug">
                      {c.summary}
                    </p>

                    {/* Before -> After Diff Pill */}
                    {(c.oldValue || c.newValue) && (
                      <div className="inline-flex items-center gap-2 text-xs font-mono bg-zinc-950/60 px-2.5 py-1 rounded-lg border border-zinc-800">
                        <span className="text-zinc-500 text-[10px] uppercase font-bold">
                          {c.changedField ?? 'Delta'}:
                        </span>
                        <span className="text-rose-400/80 line-through">
                          {c.oldValue ?? 'None'}
                        </span>
                        <span className="text-zinc-500 font-bold">➔</span>
                        <span className="text-emerald-400 font-bold">
                          {c.newValue ?? 'Updated'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Actions: PDF link & Inspect */}
                  <div className="flex items-center gap-3 self-start md:self-center shrink-0">
                    {c.pdfUrl && (
                      <a
                        href={c.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition"
                      >
                        <span>📄 PDF</span>
                      </a>
                    )}
                    {c.effectiveDate && (
                      <span className="text-xs text-zinc-400 font-mono hidden lg:inline">
                        📅 {formatDate(c.effectiveDate)}
                      </span>
                    )}
                    <span className="text-zinc-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition duration-150 text-sm font-bold">
                      ➔
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
