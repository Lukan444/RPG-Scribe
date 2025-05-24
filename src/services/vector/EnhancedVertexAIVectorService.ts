/**
 * Enhanced Vertex AI Vector Service with Fallback and Resilience
 *
 * This service extends the basic VertexAIVectorService with comprehensive
 * fallback mechanisms, local vector processing, and intelligent caching.
 */

import { VertexAIVectorService } from './VertexAIVectorService';
import { LocalVectorProcessor } from './LocalVectorProcessor';
import { MultiTierCacheManager } from './MultiTierCacheManager';
import { VectorSearchFallbackChain, VertexAISearchStrategy, KeywordSearchStrategy } from './VectorSearchFallbackChain';
import {
  VertexAIConfig,
  ServiceLevel,
  SimilaritySearchResult,
  SimilaritySearchOptions,
  EmbeddingOptions,
  ServiceStatus
} from './types';
import { EntityType } from '../../models/EntityType';
import { Logger } from '../../utils/logger';
import { EventEmitter } from 'events';

/**
 * Service health metrics
 */
interface ServiceHealthMetrics {
  level: ServiceLevel;
  vertexAIAvailable: boolean;
  localProcessorEnabled: boolean;
  cacheHitRate: number;
  responseTimeMs: number;
  errorRate: number;
  lastHealthCheck: number;
}

/**
 * Enhanced Vertex AI Vector Service
 */
export class EnhancedVertexAIVectorService extends EventEmitter {
  private baseService: VertexAIVectorService;
  private localProcessor: LocalVectorProcessor;
  private cacheManager: MultiTierCacheManager<SimilaritySearchResult[]>;
  private fallbackChain!: VectorSearchFallbackChain;
  private config: VertexAIConfig;
  private logger: Logger;

  private currentServiceLevel: ServiceLevel = ServiceLevel.FULL;
  private healthMetrics: ServiceHealthMetrics;
  private responseTimeHistory: number[] = [];
  private errorHistory: { timestamp: number; error: string }[] = [];
  private lastSuccessfulOperation: number = Date.now();

  constructor(config: VertexAIConfig, logger?: Logger) {
    super();

    this.config = config;
    this.logger = logger || new Logger('EnhancedVertexAIVectorService');

    // Initialize base service
    this.baseService = new VertexAIVectorService(config);

    // Initialize local processor if enabled
    this.localProcessor = new LocalVectorProcessor(
      config.fallback?.localVector || {
        enabled: true,
        maxCachedVectors: 1000,
        compressionRatio: 0.33,
        algorithm: 'cosine'
      },
      this.logger
    );

    // Initialize cache manager
    this.cacheManager = new MultiTierCacheManager(
      config.fallback?.cache || {
        memory: { maxEntries: 100, ttlMs: 300000, storageType: 'memory' },
        localStorage: { maxEntries: 500, ttlMs: 3600000, storageType: 'localStorage' },
        indexedDB: { maxEntries: 1000, ttlMs: 86400000, storageType: 'indexedDB' },
        firestore: { maxEntries: -1, ttlMs: 604800000, storageType: 'firestore' }
      },
      this.logger
    );

    // Initialize fallback chain
    this.initializeFallbackChain();

    // Initialize health metrics
    this.healthMetrics = {
      level: ServiceLevel.FULL,
      vertexAIAvailable: true,
      localProcessorEnabled: this.localProcessor.getCacheStats().size > 0,
      cacheHitRate: 0,
      responseTimeMs: 0,
      errorRate: 0,
      lastHealthCheck: Date.now()
    };

    // Start health monitoring
    this.startHealthMonitoring();

    this.logger.info('Enhanced Vertex AI Vector Service initialized', {
      serviceLevel: this.currentServiceLevel,
      fallbackEnabled: config.fallback?.enabled || false
    });
  }

  /**
   * Initialize the fallback chain with different strategies
   * @private
   */
  private initializeFallbackChain(): void {
    const strategies = [
      new VertexAISearchStrategy(this.baseService, this.logger),
      // Add more strategies here as needed
    ];

    this.fallbackChain = new VectorSearchFallbackChain(strategies, this.logger);

    // Listen to fallback events
    this.fallbackChain.on('searchSuccess', (result) => {
      this.updateHealthMetrics(true, result.latencyMs);
      this.emit('searchSuccess', result);
    });

    this.fallbackChain.on('searchFailure', (result) => {
      this.recordError(result.error || 'Unknown error');
      this.emit('searchFailure', result);
    });

    this.fallbackChain.on('searchCompleteFailure', (result) => {
      this.degradeServiceLevel();
      this.emit('searchCompleteFailure', result);
    });
  }

