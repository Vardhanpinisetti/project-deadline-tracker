import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  // Security & Middleware
  app.use(
    cors({
      origin: clientOrigin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10kb' }));

  // API Routes
  app.use('/api/projects', projectsRouter);

  // Unmatched route handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
