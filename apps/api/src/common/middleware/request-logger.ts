import { Request, Response, NextFunction } from 'express';
import { logger } from '../../infrastructure/logging/logger.js';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.startTime = Date.now();

  // Set request ID in response headers
  res.setHeader('X-Request-Id', req.requestId);

  // Log request
  logger.info(
    {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
    'Incoming request'
  );

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    const level = res.statusCode >= 400 ? 'warn' : 'info';

    logger[level](
      {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      },
      'Request completed'
    );
  });

  next();
};
