const express = require('express');
const cors = require('cors');
const { env } = require('./config/env');
const { connectDB } = require('./config/db');
const healthRoutes = require('./routes/health');
const changesRoutes = require('./routes/changes');
const examsRoutes = require('./routes/exams');
const usersRoutes = require('./routes/users');
const streamRoutes = require('./routes/stream');
const demoRoutes = require('./routes/demo');
const { startScheduler } = require('./jobs/scheduler');
const { initBot } = require('./services/telegram');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api', changesRoutes);
app.use('/api', examsRoutes);
app.use('/api', usersRoutes);
app.use('/api', streamRoutes);
app.use('/api', demoRoutes);

// 404 fallback
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await connectDB();
  initBot();
  startScheduler();
  const server = app.listen(Number(env.PORT), () => {
    console.log(`[Server] Exam Tracker backend running on http://localhost:${env.PORT}`);
  });
  return server;
}

if (require.main === module) {
  start().catch((err) => {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  });
}

module.exports = { app, start };
