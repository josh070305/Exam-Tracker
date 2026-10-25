/**
 * AI Extraction Service (v2)
 *
 * Refactored to use the Anthropic Messages API with tool use for a proper
 * agent loop. Claude can call tools to fetch exam history, search exams,
 * save changes, and flag items for review.
 *
 * Falls back to Groq (single-shot) if Claude fails or key is missing.
 */

const { env } = require('../config/env');
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { z } = require('zod');
const fs = require('fs');
const path = require('path');
const Exam = require('../models/Exam');
const { buildContext } = require('./contextBuilder');

// ─── Load versioned system prompt from file ──────────────────────────────────
const PROMPT_PATH = path.join(__dirname, '..', 'prompts', 'extraction.v2.md');
let SYSTEM_PROMPT;
try {
  SYSTEM_PROMPT = fs.readFileSync(PROMPT_PATH, 'utf8');
} catch {
  // Fallback if file not found
  SYSTEM_PROMPT = 'You are an AI agent specialized in extracting Indian government exam updates. Use the provided tools to query history and save changes.';
}

// ─── Zod schema for validated change output ──────────────────────────────────
const ChangeSchema = z.object({
  examName: z.string().min(1),
  board: z.string().optional().default(''),
  changeType: z.enum([
    'NEW_NOTIFICATION', 'DATE_EXTENDED', 'EXAM_POSTPONED',
    'ADMIT_CARD', 'RESULT', 'SYLLABUS', 'CORRIGENDUM', 'OTHER',
  ]),
  oldValue: z.string().nullable().optional().default(null),
  newValue: z.string().nullable().optional().default(null),
  summary: z.string().max(300),
  importance: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  confidence: z.number().min(0).max(1).default(0.8),
  sourceUrl: z.string().nullable().optional().default(null),
  pdfUrl: z.string().nullable().optional().default(null),
  deadline: z.string().nullable().optional().default(null),
});

const ChangesArraySchema = z.array(ChangeSchema);

// ─── Tool definitions for Claude ─────────────────────────────────────────────
const TOOLS = [
  {
    name: 'get_exam_history',
    description: 'Fetch the complete version history of a specific exam from the knowledge base. Use this to compare old vs new values accurately.',
    input_schema: {
      type: 'object',
      properties: {
        examName: { type: 'string', description: 'Name of the exam to look up (e.g. "SSC CGL 2026")' },
      },
      required: ['examName'],
    },
  },
  {
    name: 'search_exams',
    description: 'Search the exam knowledge base by query string. Returns matching exams with their current state.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (exam name, board, keyword)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'save_change',
    description: 'Save a verified exam change. Call this for each genuine update you identify.',
    input_schema: {
      type: 'object',
      properties: {
        examName: { type: 'string', description: 'Standard name of the exam' },
        board: { type: 'string', description: 'Board name (SSC, RRB, TNPSC, UPSC, IBPS, SBI)' },
        changeType: { type: 'string', enum: ['NEW_NOTIFICATION', 'DATE_EXTENDED', 'EXAM_POSTPONED', 'ADMIT_CARD', 'RESULT', 'SYLLABUS', 'CORRIGENDUM', 'OTHER'] },
        oldValue: { type: 'string', description: 'Previous value (null if new)' },
        newValue: { type: 'string', description: 'Updated or new value' },
        summary: { type: 'string', description: 'One or two sentence summary in plain English' },
        importance: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
        confidence: { type: 'number', description: 'Confidence score between 0 and 1' },
        sourceUrl: { type: 'string', description: 'URL of the source page' },
        pdfUrl: { type: 'string', description: 'URL of the notice PDF if available' },
        deadline: { type: 'string', description: 'ISO date string for deadline, or null' },
      },
      required: ['examName', 'board', 'changeType', 'summary'],
    },
  },
  {
    name: 'flag_for_review',
    description: 'Flag ambiguous or uncertain content for human review.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Why this needs human review' },
        examName: { type: 'string', description: 'Related exam name if known' },
      },
      required: ['reason'],
    },
  },
];

