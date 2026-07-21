require('dotenv').config();
process.env.TELEGRAM_BOT_TOKEN = ''; // skip real sends during test

const path = require('path');

// Deterministic AI mock that returns one exam item per board, exercising
// the change types (incl. corrigendum) and the aspirant's preferences.
const fakeAi = {
  extractChanges: async (text) => {
    if (text.includes('TNPSC')) return [{ examName: 'TNPSC Group 2 2026', changeType: 'corrigendum', changedField: 'examDate', oldValue: '18 October 2026', newValue: '01 November 2026', summary: 'TNPSC Group 2 2026 prelims date revised from Oct 18 to Nov 1.' }];
    if (text.includes('UPSC')) return [{ examName: 'UPSC CDS 2027', changeType: 'new_exam', summary: 'UPSC CDS (I) 2027 notification released.' }];
    if (text.includes('IBPS')) return [{ examName: 'IBPS PO 2026', changeType: 'result', summary: 'IBPS CRP PO XIV 2026 result declared.' }];
    if (text.includes('SBI')) return [{ examName: 'SBI PO 2026', changeType: 'eligibility_revised', summary: 'SBI PO 2026 eligibility revised.' }];
    if (text.includes('RRB')) return [{ examName: 'RRB NTPC 2026', changeType: 'admit_card', summary: 'RRB NTPC 2026 admit card released.' }];
    return [{ examName: 'SSC CGL 2026', changeType: 'date_change', changedField: 'examDate', oldValue: '15 August 2026', newValue: '03 September 2026', summary: 'SSC CGL 2026 Tier-1 exam date moved from Aug 15 to Sep 3.' }];
  },
};
const aiPath = path.resolve(__dirname, 'src/services/aiExtraction.js');
require.cache[aiPath] = { id: aiPath, filename: aiPath, loaded: true, exports: fakeAi };

(async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongoose = require('mongoose');
  const express = require('express');

  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const User = require('./src/models/User');
  const Exam = require('./src/models/Exam');
  const { matches } = require('./src/services/alerting');

  // Seed the aspirant from the prompt: SSC CGL, RRB NTPC, TNPSC Group 2.
  const prefs = {
    sources: ['SSC', 'RRB', 'TNPSC'],
    exams: ['SSC CGL', 'RRB NTPC', 'TNPSC Group 2'],
    types: ['new_exam', 'date_change', 'admit_card', 'result', 'eligibility_revised', 'corrigendum'],
    channels: { telegram: true, whatsapp: false, email: false },
  };
  const user = await User.create({ name: 'Demo Aspirant', telegramChatId: process.env.TELEGRAM_CHAT_ID || '7171410498', prefs });

  const app = express();
  app.use(express.json());
  app.use('/api', require('./src/routes/health'));
  app.use('/api', require('./src/routes/changes'));
  app.use('/api', require('./src/routes/exams'));
  app.use('/api', require('./src/routes/users'));
  await new Promise((r) => app.listen(5058, r));
  const base = 'http://localhost:5058/api';

  const check = await (await fetch(base + '/check-now', { method: 'POST' })).json();
  const stats = await (await fetch(base + '/stats')).json();
  const exams = await (await fetch(base + '/exams')).json();
  const users = await (await fetch(base + '/users')).json();
  const exam0 = await (await fetch(base + `/exams/${exams.exams[0].id}`)).json();

  // Preference matching unit checks
  const a = user.prefs;
  const mSSC = matches({ source: 'SSC', examName: 'SSC CGL 2026', changeType: 'date_change' }, a);
  const mTNPSC = matches({ source: 'TNPSC', examName: 'TNPSC Group 2 2026', changeType: 'corrigendum' }, a);
  const mUPSC = matches({ source: 'UPSC', examName: 'UPSC CDS 2027', changeType: 'new_exam' }, a);
  const mIBPS = matches({ source: 'IBPS', examName: 'IBPS PO 2026', changeType: 'result' }, a);
  const mSBI = matches({ source: 'SBI', examName: 'SBI PO 2026', changeType: 'eligibility_revised' }, a);

  // Re-point preferences to UPSC only, then UPSC should match.
  await fetch(base + `/users/${user._id}/preferences`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sources: ['UPSC'], exams: ['UPSC CDS'], types: ['new_exam'] }),
  });
  const reloaded = await User.findById(user._id).lean();
  const mUPSCafter = matches({ source: 'UPSC', examName: 'UPSC CDS 2027', changeType: 'new_exam' }, reloaded.prefs);

  console.log('check results:', JSON.stringify(check.results.map((r) => ({ s: r.source, new: r.newChanges }))));
  console.log('stats.total:', stats.total, '| exams:', exams.total, '| users:', users.total);
  console.log('matches SSC/TNPSC(true) UPSC/IBPS/SBI(false):', mSSC, mTNPSC, mUPSC, mIBPS, mSBI);
  console.log('UPSC match after re-pref (true):', mUPSCafter);
  console.log('exam0 history versions:', exam0.exam.versions.length);

  const pass =
    stats.total === 6 && exams.total === 6 && users.total === 1 &&
    exam0.exam.versions.length >= 1 &&
    mSSC === true && mTNPSC === true && mUPSC === false && mIBPS === false && mSBI === false &&
    mUPSCafter === true;
  console.log(pass ? '[test] PASS ✅' : '[test] FAIL ❌');

  await mongoose.disconnect();
  await mongod.stop();
  process.exit(pass ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
