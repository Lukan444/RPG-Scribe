/**
 * Vector Service Circuit Breaker
 *
 * This class implements the circuit breaker pattern for the Vector Service.
 * It prevents cascading failures by stopping requests to a failing service
 * and allows the service to recover.
 */

import { VectorService } from './VectorService';
import { CircuitBreakerOptions, ServiceStatus } from './types';
import { defaultCircuitBreakerOptions } from './config';
import { Logger } from '../../utils/logger';
import { EventEmitter } from 'events';

/**
 * Circuit breaker state
 */
export enum CircuitState {
  /** Circuit is closed, allowing requests to pass through */
  CLOSED = 'CLOSED',
  /** Circuit is open, blocking requests */
  OPEN = 'OPEN',
  /** Circuit is half-open, allowing a limited number of requests to pass through */
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Circuit breaker metrics
 */
export interface CircuitBreakerMetrics {
  /** Total number of requests */
  totalRequests: number;
  /** Number of successful requests */
  successfulRequests: number;
  /** Number of failed requests */
  failedRequests: number;
  /** Number of short-circuited requests */
  shortCircuitedRequests: number;
  /** Current failure rate (0-1) */
  failureRate: number;
  /** Current circuit state */
  state: CircuitState;
  /** Time in current state (milliseconds) */
  timeInCurrentStateMs: number;
  /** State transition history */
  stateTransitions: {
    /** From state */
    from: CircuitState;
    /** To state */
    to: CircuitState;
    /** Transition timestamp */
    timestamp: number;
    /** Reason for transition */
    reason: string;
  }[];
}

/**
 * Circuit breaker for the Vector Service
 */
export class VectorServiceCircuitBreaker extends EventEmitter implements VectorService {
  private vectorService: VectorService;
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;
  private options: CircuitBreakerOptions;
  private logger: Logger;
  private stateChangeTime: number = Date.now();
  private metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    shortCircuitedRequests: number;
    stateTransitions: {
      from: CircuitState;
      to: CircuitState;
      timestamp: number;
      reason: string;
    }[];
  };
  private halfOpenTimer: NodeJS.Timeout | null = null;

  /**
   * Create a new Vector Service Circuit Breaker
   * @param vectorService Vector service to wrap
   * @param options Circuit breaker options
   * @param logger Logger instance
   */
  constructor(
    vectorService: VectorService, 
    options?: Partial<CircuitBreakerOptions>,
    logger?: Logger
  ) {
    super();
    this.vectorService = vectorService;
    this.options = { ...defaultCircuitBreakerOptions, ...options };
    this.logger = logger || new Logger('VectorServiceCircuitBreaker');
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      shortCircuitedRequests: 0,
      stateTransitions: []
    };

