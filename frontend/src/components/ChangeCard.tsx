import React from 'react';
import { ExamChange, TYPE_MAP, TYPES, relativeTime, formatDate } from '../types';

interface ChangeCardProps {
  change: ExamChange;
  onInspect: () => void;
}

export const ChangeCard: React.FC<ChangeCardProps> = ({ change, onInspect }) => {
  const typeConfig = TYPE_MAP[change.changeType] ?? TYPES[0];

  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 shadow-[var(--shadow-soft)] hover:shadow-md transition-all duration-200 animate-fade">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${typeConfig.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${typeConfig.dot}`} />
            {typeConfig.label}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-[var(--surface-alt)] font-bold text-xs text-[var(--text)]">
            {change.source}
          </span>
          {change.examName && (
            <span className="text-xs font-semibold text-[var(--muted)] hidden sm:inline">
              • {change.examName}
            </span>
          )}
        </div>

        <span className="text-xs font-medium text-[var(--muted)] whitespace-nowrap">
          {relativeTime(change.detectedAt)}
        </span>
      </div>

      <p className="mt-3 text-sm sm:text-base font-semibold text-[var(--text)] leading-snug">
        {change.summary}
      </p>

      {(change.oldValue || change.newValue) && (
        <div className="mt-3.5 flex items-center gap-2 flex-wrap text-xs bg-[var(--surface-alt)] p-2.5 rounded-xl border border-[var(--border)] font-mono">
          <span className="text-[var(--muted)] font-semibold">{change.changedField ?? 'Change'}:</span>
          <span className="text-[#DC2626] font-medium line-through px-1.5 py-0.5 rounded bg-[#FDE7EE] border border-[#F1C2CD]">
            {change.oldValue ?? 'None'}
          </span>
          <span className="text-[var(--muted)] font-bold">➔</span>
          <span className="text-[#059669] font-bold px-1.5 py-0.5 rounded bg-[#EAFBF4] border border-[#A9E0C9]">
            {change.newValue ?? 'Updated'}
          </span>
        </div>
      )}

      <div className="mt-4 pt-3.5 border-t border-[var(--border)] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {change.effectiveDate && (
            <span className="text-xs text-[#D97706] bg-[#FFF3D9] border border-[#F4D28A] px-2.5 py-0.5 rounded-md font-medium">
              📅 {formatDate(change.effectiveDate)}
            </span>
          )}
          {change.pdfUrl && (
            <a
              href={change.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#E11D48] hover:text-[#C51A3F] bg-[#FDE7EE] border border-[#F1C2CD] px-2.5 py-0.5 rounded-md font-semibold transition"
            >
              <span>📄 Official PDF</span>
            </a>
          )}
        </div>

        <button
          onClick={onInspect}
          className="inline-flex items-center gap-1 text-xs font-bold text-[var(--text)] hover:text-[#E11D48] bg-[var(--surface-alt)] hover:bg-[#FDE7EE] px-3 py-1 rounded-lg transition"
        >
          <span>Inspect Details</span>
          <span>➔</span>
        </button>
      </div>
    </div>
  );
};
