process.env.AI_PROVIDER = 'groq';
(async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongoose = require('mongoose');
  const express = require('express');

  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const ExamChange = require('./src/models/ExamChange');
  const SourceSnapshot = require('./src/models/SourceSnapshot');

  await new ExamChange({ source: 'SSC', examName: 'SSC CGL 2026', changeType: 'new_exam', changedField: 'status', newValue: 'released', summary: 'SSC CGL 2026 notification released.' }).save();
  await new ExamChange({ source: 'RRB', examName: 'RRB NTPC 2026', changeType: 'admit_card', changedField: 'admitCard', newValue: 'released', summary: 'RRB NTPC 2026 admit card released.' }).save();
  await new SourceSnapshot({ source: 'SSC', lastContentHash: 'h1', lastCheckedAt: new Date() }).save();
  await new SourceSnapshot({ source: 'RRB', lastContentHash: 'h2', lastCheckedAt: new Date() }).save();

  const app = express();
  app.use(express.json());
  app.use('/api', require('./src/routes/health'));
  app.use('/api', require('./src/routes/changes'));

  await new Promise((r) => app.listen(5056, r));
  const base = 'http://localhost:5056/api';

  const stats = await (await fetch(base + '/stats')).json();
  const sources = await (await fetch(base + '/sources')).json();
  const changes = await (await fetch(base + '/changes')).json();

  console.log('[test] stats:', JSON.stringify(stats));
  console.log('[test] sources:', JSON.stringify(sources));
  console.log('[test] changes.total:', changes.total);

  const pass =
    stats.total === 2 &&
    stats.bySource.SSC === 1 &&
    stats.bySource.RRB === 1 &&
    stats.byType.new_exam === 1 &&
    sources.sources.length === 2 &&
    changes.total === 2;
  console.log(pass ? '[test] PASS' : '[test] FAIL');

  await mongoose.disconnect();
  await mongod.stop();
  process.exit(pass ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
