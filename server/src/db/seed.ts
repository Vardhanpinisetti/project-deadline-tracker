import { AppDatabase, initDatabase } from './connection.js';

export interface SeedProject {
  title: string;
  status: 'active' | 'completed' | 'on_hold';
  deadline: string | null;
  budget: number;
  spentAmount: number;
}

export const INITIAL_PROJECTS: SeedProject[] = [
  {
    title: 'E-Commerce Website Redesign',
    status: 'active',
    deadline: '2026-12-15',
    budget: 120000,
    spentAmount: 45000
  },
  {
    title: 'Brand Identity for Startup',
    status: 'completed',
    deadline: '2026-10-20',
    budget: 50000,
    spentAmount: 50000
  },
  {
    title: 'Mobile App for Fitness Tracking',
    status: 'active',
    deadline: '2026-11-20',
    budget: 180000,
    spentAmount: 200000
  },
  {
    title: 'Internal HR Dashboard',
    status: 'on_hold',
    deadline: '2026-09-30',
    budget: 90000,
    spentAmount: 12000
  },
  {
    title: 'Portfolio Website',
    status: 'active',
    deadline: null,
    budget: 25000,
    spentAmount: 30000
  }
];

/**
 * Seeds the projects table idempotently.
 * Only inserts if the table is empty, or if force is true.
 */
export function seedProjects(db: AppDatabase, force = false): boolean {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number | bigint };
  const currentCount = Number(countRow?.count || 0);

  if (currentCount > 0 && !force) {
    return false; // Already seeded, skip
  }

  const insertStmt = db.prepare(`
    INSERT INTO projects (title, status, deadline, budget, spentAmount)
    VALUES (?, ?, ?, ?, ?)
  `);

  const runSeed = db.transaction(() => {
    if (force) {
      db.exec('DELETE FROM projects;');
      try {
        db.exec('DELETE FROM sqlite_sequence WHERE name = "projects";');
      } catch {
        // Ignored if sqlite_sequence not initialized
      }
    }
    for (const project of INITIAL_PROJECTS) {
      insertStmt.run(
        project.title,
        project.status,
        project.deadline,
        project.budget,
        project.spentAmount
      );
    }
  });

  runSeed();
  return true;
}

// Allow direct execution: `tsx src/db/seed.ts`
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  const db = initDatabase();
  const force = process.argv.includes('--force');
  const seeded = seedProjects(db, force);
  if (seeded) {
    console.log(`[Seed] Successfully seeded ${INITIAL_PROJECTS.length} projects into SQLite database.`);
  } else {
    console.log('[Seed] Database already contains projects. Skipping seed (use --force to overwrite).');
  }
}