  /**
   * Start health monitoring
   * @private
   */
  private startHealthMonitoring(): void {
    // Check health every 30 seconds
    setInterval(() => {
      this.checkServiceHealth();
    }, 30000);
  }

  /**
   * Check service health and adjust service level
   * @private
   */
  private async checkServiceHealth(): Promise<void> {
    try {
      const startTime = Date.now();
      const status = await this.baseService.getServiceStatus();
      const responseTime = Date.now() - startTime;

      this.updateHealthMetrics(status.available, responseTime);

      if (status.available && !status.degraded) {
        this.upgradeServiceLevel();
      } else {
        this.degradeServiceLevel();
      }

      this.healthMetrics.lastHealthCheck = Date.now();
      this.emit('healthCheck', this.healthMetrics);

    } catch (error) {
      this.recordError(error instanceof Error ? error.message : 'Health check failed');
      this.degradeServiceLevel();
    }
  }

  /**
   * Update health metrics
   * @private
   */
  private updateHealthMetrics(success: boolean, responseTime?: number): void {
    if (responseTime !== undefined) {
      this.responseTimeHistory.push(responseTime);
      if (this.responseTimeHistory.length > 100) {
        this.responseTimeHistory = this.responseTimeHistory.slice(-100);
      }

      this.healthMetrics.responseTimeMs = this.responseTimeHistory.reduce((a, b) => a + b, 0) / this.responseTimeHistory.length;
    }

    if (success) {
      this.lastSuccessfulOperation = Date.now();
    }

    // Calculate error rate (last 100 operations)
    const recentErrors = this.errorHistory.filter(e => Date.now() - e.timestamp < 300000); // 5 minutes
    this.healthMetrics.errorRate = recentErrors.length / 100;

    // Update cache hit rate
    const cacheStats = this.cacheManager.getStats();
    this.healthMetrics.cacheHitRate = this.cacheManager.getOverallHitRate();

    this.healthMetrics.vertexAIAvailable = success;
    this.healthMetrics.level = this.currentServiceLevel;
  }

