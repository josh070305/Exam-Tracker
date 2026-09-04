import React from 'react';
import { ExamChange, TYPE_MAP, TYPES, formatDate, relativeTime } from '../types';

interface DetailDrawerProps {
  change: ExamChange | null;
  onClose: () => void;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({ change, onClose }) => {
  if (!change) return null;

  const typeConfig = TYPE_MAP[change.changeType] ?? TYPES[0];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-md transition-opacity animate-fade">
      {/* Backdrop click dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="w-full max-w-xl bg-zinc-950 text-zinc-100 h-full shadow-2xl flex flex-col border-l border-zinc-800/80 overflow-hidden animate-fade">
        {/* Drawer Header */}
        <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/50 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeConfig.badge}`}
              >
                {typeConfig.label}
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono font-bold text-xs border border-zinc-700">
                {change.source}
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                {relativeTime(change.detectedAt)}
              </span>
            </div>
            <h2 className="text-lg font-bold text-zinc-100 mt-2.5">
              {change.examName ?? `${change.source} Notification`}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 border border-zinc-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">
              Autonomous Summary
            </span>
            <p className="text-sm font-medium text-zinc-200 mt-1 leading-relaxed">
              {change.summary}
            </p>
          </div>

          {/* Value Transition Card */}
          {(change.oldValue || change.newValue) && (
            <div className="space-y-2">
              <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                State Transition ({change.changedField ?? 'Attribute'})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40">
                  <span className="text-[10px] font-mono text-rose-400 uppercase font-semibold">
                    Prior State / Old Value
                  </span>
                  <div className="text-xs font-mono font-bold text-rose-300 mt-1">
                    {change.oldValue ?? 'None / Not Announced'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
                    New Value / Revision
                  </span>
                  <div className="text-xs font-mono font-bold text-emerald-300 mt-1">
                    {change.newValue ?? 'Updated'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metadata Specifications */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Notice Telemetry
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <span className="text-zinc-500 font-medium">Effective Date:</span>
                <p className="font-semibold text-zinc-300 mt-0.5 font-mono">
                  {formatDate(change.effectiveDate)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <span className="text-zinc-500 font-medium">Detection Time:</span>
                <p className="font-semibold text-zinc-300 mt-0.5 font-mono">
                  {new Date(change.detectedAt).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Official PDF Action */}
          {change.pdfUrl && (
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-indigo-400">Official Notice PDF</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Direct official upload from recruitment board
                </p>
              </div>
              <a
                href={change.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow transition whitespace-nowrap"
              >
                Download PDF 📄
              </a>
            </div>
          )}

          {/* Raw Scraped Context */}
          {change.rawSnippet && (
            <div className="space-y-1.5">
              <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Raw Scraped Portal Excerpt
              </h3>
              <div className="bg-black/60 rounded-xl p-3.5 text-[11px] font-mono text-zinc-400 max-h-40 overflow-y-auto leading-relaxed border border-zinc-800/80">
                {change.rawSnippet}
              </div>
            </div>
          )}

          {/* Raw JSON Telemetry */}
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Raw JSON Data Payload
            </h3>
            <pre className="bg-black/60 p-3 rounded-xl text-[10px] font-mono text-zinc-400 overflow-x-auto border border-zinc-800/80">
              {JSON.stringify(change, null, 2)}
            </pre>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl border border-zinc-700 transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
