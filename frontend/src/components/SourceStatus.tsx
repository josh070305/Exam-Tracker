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
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
          <span>🏛️</span>
          <span>Monitored Recruitment Boards</span>
        </h3>
        <span className="text-xs font-semibold text-[#059669] bg-[#EAFBF4] px-2 py-0.5 rounded-full border border-[#A9E0C9]">
          {list.length} Live
        </span>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {list.map((s) => {
          const checked = stats?.lastChecked?.[s.source] || s.lastCheckedAt;
          const count = stats?.bySource?.[s.source] ?? 0;

          return (
            <div key={s.source} className="py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ring-4 ${
                    checked
                      ? 'bg-[#059669] ring-[#EAFBF4]'
                      : 'bg-[#E2D3CF] ring-[#FDEFE6]'
                  }`}
                />
                <div>
                  <span className="text-sm font-bold text-[var(--text)]">{s.source}</span>
                  <div className="text-[11px] text-[var(--muted)]">
                    Checked {checked ? relativeTime(checked) : 'never'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-[var(--text)] px-2 py-0.5 rounded-md bg-[var(--surface-alt)]">
                {count} updates
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
