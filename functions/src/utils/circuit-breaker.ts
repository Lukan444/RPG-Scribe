/**
 * Circuit Breaker Pattern Implementation
 * 
 * This file implements the circuit breaker pattern to prevent
 * cascading failures when an external service is unavailable.
 */

import { Logger } from "./logging";

/**
 * Circuit breaker options
 */
export interface CircuitBreakerOptions {
  /** Failure threshold before opening the circuit */
  failureThreshold: number;
  /** Timeout in milliseconds before trying again */
  resetTimeout: number;
  /** Logger instance */
  logger: Logger;
}

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  /** Circuit is closed and requests are allowed */
  CLOSED = "CLOSED",
  /** Circuit is open and requests are blocked */
  OPEN = "OPEN",
  /** Circuit is half-open and a single request is allowed */
  HALF_OPEN = "HALF_OPEN"
}

/**
 * Circuit breaker for external service calls
 * 
 * This implements the circuit breaker pattern to prevent
 * cascading failures when an external service is unavailable.
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private nextAttempt: number = Date.now();
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly logger: Logger;

  /**
   * Create a new circuit breaker
   * @param options Circuit breaker options
   */
  constructor(options: CircuitBreakerOptions) {
    this.failureThreshold = options.failureThreshold;
    this.resetTimeout = options.resetTimeout;
    this.logger = options.logger.child("CircuitBreaker");
    
    this.logger.debug("Circuit breaker initialized", {
      failureThreshold: this.failureThreshold,
      resetTimeout: this.resetTimeout
    });
  }

  /**
   * Execute a function with circuit breaker protection
   * @param fn Function to execute
   * @returns Result of the function
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        this.logger.warn("Circuit is OPEN, rejecting request", {
          nextAttempt: new Date(this.nextAttempt).toISOString()
        });
        throw new Error("Circuit breaker is open");
      }
      
      this.logger.info("Circuit is HALF_OPEN, allowing request");
      this.state = CircuitBreakerState.HALF_OPEN;
    }
    
    try {
      const result = await fn();
      
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitBreakerState.CLOSED;
    this.logger.debug("Request succeeded, circuit is CLOSED");
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++;
    
    if (this.state === CircuitBreakerState.HALF_OPEN || this.failureCount >= this.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttempt = Date.now() + this.resetTimeout;
      this.logger.warn("Request failed, circuit is OPEN", {
        failureCount: this.failureCount,
        nextAttempt: new Date(this.nextAttempt).toISOString()
      });
    } else {
      this.logger.debug("Request failed, circuit remains CLOSED", {
        failureCount: this.failureCount,
        threshold: this.failureThreshold
      });
    }
  }

  /**
   * Get the current state of the circuit breaker
   * @returns Current state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Get the current failure count
   * @returns Current failure count
   */
  getFailureCount(): number {
    return this.failureCount;
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.nextAttempt = Date.now();
    this.logger.info("Circuit breaker reset");
  }
}
