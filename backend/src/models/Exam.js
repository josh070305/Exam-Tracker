const { getModel } = require('../store');
const { isMongooseConnected } = require('../config/db');
const { MongooseExam } = require('./mongooseSchemas');
const crypto = require('crypto');

const MEMORY_MODEL = getModel('Exam');

function createExam(data) {
  const doc = Object.assign(
    {
      _id: crypto.randomUUID(),
      key: data.key,
      source: data.source,
      examName: data.examName || null,
      current: data.current || {},
      versions: data.versions || [],
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    },
    data
  );
  if (!doc._id) doc._id = crypto.randomUUID();
  return doc;
}

const Exam = {
  async find(query = {}) {
    if (isMongooseConnected()) {
      return MongooseExam.find(query).lean();
    }
    return MEMORY_MODEL.find(query);
  },
  async findOne(query) {
    if (isMongooseConnected()) {
      return MongooseExam.findOne(query).lean();
    }
    return MEMORY_MODEL.findOne(query);
  },
  async findById(id) {
    if (isMongooseConnected()) {
      return MongooseExam.findById(id).lean();
    }
    return MEMORY_MODEL.findById(id);
  },
  async countDocuments(query = {}) {
    if (isMongooseConnected()) {
      return MongooseExam.countDocuments(query);
    }
    return MEMORY_MODEL.countDocuments(query);
  },
  async create(data) {
    if (isMongooseConnected()) {
      const created = await MongooseExam.create(data);
      return created.toObject();
    }
    const doc = createExam(data);
    return MEMORY_MODEL.create(doc);
  },
  async insertMany(docs, opts) {
    if (isMongooseConnected()) {
      return MongooseExam.insertMany(docs, opts);
    }
    const prepared = docs.map((d) => createExam(d));
    return MEMORY_MODEL.insertMany(prepared, opts);
  },
  async findOneAndUpdate(query, update, opts) {
    if (isMongooseConnected()) {
      return MongooseExam.findOneAndUpdate(query, update, { new: true, ...opts }).lean();
    }
    return MEMORY_MODEL.findOneAndUpdate(query, update, opts);
  },
  async findByIdAndUpdate(id, update, opts) {
    if (isMongooseConnected()) {
      return MongooseExam.findByIdAndUpdate(id, update, { new: true, ...opts }).lean();
    }
    return MEMORY_MODEL.findByIdAndUpdate(id, update, opts);
  },
  async updateOne(query, update, opts) {
    if (isMongooseConnected()) {
      return MongooseExam.updateOne(query, update, opts);
    }
    return MEMORY_MODEL.updateOne(query, update, opts);
  },
  async aggregate(pipeline) {
    if (isMongooseConnected()) {
      return MongooseExam.aggregate(pipeline);
    }
    return MEMORY_MODEL.aggregate(pipeline);
  },
};

module.exports = Exam;
