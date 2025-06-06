/**
 * Error Handling Tests
 *
 * This file contains tests for the error handling utilities.
 */

import { AppError, ErrorType, isRetryableError, handleError } from '../../utils/error-handling';
import { mockLogger, resetAllMocks } from '../test-utils';

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('AppError', () => {
    it('should create an AppError with default values', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ErrorType.INTERNAL);
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('AppError');
    });

    it('should create an AppError with custom values', () => {
      const originalError = new Error('Original error');
      const error = new AppError(
        'Test error',
        ErrorType.VALIDATION,
        400,
        originalError,
        { field: 'test' }
      );
      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.statusCode).toBe(400);
      expect(error.originalError).toBe(originalError);
      expect(error.data).toEqual({ field: 'test' });
    });
  });

  describe('isRetryableError', () => {
    it('should identify AppErrors that are retryable', () => {
      expect(isRetryableError(new AppError('Test', ErrorType.EXTERNAL_SERVICE))).toBe(true);
      expect(isRetryableError(new AppError('Test', ErrorType.RATE_LIMIT))).toBe(true);
      expect(isRetryableError(new AppError('Test', ErrorType.TIMEOUT))).toBe(true);
      expect(isRetryableError(new AppError('Test', ErrorType.VALIDATION))).toBe(false);
      expect(isRetryableError(new AppError('Test', ErrorType.AUTHENTICATION))).toBe(false);
      expect(isRetryableError(new AppError('Test', ErrorType.AUTHORIZATION))).toBe(false);
    });

    it('should identify non-AppErrors that are retryable based on message', () => {
      expect(isRetryableError(new Error('timeout occurred'))).toBe(true);
      expect(isRetryableError(new Error('rate limit exceeded'))).toBe(true);
      expect(isRetryableError(new Error('ECONNRESET'))).toBe(true);
      expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
      expect(isRetryableError(new Error('temporarily unavailable'))).toBe(true);
      expect(isRetryableError(new Error('service unavailable'))).toBe(true);
      expect(isRetryableError(new Error('invalid input'))).toBe(false);
      expect(isRetryableError(new Error('not found'))).toBe(false);
    });
  });

  describe('handleError', () => {
    it('should log the error and return null if no retry function is provided', async () => {
      const error = new Error('Test error');
      const result = await handleError(error, mockLogger as any, 'test context');

      expect(mockLogger.error).toHaveBeenCalledWith('test context: Test error', error);
      expect(result).toBeNull();
    });

    it('should log AppError with additional information', async () => {
      const originalError = new Error('Original error');
      const error = new AppError(
        'Test error',
        ErrorType.VALIDATION,
        400,
        originalError,
        { field: 'test' }
      );

      await handleError(error, mockLogger as any, 'test context');

      expect(mockLogger.error).toHaveBeenCalledWith('test context: Test error', error, {
        type: ErrorType.VALIDATION,
        statusCode: 400,
        originalError,
        data: { field: 'test' }
      });
    });

    it('should retry retryable errors', async () => {
      const error = new AppError('Test', ErrorType.EXTERNAL_SERVICE);
      const retryFn = jest.fn().mockResolvedValue('success');

      const result = await handleError(error, mockLogger as any, 'test context', retryFn);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled(); // Log retry attempt
      expect(retryFn).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should not retry non-retryable errors', async () => {
      const error = new AppError('Test', ErrorType.VALIDATION);
      const retryFn = jest.fn().mockResolvedValue('success');

      const result = await handleError(error, mockLogger as any, 'test context', retryFn);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(retryFn).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should retry up to maxRetries times', async () => {
      const error = new AppError('Test', ErrorType.EXTERNAL_SERVICE);
      const retryError = new AppError('Retry failed', ErrorType.EXTERNAL_SERVICE);
      const retryFn = jest.fn()
        .mockRejectedValueOnce(retryError)
        .mockRejectedValueOnce(retryError)
        .mockResolvedValue('success');

      const result = await handleError(
        error,
        mockLogger as any,
        'test context',
        retryFn,
        3
      );

      expect(mockLogger.error).toHaveBeenCalledTimes(3); // Initial error + 2 retry errors
      expect(mockLogger.info).toHaveBeenCalledTimes(3); // 3 retry attempts
      expect(retryFn).toHaveBeenCalledTimes(3);
      expect(result).toBe('success');
    });

    it('should give up after maxRetries', async () => {
      const error = new AppError('Test', ErrorType.EXTERNAL_SERVICE);
      const retryError = new AppError('Retry failed', ErrorType.EXTERNAL_SERVICE);
      const retryFn = jest.fn()
        .mockRejectedValue(retryError);

      const result = await handleError(
        error,
        mockLogger as any,
        'test context',
        retryFn,
        2
      );

      expect(mockLogger.error).toHaveBeenCalledTimes(3); // Initial error + 2 retry errors
      expect(mockLogger.info).toHaveBeenCalledTimes(2); // 2 retry attempts
      expect(retryFn).toHaveBeenCalledTimes(2);
      expect(result).toBeNull();
    });
  });
});
