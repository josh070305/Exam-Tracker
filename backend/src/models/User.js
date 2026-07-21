const { getModel } = require('../store');
const crypto = require('crypto');

const MODEL = getModel('User');

function createUser(data) {
  const doc = Object.assign(
    {
      _id: crypto.randomUUID(),
      name: data.name || 'Aspirant',
      telegramChatId: data.telegramChatId || null,
      whatsappNumber: data.whatsappNumber || null,
      email: data.email || null,
      prefs: data.prefs || {
        sources: [],
        exams: [],
        types: [],
        channels: { telegram: true, whatsapp: false, email: false },
      },
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    },
    data
  );
  if (!doc._id) doc._id = crypto.randomUUID();
  return doc;
}

const User = {
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
    const doc = createUser(data);
    return MODEL.create(doc);
  },
  async insertMany(docs, opts) {
    const prepared = docs.map((d) => createUser(d));
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

module.exports = User;
