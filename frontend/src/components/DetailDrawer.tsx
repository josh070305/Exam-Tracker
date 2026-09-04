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
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade">
      {/* Backdrop click to dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Body */}
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden animate-fade">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${typeConfig.badge}`}
              >
                {typeConfig.label}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-700 font-bold text-xs">
                {change.source}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Detected {relativeTime(change.detectedAt)}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-2">
              {change.examName ?? `${change.source} Notification`}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <span className="text-[11px] font-bold uppercase text-indigo-600 tracking-wider">
              Autonomous Summary
            </span>
            <p className="text-sm font-semibold text-slate-900 mt-1 leading-relaxed">
              {change.summary}
            </p>
          </div>

          {/* Value Transition Card */}
          {(change.oldValue || change.newValue) && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                State Transition ({change.changedField ?? 'Attribute'})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100">
                  <span className="text-[11px] font-semibold text-rose-500 uppercase">
                    Prior State / Old Value
                  </span>
                  <div className="text-xs font-mono font-bold text-rose-800 mt-1">
                    {change.oldValue ?? 'None / Not Announced'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-[11px] font-semibold text-emerald-600 uppercase">
                    New Value / Revision
                  </span>
                  <div className="text-xs font-mono font-bold text-emerald-800 mt-1">
                    {change.newValue ?? 'Updated'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Meta Specifications */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Notice Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium">Effective Date:</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {formatDate(change.effectiveDate)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium">Timestamp:</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {new Date(change.detectedAt).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* PDF Action */}
          {change.pdfUrl && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-indigo-300">Official Notice PDF</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Uploaded directly by recruitment board
                </p>
              </div>
              <a
                href={change.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition whitespace-nowrap"
              >
                Download PDF 📄
              </a>
            </div>
          )}

          {/* Scraped Context Snippet */}
          {change.rawSnippet && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Raw Scraped Portal Context
              </h3>
              <div className="bg-slate-950 rounded-xl p-4 text-[11px] font-mono text-slate-300 max-h-40 overflow-y-auto leading-relaxed border border-slate-800">
                {change.rawSnippet}
              </div>
            </div>
          )}

          {/* Raw JSON Inspector */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              JSON Telemetry
            </h3>
            <pre className="bg-slate-100 p-3 rounded-xl text-[10px] font-mono text-slate-700 overflow-x-auto border border-slate-200">
              {JSON.stringify(change, null, 2)}
            </pre>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
