/**
 * Vector Search Fallback Chain
 *
 * This class implements a chain of fallback strategies for vector search.
 * If one strategy fails, it tries the next one in the chain.
 */

import { SearchStrategy, SearchOptions, SearchResult } from './types';
import { Logger } from '../../utils/logger';
import { EventEmitter } from 'events';

/**
 * Fallback chain metrics
 */
export interface FallbackChainMetrics {
  /** Total number of searches */
  totalSearches: number;
  /** Number of successful searches */
  successfulSearches: number;
  /** Number of failed searches */
  failedSearches: number;
  /** Success rate by strategy */
  successRateByStrategy: Record<string, number>;
  /** Failure rate by strategy */
  failureRateByStrategy: Record<string, number>;
  /** Average latency by strategy (ms) */
  averageLatencyByStrategy: Record<string, number>;
  /** Fallback count by strategy */
  fallbackCountByStrategy: Record<string, number>;
  /** Average result count by strategy */
  averageResultCountByStrategy: Record<string, number>;
}

/**
 * Search result with metadata
 */
export interface SearchResultWithMetadata {
  /** Search results */
  results: SearchResult[];
  /** Strategy that produced the results */
  strategy: string;
  /** Whether the results are from a fallback strategy */
  isFallback: boolean;
  /** Search latency in milliseconds */
  latencyMs: number;
  /** Search timestamp */
  timestamp: number;
  /** Error if any */
  error?: string;
}

/**
 * Vector Search Fallback Chain
 */
export class VectorSearchFallbackChain extends EventEmitter {
  private strategies: SearchStrategy[];
  private logger: Logger;
  private metrics: {
    totalSearches: number;
    successfulSearches: number;
    failedSearches: number;
    searchesByStrategy: Record<string, number>;
    successesByStrategy: Record<string, number>;
    failuresByStrategy: Record<string, number>;
    latencyByStrategy: Record<string, number[]>;
    resultCountByStrategy: Record<string, number[]>;
    fallbackCountByStrategy: Record<string, number>;
  };
  private cache: Map<string, {
    results: SearchResult[];
    timestamp: number;
    strategy: string;
  }>;
  private cacheTtlMs: number;

  /**
   * Create a new Vector Search Fallback Chain
   * @param strategies Array of search strategies in order of preference
   * @param logger Logger instance
   * @param cacheTtlMs Cache time-to-live in milliseconds (default: 5 minutes)
   */
  constructor(
    strategies: SearchStrategy[],
    logger?: Logger,
    cacheTtlMs: number = 300000
  ) {
    super();
    this.strategies = strategies;
    this.logger = logger || new Logger('VectorSearchFallbackChain');
    this.cacheTtlMs = cacheTtlMs;
    this.cache = new Map();
    this.metrics = {
      totalSearches: 0,
      successfulSearches: 0,
      failedSearches: 0,
      searchesByStrategy: {},
      successesByStrategy: {},
      failuresByStrategy: {},
      latencyByStrategy: {},
      resultCountByStrategy: {},
      fallbackCountByStrategy: {}
    };

    // Initialize metrics for each strategy
    for (const strategy of strategies) {
      this.metrics.searchesByStrategy[strategy.name] = 0;
      this.metrics.successesByStrategy[strategy.name] = 0;
      this.metrics.failuresByStrategy[strategy.name] = 0;
      this.metrics.latencyByStrategy[strategy.name] = [];
      this.metrics.resultCountByStrategy[strategy.name] = [];
      this.metrics.fallbackCountByStrategy[strategy.name] = 0;
    }

    this.logger.info("VectorSearchFallbackChain initialized", {
      strategies: strategies.map(s => s.name),
      cacheTtlMs
    });
  }

