const TelegramBot = require('node-telegram-bot-api');
const { env } = require('../config/env');

let bot = null;
if (env.TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN);
}

function format(change) {
  const detected = new Date(change.detectedAt).toLocaleString('en-IN');
  return `🔔 ${change.changeType}\n${change.summary}\nSource: ${change.source}\nDetected: ${detected}`;
}

// Send to a specific chat id (per-user) or fall back to the env chat id (v1).
async function sendAlert(change, chatId) {
  const id = chatId || env.TELEGRAM_CHAT_ID;
  if (!bot || !id) {
    if (!bot) console.warn('[Telegram] Not configured (TELEGRAM_BOT_TOKEN missing). Skipping.');
    return false;
  }
  try {
    await bot.sendMessage(id, format(change));
    return true;
  } catch (err) {
    console.error('[Telegram] Failed to send message:', err.message);
    return false;
  }
}

module.exports = { sendAlert, format };
