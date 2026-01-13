import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { HttpException } from '../exceptions/http-exception.js';
import { logger } from '../../infrastructure/logging/logger.js';
import { config } from '../../config/index.js';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string;
  };
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  logger.error(
    {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      request: {
        method: req.method,
        url: req.url,
        params: req.params,
        query: req.query,
        body: req.body,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
    },
    'Request error'
  );

  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: Record<string, unknown> | undefined;

  // Handle known exception types
  if (error instanceof HttpException) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = {
      errors: error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    };
  } else if (error.name === 'PrismaClientKnownRequestError') {
    // Handle Prisma errors
    const prismaError = error as Error & { code: string; meta?: Record<string, unknown> };
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        code = 'UNIQUE_CONSTRAINT_VIOLATION';
        message = 'A record with this value already exists';
        details = prismaError.meta;
        break;
      case 'P2025':
        statusCode = 404;
        code = 'RECORD_NOT_FOUND';
        message = 'Record not found';
        break;
      default:
        statusCode = 400;
        code = 'DATABASE_ERROR';
        message = 'A database error occurred';
    }
  }

  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
      ...(config.isDev && { stack: error.stack }),
    },
  };

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`,
    },
  };

  res.status(404).json(response);
};
