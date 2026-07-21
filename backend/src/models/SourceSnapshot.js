const { getModel } = require('../store');
const crypto = require('crypto');

const MODEL = getModel('SourceSnapshot');

function createSourceSnapshot(data) {
  const doc = Object.assign(
    {
      _id: crypto.randomUUID(),
      source: data.source,
      lastContentHash: data.lastContentHash || null,
      lastCheckedAt: data.lastCheckedAt || new Date(),
    },
    data
  );
  if (!doc._id) doc._id = crypto.randomUUID();
  return doc;
}

const SourceSnapshot = {
  async find(query) {
    return MODEL.find(query);
  },
  async findOne(query) {
    return MODEL.findOne(query);
  },
  async findById(id) {
    return MODEL.findById(id);
  },
  async countDocuments(query) {
    return MODEL.countDocuments(query);
  },
  async create(data) {
    const doc = createSourceSnapshot(data);
    return MODEL.create(doc);
  },
  async insertMany(docs, opts) {
    const prepared = docs.map((d) => createSourceSnapshot(d));
    return MODEL.insertMany(prepared, opts);
  },
  async findOneAndUpdate(query, update, opts) {
    return MODEL.findOneAndUpdate(query, update, opts);
  },
  async findByIdAndUpdate(id, update, opts) {
    return MODEL.findByIdAndUpdate(id, update, opts);
  },
  async updateOne(query, update, opts) {
    return MODEL.updateOne(query, update, opts);
  },
  async save(doc) {
    if (!doc._id) doc._id = crypto.randomUUID();
    MODEL.docs.set(doc._id, doc);
    return doc;
  },
};

module.exports = SourceSnapshot;
