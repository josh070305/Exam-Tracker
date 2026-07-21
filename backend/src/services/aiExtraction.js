const { env } = require('../config/env');
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');

const SYSTEM_PROMPT =
  'You are extracting structured information from Indian government exam recruitment ' +
  'website content. Given raw text from a notifications page, identify any NEW items ' +
  'that represent exam-related updates. For each one, output a JSON array where each ' +
  'object has: examName, changeType (one of: new_exam, date_change, admit_card, result, ' +
  'eligibility_revised, corrigendum), changedField, oldValue (null if not applicable), newValue, ' +
  'effectiveDate (ISO date string or null), and summary (a single plain-English sentence ' +
  "describing the change, e.g. 'SSC CGL 2026 Tier-1 exam date moved from Aug 15 to Sep 3'). " +
  'corrigendum means an official correction/erratum to a previously published notification ' +
  '(e.g. revised vacancy count, age clarification, date fix). ' +
  'Return ONLY valid JSON, no markdown formatting, no preamble. If there are no genuine ' +
  'exam-related updates in the content (e.g. it\'s just a design/layout change), return ' +
  'an empty array.';

// Strip accidental markdown fences from model output before JSON.parse.
function cleanJson(text) {
  let t = (text || '').trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  }
  // Some models wrap the array in an object; pull out the first [ ... ] block.
  const start = t.indexOf('[');
  const end = t.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    t = t.slice(start, end + 1);
  }
  return t;
}

async function extractWithAnthropic(text) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: text }],
  });
  return msg.content[0].text;
}

async function extractWithGroq(text) {
  const client = new OpenAI({ apiKey: env.GROQ_API_KEY, baseURL: env.GROQ_BASE_URL });
  const completion = await client.chat.completions.create({
    model: env.GROQ_MODEL,
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
  });
  return completion.choices[0].message.content;
}

// Returns an array of extracted change objects, or null if parsing failed
// (so the caller can skip rather than crash).
async function extractChanges(rawText) {
  let raw;
  try {
    if (env.AI_PROVIDER === 'anthropic') {
      if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');
      raw = await extractWithAnthropic(rawText);
    } else {
      if (!env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');
      raw = await extractWithGroq(rawText);
    }
  } catch (err) {
    if (err && err.status === 429) {
      console.error('[AI] Rate limited (429). Skipping this cycle — no retry loop.');
    } else {
      console.error('[AI] Extraction call failed:', err && err.message);
    }
    return null;
  }

  try {
    const parsed = JSON.parse(cleanJson(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[AI] Failed to parse JSON response. Raw response:', raw);
    return null;
  }
}

module.exports = { extractChanges, SYSTEM_PROMPT };