  /**
   * Search for entities using the fallback chain
   * @param query Search query
   * @param options Search options
   * @returns Search results
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    this.metrics.totalSearches++;

    // Check cache first
    const cacheKey = this.getCacheKey(query, options);
    const cachedResult = this.getFromCache(cacheKey);

    if (cachedResult) {
      this.logger.debug(`Cache hit for query: ${query}`);
      return cachedResult.results;
    }

    // Try each strategy in order until one succeeds
    let lastError: Error | null = null;
    let isFallback = false;

    for (const strategy of this.strategies) {
      const strategyName = strategy.name;
      this.metrics.searchesByStrategy[strategyName]++;

      if (isFallback) {
        this.metrics.fallbackCountByStrategy[strategyName]++;
      }

      try {
        this.logger.debug(`Trying search strategy: ${strategyName}`, {
          query,
          options,
          isFallback
        });

        const startTime = Date.now();
        const results = await strategy.search(query, options);
        const latencyMs = Date.now() - startTime;

        // Update metrics
        this.metrics.successesByStrategy[strategyName]++;
        this.metrics.latencyByStrategy[strategyName].push(latencyMs);
        this.metrics.resultCountByStrategy[strategyName].push(results.length);
        this.metrics.successfulSearches++;

        this.logger.debug(`Strategy ${strategyName} succeeded with ${results.length} results in ${latencyMs}ms`);

        // Add to cache
        this.addToCache(cacheKey, results, strategyName);

        // Emit success event
        this.emit('searchSuccess', {
          results,
          strategy: strategyName,
          isFallback,
          latencyMs,
          timestamp: Date.now()
        } as SearchResultWithMetadata);

        return results;
      } catch (error) {
        // Update metrics
        this.metrics.failuresByStrategy[strategyName]++;

        // Log error and continue to next strategy
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`Strategy ${strategyName} failed:`, {
          error: lastError.message,
          query,
          options
        });

        // Emit failure event
        this.emit('searchFailure', {
          strategy: strategyName,
          error: lastError.message,
          query,
          options,
          timestamp: Date.now()
        });

        // Mark subsequent strategies as fallbacks
        isFallback = true;
      }
    }

    // If all strategies fail, log and return empty results
    this.metrics.failedSearches++;
    this.logger.error('All search strategies failed', {
      query,
      options,
      error: lastError?.message
    });

    // Emit complete failure event
    this.emit('searchCompleteFailure', {
      query,
      options,
      error: lastError?.message,
      timestamp: Date.now()
    });

    return [];
  }

  /**
   * Get a cache key for a query and options
   * @param query Search query
   * @param options Search options
   * @returns Cache key
   */
  private getCacheKey(query: string, options?: SearchOptions): string {
    return `${query}|${JSON.stringify(options || {})}`;
  }

  /**
   * Get a result from the cache
   * @param cacheKey Cache key
   * @returns Cached result or null if not found or expired
   */
  private getFromCache(cacheKey: string): {
    results: SearchResult[];
    timestamp: number;
    strategy: string;
  } | null {
    const cachedEntry = this.cache.get(cacheKey);

    if (!cachedEntry) {
      return null;
    }

    // Check if the entry is expired
    const now = Date.now();
    if (now - cachedEntry.timestamp > this.cacheTtlMs) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cachedEntry;
  }

