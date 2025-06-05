/**
 * Multi-Tier Cache Manager
 *
 * This service manages a multi-tier caching system for vector search results
 * with automatic cache warming, invalidation, and intelligent eviction policies.
 */

import { CacheConfig, CacheTierConfig } from './types';
import { Logger } from '../../utils/logger';

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  ttl: number; // Time-to-live in milliseconds for this specific entry
}

/**
 * Cache statistics
 */
interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

/**
 * Cache tier implementation
 */
abstract class CacheTier<T> {
  protected config: CacheTierConfig;
  protected logger: Logger;
  protected stats: CacheStats;

  constructor(config: CacheTierConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      maxSize: config.maxEntries,
      hitRate: 0
    };
  }

  abstract get(key: string): Promise<T | null>;
  abstract set(key: string, value: T, ttl?: number): Promise<void>;
  abstract delete(key: string): Promise<boolean>;
  abstract clear(): Promise<void>;
  abstract keys(): Promise<string[]>;

  getStats(): CacheStats {
    this.stats.hitRate = this.stats.hits + this.stats.misses > 0 
      ? this.stats.hits / (this.stats.hits + this.stats.misses) 
      : 0;
    return { ...this.stats };
  }

  protected updateStats(hit: boolean): void {
    if (hit) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
  }
}

/**
 * Memory cache tier
 */
class MemoryCacheTier<T> extends CacheTier<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.updateStats(false);
      return null;
    }

    // Check if expired using the entry's specific TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      await this.delete(key);
      this.updateStats(false);
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    this.updateStats(true);
    return entry.data;
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    const effectiveTtl = ttl || this.config.ttlMs;
    
    // Check size limit and evict if necessary
    if (this.cache.size >= this.config.maxEntries && !this.cache.has(key)) {
      await this.evictLeastRecentlyUsed();
    }

    // Clear existing timer if updating
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      size: this.estimateSize(value),
      ttl: effectiveTtl
    };

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, effectiveTtl);
    
    this.timers.set(key, timer);
  }

  async delete(key: string): Promise<boolean> {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }

    const deleted = this.cache.delete(key);
    this.stats.size = this.cache.size;
    
    if (deleted) {
      this.stats.evictions++;
    }
    
    return deleted;
  }

  async clear(): Promise<void> {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    this.timers.clear();
    this.cache.clear();
    this.stats.size = 0;
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  private async evictLeastRecentlyUsed(): Promise<void> {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      await this.delete(oldestKey);
    }
  }

  private estimateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate
    } catch {
      return 1000; // Default size estimate
    }
  }
}

/**
 * LocalStorage cache tier
 */
class LocalStorageCacheTier<T> extends CacheTier<T> {
  private keyPrefix: string;

  constructor(config: CacheTierConfig, logger: Logger, keyPrefix = 'rpg-scribe-cache-') {
    super(config, logger);
    this.keyPrefix = keyPrefix;
  }

  async get(key: string): Promise<T | null> {
    try {
      const stored = localStorage.getItem(this.keyPrefix + key);
      if (!stored) {
        this.updateStats(false);
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(stored);
      
      // Check if expired using the entry's specific TTL
      if (Date.now() - entry.timestamp > entry.ttl) {
        await this.delete(key);
        this.updateStats(false);
        return null;
      }

      // Update access metadata
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      localStorage.setItem(this.keyPrefix + key, JSON.stringify(entry));
      
      this.updateStats(true);
      return entry.data;
    } catch (error) {
      this.logger.warn('LocalStorage cache get error:', error);
      this.updateStats(false);
      return null;
    }
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const effectiveTtl = ttl || this.config.ttlMs;

      const entry: CacheEntry<T> = {
        data: value,
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now(),
        size: this.estimateSize(value),
        ttl: effectiveTtl
      };

      // Check size limit
      const currentKeys = await this.keys();
      if (currentKeys.length >= this.config.maxEntries && !currentKeys.includes(key)) {
        await this.evictLeastRecentlyUsed();
      }

      localStorage.setItem(this.keyPrefix + key, JSON.stringify(entry));
      this.stats.size = (await this.keys()).length;
    } catch (error) {
      this.logger.warn('LocalStorage cache set error:', error);
      // Handle quota exceeded error
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        await this.evictLeastRecentlyUsed();
        try {
          const effectiveTtl = ttl || this.config.ttlMs;
          localStorage.setItem(this.keyPrefix + key, JSON.stringify({
            data: value,
            timestamp: Date.now(),
            accessCount: 1,
            lastAccessed: Date.now(),
            size: this.estimateSize(value),
            ttl: effectiveTtl
          }));
        } catch {
          this.logger.error('Failed to set cache entry after eviction');
        }
      }
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const existed = localStorage.getItem(this.keyPrefix + key) !== null;
      localStorage.removeItem(this.keyPrefix + key);
      
      if (existed) {
        this.stats.evictions++;
        this.stats.size = (await this.keys()).length;
      }
      
      return existed;
    } catch (error) {
      this.logger.warn('LocalStorage cache delete error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.keys();
      for (const key of keys) {
        localStorage.removeItem(this.keyPrefix + key);
      }
      this.stats.size = 0;
    } catch (error) {
      this.logger.warn('LocalStorage cache clear error:', error);
    }
  }

