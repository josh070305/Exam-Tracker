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
  { key: 'new_exam', label: 'New Exam', bar: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  { key: 'date_change', label: 'Date Change', bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  { key: 'admit_card', label: 'Admit Card', bar: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  { key: 'result', label: 'Result', bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  { key: 'eligibility_revised', label: 'Eligibility', bar: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  { key: 'corrigendum', label: 'Corrigendum', bar: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
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
