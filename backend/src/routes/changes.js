const express = require('express');
const router = express.Router();
const ExamChange = require('../models/ExamChange');
const SourceSnapshot = require('../models/SourceSnapshot');
const { runAllSources } = require('../services/pipeline');
const { persistToDisk } = require('../storage');

const PAGE_LIMIT = 20;

async function handleStats(req, res) {
  try {
    const [total, byTypeAgg, bySourceAgg, snaps] = await Promise.all([
      ExamChange.countDocuments(),
      ExamChange.aggregate([{ $group: { _id: '$changeType', count: { $sum: 1 } } }]),
      ExamChange.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
      SourceSnapshot.find(),
    ]);
    const byType = {};
    (byTypeAgg || []).forEach((d) => (byType[d._id] = d.count));
    const bySource = {};
    (bySourceAgg || []).forEach((d) => (bySource[d._id] = d.count));
    const lastChecked = {};
    (snaps || []).forEach((s) => (lastChecked[s.source] = s.lastCheckedAt));
    res.json({ total, byType, bySource, lastChecked });
  } catch (err) {
    console.error('[API] GET /stats failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

async function handleSources(req, res) {
  try {
    const snaps = await SourceSnapshot.find();
    res.json({ sources: snaps });
  } catch (err) {
    console.error('[API] GET /sources failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
}

// Support both /stats and /changes/stats for backwards and docs compatibility
router.get('/stats', handleStats);
router.get('/changes/stats', handleStats);

// Support both /sources and /changes/sources
router.get('/sources', handleSources);
router.get('/changes/sources', handleSources);

// GET /api/changes?page=1  -> all changes, newest first, paginated
router.get('/changes', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * PAGE_LIMIT;
    let changes = await ExamChange.find();
    changes.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));
    const total = changes.length;
    const paged = changes.slice(skip, skip + PAGE_LIMIT);
    res.json({ total, page, limit: PAGE_LIMIT, count: paged.length, changes: paged });
  } catch (err) {
    console.error('[API] GET /changes failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch changes' });
  }
});

// GET /api/changes/:source?page=1  -> filter by source
router.get('/changes/:source', async (req, res) => {
  try {
    const source = req.params.source.toUpperCase();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * PAGE_LIMIT;
    let changes = await ExamChange.find({ source });
    changes.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));
    const total = changes.length;
    const paged = changes.slice(skip, skip + PAGE_LIMIT);
    res.json({ total, page, limit: PAGE_LIMIT, count: paged.length, changes: paged });
  } catch (err) {
    console.error('[API] GET /changes/:source failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch changes for source' });
  }
});

// POST /api/check-now -> manually trigger the full pipeline immediately
router.post('/check-now', async (req, res) => {
  try {
    const results = await runAllSources();
    await persistToDisk();
    res.json({ message: 'Check completed', results });
  } catch (err) {
    console.error('[API] POST /check-now failed:', err.message);
    res.status(500).json({ error: 'Check failed' });
  }
});

module.exports = router;
