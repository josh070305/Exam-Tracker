import { useEffect, useCallback, useRef, useState } from 'react';

const API_BASE = 'http://127.0.0.1:5000/api';

type ChangeType =
  | 'new_exam'
  | 'date_change'
  | 'admit_card'
  | 'result'
  | 'eligibility_revised'
  | 'corrigendum';

interface ExamChange {
  _id: string;
  source: string;
  examName: string | null;
  changeType: ChangeType;
  changedField: string | null;
  oldValue: string | null;
  newValue: string | null;
  effectiveDate: string | null;
  summary: string;
  detectedAt: string;
  contentHash: string;
  rawSnippet?: string;
}

interface Stats { total: number; byType: Record<string, number>; bySource: Record<string, number>; lastChecked: Record<string, string>; }
interface SourceInfo { source: string; lastContentHash: string | null; lastCheckedAt: string; }
interface ExamDoc { id: string; source: string; examName: string | null; versionCount: number; updatedAt: string; current: any; }
interface ExamDetail { _id: string; source: string; examName: string | null; versions: any[]; current: any; }
interface UserPrefs { sources: string[]; exams: string[]; types: string[]; channels: { telegram: boolean; whatsapp: boolean; email: boolean } }
interface UserDoc { _id: string; name: string; telegramChatId: string | null; whatsappNumber: string | null; email: string | null; prefs: UserPrefs }

const SOURCES = ['SSC', 'RRB', 'TNPSC', 'UPSC', 'IBPS', 'SBI'];

