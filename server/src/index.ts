import dotenv from 'dotenv';
import { createApp } from './app.js';
import { initDatabase, closeDatabase } from './db/connection.js';
import { seedProjects } from './db/seed.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4000', 10);

// Initialize DB and ensure schema exists
const db = initDatabase();

// Idempotent automatic seeding on launch if empty
const seeded = seedProjects(db);
if (seeded) {
  console.log('[Database] Seeded 5 initial projects into SQLite.');
} else {
  console.log('[Database] Projects table ready.');
}

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`[Server] Project Deadline Tracker API running on http://localhost:${PORT}`);
  console.log(`[Server] Endpoints:`);
  console.log(`  - GET    http://localhost:${PORT}/api/projects`);
  console.log(`  - POST   http://localhost:${PORT}/api/projects`);
  console.log(`  - PATCH  http://localhost:${PORT}/api/projects/:id/status`);
  console.log(`  - PATCH  http://localhost:${PORT}/api/projects/:id`);
  console.log(`  - DELETE http://localhost:${PORT}/api/projects/:id`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    closeDatabase();
    console.log('[Server] Database closed and server terminated.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
