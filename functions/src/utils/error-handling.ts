/**
 * Error Handling Utilities for Cloud Functions
 *
 * This file contains utilities for error handling in Cloud Functions.
 */

import { Logger } from "./logging";

/**
 * Error types
 */
export enum ErrorType {
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
  INTERNAL = "INTERNAL",
  RATE_LIMIT = "RATE_LIMIT",
  TIMEOUT = "TIMEOUT",
  CONFIGURATION = "CONFIGURATION"
}

/**
 * Application error
 */
export class AppError extends Error {
  /** Error type */
  type: ErrorType;
  /** HTTP status code */
  statusCode: number;
  /** Original error */
  originalError?: Error;
  /** Additional data */
  data?: any;

  /**
   * Create a new application error
   * @param message Error message
   * @param type Error type
   * @param statusCode HTTP status code
   * @param originalError Original error
   * @param data Additional data
   */
  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    statusCode: number = 500,
    originalError?: Error,
    data?: any
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.data = data;
  }
}

/**
 * Check if an error is retryable
 * @param error Error to check
 * @returns True if the error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof AppError) {
    // Retry external service errors, rate limit errors, and timeouts
    return [
      ErrorType.EXTERNAL_SERVICE,
      ErrorType.RATE_LIMIT,
      ErrorType.TIMEOUT
    ].includes(error.type);
  }

  // For non-AppError errors, check the message for common retryable patterns
  const errorMessage = error.message.toLowerCase();
  return (
    errorMessage.includes("timeout") ||
    errorMessage.includes("econnreset") ||
    errorMessage.includes("econnrefused") ||
    errorMessage.includes("rate limit") ||
    errorMessage.includes("too many requests") ||
    errorMessage.includes("temporarily unavailable") ||
    errorMessage.includes("internal server error") ||
    errorMessage.includes("service unavailable")
  );
}

/**
 * Handle an error with logging and optional retry
 * @param error Error to handle
 * @param logger Logger to use
 * @param context Context for the error
 * @param retryFn Function to retry
 * @param maxRetries Maximum number of retries
 * @param retryCount Current retry count
 * @returns Result of the retry function or null
 */
export async function handleError<T>(
  error: Error,
  logger: Logger,
  context: string,
  retryFn?: () => Promise<T>,
  maxRetries: number = 3,
  retryCount: number = 0
): Promise<T | null> {
  // Log the error
  if (error instanceof AppError) {
    logger.error(`${context}: ${error.message}`, error, {
      type: error.type,
      statusCode: error.statusCode,
      originalError: error.originalError,
      data: error.data
    });
  } else {
    logger.error(`${context}: ${error.message}`, error);
  }

  // If no retry function is provided, return null
  if (!retryFn) {
    return null;
  }

  // Check if the error is retryable and if we haven't exceeded the maximum retries
  if (isRetryableError(error) && retryCount < maxRetries) {
    // Calculate exponential backoff delay
    const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;

    logger.info(`Retrying ${context} after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);

    // Wait for the delay
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Retry the function
    try {
      return await retryFn();
    } catch (retryError) {
      // Handle the retry error
      return handleError(
        retryError as Error,
        logger,
        context,
        retryFn,
        maxRetries,
        retryCount + 1
      );
    }
  }

  // If the error is not retryable or we've exceeded the maximum retries, return null
  return null;
}
