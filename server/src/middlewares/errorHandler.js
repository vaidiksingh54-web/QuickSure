import { ApiResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`Error on ${req.method} ${req.originalUrl}: ${err.message}`, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    code: err.code,
  });

  // Handle Zod validation errors (Rule 10)
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return ApiResponse.error(res, {
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request payload',
      details: formattedErrors,
    });
  }

  // Handle custom AppError instances
  if (err instanceof AppError || err.statusCode) {
    return ApiResponse.error(res, {
      statusCode: err.statusCode || 400,
      code: err.code || 'BAD_REQUEST',
      message: err.message,
      details: err.details || null,
    });
  }

  // Fallback 500 error
  return ApiResponse.error(res, {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred. Please try again.' 
      : err.message || 'Internal server error',
  });
};