// ─── Tool execution handlers ─────────────────────────────────────────────────
async function handleToolCall(toolName, toolInput, source) {
  const start = Date.now();
  let result;

  switch (toolName) {
    case 'get_exam_history': {
      const examName = toolInput.examName || '';
      const exams = await Exam.find({ source });
      const match = exams.find(e =>
        (e.examName || '').toLowerCase().includes(examName.toLowerCase()) ||
        examName.toLowerCase().includes((e.examName || '').toLowerCase())
      );
      if (match) {
        const versions = (match.versions || []).slice(-5).map(v => ({
          type: v.changeType,
          field: v.changedField,
          old: v.oldValue,
          new: v.newValue,
          date: v.detectedAt,
          summary: v.summary,
        }));
        result = JSON.stringify({ found: true, examName: match.examName, current: match.current, versions });
      } else {
        result = JSON.stringify({ found: false, message: `No history found for "${examName}" in ${source}` });
      }
      break;
    }
    case 'search_exams': {
      const query = (toolInput.query || '').toLowerCase();
      const allExams = await Exam.find({});
      const matches = allExams
        .filter(e => {
          const name = (e.examName || '').toLowerCase();
          const src = (e.source || '').toLowerCase();
          return name.includes(query) || src.includes(query) || query.includes(name);
        })
        .slice(0, 10)
        .map(e => ({
          exam: e.examName,
          board: e.source,
          lastChange: e.current?.changeType,
          lastValue: e.current?.newValue,
        }));
      result = JSON.stringify({ matches, count: matches.length });
      break;
    }
    case 'save_change': {
      // Validate with zod
      const parsed = ChangeSchema.safeParse(toolInput);
      if (parsed.success) {
        result = JSON.stringify({ saved: true, change: parsed.data });
      } else {
        result = JSON.stringify({ saved: false, errors: parsed.error.issues.map(i => i.message) });
      }
      break;
    }
    case 'flag_for_review': {
      result = JSON.stringify({ flagged: true, reason: toolInput.reason, exam: toolInput.examName || null });
      break;
    }
    default:
      result = JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }

  const durationMs = Date.now() - start;
  return { result, durationMs };
}

// ─── Claude Agent Loop (tool use) ────────────────────────────────────────────
async function extractWithClaudeAgent(userPrompt, source) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const savedChanges = [];
  const flaggedItems = [];
  const steps = [];
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let totalTokensCached = 0;

  const messages = [{ role: 'user', content: userPrompt }];
  const MAX_ITERATIONS = 5;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const start = Date.now();
    const response = await client.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 4096,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: TOOLS,
      messages,
    });

    const latencyMs = Date.now() - start;
    totalTokensIn += response.usage?.input_tokens || 0;
    totalTokensOut += response.usage?.output_tokens || 0;
    totalTokensCached += response.usage?.cache_read_input_tokens || 0;

    // Check if the model wants to use tools
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    const textBlocks = response.content.filter(b => b.type === 'text');

    if (toolUseBlocks.length === 0 || response.stop_reason === 'end_turn') {
      // No more tool calls — agent is done
      // Try to extract any remaining text as JSON if it looks like changes
      for (const tb of textBlocks) {
        const text = tb.text || '';
        if (text.includes('[') && text.includes(']')) {
          try {
            const cleaned = cleanJson(text);
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                const validated = ChangeSchema.safeParse(item);
                if (validated.success) {
                  savedChanges.push(validated.data);
                }
              }
            }
          } catch {
            // Not JSON, that's fine
          }
        }
      }

      steps.push({
        tool: 'agent_complete',
        args: { iteration: i + 1, reason: response.stop_reason },
        result: `Agent completed after ${i + 1} iteration(s). Found ${savedChanges.length} change(s).`,
        durationMs: latencyMs,
        timestamp: new Date(),
      });
      break;
    }

    // Process each tool call
    const toolResults = [];
    for (const toolBlock of toolUseBlocks) {
      const { result, durationMs: toolDuration } = await handleToolCall(
        toolBlock.name,
        toolBlock.input,
        source
      );

      // Collect saved changes from save_change tool calls
      if (toolBlock.name === 'save_change') {
        const parsed = JSON.parse(result);
        if (parsed.saved) {
          savedChanges.push(parsed.change);
        }
      }
      if (toolBlock.name === 'flag_for_review') {
        const parsed = JSON.parse(result);
        if (parsed.flagged) {
          flaggedItems.push(parsed);
        }
      }

      steps.push({
        tool: toolBlock.name,
        args: summarizeArgs(toolBlock.name, toolBlock.input),
        result: truncate(result, 200),
        durationMs: toolDuration,
        timestamp: new Date(),
      });

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolBlock.id,
        content: result,
      });
    }

    // Add assistant message and tool results to conversation
    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });
  }

  return {
    changes: savedChanges,
    flaggedItems,
    steps,
    metrics: {
      model: env.ANTHROPIC_MODEL,
      tokensIn: totalTokensIn,
      tokensOut: totalTokensOut,
      tokensCached: totalTokensCached,
      iterations: steps.length,
    },
  };
}

