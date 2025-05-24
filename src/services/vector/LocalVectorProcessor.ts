/**
 * Local Vector Processor
 *
 * This service provides client-side vector similarity calculations
 * for offline operations and fallback scenarios when Vertex AI is unavailable.
 */

import { EntityType } from '../../models/EntityType';
import { LocalVectorOptions, SimilaritySearchResult } from './types';
import { Logger } from '../../utils/logger';

/**
 * Cached vector entry
 */
interface CachedVector {
  entityId: string;
  entityType: EntityType;
  vector: number[];
  compressedVector: number[];
  metadata: Record<string, any>;
  timestamp: number;
}

/**
 * Vector similarity calculation result
 */
interface SimilarityResult {
  entityId: string;
  entityType: EntityType;
  score: number;
  metadata: Record<string, any>;
}

/**
 * Local Vector Processor
 */
export class LocalVectorProcessor {
  private options: LocalVectorOptions;
  private logger: Logger;
  private vectorCache: Map<string, CachedVector> = new Map();
  private compressionMatrix: number[][] | null = null;

  /**
   * Create a new Local Vector Processor
   * @param options Local vector processing options
   * @param logger Logger instance
   */
  constructor(options: LocalVectorOptions, logger?: Logger) {
    this.options = options;
    this.logger = logger || new Logger('LocalVectorProcessor');
    
    if (this.options.enabled) {
      this.initializeCompression();
    }
  }

  /**
   * Initialize vector compression matrix
   * @private
   */
  private initializeCompression(): void {
    if (this.options.compressionRatio >= 1) {
      return; // No compression needed
    }

    const originalDim = 768; // Standard embedding dimension
    const compressedDim = Math.floor(originalDim * this.options.compressionRatio);
    
    // Create random projection matrix for dimensionality reduction
    this.compressionMatrix = Array(compressedDim).fill(0).map(() =>
      Array(originalDim).fill(0).map(() => (Math.random() - 0.5) * 2)
    );

    this.logger.info('Vector compression initialized', {
      originalDim,
      compressedDim,
      compressionRatio: this.options.compressionRatio
    });
  }

  /**
   * Compress a vector using random projection
   * @param vector Original vector
   * @returns Compressed vector
   * @private
   */
  private compressVector(vector: number[]): number[] {
    if (!this.compressionMatrix || this.options.compressionRatio >= 1) {
      return vector;
    }

    return this.compressionMatrix.map(row =>
      row.reduce((sum, weight, i) => sum + weight * (vector[i] || 0), 0)
    );
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param a First vector
   * @param b Second vector
   * @returns Cosine similarity score (0-1)
   * @private
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }
    
