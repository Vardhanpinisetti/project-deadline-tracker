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
 * Seeds the projects table ONLY when the database is created for the first time.
 * Tracked via SQLite `PRAGMA user_version`:
 * - If user_version = 0, seed the 5 projects and advance user_version to 1.
 * - If user_version >= 1, do not seed on restart (even if the table was emptied by delete).
 * - If force = true, wipe table, seed 5 projects, and set user_version to 1.
 */
export function seedProjects(db: AppDatabase, force = false): boolean {
  const versionRow = db.prepare('PRAGMA user_version').get() as
    | { user_version?: number | bigint }
    | undefined;
  const userVersion = Number(versionRow?.user_version || 0);

  if (userVersion >= 1 && !force) {
    return false; // Database was already initialized/seeded previously; do not re-seed
  }

  // Handle existing databases created before the user_version pragma rule:
  // if user_version is 0 but rows already exist, mark user_version = 1 and skip.
  if (!force) {
    const countRow = db.prepare('SELECT COUNT(*) as count FROM projects').get() as {
      count: number | bigint;
    };
    const currentCount = Number(countRow?.count || 0);
    if (currentCount > 0) {
      db.exec('PRAGMA user_version = 1;');
      return false;
    }
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
    db.exec('PRAGMA user_version = 1;');
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
    console.log(`[Seed] Successfully seeded ${INITIAL_PROJECTS.length} projects into SQLite database (user_version = 1).`);
  } else {
    console.log('[Seed] Database already initialized (user_version >= 1). Skipping seed (use --force to overwrite).');
  }
}
