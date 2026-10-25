import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Bot, Braces, Database, FileUp, Globe, Sparkles, TimerReset } from 'lucide-react';
import { AgentLog } from '../types';

interface AgentConsoleProps {
  logs: AgentLog[];
  onClear: () => void;
  onTriggerScan: () => void;
  checking: boolean;
}

const stageConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  SCRAPE: { label: 'Scrape', className: 'border-[#E11D48]/30 bg-[#FDE7EE] text-[#E11D48]', icon: Globe },
  HASH_CHECK: { label: 'Hash check', className: 'border-[#8A6F7C]/30 bg-[#FDEFE6] text-[#4A2C3F]', icon: Database },
  DIFF_DETECTED: { label: 'Diff detected', className: 'border-[#D97706]/30 bg-[#FFF3D9] text-[#D97706]', icon: Activity },
  PDF_INGEST: { label: 'PDF parse', className: 'border-[#C026D3]/30 bg-[#FCE7F3] text-[#C026D3]', icon: FileUp },
  LLM_REASONING: { label: 'LLM reasoning', className: 'border-[#E11D48]/30 bg-[#FDE7EE] text-[#E11D48]', icon: Braces },
  COMPLETED: { label: 'Completed', className: 'border-[#059669]/30 bg-[#EAFBF4] text-[#059669]', icon: Sparkles },
};

export const AgentConsole: React.FC<AgentConsoleProps> = ({ logs, onClear, onTriggerScan, checking }) => {
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)] md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F9DDE4] to-[#FDE5D3] text-[#E11D48]">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold text-[var(--text)]">Autonomous agent stream</div>
              <div className="text-sm text-[var(--muted)]">Scraper → hash check → PDF parse → compare → save</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onClear} className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-xs font-medium text-[var(--text)]">Clear log</button>
            <button onClick={onTriggerScan} disabled={checking} className="rounded-xl bg-gradient-to-r from-[#E11D48] to-[#F97316] px-4 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(225,29,72,0.18)] disabled:opacity-60">
              {checking ? 'Agent active...' : 'Trigger scan'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)] md:p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--text)]">
          <TimerReset className="h-4 w-4 text-emerald-400" />
          {checking ? 'Agent is scanning...' : 'Agent ready'}
        </div>

        {checking && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Scraping live sources, comparing hashes, and validating notice changes.
          </div>
        )}

        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] text-sm text-[var(--muted)]">
              Agent telemetry is idle. Trigger a scan to begin the workflow.
            </div>
          ) : (
            logs.map((log, index) => {
              const config = stageConfig[log.stage] ?? { label: log.stage, className: 'border-[#E11D48]/30 bg-[#FDE7EE] text-[#E11D48]', icon: Activity };
              const Icon = config.icon;
              return (
                <motion.div key={`${log.timestamp}-${index}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${config.className}`}>{config.label}</span>
                      {log.source && <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[10px] text-[var(--muted)]">{log.source}</span>}
                      <span className="text-[10px] text-[var(--muted)]">{new Date(log.timestamp).toLocaleTimeString('en-IN')}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--text)]">{log.message}</p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
