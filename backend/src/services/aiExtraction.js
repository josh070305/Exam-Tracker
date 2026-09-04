const { env } = require('../config/env');
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');

const SYSTEM_PROMPT =
  'You are an autonomous AI intelligence agent specialized in Indian government recruitment exams ' +
  '(such as SSC, RRB, TNPSC, UPSC, IBPS, SBI). Your goal is to analyze newly detected notices, announcements, ' +
  'and official PDFs, compare them against prior knowledge-base records (context management), and extract precise, structured exam updates.\n\n' +
  'For each genuine update found, return a JSON array of objects with the following keys:\n' +
  '- examName: The standard name of the exam (e.g. "SSC CGL 2026", "UPSC Civil Services 2026", "RRB NTPC 2026").\n' +
  '- changeType: Exactly one of: "new_exam", "date_change", "admit_card", "result", "eligibility_revised", "corrigendum".\n' +
  '- changedField: The specific attribute updated (e.g. "examDate", "admitCardRelease", "applicationWindow", "eligibilityCriteria", "vacancyCount").\n' +
  '- oldValue: The prior recorded value (use null if new or not mentioned, or match against provided historical context).\n' +
  '- newValue: The updated or newly announced value.\n' +
  '- effectiveDate: ISO-8601 date string if a specific date or deadline is identified, else null.\n' +
  '- summary: A crisp, professional, human-readable sentence explaining the change (e.g. "SSC CGL 2026 Tier-1 exam date rescheduled from Aug 15 to Sep 3."). \n' +
  '- pdfUrl: The URL of the attached official notice if provided, else null.\n\n' +
  'Definitions:\n' +
  '- "corrigendum" means an official erratum/clarification altering previously published rules, vacancies, or schedules.\n' +
  '- "date_change" means postponement, advancement, or scheduling of an exam tier or stage.\n\n' +
  'CRITICAL INSTRUCTION: Return ONLY a valid JSON array. Do not include markdown code fences (```json), commentary, or notes. If there are no genuine exam-related changes (e.g. trivial website layout updates), return an empty array [].';

// Clean fences and extract JSON array
function cleanJson(text) {
  let t = (text || '').trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  }
  const start = t.indexOf('[');
  const end = t.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    t = t.slice(start, end + 1);
  }
  return t;
}

// Build user prompt incorporating text, PDF excerpts, and historical context
function buildPrompt({ rawText, source, historicalExams, pdfNotices }) {
  let prompt = `Recruitment Board: ${source || 'Unknown'}\n\n`;

  if (historicalExams && historicalExams.length > 0) {
    prompt += `=== HISTORICAL KNOWLEDGE-BASE CONTEXT (Previously Known State) ===\n`;
    for (const h of historicalExams.slice(0, 10)) {
      prompt += `- Exam: ${h.examName} | Last Change: ${h.current?.changeType || 'N/A'} | Field: ${h.current?.changedField || 'N/A'} | Current Value: ${h.current?.newValue || 'N/A'}\n`;
    }
    prompt += `\nUse this historical context to accurately identify whether dates or rules have changed and fill in "oldValue" accurately.\n\n`;
  }

  prompt += `=== NEW NOTIFICATION CONTENT DETECTED ON BOARD PAGE ===\n${rawText}\n\n`;

  if (pdfNotices && pdfNotices.length > 0) {
    prompt += `=== ATTACHED OFFICIAL NOTICE PDF EXCERPTS ===\n`;
    for (const pdf of pdfNotices) {
      prompt += `[Notice: ${pdf.title || 'Official PDF'}] (URL: ${pdf.url})\n`;
      prompt += `${pdf.text}\n---\n`;
    }
  }

  prompt += `\nExtract all genuine exam updates as a JSON array adhering to the system specifications.`;
  return prompt;
}

async function extractWithAnthropic(prompt) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const start = Date.now();
  const msg = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 2500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });
  const latencyMs = Date.now() - start;
  const rawText = msg.content[0].text;
  return {
    raw: rawText,
    latencyMs,
    promptTokens: msg.usage?.input_tokens || 0,
    completionTokens: msg.usage?.output_tokens || 0,
    model: env.ANTHROPIC_MODEL,
  };
}

async function extractWithGroq(prompt) {
  const client = new OpenAI({ apiKey: env.GROQ_API_KEY, baseURL: env.GROQ_BASE_URL });
  const start = Date.now();
  const completion = await client.chat.completions.create({
    model: env.GROQ_MODEL,
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  });
  const latencyMs = Date.now() - start;
  return {
    raw: completion.choices[0].message.content,
    latencyMs,
    promptTokens: completion.usage?.prompt_tokens || 0,
    completionTokens: completion.usage?.completion_tokens || 0,
    model: env.GROQ_MODEL,
  };
}

/**
 * Extracts structured exam updates with context management and optional PDF content
 * @param {string} rawText Raw HTML text from the notices board
 * @param {object} context Additional context: { source, historicalExams, pdfNotices }
 */
async function extractChanges(rawText, context = {}) {
  const prompt = buildPrompt({
    rawText,
    source: context.source,
    historicalExams: context.historicalExams,
    pdfNotices: context.pdfNotices,
  });

  let responseData;
  try {
    if (env.AI_PROVIDER === 'anthropic') {
      if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');
      responseData = await extractWithAnthropic(prompt);
    } else {
      if (!env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');
      responseData = await extractWithGroq(prompt);
    }
  } catch (err) {
    if (err && err.status === 429) {
      console.error('[AI] Rate limited (429). Skipping cycle without crash.');
    } else {
      console.error('[AI] Extraction call failed:', err && err.message);
    }
    return null;
  }

  try {
    const parsed = JSON.parse(cleanJson(responseData.raw));
    const items = Array.isArray(parsed) ? parsed : [];
    items.metrics = {
      latencyMs: responseData.latencyMs,
      promptTokens: responseData.promptTokens,
      completionTokens: responseData.completionTokens,
      model: responseData.model,
    };
    return items;
  } catch (err) {
    console.error('[AI] Failed to parse JSON response from LLM. Raw:', responseData?.raw);
    return null;
  }
}

module.exports = { extractChanges, SYSTEM_PROMPT, buildPrompt };
