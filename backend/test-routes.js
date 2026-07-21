// Boot test: start an in-memory Mongo, mount the real routes, and hit them.
process.env.AI_PROVIDER = 'groq';

const path = require('path');
const fakeAi = {
  extractChanges: async () => [
    { examName: 'RRB NTPC 2026', changeType: 'admit_card', changedField: 'admitCard', oldValue: null, newValue: 'released', summary: 'RRB NTPC 2026 admit card released.' },
  ],
};
const aiPath = path.resolve(__dirname, 'src/services/aiExtraction.js');
require.cache[aiPath] = { id: aiPath, filename: aiPath, loaded: true, exports: fakeAi };

(async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongoose = require('mongoose');
  const express = require('express');

  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  // Import models so collections are registered, then seed one record.
  const ExamChange = require('./src/models/ExamChange');
  await new ExamChange({
    source: 'RRB', examName: 'RRB NTPC 2026', changeType: 'admit_card',
    changedField: 'admitCard', newValue: 'released', summary: 'RRB NTPC 2026 admit card released.',
  }).save();

  const app = express();
  app.use(express.json());
  app.use('/api', require('./src/routes/health'));
  app.use('/api', require('./src/routes/changes'));

  await new Promise((res) => app.listen(5055, res));

  const base = 'http://localhost:5055/api';
  const health = await (await fetch(base + '/health')).json();
  console.log('[routes] /health:', JSON.stringify(health));

  const all = await (await fetch(base + '/changes')).json();
  console.log('[routes] /changes total:', all.total, 'count:', all.count);

  const bySource = await (await fetch(base + '/changes/RRB')).json();
  console.log('[routes] /changes/RRB total:', bySource.total);

  const pass = health.status === 'ok' && all.total === 1 && bySource.total === 1;
  console.log(pass ? '[routes] PASS ✅' : '[routes] FAIL ❌');

  await mongoose.disconnect();
  await mongod.stop();
  process.exit(pass ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
