const { getModel } = require('../store');
const crypto = require('crypto');

const MODEL = getModel('Exam');

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
    const doc = createExam(data);
    return MODEL.create(doc);
  },
  async insertMany(docs, opts) {
    const prepared = docs.map((d) => createExam(d));
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
  async aggregate(pipeline) {
    return MODEL.aggregate(pipeline);
  },
};

module.exports = Exam;
