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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Tracked Exams Master List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>📚</span>
              <span>Tracked Exams Index</span>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {exams.length} Tracked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Autonomous versioned knowledge base storing timeline and schema changes per exam.
          </p>
        </div>

        <div className="p-4 space-y-2.5 max-h-[72vh] overflow-y-auto divide-y divide-slate-100">
          {exams.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No exams recorded in the knowledge base yet. Trigger a scan to populate.
            </div>
          ) : (
            exams.map((e) => {
              const isSelected = examDetail?._id === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => onSelectExam(e.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm'
                      : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-sm text-slate-900">
                      {e.examName ?? 'Unnamed Examination'}
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {e.versionCount} {e.versionCount === 1 ? 'version' : 'versions'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-2">
                    <span className="font-semibold text-slate-700 px-1.5 py-0.5 bg-slate-100 rounded text-[11px]">
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
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>⏱️</span>
            <span>
              {examDetail ? `${examDetail.examName ?? 'Exam'} — Change History` : 'Timeline Inspector'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {examDetail
              ? `Displaying all ${examDetail.versions?.length || 0} historical states detected by AI agents.`
              : 'Select any exam on the left to inspect its version progression.'}
          </p>
        </div>

        <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          {!examDetail ? (
            <div className="text-center py-16 text-slate-400">
              <span className="text-3xl block mb-2">👈</span>
              <p className="text-sm font-medium">Click an exam to view its chronological updates</p>
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
                    className="relative pl-6 pb-6 border-l-2 border-indigo-200 last:border-0 last:pb-0"
                  >
                    {/* Timeline Node Icon */}
                    <span
                      className={`absolute -left-[9px] top-0.5 h-4 w-4 rounded-full ring-4 ring-white ${typeConfig.dot}`}
                    />

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${typeConfig.badge}`}
                      >
                        {typeConfig.label}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {relativeTime(v.detectedAt)}
                      </span>
                      {v.effectiveDate && (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                          📅 {formatDate(v.effectiveDate)}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-800 leading-snug">
                      {v.summary}
                    </p>

                    {(v.oldValue || v.newValue) && (
                      <div className="mt-2 text-xs flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200/80 font-mono">
                        <span className="text-rose-500 line-through">
                          {v.oldValue ?? 'None'}
                        </span>
                        <span className="text-slate-400 font-bold">➔</span>
                        <span className="text-emerald-600 font-bold">
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
