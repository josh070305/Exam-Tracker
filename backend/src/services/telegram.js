const TelegramBot = require('node-telegram-bot-api');
const { env } = require('../config/env');
const User = require('../models/User');
const ExamChange = require('../models/ExamChange');

let bot = null;
let isPollingStarted = false;
let webhookRegistered = false;

function getDisplayType(changeType) {
  const raw = String(changeType || '').replace(/_/g, ' ');
  return raw.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function format(change) {
  const detected = new Date(change.detectedAt || Date.now()).toLocaleString('en-IN');
  const typeIcons = {
    new_exam: '📢',
    date_change: '🗓️',
    admit_card: '🎫',
    result: '🏆',
    eligibility_revised: '⚖️',
    corrigendum: '⚠️',
    NEW_NOTIFICATION: '📢',
    DATE_EXTENDED: '🗓️',
    EXAM_POSTPONED: '🕒',
    ADMIT_CARD: '🎫',
    RESULT: '🏆',
    SYLLABUS: '📚',
    CORRIGENDUM: '⚠️',
    OTHER: '🔔',
  };
  const token = String(change.changeType || '').toLowerCase();
  const icon = typeIcons[change.changeType] || typeIcons[token] || '🔔';

  let text = `${icon} *[${change.source}] ${getDisplayType(change.changeType)}*\n`;
  if (change.examName) text += `📌 *Exam:* ${change.examName}\n`;
  text += `📝 *Summary:* ${change.summary}\n`;

  if (change.oldValue || change.newValue) {
    text += `🔄 *Change:* ~${change.oldValue || 'None'}~ ➔ *${change.newValue || 'Updated'}*\n`;
  }
  if (change.effectiveDate || change.deadline) {
    const dateValue = change.effectiveDate || change.deadline;
    text += `📅 *Effective Date:* ${new Date(dateValue).toLocaleDateString('en-IN')}\n`;
  }
  if (change.pdfUrl) {
    text += `📄 *Notice PDF:* [Download Notice](${change.pdfUrl})\n`;
  }
  text += `🕒 *Detected:* ${detected}`;
  return text;
}

function buildStartKeyboard() {
  const boards = ['SSC', 'RRB', 'TNPSC', 'UPSC', 'IBPS', 'SBI'];
  const rows = [];
  for (let i = 0; i < boards.length; i += 3) {
    rows.push(boards.slice(i, i + 3).map((board) => ({ text: board, callback_data: `board:${board}` })));
  }
  rows.push([
    { text: '📅 Deadlines', callback_data: 'quick:deadlines' },
    { text: '🧾 Digest', callback_data: 'quick:digest' },
    { text: '❔ Ask', callback_data: 'quick:ask' },
  ]);
  return { reply_markup: { inline_keyboard: rows } };
}

async function ensureUser(chatId, firstName) {
  let user = await User.findOne({ telegramChatId: String(chatId) });
  if (!user) {
    user = await User.create({
      name: firstName || 'Aspirant',
      telegramChatId: String(chatId),
      prefs: {
        sources: ['SSC', 'RRB', 'TNPSC', 'UPSC', 'IBPS', 'SBI'],
        exams: [],
        types: ['new_exam', 'date_change', 'admit_card', 'result', 'eligibility_revised', 'corrigendum'],
        channels: { telegram: true, whatsapp: false, email: false },
      },
    });
  }
  return user;
}

async function sendTyping(chatId) {
  if (!bot || !chatId) return;
  try {
    await bot.sendChatAction(chatId, 'typing');
  } catch (err) {
    // ignore chat-action failures; they are non-blocking
  }
}

async function sendDeadlines(chatId) {
  const rows = await ExamChange.find({
    $or: [{ deadline: { $ne: null } }, { effectiveDate: { $ne: null } }],
  });

  const sorted = (rows || []).filter((item) => item.deadline || item.effectiveDate).sort((a, b) => {
    const da = new Date(a.deadline || a.effectiveDate).getTime();
    const db = new Date(b.deadline || b.effectiveDate).getTime();
    return da - db;
  }).slice(0, 5);

  if (!sorted.length) {
    await bot.sendMessage(chatId, '📅 No active deadlines are registered yet.');
    return;
  }

  const text = sorted.map((d) => {
    const date = new Date(d.deadline || d.effectiveDate).toLocaleDateString('en-IN');
    return `• *${d.examName || 'Exam'}* — ${d.source} — ${date}`;
  }).join('\n');

  await bot.sendMessage(chatId, `📅 *Upcoming Deadlines*\n\n${text}`, { parse_mode: 'Markdown' });
}

async function sendDigest(chatId) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setHours(23, 59, 59, 999);
  const rows = await ExamChange.find({ detectedAt: { $gte: start, $lte: end } });
  const items = (rows || []).slice(0, 5);

  if (!items.length) {
    await bot.sendMessage(chatId, '🧾 No new exam alerts were detected today yet.');
    return;
  }

  const text = items.map((d) => `• *[${d.source}]* ${d.examName || 'Exam'} — ${d.summary}`).join('\n');
  await bot.sendMessage(chatId, `🧾 *Today’s Digest*\n\n${text}`, { parse_mode: 'Markdown' });
}

