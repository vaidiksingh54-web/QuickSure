/**
 * Standardized Application Error Classes
 * Enforces structured, predictable errors across all Express controllers and services.
 */

export class RateLimitError extends AppError {
  constructor (message = 'Too many requests, please slow down', code = 'RATE_LIMITED') {
    super(message, 429, code)
  }
}

export class AppError extends Error {
  constructor (message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends AppError {
  constructor (message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code)
  }
}

export class UnauthorizedError extends AppError {
  constructor (message = 'Authentication required', code = 'UNAUTHORIZED') {
    super(message, 401, code)
  }
}

export class ForbiddenError extends AppError {
  constructor (message = 'Access forbidden: insufficient permissions', code = 'FORBIDDEN') {
    super(message, 403, code)
  }
}

export class ConflictError extends AppError {
  constructor (message = 'Resource conflict or state condition failed', code = 'CONFLICT') {
    super(message, 409, code)
  }
}

export class ValidationError extends AppError {
  constructor (message = 'Validation failed', details = null, code = 'VALIDATION_ERROR') {
    super(message, 422, code, details)
  }
}
