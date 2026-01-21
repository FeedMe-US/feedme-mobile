/**
 * Custom Error Types for FeedMe
 * Provides typed errors for better error handling throughout the app
 */

export class NetworkError extends Error {
  constructor(message = 'Unable to connect. Check your internet connection.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class AuthError extends ApiError {
  constructor(message = 'Authentication required. Please sign in.') {
    super(401, 'AUTH_REQUIRED', message);
    this.name = 'AuthError';
  }
}

export class RateLimitError extends ApiError {
  public remaining: number;
  public resetsAt: string;

  constructor(remaining: number, resetsAt: string) {
    super(429, 'RATE_LIMIT_EXCEEDED', `Daily limit reached. Resets at ${resetsAt}`);
    this.name = 'RateLimitError';
    this.remaining = remaining;
    this.resetsAt = resetsAt;
  }
}

export class ValidationError extends ApiError {
  public fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string> = {}) {
    super(400, 'VALIDATION_ERROR', message);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ServerError extends ApiError {
  constructor(message = 'Server error. Please try again later.') {
    super(500, 'SERVER_ERROR', message);
    this.name = 'ServerError';
  }
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Type guard to check if an error is a NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Get a user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof NetworkError) {
    return error.message;
  }
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
