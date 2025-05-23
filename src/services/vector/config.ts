/**
 * Vector Service Configuration
 * 
 * This file contains the configuration for the Vector Service,
 * including environment-specific settings for Vertex AI.
 */

import { VertexAIConfig } from './types';

/**
 * Default circuit breaker options
 */
export const defaultCircuitBreakerOptions = {
  failureThreshold: 3,
  resetTimeoutMs: 30000, // 30 seconds
  halfOpenRequestLimit: 1
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
    timeoutMs: 10000
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
    timeoutMs: 10000
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
    timeoutMs: 15000
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
