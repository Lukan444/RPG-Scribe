import { FirestoreService } from './firestore.service';
import {
  DocumentData,
  QueryConstraint,
  where,
  getDoc,
  DocumentSnapshot
} from 'firebase/firestore';

/**
 * Cache entry for count queries
 */
interface CountCacheEntry {
  count: number;
  timestamp: number;
  expiresAt: number;
}

/**
 * Options for count operations
 */
export interface CountOptions {
  /**
   * Whether to use the cache
   */
  useCache?: boolean;

  /**
   * Time to live for the cache entry in milliseconds
   */
  cacheTTL?: number;

  /**
   * Whether to force a server query
   */
  forceServer?: boolean;

  /**
   * Maximum number of retry attempts
   */
  maxRetries?: number;
}

/**
 * Enhanced FirestoreService with dynamic counting capabilities
 */
export class EnhancedFirestoreService<T extends DocumentData> extends FirestoreService<T> {
  // Cache for count queries
  private countCache: Map<string, CountCacheEntry> = new Map();

  // Default TTL for count cache (5 minutes)
  private defaultCountCacheTTL: number = 5 * 60 * 1000;

  // Threshold for count recalculation (default: 5)
  private countThreshold: number = 5;

  // Track changes since last count calculation
  private changesSinceLastCount: Map<string, number> = new Map();

  /**
   * Create a new EnhancedFirestoreService
   * @param collectionPath Path to the collection
   * @param options Service options
   */
  constructor(
    collectionPath: string,
    options: {
      cachingEnabled?: boolean;
      defaultCacheTTL?: number;
      transformer?: import('./firestore.service').DataTransformer<T>;
      validator?: import('./firestore.service').Validator<T>;
      defaultCountCacheTTL?: number;
      countThreshold?: number;
    } = {}
  ) {
    super(collectionPath, options);

    if (options.defaultCountCacheTTL !== undefined) {
      this.defaultCountCacheTTL = options.defaultCountCacheTTL;
    }

    if (options.countThreshold !== undefined) {
      this.countThreshold = options.countThreshold;
    }
  }

  /**
   * Set the default count cache TTL
   * @param ttl Time to live in milliseconds
   */
  setDefaultCountCacheTTL(ttl: number): void {
    this.defaultCountCacheTTL = ttl;
  }

  /**
   * Set the count threshold for recalculation
   * @param threshold Threshold value
   */
  setCountThreshold(threshold: number): void {
    this.countThreshold = threshold;
  }

  /**
   * Clear the count cache
   */
  clearCountCache(): void {
    this.countCache.clear();
    this.changesSinceLastCount.clear();
  }

  /**
   * Generate a cache key for a count query
   * @param queryName Name of the query
   * @param constraints Query constraints
   * @returns Cache key
   */
  private generateCountCacheKey(queryName: string, constraints: QueryConstraint[] = []): string {
    const constraintsStr = JSON.stringify(constraints);
    return `${this.collectionPath}:count:${queryName}:${constraintsStr}`;
  }

  /**
   * Get a cached count
   * @param key Cache key
   * @returns Cached count or null if not found or expired
   */
  private getCachedCount(key: string): number | null {
    const entry = this.countCache.get(key);

    if (!entry) {
      return null;
    }

    // Check if the entry has expired
    if (Date.now() > entry.expiresAt) {
      this.countCache.delete(key);
      return null;
    }

    return entry.count;
  }

  /**
   * Set a cached count
   * @param key Cache key
   * @param count Count value
   * @param ttl Time to live in milliseconds (optional, uses default if not provided)
   */
  private setCachedCount(key: string, count: number, ttl?: number): void {
    const now = Date.now();
    this.countCache.set(key, {
      count,
      timestamp: now,
      expiresAt: now + (ttl || this.defaultCountCacheTTL)
    });

    // Reset change counter for this key
    this.changesSinceLastCount.set(key, 0);
  }

  /**
   * Track a change for a count query
   * @param key Cache key
   */
  private trackChange(key: string): void {
    const currentCount = this.changesSinceLastCount.get(key) || 0;
    this.changesSinceLastCount.set(key, currentCount + 1);

    // If we've reached the threshold, invalidate the cache
    if (currentCount + 1 >= this.countThreshold) {
      this.countCache.delete(key);
      this.changesSinceLastCount.delete(key);
    }
  }

  /**
   * Track changes for all count queries
   */
  private trackChangeForAllCounts(): void {
    for (const key of this.countCache.keys()) {
      this.trackChange(key);
    }
  }

  /**
   * Override create method to track changes
   */
  async create(data: T, id?: string, options: any = {}): Promise<string> {
    const result = await super.create(data, id, options);
    this.trackChangeForAllCounts();
    return result;
  }

  /**
   * Override update method to track changes
   */
  async update(id: string, data: Partial<T>, options: any = {}): Promise<boolean> {
    const result = await super.update(id, data, options);
    this.trackChangeForAllCounts();
    return result;
  }

  /**
   * Override delete method to track changes
   */
  async delete(id: string, options: any = {}): Promise<boolean> {
    const result = await super.delete(id, options);
    this.trackChangeForAllCounts();
    return result;
  }

  /**
   * Get a document snapshot by ID
   * @param id Document ID
   * @returns Document snapshot
   */
  async getDocumentSnapshot(id: string): Promise<DocumentSnapshot<DocumentData>> {
    const docRef = this.getDocRef(id);
    const snapshot = await getDoc(docRef);
    return snapshot;
  }

  /**
   * Get the count of documents matching the constraints
   * @param queryName Name of the query for caching
   * @param constraints Query constraints
   * @param options Count options
   * @returns Count of matching documents
   */
  async getCount(
    queryName: string,
    constraints: QueryConstraint[] = [],
    options: CountOptions = {}
  ): Promise<number> {
    const {
      useCache = true,
      cacheTTL,
      forceServer = false,
      maxRetries = 3
    } = options;

    // Generate cache key
    const cacheKey = this.generateCountCacheKey(queryName, constraints);

    // Try to get from cache if enabled and not forcing server
    if (useCache && !forceServer) {
      const cachedCount = this.getCachedCount(cacheKey);
      if (cachedCount !== null) {
        return cachedCount;
      }
    }

    try {
      // Get count from server
      const count = await this.count(constraints);

      // Cache the result if caching is enabled
      if (useCache) {
        this.setCachedCount(cacheKey, count, cacheTTL);
      }

      return count;
    } catch (error) {
      console.error(`Error getting count for ${queryName}:`, error);
      return 0;
    }
  }
}
