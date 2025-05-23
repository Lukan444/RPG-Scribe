/**
 * Cost Optimization for Vertex AI Integration
 * 
 * This file provides cost optimization functionality for Vertex AI integration,
 * including dimension reduction, caching, and query optimization.
 */

import * as admin from "firebase-admin";
import { Logger } from "../utils/logging";
import { AppError, ErrorType } from "../utils/error-handling";
import { getEnvironmentConfig } from "../config/environment-config";

/**
 * Dimension reduction method
 */
export enum DimensionReductionMethod {
  /** Principal Component Analysis */
  PCA = "PCA",
  /** Truncated SVD */
  TRUNCATED_SVD = "TRUNCATED_SVD",
  /** Random Projection */
  RANDOM_PROJECTION = "RANDOM_PROJECTION",
  /** Quantization */
  QUANTIZATION = "QUANTIZATION"
}

/**
 * Dimension reduction configuration
 */
export interface DimensionReductionConfig {
  /** Whether dimension reduction is enabled */
  enabled: boolean;
  /** Reduction method */
  method: DimensionReductionMethod;
  /** Target dimension */
  targetDimension: number;
  /** Original dimension */
  originalDimension: number;
  /** Minimum similarity threshold (0-1) */
  minSimilarityThreshold: number;
}/**
 * Caching configuration
 */
export interface CachingConfig {
  /** Whether caching is enabled */
  enabled: boolean;
  /** Cache time-to-live in milliseconds */
  ttlMs: number;
  /** Maximum cache size */
  maxCacheSize: number;
  /** Minimum similarity threshold for cache hits (0-1) */
  minSimilarityThreshold: number;
  /** Whether to use fuzzy matching for cache keys */
  useFuzzyMatching: boolean;
}

/**
 * Query optimization configuration
 */
export interface QueryOptimizationConfig {
  /** Whether query optimization is enabled */
  enabled: boolean;
  /** Maximum results to return */
  maxResults: number;
  /** Minimum similarity threshold (0-1) */
  minSimilarityThreshold: number;
  /** Whether to use filters to reduce search space */
  useFilters: boolean;
  /** Whether to use approximate nearest neighbor search */
  useApproximateSearch: boolean;
}

/**
 * Batching configuration
 */
export interface BatchingConfig {
  /** Whether batching is enabled */
  enabled: boolean;
  /** Maximum batch size */
  maxBatchSize: number;
  /** Maximum wait time in milliseconds */
  maxWaitTimeMs: number;
  /** Minimum batch size to trigger processing */
  minBatchSize: number;
}/**
 * Cost optimization configuration
 */
export interface CostOptimizationConfig {
  /** Dimension reduction configuration */
  dimensionReduction: DimensionReductionConfig;
  /** Caching configuration */
  caching: CachingConfig;
  /** Query optimization configuration */
  queryOptimization: QueryOptimizationConfig;
  /** Batching configuration */
  batching: BatchingConfig;
}

/**
 * Default cost optimization configuration
 */
export const DEFAULT_COST_OPTIMIZATION_CONFIG: CostOptimizationConfig = {
  dimensionReduction: {
    enabled: true,
    method: DimensionReductionMethod.TRUNCATED_SVD,
    targetDimension: 256,
    originalDimension: 768,
    minSimilarityThreshold: 0.9
  },
  caching: {
    enabled: true,
    ttlMs: 3600000, // 1 hour
    maxCacheSize: 1000,
    minSimilarityThreshold: 0.95,
    useFuzzyMatching: true
  },
  queryOptimization: {
    enabled: true,
    maxResults: 10,
    minSimilarityThreshold: 0.7,
    useFilters: true,
    useApproximateSearch: true
  },
  batching: {
    enabled: true,
    maxBatchSize: 10,
    maxWaitTimeMs: 100,
    minBatchSize: 2
  }
};/**
 * Cost optimization for Vertex AI integration
 */
export class CostOptimization {
  private logger: Logger;
  private db: FirebaseFirestore.Firestore;
  private config: CostOptimizationConfig;
  private cache: Map<string, {
    result: any;
    timestamp: number;
  }> = new Map();
  private pendingBatches: Map<string, {
    items: any[];
    timer: NodeJS.Timeout | null;
    callbacks: ((result: any) => void)[];
  }> = new Map();
  
