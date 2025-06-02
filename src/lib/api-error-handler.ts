import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { MongoServerError } from 'mongodb';
import mongoose from 'mongoose';

/**
 * Standardized API Error Response
 */
export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    details?: any;
    field?: string;
  };
}

/**
 * Standardized API Success Response
 */
export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Error Codes
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
} as const;

/**
 * Create error response
 */
export function createErrorResponse(
  message: string,
  code: string = ERROR_CODES.INTERNAL_ERROR,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details?: any,
  field?: string
): NextResponse {
  const response: ApiError = {
    success: false,
    error: {
      message,
      code,
      ...(details && { details }),
      ...(field && { field }),
    },
  };

  return NextResponse.json(response, { status });
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = HTTP_STATUS.OK
): NextResponse {
  const response: ApiSuccess<T> = {
    success: true,
    data,
    ...(message && { message }),
  };

  return NextResponse.json(response, { status });
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError): NextResponse {
  const field = error.errors[0]?.path?.[0]?.toString();
  const message = error.errors[0]?.message || 'Validation error';
  
  return createErrorResponse(
    message,
    ERROR_CODES.VALIDATION_ERROR,
    HTTP_STATUS.BAD_REQUEST,
    error.errors,
    field
  );
}

/**
 * Handle MongoDB errors
 */
export function handleMongoError(error: MongoServerError | mongoose.Error): NextResponse {
  if ('code' in error && error.code === 11000) {
    // Duplicate key error
    const field = Object.keys(error.keyPattern || {})[0];
    return createErrorResponse(
      `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Field'} already exists`,
      ERROR_CODES.DUPLICATE_ENTRY,
      HTTP_STATUS.CONFLICT,
      undefined,
      field
    );
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const firstError = Object.values(error.errors)[0];
    return createErrorResponse(
      firstError.message,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
      error.errors,
      firstError.path
    );
  }

  if (error instanceof mongoose.Error.CastError) {
    return createErrorResponse(
      `Invalid ${error.path}: ${error.value}`,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
      undefined,
      error.path
    );
  }

  // Generic database error
  return createErrorResponse(
    'Database operation failed',
    ERROR_CODES.DATABASE_ERROR,
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
}

/**
 * Main error handler for API routes
 */
export function handleApiError(error: unknown): NextResponse {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', error);
  }

  // Handle specific error types
  if (error instanceof ZodError) {
    return handleZodError(error);
  }

  if (error instanceof MongoServerError || error instanceof mongoose.Error) {
    return handleMongoError(error);
  }

  if (error instanceof Error) {
    // Known Error instance
    const message = error.message;

    // Check for specific error patterns
    if (message.includes('not found')) {
      return createErrorResponse(
        message,
        ERROR_CODES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      );
    }

    if (message.includes('unauthorized') || message.includes('authentication')) {
      return createErrorResponse(
        message,
        ERROR_CODES.UNAUTHORIZED,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    if (message.includes('forbidden') || message.includes('permission')) {
      return createErrorResponse(
        message,
        ERROR_CODES.FORBIDDEN,
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Generic error
    return createErrorResponse(
      message,
      ERROR_CODES.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  // Unknown error
  return createErrorResponse(
    'An unexpected error occurred',
    ERROR_CODES.INTERNAL_ERROR,
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
}

/**
 * Async wrapper for API route handlers
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Middleware to catch and handle errors
 */
export function errorMiddleware(request: NextRequest) {
  // Add error handling headers
  const response = NextResponse.next();
  
  response.headers.set('X-Error-Handler', 'true');
  
  return response;
}

/**
 * Rate limiting error
 */
export function createRateLimitError(): NextResponse {
  return createErrorResponse(
    'Too many requests. Please try again later.',
    'RATE_LIMIT_EXCEEDED',
    429
  );
}

/**
 * Method not allowed error
 */
export function createMethodNotAllowedError(allowedMethods: string[]): NextResponse {
  const response = createErrorResponse(
    `Method not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
    'METHOD_NOT_ALLOWED',
    405
  );
  
  // Add Allow header
  response.headers.set('Allow', allowedMethods.join(', '));
  
  return response;
}

/**
 * Check if response is an error
 */
export function isApiError(response: any): response is ApiError {
  return response && response.success === false && response.error;
}

/**
 * Check if response is successful
 */
export function isApiSuccess<T>(response: any): response is ApiSuccess<T> {
  return response && response.success === true && response.data !== undefined;
}

export default {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
  withErrorHandler,
  ERROR_CODES,
  HTTP_STATUS,
};
