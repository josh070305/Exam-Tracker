const request = require('supertest');
const { app } = require('../src/server');
const { connectDB, disconnectDB } = require('../src/config/db');

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

describe('API Endpoints Test Suite', () => {
  test('GET /api/health returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /api/stats returns aggregate stats structure', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('byType');
    expect(res.body).toHaveProperty('bySource');
  });

  test('GET /api/changes/stats alias returns identical structure', async () => {
    const res = await request(app).get('/api/changes/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('total');
  });

  test('GET /api/sources returns monitored source snapshots', async () => {
    const res = await request(app).get('/api/sources');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('sources');
    expect(Array.isArray(res.body.sources)).toBe(true);
  });

  test('GET /api/changes returns paginated changes list', async () => {
    const res = await request(app).get('/api/changes?page=1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('changes');
    expect(res.body).toHaveProperty('page', 1);
  });

  test('GET /api/exams returns versioned knowledge base', async () => {
    const res = await request(app).get('/api/exams');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('exams');
  });

  test('GET /api/users returns registered aspirants', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(res.body.users.length).toBeGreaterThan(0);
  });
});
