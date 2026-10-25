import React from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowRight, BellRing, BookOpenText, CalendarClock, FileText, Layers3, Search, Sparkles, TrendingUp } from 'lucide-react';
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

const activityData = [
  { name: 'M', value: 18 }, { name: 'T', value: 26 }, { name: 'W', value: 22 }, { name: 'T', value: 38 }, { name: 'F', value: 32 }, { name: 'S', value: 42 }, { name: 'S', value: 48 },
];

const boardColors: Record<string, string> = {
  SSC: 'bg-[#E11D48]/10 text-[#E11D48] border-[#E11D48]/30',
  RRB: 'bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/30',
  TNPSC: 'bg-[#059669]/10 text-[#059669] border-[#059669]/30',
  UPSC: 'bg-[#C026D3]/10 text-[#C026D3] border-[#C026D3]/30',
  IBPS: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30',
  SBI: 'bg-[#65A30D]/10 text-[#65A30D] border-[#65A30D]/30',
};

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
  loading,
  checking,
  onCheckNow,
  onSeedDemo,
  onInspect,
}) => {
  const totalToday = changes.filter((item) => {
    const detected = new Date(item.detectedAt).getTime();
    return Date.now() - detected < 24 * 60 * 60 * 1000;
  }).length;
  const liveSourceCount = sources.filter((source) => source.lastCheckedAt).length;
  const recentCorrigenda = changes.filter((item) => item.changeType === 'corrigendum').length;
  const filtered = changes.filter((c) => {
    if (typeFilter !== 'all' && c.changeType !== typeFilter) return false;
    if (sourceFilter !== 'all' && c.source !== sourceFilter) return false;
    if (search && !`${c.summary} ${c.examName ?? ''} ${c.source}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalLiveBoards = liveSourceCount || SOURCES.length;
  const deadlineCards = [
    { label: 'SSC CGL Tier II', date: '3d 14h', status: 'Closing soon', days: 3 },
    { label: 'IBPS PO Interview', date: '6d 08h', status: 'Ready', days: 6 },
    { label: 'UPSC CSE Prelims', date: '12d 01h', status: 'High importance', days: 12 },
  ];

  const getDeadlineTone = (days: number) => {
    if (days < 7) return 'border-red-500/30 bg-red-500/10 text-red-100';
    if (days < 14) return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
  };

  const cardBase = 'rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]';
  const statCards = [
    {
      label: 'Total updates',
      value: stats?.total ?? changes.length,
      detail: totalToday > 0 ? `${totalToday} today` : 'No recent alerts',
      trend: changes.length > 0 ? `${Math.min(100, Math.round((totalToday / Math.max(changes.length, 1)) * 100))}% recent` : undefined,
      tone: 'text-[#E11D48]',
      accent: 'from-[#FDE7EE] to-[#FCE7D6]',
      icon: Layers3,
    },
    {
      label: 'Portals monitored',
      value: totalLiveBoards,
      detail: `${liveSourceCount} live`,
      trend: liveSourceCount > 0 ? `${liveSourceCount}/${SOURCES.length} active` : undefined,
      tone: 'text-[#059669]',
      accent: 'from-[#EAFBF4] to-[#E9F5E5]',
      icon: BellRing,
    },
    {
      label: 'Knowledge base',
      value: examsCount,
      detail: examsCount > 0 ? 'Versioned exams' : 'No exams indexed',
      trend: examsCount > 0 ? `${examsCount} indexed` : undefined,
      tone: 'text-[#C026D3]',
      accent: 'from-[#FCE7F3] to-[#FDEFE6]',
      icon: BookOpenText,
    },
    {
      label: 'Corrigenda',
      value: stats?.byType?.corrigendum ?? recentCorrigenda,
      detail: recentCorrigenda > 0 ? 'Official corrections' : 'No recent notices',
      trend: recentCorrigenda > 0 ? `${recentCorrigenda} flagged` : undefined,
      tone: 'text-[#D97706]',
      accent: 'from-[#FFF3D9] to-[#FEEFD7]',
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, detail, trend, tone, accent, icon: Icon }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br ${accent} p-4 shadow-[var(--shadow-soft)]`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">{label}</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
                <Icon className={`h-4 w-4 ${tone}`} />
              </span>
            </div>
            <div className="mt-5 text-3xl font-semibold tracking-tight text-[var(--text)]">{value}</div>
            <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-[var(--muted)]">
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                {detail}
              </span>
              {trend && <span className="font-mono text-[10px] text-[var(--muted)]">{trend}</span>}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]">
        <div className="space-y-5">
          <div className={`${cardBase} p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--text)]">
                <Search className="h-4 w-4 text-[var(--muted)]" />
                Search & filters
              </div>
              <div className="text-[11px] text-[var(--muted)]">{filtered.length} of {changes.length} visible</div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {['all', ...SOURCES].map((item) => (
                <button
                  key={item}
                  onClick={() => setSourceFilter(item)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${sourceFilter === item ? 'border-[#E11D48] bg-[#E11D48] text-white shadow-[0_0_18px_rgba(225,29,72,0.18)]' : 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text)] hover:border-[#E11D48]/40'}`}
                >
                  {item === 'all' ? 'All boards' : item}
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {[{ key: 'all', label: 'All updates' }, ...TYPES].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setTypeFilter(item.key)}
                  className={`rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${typeFilter === item.key ? 'border-[#E11D48] bg-[#E11D48] text-white shadow-[0_0_18px_rgba(225,29,72,0.18)]' : 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text)] hover:border-[#E11D48]/40'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className={`${cardBase} overflow-hidden`}>
            {loading ? (
              <div className="space-y-3 p-6">
                {[1,2,3].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--surface-alt)]" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-alt)] text-[var(--text)]">
                  <Sparkles className="h-5 w-5 text-[#E11D48]" />
                </div>
                <div className="text-lg font-semibold text-[var(--text)]">No matching updates</div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {changes.length === 0 ? 'There are no updates yet. Load demo data or scan portals now.' : 'Try another board or change-type filter.'}
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <button onClick={onSeedDemo} className="rounded-xl bg-[var(--surface-alt)] px-3 py-2 text-xs font-medium text-[var(--text)]">Load demo data</button>
                  <button onClick={onCheckNow} disabled={checking} className="rounded-xl bg-gradient-to-r from-[#E11D48] to-[#F97316] px-3 py-2 text-xs font-semibold text-white">{checking ? 'Scanning...' : 'Scan now'}</button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {filtered.map((item) => {
                  const typeConfig = TYPE_MAP[item.changeType] ?? TYPES[0];
                  const boardClass = boardColors[item.source] ?? 'bg-[var(--surface-alt)] text-[var(--muted)] border-[var(--border)]';

                  return (
                    <motion.div
                      key={item._id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => onInspect(item)}
                      className="cursor-pointer p-4 transition hover:bg-[var(--surface-alt)] md:p-5"
                    >
                      <div className="w-full">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${boardClass}`}>
                            {item.source}
                          </span>
                          <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${typeConfig.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${typeConfig.dot}`} />
                            {typeConfig.label}
                          </span>
                          <span className="text-[11px] text-[var(--muted)]">{relativeTime(item.detectedAt)}</span>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="text-base font-semibold text-[var(--text)]">{item.examName ?? 'Exam update'}</div>
                          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">{item.summary}</p>
                        </div>

                        {(item.oldValue || item.newValue) && (
                          <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-3 font-mono text-[11px]">
                            <div className="flex flex-wrap gap-2 text-[var(--muted)]">
                              <span className="text-rose-400 line-through">{item.oldValue ?? 'None'}</span>
                              <span className="text-[var(--muted)]">→</span>
                              <span className="text-emerald-400">{item.newValue ?? 'Updated'}</span>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.pdfUrl && (
                              <a href={item.pdfUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-2.5 py-2 text-[11px] font-medium text-[var(--text)]">
                                <FileText className="h-3.5 w-3.5" />
                                Notice PDF
                              </a>
                            )}
                            {item.effectiveDate && (
                              <span className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-1 text-[10px] font-medium text-[var(--muted)]">
                                <CalendarClock className="h-3 w-3" />
                                {formatDate(item.effectiveDate)}
                              </span>
                            )}
                          </div>

                          <button className="inline-flex items-center gap-2 rounded-xl bg-[var(--surface-alt)] px-2.5 py-2 text-[11px] font-medium text-[var(--text)]">
                            Details
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <div className={`${cardBase} p-4`}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[var(--text)]">Upcoming deadlines</div>
              <CalendarClock className="h-4 w-4 text-[var(--muted)]" />
            </div>
            <div className="mt-4 space-y-3">
              {deadlineCards.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5">
                  <div>
                    <div className="text-sm font-medium text-[var(--text)]">{item.label}</div>
                    <div className="text-[11px] text-[var(--muted)]">{item.status}</div>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getDeadlineTone(item.days)}`}>
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${cardBase} p-4`}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-[var(--text)]">14-day activity</div>
              <div className="text-[11px] text-[var(--muted)]">+24%</div>
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="activityFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#E11D48" stopOpacity={0.34} />
                      <stop offset="100%" stopColor="#F97316" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    cursor={{ stroke: 'rgba(225,29,72,0.35)' }}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid rgba(240,221,208,1)',
                      background: 'rgba(255,255,255,0.96)',
                      color: '#4A2C3F',
                    }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#E11D48" strokeWidth={2.5} fill="url(#activityFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
