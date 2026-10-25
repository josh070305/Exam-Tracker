import React from 'react';
import { BookOpenText, Clock3, FileText, Sparkles } from 'lucide-react';
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
  loading,
}) => {
  return (
    <div className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
      <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <BookOpenText className="h-4 w-4 text-[#E11D48]" />
            Tracked exams
          </div>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
            {exams.length} tracked
          </span>
        </div>

        <div className="space-y-2 p-3">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1,2,3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--surface-alt)]" />)}
            </div>
          ) : exams.length === 0 ? (
            <div className="p-10 text-center text-sm text-[var(--muted)]">
              <Sparkles className="mx-auto mb-3 h-5 w-5 text-[#E11D48]" />
              No exams recorded yet.
            </div>
          ) : (
            exams.map((exam) => {
              const active = examDetail?._id === exam.id;
              return (
                <button
                  key={exam.id}
                  onClick={() => onSelectExam(exam.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${active ? 'border-[#E11D48]/50 bg-[#FDE7EE]' : 'border-transparent bg-[var(--surface-alt)] hover:border-[var(--border)]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[var(--text)]">{exam.examName ?? 'Unnamed exam'}</div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--muted)]">
                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5">{exam.source}</span>
                        <span>Updated {relativeTime(exam.updatedAt)}</span>
                      </div>
                    </div>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[10px] font-medium text-[var(--text)]">
                      {exam.versionCount} versions
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <Clock3 className="h-4 w-4 text-[#059669]" />
            {examDetail ? `${examDetail.examName ?? 'Exam'} timeline` : 'Version history'}
          </div>
        </div>

        <div className="space-y-6 p-5">
          {!examDetail ? (
            <div className="flex min-h-[300px] items-center justify-center text-sm text-[var(--muted)]">Select an exam to inspect its version history.</div>
          ) : (
            (examDetail.versions || []).slice().reverse().map((item: any, index: number) => {
              const typeConfig = TYPE_MAP[item.changeType as keyof typeof TYPE_MAP] ?? TYPES[0];
              return (
                <div key={`${item.detectedAt}-${index}`} className="relative pl-6">
                  <div className={`absolute left-0 top-1.5 h-3 w-3 rounded-full ${typeConfig.dot}`} />
                  <div className="absolute left-[5px] top-5 h-[calc(100%+12px)] w-px bg-[var(--border)] last:hidden" />
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${typeConfig.badge}`}>{typeConfig.label}</span>
                      <span className="text-[11px] text-[var(--muted)]">{relativeTime(item.detectedAt)}</span>
                      {item.effectiveDate && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-300">
                          <FileText className="h-3 w-3" />
                          {formatDate(item.effectiveDate)}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--text)]">{item.summary}</p>
                    {(item.oldValue || item.newValue) && (
                      <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-[11px]">
                        <span className="text-rose-400 line-through">{item.oldValue ?? 'None'}</span>
                        <span className="mx-2 text-[var(--muted)]">→</span>
                        <span className="text-emerald-400">{item.newValue ?? 'Updated'}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
