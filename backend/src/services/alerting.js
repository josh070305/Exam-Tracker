const User = require('../models/User');
const { sendAlert, format } = require('./telegram');
const { sendWhatsApp } = require('./whatsapp');
const { sendEmail } = require('./email');

// Does a change match a user's preferences?
// A dimension only filters when the user set it; all SET dimensions must pass.
function matches(change, prefs) {
  prefs = prefs || {};
  if (prefs.sources && prefs.sources.length && !prefs.sources.includes(change.source)) {
    return false;
  }
  if (prefs.types && prefs.types.length && !prefs.types.includes(change.changeType)) {
    return false;
  }
  if (prefs.exams && prefs.exams.length) {
    const en = (change.examName || '').toLowerCase();
    const hit = prefs.exams.some((e) => {
      const p = e.toLowerCase();
      return p && (en.includes(p) || p.includes(en));
    });
    if (!hit) return false;
  }
  return true;
}

// Alert a change to the right users via their preferred channels.
// If no users exist, fall back to the v1 single TELEGRAM_CHAT_ID.
async function alertChange(change, fallbackChatId) {
  const users = await User.find();
  if (!users.length) {
    if (fallbackChatId) await sendAlert(change, fallbackChatId);
    return { notified: fallbackChatId ? 1 : 0, users: 0 };
  }

  const msg = format(change);
  let notified = 0;
  for (const u of users) {
    if (!matches(change, u.prefs)) continue;
    const ch = (u.prefs && u.prefs.channels) || {};
    if (ch.telegram && u.telegramChatId) {
      if (await sendAlert(change, u.telegramChatId)) notified++;
    }
    if (ch.whatsapp && u.whatsappNumber) {
      if (await sendWhatsApp(u.whatsappNumber, msg)) notified++;
    }
    if (ch.email && u.email) {
      if (await sendEmail(u.email, `[Exam Update] ${change.changeType}`, msg)) notified++;
    }
  }
  return { notified, users: users.length };
}

module.exports = { alertChange, matches };
