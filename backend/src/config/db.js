const { fromJSON } = require('../store');
const User = require('../models/User');
const { env } = require('./env');
const { loadFromDisk } = require('../storage');

async function seedDefaultUser() {
  try {
    const count = await User.countDocuments({});
    if (count > 0) return;
    await User.create({
      name: 'Demo Aspirant',
      telegramChatId: env.TELEGRAM_CHAT_ID || null,
      prefs: {
        sources: ['SSC', 'RRB', 'TNPSC'],
        exams: ['SSC CGL', 'RRB NTPC', 'TNPSC Group 2'],
        types: ['new_exam', 'date_change', 'admit_card', 'result', 'eligibility_revised', 'corrigendum'],
        channels: { telegram: true, whatsapp: false, email: false },
      },
    });
    console.log('[DB] Seeded default aspirant user');
  } catch (err) {
    console.error('[DB] Seed failed:', err.message);
  }
}

async function connectDB() {
  console.log('[DB] Using in-memory store with disk persistence');
  await loadFromDisk();
  await seedDefaultUser();
}

module.exports = { connectDB };
