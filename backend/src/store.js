const { randomUUID } = require('crypto');

function ensureId(doc) {
  if (!doc._id) doc._id = randomUUID();
  return doc;
}

class InMemoryCollection {
  constructor(name) {
    this.name = name;
    this.docs = new Map();
  }

  _match(query) {
    if (!query || Object.keys(query).length === 0) return Array.from(this.docs.values());
    return Array.from(this.docs.values()).filter((d) => {
      for (const key of Object.keys(query)) {
        if (key === '_id') {
          if (d._id !== query._id && String(d._id) !== String(query._id)) return false;
        } else if (key.startsWith('$')) {
          continue;
        } else {
          if (d[key] !== query[key]) return false;
        }
      }
      return true;
    });
  }

  _applySort(docs, sort) {
    if (!sort) return docs;
    const entries = Object.entries(sort);
    return docs.slice().sort((a, b) => {
      for (const [field, dir] of entries) {
        const av = a[field];
        const bv = b[field];
        if (av === bv) continue;
        const cmp = av < bv ? -1 : 1;
        return dir === -1 ? -cmp : cmp;
      }
      return 0;
    });
  }

  _lean(doc) {
    if (!doc) return doc;
    const clone = Object.assign({}, doc);
    delete clone.__v;
    return clone;
  }

  async find(query) {
    return this._match(query);
  }

  async findOne(query) {
    return this._match(query)[0] || null;
  }

  async findById(id) {
    for (const doc of Array.from(this.docs.values())) {
      if (String(doc._id) === String(id)) return doc;
    }
    return null;
  }

  async countDocuments(query) {
    return this._match(query).length;
  }

  async create(data) {
    const doc = ensureId(Object.assign({}, data));
    this.docs.set(doc._id, doc);
    return doc;
  }

  async insertMany(docs, opts = {}) {
    const out = [];
    for (const d of docs) {
      const doc = ensureId(Object.assign({}, d));
      if (!opts.ordered) {
        try { this.docs.set(doc._id, doc); } catch {}
      } else {
        this.docs.set(doc._id, doc);
      }
      out.push(doc);
    }
    return out;
  }

  async findOneAndUpdate(query, update, opts = {}) {
    let doc = await this.findOne(query);
    if (!doc) {
      if (opts.upsert) {
        const merged = Object.assign({}, query, update.$set || {}, update.$setOnInsert || {});
        if (update.$push) {
          for (const [k, v] of Object.entries(update.$push)) {
            if (!merged[k]) merged[k] = [];
            merged[k].push(v);
          }
        }
        doc = ensureId(merged);
        this.docs.set(doc._id, doc);
        return this._lean(doc);
      }
      return null;
    }
    if (update.$set) Object.assign(doc, update.$set);
    if (update.$setOnInsert) {
      for (const k of Object.keys(update.$setOnInsert)) {
        if (!(k in doc)) doc[k] = update.$setOnInsert[k];
      }
    }
    if (update.$push) {
      for (const [k, v] of Object.entries(update.$push)) {
        if (!Array.isArray(doc[k])) doc[k] = [];
        doc[k].push(v);
      }
    }
    return this._lean(doc);
  }

  async findByIdAndUpdate(id, update, opts = {}) {
    const doc = await this.findById(id);
    if (!doc) return null;
    if (update.$set) Object.assign(doc, update.$set);
    return this._lean(doc);
  }

  async updateOne(query, update, opts = {}) {
    const doc = await this.findOne(query);
    if (!doc) return { acknowledged: true, modifiedCount: 0 };
    if (update.$set) Object.assign(doc, update.$set);
    return { acknowledged: true, modifiedCount: 1 };
  }

  async aggregate(pipeline) {
    let docs = Array.from(this.docs.values());
    for (const stage of pipeline) {
      if (stage.$group) {
        const groups = new Map();
        const idExpr = stage.$group._id;
        for (const doc of docs) {
          let val;
          if (typeof idExpr === 'string' && idExpr.startsWith('$')) {
            val = doc[idExpr.slice(1)];
          } else {
            val = doc[idExpr];
          }
          const gKey = typeof val === 'string' ? val : JSON.stringify(val);
          if (!groups.has(gKey)) groups.set(gKey, { _id: val, count: 0 });
          groups.get(gKey).count += 1;
        }
        docs = Array.from(groups.values());
      }
    }
    return docs;
  }

  async select(fields) {
    const list = await this.lean();
    const keep = new Set(fields.split(' '));
    return list.map((d) => {
      const out = {};
      for (const k of Object.keys(d)) {
        if (keep.has(k)) out[k] = d[k];
      }
      return out;
    });
  }

  async lean() {
    return Array.from(this.docs.values()).map((d) => this._lean(d));
  }
}

class InMemoryDB {
  constructor() {
    this.collections = new Map();
  }

  model(name) {
    if (!this.collections.has(name)) this.collections.set(name, new InMemoryCollection(name));
    return this.collections.get(name);
  }

  toJSON() {
    const out = {};
    for (const [name, col] of this.collections.entries()) {
      out[name] = Array.from(col.docs.values());
    }
    return out;
  }

  fromJSON(raw) {
    for (const [name, docs] of Object.entries(raw)) {
      const col = this.model(name);
      for (const doc of docs) col.docs.set(doc._id, doc);
    }
  }
}

const db = new InMemoryDB();

function getModel(name) {
  return db.model(name);
}

module.exports = { getModel, toJSON: () => db.toJSON(), fromJSON: (raw) => db.fromJSON(raw) };
