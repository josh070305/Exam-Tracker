const mongoose = require('mongoose');

// ─── Change Types (v2 spec) ───────────────────────────────────────────────────
const CHANGE_TYPES = [
  'NEW_NOTIFICATION',
  'DATE_EXTENDED',
  'EXAM_POSTPONED',
  'ADMIT_CARD',
  'RESULT',
  'SYLLABUS',
  'CORRIGENDUM',
  'OTHER',
  // Legacy types kept for backwards compatibility with existing data
  'new_exam',
  'date_change',
  'admit_card',
  'result',
  'eligibility_revised',
  'corrigendum',
];

const IMPORTANCE_LEVELS = ['HIGH', 'MEDIUM', 'LOW'];

// ─── ExamChange Schema (v2) ──────────────────────────────────────────────────
const ExamChangeSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    source: { type: String, required: true, index: true },
    board: { type: String, index: true }, // Canonical board name (SSC, RRB, etc.)
    examName: { type: String, index: true },
    changeType: {
      type: String,
      enum: CHANGE_TYPES,
      required: true,
      index: true,
    },
    changedField: { type: String, default: null },
    oldValue: { type: String, default: null },
    newValue: { type: String, default: null },
    summary: { type: String, required: true },
    importance: { type: String, enum: IMPORTANCE_LEVELS, default: 'MEDIUM' },
    confidence: { type: Number, min: 0, max: 1, default: 0.8 },
    sourceUrl: { type: String, default: null },
    pdfUrl: { type: String, default: null },
    deadline: { type: Date, default: null, index: true },
    // Legacy fields kept for compatibility
    effectiveDate: { type: Date, default: null },
    rawSnippet: { type: String, default: null },
    idempotencyKey: { type: String, index: true, default: null },
    lastVerifiedAt: { type: Date, default: Date.now },
    detectedAt: { type: Date, default: Date.now, index: -1 },
    contentHash: { type: String, default: null },
    agentRunId: { type: String, default: null, index: true },
  },
  { collection: 'exam_changes', timestamps: false, versionKey: false }
);

// Text index for full-text search
ExamChangeSchema.index({ examName: 'text', summary: 'text', newValue: 'text' });

// ─── Exam (Knowledge Base) Schema ─────────────────────────────────────────────
const ExamVersionSchema = new mongoose.Schema(
  {
    changeType: String,
    changedField: String,
    oldValue: String,
    newValue: String,
    effectiveDate: Date,
    deadline: Date,
    summary: String,
    importance: String,
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
    board: { type: String, index: true },
    nextDeadline: { type: Date, default: null, index: true },
    current: { type: ExamVersionSchema, default: null },
    versions: { type: [ExamVersionSchema], default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'exams', timestamps: false, versionKey: false }
);

ExamSchema.index({ examName: 'text' });

// ─── SourceSnapshot Schema ────────────────────────────────────────────────────
const SourceSnapshotSchema = new mongoose.Schema(
  {
    source: { type: String, unique: true, required: true, index: true },
    lastContentHash: { type: String, default: null },
    lastCheckedAt: { type: Date, default: Date.now },
    lastChangedAt: { type: Date, default: null },
    status: { type: String, enum: ['healthy', 'degraded', 'failing'], default: 'healthy' },
    failureCount: { type: Number, default: 0 },
    avgResponseMs: { type: Number, default: 0 },
  },
  { collection: 'source_snapshots', timestamps: false, versionKey: false }
);

// ─── User Schema ──────────────────────────────────────────────────────────────
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
          'NEW_NOTIFICATION',
          'DATE_EXTENDED',
          'EXAM_POSTPONED',
          'ADMIT_CARD',
          'RESULT',
          'SYLLABUS',
          'CORRIGENDUM',
          'OTHER',
          // Legacy types for backwards compat
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
      digestTime: { type: String, default: '08:00' },
      quietHoursStart: { type: String, default: null },
      quietHoursEnd: { type: String, default: null },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'users', timestamps: false, versionKey: false }
);

// ─── AgentRun Schema (powers Agent Activity UI) ───────────────────────────────
const AgentStepSchema = new mongoose.Schema(
  {
    tool: { type: String, required: true }, // Tool name called
    args: { type: mongoose.Schema.Types.Mixed, default: {} }, // Summarized args
    result: { type: String, default: null }, // Brief result summary
    durationMs: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AgentRunSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    startedAt: { type: Date, default: Date.now, index: -1 },
    finishedAt: { type: Date, default: null },
    trigger: { type: String, enum: ['cron', 'manual', 'webhook', 'demo'], default: 'manual' },
    status: { type: String, enum: ['running', 'completed', 'failed', 'degraded'], default: 'running' },
    sourcesChecked: { type: Number, default: 0 },
    changesFound: { type: Number, default: 0 },
    tokensIn: { type: Number, default: 0 },
    tokensOut: { type: Number, default: 0 },
    tokensCached: { type: Number, default: 0 },
    model: { type: String, default: null },
    steps: { type: [AgentStepSchema], default: [] },
    errors: { type: [String], default: [] },
    sourceResults: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { collection: 'agent_runs', timestamps: false, versionKey: false }
);

// ─── Model registration ──────────────────────────────────────────────────────
const MongooseExamChange = mongoose.model('MongooseExamChange', ExamChangeSchema);
const MongooseExam = mongoose.model('MongooseExam', ExamSchema);
const MongooseSourceSnapshot = mongoose.model('MongooseSourceSnapshot', SourceSnapshotSchema);
const MongooseUser = mongoose.model('MongooseUser', UserSchema);
const MongooseAgentRun = mongoose.model('MongooseAgentRun', AgentRunSchema);

module.exports = {
  MongooseExamChange,
  MongooseExam,
  MongooseSourceSnapshot,
  MongooseUser,
  MongooseAgentRun,
  CHANGE_TYPES,
  IMPORTANCE_LEVELS,
};
