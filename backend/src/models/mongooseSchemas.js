const mongoose = require('mongoose');

const ExamChangeSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    source: { type: String, required: true, index: true },
    examName: { type: String, index: true },
    changeType: {
      type: String,
      enum: [
        'new_exam',
        'date_change',
        'admit_card',
        'result',
        'eligibility_revised',
        'corrigendum',
      ],
      required: true,
      index: true,
    },
    changedField: { type: String, default: null },
    oldValue: { type: String, default: null },
    newValue: { type: String, default: null },
    effectiveDate: { type: Date, default: null },
    summary: { type: String, required: true },
    rawSnippet: { type: String, default: null },
    pdfUrl: { type: String, default: null },
    idempotencyKey: { type: String, index: true, default: null },
    lastVerifiedAt: { type: Date, default: Date.now },
    detectedAt: { type: Date, default: Date.now, index: -1 },
    contentHash: { type: String, default: null },
  },
  { collection: 'exam_changes', timestamps: false, versionKey: false }
);

const ExamVersionSchema = new mongoose.Schema(
  {
    changeType: String,
    changedField: String,
    oldValue: String,
    newValue: String,
    effectiveDate: Date,
    summary: String,
    detectedAt: { type: Date, default: Date.now },
    changeId: String,
  },
  { _id: false }
);

const ExamSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true, index: true }, // e.g. "SSC::SSC CGL 2026"
    source: { type: String, required: true, index: true },
    examName: { type: String, required: true, index: true },
    current: { type: ExamVersionSchema, default: null },
    versions: { type: [ExamVersionSchema], default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'exams', timestamps: false, versionKey: false }
);

const SourceSnapshotSchema = new mongoose.Schema(
  {
    source: { type: String, unique: true, required: true, index: true },
    lastContentHash: { type: String, default: null },
    lastCheckedAt: { type: Date, default: Date.now },
  },
  { collection: 'source_snapshots', timestamps: false, versionKey: false }
);

const UserSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, default: 'Aspirant' },
    telegramChatId: { type: String, default: null, index: true },
    whatsappNumber: { type: String, default: null },
    email: { type: String, default: null },
    prefs: {
      sources: { type: [String], default: ['SSC', 'RRB', 'TNPSC', 'UPSC', 'IBPS', 'SBI'] },
      exams: { type: [String], default: [] },
      types: {
        type: [String],
        default: [
          'new_exam',
          'date_change',
          'admit_card',
          'result',
          'eligibility_revised',
          'corrigendum',
        ],
      },
      channels: {
        telegram: { type: Boolean, default: true },
        whatsapp: { type: Boolean, default: false },
        email: { type: Boolean, default: false },
      },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'users', timestamps: false, versionKey: false }
);

const MongooseExamChange = mongoose.model('MongooseExamChange', ExamChangeSchema);
const MongooseExam = mongoose.model('MongooseExam', ExamSchema);
const MongooseSourceSnapshot = mongoose.model('MongooseSourceSnapshot', SourceSnapshotSchema);
const MongooseUser = mongoose.model('MongooseUser', UserSchema);

module.exports = {
  MongooseExamChange,
  MongooseExam,
  MongooseSourceSnapshot,
  MongooseUser,
};
