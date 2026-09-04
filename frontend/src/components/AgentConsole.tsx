import React from 'react';
import { AgentLog } from '../types';

interface AgentConsoleProps {
  logs: AgentLog[];
  onClear: () => void;
  onTriggerScan: () => void;
  checking: boolean;
}

export const AgentConsole: React.FC<AgentConsoleProps> = ({
  logs,
  onClear,
  onTriggerScan,
  checking,
}) => {
  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'SCRAPE':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'HASH_CHECK':
        return 'bg-slate-700 text-slate-300 border-slate-600';
      case 'DIFF_DETECTED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'PDF_INGEST':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'LLM_REASONING':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/40 animate-pulse';
      case 'COMPLETED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade">
      {/* Console Header */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-base font-bold tracking-tight">
              Autonomous Agent Live Activity Stream
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry showing scraper hashing, PDF parsing, context retrieval, and LLM reasoning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClear}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            Clear Log
          </button>
          <button
            onClick={onTriggerScan}
            disabled={checking}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {checking ? 'Agent Active...' : '⚡ Trigger Agent Cycle'}
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl p-4 sm:p-6 font-mono text-xs text-slate-300 min-h-[500px] max-h-[70vh] overflow-y-auto flex flex-col justify-start">
        {logs.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <span className="text-3xl block mb-2">🤖</span>
            <p className="font-semibold text-slate-400">Agent telemetry standby.</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Click "Trigger Agent Cycle" or "Seed Demo Data" to watch the agent process live notifications.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {logs.map((log, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:bg-slate-900 transition"
              >
                <span className="text-slate-500 text-[10px] whitespace-nowrap pt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString('en-IN')}
                </span>

                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide whitespace-nowrap ${getStageBadge(
                    log.stage
                  )}`}
                >
                  {log.stage}
                </span>

                {log.source && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">
                    {log.source}
                  </span>
                )}

                <span className="text-slate-200 leading-relaxed break-words flex-1">
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
