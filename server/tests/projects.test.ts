import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDatabase, closeDatabase, setDatabaseInstance } from '../src/db/connection.js';
import { seedProjects } from '../src/db/seed.js';

describe('Projects API & Database Constraints', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    // Use an isolated in-memory SQLite database per test run (never the real data file)
    const memDb = initDatabase(':memory:');
    setDatabaseInstance(memDb);
    seedProjects(memDb, true);
    app = createApp();
  });

  afterEach(() => {
    closeDatabase();
    setDatabaseInstance(null);
  });

  describe('GET /api/projects', () => {
    it('returns all 5 seeded projects in correct sort order (null deadlines last)', async () => {
      const res = await request(app).get('/api/projects');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(5);

      // Verify nearest deadline first, nulls last
      const deadlines = res.body.map((p: { deadline: string | null }) => p.deadline);
      expect(deadlines).toEqual([
        '2026-09-30',
        '2026-10-20',
        '2026-11-20',
        '2026-12-15',
        null
      ]);
    });

    it('returns only active projects with ?status=active', async () => {
      const res = await request(app).get('/api/projects?status=active');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
      for (const proj of res.body) {
        expect(proj.status).toBe('active');
      }
    });

    it('returns 400 when given an invalid status filter', async () => {
      const res = await request(app).get('/api/projects?status=bogus');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'status' })
        ])
      );
    });
  });

  describe('POST /api/projects', () => {
    it('creates a new project with valid data and returns 201', async () => {
      const payload = {
        title: 'New Client Portal',
        status: 'active',
        deadline: '2026-12-01',
        budget: 75000,
        spentAmount: 15000
      };

      const res = await request(app)
        .post('/api/projects')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe(payload.title);
      expect(res.body.deadline).toBe(payload.deadline);
    });

    it('accepts null deadline and returns 201', async () => {
      const payload = {
        title: 'Adhoc Research Project',
        status: 'on_hold',
        deadline: null,
        budget: 20000,
        spentAmount: 5000
      };

      const res = await request(app)
        .post('/api/projects')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.deadline).toBeNull();
    });

    it('rejects empty or whitespace title with 400', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({
          title: '   ',
          status: 'active',
          deadline: '2026-12-01',
          budget: 50000,
          spentAmount: 0
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details.some((d: { field: string }) => d.field === 'title')).toBe(true);
    });

    it('rejects negative budget with 400', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({
          title: 'Valid Title',
          status: 'active',
          deadline: '2026-12-01',
          budget: -100,
          spentAmount: 0
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d: { field: string }) => d.field === 'budget')).toBe(true);
    });

    it('rejects negative spentAmount with 400', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({
          title: 'Valid Title',
          status: 'active',
          deadline: '2026-12-01',
          budget: 50000,
          spentAmount: -50
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d: { field: string }) => d.field === 'spentAmount')).toBe(true);
    });

    it('rejects string budget with 400', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({
          title: 'Valid Title',
          status: 'active',
          deadline: '2026-12-01',
          budget: 'not-a-number',
          spentAmount: 0
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d: { field: string }) => d.field === 'budget')).toBe(true);
    });

    it('rejects invalid status with 400', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({
          title: 'Valid Title',
          status: 'archived',
          deadline: '2026-12-01',
          budget: 50000,
          spentAmount: 0
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d: { field: string }) => d.field === 'status')).toBe(true);
    });

    it('rejects impossible calendar date "2026-02-31" with 400', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({
          title: 'Valid Title',
          status: 'active',
          deadline: '2026-02-31',
          budget: 50000,
          spentAmount: 0
        });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d: { field: string }) => d.field === 'deadline')).toBe(true);
    });
  });

  describe('PATCH /api/projects/:id/status', () => {
    it('updates status to a valid value and returns 200', async () => {
      const res = await request(app)
        .patch('/api/projects/1/status')
        .send({ status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body.status).toBe('completed');
    });

    it('rejects invalid status with 400', async () => {
      const res = await request(app)
        .patch('/api/projects/1/status')
        .send({ status: 'in_review' });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d: { field: string }) => d.field === 'status')).toBe(true);
    });

    it('returns 404 when project does not exist', async () => {
      const res = await request(app)
        .patch('/api/projects/9999/status')
        .send({ status: 'completed' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Project not found');
    });

    it('returns 400 for non-numeric id', async () => {
      const res = await request(app)
        .patch('/api/projects/abc/status')
        .send({ status: 'completed' });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d: { field: string }) => d.field === 'id')).toBe(true);
    });
  });

  describe('Database Seeding Idempotency', () => {
    it('seeding twice does not duplicate rows', () => {
      const memDb = initDatabase(':memory:');
      const firstSeed = seedProjects(memDb, false);
      expect(firstSeed).toBe(true);

      const countAfterFirst = (memDb.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }).count;
      expect(countAfterFirst).toBe(5);

      const secondSeed = seedProjects(memDb, false);
      expect(secondSeed).toBe(false);

      const countAfterSecond = (memDb.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }).count;
      expect(countAfterSecond).toBe(5);

      memDb.close();
    });
  });
});
