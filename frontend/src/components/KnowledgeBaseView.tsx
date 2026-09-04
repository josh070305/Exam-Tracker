import React from 'react';
import { ExamDoc, ExamDetail, TYPE_MAP, TYPES, relativeTime, formatDate } from '../types';

interface KnowledgeBaseViewProps {
  exams: ExamDoc[];
  examDetail: ExamDetail | null;
  onSelectExam: (id: string) => void;
  loading: boolean;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  exams,
  examDetail,
  onSelectExam,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto animate-fade">
      {/* Left Column: Tracked Exams Master Index */}
      <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col">
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-950/40">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <span>📚</span>
              <span>Tracked Exams Index</span>
            </h2>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {exams.length} Tracked
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Autonomous versioned knowledge base preserving historical audit records per exam.
          </p>
        </div>

        <div className="p-3.5 space-y-2 max-h-[72vh] overflow-y-auto divide-y divide-zinc-800/50">
          {exams.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs font-mono">
              No exams in knowledge base yet. Run a scan or load demo data.
            </div>
          ) : (
            exams.map((e) => {
              const isSelected = examDetail?._id === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => onSelectExam(e.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition duration-150 ${
                    isSelected
                      ? 'bg-zinc-800/80 border-indigo-500/50 text-white shadow-lg'
                      : 'border-transparent hover:bg-zinc-850 hover:border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-sm text-zinc-100">
                      {e.examName ?? 'Unnamed Exam'}
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {e.versionCount} {e.versionCount === 1 ? 'version' : 'versions'}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1.5 flex items-center gap-2 font-mono">
                    <span className="font-bold text-zinc-300 px-1.5 py-0.2 bg-zinc-800 rounded text-[10px]">
                      {e.source}
                    </span>
                    <span>•</span>
                    <span>Updated {relativeTime(e.updatedAt)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Version History Timeline */}
      <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col">
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-950/40">
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <span>⏱️</span>
            <span>
              {examDetail ? `${examDetail.examName ?? 'Exam'} — History` : 'Timeline Inspector'}
            </span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            {examDetail
              ? `Chronological revisions identified by autonomous agent.`
              : 'Select an exam on the left to inspect its version progression.'}
          </p>
        </div>

        <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          {!examDetail ? (
            <div className="text-center py-20 text-zinc-500 font-mono text-xs">
              <span className="text-3xl block mb-2">👈</span>
              <p>Click any exam to view its chronological updates</p>
            </div>
          ) : (
            (examDetail.versions || [])
              .slice()
              .reverse()
              .map((v: any, idx: number) => {
                const typeConfig = TYPE_MAP[v.changeType as keyof typeof TYPE_MAP] ?? TYPES[0];

                return (
                  <div
                    key={idx}
                    className="relative pl-6 pb-6 border-l-2 border-zinc-800 last:border-0 last:pb-0"
                  >
                    {/* Node Icon */}
                    <span
                      className={`absolute -left-[9px] top-0.5 h-4 w-4 rounded-full ring-4 ring-zinc-950 ${typeConfig.dot}`}
                    />

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeConfig.badge}`}
                      >
                        {typeConfig.label}
                      </span>
                      <span className="text-xs font-mono text-zinc-500">
                        {relativeTime(v.detectedAt)}
                      </span>
                      {v.effectiveDate && (
                        <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                          📅 {formatDate(v.effectiveDate)}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm font-medium text-zinc-200 leading-snug">
                      {v.summary}
                    </p>

                    {(v.oldValue || v.newValue) && (
                      <div className="mt-2.5 text-xs flex items-center gap-2 bg-zinc-950/70 p-2 rounded-lg border border-zinc-800 font-mono">
                        <span className="text-rose-400/80 line-through">
                          {v.oldValue ?? 'None'}
                        </span>
                        <span className="text-zinc-500 font-bold">➔</span>
                        <span className="text-emerald-400 font-bold">
                          {v.newValue ?? 'Updated'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
};
