import React from 'react';
import { ExamChange, TYPE_MAP, TYPES, relativeTime, formatDate } from '../types';

interface ChangeCardProps {
  change: ExamChange;
  onInspect: () => void;
}

export const ChangeCard: React.FC<ChangeCardProps> = ({ change, onInspect }) => {
  const typeConfig = TYPE_MAP[change.changeType] ?? TYPES[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 animate-fade">
      {/* Top Header: Badge, Board, Relative Time */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${typeConfig.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${typeConfig.dot}`} />
            {typeConfig.label}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 font-bold text-xs text-slate-700">
            {change.source}
          </span>
          {change.examName && (
            <span className="text-xs font-semibold text-slate-600 hidden sm:inline">
              • {change.examName}
            </span>
          )}
        </div>

        <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
          {relativeTime(change.detectedAt)}
        </span>
      </div>

      {/* Main Notice Summary */}
      <p className="mt-3 text-sm sm:text-base font-semibold text-slate-900 leading-snug">
        {change.summary}
      </p>

      {/* Value Transition Pills (if old/new value exists) */}
      {(change.oldValue || change.newValue) && (
        <div className="mt-3.5 flex items-center gap-2 flex-wrap text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 font-mono">
          <span className="text-slate-400 font-semibold">{change.changedField ?? 'Change'}:</span>
          <span className="text-rose-500 font-medium line-through px-1.5 py-0.5 rounded bg-rose-50 border border-rose-100">
            {change.oldValue ?? 'None'}
          </span>
          <span className="text-slate-400 font-bold">➔</span>
          <span className="text-emerald-700 font-bold px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100">
            {change.newValue ?? 'Updated'}
          </span>
        </div>
      )}

      {/* Footer Actions: Effective Date, PDF Link, Inspect Button */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {change.effectiveDate && (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-md font-medium">
              📅 {formatDate(change.effectiveDate)}
            </span>
          )}
          {change.pdfUrl && (
            <a
              href={change.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md font-semibold transition"
            >
              <span>📄 Official PDF</span>
            </a>
          )}
        </div>

        <button
          onClick={onInspect}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3 py-1 rounded-lg transition"
        >
          <span>Inspect Details</span>
          <span>➔</span>
        </button>
      </div>
    </div>
  );
};
