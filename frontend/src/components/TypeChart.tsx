import React from 'react';
import { Stats, TYPES } from '../types';

interface TypeChartProps {
  stats: Stats | null;
  total: number;
}

export const TypeChart: React.FC<TypeChartProps> = ({ stats, total }) => {
  const max = Math.max(1, ...TYPES.map((t) => stats?.byType?.[t.key] ?? 0));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>📊</span>
          <span>Updates by Classification</span>
        </h3>
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
          {total} Total
        </span>
      </div>

      <div className="space-y-3">
        {TYPES.map((t) => {
          const count = stats?.byType?.[t.key] ?? 0;
          const pct = Math.round((count / max) * 100);

          return (
            <div key={t.key}>
              <div className="flex items-center justify-between text-xs mb-1 font-medium">
                <span className="text-slate-700">{t.label}</span>
                <span className="text-slate-500 font-semibold">{count}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${t.bar} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {total === 0 && (
        <p className="text-xs text-slate-400 mt-4 text-center">
          No updates recorded yet. Click "Check Now" to start.
        </p>
      )}
    </div>
  );
};
