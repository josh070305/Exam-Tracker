jest.mock('../src/services/telegram', () => ({
  sendAlert: jest.fn(),
  format: jest.fn((change) => `formatted:${change.source}:${change.changeType}`),
}));

jest.mock('../src/services/whatsapp', () => ({
  sendWhatsApp: jest.fn(),
}));

jest.mock('../src/services/email', () => ({
  sendEmail: jest.fn(),
}));

const { matches } = require('../src/services/alerting');
const { sendAlert } = require('../src/services/telegram');
const { recordExam, processSource } = require('../src/services/pipeline');
const { buildPrompt } = require('../src/services/aiExtraction');
const Exam = require('../src/models/Exam');
const SourceSnapshot = require('../src/models/SourceSnapshot');
const User = require('../src/models/User');
const { connectDB, disconnectDB } = require('../src/config/db');

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

describe('Pipeline & Alerting Test Suite', () => {
  test('Preference matching accurately filters by source and type', () => {
    const prefs = {
      sources: ['SSC', 'RRB'],
      types: ['date_change', 'corrigendum'],
      exams: ['CGL'],
    };

    const matchingChange = {
      source: 'SSC',
      examName: 'SSC CGL 2026',
      changeType: 'date_change',
    };

    const nonMatchingSource = {
      source: 'UPSC',
      examName: 'UPSC CSE 2026',
      changeType: 'date_change',
    };

    const nonMatchingType = {
      source: 'SSC',
      examName: 'SSC CGL 2026',
      changeType: 'result',
    };

    expect(matches(matchingChange, prefs)).toBe(true);
    expect(matches(nonMatchingSource, prefs)).toBe(false);
    expect(matches(nonMatchingType, prefs)).toBe(false);
  });

  test('buildPrompt includes historical context for LLM memory', () => {
    const prompt = buildPrompt({
      rawText: 'SSC CGL 2026 Tier 1 rescheduled.',
      source: 'SSC',
      historicalExams: [
        {
          examName: 'SSC CGL 2026',
          current: { changeType: 'date_change', changedField: 'examDate', newValue: '15 Aug 2026' },
        },
      ],
      pdfNotices: [{ title: 'Official Corrigendum', url: 'http://test.com/notice.pdf', text: 'Date revised to Sep 3' }],
    });

    expect(prompt).toContain('=== HISTORICAL KNOWLEDGE-BASE CONTEXT');
    expect(prompt).toContain('SSC CGL 2026');
    expect(prompt).toContain('15 Aug 2026');
    expect(prompt).toContain('Official Corrigendum');
  });

  test('alertChange uses the configured Telegram fallback when a user has Telegram enabled but no stored chat ID', async () => {
    const userFindSpy = jest.spyOn(User, 'find').mockResolvedValue([
      {
        _id: 'user-1',
        telegramChatId: null,
        whatsappNumber: '+919999999999',
        email: 'user@example.com',
        prefs: { channels: { telegram: true, whatsapp: false, email: false } },
      },
    ]);

    sendAlert.mockResolvedValue(true);

    const result = await require('../src/services/alerting').alertChange(
      { source: 'SSC', examName: 'SSC CGL 2026', changeType: 'date_change', summary: 'Date revised', detectedAt: new Date() },
      '9991112223'
    );

    expect(sendAlert).toHaveBeenCalledWith(expect.objectContaining({ source: 'SSC' }), '9991112223');
    expect(result.notified).toBe(1);

    userFindSpy.mockRestore();
    sendAlert.mockReset();
  });

  test('recordExam appends versioned history correctly', async () => {
    const testChange = {
      _id: 'test-change-123',
      source: 'TEST_BOARD',
      examName: 'Mock Exam 2026',
      changeType: 'new_exam',
      changedField: 'status',
      newValue: 'announced',
      summary: 'Mock Exam 2026 announced.',
      detectedAt: new Date(),
    };

    await recordExam(testChange);

    const exam = await Exam.findOne({ key: 'TEST_BOARD::Mock Exam 2026' });
    expect(exam).toBeDefined();
    expect(exam.source).toBe('TEST_BOARD');
    expect(exam.versions.length).toBeGreaterThanOrEqual(1);
    expect(exam.current.summary).toBe('Mock Exam 2026 announced.');
  });

  test('processSource handles unchanged source gracefully without SourceSnapshot crash', async () => {
    // Create a mock source that returns a stable hash
    const mockSource = {
      name: 'MOCK_SOURCE_UNCHANGED',
      scrape: async () => ({
        source: 'MOCK_SOURCE_UNCHANGED',
        text: 'Stable notice board content.',
        hash: 'stable-hash-12345',
      }),
    };

    // First run creates snapshot
    await SourceSnapshot.create({
      source: 'MOCK_SOURCE_UNCHANGED',
      lastContentHash: 'stable-hash-12345',
      lastCheckedAt: new Date(Date.now() - 10000),
    });

    // Run processSource
    const result = await processSource(mockSource);
    expect(result.changed).toBe(false);
    expect(result.newChanges).toBe(0);

    // Verify snapshot lastCheckedAt was updated without throwing ReferenceError
    const snap = await SourceSnapshot.findOne({ source: 'MOCK_SOURCE_UNCHANGED' });
    expect(snap).toBeDefined();
    expect(new Date(snap.lastCheckedAt).getTime()).toBeGreaterThan(Date.now() - 5000);
  });
});
