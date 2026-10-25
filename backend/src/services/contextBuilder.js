/**
 * ContextBuilder Service
 *
 * Pulls the last N versions of matching exams from MongoDB,
 * trims to a token budget, and produces a compact "known state"
 * block for injection into the agent prompt.
 *
 * This is the "context management" the resume describes.
 */

const Exam = require('../models/Exam');

// Rough token estimation: ~4 chars per token for English text
const CHARS_PER_TOKEN = 4;
const DEFAULT_TOKEN_BUDGET = 2000; // ~8000 chars
const MAX_EXAMS = 15;
const MAX_VERSIONS_PER_EXAM = 5;

/**
 * Estimate token count from a string
 */
function estimateTokens(text) {
  return Math.ceil((text || '').length / CHARS_PER_TOKEN);
}

/**
 * Format a single exam's known state compactly
 */
function formatExamContext(exam) {
  const lines = [];
  const name = exam.examName || exam.key || 'Unknown';
  const board = exam.source || exam.board || '?';

  lines.push(`[${board}] ${name}`);

  if (exam.current) {
    const c = exam.current;
    const parts = [];
    if (c.changeType) parts.push(`Last: ${c.changeType}`);
    if (c.changedField) parts.push(`Field: ${c.changedField}`);
    if (c.newValue) parts.push(`Value: ${c.newValue}`);
    if (c.deadline || c.effectiveDate) {
      const d = c.deadline || c.effectiveDate;
      parts.push(`Deadline: ${new Date(d).toISOString().slice(0, 10)}`);
    }
    if (parts.length) lines.push(`  Current: ${parts.join(' | ')}`);
  }

  // Include recent version history (compact)
  const recentVersions = (exam.versions || []).slice(-MAX_VERSIONS_PER_EXAM);
  for (const v of recentVersions) {
    const vParts = [];
    if (v.changeType) vParts.push(v.changeType);
    if (v.oldValue && v.newValue) vParts.push(`${v.oldValue} → ${v.newValue}`);
    else if (v.newValue) vParts.push(v.newValue);
    if (v.summary) vParts.push(v.summary.slice(0, 80));
    if (vParts.length) lines.push(`  - ${vParts.join(' | ')}`);
  }

  return lines.join('\n');
}

/**
 * Build context block for a specific board/source
 *
 * @param {string} source - Board name (SSC, RRB, etc.)
 * @param {object} options
 * @param {number} options.tokenBudget - Max tokens for this context block
 * @returns {object} { contextText, tokenCount, examCount }
 */
async function buildContext(source, options = {}) {
  const tokenBudget = options.tokenBudget || DEFAULT_TOKEN_BUDGET;

  // Fetch exams for this source, most recently updated first
  let exams;
  if (source) {
    exams = await Exam.find({ source });
  } else {
    exams = await Exam.find({});
  }

  // Sort by updatedAt descending
  exams.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

  // Take up to MAX_EXAMS
  exams = exams.slice(0, MAX_EXAMS);

  if (exams.length === 0) {
    return {
      contextText: 'No prior exam records found for this board.',
      tokenCount: 10,
      examCount: 0,
    };
  }

  // Build context, trimming to token budget
  const blocks = [];
  let totalTokens = 0;
  let examCount = 0;

  for (const exam of exams) {
    const block = formatExamContext(exam);
    const blockTokens = estimateTokens(block);

    if (totalTokens + blockTokens > tokenBudget) {
      break; // Budget exceeded
    }

    blocks.push(block);
    totalTokens += blockTokens;
    examCount++;
  }

  const header = `=== KNOWN STATE: ${examCount} exam(s) from ${source || 'all boards'} ===`;
  const footer = `=== Use get_exam_history for detailed history of any specific exam ===`;
  const contextText = [header, ...blocks, footer].join('\n');
  const finalTokens = estimateTokens(contextText);

  return {
    contextText,
    tokenCount: finalTokens,
    examCount,
  };
}

/**
 * Build context for multiple sources
 */
async function buildMultiSourceContext(sources, options = {}) {
  const totalBudget = options.tokenBudget || DEFAULT_TOKEN_BUDGET * 2;
  const perSourceBudget = Math.floor(totalBudget / Math.max(sources.length, 1));

  const blocks = [];
  let totalTokens = 0;
  let totalExams = 0;

  for (const source of sources) {
    const { contextText, tokenCount, examCount } = await buildContext(source, {
      tokenBudget: perSourceBudget,
    });
    blocks.push(contextText);
    totalTokens += tokenCount;
    totalExams += examCount;

    if (totalTokens >= totalBudget) break;
  }

  return {
    contextText: blocks.join('\n\n'),
    tokenCount: totalTokens,
    examCount: totalExams,
  };
}

module.exports = {
  buildContext,
  buildMultiSourceContext,
  estimateTokens,
  formatExamContext,
  DEFAULT_TOKEN_BUDGET,
};