// ─── Groq fallback (single-shot, no tool use) ────────────────────────────────
async function extractWithGroq(prompt) {
  const client = new OpenAI({ apiKey: env.GROQ_API_KEY, baseURL: env.GROQ_BASE_URL });
  const start = Date.now();
  const completion = await client.chat.completions.create({
    model: env.GROQ_MODEL,
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT + '\n\nIMPORTANT: Since you do not have tool access, return a JSON array of changes directly. Each object must have: examName, board, changeType, oldValue, newValue, summary, importance, confidence, pdfUrl, deadline.' },
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

// ─── Main extraction function ────────────────────────────────────────────────
/**
 * Extract structured exam updates using Claude agent loop (primary)
 * or Groq fallback (when Claude unavailable).
 *
 * @param {string} rawText - Raw text from notice board scrape
 * @param {object} context - { source, historicalExams, pdfNotices }
 * @returns {object|null} { changes: [], steps: [], metrics: {}, flaggedItems: [] }
 */
async function extractChanges(rawText, context = {}) {
  const prompt = buildPrompt({
    rawText,
    source: context.source,
    pdfNotices: context.pdfNotices,
  });

  // Build context from DB
  let contextBlock = '';
  try {
    const ctx = await buildContext(context.source, { tokenBudget: 2000 });
    contextBlock = ctx.contextText;
  } catch {
    contextBlock = '';
  }

  const fullPrompt = contextBlock ? `${contextBlock}\n\n${prompt}` : prompt;

  // Try Claude agent loop first (primary)
  if (env.AI_PROVIDER === 'anthropic' || (!env.GROQ_API_KEY && env.ANTHROPIC_API_KEY)) {
    if (!env.ANTHROPIC_API_KEY) {
      console.warn('[AI] ANTHROPIC_API_KEY not set. Skipping extraction.');
      return null;
    }
    try {
      const result = await extractWithClaudeAgent(fullPrompt, context.source);
      return {
        changes: result.changes,
        steps: result.steps,
        flaggedItems: result.flaggedItems,
        metrics: result.metrics,
      };
    } catch (err) {
      console.error('[AI] Claude agent loop failed:', err.message);
      // Attempt Groq fallback if available
      if (env.GROQ_API_KEY) {
        console.log('[AI] Falling back to Groq...');
        return await extractWithGroqFallback(fullPrompt, context);
      }
      return null;
    }
  }

  // Groq path
  if (!env.GROQ_API_KEY) {
    console.warn('[AI] No AI provider keys configured. Skipping extraction.');
    return null;
  }
  return await extractWithGroqFallback(fullPrompt, context);
}

async function extractWithGroqFallback(prompt, context) {
  try {
    const responseData = await extractWithGroq(prompt);
    const changes = parseAndValidateJson(responseData.raw);
    return {
      changes,
      steps: [{
        tool: 'groq_extraction',
        args: { model: responseData.model, source: context.source },
        result: `Extracted ${changes.length} change(s) via Groq`,
        durationMs: responseData.latencyMs,
        timestamp: new Date(),
      }],
      flaggedItems: [],
      metrics: {
        model: responseData.model,
        tokensIn: responseData.promptTokens,
        tokensOut: responseData.completionTokens,
        tokensCached: 0,
        latencyMs: responseData.latencyMs,
      },
    };
  } catch (err) {
    if (err && err.status === 429) {
      console.error('[AI] Rate limited (429). Skipping cycle.');
    } else {
      console.error('[AI] Groq extraction failed:', err && err.message);
    }
    return null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function parseAndValidateJson(raw) {
  try {
    const cleaned = cleanJson(raw);
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];

    // Validate each item with zod, retry-friendly: skip invalid items
    const validated = [];
    for (const item of parsed) {
      // Map legacy types to v2 types
      const mapped = mapLegacyChangeType(item);
      const result = ChangeSchema.safeParse(mapped);
      if (result.success) {
        validated.push(result.data);
      } else {
        console.warn('[AI] Validation failed for item:', result.error.issues[0]?.message, item.examName);
      }
    }
    return validated;
  } catch (err) {
    console.error('[AI] Failed to parse JSON response:', err.message);
    return [];
  }
}

function mapLegacyChangeType(item) {
  const LEGACY_MAP = {
    'new_exam': 'NEW_NOTIFICATION',
    'date_change': 'DATE_EXTENDED',
    'admit_card': 'ADMIT_CARD',
    'result': 'RESULT',
    'eligibility_revised': 'CORRIGENDUM',
    'corrigendum': 'CORRIGENDUM',
  };
  if (item.changeType && LEGACY_MAP[item.changeType]) {
    return { ...item, changeType: LEGACY_MAP[item.changeType] };
  }
  return item;
}

function formatHistoricalContext(historicalExams = []) {
  if (!Array.isArray(historicalExams) || historicalExams.length === 0) {
    return '=== HISTORICAL KNOWLEDGE-BASE CONTEXT ===\nNo prior exam records found for this board.';
  }

  const rows = historicalExams.slice(0, 10).map((exam) => {
    const examName = exam.examName || 'Unknown exam';
    const current = exam.current || {};
    const board = exam.board || exam.source || 'Unknown';
    const details = [];

    if (current.changeType) details.push(`Last change: ${current.changeType}`);
    if (current.changedField) details.push(`Field: ${current.changedField}`);
    if (current.newValue) details.push(`Latest value: ${current.newValue}`);
    if (current.deadline || current.effectiveDate) {
      const deadline = current.deadline || current.effectiveDate;
      details.push(`Deadline: ${new Date(deadline).toISOString().slice(0, 10)}`);
    }

    return `- [${board}] ${examName}${details.length ? ` | ${details.join(' | ')}` : ''}`;
  });

  return `=== HISTORICAL KNOWLEDGE-BASE CONTEXT ===\n${rows.join('\n')}`;
}

function buildPrompt({ rawText, source, pdfNotices, historicalExams = [] }) {
  let prompt = `Recruitment Board: ${source || 'Unknown'}\n\n`;
  prompt += `${formatHistoricalContext(historicalExams)}\n\n`;
  prompt += `=== NEW NOTIFICATION CONTENT DETECTED ON BOARD PAGE ===\n${rawText}\n\n`;

  if (pdfNotices && pdfNotices.length > 0) {
    prompt += `=== ATTACHED OFFICIAL NOTICE PDF EXCERPTS ===\n`;
    for (const pdf of pdfNotices) {
      prompt += `[Notice: ${pdf.title || 'Official PDF'}] (URL: ${pdf.url})\n`;
      prompt += `${pdf.text}\n---\n`;
    }
  }

  prompt += `\nAnalyze the content above. Use get_exam_history to check prior state, then save_change for each genuine update. If no real changes exist, just confirm that.`;
  return prompt;
}

function summarizeArgs(toolName, args) {
  switch (toolName) {
    case 'get_exam_history': return { exam: args.examName };
    case 'search_exams': return { query: args.query };
    case 'save_change': return { exam: args.examName, type: args.changeType };
    case 'flag_for_review': return { reason: truncate(args.reason, 50) };
    default: return {};
  }
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

module.exports = {
  extractChanges,
  SYSTEM_PROMPT,
  buildPrompt,
  ChangeSchema,
  ChangesArraySchema,
  cleanJson,
  parseAndValidateJson,
  mapLegacyChangeType,
};
