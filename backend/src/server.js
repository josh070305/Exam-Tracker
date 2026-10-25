const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { env } = require('./config/env');
const { connectDB } = require('./config/db');
const healthRoutes = require('./routes/health');
const changesRoutes = require('./routes/changes');
const examsRoutes = require('./routes/exams');
const usersRoutes = require('./routes/users');
const streamRoutes = require('./routes/stream');
const demoRoutes = require('./routes/demo');
const agentRoutes = require('./routes/agent');
const { startScheduler } = require('./jobs/scheduler');
const { initBot, registerWebhookRoute } = require('./services/telegram');

const app = express();
registerWebhookRoute(app);
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.use('/api', healthRoutes);
app.use('/api', changesRoutes);
app.use('/api', examsRoutes);
app.use('/api', usersRoutes);
app.use('/api', streamRoutes);
app.use('/api', demoRoutes);
app.use('/api', agentRoutes);

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
