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
  { key: 'new_exam', label: 'New Exam', bar: 'bg-[#E11D48]', badge: 'bg-[#E11D48]/10 text-[#E11D48] border-[#E11D48]/25', dot: 'bg-[#E11D48]' },
  { key: 'date_change', label: 'Date Change', bar: 'bg-[#D97706]', badge: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/25', dot: 'bg-[#D97706]' },
  { key: 'admit_card', label: 'Admit Card', bar: 'bg-[#C026D3]', badge: 'bg-[#C026D3]/10 text-[#C026D3] border-[#C026D3]/25', dot: 'bg-[#C026D3]' },
  { key: 'result', label: 'Result', bar: 'bg-[#059669]', badge: 'bg-[#059669]/10 text-[#059669] border-[#059669]/25', dot: 'bg-[#059669]' },
  { key: 'eligibility_revised', label: 'Eligibility', bar: 'bg-[#E11D48]', badge: 'bg-[#E11D48]/10 text-[#E11D48] border-[#E11D48]/25', dot: 'bg-[#E11D48]' },
  { key: 'corrigendum', label: 'Corrigendum', bar: 'bg-[#EA580C]', badge: 'bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/25', dot: 'bg-[#EA580C]' },
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
