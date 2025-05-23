/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Service for caching data
 */
export class CachingService {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number; // Time to live in milliseconds

  /**
   * Create a new CachingService
   * @param defaultTTL Default time to live in milliseconds (default: 5 minutes)
   */
  constructor(defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map<string, CacheEntry<any>>();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Set a cache entry
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (optional)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const timestamp = Date.now();
    const expiresAt = timestamp + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp,
      expiresAt
    });
  }

  /**
   * Get a cache entry
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if a cache entry exists and is not expired
   * @param key Cache key
   * @returns True if entry exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a cache entry
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired cache entries
   */
  clearExpired(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size
   * @returns Number of cache entries
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get all cache keys
   * @returns Array of cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get or set cache entry
   * @param key Cache key
   * @param fetchFn Function to fetch data if not in cache
   * @param ttl Time to live in milliseconds (optional)
   * @returns Cached or fetched data
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check if data is in cache
    const cachedData = this.get<T>(key);

    if (cachedData !== null) {
      return cachedData;
    }

    // Fetch data
    const data = await fetchFn();

    // Cache data
    this.set(key, data, ttl);

    return data;
  }

  /**
   * Invalidate cache entries by prefix
   * @param prefix Cache key prefix
   */
  invalidateByPrefix(prefix: string): void {
    const keysToDelete: string[] = [];

    // First collect all keys to delete
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }

    // Then delete them
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * Invalidate cache entries by predicate
   * @param predicate Predicate function
   */
  invalidateByPredicate(predicate: (key: string, entry: CacheEntry<any>) => boolean): void {
    const keysToDelete: string[] = [];

    // First collect all keys to delete
    for (const [key, entry] of this.cache.entries()) {
      if (predicate(key, entry)) {
        keysToDelete.push(key);
      }
    }

    // Then delete them
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }
}
