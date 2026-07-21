const fs = require('fs');
const path = require('path');
const { fromJSON, toJSON } = require('./store');

const DATA_FILE = path.join(__dirname, '..', 'data', 'store.json');

async function loadFromDisk() {
  if (!fs.existsSync(DATA_FILE)) return;
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    fromJSON(raw);
    const total = (raw.changes?.length || 0) + (raw.exams?.length || 0) + (raw.users?.length || 0);
    console.log(`[storage] Loaded ${total} documents from disk`);
  } catch (err) {
    console.error('[storage] Failed to load from disk:', err.message);
  }
}

async function persistToDisk() {
  try {
    const data = toJSON();
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    const total = (data.changes?.length || 0) + (data.exams?.length || 0) + (data.users?.length || 0);
    console.log(`[storage] Persisted ${total} documents to disk`);
  } catch (err) {
    console.error('[storage] Failed to persist to disk:', err.message);
  }
}

module.exports = { loadFromDisk, persistToDisk };
