import React, { useState } from 'react';
import { MessageSquareText, SendHorizontal } from 'lucide-react';

interface TelegramSimulatorProps {
  apiBase: string;
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export const TelegramSimulator: React.FC<TelegramSimulatorProps> = ({ apiBase }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Welcome to GovExam Alerts. Send /start, /myexams, /subscribe SSC, or /latest SSC to try the command flows.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickCommands = ['/start', '/myexams', '/subscribe SSC', '/latest SSC', '/check', '/help'];

  const sendCommand = async (cmdText: string) => {
    const textToSend = cmdText.trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/bot/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: textToSend }),
      });

      const data = await res.json();
      const botMsg: Message = {
        sender: 'bot',
        text: data.reply || 'No response from bot.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Bot service unavailable. Ensure the backend is running.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between gap-3 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FDE7EE] to-[#F9E6D6] text-[#E11D48]">
            <MessageSquareText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-semibold text-[var(--text)]">Telegram bot simulator</div>
            <div className="text-sm text-[var(--muted)]">Test the command router and alerts in-browser</div>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Bot online
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#E11D48] to-[#F97316] text-sm font-semibold text-white">G</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
              GovExam Alerts Bot
              <span className="rounded-full border border-[#E11D48]/30 bg-[#FDE7EE] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-[#E11D48]">Bot</span>
            </div>
            <div className="text-[11px] text-[var(--muted)]">@GovExamTrackerBot • Active</div>
          </div>
          <div className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
        </div>

        <div className="flex h-[440px] flex-col bg-[var(--surface)]">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={`${message.time}-${index}`} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${message.sender === 'user' ? 'rounded-br-md bg-gradient-to-r from-[#E11D48] to-[#F97316] text-white' : 'rounded-bl-md border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text)]'}`}>
                  {message.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[11px] text-[var(--muted)]">
                  Bot typing
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[var(--border)] bg-[var(--surface-alt)] p-3">
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {quickCommands.map((command) => (
                <button key={command} onClick={() => sendCommand(command)} className="whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[10px] font-medium text-[var(--muted)] transition hover:text-[var(--text)]">
                  {command}
                </button>
              ))}
            </div>

            <form onSubmit={(event) => { event.preventDefault(); void sendCommand(input); }} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type a command..."
                className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[#E11D48] focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
              />
              <button type="submit" disabled={!input.trim() || loading} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[#E11D48] to-[#F97316] text-white disabled:opacity-60">
                <SendHorizontal className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
