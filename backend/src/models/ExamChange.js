const { getModel } = require('../store');
const crypto = require('crypto');

const MODEL = getModel('ExamChange');

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
      detectedAt: data.detectedAt || new Date(),
      contentHash: data.contentHash || null,
    },
    data
  );
  if (!doc._id) doc._id = crypto.randomUUID();
  return doc;
}

const ExamChange = {
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
    const doc = createExamChange(data);
    return MODEL.create(doc);
  },
  async insertMany(docs, opts) {
    const prepared = docs.map((d) => createExamChange(d));
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

module.exports = ExamChange;
