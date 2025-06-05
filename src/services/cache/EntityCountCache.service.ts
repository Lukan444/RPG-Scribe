/**
 * EntityCountCache Service
 * 
 * Provides intelligent multi-tier caching for entity counts and recent entities
 * to optimize performance and reduce database queries.
 */

import { EntityType } from '../../models/EntityType';

// Cache configuration
const CACHE_CONFIG = {
  MEMORY_TTL: 5 * 60 * 1000, // 5 minutes
  LOCALSTORAGE_TTL: 60 * 60 * 1000, // 1 hour
  FIRESTORE_TTL: 24 * 60 * 60 * 1000, // 24 hours
  MAX_MEMORY_ENTRIES: 100,
  MAX_LOCALSTORAGE_ENTRIES: 500,
  BATCH_SIZE: 10,
  PERFORMANCE_BUDGET_MS: 500
};

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

// Entity count data interface
export interface EntityCountData {
  counts: Record<string, number>;
  recentEntities: Record<string, any[]>;
  lastUpdated: Date;
  worldId?: string;
  campaignId?: string;
}

// Cache key interface
interface CacheKey {
  type: 'world' | 'campaign';
  id: string;
  entityType?: EntityType;
}

/**
 * Multi-tier caching service for entity counts
 */
export class EntityCountCacheService {
  private static instance: EntityCountCacheService;
  private memoryCache = new Map<string, CacheEntry<EntityCountData>>();
  private batchQueue = new Map<string, Promise<EntityCountData>>();
  private performanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    queryTime: 0,
    batchedQueries: 0
  };

  private constructor() {
    // Initialize cache cleanup interval
    setInterval(() => this.cleanupExpiredEntries(), 60000); // Every minute
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EntityCountCacheService {
    if (!EntityCountCacheService.instance) {
      EntityCountCacheService.instance = new EntityCountCacheService();
    }
    return EntityCountCacheService.instance;
  }

  /**
   * Generate cache key from parameters
   */
  private generateCacheKey(key: CacheKey): string {
    const parts = [key.type, key.id];
    if (key.entityType) {
      parts.push(key.entityType);
    }
    return parts.join(':');
  }

  /**
   * Get entity count data from cache (memory -> localStorage -> Firestore)
   */
  async getCachedEntityCounts(
    type: 'world' | 'campaign',
    id: string,
    entityType?: EntityType
  ): Promise<EntityCountData | null> {
    const cacheKey = this.generateCacheKey({ type, id, entityType });
    const startTime = performance.now();

    try {
      // 1. Check memory cache first
      const memoryEntry = this.memoryCache.get(cacheKey);
      if (memoryEntry && this.isEntryValid(memoryEntry)) {
        memoryEntry.accessCount++;
        memoryEntry.lastAccessed = Date.now();
        this.performanceMetrics.cacheHits++;
        console.debug(`Cache HIT (memory): ${cacheKey}`);
        return memoryEntry.data;
      }

      // 2. Check localStorage cache
      const localStorageData = this.getFromLocalStorage(cacheKey);
      if (localStorageData) {
        // Promote to memory cache
        this.setMemoryCache(cacheKey, localStorageData);
        this.performanceMetrics.cacheHits++;
        console.debug(`Cache HIT (localStorage): ${cacheKey}`);
        return localStorageData;
      }

      // 3. Check Firestore cache (future implementation)
      // const firestoreData = await this.getFromFirestoreCache(cacheKey);
      // if (firestoreData) {
      //   this.setMemoryCache(cacheKey, firestoreData);
      //   this.setLocalStorageCache(cacheKey, firestoreData);
      //   return firestoreData;
      // }

      this.performanceMetrics.cacheMisses++;
      console.debug(`Cache MISS: ${cacheKey}`);
      return null;
    } finally {
      this.performanceMetrics.queryTime += performance.now() - startTime;
    }
  }

  /**
   * Set entity count data in all cache tiers
   */
  setCachedEntityCounts(
    type: 'world' | 'campaign',
    id: string,
    data: EntityCountData,
    entityType?: EntityType
  ): void {
    const cacheKey = this.generateCacheKey({ type, id, entityType });
    
    // Set in memory cache
    this.setMemoryCache(cacheKey, data);
    
    // Set in localStorage cache
    this.setLocalStorageCache(cacheKey, data);
    
    // Future: Set in Firestore cache
    // this.setFirestoreCache(cacheKey, data);
    
    console.debug(`Cache SET: ${cacheKey}`);
  }

  /**
   * Set memory cache entry
   */
  private setMemoryCache(key: string, data: EntityCountData): void {
    // Cleanup if cache is full
    if (this.memoryCache.size >= CACHE_CONFIG.MAX_MEMORY_ENTRIES) {
      this.evictLeastRecentlyUsed();
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: CACHE_CONFIG.MEMORY_TTL,
      accessCount: 1,
      lastAccessed: Date.now()
    });
  }

  /**
   * Get from localStorage cache
   */
  private getFromLocalStorage(key: string): EntityCountData | null {
    try {
      const stored = localStorage.getItem(`entityCache:${key}`);
      if (!stored) return null;

      const entry: CacheEntry<EntityCountData> = JSON.parse(stored);
      if (!this.isEntryValid(entry)) {
        localStorage.removeItem(`entityCache:${key}`);
        return null;
      }

      // Convert date strings back to Date objects
      entry.data.lastUpdated = new Date(entry.data.lastUpdated);
      entry.data.recentEntities = Object.fromEntries(
        Object.entries(entry.data.recentEntities).map(([entityType, entities]) => [
          entityType,
          entities.map(entity => ({
            ...entity,
            createdAt: entity.createdAt ? new Date(entity.createdAt) : null
          }))
        ])
      );

      return entry.data;
    } catch (error) {
      console.error('Error reading from localStorage cache:', error);
      return null;
    }
  }

  /**
   * Set localStorage cache entry
   */
  private setLocalStorageCache(key: string, data: EntityCountData): void {
    try {
      const entry: CacheEntry<EntityCountData> = {
        data,
        timestamp: Date.now(),
        ttl: CACHE_CONFIG.LOCALSTORAGE_TTL,
        accessCount: 1,
        lastAccessed: Date.now()
      };

      localStorage.setItem(`entityCache:${key}`, JSON.stringify(entry));
      
      // Cleanup old entries if needed
      this.cleanupLocalStorageCache();
    } catch (error) {
      console.error('Error writing to localStorage cache:', error);
    }
  }

  /**
   * Check if cache entry is valid
   */
  private isEntryValid(entry: CacheEntry<EntityCountData>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Evict least recently used entries from memory cache
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      console.debug(`Evicted from memory cache: ${oldestKey}`);
    }
  }

  /**
   * Cleanup expired entries from memory cache
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.memoryCache.delete(key);
      console.debug(`Expired from memory cache: ${key}`);
    });
  }

  /**
   * Cleanup localStorage cache
   */
  private cleanupLocalStorageCache(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('entityCache:'));
      
      if (keys.length > CACHE_CONFIG.MAX_LOCALSTORAGE_ENTRIES) {
        // Remove oldest entries
        const entries = keys.map(key => {
          const stored = localStorage.getItem(key);
          if (!stored) return null;
          
          try {
            const entry = JSON.parse(stored);
            return { key, timestamp: entry.timestamp };
          } catch {
            return null;
          }
        }).filter(Boolean);

        entries.sort((a, b) => a!.timestamp - b!.timestamp);
        
        const toRemove = entries.slice(0, keys.length - CACHE_CONFIG.MAX_LOCALSTORAGE_ENTRIES);
        toRemove.forEach(entry => {
          if (entry) {
            localStorage.removeItem(entry.key);
          }
        });
      }
    } catch (error) {
      console.error('Error cleaning up localStorage cache:', error);
    }
  }

  /**
   * Invalidate cache entries for specific entity type
   */
  invalidateEntityType(entityType: EntityType, worldId?: string, campaignId?: string): void {
    const keysToInvalidate: string[] = [];

    // Find keys to invalidate in memory cache
    for (const key of this.memoryCache.keys()) {
      if (this.shouldInvalidateKey(key, entityType, worldId, campaignId)) {
        keysToInvalidate.push(key);
      }
    }

    // Remove from memory cache
    keysToInvalidate.forEach(key => {
      this.memoryCache.delete(key);
      console.debug(`Invalidated memory cache: ${key}`);
    });

    // Remove from localStorage cache
    try {
      const localStorageKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('entityCache:') && 
        this.shouldInvalidateKey(key.replace('entityCache:', ''), entityType, worldId, campaignId)
      );
      
      localStorageKeys.forEach(key => {
        localStorage.removeItem(key);
        console.debug(`Invalidated localStorage cache: ${key}`);
      });
    } catch (error) {
      console.error('Error invalidating localStorage cache:', error);
    }
  }

  /**
   * Check if cache key should be invalidated
   */
  private shouldInvalidateKey(
    key: string, 
    entityType: EntityType, 
    worldId?: string, 
    campaignId?: string
  ): boolean {
    const parts = key.split(':');
    
    // If specific world/campaign provided, only invalidate matching entries
    if (worldId && parts[1] !== worldId) return false;
    if (campaignId && parts[0] === 'campaign' && parts[1] !== campaignId) return false;
    
    // Invalidate all entity count caches when any entity changes
    return true;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const totalRequests = this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.performanceMetrics.cacheHits / totalRequests) * 100 : 0;
    
    return {
      ...this.performanceMetrics,
      hitRate: Math.round(hitRate * 100) / 100,
      averageQueryTime: totalRequests > 0 ? this.performanceMetrics.queryTime / totalRequests : 0,
      memoryCacheSize: this.memoryCache.size
    };
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.memoryCache.clear();
    
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('entityCache:'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing localStorage cache:', error);
    }
    
    console.log('All caches cleared');
  }
}

// Export singleton instance
export const entityCountCache = EntityCountCacheService.getInstance();
