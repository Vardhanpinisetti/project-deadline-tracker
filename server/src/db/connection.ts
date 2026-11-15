import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export interface StatementResult {
  changes: number | bigint;
  lastInsertRowid: number | bigint;
}

export interface PreparedStatement {
  run(...params: unknown[]): StatementResult;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

export interface AppDatabase {
  prepare(sql: string): PreparedStatement;
  exec(sql: string): void;
  pragma(sql: string): void;
  transaction<T extends (...args: unknown[]) => unknown>(fn: T): T;
  close(): void;
}

let dbInstance: AppDatabase | null = null;

export function getDatabasePath(): string {
  const envPath = process.env.DB_PATH || './data/projects.db';
  return path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath);
}

/**
 * Initializes the SQLite database connection with strict schema check constraints.
 * Supports custom database paths (e.g. ':memory:' for isolated testing).
 * Prefers better-sqlite3 with resilient fallback to built-in node:sqlite.
 */
export function initDatabase(customPath?: string): AppDatabase {
  // If customPath is not provided and dbInstance already initialized, reuse it
  if (!customPath && dbInstance) {
    return dbInstance;
  }

  const dbPath = customPath || getDatabasePath();

  if (dbPath !== ':memory:') {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  let db: AppDatabase;

  try {
    // Attempt loading better-sqlite3 first
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const BetterSqlite3 = require('better-sqlite3');
    const nativeDb = new BetterSqlite3(dbPath);
    if (dbPath !== ':memory:') {
      nativeDb.pragma('journal_mode = WAL');
    }
    nativeDb.pragma('foreign_keys = ON');

    db = {
      prepare: (sql: string) => nativeDb.prepare(sql),
      exec: (sql: string) => nativeDb.exec(sql),
      pragma: (pragma: string) => nativeDb.pragma(pragma),
      transaction: (fn: (...args: unknown[]) => unknown) => nativeDb.transaction(fn),
      close: () => nativeDb.close(),
    };
  } catch {
    // Fall back to built-in node:sqlite DatabaseSync
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DatabaseSync } = require('node:sqlite');
    const nodeDb = new DatabaseSync(dbPath);
    if (dbPath !== ':memory:') {
      nodeDb.exec('PRAGMA journal_mode = WAL;');
    }
    nodeDb.exec('PRAGMA foreign_keys = ON;');

    db = {
      prepare: (sql: string) => {
        const stmt = nodeDb.prepare(sql);
        return {
          run: (...params: unknown[]) => stmt.run(...params),
          get: (...params: unknown[]) => stmt.get(...params),
          all: (...params: unknown[]) => stmt.all(...params),
        };
      },
      exec: (sql: string) => nodeDb.exec(sql),
      pragma: (pragma: string) => nodeDb.exec(`PRAGMA ${pragma};`),
      transaction: <T extends (...args: unknown[]) => unknown>(fn: T): T => {
        return ((...args: unknown[]) => {
          nodeDb.exec('BEGIN IMMEDIATE');
          try {
            const result = fn(...args);
            nodeDb.exec('COMMIT');
            return result;
          } catch (err) {
            nodeDb.exec('ROLLBACK');
            throw err;
          }
        }) as T;
      },
      close: () => nodeDb.close(),
    };
  }

  // Strictly enforce CHECK constraints matching prompt specifications:
  // budget REAL >= 0, spentAmount REAL >= 0, max 10,000,000,000
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL CHECK(length(trim(title)) > 0 AND length(title) <= 150),
      status TEXT NOT NULL CHECK(status IN ('active', 'completed', 'on_hold')),
      deadline TEXT CHECK(deadline IS NULL OR (length(deadline) = 10 AND deadline GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')),
      budget REAL NOT NULL CHECK(budget >= 0 AND budget <= 10000000000),
      spentAmount REAL NOT NULL CHECK(spentAmount >= 0 AND spentAmount <= 10000000000),
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(deadline);
  `);

  if (!customPath) {
    dbInstance = db;
  }
  return db;
}

export function getDatabase(): AppDatabase {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

export function setDatabaseInstance(db: AppDatabase | null): void {
  dbInstance = db;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
