import React, { useState, useEffect } from 'react';
import { UserDoc, SOURCES, TYPES } from '../types';

interface PreferencesViewProps {
  user: UserDoc | null;
  apiBase: string;
  onSaved: () => void;
  showToast: (t: { kind: 'success' | 'info' | 'error'; msg: string }) => void;
}

export const PreferencesView: React.FC<PreferencesViewProps> = ({
  user,
  apiBase,
  onSaved,
  showToast,
}) => {
  const [sources, setSources] = useState<string[]>(user?.prefs?.sources ?? []);
  const [exams, setExams] = useState<string>((user?.prefs?.exams ?? []).join(', '));
  const [types, setTypes] = useState<string[]>(user?.prefs?.types ?? []);
  const [channels, setChannels] = useState(
    user?.prefs?.channels ?? { telegram: true, whatsapp: false, email: false }
  );
  const [telegramChatId, setTelegramChatId] = useState<string>(user?.telegramChatId ?? '');
  const [whatsappNumber, setWhatsappNumber] = useState<string>(user?.whatsappNumber ?? '');
  const [email, setEmail] = useState<string>(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setSources(user.prefs?.sources ?? []);
      setExams((user.prefs?.exams ?? []).join(', '));
      setTypes(user.prefs?.types ?? []);
      setChannels(user.prefs?.channels ?? { telegram: true, whatsapp: false, email: false });
      setTelegramChatId(user.telegramChatId ?? '');
      setWhatsappNumber(user.whatsappNumber ?? '');
      setEmail(user.email ?? '');
    }
  }, [user]);

  const toggleSource = (s: string) => {
    setSources((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const toggleType = (t: string) => {
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // 1. Update contact channels
      const profRes = await fetch(`${apiBase}/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramChatId, whatsappNumber, email }),
      });
      if (!profRes.ok) throw new Error('Failed to update contact channels');

      // 2. Update alert preferences
      const prefRes = await fetch(`${apiBase}/users/${user._id}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources,
          exams: exams.split(',').map((s) => s.trim()).filter(Boolean),
          types,
          channels,
        }),
      });
      if (!prefRes.ok) throw new Error('Failed to update preferences');

      showToast({ kind: 'success', msg: 'Alert preferences saved successfully! ✅' });
      onSaved();
    } catch (err: any) {
      showToast({ kind: 'error', msg: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade">
      <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 shadow-2xl p-6 sm:p-8 backdrop-blur-md">
        <div className="border-b border-zinc-800/80 pb-5">
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <span>⚙️</span>
            <span>Aspirant Notification Profile & Channel Routing</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Configure customized exam keyword filters and automated multi-channel alert delivery.
          </p>
        </div>

        {/* Channels Credentials */}
        <div className="mt-6 space-y-4">
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
            Dispatch Channels & Contact Info
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Telegram Chat ID
              </label>
              <input
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="e.g. 7171410498"
                className="w-full text-xs sm:text-sm border border-zinc-800 rounded-xl px-3.5 py-2.5 bg-zinc-950 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                From @RawDataBot or send <code className="bg-zinc-800 px-1 py-0.2 rounded text-zinc-300">/start</code> in the Telegram bot.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                WhatsApp Number (E.164)
              </label>
              <input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+919876543210"
                className="w-full text-xs sm:text-sm border border-zinc-800 rounded-xl px-3.5 py-2.5 bg-zinc-950 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono"
              />
              <p className="text-[10px] text-zinc-500 mt-1">Twilio WhatsApp Sandbox format</p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Email Address
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aspirant@example.com"
                className="w-full text-xs sm:text-sm border border-zinc-800 rounded-xl px-3.5 py-2.5 bg-zinc-950 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Recruitment Boards Filter */}
        <div className="mt-6">
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
            Recruitment Boards to Watch
          </h3>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {SOURCES.map((s) => {
              const active = sources.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSource(s)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition ${
                    active
                      ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Specific Exam Keywords */}
        <div className="mt-6">
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
            Specific Exam Keywords (Substring Filter)
          </h3>
          <input
            value={exams}
            onChange={(e) => setExams(e.target.value)}
            placeholder="e.g. SSC CGL, RRB NTPC, UPSC CSE, TNPSC Group 2"
            className="mt-2 w-full text-xs sm:text-sm border border-zinc-800 rounded-xl px-3.5 py-2.5 bg-zinc-950 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500"
          />
          <p className="text-[10px] text-zinc-500 mt-1">
            Comma-separated. Leave empty to receive alerts for all exams under selected boards.
          </p>
        </div>

        {/* Change Types Filter */}
        <div className="mt-6">
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
            Alert Categories
          </h3>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {TYPES.map((t) => {
              const active = types.includes(t.key);
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => toggleType(t.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    active
                      ? 'bg-zinc-100 text-zinc-900 font-bold shadow'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Dispatch Channels */}
        <div className="mt-6">
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
            Active Alert Channels
          </h3>
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['telegram', 'whatsapp', 'email'] as const).map((ch) => (
              <label
                key={ch}
                className="flex items-center gap-2.5 p-3.5 rounded-xl border border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition bg-zinc-950/60"
              >
                <input
                  type="checkbox"
                  checked={channels[ch]}
                  onChange={(e) =>
                    setChannels((prev) => ({ ...prev, [ch]: e.target.checked }))
                  }
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 bg-zinc-900 border-zinc-700"
                />
                <span className="text-xs font-bold uppercase text-zinc-300 font-mono">{ch}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Save Action */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center justify-end">
          <button
            onClick={save}
            disabled={saving || !user}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] active:scale-95 disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};
