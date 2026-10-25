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
    <div className="fixed inset-0 z-50 flex justify-end bg-[#FDEFE6]/80 backdrop-blur-md transition-opacity animate-fade">
      {/* Backdrop click dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="w-full max-w-xl bg-[#FFF8F1] text-[#4A2C3F] h-full shadow-[0_16px_40px_rgba(225,29,72,0.08)] flex flex-col border-l border-[#F0DDD0] overflow-hidden animate-fade">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#F0DDD0] bg-[#FFF3EC] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeConfig.badge}`}
              >
                {typeConfig.label}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#FDEFE6] text-[#4A2C3F] font-mono font-bold text-xs border border-[#F0DDD0]">
                {change.source}
              </span>
              <span className="text-xs text-[#8A6F7C] font-mono">
                {relativeTime(change.detectedAt)}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#4A2C3F] mt-2.5">
              {change.examName ?? `${change.source} Notification`}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#FDEFE6] hover:bg-[#F6E0D6] text-[#8A6F7C] hover:text-[#4A2C3F] border border-[#F0DDD0] transition"
          >
            ✕
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-[#FFF3EC] border border-[#F0DDD0]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#E11D48] font-bold">
              Autonomous Summary
            </span>
            <p className="text-sm font-medium text-[#4A2C3F] mt-1 leading-relaxed">
              {change.summary}
            </p>
          </div>

          {/* Value Transition Card */}
          {(change.oldValue || change.newValue) && (
            <div className="space-y-2">
              <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#8A6F7C] font-bold">
                State Transition ({change.changedField ?? 'Attribute'})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#FDE7EE] border border-[#F1A9B5]">
                  <span className="text-[10px] font-mono text-[#DC2626] uppercase font-semibold">
                    Prior State / Old Value
                  </span>
                  <div className="text-xs font-mono font-bold text-[#A9293D] mt-1">
                    {change.oldValue ?? 'None / Not Announced'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#EAFBF4] border border-[#A9E0C9]">
                  <span className="text-[10px] font-mono text-[#059669] uppercase font-semibold">
                    New Value / Revision
                  </span>
                  <div className="text-xs font-mono font-bold text-[#0C6E4C] mt-1">
                    {change.newValue ?? 'Updated'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metadata Specifications */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#8A6F7C] font-bold">
              Notice Telemetry
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FFF3EC] border border-[#F0DDD0]">
                <span className="text-[#8A6F7C] font-medium">Effective Date:</span>
                <p className="font-semibold text-[#4A2C3F] mt-0.5 font-mono">
                  {formatDate(change.effectiveDate)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#FFF3EC] border border-[#F0DDD0]">
                <span className="text-[#8A6F7C] font-medium">Detection Time:</span>
                <p className="font-semibold text-[#4A2C3F] mt-0.5 font-mono">
                  {new Date(change.detectedAt).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Official PDF Action */}
          {change.pdfUrl && (
            <div className="p-4 rounded-xl bg-[#FDEFE6] border border-[#F0DDD0] flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[#E11D48]">Official Notice PDF</span>
                <p className="text-[11px] text-[#8A6F7C] mt-0.5">
                  Direct official upload from recruitment board
                </p>
              </div>
              <a
                href={change.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-gradient-to-r from-[#E11D48] to-[#F97316] text-white text-xs font-bold rounded-lg shadow-[0_0_24px_rgba(225,29,72,0.18)] transition whitespace-nowrap"
              >
                Download PDF 📄
              </a>
            </div>
          )}

          {/* Raw Scraped Context */}
          {change.rawSnippet && (
            <div className="space-y-1.5">
              <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#8A6F7C] font-bold">
                Raw Scraped Portal Excerpt
              </h3>
              <div className="bg-[#FFF3EC] rounded-xl p-3.5 text-[11px] font-mono text-[#4A2C3F] max-h-40 overflow-y-auto leading-relaxed border border-[#F0DDD0]">
                {change.rawSnippet}
              </div>
            </div>
          )}

          {/* Raw JSON Telemetry */}
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#8A6F7C] font-bold">
              Raw JSON Data Payload
            </h3>
            <pre className="bg-[#FFF3EC] p-3 rounded-xl text-[10px] font-mono text-[#4A2C3F] overflow-x-auto border border-[#F0DDD0]">
              {JSON.stringify(change, null, 2)}
            </pre>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#F0DDD0] bg-[#FFF3EC] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#FFFFFF] hover:bg-[#FDEFE6] text-[#4A2C3F] text-xs font-bold rounded-xl border border-[#F0DDD0] transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
