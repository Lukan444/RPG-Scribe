/**
 * Vector Service Configuration
 *
 * This file contains the configuration for the Vector Service,
 * including environment-specific settings for Vertex AI.
 */

import { VertexAIConfig, FallbackConfig } from './types';

/**
 * Default circuit breaker options
 */
export const defaultCircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeoutMs: 30000, // 30 seconds
  halfOpenRequestLimit: 3,
  requestTimeoutMs: 10000, // 10 seconds
  enableLogging: true,
  failureTimeWindowMs: 60000, // 60 seconds
  maxResetTimeoutMs: 600000, // 10 minutes
  responseTimeThresholdMs: 5000, // 5 seconds
  slowResponseThreshold: 3,
  enablePredictiveFailure: true
};

/**
 * Default embedding model
 */
export const DEFAULT_EMBEDDING_MODEL = 'textembedding-gecko@latest';

/**
 * Default embedding dimension
 */
export const DEFAULT_EMBEDDING_DIMENSION = 768;

/**
 * Default fallback configuration
 */
export const defaultFallbackConfig = {
  enabled: true,
  cache: {
    memory: {
      maxEntries: 100,
      ttlMs: 300000, // 5 minutes
      storageType: 'memory' as const
    },
    localStorage: {
      maxEntries: 500,
      ttlMs: 3600000, // 1 hour
      storageType: 'localStorage' as const
    },
    indexedDB: {
      maxEntries: 1000,
      ttlMs: 86400000, // 24 hours
      storageType: 'indexedDB' as const
    },
    firestore: {
      maxEntries: -1, // unlimited
      ttlMs: 604800000, // 7 days
      storageType: 'firestore' as const
    }
  },
  localVector: {
    enabled: true,
    maxCachedVectors: 1000,
    compressionRatio: 0.33, // 768 -> 256 dimensions
    algorithm: 'cosine' as const
  },
  keywordSearchEnabled: true,
  cacheWarmingEnabled: true
};

/**
 * Environment-specific configurations for Vertex AI
 */
export const vectorServiceConfigs: Record<string, VertexAIConfig> = {
  development: {
    environment: 'development',
    projectId: 'rpg-scribe-dev',
    location: 'us-central1',
    indexEndpoint: 'dev-endpoint',
    embeddingModel: DEFAULT_EMBEDDING_MODEL,
    namespace: 'dev',
    apiEndpoint: 'us-central1-aiplatform.googleapis.com',
    maxRetries: 3,
    timeoutMs: 10000,
    fallback: defaultFallbackConfig
  },
  staging: {
    environment: 'staging',
    projectId: 'rpg-scribe-staging',
    location: 'us-central1',
    indexEndpoint: 'staging-endpoint',
    embeddingModel: DEFAULT_EMBEDDING_MODEL,
    namespace: 'staging',
    apiEndpoint: 'us-central1-aiplatform.googleapis.com',
    maxRetries: 3,
    timeoutMs: 10000,
    fallback: defaultFallbackConfig
  },
  production: {
    environment: 'production',
    projectId: 'rpg-scribe-prod',
    location: 'us-central1',
    indexEndpoint: 'prod-endpoint',
    embeddingModel: DEFAULT_EMBEDDING_MODEL,
    namespace: 'prod',
    apiEndpoint: 'us-central1-aiplatform.googleapis.com',
    maxRetries: 5,
    timeoutMs: 15000,
    fallback: {
      ...defaultFallbackConfig,
      cache: {
        ...defaultFallbackConfig.cache,
        memory: {
          ...defaultFallbackConfig.cache.memory,
          maxEntries: 200 // Larger cache for production
        },
        localStorage: {
          ...defaultFallbackConfig.cache.localStorage,
          maxEntries: 1000
        }
      }
    }
  }
};

/**
 * Get the configuration for a specific environment
 * @param environment Environment name
 * @returns Configuration for the specified environment
 * @throws Error if no configuration is found for the environment
 */
export function getConfig(environment: string): VertexAIConfig {
  const config = vectorServiceConfigs[environment];
  if (!config) {
    throw new Error(`No configuration found for environment: ${environment}`);
  }
  return config;
}

/**
 * Get the current environment from environment variables
 * @returns Current environment name
 */
export function getCurrentEnvironment(): string {
  return process.env.REACT_APP_ENVIRONMENT || 'development';
}

/**
 * Get the configuration for the current environment
 * @returns Configuration for the current environment
 */
export function getCurrentConfig(): VertexAIConfig {
  return getConfig(getCurrentEnvironment());
}
