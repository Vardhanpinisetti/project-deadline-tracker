import { Request, Response, NextFunction } from 'express';
import {
  createProjectSchema,
  updateStatusSchema,
  statusQuerySchema,
  projectIdParamSchema,
} from '../validators/project.schema.js';
import { ProjectsService } from '../services/projects.service.js';
import { AppError } from '../middleware/errorHandler.js';

export class ProjectsController {
  /**
   * GET /api/projects
   * Retrieves all projects, optionally filtered by ?status=active|completed|on_hold
   */
  static async getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryValidation = statusQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        throw queryValidation.error;
      }

      const { status } = queryValidation.data;
      const projects = ProjectsService.getAllProjects(status);
      res.status(200).json(projects);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/projects
   * Validates and creates a new project
   */
  static async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = createProjectSchema.safeParse(req.body);
      if (!validation.success) {
        throw validation.error;
      }

      const created = ProjectsService.createProject(validation.data);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/projects/:id/status
   * Updates the status of an existing project
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paramValidation = projectIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw paramValidation.error;
      }

      const bodyValidation = updateStatusSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw bodyValidation.error;
      }

      const { id } = paramValidation.data;
      const { status } = bodyValidation.data;

      const updated = ProjectsService.updateProjectStatus(id, status);
      if (!updated) {
        throw new AppError('Project not found', 404);
      }

      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
}
