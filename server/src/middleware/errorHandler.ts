import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class AppError extends Error {
  public statusCode: number;
  public details?: ValidationErrorDetail[];

  constructor(message: string, statusCode = 500, details?: ValidationErrorDetail[]) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const details: ValidationErrorDetail[] = err.issues.map((issue) => {
      const fieldPath = issue.path.length > 0 ? issue.path.join('.') : 'root';
      return {
        field: fieldPath,
        message: issue.message,
      };
    });

    res.status(400).json({
      error: 'Validation failed',
      details,
    });
    return;
  }

  // Handle Express Malformed JSON body
  if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status?: number }).status === 400
  ) {
    res.status(400).json({
      error: 'Malformed JSON in request body',
      details: [
        {
          field: 'body',
          message: 'The request body contains invalid JSON',
        },
      ],
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    const payload: { error: string; details?: ValidationErrorDetail[] } = {
      error: err.message,
    };
    if (err.details) {
      payload.details = err.details;
    }
    res.status(err.statusCode).json(payload);
    return;
  }

  // Fallback for unknown internal errors - never leak stack traces in production
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    error: 'Internal server error',
  });
}
