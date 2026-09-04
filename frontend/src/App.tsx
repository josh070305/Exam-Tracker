import { useEffect, useCallback, useState } from 'react';
import { Header } from './components/Header';
import { FeedView } from './components/FeedView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { AgentConsole } from './components/AgentConsole';
import { TelegramSimulator } from './components/TelegramSimulator';
import { PreferencesView } from './components/PreferencesView';
import { DetailDrawer } from './components/DetailDrawer';
import { ExamChange, Stats, SourceInfo, ExamDoc, ExamDetail, UserDoc, AgentLog } from './types';

const API_BASE = 'http://127.0.0.1:5000/api';

export default function App() {
  const [tab, setTab] = useState<'feed' | 'kb' | 'console' | 'telegram' | 'prefs'>('feed');
  const [changes, setChanges] = useState<ExamChange[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [exams, setExams] = useState<ExamDoc[]>([]);
  const [examDetail, setExamDetail] = useState<ExamDetail | null>(null);
  const [user, setUser] = useState<UserDoc | null>(null);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [inspectingChange, setInspectingChange] = useState<ExamChange | null>(null);

  // Filters & UI State
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'info' | 'error'; msg: string } | null>(null);

  const showToast = useCallback((t: { kind: 'success' | 'info' | 'error'; msg: string }) => {
    setToast(t);
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch Feed & Stats
  const loadFeed = useCallback(async () => {
    try {
      const [ch, st, src] = await Promise.all([
        fetch(`${API_BASE}/changes?page=1`).then((r) => r.json()),
        fetch(`${API_BASE}/stats`).then((r) => r.json()),
        fetch(`${API_BASE}/sources`).then((r) => r.json()),
      ]);
      setChanges(ch.changes ?? []);
      setStats(st);
      setSources(src.sources ?? []);
      setLastSynced(new Date().toISOString());
    } catch (e: any) {
      console.warn('Failed to load feed:', e.message);
    }
  }, []);

  // Fetch Knowledge Base
  const loadKB = useCallback(async () => {
    try {
      const d = await (await fetch(`${API_BASE}/exams`)).json();
      setExams(d.exams ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  // Fetch User Preferences
  const loadUser = useCallback(async () => {
    try {
      const d = await (await fetch(`${API_BASE}/users`)).json();
      setUser(d.users?.[0] ?? null);
    } catch {
      /* ignore */
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

  // Open single exam in KB
  const openExam = async (id: string) => {
    try {
      const d = await (await fetch(`${API_BASE}/exams/${id}`)).json();
      setExamDetail(d.exam);
    } catch {
      setExamDetail(null);
    }
  };

  // Trigger manual live portal check
  const checkNow = async () => {
    setChecking(true);
    try {
      const res = await fetch(`${API_BASE}/check-now`, { method: 'POST' });
      if (!res.ok) throw new Error('Check execution failed');
      const data = await res.json();
      const totalNew = (data.results ?? []).reduce(
        (a: number, r: any) => a + (r.newChanges ?? 0),
        0
      );
      await loadAll();
      showToast(
        totalNew > 0
          ? { kind: 'success', msg: `Scan finished! Found ${totalNew} new exam update${totalNew > 1 ? 's' : ''}.` }
          : { kind: 'info', msg: 'Scan complete — all monitored boards are up to date.' }
      );
    } catch (e: any) {
      showToast({ kind: 'error', msg: e.message || 'Check failed' });
    } finally {
      setChecking(false);
    }
  };

  // Trigger instant demo data seed
  const seedDemo = async () => {
    setSeeding(true);
    try {
      const res = await fetch(`${API_BASE}/demo/seed`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to seed demo notices');
      const data = await res.json();
      await loadAll();
      showToast({
        kind: 'success',
        msg: `Seeded ${data.count} realistic Indian exam notices with official PDFs! 🌱`,
      });
    } catch (e: any) {
      showToast({ kind: 'error', msg: e.message || 'Demo seeding failed' });
    } finally {
      setSeeding(false);
    }
  };

  // Real-time Server-Sent Events (SSE) Listener
  useEffect(() => {
    loadAll();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE}/stream`);

      eventSource.onopen = () => {
        setSseConnected(true);
      };

      // Live exam updates
      eventSource.addEventListener('exam_update', (event) => {
        try {
          const newChange: ExamChange = JSON.parse(event.data);
          setChanges((prev) => [newChange, ...prev.filter((c) => c._id !== newChange._id)]);
          showToast({ kind: 'info', msg: `Live Update: ${newChange.summary}` });
          loadFeed();
          loadKB();
        } catch {}
      });

      // Live agent reasoning and scraping logs
      eventSource.addEventListener('agent_log', (event) => {
        try {
          const logItem: AgentLog = JSON.parse(event.data);
          setAgentLogs((prev) => [logItem, ...prev.slice(0, 99)]);
        } catch {}
      });

      eventSource.onerror = () => {
        setSseConnected(false);
      };
    } catch {
      setSseConnected(false);
    }

    // Fallback polling every 60s
    const pollId = setInterval(() => {
      loadAll();
    }, 60000);

    return () => {
      eventSource?.close();
      clearInterval(pollId);
    };
  }, [loadAll, loadFeed, loadKB, showToast]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        tab={tab}
        setTab={setTab}
        checking={checking}
        onCheckNow={checkNow}
        onSeedDemo={seedDemo}
        seeding={seeding}
        lastSynced={lastSynced}
        sseConnected={sseConnected}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {tab === 'feed' && (
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
        )}

        {tab === 'kb' && (
          <KnowledgeBaseView
            exams={exams}
            examDetail={examDetail}
            onSelectExam={openExam}
            loading={loading}
          />
        )}

        {tab === 'console' && (
          <AgentConsole
            logs={agentLogs}
            onClear={() => setAgentLogs([])}
            onTriggerScan={checkNow}
            checking={checking}
          />
        )}

        {tab === 'telegram' && <TelegramSimulator apiBase={API_BASE} />}

        {tab === 'prefs' && (
          <PreferencesView
            user={user}
            apiBase={API_BASE}
            onSaved={loadUser}
            showToast={showToast}
          />
        )}
      </main>

      {/* Slide-over Inspection Drawer */}
      <DetailDrawer
        change={inspectingChange}
        onClose={() => setInspectingChange(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        GovExam Tracker • Autonomous Multi-Board Government Recruitment Intelligence & Real-Time Alert System
      </footer>

      {/* Floating Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-semibold text-white animate-fade flex items-center gap-2 ${
            toast.kind === 'success'
              ? 'bg-emerald-600'
              : toast.kind === 'error'
              ? 'bg-rose-600'
              : 'bg-slate-900 border border-slate-700'
          }`}
        >
          <span>{toast.kind === 'success' ? '✅' : toast.kind === 'error' ? '❌' : '🔔'}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
