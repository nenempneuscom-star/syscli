export class HttpException extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'HttpException';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestException extends HttpException {
  constructor(message = 'Bad Request', code = 'BAD_REQUEST', details?: Record<string, unknown>) {
    super(400, code, message, details);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED', details?: Record<string, unknown>) {
    super(401, code, message, details);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden', code = 'FORBIDDEN', details?: Record<string, unknown>) {
    super(403, code, message, details);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = 'Not Found', code = 'NOT_FOUND', details?: Record<string, unknown>) {
    super(404, code, message, details);
  }
}

export class ConflictException extends HttpException {
  constructor(message = 'Conflict', code = 'CONFLICT', details?: Record<string, unknown>) {
    super(409, code, message, details);
  }
}

export class UnprocessableEntityException extends HttpException {
  constructor(
    message = 'Unprocessable Entity',
    code = 'UNPROCESSABLE_ENTITY',
    details?: Record<string, unknown>
  ) {
    super(422, code, message, details);
  }
}

export class TooManyRequestsException extends HttpException {
  constructor(
    message = 'Too Many Requests',
    code = 'TOO_MANY_REQUESTS',
    details?: Record<string, unknown>
  ) {
    super(429, code, message, details);
  }
}

export class InternalServerException extends HttpException {
  constructor(
    message = 'Internal Server Error',
    code = 'INTERNAL_SERVER_ERROR',
    details?: Record<string, unknown>
  ) {
    super(500, code, message, details);
  }
}
