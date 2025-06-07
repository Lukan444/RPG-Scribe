/**
 * Transcription Cache Service
 * 
 * Handles offline caching and retry queue for transcription operations
 * Ensures data persistence during network interruptions
 */

import { TranscriptionSegment, SessionTranscription } from '../../models/Transcription';

/**
 * Cache entry types
 */
export enum CacheEntryType {
  TRANSCRIPTION = 'transcription',
  SEGMENT = 'segment',
  AUDIO_CHUNK = 'audio_chunk',
  SESSION_DATA = 'session_data'
}

/**
 * Cache entry structure
 */
export interface CacheEntry {
  id: string;
  type: CacheEntryType;
  timestamp: number;
  data: any;
  retryCount: number;
  maxRetries: number;
  priority: number; // Higher number = higher priority
  expiresAt?: number;
}

/**
 * Retry queue item
 */
export interface RetryQueueItem extends CacheEntry {
  operation: 'create' | 'update' | 'upload';
  targetId?: string;
  lastAttempt?: number;
  nextRetry?: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxCacheSize: number; // Maximum number of entries
  maxRetries: number;
  retryDelay: number; // Base retry delay in ms
  maxRetryDelay: number; // Maximum retry delay in ms
  cacheExpiration: number; // Cache expiration in ms
  compressionEnabled: boolean;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  totalEntries: number;
  pendingRetries: number;
  cacheSize: number; // In bytes
  hitRate: number;
  missRate: number;
  oldestEntry?: number;
  newestEntry?: number;
}

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: CacheConfig = {
  maxCacheSize: 1000,
  maxRetries: 5,
  retryDelay: 1000,
  maxRetryDelay: 30000,
  cacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
  compressionEnabled: true
};

/**
 * Transcription Cache Service
 */