const TYPES: { key: ChangeType; label: string; bar: string; badge: string; dot: string }[] = [
  { key: 'new_exam', label: 'New Exam', bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { key: 'date_change', label: 'Date Change', bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  { key: 'admit_card', label: 'Admit Card', bar: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  { key: 'result', label: 'Result', bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  { key: 'eligibility_revised', label: 'Eligibility', bar: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  { key: 'corrigendum', label: 'Corrigendum', bar: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
];
const TYPE_MAP = Object.fromEntries(TYPES.map((t) => [t.key, t]));

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 45) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}
function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function Spinner() {
  return (<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>);
}
function BellIcon() {
  return (<svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a6 6 0 00-6 6v3.6l-1.5 3A1 1 0 005.4 16h13.2a1 1 0 00.9-1.4L18 11.6V8a6 6 0 00-6-6zm0 20a3 3 0 002.8-2h-5.6A3 3 0 0012 22z" /></svg>);
}
function StatCard({ label, value, hint, accent }: { label: string; value: string; hint: string; accent: string }) {
  return (<div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span><span className={`h-2.5 w-2.5 rounded-full ${accent}`} /></div><div className="mt-2 text-2xl font-bold text-gray-900">{value}</div><div className="mt-1 text-xs text-gray-400">{hint}</div></div>);
}
function TypeChart({ stats, total }: { stats: Stats | null; total: number }) {
  const max = Math.max(1, ...TYPES.map((t) => stats?.byType?.[t.key] ?? 0));
  return (<div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"><h3 className="text-sm font-semibold text-gray-900 mb-4">Updates by Type</h3><div className="space-y-3">{TYPES.map((t) => { const c = stats?.byType?.[t.key] ?? 0; const pct = Math.round((c / max) * 100); return (<div key={t.key}><div className="flex items-center justify-between text-xs mb-1"><span className="text-gray-600 font-medium">{t.label}</span><span className="text-gray-400">{c}</span></div><div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden"><div className={`h-full rounded-full ${t.bar} transition-all duration-700`} style={{ width: `${pct}%` }} /></div></div>); })}</div>{total === 0 && <p className="text-xs text-gray-400 mt-4">No data yet — run a check.</p>}</div>);
}
function SourceStatus({ sources, stats }: { sources: SourceInfo[]; stats: Stats | null }) {
  const list = sources.length ? sources : SOURCES.map((s) => ({ source: s, lastContentHash: null, lastCheckedAt: '' }));
  return (<div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"><h3 className="text-sm font-semibold text-gray-900 mb-4">Source Status ({list.length})</h3><div className="space-y-3">{list.map((s) => { const checked = stats?.lastChecked?.[s.source]; return (<div key={s.source} className="flex items-center justify-between"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${checked ? 'bg-emerald-500' : 'bg-gray-300'}`} /><span className="text-sm font-medium text-gray-800">{s.source}</span></div><span className="text-xs text-gray-400">{checked ? relativeTime(checked) : 'never'}</span></div>); })}</div></div>);
}
function ChangeCard({ c, open, onToggle }: { c: ExamChange; open: boolean; onToggle: () => void }) {
  const t = TYPE_MAP[c.changeType] ?? TYPES[0];
  return (<div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow animate-fade"><button onClick={onToggle} className="w-full text-left"><div className="flex items-center justify-between gap-3"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${t.badge}`}><span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />{t.label}</span><span className="text-xs text-gray-400 whitespace-nowrap">{relativeTime(c.detectedAt)}</span></div><p className="mt-2 text-sm text-gray-800 leading-snug">{c.summary}</p><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500"><span className="px-2 py-0.5 rounded-md bg-gray-100 font-medium">{c.source}</span>{c.examName && <span>📝 {c.examName}</span>}{c.effectiveDate && <span>📅 {formatDate(c.effectiveDate)}</span>}</div></button>{open && (<div className="mt-3 pt-3 border-t border-gray-100 text-xs space-y-1.5 text-gray-600"><div><span className="text-gray-400">Field:</span> {c.changedField ?? '—'}</div><div className="flex gap-2"><span className="text-gray-400">Value:</span><span className="text-rose-600 line-through">{c.oldValue ?? '—'}</span><span className="text-gray-300">→</span><span className="text-emerald-600">{c.newValue ?? '—'}</span></div><div><span className="text-gray-400">Detected:</span> {new Date(c.detectedAt).toLocaleString('en-IN')}</div>{c.rawSnippet && (<div><span className="text-gray-400">Snippet:</span><p className="mt-1 whitespace-pre-wrap break-words text-gray-500 bg-gray-50 rounded-md p-2 max-h-28 overflow-auto">{c.rawSnippet}</p></div>)}</div>)}</div>);
}

export default function App() {
  const [tab, setTab] = useState<'feed' | 'kb' | 'prefs'>('feed');
  const [changes, setChanges] = useState<ExamChange[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [exams, setExams] = useState<ExamDoc[]>([]);
  const [examDetail, setExamDetail] = useState<ExamDetail | null>(null);
  const [user, setUser] = useState<UserDoc | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'info' | 'error'; msg: string } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const tick = useRef(0);

  const showToast = useCallback((t: { kind: 'success' | 'info' | 'error'; msg: string }) => { setToast(t); setTimeout(() => setToast(null), 4000); }, []);

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
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
  }, []);

  const loadKB = useCallback(async () => {
    try { const d = await (await fetch(`${API_BASE}/exams`)).json(); setExams(d.exams ?? []); } catch { /* ignore */ }
  }, []);

  const loadUser = useCallback(async () => {
    try { const d = await (await fetch(`${API_BASE}/users`)).json(); setUser(d.users?.[0] ?? null); } catch { /* ignore */ }
  }, []);

  const loadAll = useCallback(async () => { setError(null); setLoading(true); try { await Promise.all([loadFeed(), loadKB(), loadUser()]); } finally { setLoading(false); } }, [loadFeed, loadKB, loadUser]);

  const checkNow = async () => {
    setChecking(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/check-now`, { method: 'POST' });
      if (!res.ok) throw new Error('Check failed');
      const data = await res.json();
      const totalNew = (data.results ?? []).reduce((a: number, r: any) => a + (r.newChanges ?? 0), 0);
      await loadAll();
      showToast(totalNew > 0 ? { kind: 'success', msg: `Found ${totalNew} new update${totalNew > 1 ? 's' : ''}!` } : { kind: 'info', msg: 'Check complete — no new updates.' });
    } catch (e) { setError(e instanceof Error ? e.message : 'Check failed'); showToast({ kind: 'error', msg: 'Check failed — is the backend running?' }); }
    finally { setChecking(false); }
  };

  const openExam = async (id: string) => { try { const d = await (await fetch(`${API_BASE}/exams/${id}`)).json(); setExamDetail(d.exam); } catch { setExamDetail(null); } };

  useEffect(() => { loadAll(); const id = setInterval(() => { tick.current += 1; loadAll(); }, 60000); return () => clearInterval(id); }, [loadAll]);

  const filtered = changes.filter((c) => {
    if (typeFilter !== 'all' && c.changeType !== typeFilter) return false;
    if (sourceFilter !== 'all' && c.source !== sourceFilter) return false;
    if (search && !`${c.summary} ${c.examName ?? ''} ${c.source}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-gray-900">
      <header className="sticky top-0 z-20 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur"><BellIcon /></div>
            <div><h1 className="text-lg font-bold leading-tight">Exam Update Tracker</h1><p className="text-xs text-white/80">Live monitoring of 6 recruitment boards</p></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-white/80">{lastSynced ? `Synced ${relativeTime(lastSynced)}` : 'Not synced'}</span>
            <button onClick={checkNow} disabled={checking} className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 rounded-lg text-sm font-semibold shadow hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed transition">{checking ? <Spinner /> : <span>⚡</span>}{checking ? 'Checking…' : 'Check Now'}</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-2 flex gap-1">
          {([['feed', '📰 Feed'], ['kb', '📚 Knowledge Base'], ['prefs', '⚙️ Preferences']] as const).map(([k, label]) => (
            <button key={k} onClick={() => { setTab(k); if (k === 'kb') loadKB(); if (k === 'prefs') loadUser(); }} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${tab === k ? 'bg-white text-indigo-700' : 'text-white/80 hover:text-white'}`}>{label}</button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (<div className="mb-4 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>)}

        {tab === 'feed' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Updates" value={`${stats?.total ?? 0}`} hint="All tracked changes" accent="bg-indigo-500" />
              <StatCard label="Boards Live" value={`${sources.filter((s) => s.lastCheckedAt).length || SOURCES.length}`} hint="Monitored websites" accent="bg-emerald-500" />
              <StatCard label="Exams Tracked" value={`${exams.length}`} hint="In knowledge base" accent="bg-violet-500" />
              <StatCard label="Corrigenda" value={`${stats?.byType?.corrigendum ?? 0}`} hint="Official corrections" accent="bg-orange-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
                    <h2 className="text-sm font-semibold text-gray-900">Recent Updates</h2>
                    <span className="text-xs text-gray-400">{filtered.length} shown</span>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search summary, exam…" className="ml-auto w-48 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  </div>
                  <div className="px-4 py-3 flex flex-wrap gap-1.5 border-b border-gray-100">
                    {[{ key: 'all', label: 'All Types' }, ...TYPES.map((t) => ({ key: t.key, label: t.label }))].map((t) => (
                      <button key={t.key} onClick={() => setTypeFilter(t.key)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${typeFilter === t.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t.label}</button>
                    ))}
                    <span className="mx-1 w-px bg-gray-200 self-stretch" />
                    {['all', ...SOURCES].map((s) => (
                      <button key={s} onClick={() => setSourceFilter(s)} className={`px-3 py-1 rounded-full text-xs font-medium transition ${sourceFilter === s ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s === 'all' ? 'All Sources' : s}</button>
                    ))}
                  </div>
                  <div className="p-4 space-y-3 max-h-[70vh] overflow-auto">
                    {loading ? (<div className="flex items-center justify-center py-10 text-gray-400 text-sm gap-2"><Spinner /> Loading…</div>)
                      : filtered.length === 0 ? (<div className="text-center py-12"><div className="text-4xl mb-3">🔔</div><p className="text-sm font-medium text-gray-700">No updates found</p><p className="text-xs text-gray-400 mt-1">{changes.length === 0 ? 'Run a check to start tracking notifications.' : 'Try clearing the filters or search.'}</p>{changes.length === 0 && (<button onClick={checkNow} disabled={checking} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">{checking ? <Spinner /> : '⚡'} Check Now</button>)}</div>)
                      : filtered.map((c) => (<ChangeCard key={c._id} c={c} open={openId === c._id} onToggle={() => setOpenId(openId === c._id ? null : c._id)} />))}
                  </div>
                </div>
              </section>
              <aside className="space-y-6">
                <TypeChart stats={stats} total={stats?.total ?? 0} />
                <SourceStatus sources={sources} stats={stats} />
              </aside>
            </div>
          </>
        )}

        {tab === 'kb' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-900">Tracked Exams ({exams.length})</h2><p className="text-xs text-gray-400 mt-1">Versioned knowledge base with full change history.</p></div>
              <div className="p-4 space-y-2 max-h-[70vh] overflow-auto">
                {exams.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No exams tracked yet. Run a check.</p>
                  : exams.map((e) => (<button key={e.id} onClick={() => openExam(e.id)} className="w-full text-left flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition"><div><div className="text-sm font-semibold text-gray-800">{e.examName ?? 'Unknown exam'}</div><div className="text-xs text-gray-400 mt-0.5">{e.source} · updated {relativeTime(e.updatedAt)}</div></div><span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">{e.versionCount} ver{e.versionCount === 1 ? '' : 's'}</span></button>))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-900">{examDetail ? `${examDetail.examName ?? 'Exam'} — History` : 'Change History'}</h2></div>
              <div className="p-4 space-y-3 max-h-[70vh] overflow-auto">
                {!examDetail && <p className="text-sm text-gray-400 text-center py-8">Select an exam to view its version history.</p>}
                {examDetail && (examDetail.versions || []).slice().reverse().map((v: any, i: number) => {
                  const t = TYPE_MAP[v.changeType as ChangeType] ?? TYPES[0];
                  return (<div key={i} className="relative pl-6 pb-4 border-l-2 border-gray-100 last:border-0 last:pb-0"><span className={`absolute -left-1.5 top-1 h-3 w-3 rounded-full ${t.dot}`} /><div className="flex items-center gap-2"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.badge}`}>{t.label}</span><span className="text-xs text-gray-400">{relativeTime(v.detectedAt)}</span></div><p className="mt-1 text-sm text-gray-800">{v.summary}</p>{v.oldValue || v.newValue ? (<div className="mt-1 text-xs flex gap-2 text-gray-500"><span className="text-rose-600 line-through">{v.oldValue ?? '—'}</span><span>→</span><span className="text-emerald-600">{v.newValue ?? '—'}</span></div>) : null}</div>);
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'prefs' && <Preferences user={user} onSaved={loadUser} />}
      </main>

      {toast && (<div className={`fixed bottom-5 right-5 z-30 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-fade ${toast.kind === 'success' ? 'bg-emerald-600' : toast.kind === 'error' ? 'bg-red-600' : 'bg-slate-800'}`}>{toast.msg}</div>)}
    </div>
  );
}

function Preferences({ user, onSaved }: { user: UserDoc | null; onSaved: () => void }) {
  const [sources, setSources] = useState<string[]>(user?.prefs?.sources ?? []);
  const [exams, setExams] = useState<string>((user?.prefs?.exams ?? []).join(', '));
  const [types, setTypes] = useState<string[]>(user?.prefs?.types ?? []);
  const [channels, setChannels] = useState(user?.prefs?.channels ?? { telegram: true, whatsapp: false, email: false });
  const [telegramChatId, setTelegramChatId] = useState<string>(user?.telegramChatId ?? '');
  const [whatsappNumber, setWhatsappNumber] = useState<string>(user?.whatsappNumber ?? '');
  const [email, setEmail] = useState<string>(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setSources(user?.prefs?.sources ?? []);
    setExams((user?.prefs?.exams ?? []).join(', '));
    setTypes(user?.prefs?.types ?? []);
    setChannels(user?.prefs?.channels ?? { telegram: true, whatsapp: false, email: false });
    setTelegramChatId(user?.telegramChatId ?? '');
    setWhatsappNumber(user?.whatsappNumber ?? '');
    setEmail(user?.email ?? '');
  }, [user]);

  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const save = async () => {
    if (!user) return;
    setSaving(true); setMsg(null);
    try {
      // Update profile fields (chat id, phone, email) via /users/:id
      const profRes = await fetch(`${API_BASE}/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramChatId, whatsappNumber, email }),
      });
      if (!profRes.ok) throw new Error('Save failed');
      // Update preferences (sources/exams/types/channels) via /preferences
      const prefRes = await fetch(`${API_BASE}/users/${user._id}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources, exams: exams.split(',').map((s) => s.trim()).filter(Boolean), types, channels }),
      });
      if (!prefRes.ok) throw new Error('Save failed');
      setMsg('Preferences saved ✅'); onSaved();
    } catch (e) { setMsg('Save failed — is the backend running?'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900">Aspirant Preferences</h2>
        <p className="text-xs text-gray-400 mt-1">Alerts are sent only for boards/exams/types you select, via the channels you enable.</p>
        {!user && <p className="text-sm text-amber-600 mt-4">No user found — the backend seeds a default aspirant on startup. Restart it if missing.</p>}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs font-semibold uppercase text-gray-500">Telegram Chat ID</h3>
            <input value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} placeholder="e.g. 7171410498" className="mt-2 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase text-gray-500">WhatsApp Number (E.164)</h3>
            <input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="e.g. +19124916053" className="mt-2 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="sm:col-span-2">
            <h3 className="text-xs font-semibold uppercase text-gray-500">Email</h3>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-2 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase text-gray-500">Boards to watch</h3>
          <div className="mt-2 flex flex-wrap gap-2">{SOURCES.map((s) => (<button key={s} onClick={() => setSources((p) => toggle(p, s))} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${sources.includes(s) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{s}</button>))}</div>
        </div>

        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase text-gray-500">Exam names (substring match)</h3>
          <input value={exams} onChange={(e) => setExams(e.target.value)} placeholder="e.g. SSC CGL, RRB NTPC, TNPSC Group 2" className="mt-2 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase text-gray-500">Change types</h3>
          <div className="mt-2 flex flex-wrap gap-2">{TYPES.map((t) => (<button key={t.key} onClick={() => setTypes((p) => toggle(p, t.key))} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${types.includes(t.key) ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{t.label}</button>))}</div>
        </div>

        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase text-gray-500">Alert channels</h3>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {(['telegram', 'whatsapp', 'email'] as const).map((ch) => (
              <label key={ch} className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 cursor-pointer">
                <input type="checkbox" checked={channels[ch]} onChange={(e) => setChannels((p) => ({ ...p, [ch]: e.target.checked }))} className="h-4 w-4 accent-indigo-600" />
                <span className="text-sm capitalize text-gray-700">{ch}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Telegram is configured via TELEGRAM_BOT_TOKEN. Add Twilio (WhatsApp) / SMTP (email) env vars to enable the others.</p>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button onClick={save} disabled={saving || !user} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Saving…' : 'Save Preferences'}</button>
          {msg && <span className="text-sm text-emerald-600">{msg}</span>}
        </div>
      </div>
    </div>
  );
}
