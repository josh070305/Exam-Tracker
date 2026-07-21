const SourceSnapshot = require('../models/SourceSnapshot');

async function getOrCreateSnapshot(source) {
  let snap = await SourceSnapshot.findOne({ source });
  if (!snap) {
    snap = await SourceSnapshot.create({ source, lastContentHash: null });
  }
  return snap;
}

// Returns { changed, snapshot }. Compares the freshly computed hash against
// the last stored hash for this source.
async function hasChanged(source, newHash) {
  const snap = await getOrCreateSnapshot(source);
  const changed = snap.lastContentHash !== newHash;
  return { changed, snapshot: snap };
}

async function updateSnapshot(source, hash) {
  await SourceSnapshot.updateOne(
    { source },
    { $set: { lastContentHash: hash, lastCheckedAt: new Date() } },
    { upsert: true }
  );
}

module.exports = { getOrCreateSnapshot, hasChanged, updateSnapshot };
