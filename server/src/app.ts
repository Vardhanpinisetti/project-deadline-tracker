import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import projectsRouter from './routes/projects.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Support comma-separated CLIENT_ORIGIN list; default to both port 5173 and 5174
  const envOrigins = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaultOrigins = ['http://localhost:5173', 'http://localhost:5174'];
  const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

  // Security & Middleware
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Supertest, same-origin/proxy)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10kb' }));

  // API Routes
  app.use('/api/projects', projectsRouter);

  // Serve static client assets in production if built
  const possibleDistPaths = [
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../dist'),
    path.resolve(process.cwd(), 'dist'),
  ];

  const clientDistPath = possibleDistPaths.find((p) => fs.existsSync(p));

  if (clientDistPath) {
    app.use(express.static(clientDistPath));
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  // Unmatched route handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
