const express = require('express');
const router = express.Router();
const { addClient, getConnectedClientCount } = require('../services/sse');

// GET /api/stream — Server-Sent Events stream for real-time exam updates
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Initial welcome event
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to Exam Tracker Live Stream', activeClients: getConnectedClientCount() + 1 })}\n\n`);

  addClient(res);

  // Keep-alive heartbeat every 25 seconds to prevent browser/proxy timeouts
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

module.exports = router;
