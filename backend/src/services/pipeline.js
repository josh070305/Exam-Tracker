const ExamChange = require('../models/ExamChange');
const Exam = require('../models/Exam');
const { hasChanged, updateSnapshot } = require('./changeDetection');
const { extractChanges } = require('./aiExtraction');
const { alertChange } = require('./alerting');
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

// Process a single source through the full pipeline:
// scrape -> hash-compare -> extract -> classify -> store -> KB -> alert
async function processSource(source) {
  console.log(`[Pipeline] Checking source: ${source.name}`);
  try {
    const scraped = await source.scrape();
    const { changed, snapshot } = await hasChanged(source.name, scraped.hash);

    if (!changed) {
      console.log(`[Pipeline] No change for ${source.name}. Updating lastCheckedAt only.`);
      await SourceSnapshot.updateOne(
        { _id: snapshot._id },
        { $set: { lastCheckedAt: new Date() } }
      );
      return { source: source.name, changed: false, newChanges: 0 };
    }

    console.log(`[Pipeline] Change detected for ${source.name}. Extracting via AI...`);
    const items = await extractChanges(scraped.text);

    if (items === null) {
      console.warn(`[Pipeline] AI extraction skipped for ${source.name}. Not storing.`);
      await updateSnapshot(source.name, scraped.hash);
      return { source: source.name, changed: true, newChanges: 0, skipped: true };
    }

    let newCount = 0;
    let notified = 0;
    for (const item of items) {
      const type = VALID_TYPES.includes(item.changeType) ? item.changeType : 'new_exam';
      const change = await ExamChange.create({
        source: source.name,
        examName: item.examName || null,
        changeType: type,
        changedField: item.changedField || null,
        oldValue: item.oldValue ?? null,
        newValue: item.newValue ?? null,
        effectiveDate: item.effectiveDate ? new Date(item.effectiveDate) : null,
        summary: item.summary || '',
        rawSnippet: scraped.text.slice(0, 2000),
        contentHash: scraped.hash,
      });
      await recordExam(change);
      const r = await alertChange(change, env.TELEGRAM_CHAT_ID);
      notified += r.notified || 0;
      newCount++;
    }

    await updateSnapshot(source.name, scraped.hash);
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

module.exports = { processSource, runAllSources };
