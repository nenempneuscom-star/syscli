import pino from 'pino';
import { config } from '../../config/index.js';

export const logger = pino({
  level: config.logging.level,
  transport: config.isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    env: config.env,
  },
  redact: {
    paths: ['req.headers.authorization', 'req.body.password', 'req.body.token'],
    censor: '[REDACTED]',
  },
});

export const createChildLogger = (context: string) => {
  return logger.child({ context });
};

export type Logger = typeof logger;
