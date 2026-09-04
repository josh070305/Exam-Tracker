require('dotenv').config();

const env = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/exam-tracker',

  AI_PROVIDER: (process.env.AI_PROVIDER || 'groq').toLowerCase(),
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  GROQ_BASE_URL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',

  // Telegram (v1 single-chat fallback + per-user)
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,

  // WhatsApp (Twilio)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM,

  // Email (SMTP)
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,

  // Source URLs (overrideable) + mock-scrape mode
  SSC_URL: process.env.SSC_URL || 'https://ssc.nic.in',
  RRB_URL: process.env.RRB_URL || 'https://www.rrbcdg.gov.in',
  TNPSC_URL: process.env.TNPSC_URL || 'https://www.tnpsc.gov.in',
  UPSC_URL: process.env.UPSC_URL || 'https://upsc.gov.in',
  IBPS_URL: process.env.IBPS_URL || 'https://www.ibps.in',
  SBI_URL: process.env.SBI_URL || 'https://sbi.co.in/web/careers',
  MOCK_SCRAPE: process.env.MOCK_SCRAPE === '1' || process.env.MOCK_SCRAPE === 'true',
};

module.exports = { env };
