const express = require('express');
const router = express.Router();
const AgentRun = require('../models/AgentRun');
const ExamChange = require('../models/ExamChange');
const Exam = require('../models/Exam');

router.get('/agent/runs', async (req, res) => {
  try {
    const runs = await AgentRun.find({});
    res.json({ total: runs.length, runs });
  } catch (err) {
    console.error('[API] GET /agent/runs failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch agent runs' });
  }
});

router.get('/agent/runs/:id', async (req, res) => {
  try {
    const run = await AgentRun.findById(req.params.id);
    if (!run) return res.status(404).json({ error: 'Agent run not found' });
    res.json({ run });
  } catch (err) {
    console.error('[API] GET /agent/runs/:id failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch agent run' });
  }
});

router.get('/deadlines', async (req, res) => {
  try {
    const upcoming = await ExamChange.find({
      $or: [
        { deadline: { $ne: null } },
        { effectiveDate: { $ne: null } },
      ],
    });

    const normalized = (upcoming || [])
      .map((change) => {
        const deadline = change.deadline || change.effectiveDate;
        if (!deadline) return null;

        const when = new Date(deadline);
        const now = new Date();
        const msLeft = when.getTime() - now.getTime();
        return {
          id: change._id,
          examName: change.examName,
          source: change.source,
          board: change.board || change.source,
          changeType: change.changeType,
          summary: change.summary,
          deadline: when,
          daysLeft: Math.ceil(msLeft / (1000 * 60 * 60 * 24)),
          overdue: msLeft < 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    res.json({ total: normalized.length, deadlines: normalized });
  } catch (err) {
    console.error('[API] GET /deadlines failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch deadlines' });
  }
});

router.get('/deadlines/calendar.ics', async (req, res) => {
  try {
    const deadlines = await ExamChange.find({
      $or: [
        { deadline: { $ne: null } },
        { effectiveDate: { $ne: null } },
      ],
    });

    const events = (deadlines || [])
      .map((change) => {
        const date = change.deadline || change.effectiveDate;
        if (!date) return null;
        const d = new Date(date);
        const dt = d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
        return [
          'BEGIN:VEVENT',
          `UID:${change._id}@exam-tracker`,
          `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`,
          `DTSTART;VALUE=DATE:${dt.slice(0, 8)}`,
          `SUMMARY:${(change.examName || 'Exam deadline').replace(/[,;]/g, '')}`,
          `DESCRIPTION:${(change.summary || '').replace(/[,;]/g, '').slice(0, 200)}`,
          'END:VEVENT',
        ].join('\n');
      })
      .filter(Boolean)
      .join('\n');

    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Exam Tracker//EN', events, 'END:VCALENDAR'].join('\n');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="deadlines.ics"');
    res.send(ics);
  } catch (err) {
    console.error('[API] GET /deadlines/calendar.ics failed:', err.message);
    res.status(500).json({ error: 'Failed to generate calendar feed' });
  }
});

router.get('/digest/today', async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const changes = await ExamChange.find({
      detectedAt: { $gte: start, $lte: end },
    });

    const digest = {
      date: start.toISOString(),
      count: changes.length,
      changes: (changes || []).slice(0, 10).map((change) => ({
        id: change._id,
        source: change.source,
        examName: change.examName,
        changeType: change.changeType,
        summary: change.summary,
        deadline: change.deadline || change.effectiveDate || null,
      })),
    };

    res.json(digest);
  } catch (err) {
    console.error('[API] GET /digest/today failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch digest' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q) {
      const recent = await ExamChange.find({}).sort({ detectedAt: -1 }).limit(10);
      return res.json({ query: '', total: recent.length, results: recent });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const [changes, exams] = await Promise.all([
      ExamChange.find({
        $or: [
          { examName: regex },
          { summary: regex },
          { source: regex },
          { board: regex },
          { changeType: regex },
        ],
      }).limit(20),
      Exam.find({
        $or: [
          { examName: regex },
          { source: regex },
          { board: regex },
        ],
      }).limit(20),
    ]);

    const results = [
      ...changes.map((item) => ({ type: 'change', ...item.toObject ? item.toObject() : item })),
      ...exams.map((item) => ({ type: 'exam', ...item.toObject ? item.toObject() : item })),
    ];

    res.json({ query: q, total: results.length, results });
  } catch (err) {
    console.error('[API] GET /search failed:', err.message);
    res.status(500).json({ error: 'Failed to search exam records' });
  }
});

module.exports = router;