async function sendAskReply(chatId, queryText) {
  const text = (queryText || '').trim();
  if (!text) {
    await bot.sendMessage(chatId, '❔ Please provide a keyword such as `/ask CGL` or `/ask SSC`.', { parse_mode: 'Markdown' });
    return;
  }

  const matches = await ExamChange.find({
    $or: [
      { examName: new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      { summary: new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      { source: new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
    ],
  }).limit(5);

  if (!matches.length) {
    await bot.sendMessage(chatId, `❔ No matching exam alerts were found for *${text}*`, { parse_mode: 'Markdown' });
    return;
  }

  const response = matches.map((d) => `• *${d.examName || 'Exam'}* (${d.source}) — ${d.summary}`).join('\n');
  await bot.sendMessage(chatId, `❔ *Search Results for ${text}*\n\n${response}`, { parse_mode: 'Markdown' });
}

// Send alert to a specific chat ID (per-user) or fall back to env TELEGRAM_CHAT_ID
async function sendAlert(change, chatId) {
  const id = chatId || env.TELEGRAM_CHAT_ID;
  if (!bot || !id) {
    if (!bot) console.warn('[Telegram] Bot not initialized. Skipping alert.');
    return false;
  }
  try {
    await bot.sendMessage(id, format(change), { parse_mode: 'Markdown' });
    return true;
  } catch (err) {
    console.error(`[Telegram] Failed to send message to ${id}:`, err.message);
    return false;
  }
}

function registerWebhookRoute(app) {
  if (!app || !env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_URL || webhookRegistered) return null;

  const webhookPath = `${env.TELEGRAM_WEBHOOK_URL.replace(/\/$/, '')}/telegram/webhook`;
  app.post('/telegram/webhook', (req, res) => {
    try {
      if (bot) {
        bot.processUpdate(req.body);
      }
      res.sendStatus(200);
    } catch (err) {
      console.error('[Telegram] Webhook processing failed:', err.message);
      res.sendStatus(500);
    }
  });

  webhookRegistered = true;
  console.log(`[Telegram] Webhook listener ready at ${webhookPath}`);
  return bot;
}

// Initialize interactive bot with polling and command listeners
function initBot() {
  if (!env.TELEGRAM_BOT_TOKEN || process.env.NODE_ENV === 'test') {
    return null;
  }

  if (bot && isPollingStarted) {
    return bot;
  }

  try {
    if (env.TELEGRAM_WEBHOOK_URL) {
      bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { webHook: true });
      bot.setWebHook(`${env.TELEGRAM_WEBHOOK_URL.replace(/\/$/, '')}/telegram/webhook`)
        .then(() => console.log('[Telegram] Webhook mode enabled.'))
        .catch((err) => console.error('[Telegram] Failed to register webhook:', err.message));
      isPollingStarted = true;
    } else {
      bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });
      isPollingStarted = true;
      console.log('[Telegram] Interactive bot active with polling enabled.');
    }

    bot.on('callback_query', async (query) => {
      const chatId = String(query.message?.chat?.id || query.from?.id);
      const data = query.data || '';
      await bot.answerCallbackQuery(query.id, { text: 'Working...' });

      if (data.startsWith('board:')) {
        const board = data.replace('board:', '');
        const user = await ensureUser(chatId, query.from?.first_name || 'Aspirant');
        const sources = user.prefs?.sources || [];
        if (!sources.includes(board)) {
          sources.push(board);
          await User.updateOne({ _id: user._id }, { $set: { prefs: { ...user.prefs, sources } } });
        }
        await bot.sendMessage(chatId, `✅ Selected *${board}* and enabled Telegram alerts for that board.`, { parse_mode: 'Markdown' });
        return;
      }

      if (data === 'quick:deadlines') {
        await sendDeadlines(chatId);
        return;
      }

      if (data === 'quick:digest') {
        await sendDigest(chatId);
        return;
      }

      if (data === 'quick:ask') {
        await bot.sendMessage(chatId, '❔ Send a keyword, for example: `/ask SSC` or `/ask CGL`.', { parse_mode: 'Markdown' });
      }
    });

    bot.onText(/\/start/, async (msg) => {
      const chatId = String(msg.chat.id);
      const name = msg.chat.first_name || 'Aspirant';
      await ensureUser(chatId, name);
      const welcome =
        `👋 *Welcome to Government Exam Update Tracker, ${name}!* 🎯\n\n` +
        `I track *SSC, RRB, TNPSC, UPSC, IBPS, and SBI* notifications 24/7.\n\n` +
        `*Quick Actions:*\n` +
        `• /myexams - View your current subscriptions\n` +
        `• /subscribe <board/exam> - Add a board or keyword\n` +
        `• /unsubscribe <board/exam> - Remove a board or keyword\n` +
        `• /latest <board> - Check recent updates\n` +
        `• /deadlines - See upcoming deadlines\n` +
        `• /digest - Today’s summary\n` +
        `• /ask <keyword> - Search recent updates\n` +
        `• /check - Trigger a live portal scan\n` +
        `• /help - Full command list`;

      await bot.sendMessage(chatId, welcome, { parse_mode: 'Markdown', reply_markup: buildStartKeyboard().reply_markup });
    });

    bot.onText(/\/myexams/, async (msg) => {
      const chatId = String(msg.chat.id);
      const user = await ensureUser(chatId, msg.chat.first_name || 'Aspirant');
      const sources = (user.prefs?.sources || []).join(', ') || 'None';
      const exams = (user.prefs?.exams || []).join(', ') || 'All exams in subscribed boards';
      const status =
        `📋 *Your Exam Tracker Subscription Profile*\n\n` +
        `🏛️ *Subscribed Boards:* ${sources}\n` +
        `🎯 *Specific Keywords:* ${exams}\n` +
        `🔔 *Active Alert Channel:* Telegram ✅\n\n` +
        `_Use /subscribe or /unsubscribe to modify your alerts._`;

      await bot.sendMessage(chatId, status, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/subscribe(?:\s+(.+))?/, async (msg, match) => {
      const chatId = String(msg.chat.id);
      const target = (match[1] || '').trim();
      if (!target) {
        return bot.sendMessage(chatId, 'Usage: `/subscribe <board or exam keyword>`\nExample: `/subscribe SSC` or `/subscribe NTPC`', { parse_mode: 'Markdown' });
      }

      const user = await ensureUser(chatId, msg.chat.first_name || 'Aspirant');
      const knownBoards = ['SSC', 'RRB', 'TNPSC', 'UPSC', 'IBPS', 'SBI'];
      const upper = target.toUpperCase();
      user.prefs = user.prefs || { sources: [], exams: [], types: [], channels: { telegram: true } };

      if (knownBoards.includes(upper)) {
        if (!user.prefs.sources.includes(upper)) {
          user.prefs.sources.push(upper);
          await User.updateOne({ _id: user._id }, { $set: { prefs: user.prefs } });
          return bot.sendMessage(chatId, `✅ Subscribed to all updates from *${upper}*!`, { parse_mode: 'Markdown' });
        }
        return bot.sendMessage(chatId, `ℹ️ You are already subscribed to *${upper}*.`, { parse_mode: 'Markdown' });
      }

      if (!user.prefs.exams.includes(target)) {
        user.prefs.exams.push(target);
        await User.updateOne({ _id: user._id }, { $set: { prefs: user.prefs } });
        return bot.sendMessage(chatId, `✅ Subscribed to exam notifications matching "*${target}*"!`, { parse_mode: 'Markdown' });
      }
      return bot.sendMessage(chatId, `ℹ️ You are already subscribed to "*${target}*".`, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/unsubscribe(?:\s+(.+))?/, async (msg, match) => {
      const chatId = String(msg.chat.id);
      const target = (match[1] || '').trim();
      if (!target) {
        return bot.sendMessage(chatId, 'Usage: `/unsubscribe <board or keyword>`\nExample: `/unsubscribe SSC`', { parse_mode: 'Markdown' });
      }

      const user = await User.findOne({ telegramChatId: chatId });
      if (!user || !user.prefs) {
        return bot.sendMessage(chatId, '⚠️ No active subscriptions found.');
      }

      user.prefs.sources = (user.prefs.sources || []).filter((s) => s !== target.toUpperCase());
      user.prefs.exams = (user.prefs.exams || []).filter((e) => e.toLowerCase() !== target.toLowerCase());
      await User.updateOne({ _id: user._id }, { $set: { prefs: user.prefs } });
      await bot.sendMessage(chatId, `🗑️ Unsubscribed from *${target}*.`, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/latest(?:\s+(.+))?/, async (msg, match) => {
      const chatId = String(msg.chat.id);
      const board = (match[1] || '').trim().toUpperCase();
      const query = board ? { source: board } : {};
      const changes = await ExamChange.find(query);
      const sorted = (changes || []).sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt)).slice(0, 4);
      if (!sorted.length) {
        return bot.sendMessage(chatId, `ℹ️ No recent updates found${board ? ` for ${board}` : ''}.`);
      }

      const reply = sorted.map((c) => `• *[${c.source}]* ${c.summary} _(${new Date(c.detectedAt).toLocaleDateString('en-IN')})_`).join('\n');
      await bot.sendMessage(chatId, `📢 *Latest Updates${board ? ` for ${board}` : ''}:*\n\n${reply}`, { parse_mode: 'Markdown' });
    });

    bot.onText(/\/deadlines/, async (msg) => {
      await sendTyping(String(msg.chat.id));
      await sendDeadlines(String(msg.chat.id));
    });

    bot.onText(/\/digest/, async (msg) => {
      await sendTyping(String(msg.chat.id));
      await sendDigest(String(msg.chat.id));
    });

    bot.onText(/\/ask(?:\s+(.+))?/, async (msg, match) => {
      await sendTyping(String(msg.chat.id));
      await sendAskReply(String(msg.chat.id), match[1] || '');
    });

    bot.onText(/\/check/, async (msg) => {
      const chatId = String(msg.chat.id);
      await bot.sendMessage(chatId, '🔄 *Starting live monitor scan of all 6 exam boards...*', { parse_mode: 'Markdown' });
      try {
        const { runAllSources } = require('./pipeline');
        const results = await runAllSources();
        const newTotal = (results || []).reduce((acc, r) => acc + (r.newChanges || 0), 0);
        await bot.sendMessage(chatId, `✅ *Scan complete!* Discovered *${newTotal}* new exam change(s).`, { parse_mode: 'Markdown' });
      } catch (err) {
        await bot.sendMessage(chatId, `❌ Scan failed: ${err.message}`);
      }
    });

    bot.onText(/\/help/, async (msg) => {
      const help =
        `📚 *Exam Tracker Bot Commands:*\n\n` +
        `• /start - Register and set up notification preferences\n` +
        `• /myexams - View subscribed boards and exam keywords\n` +
        `• /subscribe <board/exam> - Subscribe\n` +
        `• /unsubscribe <board/exam> - Unsubscribe\n` +
        `• /latest [board] - View the latest detected exam notices\n` +
        `• /deadlines - See upcoming exam deadlines\n` +
        `• /digest - Today’s summary\n` +
        `• /ask <keyword> - Search recent updates\n` +
        `• /check - Trigger an immediate scan\n` +
        `• /help - Display this help guide`;
      await bot.sendMessage(msg.chat.id, help, { parse_mode: 'Markdown' });
    });

    return bot;
  } catch (err) {
    console.error('[Telegram] Failed to start bot polling:', err.message);
    return null;
  }
}

// Automatically initialize if token exists
if (env.TELEGRAM_BOT_TOKEN) {
  initBot();
}

module.exports = { initBot, registerWebhookRoute, sendAlert, format };
