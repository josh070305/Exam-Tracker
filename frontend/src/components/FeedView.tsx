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
      {/* Sleek Minimalist Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Updates</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{stats?.total ?? 0}</div>
          </div>
          <span className="text-2xl p-2 rounded-lg bg-indigo-50 text-indigo-600">⚡</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Portals</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {sources.filter((s) => s.lastCheckedAt).length || SOURCES.length}
            </div>
          </div>
          <span className="text-2xl p-2 rounded-lg bg-emerald-50 text-emerald-600">🏛️</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Knowledge Base</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{examsCount}</div>
          </div>
          <span className="text-2xl p-2 rounded-lg bg-violet-50 text-violet-600">📚</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Corrigendums</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {stats?.byType?.corrigendum ?? 0}
            </div>
          </div>
          <span className="text-2xl p-2 rounded-lg bg-amber-50 text-amber-600">⚠️</span>
        </div>
      </div>

      {/* Control Bar: Search & Filter Chips */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by exam name, keyword, or board (e.g. CGL, UPSC, admit card)..."
              className="w-full text-xs sm:text-sm border border-slate-200 rounded-xl px-4 py-2.5 pl-9 bg-slate-50/50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
            <span className="absolute left-3 top-3 text-slate-400 text-xs">🔍</span>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="text-xs font-medium text-slate-400 whitespace-nowrap">
            Showing <strong className="text-slate-700">{filtered.length}</strong> of {changes.length} updates
          </div>
        </div>

        {/* Board & Type Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">Board:</span>
          {['all', ...SOURCES].map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                sourceFilter === s
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'all' ? 'All Boards' : s}
            </button>
          ))}

          <span className="mx-2 h-4 w-px bg-slate-200 hidden sm:inline-block" />

          <span className="text-[11px] font-bold uppercase text-slate-400 mr-1 hidden sm:inline-block">
            Category:
          </span>
          {[{ key: 'all', label: 'All' }, ...TYPES].map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                typeFilter === t.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* High-Readability Linear-Style Row List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-sm font-medium">Fetching real-time updates...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="text-4xl">📭</div>
            <h3 className="text-base font-bold text-slate-800">No Exam Notices Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {changes.length === 0
                ? 'Your local database has no records yet. Click below to load realistic demo exam notices.'
                : 'No notifications matched your active filter or search keywords.'}
            </p>
            {changes.length === 0 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={onSeedDemo}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  🌱 Load Indian Govt Exam Data
                </button>
                <button
                  onClick={onCheckNow}
                  disabled={checking}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  ⚡ Scan Portals Now
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((c) => {
              const typeConfig = TYPE_MAP[c.changeType] ?? TYPES[0];

              return (
                <div
                  key={c._id}
                  onClick={() => onInspect(c)}
                  className="p-4 sm:p-5 hover:bg-slate-50/90 transition duration-150 cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Board Chip, Title, Summary */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 font-extrabold text-[11px] text-slate-800 tracking-wide">
                        {c.source}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${typeConfig.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${typeConfig.dot}`} />
                        {typeConfig.label}
                      </span>
                      {c.examName && (
                        <span className="text-xs font-bold text-slate-700 truncate">
                          {c.examName}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium">
                        • {relativeTime(c.detectedAt)}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                      {c.summary}
                    </p>

                    {/* Before -> After Diff Pill */}
                    {(c.oldValue || c.newValue) && (
                      <div className="inline-flex items-center gap-2 text-xs font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        <span className="text-slate-400 text-[11px] uppercase font-bold">
                          {c.changedField ?? 'Diff'}:
                        </span>
                        <span className="text-rose-500 line-through">
                          {c.oldValue ?? 'None'}
                        </span>
                        <span className="text-slate-400 font-bold">➔</span>
                        <span className="text-emerald-700 font-bold">
                          {c.newValue ?? 'Updated'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: PDF Link & Inspect Arrow */}
                  <div className="flex items-center gap-3 self-start md:self-center shrink-0">
                    {c.pdfUrl && (
                      <a
                        href={c.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                      >
                        <span>📄 PDF</span>
                      </a>
                    )}
                    {c.effectiveDate && (
                      <span className="text-xs text-slate-500 hidden lg:inline font-medium">
                        📅 {formatDate(c.effectiveDate)}
                      </span>
                    )}
                    <span className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition duration-150 text-sm font-bold">
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
