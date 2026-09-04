import React, { useState } from 'react';

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
      text:
        '👋 Welcome to the interactive Telegram Bot simulator! Send any command like `/start`, `/myexams`, `/subscribe SSC`, or `/latest SSC` to test the bot live.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickCommands = [
    '/start',
    '/myexams',
    '/subscribe SSC',
    '/latest SSC',
    '/check',
    '/help',
  ];

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
        {
          sender: 'bot',
          text: '❌ Bot simulation service unavailable. Ensure backend is running.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade">
      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>💬</span>
            <span>Interactive Telegram Bot Simulator</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Test the command router, automated responses, and subscription workflows directly in your browser.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Bot Online
        </span>
      </div>

      {/* Telegram Chat Mock Window */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[580px]">
        {/* Chat App Header */}
        <div className="bg-slate-800/90 backdrop-blur px-5 py-3.5 border-b border-slate-700 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow">
            ✈️
          </div>
          <div>
            <div className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>GovExam Alerts Bot</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-semibold">
                BOT
              </span>
            </div>
            <div className="text-[11px] text-sky-400 font-medium">@GovExamTrackerBot • Active</div>
          </div>
        </div>

        {/* Message Bubble Feed */}
        <div className="flex-1 p-5 space-y-3.5 overflow-y-auto bg-slate-950/70">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">{m.time}</span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-1.5 bg-slate-800 text-slate-400 px-3.5 py-2 rounded-2xl w-fit text-xs animate-pulse">
              <span>Bot typing</span>
              <span className="animate-bounce">.</span>
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] text-slate-500 whitespace-nowrap font-medium">Try:</span>
          {quickCommands.map((cmd) => (
            <button
              key={cmd}
              onClick={() => sendCommand(cmd)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono whitespace-nowrap transition border border-slate-700"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendCommand(input);
          }}
          className="p-3.5 bg-slate-850 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a command (e.g. /subscribe SSC, /latest, /myexams)..."
            className="flex-1 bg-slate-900 text-slate-100 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
