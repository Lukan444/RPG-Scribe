/**
 * Cost Optimization Utilities
 * 
 * This file provides utility functions for cost optimization in the client-side code.
 */

/**
 * Cache for vector search results
 */
interface VectorSearchCache {
  [key: string]: {
    results: any[];
    timestamp: number;
  };
}

/**
 * Vector search cache
 */
const vectorSearchCache: VectorSearchCache = {};

/**
 * Cache TTL in milliseconds (default: 5 minutes)
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Get vector search results from cache
 * @param query Search query
 * @param options Search options
 * @returns Cached results or null if not found
 */
export function getVectorSearchFromCache(query: string, options?: any): any[] | null {
  const cacheKey = getCacheKey(query, options);
  
  if (vectorSearchCache[cacheKey]) {
    const { results, timestamp } = vectorSearchCache[cacheKey];
    
    // Check if cache is expired
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      delete vectorSearchCache[cacheKey];
      return null;
    }
    
    return results;
  }
  
  return null;
}/**
 * Add vector search results to cache
 * @param query Search query
 * @param options Search options
 * @param results Search results
 */
export function addVectorSearchToCache(query: string, options: any | undefined, results: any[]): void {
  const cacheKey = getCacheKey(query, options);
  
  vectorSearchCache[cacheKey] = {
    results,
    timestamp: Date.now()
  };
  
  // Trim cache if it gets too large
  const maxCacheSize = 100;
  const cacheKeys = Object.keys(vectorSearchCache);
  
  if (cacheKeys.length > maxCacheSize) {
    // Sort by timestamp (oldest first)
    const sortedKeys = cacheKeys.sort((a, b) => 
      vectorSearchCache[a].timestamp - vectorSearchCache[b].timestamp
    );
    
    // Remove oldest entries
    const keysToRemove = sortedKeys.slice(0, cacheKeys.length - maxCacheSize);
    
    for (const key of keysToRemove) {
      delete vectorSearchCache[key];
    }
  }
}

/**
 * Get cache key for vector search
 * @param query Search query
 * @param options Search options
 * @returns Cache key
 */
function getCacheKey(query: string, options?: any): string {
  return `${query}|${JSON.stringify(options || {})}`;
}

/**
 * Clear vector search cache
 */
export function clearVectorSearchCache(): void {
  Object.keys(vectorSearchCache).forEach(key => {
    delete vectorSearchCache[key];
  });
}/**
 * Batch operation queue
 */
interface BatchQueue<T> {
  items: T[];
  timer: NodeJS.Timeout | null;
  callbacks: ((result: any) => void)[];
}

/**
 * Batch queues
 */
const batchQueues: Record<string, BatchQueue<any>> = {};

/**
 * Batch operation
 * @param batchId Batch ID
 * @param item Item to add to batch
 * @param operation Operation to execute on batch
 * @param options Batch options
 * @returns Promise that resolves when the operation completes
 */
export function batchOperation<T, R>(
  batchId: string,
  item: T,
  operation: (items: T[]) => Promise<R[]>,
  options?: {
    maxBatchSize?: number;
    maxWaitTimeMs?: number;
    minBatchSize?: number;
  }
): Promise<R> {
  const maxBatchSize = options?.maxBatchSize || 10;
  const maxWaitTimeMs = options?.maxWaitTimeMs || 100;
  const minBatchSize = options?.minBatchSize || 2;
  
  return new Promise<R>((resolve, reject) => {
    try {
      // Get or create batch queue
      if (!batchQueues[batchId]) {
        batchQueues[batchId] = {
          items: [],
          timer: null,
          callbacks: []
        };
      }
      
      const queue = batchQueues[batchId];      
      // Add item to queue
      queue.items.push(item);
      queue.callbacks.push(resolve);
      
      // Process queue if it reaches max size
      if (queue.items.length >= maxBatchSize) {
        processBatch(batchId, operation);
        return;
      }
      
      // Process queue if it reaches min size and no timer is set
      if (queue.items.length >= minBatchSize && !queue.timer) {
        queue.timer = setTimeout(() => {
          processBatch(batchId, operation);
        }, maxWaitTimeMs);
      }
      
      // Set timer if not already set
      if (!queue.timer) {
        queue.timer = setTimeout(() => {
          processBatch(batchId, operation);
        }, maxWaitTimeMs);
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
async function processBatch<T, R>(
  batchId: string,
  operation: (items: T[]) => Promise<R[]>
): Promise<void> {
  const queue = batchQueues[batchId];
  
  if (!queue) {
    return;
  }
  
  // Clear timer
  if (queue.timer) {
    clearTimeout(queue.timer);
    queue.timer = null;
  }
  
  // Remove queue from batch queues
  delete batchQueues[batchId];
  
  try {
    // Execute operation
    const results = await operation(queue.items);
    
    // Resolve callbacks
    queue.callbacks.forEach((callback, index) => {
      callback(results[index]);
    });
  } catch (error) {
    // Reject all callbacks
    queue.callbacks.forEach(callback => {
      callback(null);
    });
    
    console.error(`Failed to process batch: ${batchId}`, error);
  }
}