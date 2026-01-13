import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestException } from '../exceptions/http-exception.js';

type RequestLocation = 'body' | 'query' | 'params';

interface ValidateOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validate = (schemas: ValidateOptions) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const locations: RequestLocation[] = ['body', 'query', 'params'];

      for (const location of locations) {
        const schema = schemas[location];
        if (schema) {
          const result = await schema.parseAsync(req[location]);
          req[location] = result;
        }
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = {
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        };
        next(new BadRequestException('Validation failed', 'VALIDATION_ERROR', details));
      } else {
        next(error);
      }
    }
  };
};

export const validateBody = (schema: ZodSchema) => validate({ body: schema });
export const validateQuery = (schema: ZodSchema) => validate({ query: schema });
export const validateParams = (schema: ZodSchema) => validate({ params: schema });
