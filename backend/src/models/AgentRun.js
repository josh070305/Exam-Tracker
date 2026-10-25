const { getModel } = require('../store');
const { isMongooseConnected } = require('../config/db');
const { MongooseAgentRun } = require('./mongooseSchemas');
const crypto = require('crypto');

const MEMORY_MODEL = getModel('AgentRun');

function createAgentRun(data) {
  const doc = Object.assign(
    {
      _id: crypto.randomUUID(),
      startedAt: data.startedAt || new Date(),
      finishedAt: data.finishedAt || null,
      trigger: data.trigger || 'manual',
      status: data.status || 'running',
      sourcesChecked: data.sourcesChecked || 0,
      changesFound: data.changesFound || 0,
      tokensIn: data.tokensIn || 0,
      tokensOut: data.tokensOut || 0,
      tokensCached: data.tokensCached || 0,
      model: data.model || null,
      steps: data.steps || [],
      errors: data.errors || [],
      sourceResults: data.sourceResults || [],
    },
    data
  );
  if (!doc._id) doc._id = crypto.randomUUID();
  return doc;
}

const AgentRun = {
  async find(query = {}) {
    if (isMongooseConnected()) {
      return MongooseAgentRun.find(query).sort({ startedAt: -1 }).lean();
    }
    const docs = await MEMORY_MODEL.find(query);
    return docs.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  },
  async findOne(query) {
    if (isMongooseConnected()) {
      return MongooseAgentRun.findOne(query).lean();
    }
    return MEMORY_MODEL.findOne(query);
  },
  async findById(id) {
    if (isMongooseConnected()) {
      return MongooseAgentRun.findById(id).lean();
    }
    return MEMORY_MODEL.findById(id);
  },
  async countDocuments(query = {}) {
    if (isMongooseConnected()) {
      return MongooseAgentRun.countDocuments(query);
    }
    return MEMORY_MODEL.countDocuments(query);
  },
  async create(data) {
    if (isMongooseConnected()) {
      const created = await MongooseAgentRun.create(data);
      return created.toObject();
    }
    const doc = createAgentRun(data);
    return MEMORY_MODEL.create(doc);
  },
  async findByIdAndUpdate(id, update, opts) {
    if (isMongooseConnected()) {
      return MongooseAgentRun.findByIdAndUpdate(id, update, { new: true, ...opts }).lean();
    }
    return MEMORY_MODEL.findByIdAndUpdate(id, update, opts);
  },
  async updateOne(query, update, opts) {
    if (isMongooseConnected()) {
      return MongooseAgentRun.updateOne(query, update, opts);
    }
    return MEMORY_MODEL.updateOne(query, update, opts);
  },
};

module.exports = AgentRun;
