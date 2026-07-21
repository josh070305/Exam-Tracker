const nodemailer = require('nodemailer');
const { env } = require('../config/env');

function getTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT) || 587,
    secure: Number(env.SMTP_PORT) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

async function sendEmail(to, subject, text) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[Email] Not configured (set SMTP_* env). Skipping.');
    return false;
  }
  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM || env.SMTP_USER,
      to,
      subject,
      text,
    });
    return true;
  } catch (err) {
    console.error('[Email] Failed to send:', err.message);
    return false;
  }
}

module.exports = { sendEmail };