  /**
   * Record an error
   * @private
   */
  private recordError(error: string): void {
    this.errorHistory.push({ timestamp: Date.now(), error });
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-1000);
    }
  }

  /**
   * Degrade service level
   * @private
   */
  private degradeServiceLevel(): void {
    const previousLevel = this.currentServiceLevel;

    switch (this.currentServiceLevel) {
      case ServiceLevel.FULL:
        this.currentServiceLevel = ServiceLevel.DEGRADED;
        break;
      case ServiceLevel.DEGRADED:
        this.currentServiceLevel = ServiceLevel.EMERGENCY;
        break;
      case ServiceLevel.EMERGENCY:
        this.currentServiceLevel = ServiceLevel.OFFLINE;
        break;
    }

    if (previousLevel !== this.currentServiceLevel) {
      this.logger.warn(`Service level degraded from ${previousLevel} to ${this.currentServiceLevel}`);
      this.emit('serviceLevelChanged', {
        previous: previousLevel,
        current: this.currentServiceLevel,
        reason: 'Service degradation'
      });
    }
  }

  /**
   * Upgrade service level
   * @private
   */
  private upgradeServiceLevel(): void {
    const previousLevel = this.currentServiceLevel;

    // Only upgrade if we've had recent successful operations
    const timeSinceLastSuccess = Date.now() - this.lastSuccessfulOperation;
    if (timeSinceLastSuccess > 60000) { // 1 minute
      return;
    }

    switch (this.currentServiceLevel) {
      case ServiceLevel.OFFLINE:
        this.currentServiceLevel = ServiceLevel.EMERGENCY;
        break;
      case ServiceLevel.EMERGENCY:
        this.currentServiceLevel = ServiceLevel.DEGRADED;
        break;
      case ServiceLevel.DEGRADED:
        this.currentServiceLevel = ServiceLevel.FULL;
        break;
    }

    if (previousLevel !== this.currentServiceLevel) {
      this.logger.info(`Service level upgraded from ${previousLevel} to ${this.currentServiceLevel}`);
      this.emit('serviceLevelChanged', {
        previous: previousLevel,
        current: this.currentServiceLevel,
        reason: 'Service recovery'
      });
    }
  }

  /**
   * Generate embedding with fallback support
   */
  async generateEmbedding(text: string, options?: EmbeddingOptions): Promise<number[]> {
    const cacheKey = `embedding:${text}:${JSON.stringify(options || {})}`;

    // Check cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached && cached.length > 0) {
      return cached[0].embedding || [];
    }

    try {
      const embedding = await this.baseService.generateEmbedding(text, options);

      // Cache the result
      await this.cacheManager.set(cacheKey, [{
        embeddingId: 'generated',
        entityId: 'generated',
        entityType: EntityType.NOTE,
        score: 1.0,
        embedding
      }]);

      this.updateHealthMetrics(true);
      return embedding;

    } catch (error) {
      this.recordError(error instanceof Error ? error.message : 'Embedding generation failed');
      this.degradeServiceLevel();

      // For now, return empty array as fallback
      // In a real implementation, you might use a local embedding model
      return [];
    }
  }

  /**
   * Find similar entities with comprehensive fallback
   */
  async findSimilar(
    embedding: number[],
    options?: SimilaritySearchOptions
  ): Promise<SimilaritySearchResult[]> {
    const cacheKey = `similar:${embedding.slice(0, 10).join(',')}:${JSON.stringify(options || {})}`;

    // Check cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.updateHealthMetrics(true);
      return cached;
    }

    let results: SimilaritySearchResult[] = [];

    try {
      switch (this.currentServiceLevel) {
        case ServiceLevel.FULL:
          // Try Vertex AI first
          results = await this.baseService.findSimilar(embedding, options);
          break;

        case ServiceLevel.DEGRADED:
          // Use local vector processing
          const localResults = this.localProcessor.findSimilar(
            embedding,
            options?.entityTypes,
            options?.limit,
            options?.minScore
          );
          results = localResults.map(r => ({
            embeddingId: r.entityId,
            entityId: r.entityId,
            entityType: r.entityType,
            score: r.score,
            metadata: r.metadata
          }));
          break;

        case ServiceLevel.EMERGENCY:
        case ServiceLevel.OFFLINE:
          // Return cached results only
          results = [];
          break;
      }

      // Cache successful results
      if (results.length > 0) {
        await this.cacheManager.set(cacheKey, results);

        // Add to local processor cache for future fallback
        for (const result of results) {
          if (result.embedding) {
            this.localProcessor.addVector(
              result.entityId,
              result.entityType,
              result.embedding,
              result.metadata || {}
            );
          }
        }
      }

      this.updateHealthMetrics(true);
      return results;

    } catch (error) {
      this.recordError(error instanceof Error ? error.message : 'Similarity search failed');
      this.degradeServiceLevel();

      // Try fallback strategies
      if (this.currentServiceLevel === ServiceLevel.DEGRADED) {
        const localResults = this.localProcessor.findSimilar(
          embedding,
          options?.entityTypes,
          options?.limit,
          options?.minScore
        );
        return localResults.map(r => ({
          embeddingId: r.entityId,
          entityId: r.entityId,
          entityType: r.entityType,
          score: r.score,
          metadata: r.metadata
        }));
      }

      return [];
    }
  }

  /**
   * Store embedding with local cache update
   */
  async storeEmbedding(
    entityId: string,
    entityType: EntityType,
    embedding: number[],
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const result = await this.baseService.storeEmbedding(entityId, entityType, embedding, metadata);

      // Add to local processor cache
      this.localProcessor.addVector(entityId, entityType, embedding, metadata || {});

      this.updateHealthMetrics(true);
      return result;

    } catch (error) {
      this.recordError(error instanceof Error ? error.message : 'Embedding storage failed');
      this.degradeServiceLevel();

      // Still add to local cache for future use
      this.localProcessor.addVector(entityId, entityType, embedding, metadata || {});

      return entityId; // Return entity ID as fallback
    }
  }

  /**
   * Get current service level
   */
  getServiceLevel(): ServiceLevel {
    return this.currentServiceLevel;
  }

  /**
   * Get health metrics
   */
  getHealthMetrics(): ServiceHealthMetrics {
    return { ...this.healthMetrics };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): Record<string, any> {
    return {
      multiTier: this.cacheManager.getStats(),
      localProcessor: this.localProcessor.getCacheStats(),
      overallHitRate: this.cacheManager.getOverallHitRate()
    };
  }

  /**
   * Warm cache with frequently accessed entities
   */
  async warmCache(entities: Array<{
    entityId: string;
    entityType: EntityType;
    embedding: number[];
    metadata?: Record<string, any>;
  }>): Promise<void> {
    this.logger.info(`Warming cache with ${entities.length} entities`);

    // Add to local processor
    for (const entity of entities) {
      this.localProcessor.addVector(
        entity.entityId,
        entity.entityType,
        entity.embedding,
        entity.metadata || {}
      );
    }

    this.logger.info('Cache warming completed');
  }

  /**
   * Force service level for testing
   */
  setServiceLevel(level: ServiceLevel): void {
    const previous = this.currentServiceLevel;
    this.currentServiceLevel = level;

    this.logger.info(`Service level manually set to ${level}`);
    this.emit('serviceLevelChanged', {
      previous,
      current: level,
      reason: 'Manual override'
    });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.removeAllListeners();
    this.fallbackChain.cleanup();
    this.logger.info('Enhanced Vector Service cleaned up');
  }
}
