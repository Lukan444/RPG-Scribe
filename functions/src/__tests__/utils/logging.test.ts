/**
 * Logging Tests
 * 
 * This file contains tests for the logging utilities.
 */

import { Logger, LogLevel } from '../../utils/logging';
import * as functions from 'firebase-functions';

// Mock firebase-functions logger
jest.mock('firebase-functions', () => {
  return {
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }
  };
});

describe('Logging Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Logger', () => {
    it('should create a logger with function name and operation ID', () => {
      const logger = new Logger('test-function');
      expect(logger['functionName']).toBe('test-function');
      expect(logger['operationId']).toMatch(/^op-\d+-[a-z0-9]+$/);
      
      const loggerWithOpId = new Logger('test-function', 'test-op-id');
      expect(loggerWithOpId['functionName']).toBe('test-function');
      expect(loggerWithOpId['operationId']).toBe('test-op-id');
    });

    it('should log debug messages', () => {
      const logger = new Logger('test-function', 'test-op-id');
      logger.debug('Test debug message');
      
      expect(functions.logger.debug).toHaveBeenCalledWith('Test debug message', {
        level: LogLevel.DEBUG,
        message: 'Test debug message',
        data: undefined,
        timestamp: expect.any(String),
        functionName: 'test-function',
        operationId: 'test-op-id'
      });
    });

    it('should log info messages', () => {
      const logger = new Logger('test-function', 'test-op-id');
      logger.info('Test info message', { key: 'value' });
      
      expect(functions.logger.info).toHaveBeenCalledWith('Test info message', {
        level: LogLevel.INFO,
        message: 'Test info message',
        data: { key: 'value' },
        timestamp: expect.any(String),
        functionName: 'test-function',
        operationId: 'test-op-id'
      });
    });

    it('should log warning messages', () => {
      const logger = new Logger('test-function', 'test-op-id');
      logger.warn('Test warning message');
      
      expect(functions.logger.warn).toHaveBeenCalledWith('Test warning message', {
        level: LogLevel.WARN,
        message: 'Test warning message',
        data: undefined,
        timestamp: expect.any(String),
        functionName: 'test-function',
        operationId: 'test-op-id'
      });
    });

    it('should log error messages', () => {
      const logger = new Logger('test-function', 'test-op-id');
      const error = new Error('Test error');
      logger.error('Test error message', error);
      
      expect(functions.logger.error).toHaveBeenCalledWith('Test error message', {
        level: LogLevel.ERROR,
        message: 'Test error message',
        data: {
          message: 'Test error',
          stack: error.stack,
          name: 'Error'
        },
        timestamp: expect.any(String),
        functionName: 'test-function',
        operationId: 'test-op-id'
      });
    });

    it('should log error messages with additional data', () => {
      const logger = new Logger('test-function', 'test-op-id');
      const error = new Error('Test error');
      logger.error('Test error message', error, { key: 'value' });
      
      expect(functions.logger.error).toHaveBeenCalledWith('Test error message', {
        level: LogLevel.ERROR,
        message: 'Test error message',
        data: {
          message: 'Test error',
          stack: error.stack,
          name: 'Error',
          key: 'value'
        },
        timestamp: expect.any(String),
        functionName: 'test-function',
        operationId: 'test-op-id'
      });
    });

    it('should create child loggers', () => {
      const logger = new Logger('test-function', 'test-op-id');
      const childLogger = logger.child('child');
      
      expect(childLogger['functionName']).toBe('test-function:child');
      expect(childLogger['operationId']).toBe('test-op-id');
      
      childLogger.info('Test child message');
      
      expect(functions.logger.info).toHaveBeenCalledWith('Test child message', {
        level: LogLevel.INFO,
        message: 'Test child message',
        data: undefined,
        timestamp: expect.any(String),
        functionName: 'test-function:child',
        operationId: 'test-op-id'
      });
    });

    it('should get the operation ID', () => {
      const logger = new Logger('test-function', 'test-op-id');
      expect(logger.getOperationId()).toBe('test-op-id');
    });
  });
});
