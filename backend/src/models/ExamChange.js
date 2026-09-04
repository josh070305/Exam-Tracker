const { getModel } = require('../store');
const { isMongooseConnected } = require('../config/db');
const { MongooseExamChange } = require('./mongooseSchemas');
const crypto = require('crypto');

const MEMORY_MODEL = getModel('ExamChange');

function createExamChange(data) {
  const doc = Object.assign(
    {
      _id: crypto.randomUUID(),
      source: data.source || null,
      examName: data.examName || null,
      changeType: data.changeType || 'new_exam',
      changedField: data.changedField || null,
      oldValue: data.oldValue != null ? data.oldValue : null,
      newValue: data.newValue != null ? data.newValue : null,
      effectiveDate: data.effectiveDate || null,
      summary: data.summary || '',
      rawSnippet: data.rawSnippet || null,
      pdfUrl: data.pdfUrl || null,
      detectedAt: data.detectedAt || new Date(),
      contentHash: data.contentHash || null,
    },
    data
  );
  if (!doc._id) doc._id = crypto.randomUUID();
  return doc;
}

const ExamChange = {
  async find(query = {}) {
    if (isMongooseConnected()) {
      return MongooseExamChange.find(query).lean();
    }
    return MEMORY_MODEL.find(query);
  },
  async findOne(query) {
    if (isMongooseConnected()) {
      return MongooseExamChange.findOne(query).lean();
    }
    return MEMORY_MODEL.findOne(query);
  },
  async findById(id) {
    if (isMongooseConnected()) {
      return MongooseExamChange.findById(id).lean();
    }
    return MEMORY_MODEL.findById(id);
  },
  async countDocuments(query = {}) {
    if (isMongooseConnected()) {
      return MongooseExamChange.countDocuments(query);
    }
    return MEMORY_MODEL.countDocuments(query);
  },
  async create(data) {
    if (isMongooseConnected()) {
      const created = await MongooseExamChange.create(data);
      return created.toObject();
    }
    const doc = createExamChange(data);
    return MEMORY_MODEL.create(doc);
  },
  async insertMany(docs, opts) {
    if (isMongooseConnected()) {
      return MongooseExamChange.insertMany(docs, opts);
    }
    const prepared = docs.map((d) => createExamChange(d));
    return MEMORY_MODEL.insertMany(prepared, opts);
  },
  async findOneAndUpdate(query, update, opts) {
    if (isMongooseConnected()) {
      return MongooseExamChange.findOneAndUpdate(query, update, { new: true, ...opts }).lean();
    }
    return MEMORY_MODEL.findOneAndUpdate(query, update, opts);
  },
  async findByIdAndUpdate(id, update, opts) {
    if (isMongooseConnected()) {
      return MongooseExamChange.findByIdAndUpdate(id, update, { new: true, ...opts }).lean();
    }
    return MEMORY_MODEL.findByIdAndUpdate(id, update, opts);
  },
  async updateOne(query, update, opts) {
    if (isMongooseConnected()) {
      return MongooseExamChange.updateOne(query, update, opts);
    }
    return MEMORY_MODEL.updateOne(query, update, opts);
  },
  async aggregate(pipeline) {
    if (isMongooseConnected()) {
      return MongooseExamChange.aggregate(pipeline);
    }
    return MEMORY_MODEL.aggregate(pipeline);
  },
};

module.exports = ExamChange;