    return Math.max(0, Math.min(1, (dotProduct / (magnitudeA * magnitudeB) + 1) / 2));
  }

  /**
   * Calculate dot product similarity between two vectors
   * @param a First vector
   * @param b Second vector
   * @returns Dot product similarity score
   * @private
   */
  private dotProductSimilarity(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
  }

  /**
   * Calculate Euclidean distance similarity between two vectors
   * @param a First vector
   * @param b Second vector
   * @returns Euclidean similarity score (0-1)
   * @private
   */
  private euclideanSimilarity(a: number[], b: number[]): number {
    const distance = Math.sqrt(
      a.reduce((sum, val, i) => sum + Math.pow(val - (b[i] || 0), 2), 0)
    );
    // Convert distance to similarity (closer = higher score)
    return 1 / (1 + distance);
  }

  /**
   * Calculate similarity between two vectors using the configured algorithm
   * @param a First vector
   * @param b Second vector
   * @returns Similarity score
   * @private
   */
  private calculateSimilarity(a: number[], b: number[]): number {
    switch (this.options.algorithm) {
      case 'cosine':
        return this.cosineSimilarity(a, b);
      case 'dotProduct':
        return this.dotProductSimilarity(a, b);
      case 'euclidean':
        return this.euclideanSimilarity(a, b);
      default:
        return this.cosineSimilarity(a, b);
    }
  }

  /**
   * Add a vector to the local cache
   * @param entityId Entity ID
   * @param entityType Entity type
   * @param vector Vector to cache
   * @param metadata Entity metadata
   */
  addVector(
    entityId: string,
    entityType: EntityType,
    vector: number[],
    metadata: Record<string, any> = {}
  ): void {
    if (!this.options.enabled) {
      return;
    }

    // Check cache size limit
    if (this.vectorCache.size >= this.options.maxCachedVectors) {
      // Remove oldest entry
      const oldestKey = Array.from(this.vectorCache.keys())[0];
      this.vectorCache.delete(oldestKey);
    }

    const compressedVector = this.compressVector(vector);
    
    this.vectorCache.set(entityId, {
      entityId,
      entityType,
      vector,
      compressedVector,
      metadata,
      timestamp: Date.now()
    });

    this.logger.debug(`Added vector to local cache: ${entityId}`, {
      entityType,
      originalDim: vector.length,
      compressedDim: compressedVector.length,
      cacheSize: this.vectorCache.size
    });
  }

  /**
   * Remove a vector from the local cache
   * @param entityId Entity ID to remove
   */
  removeVector(entityId: string): void {
    const removed = this.vectorCache.delete(entityId);
    if (removed) {
      this.logger.debug(`Removed vector from local cache: ${entityId}`);
    }
  }

  /**
   * Find similar vectors using local similarity calculations
   * @param queryVector Query vector
   * @param entityTypes Entity types to filter by
   * @param limit Maximum number of results
   * @param minScore Minimum similarity score
   * @returns Array of similarity results
   */
  findSimilar(
    queryVector: number[],
    entityTypes?: EntityType[],
    limit: number = 10,
    minScore: number = 0.0
  ): SimilarityResult[] {
    if (!this.options.enabled || this.vectorCache.size === 0) {
      return [];
    }

    const compressedQuery = this.compressVector(queryVector);
    const results: SimilarityResult[] = [];

    // Calculate similarity with all cached vectors
    for (const cached of this.vectorCache.values()) {
      // Filter by entity type if specified
      if (entityTypes && !entityTypes.includes(cached.entityType)) {
        continue;
      }

      // Use compressed vectors for faster calculation
      const vectorToCompare = this.options.compressionRatio < 1 
        ? cached.compressedVector 
        : cached.vector;
      const queryToCompare = this.options.compressionRatio < 1 
        ? compressedQuery 
        : queryVector;

      const score = this.calculateSimilarity(queryToCompare, vectorToCompare);

      if (score >= minScore) {
        results.push({
          entityId: cached.entityId,
          entityType: cached.entityType,
          score,
          metadata: cached.metadata
        });
      }
    }

    // Sort by similarity score (descending) and limit results
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    compressionEnabled: boolean;
    algorithm: string;
    memoryUsageEstimate: number;
  } {
    const avgVectorSize = 768 * 4; // 4 bytes per float
    const avgCompressedSize = Math.floor(768 * this.options.compressionRatio) * 4;
    const memoryUsageEstimate = this.vectorCache.size * (avgVectorSize + avgCompressedSize + 200); // +200 for metadata

    return {
      size: this.vectorCache.size,
      maxSize: this.options.maxCachedVectors,
      compressionEnabled: this.options.compressionRatio < 1,
      algorithm: this.options.algorithm,
      memoryUsageEstimate
    };
  }

  /**
   * Clear the vector cache
   */
  clearCache(): void {
    this.vectorCache.clear();
    this.logger.info('Local vector cache cleared');
  }

  /**
   * Update processing options
   * @param options New options
   */
  updateOptions(options: Partial<LocalVectorOptions>): void {
    this.options = { ...this.options, ...options };
    
    if (options.compressionRatio !== undefined) {
      this.initializeCompression();
    }

    this.logger.info('Local vector processor options updated', this.options);
  }

  /**
   * Export cached vectors for backup
   * @returns Serialized cache data
   */
  exportCache(): string {
    const cacheData = Array.from(this.vectorCache.entries()).map(([key, value]) => ({
      key,
      value: {
        ...value,
        vector: Array.from(value.vector),
        compressedVector: Array.from(value.compressedVector)
      }
    }));

    return JSON.stringify(cacheData);
  }

  /**
   * Import cached vectors from backup
   * @param data Serialized cache data
   */
  importCache(data: string): void {
    try {
      const cacheData = JSON.parse(data);
      this.vectorCache.clear();

      for (const { key, value } of cacheData) {
        this.vectorCache.set(key, {
          ...value,
          vector: new Float32Array(value.vector),
          compressedVector: new Float32Array(value.compressedVector)
        });
      }

      this.logger.info(`Imported ${this.vectorCache.size} vectors to local cache`);
    } catch (error) {
      this.logger.error('Failed to import cache data:', error);
      throw new Error('Invalid cache data format');
    }
  }
}
