import { getDatabase } from '../db/connection.js';
import { CreateProjectInput, ProjectStatus } from '../validators/project.schema.js';

export interface Project {
  id: number;
  title: string;
  status: ProjectStatus;
  deadline: string | null;
  budget: number;
  spentAmount: number;
  createdAt: string;
}

export class ProjectsService {
  /**
   * Retrieves all projects, optionally filtered by status.
   * Sorted by nearest deadline first, null deadlines last, tie-broken by ID ascending.
   */
  static getAllProjects(statusFilter?: ProjectStatus): Project[] {
    const db = getDatabase();

    const baseSql = `
      SELECT id, title, status, deadline, budget, spentAmount, createdAt
      FROM projects
    `;

    const orderSql = `
      ORDER BY 
        CASE WHEN deadline IS NULL THEN 1 ELSE 0 END ASC,
        deadline ASC,
        id ASC
    `;

    if (statusFilter) {
      const stmt = db.prepare(`${baseSql} WHERE status = ? ${orderSql}`);
      const rows = stmt.all(statusFilter) as Project[];
      return rows;
    }

    const stmt = db.prepare(`${baseSql} ${orderSql}`);
    const rows = stmt.all() as Project[];
    return rows;
  }

  /**
   * Retrieves a single project by ID.
   */
  static getProjectById(id: number): Project | null {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT id, title, status, deadline, budget, spentAmount, createdAt
      FROM projects
      WHERE id = ?
    `);
    const row = stmt.get(id) as Project | undefined;
    return row || null;
  }

  /**
   * Creates a new project and returns the created record.
   */
  static createProject(data: CreateProjectInput): Project {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO projects (title, status, deadline, budget, spentAmount)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.title,
      data.status,
      data.deadline,
      data.budget,
      data.spentAmount
    );

    const insertedId = Number(result.lastInsertRowid);
    const created = this.getProjectById(insertedId);
    if (!created) {
      throw new Error('Failed to retrieve newly created project');
    }
    return created;
  }

  /**
   * Updates the status of an existing project.
   * Returns updated project or null if not found.
   */
  static updateProjectStatus(id: number, status: ProjectStatus): Project | null {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE projects
      SET status = ?
      WHERE id = ?
    `);

    const result = stmt.run(status, id);
    if (result.changes === 0 || Number(result.changes) === 0) {
      return null;
    }

    return this.getProjectById(id);
  }
}
