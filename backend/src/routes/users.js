const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/users — list aspirants
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json({ total: users.length, users });
  } catch (err) {
    console.error('[API] GET /users failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('[API] GET /users/:id failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users — create an aspirant
router.post('/users', async (req, res) => {
  try {
    const { name, telegramChatId, whatsappNumber, email, prefs } = req.body || {};
    const user = await User.create({ name, telegramChatId, whatsappNumber, email, prefs });
    res.status(201).json({ user });
  } catch (err) {
    console.error('[API] POST /users failed:', err.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id — update profile fields (phone/email/etc.)
router.put('/users/:id', async (req, res) => {
  try {
    const { name, telegramChatId, whatsappNumber, email } = req.body || {};
    const update = {};
    if (name !== undefined) update.name = name;
    if (telegramChatId !== undefined) update.telegramChatId = telegramChatId;
    if (whatsappNumber !== undefined) update.whatsappNumber = whatsappNumber;
    if (email !== undefined) update.email = email;
    const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('[API] PUT /users/:id failed:', err.message);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// PUT /api/users/:id/preferences — update exam preferences + channels
router.put('/users/:id/preferences', async (req, res) => {
  try {
    const { sources, exams, types, channels } = req.body || {};
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (sources !== undefined) user.prefs = user.prefs || {}; user.prefs.sources = sources;
    if (exams !== undefined) user.prefs = user.prefs || {}; user.prefs.exams = exams;
    if (types !== undefined) user.prefs = user.prefs || {}; user.prefs.types = types;
    if (channels !== undefined) user.prefs = user.prefs || {}; user.prefs.channels = channels;
    await User.updateOne({ _id: user._id }, { $set: { prefs: user.prefs } });
    res.json({ user });
  } catch (err) {
    console.error('[API] PUT /users/:id/preferences failed:', err.message);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

module.exports = router;
