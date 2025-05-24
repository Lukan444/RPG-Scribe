/**
 * Vector Service Index
 *
 * This file exports all the components of the Vector Service module.
 */

// Types
export * from './types';

// Interfaces
export type { VectorService } from './VectorService';

// Implementations
export { VertexAIVectorService } from './VertexAIVectorService';
export { VertexAIClient } from './VertexAIClient';
export { VertexAIIndexManager } from './VertexAIIndexManager';
export { VectorServiceCircuitBreaker } from './VectorServiceCircuitBreaker';
export { EntityVectorSynchronizer } from './EntityVectorSynchronizer';
export {
  VectorSearchFallbackChain,
  VertexAISearchStrategy,
  KeywordSearchStrategy,
  CacheSearchStrategy
} from './VectorSearchFallbackChain';

// Enhanced Fallback and Resilience Components
export { EnhancedVertexAIVectorService } from './EnhancedVertexAIVectorService';
export { LocalVectorProcessor } from './LocalVectorProcessor';
export { MultiTierCacheManager } from './MultiTierCacheManager';

// Factory
export { VectorServiceFactory } from './VectorServiceFactory';

// Configuration
export {
  getConfig,
  getCurrentConfig,
  getCurrentEnvironment,
  defaultCircuitBreakerOptions,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_EMBEDDING_DIMENSION
} from './config';
