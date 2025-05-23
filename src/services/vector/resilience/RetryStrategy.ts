/**
 * Retry Strategy
 * 
 * This file contains the retry strategy implementation for Vertex AI operations,
 * providing configurable retry policies with exponential backoff.
 */

import { Logger } from '../../../utils/logger';

/**
 * Retry options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Base delay in milliseconds */
  baseDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Jitter factor (0-1) to add randomness to backoff */
  jitterFactor: number;
  /** Timeout for each attempt in milliseconds */
  timeoutMs: number;
}

/**
 * Default retry options
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitterFactor: 0.2,
  timeoutMs: 10000
};

/**
 * Retry result
 */
export interface RetryResult<T> {
  /** Result of the operation */
  result: T | null;
  /** Whether the operation was successful */
  success: boolean;
  /** Number of attempts made */
  attempts: number;
  /** Total time spent in milliseconds */
  totalTimeMs: number;
  /** Error if unsuccessful */
  error?: Error;
}

/**
 * Error categorization
 */
export enum ErrorCategory {
  /** Transient error that can be retried */
  TRANSIENT = 'TRANSIENT',
  /** Permanent error that should not be retried */
  PERMANENT = 'PERMANENT',
  /** Throttling error that should be retried with backoff */
  THROTTLING = 'THROTTLING',
  /** Authentication error that should not be retried */
  AUTHENTICATION = 'AUTHENTICATION',
  /** Authorization error that should not be retried */
  AUTHORIZATION = 'AUTHORIZATION',
  /** Network error that should be retried */
  NETWORK = 'NETWORK',
  /** Timeout error that should be retried */
  TIMEOUT = 'TIMEOUT',
  /** Unknown error */
  UNKNOWN = 'UNKNOWN'
}

/**
 * Retry metrics
 */
export interface RetryMetrics {
  /** Total number of operations */
  totalOperations: number;
  /** Number of successful operations */
  successfulOperations: number;
  /** Number of failed operations */
  failedOperations: number;
  /** Number of retried operations */
  retriedOperations: number;
  /** Total number of retry attempts */
  totalRetryAttempts: number;
  /** Average number of attempts per operation */
  averageAttempts: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Average time per operation in milliseconds */
  averageTimeMs: number;
  /** Error counts by category */
  errorsByCategory: Record<ErrorCategory, number>;
}

/**
 * Retry Strategy
 */
