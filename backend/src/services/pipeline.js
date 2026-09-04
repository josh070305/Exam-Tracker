const ExamChange = require('../models/ExamChange');
const Exam = require('../models/Exam');
const SourceSnapshot = require('../models/SourceSnapshot');
const { hasChanged, updateSnapshot } = require('./changeDetection');
const { extractChanges } = require('./aiExtraction');
const { extractPdfText } = require('./pdfService');
const { alertChange } = require('./alerting');
const { broadcast } = require('./sse');
const { env } = require('../config/env');

const VALID_TYPES = [
  'new_exam',
  'date_change',
  'admit_card',
  'result',
  'eligibility_revised',
  'corrigendum',
];

// Append a change to the versioned Exam knowledge base (one doc per exam).
async function recordExam(change) {
  const key = `${change.source}::${change.examName || 'unknown'}`;
  const version = {
    changeType: change.changeType,
    changedField: change.changedField,
    oldValue: change.oldValue,
    newValue: change.newValue,
    effectiveDate: change.effectiveDate,
    summary: change.summary,
    detectedAt: change.detectedAt,
    changeId: change._id,
  };
  await Exam.findOneAndUpdate(
    { key },
    {
      $setOnInsert: { source: change.source, examName: change.examName },
      $set: { current: version, updatedAt: new Date() },
      $push: { versions: version },
    },
    { upsert: true }
  );
}