    this.logger.info("VectorServiceCircuitBreaker initialized", {
      failureThreshold: this.options.failureThreshold,
      resetTimeoutMs: this.options.resetTimeoutMs,
      halfOpenRequestLimit: this.options.halfOpenRequestLimit
    });
  }

  /**
   * Execute an operation with circuit breaker protection
   * @param operation Operation to execute
   * @param operationName Name of the operation for logging
   * @param fallback Fallback operation to execute if the circuit is open
   * @returns Result of the operation or fallback
   */
  private async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    operationName: string = 'operation',
    fallback?: () => Promise<T>
  ): Promise<T> {
    this.metrics.totalRequests++;

    if (this.state === CircuitState.OPEN) {
      if (this.shouldReopenCircuit()) {
        this.transitionToState(CircuitState.HALF_OPEN, 'Reset timeout elapsed');
      } else {
        this.logger.debug(`Circuit is OPEN, short-circuiting ${operationName}`);
        this.metrics.shortCircuitedRequests++;
        
        // Emit short-circuit event
        this.emit('shortCircuit', { operationName });
        
        if (fallback) {
          return fallback();
        }
        throw new Error(`Circuit breaker is open for ${operationName}`);
      }
    }

    try {
      const result = await operation();
      this.metrics.successfulRequests++;

      if (this.state === CircuitState.HALF_OPEN) {
        this.successCount++;
        this.logger.debug(`Successful request in HALF_OPEN state (${this.successCount}/${this.options.halfOpenRequestLimit})`);
        
        if (this.successCount >= this.options.halfOpenRequestLimit) {
          this.recordSuccess();
        }
      }

      // Emit success event
      this.emit('success', { operationName });

      return result;
    } catch (error) {
      this.metrics.failedRequests++;
      this.recordFailure(operationName, error);

      // Emit failure event
      this.emit('failure', { 
        operationName, 
        error: error instanceof Error ? error.message : String(error) 
      });

      if (fallback) {
        return fallback();
      }

      throw error;
    }
  }

  /**
   * Check if the circuit should be reopened
   * @returns True if the circuit should be reopened
   */
  private shouldReopenCircuit(): boolean {
    const now = Date.now();
    return (now - this.lastFailureTime) > this.options.resetTimeoutMs;
  }

  /**
   * Record a successful operation
   */
  private recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionToState(CircuitState.CLOSED, 'Success threshold reached in HALF_OPEN state');
    }
    
    this.failureCount = 0;
    this.successCount = 0;
  }

  /**
   * Record a failed operation
   * @param operationName Name of the operation
   * @param error Error that occurred
   */
  private recordFailure(operationName: string, error: any): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionToState(
        CircuitState.OPEN, 
        `Failed request in HALF_OPEN state: ${errorMessage}`
      );
      this.successCount = 0;
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.transitionToState(
        CircuitState.OPEN, 
        `Failure threshold reached (${this.failureCount}/${this.options.failureThreshold}): ${errorMessage}`
      );
      this.successCount = 0;
    } else {
      this.logger.debug(
        `Failure count increased for ${operationName} (${this.failureCount}/${this.options.failureThreshold})`,
        { error: errorMessage }
      );
    }
  }

  /**
   * Transition to a new circuit state
   * @param newState New circuit state
   * @param reason Reason for the transition
   */
  private transitionToState(newState: CircuitState, reason: string): void {
    const oldState = this.state;
    this.state = newState;
    this.stateChangeTime = Date.now();

    // Record state transition
    this.metrics.stateTransitions.push({
      from: oldState,
      to: newState,
      timestamp: this.stateChangeTime,
      reason
    });

    // Trim state transitions history if it gets too large
    if (this.metrics.stateTransitions.length > 100) {
      this.metrics.stateTransitions = this.metrics.stateTransitions.slice(-100);
    }

    this.logger.info(`Circuit breaker transitioning from ${oldState} to ${newState}`, { reason });

    // Emit state change event
    this.emit('stateChange', {
      previousState: oldState,
      newState,
      reason,
      timestamp: this.stateChangeTime
    });

    // If transitioning to OPEN state, set up timer for HALF_OPEN
    if (newState === CircuitState.OPEN) {
      // Clear any existing timer
      if (this.halfOpenTimer) {
        clearTimeout(this.halfOpenTimer);
      }

      // Set up new timer
      this.halfOpenTimer = setTimeout(() => {
        if (this.state === CircuitState.OPEN) {
          this.transitionToState(CircuitState.HALF_OPEN, 'Automatic transition after reset timeout');
        }
      }, this.options.resetTimeoutMs);
    }
  }

  /**
   * Get circuit breaker metrics
   * @returns Circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    const totalRequests = Math.max(this.metrics.totalRequests, 1); // Avoid division by zero
    
    return {
      totalRequests: this.metrics.totalRequests,
      successfulRequests: this.metrics.successfulRequests,
      failedRequests: this.metrics.failedRequests,
      shortCircuitedRequests: this.metrics.shortCircuitedRequests,
      failureRate: this.metrics.failedRequests / totalRequests,
      state: this.state,
      timeInCurrentStateMs: Date.now() - this.stateChangeTime,
      stateTransitions: [...this.metrics.stateTransitions]
    };
  }

  /**
   * Reset the circuit breaker to closed state
   */
  reset(): void {
    this.transitionToState(CircuitState.CLOSED, 'Manual reset');
    this.failureCount = 0;
    this.successCount = 0;
    this.logger.info("Circuit breaker manually reset to CLOSED state");
  }

  /**
   * Trip the circuit breaker to open state
   * @param reason Reason for tripping
   */
  trip(reason: string = 'Manual trip'): void {
    this.transitionToState(CircuitState.OPEN, reason);
    this.logger.info("Circuit breaker manually tripped to OPEN state", { reason });
  }

  /**
   * Generate an embedding vector from text
   * @param text Text to generate embedding for
   * @param options Embedding generation options
   * @returns Embedding vector as array of numbers
   */
  async generateEmbedding(text: string, options?: any): Promise<number[]> {
    return this.executeWithCircuitBreaker(
      () => this.vectorService.generateEmbedding(text, options),
      'generateEmbedding'
    );
  }

  /**
   * Store an embedding vector
   * @param entityId ID of the entity
   * @param entityType Type of the entity
   * @param embedding Embedding vector
   * @param metadata Additional metadata
   * @returns ID of the stored embedding
   */
  async storeEmbedding(entityId: string, entityType: any, embedding: number[], metadata?: any): Promise<string> {
    return this.executeWithCircuitBreaker(
      () => this.vectorService.storeEmbedding(entityId, entityType, embedding, metadata),
      'storeEmbedding'
    );
  }

  /**
   * Find similar entities using an embedding vector
   * @param embedding Embedding vector to compare against
   * @param options Search options
   * @returns Array of similarity search results
   */
  async findSimilar(embedding: number[], options?: any): Promise<any[]> {
    return this.executeWithCircuitBreaker(
      () => this.vectorService.findSimilar(embedding, options),
      'findSimilar',
      async () => [] // Return empty array as fallback
    );
  }

  /**
   * Find similar entities using text
   * @param text Text to find similar entities for
   * @param options Search options
   * @returns Array of similarity search results
   */
  async findSimilarByText(text: string, options?: any): Promise<any[]> {
    return this.executeWithCircuitBreaker(
      () => this.vectorService.findSimilarByText(text, options),
      'findSimilarByText',
      async () => [] // Return empty array as fallback
    );
  }

  /**
   * Delete an embedding
   * @param embeddingId ID of the embedding to delete
   * @returns True if successful
   */
  async deleteEmbedding(embeddingId: string): Promise<boolean> {
    return this.executeWithCircuitBreaker(
      () => this.vectorService.deleteEmbedding(embeddingId),
      'deleteEmbedding',
      async () => false // Return false as fallback
    );
  }

  /**
   * Generate multiple embeddings in batch
   * @param texts Array of texts to generate embeddings for
   * @param options Embedding generation options
   * @returns Array of embedding vectors
   */
  async generateEmbeddingsBatch(texts: string[], options?: any): Promise<number[][]> {
    return this.executeWithCircuitBreaker(
      () => this.vectorService.generateEmbeddingsBatch(texts, options),
      'generateEmbeddingsBatch',
      async () => texts.map(() => []) // Return empty embeddings as fallback
    );
  }

  /**
   * Store multiple embeddings in batch
   * @param embeddings Array of embedding storage requests
   * @returns Array of stored embedding IDs
   */
  async storeEmbeddingsBatch(embeddings: any[]): Promise<string[]> {
    return this.executeWithCircuitBreaker(
      () => this.vectorService.storeEmbeddingsBatch(embeddings),
      'storeEmbeddingsBatch',
      async () => embeddings.map(() => '') // Return empty IDs as fallback
    );
  }

  /**
   * Get the status of the vector service
   * @returns Service status
   */
  async getServiceStatus(): Promise<ServiceStatus> {
    return this.executeWithCircuitBreaker(
      () => this.vectorService.getServiceStatus(),
      'getServiceStatus',
      async () => ({
        available: false,
        degraded: true,
        error: `Circuit breaker is ${this.state}`,
        timestamp: Date.now()
      })
    );
  }

  /**
   * Get the current state of the circuit breaker
   * @returns Circuit breaker state
   */
  getCircuitState(): CircuitState {
    return this.state;
  }

  /**
   * Update circuit breaker options
   * @param options New circuit breaker options
   */
  updateOptions(options: Partial<CircuitBreakerOptions>): void {
    this.options = { ...this.options, ...options };
    this.logger.info("Circuit breaker options updated", this.options);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.halfOpenTimer) {
      clearTimeout(this.halfOpenTimer);
      this.halfOpenTimer = null;
    }
    this.removeAllListeners();
    this.logger.info("Circuit breaker cleaned up");
  }
}