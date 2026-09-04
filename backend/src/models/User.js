const { getModel } = require('../store');
const { isMongooseConnected } = require('../config/db');
const { MongooseUser } = require('./mongooseSchemas');
const crypto = require('crypto');

const MEMORY_MODEL = getModel('User');

function createUser(data) {
  const doc = Object.assign(
    {
      _id: crypto.randomUUID(),
      name: data.name || 'Aspirant',
      telegramChatId: data.telegramChatId || null,
      whatsappNumber: data.whatsappNumber || null,
      email: data.email || null,
      prefs: data.prefs || {
        sources: ['SSC', 'RRB', 'TNPSC', 'UPSC', 'IBPS', 'SBI'],
        exams: [],
        types: [
          'new_exam',
          'date_change',
          'admit_card',
          'result',
          'eligibility_revised',
          'corrigendum',
        ],
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
  async find(query = {}) {
    if (isMongooseConnected()) {
      return MongooseUser.find(query).lean();
    }
    return MEMORY_MODEL.find(query);
  },
  async findOne(query) {
    if (isMongooseConnected()) {
      return MongooseUser.findOne(query).lean();
    }
    return MEMORY_MODEL.findOne(query);
  },
  async findById(id) {
    if (isMongooseConnected()) {
      return MongooseUser.findById(id).lean();
    }
    return MEMORY_MODEL.findById(id);
  },
  async countDocuments(query = {}) {
    if (isMongooseConnected()) {
      return MongooseUser.countDocuments(query);
    }
    return MEMORY_MODEL.countDocuments(query);
  },
  async create(data) {
    if (isMongooseConnected()) {
      const created = await MongooseUser.create(data);
      return created.toObject();
    }
    const doc = createUser(data);
    return MEMORY_MODEL.create(doc);
  },
  async insertMany(docs, opts) {
    if (isMongooseConnected()) {
      return MongooseUser.insertMany(docs, opts);
    }
    const prepared = docs.map((d) => createUser(d));
    return MEMORY_MODEL.insertMany(prepared, opts);
  },
  async findOneAndUpdate(query, update, opts) {
    if (isMongooseConnected()) {
      return MongooseUser.findOneAndUpdate(query, update, { new: true, ...opts }).lean();
    }
    return MEMORY_MODEL.findOneAndUpdate(query, update, opts);
  },
  async findByIdAndUpdate(id, update, opts) {
    if (isMongooseConnected()) {
      return MongooseUser.findByIdAndUpdate(id, update, { new: true, ...opts }).lean();
    }
    return MEMORY_MODEL.findByIdAndUpdate(id, update, opts);
  },
  async updateOne(query, update, opts) {
    if (isMongooseConnected()) {
      return MongooseUser.updateOne(query, update, opts);
    }
    return MEMORY_MODEL.updateOne(query, update, opts);
  },
  async aggregate(pipeline) {
    if (isMongooseConnected()) {
      return MongooseUser.aggregate(pipeline);
    }
    return MEMORY_MODEL.aggregate(pipeline);
  },
};

module.exports = User;
