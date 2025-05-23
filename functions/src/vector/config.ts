/**
 * Vector Service Configuration for Cloud Functions
 * 
 * This file contains the configuration for the Vector Service in Cloud Functions,
 * including environment-specific settings for Vertex AI.
 */

import * as functions from "firebase-functions";
import { VertexAIConfig } from "./types";

/**
 * Default embedding model
 */
export const DEFAULT_EMBEDDING_MODEL = "textembedding-gecko@latest";

/**
 * Default embedding dimension
 */
export const DEFAULT_EMBEDDING_DIMENSION = 768;

/**
 * Environment-specific configurations for Vertex AI
 */
export const vectorServiceConfigs: Record<string, VertexAIConfig> = {
  development: {
    environment: "development",
    projectId: process.env.VERTEX_AI_PROJECT_ID || "rpg-scribe-dev",
    location: process.env.VERTEX_AI_LOCATION || "us-central1",
    indexEndpoint: process.env.VERTEX_AI_INDEX_ENDPOINT || "dev-endpoint",
    embeddingModel: process.env.VERTEX_AI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
    namespace: "dev",
    apiEndpoint: "us-central1-aiplatform.googleapis.com",
    maxRetries: 3,
    timeoutMs: 10000
  },
  staging: {
    environment: "staging",
    projectId: process.env.VERTEX_AI_PROJECT_ID || "rpg-scribe-staging",
    location: process.env.VERTEX_AI_LOCATION || "us-central1",
    indexEndpoint: process.env.VERTEX_AI_INDEX_ENDPOINT || "staging-endpoint",
    embeddingModel: process.env.VERTEX_AI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
    namespace: "staging",
    apiEndpoint: "us-central1-aiplatform.googleapis.com",
    maxRetries: 3,
    timeoutMs: 10000
  },
  production: {
    environment: "production",
    projectId: process.env.VERTEX_AI_PROJECT_ID || "rpg-scribe-prod",
    location: process.env.VERTEX_AI_LOCATION || "us-central1",
    indexEndpoint: process.env.VERTEX_AI_INDEX_ENDPOINT || "prod-endpoint",
    embeddingModel: process.env.VERTEX_AI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
    namespace: "prod",
    apiEndpoint: "us-central1-aiplatform.googleapis.com",
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
  return functions.config().environment?.name || "development";
}

/**
 * Get the configuration for the current environment
 * @returns Configuration for the current environment
 */
export function getCurrentConfig(): VertexAIConfig {
  return getConfig(getCurrentEnvironment());
}
