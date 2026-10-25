import { useEffect, useCallback, useState, useRef } from 'react';
import { Toaster } from 'sonner';
import { BookOpenText, Bot, LayoutGrid, MessageSquareText, Settings, Zap } from 'lucide-react';
import { Header } from './components/Header';
import { FeedView } from './components/FeedView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { AgentConsole } from './components/AgentConsole';
import { TelegramSimulator } from './components/TelegramSimulator';
import { PreferencesView } from './components/PreferencesView';
import { DetailDrawer } from './components/DetailDrawer';
import { ExamChange, Stats, SourceInfo, ExamDoc, ExamDetail, UserDoc, AgentLog } from './types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000/api';

type TabName = 'feed' | 'kb' | 'console' | 'telegram' | 'prefs';

const tabMeta: Array<{ id: TabName; label: string; icon: typeof LayoutGrid; description: string }> = [
  { id: 'feed', label: 'Feed', icon: LayoutGrid, description: 'Live board activity' },
  { id: 'kb', label: 'Knowledge Base', icon: BookOpenText, description: 'Exam timeline' },
  { id: 'console', label: 'Agent Console', icon: Bot, description: 'AI reasoning trail' },
  { id: 'telegram', label: 'Telegram', icon: MessageSquareText, description: 'Bot simulator' },
  { id: 'prefs', label: 'Settings', icon: Settings, description: 'Monitoring controls' },
];

