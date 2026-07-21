const express = require('express');
const cors = require('cors');
const { env } = require('./config/env');
const { connectDB } = require('./config/db');
const healthRoutes = require('./routes/health');
const changesRoutes = require('./routes/changes');
const examsRoutes = require('./routes/exams');
const usersRoutes = require('./routes/users');
const { startScheduler } = require('./jobs/scheduler');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api', changesRoutes);
app.use('/api', examsRoutes);
app.use('/api', usersRoutes);

// 404 fallback
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await connectDB();
  startScheduler();
  app.listen(Number(env.PORT), () => {
    console.log(`[Server] Exam Tracker backend running on http://localhost:${env.PORT}`);
  });
}

start().catch((err) => {
  console.error('[Server] Failed to start:', err.message);
  process.exit(1);
});