  /**
   * Add a result to the cache
   * @param cacheKey Cache key
   * @param results Search results
   * @param strategy Strategy that produced the results
   */
  private addToCache(cacheKey: string, results: SearchResult[], strategy: string): void {
    this.cache.set(cacheKey, {
      results,
      timestamp: Date.now(),
      strategy
    });

    // Schedule cache entry for expiration
    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, this.cacheTtlMs);
  }

  /**
   * Get fallback chain metrics
   * @returns Fallback chain metrics
   */
  getMetrics(): FallbackChainMetrics {
    const successRateByStrategy: Record<string, number> = {};
    const failureRateByStrategy: Record<string, number> = {};
    const averageLatencyByStrategy: Record<string, number> = {};
    const averageResultCountByStrategy: Record<string, number> = {};

    for (const strategy of this.strategies) {
      const name = strategy.name;
      const searches = this.metrics.searchesByStrategy[name] || 1; // Avoid division by zero

      successRateByStrategy[name] = this.metrics.successesByStrategy[name] / searches;
      failureRateByStrategy[name] = this.metrics.failuresByStrategy[name] / searches;

      const latencies = this.metrics.latencyByStrategy[name] || [];
      averageLatencyByStrategy[name] = latencies.length > 0
        ? latencies.reduce((sum, val) => sum + val, 0) / latencies.length
        : 0;

      const resultCounts = this.metrics.resultCountByStrategy[name] || [];
      averageResultCountByStrategy[name] = resultCounts.length > 0
        ? resultCounts.reduce((sum, val) => sum + val, 0) / resultCounts.length
        : 0;
    }

    return {
      totalSearches: this.metrics.totalSearches,
      successfulSearches: this.metrics.successfulSearches,
      failedSearches: this.metrics.failedSearches,
      successRateByStrategy,
      failureRateByStrategy,
      averageLatencyByStrategy,
      fallbackCountByStrategy: { ...this.metrics.fallbackCountByStrategy },
      averageResultCountByStrategy
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalSearches: 0,
      successfulSearches: 0,
      failedSearches: 0,
      searchesByStrategy: {},
      successesByStrategy: {},
      failuresByStrategy: {},
      latencyByStrategy: {},
      resultCountByStrategy: {},
      fallbackCountByStrategy: {}
    };

    // Initialize metrics for each strategy
    for (const strategy of this.strategies) {
      this.metrics.searchesByStrategy[strategy.name] = 0;
      this.metrics.successesByStrategy[strategy.name] = 0;
      this.metrics.failuresByStrategy[strategy.name] = 0;
      this.metrics.latencyByStrategy[strategy.name] = [];
      this.metrics.resultCountByStrategy[strategy.name] = [];
      this.metrics.fallbackCountByStrategy[strategy.name] = 0;
    }

    this.logger.info("Fallback chain metrics reset");
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.info("Fallback chain cache cleared");
  }

  /**
   * Update cache TTL
   * @param ttlMs New cache TTL in milliseconds
   */
  updateCacheTtl(ttlMs: number): void {
    this.cacheTtlMs = ttlMs;
    this.logger.info("Cache TTL updated", { ttlMs });
  }

  /**
   * Add a strategy to the fallback chain
   * @param strategy Strategy to add
   * @param index Index to insert at (default: end of chain)
   */
  addStrategy(strategy: SearchStrategy, index?: number): void {
    if (index !== undefined) {
      this.strategies.splice(index, 0, strategy);
    } else {
      this.strategies.push(strategy);
    }

    // Initialize metrics for the new strategy
    this.metrics.searchesByStrategy[strategy.name] = 0;
    this.metrics.successesByStrategy[strategy.name] = 0;
    this.metrics.failuresByStrategy[strategy.name] = 0;
    this.metrics.latencyByStrategy[strategy.name] = [];
    this.metrics.resultCountByStrategy[strategy.name] = [];
    this.metrics.fallbackCountByStrategy[strategy.name] = 0;

    this.logger.info("Strategy added to fallback chain", {
      name: strategy.name,
      index: index !== undefined ? index : this.strategies.length - 1
    });
  }

  /**
   * Remove a strategy from the fallback chain
   * @param name Name of the strategy to remove
   * @returns True if the strategy was removed
   */
  removeStrategy(name: string): boolean {
    const index = this.strategies.findIndex(s => s.name === name);
    if (index === -1) {
      return false;
    }

    this.strategies.splice(index, 1);
    this.logger.info("Strategy removed from fallback chain", { name, index });
    return true;
  }

  /**
   * Get all strategies in the fallback chain
   * @returns Array of strategies
   */
  getStrategies(): SearchStrategy[] {
    return [...this.strategies];
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.cache.clear();
    this.removeAllListeners();
    this.logger.info("VectorSearchFallbackChain cleaned up");
  }
}

/**
 * Vertex AI Search Strategy
 *
 * This strategy uses Vertex AI Vector Search to find similar entities.
 */
export class VertexAISearchStrategy implements SearchStrategy {
  name = 'VertexAI';
  private vectorService: any; // Replace with actual VectorService type
  private logger: Logger;