const dedupeChanges = (items: ExamChange[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.source ?? 'unknown'}|${item.examName ?? 'unknown'}|${item.changeType ?? 'unknown'}|${item.newValue ?? item.oldValue ?? item.summary ?? 'unknown'}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const FALLBACK_CHANGES: ExamChange[] = [
  {
    _id: 'fallback-ssc-cgl',
    source: 'SSC',
    examName: 'SSC CGL 2026',
    changeType: 'date_change',
    changedField: 'examDate',
    oldValue: '15 Aug 2026',
    newValue: '03 Sep 2026',
    effectiveDate: '2026-09-03T00:00:00.000Z',
    summary: 'SSC CGL 2026 Tier-1 date rescheduled for 3 September 2026.',
    detectedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    contentHash: 'fallback-ssc-cgl',
    pdfUrl: 'https://example.com/ssc-cgl-2026.pdf',
  },
  {
    _id: 'fallback-rrb-ntpc',
    source: 'RRB',
    examName: 'RRB NTPC 2026',
    changeType: 'corrigendum',
    changedField: 'vacancyCount',
    oldValue: '11,558',
    newValue: '13,240',
    effectiveDate: '2026-08-20T00:00:00.000Z',
    summary: 'RRB NTPC vacancy count revised upward by 1,682 posts.',
    detectedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    contentHash: 'fallback-rrb-ntpc',
    pdfUrl: 'https://example.com/rrb-ntpc-corrigendum.pdf',
  },
  {
    _id: 'fallback-upsc-cse',
    source: 'UPSC',
    examName: 'UPSC CSE 2026',
    changeType: 'admit_card',
    changedField: 'admitCard',
    oldValue: 'Not released',
    newValue: 'Available for download',
    effectiveDate: '2026-05-10T00:00:00.000Z',
    summary: 'UPSC Civil Services e-admit cards are now live on the official portal.',
    detectedAt: new Date(Date.now() - 75 * 60 * 60 * 1000).toISOString(),
    contentHash: 'fallback-upsc-cse',
    pdfUrl: 'https://example.com/upsc-admit-card.pdf',
  },
  {
    _id: 'fallback-tnpsc-group2',
    source: 'TNPSC',
    examName: 'TNPSC Group 2 2026',
    changeType: 'eligibility_revised',
    changedField: 'upperAgeLimit',
    oldValue: '32 years',
    newValue: '34 years',
    effectiveDate: '2026-07-01T00:00:00.000Z',
    summary: 'TNPSC Group 2 upper age limit revised upward under the latest addendum.',
    detectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    contentHash: 'fallback-tnpsc-group2',
    pdfUrl: 'https://example.com/tnpsc-addendum.pdf',
  },
];

const FALLBACK_STATS: Stats = {
  total: 18,
  byType: {
    new_exam: 3,
    date_change: 5,
    admit_card: 3,
    result: 2,
    eligibility_revised: 3,
    corrigendum: 2,
  },
  bySource: {
    SSC: 4,
    RRB: 3,
    TNPSC: 3,
    UPSC: 4,
    IBPS: 2,
    SBI: 2,
  },
  lastChecked: {
    SSC: new Date().toISOString(),
    RRB: new Date().toISOString(),
    TNPSC: new Date().toISOString(),
    UPSC: new Date().toISOString(),
    IBPS: new Date().toISOString(),
    SBI: new Date().toISOString(),
  },
};

const FALLBACK_SOURCES: SourceInfo[] = ['SSC', 'RRB', 'TNPSC', 'UPSC', 'IBPS', 'SBI'].map((source) => ({
  source,
  lastContentHash: `fallback-${source.toLowerCase()}`,
  lastCheckedAt: new Date().toISOString(),
}));

const FALLBACK_EXAMS: ExamDoc[] = [
  {
    id: 'exam-ssc-cgl-2026',
    source: 'SSC',
    examName: 'SSC CGL 2026',
    versionCount: 4,
    updatedAt: new Date().toISOString(),
    current: { status: 'live' },
  },
  {
    id: 'exam-rrb-ntpc-2026',
    source: 'RRB',
    examName: 'RRB NTPC 2026',
    versionCount: 3,
    updatedAt: new Date().toISOString(),
    current: { status: 'revised' },
  },
  {
    id: 'exam-upsc-cse-2026',
    source: 'UPSC',
    examName: 'UPSC CSE 2026',
    versionCount: 5,
    updatedAt: new Date().toISOString(),
    current: { status: 'admit-card-live' },
  },
];

const FALLBACK_USER: UserDoc = {
  _id: 'fallback-user',
  name: 'Demo Aspirant',
  telegramChatId: null,
  whatsappNumber: null,
  email: null,
  prefs: {
    sources: ['SSC', 'RRB', 'TNPSC', 'UPSC'],
    exams: ['SSC CGL', 'RRB NTPC', 'UPSC CSE'],
    types: ['date_change', 'corrigendum', 'admit_card'],
    channels: { telegram: true, whatsapp: false, email: false },
  },
};

export default function App() {
  const [tab, setTab] = useState<TabName>('feed');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [changes, setChanges] = useState<ExamChange[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [exams, setExams] = useState<ExamDoc[]>([]);
  const [examDetail, setExamDetail] = useState<ExamDetail | null>(null);
  const [user, setUser] = useState<UserDoc | null>(null);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [inspectingChange, setInspectingChange] = useState<ExamChange | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'info' | 'error'; msg: string } | null>(null);

  const autoSeededRef = useRef(false);

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('exam-theme');
    const nextTheme = savedTheme === 'light' ? 'light' : prefersDark ? 'dark' : 'light';
    setTheme(nextTheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('exam-theme', theme);
  }, [theme]);

  const showToast = useCallback((t: { kind: 'success' | 'info' | 'error'; msg: string }) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const loadFeed = useCallback(async () => {
    try {
      const [ch, st, src] = await Promise.all([
        fetch(`${API_BASE}/changes?page=1`).then((response) => response.json()),
        fetch(`${API_BASE}/stats`).then((response) => response.json()),
        fetch(`${API_BASE}/sources`).then((response) => response.json()),
      ]);
      const nextChanges = dedupeChanges(ch.changes ?? []);
      setChanges(nextChanges);
      setStats(st);
      setSources(src.sources ?? []);
      setLastSynced(new Date().toISOString());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch';
      console.warn('Failed to load feed:', message);
      setChanges(dedupeChanges(FALLBACK_CHANGES));
      setStats(FALLBACK_STATS);
      setSources(FALLBACK_SOURCES);
      setLastSynced(new Date().toISOString());
    }
  }, []);

  const loadKB = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/exams`);
      if (!response.ok) throw new Error('Failed to fetch exams');
      const data = await response.json();
      setExams(data.exams ?? []);
    } catch {
      setExams(FALLBACK_EXAMS);
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUser(data.users?.[0] ?? null);
    } catch {
      setUser(FALLBACK_USER);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadFeed(), loadKB(), loadUser()]);
    } finally {
      setLoading(false);
    }
  }, [loadFeed, loadKB, loadUser]);

  const openExam = async (id: string) => {
    try {
      const d = await (await fetch(`${API_BASE}/exams/${id}`)).json();
      setExamDetail(d.exam);
    } catch {
      setExamDetail(null);
    }
  };

  const checkNow = async () => {
    setChecking(true);
    try {
      const response = await fetch(`${API_BASE}/check-now`, { method: 'POST' });
      if (!response.ok) throw new Error('Check execution failed');
      const data = await response.json();
      const totalNew = (data.results ?? []).reduce((count: number, result: { newChanges?: number }) => count + (result.newChanges ?? 0), 0);
      await loadAll();
      showToast(
        totalNew > 0
          ? { kind: 'success', msg: `Scan finished! Found ${totalNew} new exam update${totalNew > 1 ? 's' : ''}.` }
          : { kind: 'info', msg: 'Scan complete — all monitored boards are up to date.' }
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Check failed';
      setChanges(FALLBACK_CHANGES);
      setStats(FALLBACK_STATS);
      setSources(FALLBACK_SOURCES);
      showToast({ kind: 'error', msg: `${message} — using offline demo data.` });
    } finally {
      setChecking(false);
    }
  };

  const seedDemo = useCallback(async () => {
    setSeeding(true);
    try {
      const response = await fetch(`${API_BASE}/demo/seed`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to seed demo notices');
      const data = await response.json();
      await loadAll();
      showToast({ kind: 'success', msg: `Seeded ${data.count} realistic updates across the major exam boards.` });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Demo seeding failed';
      setChanges(FALLBACK_CHANGES);
      setStats(FALLBACK_STATS);
      setSources(FALLBACK_SOURCES);
      showToast({ kind: 'info', msg: `${message} — demo data loaded locally.` });
    } finally {
      setSeeding(false);
    }
  }, [loadAll, showToast]);

  useEffect(() => {
    if (!loading && changes.length === 0 && !seeding && !autoSeededRef.current) {
      autoSeededRef.current = true;
      void seedDemo();
    }
  }, [loading, changes.length, seeding, seedDemo]);

  useEffect(() => {
    loadAll();

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource(`${API_BASE}/stream`);
        eventSource.onopen = () => setSseConnected(true);

        eventSource.addEventListener('exam_update', (event) => {
          try {
            const newChange: ExamChange = JSON.parse(event.data);
            setChanges((prev) => dedupeChanges([newChange, ...prev.filter((c) => c._id !== newChange._id)]));
            showToast({ kind: 'info', msg: `Live Update: ${newChange.summary}` });
            void loadFeed();
            void loadKB();
          } catch {
            // ignore parse issues
          }
        });

        eventSource.addEventListener('agent_log', (event) => {
          try {
            const logItem: AgentLog = JSON.parse(event.data);
            setAgentLogs((prev) => [logItem, ...prev.slice(0, 99)]);
          } catch {
            // ignore parse issues
          }
        });

        eventSource.onerror = () => {
          setSseConnected(false);
          eventSource?.close();
          reconnectTimer = setTimeout(connectSSE, 3000);
        };
      } catch {
        setSseConnected(false);
      }
    };

    connectSSE();
    const pollId = window.setInterval(() => {
      void loadAll();
    }, 60000);

    return () => {
      eventSource?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearInterval(pollId);
    };
  }, [loadAll, loadFeed, loadKB, showToast]);

  const pageContent = (() => {
    if (tab === 'feed') {
      return (
        <FeedView
          changes={changes}
          stats={stats}
          sources={sources}
          examsCount={exams.length}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
          search={search}
          setSearch={setSearch}
          loading={loading}
          checking={checking}
          onCheckNow={checkNow}
          onSeedDemo={seedDemo}
          onInspect={(c) => setInspectingChange(c)}
        />
      );
    }

    if (tab === 'kb') {
      return (
        <KnowledgeBaseView
          exams={exams}
          examDetail={examDetail}
          onSelectExam={openExam}
          loading={loading}
        />
      );
    }

    if (tab === 'console') {
      return (
        <AgentConsole
          logs={agentLogs}
          onClear={() => setAgentLogs([])}
          onTriggerScan={checkNow}
          checking={checking}
        />
      );
    }

    if (tab === 'telegram') {
      return <TelegramSimulator apiBase={API_BASE} />;
    }

    return (
      <PreferencesView
        user={user}
        apiBase={API_BASE}
        onSaved={loadUser}
        showToast={showToast}
      />
    );
  })();

  const CurrentTabIcon = tabMeta.find((item) => item.id === tab)?.icon ?? LayoutGrid;

  return (
    <div className="min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] shrink-0 border-r border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl md:flex md:flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E11D48] via-[#F97316] to-[#F6B26B] shadow-[0_0_35px_rgba(225,29,72,0.18)]">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight text-[var(--text)]">GovExam</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">AI monitor</div>
            </div>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {tabMeta.map(({ id, label, icon: Icon, description }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all ${
                    active
                      ? 'border-[#E11D48]/40 bg-[#FDE7EE] text-[var(--text)] shadow-[0_0_22px_rgba(225,29,72,0.08)]'
                      : 'border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--surface-elevated)]'
                  }`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? 'bg-[#FDE7EE] text-[#E11D48]' : 'bg-[var(--surface-alt)] text-[var(--muted)]'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-[10px] text-[var(--muted)]">{description}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="m-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
              <span className={`h-2.5 w-2.5 rounded-full ${sseConnected ? 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]' : 'bg-amber-400'}`} />
              Live status
            </div>
            <div className="mt-3 text-sm font-medium text-[var(--text)]">{sseConnected ? 'Stream online' : 'Reconnecting'}</div>
            <div className="mt-1 text-xs text-[var(--muted)]">
              {lastSynced ? `Last sync ${new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Awaiting first sync'}
            </div>
            <div className="mt-4 inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
              Demo data
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col md:pl-[260px]">
          <Header
            title={tabMeta.find((item) => item.id === tab)?.label ?? 'Feed'}
            description={tabMeta.find((item) => item.id === tab)?.description ?? 'Live monitoring'}
            icon={CurrentTabIcon}
            checking={checking}
            onCheckNow={checkNow}
            onSeedDemo={seedDemo}
            seeding={seeding}
            lastSynced={lastSynced}
            sseConnected={sseConnected}
            theme={theme}
            setTheme={setTheme}
            search={search}
            setSearch={setSearch}
          />

          <main className="mx-auto w-full max-w-[1280px] flex-1 overflow-y-auto px-4 py-5 md:px-6 xl:px-8">
            {pageContent}
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/90 px-2 py-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-md justify-between gap-2">
          {tabMeta.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] ${
                tab === id ? 'bg-[#FDE7EE] text-[#E11D48]' : 'text-[var(--muted)]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <DetailDrawer change={inspectingChange} onClose={() => setInspectingChange(null)} />

      <Toaster position="top-right" richColors closeButton />

      {toast && (
        <div className={`fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-2xl border border-[#F0DDD0] bg-[var(--surface)] px-4 py-3 text-sm shadow-[0_20px_45px_rgba(225,29,72,0.12)] md:bottom-6 md:right-6 ${toast.kind === 'success' ? 'text-[#059669]' : toast.kind === 'error' ? 'text-[#DC2626]' : 'text-[var(--text)]'}`}>
          <span className="text-base">{toast.kind === 'success' ? '✅' : toast.kind === 'error' ? '❌' : '🔔'}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
