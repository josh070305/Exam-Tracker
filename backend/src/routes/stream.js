const express = require('express');
const router = express.Router();
const { addClient, getConnectedClientCount } = require('../services/sse');

// GET /api/stream — Server-Sent Events stream for real-time exam updates
router.get('/stream', (req, res) => {
  // Explicitly write 200 headers with anti-buffering and CORS
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    'X-Accel-Buffering': 'no',
  });

  // Safe initial welcome payload
  res.write(
    `event: connected\ndata: ${JSON.stringify({
      message: 'Connected to GovExam Tracker Live Stream',
      activeClients: getConnectedClientCount() + 1,
    })}\n\n`
  );

  addClient(res);

  // Heartbeat comment every 15s to keep TCP connection alive
  const heartbeat = setInterval(() => {
    try {
      if (!res.writableEnded && !res.destroyed) {
        res.write(': heartbeat\n\n');
      }
    } catch {
      clearInterval(heartbeat);
    }
  }, 15000);

  const cleanup = () => {
    clearInterval(heartbeat);
  };

  req.on('close', cleanup);
  req.on('end', cleanup);
  res.on('close', cleanup);
  res.on('error', cleanup);
  req.on('error', cleanup);
});

module.exports = router;
