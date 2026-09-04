const mongoose = require('mongoose');
const { env } = require('./env');
const { loadFromDisk } = require('../storage');

let mongooseActive = false;

function isMongooseConnected() {
  return mongooseActive && mongoose.connection.readyState === 1;
}

async function seedDefaultUser() {
  const User = require('../models/User');
  try {
    const count = await User.countDocuments({});
    if (count > 0) return;
    await User.create({
      name: 'Demo Aspirant',
      telegramChatId: env.TELEGRAM_CHAT_ID || null,
      prefs: {
        sources: ['SSC', 'RRB', 'TNPSC', 'UPSC', 'IBPS', 'SBI'],
        exams: ['SSC CGL', 'RRB NTPC', 'TNPSC Group 2', 'UPSC Prelims'],
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
  if (env.MONGODB_URI) {
    try {
      console.log(`[DB] Attempting MongoDB connection to ${env.MONGODB_URI}...`);
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 3000,
      });
      mongooseActive = true;
      console.log('[DB] Connected successfully to MongoDB via Mongoose!');
      await seedDefaultUser();
      return;
    } catch (err) {
      console.warn(`[DB] MongoDB unavailable (${err.message}). Falling back to in-memory persistence.`);
      mongooseActive = false;
    }
  } else {
    console.log('[DB] No MONGODB_URI provided. Running in in-memory persistence mode.');
  }

  // Fallback to in-memory store with disk JSON backup
  await loadFromDisk();
  await seedDefaultUser();
}

async function disconnectDB() {
  if (mongooseActive) {
    await mongoose.disconnect();
    mongooseActive = false;
  }
}

module.exports = { connectDB, disconnectDB, isMongooseConnected };
