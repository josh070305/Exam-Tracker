const twilio = require('twilio');
const { env } = require('../config/env');

function getClient() {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) return null;
  return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
}

// Normalize to E.164: strip spaces/dashes/parens, ensure leading '+'.
function normalize(num) {
  let n = String(num || '').replace(/[\s\-()]/g, '');
  if (!n.startsWith('+')) n = '+' + n;
  return n;
}

// Send a WhatsApp template/free-form message via Twilio's WhatsApp sandbox.
async function sendWhatsApp(to, text) {
  const client = getClient();
  if (!client || !env.TWILIO_WHATSAPP_FROM) {
    console.warn('[WhatsApp] Not configured (set TWILIO_* env). Skipping.');
    return false;
  }
  const toNum = normalize(to);
  try {
    await client.messages.create({
      from: `whatsapp:${env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${toNum}`,
      body: text,
    });
    return true;
  } catch (err) {
    console.error('[WhatsApp] Failed to send:', err.message);
    return false;
  }
}

module.exports = { sendWhatsApp };
