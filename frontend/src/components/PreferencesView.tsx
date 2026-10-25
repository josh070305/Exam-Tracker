import React, { useState, useEffect } from 'react';
import { BellRing, Mail, MessageSquareText, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';
import { UserDoc, SOURCES, TYPES } from '../types';

interface PreferencesViewProps {
  user: UserDoc | null;
  apiBase: string;
  onSaved: () => void;
  showToast: (t: { kind: 'success' | 'info' | 'error'; msg: string }) => void;
}

export const PreferencesView: React.FC<PreferencesViewProps> = ({ user, apiBase, onSaved, showToast }) => {
  const [sources, setSources] = useState<string[]>(user?.prefs?.sources ?? []);
  const [exams, setExams] = useState<string>((user?.prefs?.exams ?? []).join(', '));
  const [types, setTypes] = useState<string[]>(user?.prefs?.types ?? []);
  const [channels, setChannels] = useState(user?.prefs?.channels ?? { telegram: true, whatsapp: false, email: false });
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

  const toggleSource = (source: string) => {
    setSources((prev) => (prev.includes(source) ? prev.filter((item) => item !== source) : [...prev, source]));
  };

  const toggleType = (type: string) => {
    setTypes((prev) => (prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]));
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const profileResponse = await fetch(`${apiBase}/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramChatId, whatsappNumber, email }),
      });
      if (!profileResponse.ok) throw new Error('Failed to update contact channels');

      const preferencesResponse = await fetch(`${apiBase}/users/${user._id}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources,
          exams: exams.split(',').map((item) => item.trim()).filter(Boolean),
          types,
          channels,
        }),
      });
      if (!preferencesResponse.ok) throw new Error('Failed to update preferences');

      showToast({ kind: 'success', msg: 'Alert preferences saved successfully.' });
      onSaved();
    } catch (err: any) {
      showToast({ kind: 'error', msg: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] md:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F9DDE4] to-[#FDE5D3] text-[#E11D48]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-semibold text-[var(--text)]">Notification preferences</div>
            <div className="text-sm text-[var(--muted)]">Configure boards, keyword filters, and delivery channels</div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-5">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text)]"><BellRing className="h-4 w-4 text-emerald-400" /> Alert channels</div>
              <div className="space-y-3">
                {[
                  { key: 'telegram', label: 'Telegram', Icon: MessageSquareText, active: channels.telegram },
                  { key: 'whatsapp', label: 'WhatsApp', Icon: Smartphone, active: channels.whatsapp },
                  { key: 'email', label: 'Email', Icon: Mail, active: channels.email },
                ].map(({ key, label, Icon, active }) => (
                  <label key={key} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-alt)] text-[var(--text)]"><Icon className="h-4 w-4" /></span>
                      <span className="text-sm font-medium text-[var(--text)]">{label}</span>
                    </div>
                    <input type="checkbox" checked={active} onChange={(event) => setChannels((prev) => ({ ...prev, [key]: event.target.checked }))} className="h-4 w-4 accent-[#E11D48]" />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text)]"><Sparkles className="h-4 w-4 text-[#E11D48]" /> Boards to watch</div>
              <div className="flex flex-wrap gap-2">
                {SOURCES.map((source) => {
                  const active = sources.includes(source);
                  return (
                    <button key={source} onClick={() => toggleSource(source)} className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${active ? 'border-[#E11D48]/40 bg-[#FDE7EE] text-[#4A2C3F]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]'}`}>
                      {source}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4">
              <div className="mb-3 text-sm font-medium text-[var(--text)]">Contact details</div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">Telegram chat ID</label>
                  <input value={telegramChatId} onChange={(event) => setTelegramChatId(event.target.value)} placeholder="e.g. 7171410498" className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[#E11D48] focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">WhatsApp number</label>
                  <input value={whatsappNumber} onChange={(event) => setWhatsappNumber(event.target.value)} placeholder="+91..." className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[#E11D48] focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">Email address</label>
                  <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[#E11D48] focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4">
              <div className="mb-3 text-sm font-medium text-[var(--text)]">Alert categories</div>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((type) => {
                  const active = types.includes(type.key);
                  return (
                    <button key={type.key} onClick={() => toggleType(type.key)} className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${active ? 'border-[#E11D48]/40 bg-[#FDE7EE] text-[#4A2C3F]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]'}`}>
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] p-4">
              <div className="mb-2 text-sm font-medium text-[var(--text)]">Keywords</div>
              <textarea value={exams} onChange={(event) => setExams(event.target.value)} placeholder="SSC CGL, UPSC CSE, IBPS PO..." className="min-h-[96px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[#E11D48] focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={save} disabled={saving || !user} className="rounded-xl bg-gradient-to-r from-[#E11D48] to-[#F97316] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(225,29,72,0.18)] disabled:opacity-60">
            {saving ? 'Saving...' : 'Save preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};
