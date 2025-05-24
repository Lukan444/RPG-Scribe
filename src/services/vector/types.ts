/**
 * Vector Database Integration Types
 *
 * This file contains the type definitions for the Vector Database Integration
 * architecture, which enables AI-powered features in RPG Scribe using
 * Google's Vertex AI Vector Search.
 */

import { EntityType } from '../../models/EntityType';

/**
 * Options for embedding generation
 */
export interface EmbeddingOptions {
  /** Model to use for embedding generation */
  model?: string;
  /** Dimension of the embedding vector */
  dimension?: number;
  /** Whether to normalize the embedding vector */
  normalize?: boolean;
  /** Timeout in milliseconds */
  timeoutMs?: number;
}

/**
 * Options for similarity search
 */
export interface SimilaritySearchOptions {
  /** Number of results to return */
  limit?: number;
  /** Minimum similarity score (0-1) */
  minScore?: number;
  /** Entity type filter */
  entityTypes?: EntityType[];
  /** Additional filters as key-value pairs */
  filters?: Record<string, any>;
  /** Whether to include the embedding vector in the result */
  includeEmbedding?: boolean;
  /** Whether to include the metadata in the result */
  includeMetadata?: boolean;
  /** Timeout in milliseconds */
  timeoutMs?: number;
}

/**
 * Result of a similarity search
 */
export interface SimilaritySearchResult {
  /** ID of the embedding */
  embeddingId: string;
  /** ID of the entity */
  entityId: string;
  /** Type of the entity */
  entityType: EntityType;
  /** Similarity score (0-1) */
  score: number;
  /** Embedding vector (if requested) */
  embedding?: number[];
  /** Metadata (if requested) */
  metadata?: Record<string, any>;
}

/**
 * Request for storing an embedding
 */
