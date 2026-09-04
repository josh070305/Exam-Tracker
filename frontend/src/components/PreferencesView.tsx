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
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <div className="border-b border-slate-100 pb-5">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>⚙️</span>
            <span>Aspirant Notification Profile</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure customized exam filters and notification dispatch channels.
          </p>
        </div>

        {/* Channels Credentials */}
        <div className="mt-6 space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Dispatch Channels & Contact Info
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telegram Chat ID
              </label>
              <input
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="e.g. 7171410498 (or /start in bot)"
                className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Use your ID from @RawDataBot or send <code className="bg-slate-100 px-1 py-0.5 rounded">/start</code> to the bot.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp Phone Number
              </label>
              <input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="e.g. +919876543210"
                className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">E.164 format with country code (Twilio)</p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aspirant@example.com"
                className="w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Recruitment Boards Filter */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Recruitment Boards to Monitor
          </h3>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {SOURCES.map((s) => {
              const active = sources.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSource(s)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Specific Exam Keywords (Substring Filter)
          </h3>
          <input
            value={exams}
            onChange={(e) => setExams(e.target.value)}
            placeholder="e.g. SSC CGL, RRB NTPC, TNPSC Group 2, UPSC Prelims"
            className="mt-2 w-full text-sm border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Separate keywords with commas. Leave blank to receive alerts for all exams in selected boards.
          </p>
        </div>

        {/* Change Types Filter */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Change Types to Receive
          </h3>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {TYPES.map((t) => {
              const active = types.includes(t.key);
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => toggleType(t.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
            Active Notification Channels
          </h3>
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['telegram', 'whatsapp', 'email'] as const).map((ch) => (
              <label
                key={ch}
                className="flex items-center gap-2.5 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={channels[ch]}
                  onChange={(e) =>
                    setChannels((prev) => ({ ...prev, [ch]: e.target.checked }))
                  }
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold uppercase text-slate-700">{ch}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Save Action */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={save}
            disabled={saving || !user}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50 transition duration-200"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};