export class TranscriptionCacheService {
  private config: CacheConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private retryQueue: Map<string, RetryQueueItem> = new Map();
  private retryTimer: NodeJS.Timeout | null = null;
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadFromLocalStorage();
    this.startRetryProcessor();
  }

  /**
   * Cache a transcription segment
   * @param segment Transcription segment
   * @param priority Priority level (0-10)
   */
  cacheSegment(segment: TranscriptionSegment, priority: number = 5): void {
    const entry: CacheEntry = {
      id: `segment_${segment.id}`,
      type: CacheEntryType.SEGMENT,
      timestamp: Date.now(),
      data: segment,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      priority,
      expiresAt: Date.now() + this.config.cacheExpiration
    };

    this.addToCache(entry);
  }

  /**
   * Cache audio chunk for retry
   * @param audioChunk Audio data
   * @param sessionId Session ID
   * @param timestamp Timestamp
   * @param priority Priority level
   */
  cacheAudioChunk(
    audioChunk: ArrayBuffer,
    sessionId: string,
    timestamp: number,
    priority: number = 3
  ): void {
    const chunkId = `audio_${sessionId}_${timestamp}`;
    
    // Convert ArrayBuffer to base64 for storage
    const base64Audio = this.arrayBufferToBase64(audioChunk);
    
    const entry: CacheEntry = {
      id: chunkId,
      type: CacheEntryType.AUDIO_CHUNK,
      timestamp: Date.now(),
      data: {
        sessionId,
        timestamp,
        audio: base64Audio,
        size: audioChunk.byteLength
      },
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      priority,
      expiresAt: Date.now() + this.config.cacheExpiration
    };

    this.addToCache(entry);
  }

  /**
   * Cache transcription data
   * @param transcription Transcription data
   * @param priority Priority level
   */
  cacheTranscription(transcription: Partial<SessionTranscription>, priority: number = 7): void {
    const entry: CacheEntry = {
      id: `transcription_${transcription.id || Date.now()}`,
      type: CacheEntryType.TRANSCRIPTION,
      timestamp: Date.now(),
      data: transcription,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      priority,
      expiresAt: Date.now() + this.config.cacheExpiration
    };

    this.addToCache(entry);
  }

  /**
   * Add item to retry queue
   * @param operation Operation type
   * @param data Data to retry
   * @param targetId Target ID for the operation
   * @param priority Priority level
   */
  addToRetryQueue(
    operation: 'create' | 'update' | 'upload',
    data: any,
    targetId?: string,
    priority: number = 5
  ): void {
    const retryId = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const retryItem: RetryQueueItem = {
      id: retryId,
      type: CacheEntryType.SESSION_DATA,
      timestamp: Date.now(),
      data,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      priority,
      operation,
      targetId,
      nextRetry: Date.now() + this.config.retryDelay
    };

    this.retryQueue.set(retryId, retryItem);
    this.saveToLocalStorage();
  }

  /**
   * Get cached item
   * @param id Item ID
   * @returns Cached entry or null
   */
  getCached(id: string): CacheEntry | null {
    this.stats.totalRequests++;
    
    const entry = this.cache.get(id);
    if (entry) {
      // Check if expired
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.cache.delete(id);
        this.stats.misses++;
        return null;
      }
      
      this.stats.hits++;
      return entry;
    }
    
    this.stats.misses++;
    return null;
  }

  /**
   * Get all cached segments for a session
   * @param sessionId Session ID
   * @returns Array of cached segments
   */
  getCachedSegments(sessionId: string): TranscriptionSegment[] {
    const segments: TranscriptionSegment[] = [];
    
    for (const entry of this.cache.values()) {
      if (entry.type === CacheEntryType.SEGMENT) {
        const segment = entry.data as TranscriptionSegment;
        if (segment.id.includes(sessionId)) {
          segments.push(segment);
        }
      }
    }
    
    return segments.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Remove item from cache
   * @param id Item ID
   */
  removeFromCache(id: string): void {
    this.cache.delete(id);
    this.saveToLocalStorage();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      this.saveToLocalStorage();
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);
    
    return {
      totalEntries: this.cache.size,
      pendingRetries: this.retryQueue.size,
      cacheSize: this.calculateCacheSize(),
      hitRate: this.stats.totalRequests > 0 ? this.stats.hits / this.stats.totalRequests : 0,
      missRate: this.stats.totalRequests > 0 ? this.stats.misses / this.stats.totalRequests : 0,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : undefined
    };
  }

  /**
   * Process retry queue
   */
  private async processRetryQueue(): Promise<void> {
    const now = Date.now();
    const itemsToRetry: RetryQueueItem[] = [];
    
    // Find items ready for retry
    for (const item of this.retryQueue.values()) {
      if (item.nextRetry && now >= item.nextRetry) {
        itemsToRetry.push(item);
      }
    }
    
    // Sort by priority (highest first)
    itemsToRetry.sort((a, b) => b.priority - a.priority);
    
    // Process items
    for (const item of itemsToRetry) {
      try {
        await this.retryOperation(item);
        this.retryQueue.delete(item.id);
      } catch (error) {
        console.warn(`Retry failed for ${item.id}:`, error);
        this.handleRetryFailure(item);
      }
    }
    
    if (itemsToRetry.length > 0) {
      this.saveToLocalStorage();
    }
  }

  /**
   * Retry a specific operation
   * @param item Retry queue item
   */
  private async retryOperation(item: RetryQueueItem): Promise<void> {
    // This would integrate with the actual services
    // For now, we'll simulate the retry logic
    
    item.retryCount++;
    item.lastAttempt = Date.now();
    
    // Simulate operation based on type
    switch (item.operation) {
      case 'create':
        // Retry creation operation
        console.log(`Retrying create operation for ${item.id}`);
        break;
        
      case 'update':
        // Retry update operation
        console.log(`Retrying update operation for ${item.id}`);
        break;
        
      case 'upload':
        // Retry upload operation
        console.log(`Retrying upload operation for ${item.id}`);
        break;
    }
    
    // For demo purposes, we'll assume success
    // In real implementation, this would call the actual service methods
  }

  /**
   * Handle retry failure
   * @param item Failed retry item
   */
  private handleRetryFailure(item: RetryQueueItem): void {
    if (item.retryCount >= item.maxRetries) {
      console.error(`Max retries exceeded for ${item.id}, removing from queue`);
      this.retryQueue.delete(item.id);
    } else {
      // Calculate exponential backoff
      const delay = Math.min(
        this.config.retryDelay * Math.pow(2, item.retryCount),
        this.config.maxRetryDelay
      );
      
      item.nextRetry = Date.now() + delay;
    }
  }

  /**
   * Add entry to cache with size management
   * @param entry Cache entry
   */
  private addToCache(entry: CacheEntry): void {
    // Remove expired entries first
    this.clearExpired();
    
    // Check cache size limit
    if (this.cache.size >= this.config.maxCacheSize) {
      this.evictOldestEntries();
    }
    
    this.cache.set(entry.id, entry);
    this.saveToLocalStorage();
  }

  /**
   * Evict oldest entries to make room
   */
  private evictOldestEntries(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 10% of entries
    const toRemove = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Calculate total cache size in bytes
   */
  private calculateCacheSize(): number {
    let size = 0;
    for (const entry of this.cache.values()) {
      size += JSON.stringify(entry).length * 2; // Rough estimate (UTF-16)
    }
    return size;
  }

  /**
   * Start retry processor
   */
  private startRetryProcessor(): void {
    this.retryTimer = setInterval(() => {
      this.processRetryQueue();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Save cache to localStorage
   */
  private saveToLocalStorage(): void {
    try {
      const cacheData = {
        cache: Array.from(this.cache.entries()),
        retryQueue: Array.from(this.retryQueue.entries()),
        stats: this.stats
      };
      
      localStorage.setItem('rpg-scribe-transcription-cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('rpg-scribe-transcription-cache');
      if (stored) {
        const cacheData = JSON.parse(stored);
        
        this.cache = new Map(cacheData.cache || []);
        this.retryQueue = new Map(cacheData.retryQueue || []);
        this.stats = cacheData.stats || this.stats;
        
        // Clean up expired entries
        this.clearExpired();
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
    
    this.saveToLocalStorage();
    this.cache.clear();
    this.retryQueue.clear();
  }
}
