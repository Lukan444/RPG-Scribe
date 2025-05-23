/**
 * Vector Service Factory
 * 
 * This class provides factory methods for creating and configuring
 * vector service instances with appropriate wrappers and fallbacks.
 */

import { VectorService } from './VectorService';
import { VertexAIVectorService } from './VertexAIVectorService';
import { VectorServiceCircuitBreaker } from './VectorServiceCircuitBreaker';
import { 
  VectorSearchFallbackChain, 
  VertexAISearchStrategy, 
  KeywordSearchStrategy, 
  CacheSearchStrategy 
} from './VectorSearchFallbackChain';
import { getConfig, getCurrentConfig } from './config';
import { CircuitBreakerOptions } from './types';

/**
 * Vector Service Factory
 */
export class VectorServiceFactory {
  /**
   * Create a basic vector service
   * @param environment Environment name (default: current environment)
   * @returns Vector service
   */
  static createBasicService(environment?: string): VectorService {
    const config = environment ? getConfig(environment) : getCurrentConfig();
    return new VertexAIVectorService(config);
  }
  
  /**
   * Create a vector service with circuit breaker
   * @param environment Environment name (default: current environment)
   * @param options Circuit breaker options
   * @returns Vector service with circuit breaker
   */
  static createServiceWithCircuitBreaker(
    environment?: string,
    options?: Partial<CircuitBreakerOptions>
  ): VectorService {
    const baseService = this.createBasicService(environment);
    return new VectorServiceCircuitBreaker(baseService, options);
  }
  
  /**
   * Create a search fallback chain
   * @param vectorService Vector service
   * @param firestoreService Firestore service
   * @returns Search fallback chain
   */
  static createSearchFallbackChain(
    vectorService: VectorService,
    firestoreService: any
  ): VectorSearchFallbackChain {
    // Create strategies
    const vertexStrategy = new VertexAISearchStrategy(vectorService);
    const keywordStrategy = new KeywordSearchStrategy(firestoreService);
    const cacheStrategy = new CacheSearchStrategy();
    
    // Create fallback chain
    return new VectorSearchFallbackChain([
      vertexStrategy,
      keywordStrategy,
      cacheStrategy
    ]);
  }
  
  /**
   * Create a complete vector service with all wrappers
   * @param firestoreService Firestore service
   * @param environment Environment name (default: current environment)
   * @returns Complete vector service
   */
  static createCompleteService(
    firestoreService: any,
    environment?: string
  ): {
    vectorService: VectorService;
    searchFallbackChain: VectorSearchFallbackChain;
  } {
    // Create service with circuit breaker
    const vectorService = this.createServiceWithCircuitBreaker(environment);
    
    // Create search fallback chain
    const searchFallbackChain = this.createSearchFallbackChain(
      vectorService,
      firestoreService
    );
    
    return {
      vectorService,
      searchFallbackChain
    };
  }
}