// Process a single source through the agentic pipeline:
// Scrape -> Hash Check -> PDF Notice Ingestion -> Context Retrieval -> AI Extraction -> Storage -> KB -> SSE & Alerts
async function processSource(source) {
  console.log(`[Pipeline] Checking source: ${source.name}`);
  broadcast('agent_log', {
    timestamp: new Date().toISOString(),
    stage: 'SCRAPE',
    source: source.name,
    message: `Connecting to ${source.name} portal and inspecting announcements section...`,
  });

  try {
    const scraped = await source.scrape();
    const { changed, snapshot } = await hasChanged(source.name, scraped.hash);

    if (!changed) {
      console.log(`[Pipeline] No change for ${source.name}. Updating lastCheckedAt only.`);
      broadcast('agent_log', {
        timestamp: new Date().toISOString(),
        stage: 'HASH_CHECK',
        source: source.name,
        message: `Content hash verified (${scraped.hash.slice(0, 10)}...). Zero new notices detected.`,
      });

      if (snapshot && snapshot._id) {
        await SourceSnapshot.updateOne(
          { _id: snapshot._id },
          { $set: { lastCheckedAt: new Date() } }
        );
      }
      return { source: source.name, changed: false, newChanges: 0 };
    }

    console.log(`[Pipeline] Change detected for ${source.name}. Preparing contextual intelligence...`);
    broadcast('agent_log', {
      timestamp: new Date().toISOString(),
      stage: 'DIFF_DETECTED',
      source: source.name,
      message: `Content delta identified on ${source.name}! Initiating context & PDF analysis...`,
    });

    // 1. Context Management: Fetch prior known exams for this recruitment board
    const historicalExams = await Exam.find({ source: source.name });

    // 2. Attached Notice PDF Ingestion: If any notice PDFs are linked, extract their text
    const pdfNotices = [];
    if (scraped.pdfLinks && scraped.pdfLinks.length > 0 && !env.MOCK_SCRAPE) {
      const topPdfs = scraped.pdfLinks.slice(0, 2); // Process top 2 PDFs to stay fast & efficient
      for (const link of topPdfs) {
        if (link.url) {
          console.log(`[Pipeline] Extracting attached PDF: ${link.title || link.url}`);
          const pdfResult = await extractPdfText(link.url, 2);
          if (pdfResult.success && pdfResult.text) {
            broadcast('agent_log', {
              timestamp: new Date().toISOString(),
              stage: 'PDF_INGEST',
              source: source.name,
              message: `Extracted text from official notice PDF (${link.title || 'Notice'}).`,
            });
            pdfNotices.push({
              title: link.title,
              url: link.url,
              text: pdfResult.text,
            });
          }
        }
      }
    }

    broadcast('agent_log', {
      timestamp: new Date().toISOString(),
      stage: 'LLM_REASONING',
      source: source.name,
      message: `Analyzing diffs against historical records using ${env.AI_PROVIDER.toUpperCase()} agent...`,
    });

    // 3. Agentic AI Extraction with context and PDF text
    const items = await extractChanges(scraped.text, {
      source: source.name,
      historicalExams,
      pdfNotices,
    });

    if (items === null) {
      console.warn(`[Pipeline] AI extraction skipped or rate-limited for ${source.name}.`);
      await updateSnapshot(source.name, scraped.hash);
      return { source: source.name, changed: true, newChanges: 0, skipped: true };
    }

    if (items.metrics) {
      broadcast('agent_log', {
        timestamp: new Date().toISOString(),
        stage: 'AI_TELEMETRY',
        source: source.name,
        message: `${items.metrics.model} inference completed in ${items.metrics.latencyMs}ms (Tokens: ${items.metrics.promptTokens} prompt + ${items.metrics.completionTokens} completion).`,
      });
    }

    let newCount = 0;
    let notified = 0;
    for (const item of items) {
      const type = VALID_TYPES.includes(item.changeType) ? item.changeType : 'new_exam';

      // 4. Semantic Idempotency Deduplication: Prevent duplicate alerts for unchanged news
      const normKey = [
        (source.name || '').toLowerCase().trim(),
        (item.examName || '').toLowerCase().trim(),
        (type || '').toLowerCase().trim(),
        (item.changedField || '').toLowerCase().trim(),
        (item.newValue || '').toLowerCase().trim(),
      ].join('::');
      const idempotencyKey = require('crypto').createHash('sha256').update(normKey).digest('hex');

      const existing = await ExamChange.findOne({ idempotencyKey });
      if (existing) {
        broadcast('agent_log', {
          timestamp: new Date().toISOString(),
          stage: 'DEDUP_SUPPRESSED',
          source: source.name,
          message: `Notice for "${item.examName || source.name}" (${type}) verified identical to prior state. Suppressing duplicate alert.`,
        });
        await ExamChange.updateOne({ _id: existing._id }, { $set: { lastVerifiedAt: new Date() } });
        continue;
      }

      const change = await ExamChange.create({
        source: source.name,
        examName: item.examName || null,
        changeType: type,
        changedField: item.changedField || null,
        oldValue: item.oldValue != null ? String(item.oldValue) : null,
        newValue: item.newValue != null ? String(item.newValue) : null,
        effectiveDate: item.effectiveDate ? new Date(item.effectiveDate) : null,
        summary: item.summary || '',
        rawSnippet: scraped.text.slice(0, 2000),
        pdfUrl: item.pdfUrl || (pdfNotices[0] ? pdfNotices[0].url : null),
        idempotencyKey,
        contentHash: scraped.hash,
      });

      await recordExam(change);

      // Real-time broadcast to connected web dashboards
      broadcast('exam_update', change);

      // Multi-channel alerting (Telegram, WhatsApp, Email)
      const r = await alertChange(change, env.TELEGRAM_CHAT_ID);
      notified += r.notified || 0;
      newCount++;
    }

    await updateSnapshot(source.name, scraped.hash);
    broadcast('source_updated', { source: source.name, newCount, timestamp: new Date().toISOString() });
    broadcast('agent_log', {
      timestamp: new Date().toISOString(),
      stage: 'COMPLETED',
      source: source.name,
      message: `Discovered ${newCount} validated exam change(s). Dispatched alerts to ${notified} channels.`,
    });

    console.log(`[Pipeline] Stored ${newCount} change(s) for ${source.name} (alerts sent: ${notified}).`);
    return { source: source.name, changed: true, newChanges: newCount, notified };
  } catch (err) {
    const detail = err.code ? `${err.message} (${err.code})` : err.message;
    console.error(`[Pipeline] Error processing ${source.name}:`, detail);
    return { source: source.name, changed: false, error: detail };
  }
}

async function runAllSources() {
  const { sources } = require('../scrapers');
  const results = [];
  for (const source of sources) {
    const r = await processSource(source);
    results.push(r);
  }
  return results;
}

module.exports = { processSource, runAllSources, recordExam };
