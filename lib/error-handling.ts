/**
 * Centralized error handling utilities
 */

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  isOperational?: boolean;
}

export class DatabaseError extends Error implements AppError {
  code = 'DATABASE_ERROR';
  statusCode = 500;
  isOperational = true;

  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error implements AppError {
  code = 'VALIDATION_ERROR';
  statusCode = 400;
  isOperational = true;

  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error implements AppError {
  code = 'AUTHENTICATION_ERROR';
  statusCode = 401;
  isOperational = true;

  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error implements AppError {
  code = 'AUTHORIZATION_ERROR';
  statusCode = 403;
  isOperational = true;

  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NetworkError extends Error implements AppError {
  code = 'NETWORK_ERROR';
  statusCode = 503;
  isOperational = true;

  constructor(message = 'Network connection failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Centralized error handler for API routes
 */
export function handleApiError(error: unknown): {
  error: string;
  code?: string;
  statusCode: number;
  details?: unknown;
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (error && typeof error === 'object' && 'message' in error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: (error as any).message,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      code: (error as any).code,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      statusCode: (error as any).statusCode,
      ...(process.env.NODE_ENV === 'development' && {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        details: (error as any).originalError || (error as any).stack
      }),
    };
  }

  if (error instanceof Error) {
    // Log unexpected errors
    console.error('Unexpected error:', error);

    return {
      error: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message,
      statusCode: 500,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack
      }),
    };
  }

  console.error('Unknown error type:', error);
  return {
    error: 'An unexpected error occurred',
    statusCode: 500,
  };
}

/**
 * Safe async handler wrapper for API routes
 */
export function withErrorHandler<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };
}

/**
 * Safe database operation wrapper
 */
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  errorMessage = 'Database operation failed'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('Database operation failed:', error);
    throw new DatabaseError(errorMessage, error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Safe API call wrapper for client-side
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  fallbackValue?: T,
  errorMessage = 'API call failed'
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    console.error(errorMessage, error);

    // For network errors, return fallback if provided
    if (error instanceof NetworkError && fallbackValue !== undefined) {
      return fallbackValue;
    }

    // Re-throw for UI to handle
    throw error instanceof Error ? error : new Error(errorMessage);
  }
}

/**
 * Validate environment variables
 */
export function validateEnv(requiredVars: string[]): void {
  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Safe JSON parsing
 */
export function safeJsonParse<T>(jsonString: string, fallback?: T): T | null {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parsing failed:', error);
    return fallback ?? null;
  }
}

/**
 * Error logger for monitoring
 */
export function logError(error: Error, context?: Record<string, unknown>) {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    context,
  };

  console.error('Logged error:', errorLog);

  // In production, you would send this to a monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error, { extra: context });
    console.error('Production error logged:', errorLog);
  }
}