  /**
   * Create a new Vertex AI Search Strategy
   * @param vectorService Vector service
   * @param logger Logger instance
   */
  constructor(vectorService: any, logger?: Logger) {
    this.vectorService = vectorService;
    this.logger = logger || new Logger('VertexAISearchStrategy');
  }

  /**
   * Search for entities using Vertex AI Vector Search
   * @param query Search query
   * @param options Search options
   * @returns Search results
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    try {
      this.logger.debug(`Executing Vertex AI search for: ${query}`, { options });

      // Use the vector service to find similar entities by text
      const results = await this.vectorService.findSimilarByText(query, options);

      // Convert to SearchResult format
      const formattedResults = results.map((result: any) => ({
        entityId: result.entityId,
        entityType: result.entityType,
        score: result.score,
        metadata: result.metadata
      }));

      this.logger.debug(`Vertex AI search returned ${formattedResults.length} results`);

      return formattedResults;
    } catch (error) {
      this.logger.error('Vertex AI search strategy failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Vertex AI search failed: ${errorMessage}`);
    }
  }
}

/**
 * Keyword Search Strategy
 *
 * This strategy uses keyword search in Firestore to find entities.
 */
export class KeywordSearchStrategy implements SearchStrategy {
  name = 'Keyword';
  private firestoreService: any; // Replace with actual FirestoreService type
  private logger: Logger;

  /**
   * Create a new Keyword Search Strategy
   * @param firestoreService Firestore service
   * @param logger Logger instance
   */
  constructor(firestoreService: any, logger?: Logger) {
    this.firestoreService = firestoreService;
    this.logger = logger || new Logger('KeywordSearchStrategy');
  }

  /**
   * Search for entities using keyword search
   * @param query Search query
   * @param options Search options
   * @returns Search results
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    try {
      this.logger.debug(`Executing keyword search for: ${query}`, { options });

      // Implement keyword search using Firestore
      // This is a simplified example
      const queryTerms = query.toLowerCase().split(' ');

      // Create a query for each term
      const queries = queryTerms.map(term => ({
        field: 'name',
        operator: '>=',
        value: term
      }));

      // Add entity type filter if specified
      if (options?.entityTypes?.length) {
        queries.push({
          field: 'type',
          operator: 'in',
          value: options.entityTypes.join(',')
        });
      }

      // Execute the query
      const results = await this.firestoreService.query(
        queries,
        options?.limit || 10
      );

      // Convert to SearchResult format
      const formattedResults = results.map((item: any) => ({
        entityId: item.id,
        entityType: item.type,
        score: this.calculateRelevanceScore(item, queryTerms),
        metadata: {}
      }));

      this.logger.debug(`Keyword search returned ${formattedResults.length} results`);

      return formattedResults;
    } catch (error) {
      this.logger.error('Keyword search strategy failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Keyword search failed: ${errorMessage}`);
    }
  }

  /**
   * Calculate a relevance score for an item based on query terms
   * @param item Item to calculate score for
   * @param queryTerms Query terms
   * @returns Relevance score (0-1)
   */
  private calculateRelevanceScore(item: any, queryTerms: string[]): number {
    // Simple scoring based on how many query terms appear in the name
    const name = item.name.toLowerCase();
    const matchingTerms = queryTerms.filter(term => name.includes(term));
    return matchingTerms.length / queryTerms.length;
  }
}

/**
 * Cache Search Strategy
 *
 * This strategy uses a cache of previous search results.
 */
export class CacheSearchStrategy implements SearchStrategy {
  name = 'Cache';
  private cache: Map<string, {
    results: SearchResult[];
    timestamp: number;
  }>;
  private ttlMs: number;
  private logger: Logger;
  private similarityThreshold: number;

  /**
   * Create a new Cache Search Strategy
   * @param ttlMs Time-to-live for cache entries in milliseconds (default: 1 hour)
   * @param similarityThreshold Threshold for query similarity (0-1, default: 0.7)
   * @param logger Logger instance
   */
  constructor(
    ttlMs: number = 3600000,
    similarityThreshold: number = 0.7,
    logger?: Logger
  ) {
    this.cache = new Map();
    this.ttlMs = ttlMs;
    this.similarityThreshold = similarityThreshold;
    this.logger = logger || new Logger('CacheSearchStrategy');
  }

