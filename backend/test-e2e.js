// End-to-end smoke test using an in-memory MongoDB and a mocked AI layer,
// so no external database, API key, or network is required.
process.env.MONGODB_URI = process.env.MONGODB_URI || 'memory://test';
process.env.AI_PROVIDER = 'groq';

const fs = require('fs');
const path = require('path');

// --- Mock the AI extraction module BEFORE pipeline.js requires it ---
const fakeAi = {
  extractChanges: async (text) => {
    if (text.includes('EXAM_TOKEN')) {
      return [
        {
          examName: 'SSC CGL 2026',
          changeType: 'new_exam',
          changedField: 'status',
          oldValue: null,
          newValue: 'notification released',
          effectiveDate: '2026-08-15',
          summary: 'SSC CGL 2026 notification released.',
        },
      ];
    }
    return [];
  },
};
const aiPath = path.resolve(__dirname, 'src/services/aiExtraction.js');
require.cache[aiPath] = { id: aiPath, filename: aiPath, loaded: true, exports: fakeAi };

(async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongoose = require('mongoose');

  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
  console.log('[test] in-memory mongo up:', uri);

  const ExamChange = require('./src/models/ExamChange');
  const SourceSnapshot = require('./src/models/SourceSnapshot');
  const { processSource } = require('./src/services/pipeline');

  const fakeSource = {
    name: 'SSC',
    scrape: async () => ({
      source: 'SSC',
      url: 'https://ssc.nic.in',
      text: 'EXAM_TOKEN something new',
      hash: 'hash-run-1',
    }),
  };

  // Run 1: hash differs from null -> change detected -> 1 saved
  const r1 = await processSource(fakeSource);
  console.log('[test] run1:', JSON.stringify(r1));

  // Run 2: identical hash -> no change
  const r2 = await processSource(fakeSource);
  console.log('[test] run2:', JSON.stringify(r2));

  const total = await ExamChange.countDocuments();
  const snap = await SourceSnapshot.findOne({ source: 'SSC' });
  console.log('[test] ExamChange count:', total, '| snapshot hash:', snap && snap.lastContentHash);

  // Assertions
  const ok = r1.changed === true && r1.newChanges === 1 && r2.changed === false && total === 1;
  console.log(ok ? '[test] PASS ✅' : '[test] FAIL ❌');

  await mongoose.disconnect();
  await mongod.stop();
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error('[test] error:', e);
  process.exit(1);
});