export class RetryStrategy {
  private options: RetryOptions;
  private logger: Logger;
  private metrics: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    retriedOperations: number;
    totalRetryAttempts: number;
    totalTimeMs: number;
    errorsByCategory: Record<ErrorCategory, number>;
  };

  /**
   * Create a new Retry Strategy
   * @param options Retry options
   * @param logger Logger instance
   */
  constructor(options?: Partial<RetryOptions>, logger?: Logger) {
    this.options = { ...DEFAULT_RETRY_OPTIONS, ...options };
    this.logger = logger || new Logger('RetryStrategy');
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      retriedOperations: 0,
      totalRetryAttempts: 0,
      totalTimeMs: 0,
      errorsByCategory: {
        [ErrorCategory.TRANSIENT]: 0,
        [ErrorCategory.PERMANENT]: 0,
        [ErrorCategory.THROTTLING]: 0,
        [ErrorCategory.AUTHENTICATION]: 0,
        [ErrorCategory.AUTHORIZATION]: 0,
        [ErrorCategory.NETWORK]: 0,
        [ErrorCategory.TIMEOUT]: 0,
        [ErrorCategory.UNKNOWN]: 0
      }
    };
  }

  /**
   * Execute an operation with retry
   * @param operation Operation to execute
   * @param operationName Name of the operation for logging
   * @param shouldRetry Function to determine if retry should be attempted
   * @returns Retry result
   */
  async execute<T>(
    operation: () => Promise<T>,
    operationName: string = 'operation',
    shouldRetry?: (error: Error, attempt: number) => boolean
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let attempts = 0;
    let lastError: Error | null = null;
    let retried = false;

    this.metrics.totalOperations++;

    while (attempts < this.options.maxAttempts) {
      attempts++;

      try {
        // Execute the operation with timeout
        const result = await this.executeWithTimeout(operation, this.options.timeoutMs);

        // Record success metrics
        const totalTimeMs = Date.now() - startTime;
        this.metrics.successfulOperations++;
        this.metrics.totalTimeMs += totalTimeMs;

        if (retried) {
          this.logger.info(`${operationName} succeeded after ${attempts} attempts in ${totalTimeMs}ms`);
        }

        return {
          result,
          success: true,
          attempts,
          totalTimeMs
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorCategory = this.categorizeError(lastError);
        this.metrics.errorsByCategory[errorCategory]++;

        // Check if we should retry
        const shouldRetryError = shouldRetry 
          ? shouldRetry(lastError, attempts) 
          : this.shouldRetryError(lastError, errorCategory);

        if (shouldRetryError && attempts < this.options.maxAttempts) {
          retried = true;
          this.metrics.totalRetryAttempts++;
          if (attempts === 1) {
            this.metrics.retriedOperations++;
          }

          // Calculate backoff delay
          const delayMs = this.calculateBackoffDelay(attempts);

          this.logger.warn(
            `${operationName} failed (attempt ${attempts}/${this.options.maxAttempts}), retrying in ${Math.round(delayMs / 1000)}s`,
            {
              error: lastError.message,
              category: errorCategory,
              attempt: attempts,
              delayMs
            }
          );

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          // No more retries, record failure metrics
          const totalTimeMs = Date.now() - startTime;
          this.metrics.failedOperations++;
          this.metrics.totalTimeMs += totalTimeMs;

          this.logger.error(
            `${operationName} failed after ${attempts} attempts in ${totalTimeMs}ms`,
            {
              error: lastError.message,
              category: errorCategory,
              attempts
            }
          );

          return {
            result: null,
            success: false,
            attempts,
            totalTimeMs,
            error: lastError
          };
        }
      }
    }

    // This should never happen, but TypeScript requires a return statement
    const totalTimeMs = Date.now() - startTime;
    return {
      result: null,
      success: false,
      attempts,
      totalTimeMs,
      error: lastError || new Error('Unknown error')
    };
  }

  /**
   * Execute an operation with timeout
   * @param operation Operation to execute
   * @param timeoutMs Timeout in milliseconds
   * @returns Result of the operation
   * @throws Error if the operation times out
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Calculate backoff delay with jitter
   * @param attempt Attempt number (1-based)
   * @returns Delay in milliseconds
   */
  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff: baseDelay * 2^(attempt-1)
    const exponentialDelay = this.options.baseDelayMs * Math.pow(2, attempt - 1);
    
    // Add jitter: random value between 0 and jitterFactor * exponentialDelay
    const jitter = Math.random() * this.options.jitterFactor * exponentialDelay;
    
    // Calculate final delay, capped at maxDelayMs
    return Math.min(exponentialDelay + jitter, this.options.maxDelayMs);
  }

  /**
   * Categorize an error
   * @param error Error to categorize
   * @returns Error category
   */
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Network errors
    if (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('socket') ||
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      name.includes('network')
    ) {
      return ErrorCategory.NETWORK;
    }

    // Timeout errors
    if (
      message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('etimedout') ||
      name.includes('timeout')
    ) {
      return ErrorCategory.TIMEOUT;
    }

    // Throttling errors
    if (
      message.includes('throttl') ||
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('429') ||
      name.includes('throttl')
    ) {
      return ErrorCategory.THROTTLING;
    }

    // Authentication errors
    if (
      message.includes('authentication') ||
      message.includes('unauthenticated') ||
      message.includes('auth') ||
      message.includes('401') ||
      name.includes('auth')
    ) {
      return ErrorCategory.AUTHENTICATION;
    }

    // Authorization errors
    if (
      message.includes('authorization') ||
      message.includes('unauthorized') ||
      message.includes('permission') ||
      message.includes('403') ||
      name.includes('permission')
    ) {
      return ErrorCategory.AUTHORIZATION;
    }

    // Transient errors
    if (
      message.includes('transient') ||
      message.includes('temporary') ||
      message.includes('retry') ||
      message.includes('unavailable') ||
      message.includes('503') ||
      name.includes('transient')
    ) {
      return ErrorCategory.TRANSIENT;
    }

    // Permanent errors
    if (
      message.includes('permanent') ||
      message.includes('not found') ||
      message.includes('404') ||
      message.includes('invalid') ||
      message.includes('400') ||
      name.includes('permanent')
    ) {
      return ErrorCategory.PERMANENT;
    }

    // Unknown errors
    return ErrorCategory.UNKNOWN;
  }

  /**
   * Determine if an error should be retried based on its category
   * @param error Error to check
   * @param category Error category
   * @returns True if the error should be retried
   */
  private shouldRetryError(error: Error, category: ErrorCategory): boolean {
    switch (category) {
      case ErrorCategory.TRANSIENT:
      case ErrorCategory.NETWORK:
      case ErrorCategory.TIMEOUT:
      case ErrorCategory.THROTTLING:
      case ErrorCategory.UNKNOWN:
        return true;
      case ErrorCategory.PERMANENT:
      case ErrorCategory.AUTHENTICATION:
      case ErrorCategory.AUTHORIZATION:
        return false;
      default:
        return false;
    }
  }

  /**
   * Get retry metrics
   * @returns Retry metrics
   */
  getMetrics(): RetryMetrics {
    const totalOperations = this.metrics.totalOperations || 1; // Avoid division by zero
    const totalAttempts = this.metrics.totalOperations + this.metrics.totalRetryAttempts;

    return {
      totalOperations: this.metrics.totalOperations,
      successfulOperations: this.metrics.successfulOperations,
      failedOperations: this.metrics.failedOperations,
      retriedOperations: this.metrics.retriedOperations,
      totalRetryAttempts: this.metrics.totalRetryAttempts,
      averageAttempts: totalAttempts / totalOperations,
      successRate: this.metrics.successfulOperations / totalOperations,
      averageTimeMs: this.metrics.totalTimeMs / totalOperations,
      errorsByCategory: { ...this.metrics.errorsByCategory }
    };
  }

  /**
   * Reset retry metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      retriedOperations: 0,
      totalRetryAttempts: 0,
      totalTimeMs: 0,
      errorsByCategory: {
        [ErrorCategory.TRANSIENT]: 0,
        [ErrorCategory.PERMANENT]: 0,
        [ErrorCategory.THROTTLING]: 0,
        [ErrorCategory.AUTHENTICATION]: 0,
        [ErrorCategory.AUTHORIZATION]: 0,
        [ErrorCategory.NETWORK]: 0,
        [ErrorCategory.TIMEOUT]: 0,
        [ErrorCategory.UNKNOWN]: 0
      }
    };
  }

  /**
   * Update retry options
   * @param options New retry options
   */
  updateOptions(options: Partial<RetryOptions>): void {
    this.options = { ...this.options, ...options };
  }
}