  /**
   * Create a new cost optimization instance
   * @param logger Logger instance
   * @param config Cost optimization configuration
   */
  constructor(
    logger: Logger,
    config?: Partial<CostOptimizationConfig>
  ) {
    this.logger = logger.child("CostOptimization");
    this.db = admin.firestore();
    this.config = {
      ...DEFAULT_COST_OPTIMIZATION_CONFIG,
      ...config
    };
    
    this.logger.info("Cost optimization initialized", {
      dimensionReductionEnabled: this.config.dimensionReduction.enabled,
      cachingEnabled: this.config.caching.enabled,
      queryOptimizationEnabled: this.config.queryOptimization.enabled,
      batchingEnabled: this.config.batching.enabled
    });
  }  
  /**
   * Reduce embedding dimension
   * @param embedding Original embedding
   * @returns Reduced embedding
   */
  reduceEmbeddingDimension(embedding: number[]): number[] {
    if (!this.config.dimensionReduction.enabled) {
      return embedding;
    }
    
    try {
      const { targetDimension, method } = this.config.dimensionReduction;
      
      // If embedding is already at or below target dimension, return as is
      if (embedding.length <= targetDimension) {
        return embedding;
      }
      
      // Apply dimension reduction based on method
      switch (method) {
        case DimensionReductionMethod.TRUNCATED_SVD:
        case DimensionReductionMethod.PCA:
          // For these methods, we would normally use a pre-trained model
          // Since we don't have that here, we'll just truncate the vector
          return embedding.slice(0, targetDimension);
          
        case DimensionReductionMethod.RANDOM_PROJECTION:
          // Simple random projection
          return this.randomProjection(embedding, targetDimension);
          
        case DimensionReductionMethod.QUANTIZATION:
          // Simple scalar quantization
          return this.quantizeEmbedding(embedding, targetDimension);
          
        default:
          // Default to truncation
          return embedding.slice(0, targetDimension);
      }
    } catch (error) {
      this.logger.error("Failed to reduce embedding dimension", error as Error);
      return embedding;
    }
  }  
  /**
   * Random projection
   * @param embedding Original embedding
   * @param targetDimension Target dimension
   * @returns Projected embedding
   */
  private randomProjection(embedding: number[], targetDimension: number): number[] {
    // Create a random projection matrix
    const projectionMatrix: number[][] = [];
    
    for (let i = 0; i < targetDimension; i++) {
      const row: number[] = [];
      for (let j = 0; j < embedding.length; j++) {
        // Random values from normal distribution
        row.push((Math.random() * 2 - 1) / Math.sqrt(targetDimension));
      }
      projectionMatrix.push(row);
    }
    
    // Project the embedding
    const result: number[] = [];
    
    for (let i = 0; i < targetDimension; i++) {
      let sum = 0;
      for (let j = 0; j < embedding.length; j++) {
        sum += projectionMatrix[i][j] * embedding[j];
      }
      result.push(sum);
    }
    
    return result;
  }
  
  /**
   * Quantize embedding
   * @param embedding Original embedding
   * @param targetDimension Target dimension
   * @returns Quantized embedding
   */
  private quantizeEmbedding(embedding: number[], targetDimension: number): number[] {
    // Find min and max values
    const min = Math.min(...embedding);
    const max = Math.max(...embedding);    
    // Calculate bin size
    const range = max - min;
    const binSize = range / 255; // 8-bit quantization
    
    // Quantize values
    const quantized = embedding.map(value => 
      Math.round((value - min) / binSize)
    );
    
    // Downsample to target dimension
    const step = Math.ceil(quantized.length / targetDimension);
    const result: number[] = [];
    
    for (let i = 0; i < quantized.length && result.length < targetDimension; i += step) {
      result.push(quantized[i]);
    }
    
    return result;
  }
  
  /**
   * Get from cache
   * @param key Cache key
   * @returns Cached result or null if not found
   */
  getFromCache<T>(key: string): T | null {
    if (!this.config.caching.enabled) {
      return null;
    }
    
    try {
      // Check for exact match
      if (this.cache.has(key)) {
        const entry = this.cache.get(key)!;
        
        // Check if entry is expired
        if (Date.now() - entry.timestamp > this.config.caching.ttlMs) {
          this.cache.delete(key);
          return null;
        }
        
        return entry.result as T;
      }      
      // Check for fuzzy match if enabled
      if (this.config.caching.useFuzzyMatching) {
        for (const [cacheKey, entry] of this.cache.entries()) {
          // Check if entry is expired
          if (Date.now() - entry.timestamp > this.config.caching.ttlMs) {
            this.cache.delete(cacheKey);
            continue;
          }
          
          // Check similarity
          const similarity = this.calculateStringSimilarity(key, cacheKey);
          
          if (similarity >= this.config.caching.minSimilarityThreshold) {
            return entry.result as T;
          }
        }
      }
      
      return null;
    } catch (error) {
      this.logger.error("Failed to get from cache", error as Error);
      return null;
    }
  }
  
  /**
   * Add to cache
   * @param key Cache key
   * @param result Result to cache
   */
  addToCache<T>(key: string, result: T): void {
    if (!this.config.caching.enabled) {
      return;
    }
    
    try {
      // Add to cache
      this.cache.set(key, {
        result,
        timestamp: Date.now()
      });
      
      // Trim cache if it exceeds max size
      if (this.cache.size > this.config.caching.maxCacheSize) {
        this.trimCache();
      }
    } catch (error) {
      this.logger.error("Failed to add to cache", error as Error);
    }
  }  
  /**
   * Trim cache
   */
  private trimCache(): void {
    // Sort entries by timestamp (oldest first)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest entries until we're under max size
    const entriesToRemove = entries.slice(0, Math.ceil(this.config.caching.maxCacheSize * 0.2));
    
    for (const [key] of entriesToRemove) {
      this.cache.delete(key);
    }
  }
  
