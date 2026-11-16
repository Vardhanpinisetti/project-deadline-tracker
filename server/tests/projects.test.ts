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

  describe('PATCH /api/projects/:id', () => {
    it('updates only provided fields in a partial update and returns 200', async () => {
      // First get original project 1
      const original = (await request(app).get('/api/projects')).body.find((p: { id: number }) => p.id === 1);
      expect(original).toBeDefined();

      const res = await request(app)
        .patch('/api/projects/1')
        .send({
          title: 'Renamed Website Project',
          budget: 150000
        });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body.title).toBe('Renamed Website Project');
      expect(res.body.budget).toBe(150000);
      // Other fields must remain unchanged
      expect(res.body.status).toBe(original.status);
      expect(res.body.deadline).toBe(original.deadline);
      expect(res.body.spentAmount).toBe(original.spentAmount);
    });

    it('rejects empty body with 400', async () => {
      const res = await request(app)
        .patch('/api/projects/1')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });

    it('rejects negative budget with 400', async () => {
      const res = await request(app)
        .patch('/api/projects/1')
        .send({ budget: -100 });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d: { field: string }) => d.field === 'budget')).toBe(true);
    });

    it('rejects impossible calendar date with 400', async () => {
      const res = await request(app)
        .patch('/api/projects/1')
        .send({ deadline: '2026-02-31' });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d: { field: string }) => d.field === 'deadline')).toBe(true);
    });

    it('rejects invalid status with 400', async () => {
      const res = await request(app)
        .patch('/api/projects/1')
        .send({ status: 'in_progress' });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d: { field: string }) => d.field === 'status')).toBe(true);
    });

    it('clears deadline when set to null and returns 200', async () => {
      const res = await request(app)
        .patch('/api/projects/1')
        .send({ deadline: null });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body.deadline).toBeNull();
    });

    it('returns 404 for unknown project id', async () => {
      const res = await request(app)
        .patch('/api/projects/99999')
        .send({ title: 'Non-existent project' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Project not found');
    });

    it('returns 400 for non-numeric project id', async () => {
      const res = await request(app)
        .patch('/api/projects/invalid-id')
        .send({ title: 'Invalid ID' });

      expect(res.status).toBe(400);
      expect(res.body.details.some((d: { field: string }) => d.field === 'id')).toBe(true);
    });

    it('rejects unknown fields with 400', async () => {
      const res = await request(app)
        .patch('/api/projects/1')
        .send({
          title: 'Valid Title',
          unexpectedProp: 'not allowed'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('deletes an existing project, returns 204, and project no longer appears in GET', async () => {
      const deleteRes = await request(app).delete('/api/projects/1');
      expect(deleteRes.status).toBe(204);
      expect(deleteRes.text).toBe('');

      // Verify it no longer appears in GET
      const getRes = await request(app).get('/api/projects');
      expect(getRes.status).toBe(200);
      expect(getRes.body.length).toBe(4);
      expect(getRes.body.some((p: { id: number }) => p.id === 1)).toBe(false);
    });

    it('returns 404 for unknown project id', async () => {
      const res = await request(app).delete('/api/projects/99999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Project not found');
    });

    it('returns 400 for non-numeric project id', async () => {
      const res = await request(app).delete('/api/projects/not-a-number');
      expect(res.status).toBe(400);
      expect(res.body.details.some((d: { field: string }) => d.field === 'id')).toBe(true);
    });

    it('returns 404 when deleting the same project twice', async () => {
      const firstRes = await request(app).delete('/api/projects/2');
      expect(firstRes.status).toBe(204);

      const secondRes = await request(app).delete('/api/projects/2');
      expect(secondRes.status).toBe(404);
      expect(secondRes.body.error).toBe('Project not found');
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

    it('maintains empty table on restart after deleting all projects, while fresh DB file seeds 5', async () => {
      const fs = await import('fs');
      const os = await import('os');
      const path = await import('path');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'project-tracker-test-'));
      const dbPath = path.join(tmpDir, 'test-seed.db');
      const freshDbPath = path.join(tmpDir, 'test-fresh.db');

      try {
        // 1. Initialise first DB file: user_version 0 -> seeds 5 and sets user_version to 1
        const db1 = initDatabase(dbPath);
        const seeded1 = seedProjects(db1, false);
        expect(seeded1).toBe(true);
        const count1 = (db1.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }).count;
        expect(count1).toBe(5);

        // Delete all projects from DB
        db1.exec('DELETE FROM projects;');
        const countAfterDelete = (db1.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }).count;
        expect(countAfterDelete).toBe(0);
        db1.close();

        // 2. Re-initialise the app on the same database file: table MUST stay empty!
        const db2 = initDatabase(dbPath);
        const seeded2 = seedProjects(db2, false);
        expect(seeded2).toBe(false); // Does not re-seed because user_version is already 1
        const countAfterRestart = (db2.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }).count;
        expect(countAfterRestart).toBe(0);
        db2.close();

        // 3. A brand-new database file seeds exactly 5
        const dbFresh = initDatabase(freshDbPath);
        const seededFresh = seedProjects(dbFresh, false);
        expect(seededFresh).toBe(true);
        const countFresh = (dbFresh.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }).count;
        expect(countFresh).toBe(5);
        dbFresh.close();
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
