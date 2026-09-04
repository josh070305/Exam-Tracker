export interface ExamChange {
  _id: string;
  source: string;
  examName: string | null;
  changeType: 'new_exam' | 'date_change' | 'admit_card' | 'result' | 'eligibility_revised' | 'corrigendum';
  changedField: string | null;
  oldValue: string | null;
  newValue: string | null;
  effectiveDate: string | null;
  summary: string;
  detectedAt: string;
  contentHash: string;
  pdfUrl?: string | null;
  rawSnippet?: string;
}

export interface AgentLog {
  timestamp: string;
  stage: string;
  source?: string;
  message: string;
}

export interface Stats {
  total: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  lastChecked: Record<string, string>;
}

export interface SourceInfo {
  source: string;
  lastContentHash: string | null;
  lastCheckedAt: string;
}

export interface ExamDoc {
  id: string;
  source: string;
  examName: string | null;
  versionCount: number;
  updatedAt: string;
  current: any;
}

export interface ExamDetail {
  _id: string;
  source: string;
  examName: string | null;
  versions: any[];
  current: any;
}

export interface UserPrefs {
  sources: string[];
  exams: string[];
  types: string[];
  channels: {
    telegram: boolean;
    whatsapp: boolean;
    email: boolean;
  };
}

export interface UserDoc {
  _id: string;
  name: string;
  telegramChatId: string | null;
  whatsappNumber: string | null;
  email: string | null;
  prefs: UserPrefs;
}

export const SOURCES = ['SSC', 'RRB', 'TNPSC', 'UPSC', 'IBPS', 'SBI'] as const;

export const TYPES = [
  { key: 'new_exam', label: 'New Exam', bar: 'bg-sky-500', badge: 'bg-sky-500/10 text-sky-400 border-sky-500/25', dot: 'bg-sky-400' },
  { key: 'date_change', label: 'Date Change', bar: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/25', dot: 'bg-amber-400' },
  { key: 'admit_card', label: 'Admit Card', bar: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/25', dot: 'bg-purple-400' },
  { key: 'result', label: 'Result', bar: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400' },
  { key: 'eligibility_revised', label: 'Eligibility', bar: 'bg-rose-500', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/25', dot: 'bg-rose-400' },
  { key: 'corrigendum', label: 'Corrigendum', bar: 'bg-orange-500', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/25', dot: 'bg-orange-400' },
] as const;

export const TYPE_MAP = Object.fromEntries(TYPES.map((t) => [t.key, t]));

export function relativeTime(iso: string): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 45) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