export interface EmbeddingStorageRequest {
  /** ID of the entity */
  entityId: string;
  /** Type of the entity */
  entityType: EntityType;
  /** Embedding vector */
  embedding: number[];
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Status of the vector service
 */
export interface ServiceStatus {
  /** Whether the service is available */
  available: boolean;
  /** Whether the service is in degraded mode */
  degraded: boolean;
  /** Latency in milliseconds */
  latencyMs?: number;
  /** Error message if any */
  error?: string;
  /** Timestamp of the status check */
  timestamp: number;
}

/**
 * Result of a synchronization operation
 */
export interface SyncResult {
  /** ID of the entity */
  entityId: string;
  /** Type of the entity */
  entityType: EntityType;
  /** Whether the synchronization was successful */
  success: boolean;
  /** ID of the embedding if successful */
  embeddingId?: string;
  /** Error message if unsuccessful */
  error?: string;
  /** Timestamp of the synchronization */
  timestamp: number;
}

/**
 * Summary of a synchronization operation
 */
export interface SyncSummary {
  /** Total number of entities processed */
  total: number;
  /** Number of successful synchronizations */
  success: number;
  /** Number of failed synchronizations */
  failed: number;
  /** List of failed entity IDs */
  failedIds: string[];
  /** Start timestamp */
  startTimestamp: number;
  /** End timestamp */
  endTimestamp: number;
  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Status of a synchronization
 */
export interface SyncStatus {
  /** ID of the entity */
  entityId: string;
  /** Type of the entity */
  entityType: EntityType;
  /** Status of the synchronization */
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  /** ID of the embedding if completed */
  embeddingId?: string;
  /** Error message if failed */
  error?: string;
  /** Timestamp of the last synchronization */
  timestamp: number;
}

/**
 * Options for synchronization
 */
export interface SyncOptions {
  /** Whether to force synchronization even if already synchronized */
  force?: boolean;
  /** Batch size for synchronization */
  batchSize?: number;
  /** Timeout in milliseconds */
  timeoutMs?: number;
}

/**
 * Options for the circuit breaker
 */
export interface CircuitBreakerOptions {
  /** Threshold for failures before opening the circuit */
  failureThreshold: number;
  /** Reset timeout in milliseconds */
  resetTimeoutMs: number;
  /** Half-open state request limit */
  halfOpenRequestLimit: number;
  /** Timeout for individual requests (ms) */
  requestTimeoutMs?: number;
  /** Enable detailed logging */
  enableLogging?: boolean;
  /** Time window for failure counting (ms) - default: 60 seconds */
  failureTimeWindowMs?: number;
  /** Maximum reset timeout for exponential backoff (ms) - default: 10 minutes */
  maxResetTimeoutMs?: number;
  /** Response time threshold for degraded service detection (ms) - default: 5 seconds */
  responseTimeThresholdMs?: number;
  /** Number of slow responses before marking as degraded */
  slowResponseThreshold?: number;
  /** Enable predictive failure detection */
  enablePredictiveFailure?: boolean;
}

/**
 * Search strategy interface
 */
export interface SearchStrategy {
  /** Name of the strategy */
  name: string;
  /** Search method */
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}

/**
 * Search options
 */
export interface SearchOptions {
  /** Number of results to return */
  limit?: number;
  /** Entity type filter */
  entityTypes?: EntityType[];
  /** Additional filters as key-value pairs */
  filters?: Record<string, any>;
}

/**
 * Search result
 */
export interface SearchResult {
  /** ID of the entity */
  entityId: string;
  /** Type of the entity */
  entityType: EntityType;
  /** Relevance score (0-1) */
  score: number;
  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * Service levels for graceful degradation
 */
export enum ServiceLevel {
  /** Full functionality with Vertex AI */
  FULL = 'FULL',
  /** Degraded mode with local vector processing */
  DEGRADED = 'DEGRADED',
  /** Emergency mode with keyword search only */
  EMERGENCY = 'EMERGENCY',
  /** Offline mode with cached results only */
  OFFLINE = 'OFFLINE'
}

/**
 * Cache tier configuration
 */
export interface CacheTierConfig {
  /** Maximum number of entries */
  maxEntries: number;
  /** Time-to-live in milliseconds */
  ttlMs: number;
  /** Storage type */
  storageType: 'memory' | 'localStorage' | 'indexedDB' | 'firestore';
}

/**
 * Multi-tier cache configuration
 */
export interface CacheConfig {
  /** Memory cache configuration */
  memory: CacheTierConfig;
  /** Local storage cache configuration */
  localStorage: CacheTierConfig;
  /** IndexedDB cache configuration */
  indexedDB: CacheTierConfig;
  /** Firestore cache configuration */
  firestore: CacheTierConfig;
}

/**
 * Local vector processing options
 */
export interface LocalVectorOptions {
  /** Enable local vector similarity calculations */
  enabled: boolean;
  /** Maximum number of vectors to cache locally */
  maxCachedVectors: number;
  /** Vector compression ratio (0-1) */
  compressionRatio: number;
  /** Similarity algorithm to use */
  algorithm: 'cosine' | 'dotProduct' | 'euclidean';
}

/**
 * Fallback strategy configuration
 */
export interface FallbackConfig {
  /** Enable fallback system */
  enabled: boolean;
  /** Cache configuration */
  cache: CacheConfig;
  /** Local vector processing options */
  localVector: LocalVectorOptions;
  /** Keyword search fallback enabled */
  keywordSearchEnabled: boolean;
  /** Cache warming enabled */
  cacheWarmingEnabled: boolean;
}

/**
 * Configuration for Vertex AI
 */
export interface VertexAIConfig {
  /** Environment (development, staging, production) */
  environment: 'development' | 'staging' | 'production';
  /** Google Cloud project ID */
  projectId: string;
  /** Google Cloud location */
  location: string;
  /** Index endpoint */
  indexEndpoint: string;
  /** Embedding model */
  embeddingModel: string;
  /** Namespace for multi-tenant support */
  namespace: string;
  /** API endpoint */
  apiEndpoint: string;
  /** Maximum number of retries */
  maxRetries: number;
  /** Timeout in milliseconds */
  timeoutMs: number;
  /** Fallback configuration */
  fallback?: FallbackConfig;
}
