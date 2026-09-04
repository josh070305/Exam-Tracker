import React from 'react';
import { SourceInfo, Stats, SOURCES, relativeTime } from '../types';

interface SourceStatusProps {
  sources: SourceInfo[];
  stats: Stats | null;
}

export const SourceStatus: React.FC<SourceStatusProps> = ({ sources, stats }) => {
  const list = sources.length
    ? sources
    : SOURCES.map((s) => ({ source: s, lastContentHash: null, lastCheckedAt: '' }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>🏛️</span>
          <span>Monitored Recruitment Boards</span>
        </h3>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
          {list.length} Live
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {list.map((s) => {
          const checked = stats?.lastChecked?.[s.source] || s.lastCheckedAt;
          const count = stats?.bySource?.[s.source] ?? 0;

          return (
            <div key={s.source} className="py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ring-4 ${
                    checked
                      ? 'bg-emerald-500 ring-emerald-100'
                      : 'bg-slate-300 ring-slate-100'
                  }`}
                />
                <div>
                  <span className="text-sm font-bold text-slate-800">{s.source}</span>
                  <div className="text-[11px] text-slate-400">
                    Checked {checked ? relativeTime(checked) : 'never'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-600 px-2 py-0.5 rounded-md bg-slate-100">
                {count} updates
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
