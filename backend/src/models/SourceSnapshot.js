const { getModel } = require('../store');
const { isMongooseConnected } = require('../config/db');
const { MongooseSourceSnapshot } = require('./mongooseSchemas');
const crypto = require('crypto');

const MEMORY_MODEL = getModel('SourceSnapshot');

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
  async find(query = {}) {
    if (isMongooseConnected()) {
      return MongooseSourceSnapshot.find(query).lean();
    }
    return MEMORY_MODEL.find(query);
  },
  async findOne(query) {
    if (isMongooseConnected()) {
      return MongooseSourceSnapshot.findOne(query).lean();
    }
    return MEMORY_MODEL.findOne(query);
  },
  async findById(id) {
    if (isMongooseConnected()) {
      return MongooseSourceSnapshot.findById(id).lean();
    }
    return MEMORY_MODEL.findById(id);
  },
  async countDocuments(query = {}) {
    if (isMongooseConnected()) {
      return MongooseSourceSnapshot.countDocuments(query);
    }
    return MEMORY_MODEL.countDocuments(query);
  },
  async create(data) {
    if (isMongooseConnected()) {
      const created = await MongooseSourceSnapshot.create(data);
      return created.toObject();
    }
    const doc = createSourceSnapshot(data);
    return MEMORY_MODEL.create(doc);
  },
  async insertMany(docs, opts) {
    if (isMongooseConnected()) {
      return MongooseSourceSnapshot.insertMany(docs, opts);
    }
    const prepared = docs.map((d) => createSourceSnapshot(d));
    return MEMORY_MODEL.insertMany(prepared, opts);
  },
  async findOneAndUpdate(query, update, opts) {
    if (isMongooseConnected()) {
      return MongooseSourceSnapshot.findOneAndUpdate(query, update, { new: true, ...opts }).lean();
    }
    return MEMORY_MODEL.findOneAndUpdate(query, update, opts);
  },
  async findByIdAndUpdate(id, update, opts) {
    if (isMongooseConnected()) {
      return MongooseSourceSnapshot.findByIdAndUpdate(id, update, { new: true, ...opts }).lean();
    }
    return MEMORY_MODEL.findByIdAndUpdate(id, update, opts);
  },
  async updateOne(query, update, opts) {
    if (isMongooseConnected()) {
      return MongooseSourceSnapshot.updateOne(query, update, opts);
    }
    return MEMORY_MODEL.updateOne(query, update, opts);
  },
};

module.exports = SourceSnapshot;