  /**
   * Search for entities using the cache
   * @param query Search query
   * @param options Search options
   * @returns Search results
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    this.logger.debug(`Checking cache for: ${query}`, { options });

    // Try to find an exact match in cache
    const cacheKey = this.getCacheKey(query, options);

    if (this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey)!;

      // Check if the entry is expired
      const now = Date.now();
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(cacheKey);
      } else if (entry.results.length > 0) {
        this.logger.debug(`Cache hit for query: ${query}`);
        return entry.results;
      }
    }

    // Try to find a similar query in cache
    for (const [key, entry] of this.cache.entries()) {
      // Check if the entry is expired
      const now = Date.now();
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(key);
        continue;
      }

      // Check if the query is similar
      if (this.isSimilarQuery(query, key) && entry.results.length > 0) {
        this.logger.debug(`Similar cache hit for query: ${query} (using ${key})`);
        return entry.results;
      }
    }

    this.logger.debug(`Cache miss for query: ${query}`);
    throw new Error('Cache miss');
  }

  /**
   * Add search results to the cache
   * @param query Search query
   * @param options Search options
   * @param results Search results
   */
  addToCache(query: string, options: SearchOptions | undefined, results: SearchResult[]): void {
    const cacheKey = this.getCacheKey(query, options);
    this.cache.set(cacheKey, {
      results,
      timestamp: Date.now()
    });

    // Schedule cache entry for expiration
    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, this.ttlMs);

    this.logger.debug(`Added to cache: ${query} (${results.length} results)`);
  }

  /**
   * Get a cache key for a query and options
   * @param query Search query
   * @param options Search options
   * @returns Cache key
   */
  private getCacheKey(query: string, options?: SearchOptions): string {
    return `${query}|${JSON.stringify(options || {})}`;
  }

  /**
   * Check if two queries are similar
   * @param query1 First query
   * @param query2 Second query
   * @returns True if the queries are similar
   */
  private isSimilarQuery(query1: string, query2: string): boolean {
    // Extract just the query part from the cache key
    const q1 = query1.split('|')[0].toLowerCase();
    const q2 = query2.split('|')[0].toLowerCase();

    // If one query is a substring of the other, they are similar
    if (q1.includes(q2) || q2.includes(q1)) {
      return true;
    }

    // Calculate Jaccard similarity between the queries
    const words1 = new Set(q1.split(' '));
    const words2 = new Set(q2.split(' '));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    const similarity = intersection.size / union.size;

    return similarity >= this.similarityThreshold;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.info("Cache cleared");
  }

  /**
   * Update cache TTL
   * @param ttlMs New cache TTL in milliseconds
   */
  updateTtl(ttlMs: number): void {
    this.ttlMs = ttlMs;
    this.logger.info("Cache TTL updated", { ttlMs });
  }

  /**
   * Update similarity threshold
   * @param threshold New similarity threshold (0-1)
   */
  updateSimilarityThreshold(threshold: number): void {
    this.similarityThreshold = Math.max(0, Math.min(1, threshold));
    this.logger.info("Similarity threshold updated", { threshold: this.similarityThreshold });
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getCacheStats(): {
    size: number;
    averageResultsPerEntry: number;
    oldestEntryAgeMs: number;
    newestEntryAgeMs: number;
  } {
    const now = Date.now();
    let totalResults = 0;
    let oldestTimestamp = now;
    let newestTimestamp = 0;

    for (const entry of this.cache.values()) {
      totalResults += entry.results.length;
      oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp);
      newestTimestamp = Math.max(newestTimestamp, entry.timestamp);
    }

    return {
      size: this.cache.size,
      averageResultsPerEntry: this.cache.size > 0 ? totalResults / this.cache.size : 0,
      oldestEntryAgeMs: this.cache.size > 0 ? now - oldestTimestamp : 0,
      newestEntryAgeMs: this.cache.size > 0 ? now - newestTimestamp : 0
    };
  }
}