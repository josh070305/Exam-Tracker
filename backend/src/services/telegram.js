const TelegramBot = require('node-telegram-bot-api');
const { env } = require('../config/env');
const User = require('../models/User');
const ExamChange = require('../models/ExamChange');

let bot = null;
let isPollingStarted = false;

function format(change) {
  const detected = new Date(change.detectedAt || Date.now()).toLocaleString('en-IN');
  const typeIcons = {
    new_exam: '📢',
    date_change: '🗓️',
    admit_card: '🎫',
    result: '🏆',
    eligibility_revised: '⚖️',
    corrigendum: '⚠️',
  };
  const icon = typeIcons[change.changeType] || '🔔';

  let text = `${icon} *[${change.source}] ${change.changeType.toUpperCase().replace('_', ' ')}*\n`;
  if (change.examName) text += `📌 *Exam:* ${change.examName}\n`;
  text += `📝 *Summary:* ${change.summary}\n`;

  if (change.oldValue || change.newValue) {
    text += `🔄 *Change:* ~${change.oldValue || 'None'}~ ➔ *${change.newValue || 'Updated'}*\n`;
  }
  if (change.effectiveDate) {
    text += `📅 *Effective Date:* ${new Date(change.effectiveDate).toLocaleDateString('en-IN')}\n`;
  }
  if (change.pdfUrl) {
    text += `📄 *Notice PDF:* [Download Notice](${change.pdfUrl})\n`;
  }
  text += `🕒 *Detected:* ${detected}`;
  return text;
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

// Initialize interactive bot with polling and command listeners
function initBot() {
  if (!env.TELEGRAM_BOT_TOKEN || process.env.NODE_ENV === 'test') {
    return null;
  }

  if (bot && isPollingStarted) {
    return bot;
  }

  try {
    bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });
    isPollingStarted = true;
    console.log('[Telegram] Interactive bot active with polling enabled.');

    // /start command
    bot.onText(/\/start/, async (msg) => {
      const chatId = String(msg.chat.id);
      const name = msg.chat.first_name || 'Aspirant';

      let user = await User.findOne({ telegramChatId: chatId });
      if (!user) {
        user = await User.create({
          name,
          telegramChatId: chatId,
          prefs: {
            sources: ['SSC', 'RRB', 'TNPSC', 'UPSC', 'IBPS', 'SBI'],
            exams: [],
            types: ['new_exam', 'date_change', 'admit_card', 'result', 'eligibility_revised', 'corrigendum'],
            channels: { telegram: true, whatsapp: false, email: false },
          },
        });
      }

      const welcome =
        `👋 *Welcome to Government Exam Update Tracker, ${name}!* 🎯\n\n` +
        `I am your autonomous exam monitoring agent. I track *SSC, RRB, TNPSC, UPSC, IBPS, and SBI* notifications 24/7 and alert you instantly when dates change, admit cards drop, or corrigendums are issued.\n\n` +
        `*Quick Commands:*\n` +
        `• /myexams - View your current subscribed boards and exam keywords\n` +
        `• /subscribe <board/exam> - Subscribe to an exam (e.g. \`/subscribe SSC\` or \`/subscribe CGL\`)\n` +
        `• /unsubscribe <board/exam> - Remove an exam subscription\n` +
        `• /latest <board> - View recent updates (e.g. \`/latest SSC\`)\n` +
        `• /check - Trigger a real-time monitor scan now\n` +
        `• /help - Full command list`;

      await bot.sendMessage(chatId, welcome, { parse_mode: 'Markdown' });
    });

    // /myexams command
    bot.onText(/\/myexams/, async (msg) => {
      const chatId = String(msg.chat.id);
      const user = await User.findOne({ telegramChatId: chatId });

      if (!user) {
        return bot.sendMessage(chatId, '⚠️ You are not registered yet. Send /start to begin!');
      }

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

    // /subscribe command
    bot.onText(/\/subscribe(?:\s+(.+))?/, async (msg, match) => {
      const chatId = String(msg.chat.id);
      const target = (match[1] || '').trim();

      if (!target) {
        return bot.sendMessage(chatId, 'Usage: `/subscribe <board or exam keyword>`\nExample: `/subscribe SSC` or `/subscribe NTPC`', { parse_mode: 'Markdown' });
      }

      let user = await User.findOne({ telegramChatId: chatId });
      if (!user) {
        user = await User.create({ name: msg.chat.first_name || 'Aspirant', telegramChatId: chatId });
      }

      const knownBoards = ['SSC', 'RRB', 'TNPSC', 'UPSC', 'IBPS', 'SBI'];
      const upper = target.toUpperCase();

      user.prefs = user.prefs || { sources: [], exams: [], types: [], channels: { telegram: true } };

      if (knownBoards.includes(upper)) {
        if (!user.prefs.sources.includes(upper)) {
          user.prefs.sources.push(upper);
          await User.updateOne({ _id: user._id }, { $set: { prefs: user.prefs } });
          return bot.sendMessage(chatId, `✅ Subscribed to all updates from *${upper}*!`, { parse_mode: 'Markdown' });
        } else {
          return bot.sendMessage(chatId, `ℹ️ You are already subscribed to *${upper}*.`, { parse_mode: 'Markdown' });
        }
      } else {
        if (!user.prefs.exams.includes(target)) {
          user.prefs.exams.push(target);
          await User.updateOne({ _id: user._id }, { $set: { prefs: user.prefs } });
          return bot.sendMessage(chatId, `✅ Subscribed to exam notifications matching "*${target}*"!`, { parse_mode: 'Markdown' });
        } else {
          return bot.sendMessage(chatId, `ℹ️ You are already subscribed to "*${target}*".`, { parse_mode: 'Markdown' });
        }
      }
    });

    // /unsubscribe command
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

      const upper = target.toUpperCase();
      user.prefs.sources = (user.prefs.sources || []).filter((s) => s !== upper);
      user.prefs.exams = (user.prefs.exams || []).filter((e) => e.toLowerCase() !== target.toLowerCase());

      await User.updateOne({ _id: user._id }, { $set: { prefs: user.prefs } });
      await bot.sendMessage(chatId, `🗑️ Unsubscribed from *${target}*.`, { parse_mode: 'Markdown' });
    });

    // /latest command
    bot.onText(/\/latest(?:\s+(.+))?/, async (msg, match) => {
      const chatId = String(msg.chat.id);
      const board = (match[1] || '').trim().toUpperCase();

      const query = board ? { source: board } : {};
      const changes = await ExamChange.find(query);
      const sorted = (changes || []).sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt)).slice(0, 4);

      if (!sorted.length) {
        return bot.sendMessage(chatId, `ℹ️ No recent updates found${board ? ` for ${board}` : ''}.`);
      }

      let reply = `📢 *Latest Updates${board ? ` for ${board}` : ''}:*\n\n`;
      for (const c of sorted) {
        reply += `• *[${c.source}]* ${c.summary} _(${new Date(c.detectedAt).toLocaleDateString('en-IN')})_\n`;
      }
      await bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    });

    // /check command
    bot.onText(/\/check/, async (msg) => {
      const chatId = String(msg.chat.id);
      await bot.sendMessage(chatId, '🔄 *Starting live monitor scan of all 6 exam boards...*', { parse_mode: 'Markdown' });
      try {
        const { runAllSources } = require('./pipeline');
        const results = await runAllSources();
        const newTotal = (results || []).reduce((acc, r) => acc + (r.newChanges || 0), 0);
        await bot.sendMessage(
          chatId,
          `✅ *Scan complete!* Discovered *${newTotal}* new exam change(s).`,
          { parse_mode: 'Markdown' }
        );
      } catch (err) {
        await bot.sendMessage(chatId, `❌ Scan failed: ${err.message}`);
      }
    });

    // /help command
    bot.onText(/\/help/, async (msg) => {
      const help =
        `📚 *Exam Tracker Bot Commands:*\n\n` +
        `• /start - Register and set up notification preferences\n` +
        `• /myexams - View subscribed boards and exam keywords\n` +
        `• /subscribe <board/exam> - Subscribe (e.g. \`/subscribe UPSC\` or \`/subscribe CDS\`)\n` +
        `• /unsubscribe <board/exam> - Unsubscribe from alerts\n` +
        `• /latest [board] - View the latest detected exam notices\n` +
        `• /check - Trigger an immediate scan of all exam websites\n` +
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

module.exports = { initBot, sendAlert, format };