  /**
   * Calculate string similarity (Levenshtein distance)
   * @param str1 First string
   * @param str2 Second string
   * @returns Similarity (0-1)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    // Calculate Levenshtein distance
    const m = str1.length;
    const n = str2.length;
    
    // Create distance matrix
    const d: number[][] = [];
    
    for (let i = 0; i <= m; i++) {
      d[i] = [];
      d[i][0] = i;
    }
    
    for (let j = 0; j <= n; j++) {
      d[0][j] = j;
    }
    
    for (let j = 1; j <= n; j++) {
      for (let i = 1; i <= m; i++) {
        if (str1[i - 1] === str2[j - 1]) {
          d[i][j] = d[i - 1][j - 1];
        } else {
          d[i][j] = Math.min(
            d[i - 1][j] + 1,    // deletion
            d[i][j - 1] + 1,    // insertion
            d[i - 1][j - 1] + 1 // substitution
          );
        }
      }
    }    
    // Calculate similarity (0-1)
    const maxDistance = Math.max(m, n);
    return 1 - (d[m][n] / maxDistance);
  }
  
  /**
   * Optimize query
   * @param query Query to optimize
   * @param options Query options
   * @returns Optimized query and options
   */
  optimizeQuery(query: string, options: any): { query: string; options: any } {
    if (!this.config.queryOptimization.enabled) {
      return { query, options };
    }
    
    try {
      // Create optimized options
      const optimizedOptions = {
        ...options,
        maxResults: Math.min(
          options.maxResults || 100,
          this.config.queryOptimization.maxResults
        ),
        minSimilarityThreshold: Math.max(
          options.minSimilarityThreshold || 0,
          this.config.queryOptimization.minSimilarityThreshold
        )
      };
      
      // Add filters if enabled
      if (this.config.queryOptimization.useFilters && !options.filters) {
        // Extract potential filter terms from query
        const terms = query.split(' ')
          .filter(term => term.length > 3)
          .map(term => term.toLowerCase());
        
        if (terms.length > 0) {
          optimizedOptions.filters = {
            terms
          };
        }
      }      
      // Enable approximate search if configured
      if (this.config.queryOptimization.useApproximateSearch) {
        optimizedOptions.approximate = true;
      }
      
      return {
        query,
        options: optimizedOptions
      };
    } catch (error) {
      this.logger.error("Failed to optimize query", error as Error);
      return { query, options };
    }
  }
  
  /**
   * Batch operation
   * @param batchId Batch ID
   * @param item Item to add to batch
   * @param operation Operation to execute on batch
   * @returns Promise that resolves when the operation completes
   */
  async batchOperation<T, R>(
    batchId: string,
    item: T,
    operation: (items: T[]) => Promise<R[]>
  ): Promise<R> {
    if (!this.config.batching.enabled) {
      // Execute operation immediately if batching is disabled
      const result = await operation([item]);
      return result[0];
    }
    
    return new Promise<R>((resolve, reject) => {
      try {
        // Get or create batch
        if (!this.pendingBatches.has(batchId)) {
          this.pendingBatches.set(batchId, {
            items: [],
            timer: null,
            callbacks: []
          });
        }
        
        const batch = this.pendingBatches.get(batchId)!;        
        // Add item to batch
        batch.items.push(item);
        batch.callbacks.push(resolve);
        
        // Process batch if it reaches min size
        if (batch.items.length >= this.config.batching.minBatchSize) {
          this.processBatch(batchId, operation);
          return;
        }
        
        // Set timer to process batch after max wait time
        if (!batch.timer) {
          batch.timer = setTimeout(() => {
            this.processBatch(batchId, operation);
          }, this.config.batching.maxWaitTimeMs);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Process batch
   * @param batchId Batch ID
   * @param operation Operation to execute on batch
   */
  private async processBatch<T, R>(
    batchId: string,
    operation: (items: T[]) => Promise<R[]>
  ): Promise<void> {
    const batch = this.pendingBatches.get(batchId);
    
    if (!batch) {
      return;
    }
    
    // Clear timer
    if (batch.timer) {
      clearTimeout(batch.timer);
      batch.timer = null;
    }
    
    // Remove batch from pending batches
    this.pendingBatches.delete(batchId);
    
    try {
      // Execute operation
      const results = await operation(batch.items);
      
      // Resolve callbacks
      batch.callbacks.forEach((callback, index) => {
        callback(results[index]);
      });
    } catch (error) {
      // Reject all callbacks
      batch.callbacks.forEach(callback => {
        callback(null as any);
      });
      
      this.logger.error(`Failed to process batch: ${batchId}`, error as Error);
    }
  }
}