  async keys(): Promise<string[]> {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          keys.push(key.substring(this.keyPrefix.length));
        }
      }
      return keys;
    } catch (error) {
      this.logger.warn('LocalStorage cache keys error:', error);
      return [];
    }
  }

  private async evictLeastRecentlyUsed(): Promise<void> {
    try {
      const keys = await this.keys();
      let oldestKey: string | null = null;
      let oldestTime = Date.now();

      for (const key of keys) {
        const stored = localStorage.getItem(this.keyPrefix + key);
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored);
          if (entry.lastAccessed < oldestTime) {
            oldestTime = entry.lastAccessed;
            oldestKey = key;
          }
        }
      }

      if (oldestKey) {
        await this.delete(oldestKey);
      }
    } catch (error) {
      this.logger.warn('LocalStorage cache eviction error:', error);
    }
  }

  private estimateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2;
    } catch {
      return 1000;
    }
  }
}

/**
 * Multi-Tier Cache Manager
 */
export class MultiTierCacheManager<T> {
  private tiers: Map<string, CacheTier<T>> = new Map();
  private config: CacheConfig;
  private logger: Logger;

  constructor(config: CacheConfig, logger?: Logger) {
    this.config = config;
    this.logger = logger || new Logger('MultiTierCacheManager');
    
    this.initializeTiers();
  }

  private initializeTiers(): void {
    // Initialize memory tier
    this.tiers.set('memory', new MemoryCacheTier(this.config.memory, this.logger));
    
    // Initialize localStorage tier
    this.tiers.set('localStorage', new LocalStorageCacheTier(this.config.localStorage, this.logger));
    
    this.logger.info('Multi-tier cache manager initialized', {
      tiers: Array.from(this.tiers.keys()),
      config: this.config
    });
  }

  /**
   * Get a value from the cache, checking tiers in order
   */
  async get(key: string): Promise<T | null> {
    // Check memory first (fastest)
    const memoryResult = await this.tiers.get('memory')?.get(key);
    if (memoryResult !== null && memoryResult !== undefined) {
      return memoryResult;
    }

    // Check localStorage
    const localStorageResult = await this.tiers.get('localStorage')?.get(key);
    if (localStorageResult !== null && localStorageResult !== undefined) {
      // Promote to memory cache
      await this.tiers.get('memory')?.set(key, localStorageResult);
      return localStorageResult;
    }

    return null;
  }

  /**
   * Set a value in all cache tiers
   */
  async set(key: string, value: T, ttl?: number): Promise<void> {
    const promises = Array.from(this.tiers.values()).map(tier => 
      tier.set(key, value, ttl).catch(error => 
        this.logger.warn('Cache tier set error:', error)
      )
    );

    await Promise.allSettled(promises);
  }

  /**
   * Delete a value from all cache tiers
   */
  async delete(key: string): Promise<boolean> {
    const promises = Array.from(this.tiers.values()).map(tier => tier.delete(key));
    const results = await Promise.allSettled(promises);
    
    return results.some(result => 
      result.status === 'fulfilled' && result.value === true
    );
  }

  /**
   * Clear all cache tiers
   */
  async clear(): Promise<void> {
    const promises = Array.from(this.tiers.values()).map(tier => tier.clear());
    await Promise.allSettled(promises);
  }

  /**
   * Get cache statistics for all tiers
   */
  getStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    
    for (const [name, tier] of this.tiers) {
      stats[name] = tier.getStats();
    }
    
    return stats;
  }

  /**
   * Get overall cache hit rate
   */
  getOverallHitRate(): number {
    const allStats = Object.values(this.getStats());
    const totalHits = allStats.reduce((sum, stats) => sum + stats.hits, 0);
    const totalRequests = allStats.reduce((sum, stats) => sum + stats.hits + stats.misses, 0);
    
    return totalRequests > 0 ? totalHits / totalRequests : 0;
  }

  /**
   * Warm the cache with frequently accessed data
   */
  async warmCache(data: Array<{ key: string; value: T }>): Promise<void> {
    this.logger.info(`Warming cache with ${data.length} entries`);
    
    const promises = data.map(({ key, value }) => this.set(key, value));
    await Promise.allSettled(promises);
    
    this.logger.info('Cache warming completed');
  }
}
