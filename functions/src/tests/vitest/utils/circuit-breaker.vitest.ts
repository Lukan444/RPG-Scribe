/**
 * Tests for Circuit Breaker
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker, CircuitBreakerState } from '../../../utils/circuit-breaker';
import { Logger } from '../../../utils/logging';

// Mock the Logger class
vi.mock('../../../utils/logging', () => {
  return {
    Logger: vi.fn().mockImplementation(() => {
      return {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        child: vi.fn().mockReturnThis()
      };
    })
  };
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  let mockLogger: Logger;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger = new Logger('test');
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000,
      logger: mockLogger
    });
  });

  describe('execute', () => {
    it('should execute a function successfully', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });

    it('should handle function failures', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('test error'));
      
      try {
        await circuitBreaker.execute(mockFn);
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('test error');
      }
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getFailureCount()).toBe(1);
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should open the circuit after reaching the failure threshold', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('test error'));
      
      // First failure
      try { await circuitBreaker.execute(mockFn); } catch (e) {}
      expect(circuitBreaker.getFailureCount()).toBe(1);
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      
      // Second failure
      try { await circuitBreaker.execute(mockFn); } catch (e) {}
      expect(circuitBreaker.getFailureCount()).toBe(2);
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      
      // Third failure - should open the circuit
      try { await circuitBreaker.execute(mockFn); } catch (e) {}
      expect(circuitBreaker.getFailureCount()).toBe(3);
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      
      // Fourth attempt - should be rejected without calling the function
      try {
        await circuitBreaker.execute(mockFn);
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Circuit breaker is open');
      }
      
      // The function should only have been called 3 times
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should transition to half-open state after reset timeout', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('test error'));
      
      // Fail enough times to open the circuit
      try { await circuitBreaker.execute(mockFn); } catch (e) {}
      try { await circuitBreaker.execute(mockFn); } catch (e) {}
      try { await circuitBreaker.execute(mockFn); } catch (e) {}
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      
      // Mock Date.now to simulate time passing
      const originalDateNow = Date.now;
      Date.now = vi.fn().mockReturnValue(originalDateNow() + 2000); // 2 seconds later
      
      // Next attempt should transition to half-open
      try { await circuitBreaker.execute(mockFn); } catch (e) {}
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);
      expect(mockFn).toHaveBeenCalledTimes(4);
      
      // Restore Date.now
      Date.now = originalDateNow;
    });

    it('should close the circuit after a successful call in half-open state', async () => {
      const mockFailFn = vi.fn().mockRejectedValue(new Error('test error'));
      
      // Fail enough times to open the circuit
      try { await circuitBreaker.execute(mockFailFn); } catch (e) {}
      try { await circuitBreaker.execute(mockFailFn); } catch (e) {}
      try { await circuitBreaker.execute(mockFailFn); } catch (e) {}
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      
      // Mock Date.now to simulate time passing
      const originalDateNow = Date.now;
      Date.now = vi.fn().mockReturnValue(originalDateNow() + 2000); // 2 seconds later
      
      // Next attempt should transition to half-open
      const mockSuccessFn = vi.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(mockSuccessFn);
      
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(circuitBreaker.getFailureCount()).toBe(0);
      
      // Restore Date.now
      Date.now = originalDateNow;
    });

    it('should reset the circuit breaker', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('test error'));
      
      // Fail enough times to open the circuit
      try { await circuitBreaker.execute(mockFn); } catch (e) {}
      try { await circuitBreaker.execute(mockFn); } catch (e) {}
      try { await circuitBreaker.execute(mockFn); } catch (e) {}
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      
      // Reset the circuit breaker
      circuitBreaker.reset();
      
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });
  });
});
