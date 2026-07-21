const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');

// GET /api/exams — list the versioned knowledge base (one per exam)
router.get('/exams', async (req, res) => {
  try {
    const exams = await Exam.find();
    const list = exams.map((e) => ({
      id: e._id,
      source: e.source,
      examName: e.examName,
      versionCount: e.versions ? e.versions.length : 0,
      updatedAt: e.updatedAt,
      current: e.current,
    }));
    res.json({ total: list.length, exams: list });
  } catch (err) {
    console.error('[API] GET /exams failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// GET /api/exams/:id — full change history for one exam
router.get('/exams/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    res.json({ exam });
  } catch (err) {
    console.error('[API] GET /exams/:id failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

module.exports = router;
