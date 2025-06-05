/**
 * CachingService test suite using Vitest
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CachingService } from '../../services/caching.service';

describe('CachingService', () => {
  // Test service
  let cachingService: CachingService;

  // Set up test service and fake timers
  beforeEach(() => {
    vi.useFakeTimers();
    cachingService = new CachingService(1000); // 1 second TTL for testing
  });

  // Clean up fake timers after each test
  afterEach(() => {
    vi.useRealTimers();
  });

  // Test set and get methods
  describe('set and get', () => {
    it('should set and get a cache entry', () => {
      // Set cache entry
      const key = 'test-key';
      const data = { name: 'Test Data', value: 42 };
      cachingService.set(key, data);

      // Get cache entry
      const cachedData = cachingService.get<typeof data>(key);

      // Verify cache entry
      expect(cachedData).toEqual(data);
    });

    it('should return null for non-existent cache entry', () => {
      // Get non-existent cache entry
      const cachedData = cachingService.get('non-existent-key');

      // Verify null result
      expect(cachedData).toBeNull();
    });

    it('should expire cache entries after TTL', () => {
      // Set cache entry
      const key = 'test-key';
      const data = { name: 'Test Data', value: 42 };
      cachingService.set(key, data);

      // Verify cache entry exists
      expect(cachingService.get(key)).toEqual(data);

      // Advance time beyond the TTL (1000ms + buffer)
      vi.advanceTimersByTime(1100);

      // Verify cache entry is expired
      expect(cachingService.get(key)).toBeNull();
    });

    it('should allow custom TTL for cache entries', () => {
      // Set cache entry with custom TTL (500ms)
      const key = 'test-key';
      const data = { name: 'Test Data', value: 42 };
      cachingService.set(key, data, 500);

      // Verify cache entry exists
      expect(cachingService.get(key)).toEqual(data);

      // Advance time beyond the custom TTL (500ms + buffer)
      vi.advanceTimersByTime(600);

      // Verify cache entry is expired
      expect(cachingService.get(key)).toBeNull();

      // Set another cache entry with default TTL (1000ms)
      const key2 = 'test-key-2';
      const data2 = { name: 'Test Data 2', value: 100 };
      cachingService.set(key2, data2);

      // Verify second cache entry exists
      expect(cachingService.get(key2)).toEqual(data2);

      // Advance time beyond the default TTL (1000ms + buffer)
      vi.advanceTimersByTime(1100);

      // Verify second cache entry is expired
      expect(cachingService.get(key2)).toBeNull();
    });
  });

  // Test has method
  describe('has', () => {
    it('should check if cache entry exists', () => {
      // Set cache entry
      const key = 'test-key';
      const data = { name: 'Test Data', value: 42 };
      cachingService.set(key, data);

      // Check if cache entry exists
      const hasEntry = cachingService.has(key);

      // Verify cache entry exists
      expect(hasEntry).toBe(true);

      // Check if non-existent cache entry exists
      const hasNonExistentEntry = cachingService.has('non-existent-key');

      // Verify non-existent cache entry does not exist
      expect(hasNonExistentEntry).toBe(false);
    });

    it('should return false for expired cache entries', () => {
      // Set cache entry
      const key = 'test-key';
      const data = { name: 'Test Data', value: 42 };
      cachingService.set(key, data);

      // Verify cache entry exists
      expect(cachingService.has(key)).toBe(true);

      // Advance time beyond the TTL (1000ms + buffer)
      vi.advanceTimersByTime(1100);

      // Verify cache entry is expired
      expect(cachingService.has(key)).toBe(false);
    });
  });

  // Test delete method
  describe('delete', () => {
    it('should delete a cache entry', () => {
      // Set cache entry
      const key = 'test-key';
      const data = { name: 'Test Data', value: 42 };
      cachingService.set(key, data);

      // Verify cache entry exists
      expect(cachingService.get(key)).toEqual(data);

      // Delete cache entry
      cachingService.delete(key);

      // Verify cache entry is deleted
      expect(cachingService.get(key)).toBeNull();
    });
  });

  // Test clear method
  describe('clear', () => {
    it('should clear all cache entries', () => {
      // Set multiple cache entries
      cachingService.set('key1', 'value1');
      cachingService.set('key2', 'value2');
      cachingService.set('key3', 'value3');

      // Verify cache entries exist
      expect(cachingService.get('key1')).toBe('value1');
      expect(cachingService.get('key2')).toBe('value2');
      expect(cachingService.get('key3')).toBe('value3');

      // Clear cache
      cachingService.clear();

      // Verify cache is empty
      expect(cachingService.get('key1')).toBeNull();
      expect(cachingService.get('key2')).toBeNull();
      expect(cachingService.get('key3')).toBeNull();
    });
  });

  // Test clearExpired method
  describe('clearExpired', () => {
    it('should clear only expired cache entries', () => {
      // Set cache entries with different TTLs
      cachingService.set('key1', 'value1', 500); // Expires after 500ms
      cachingService.set('key2', 'value2', 2000); // Expires after 2000ms

      // Verify cache entries exist
      expect(cachingService.get('key1')).toBe('value1');
      expect(cachingService.get('key2')).toBe('value2');

      // Advance time to expire first entry but not second (600ms)
      vi.advanceTimersByTime(600);

      // Clear expired entries
      cachingService.clearExpired();

      // Verify first entry is cleared and second entry still exists
      expect(cachingService.get('key1')).toBeNull();
      expect(cachingService.get('key2')).toBe('value2');
    });
  });

  // Test size and keys methods
  describe('size and keys', () => {
    it('should return cache size and keys', () => {
      // Set multiple cache entries
      cachingService.set('key1', 'value1');
      cachingService.set('key2', 'value2');
      cachingService.set('key3', 'value3');

      // Get cache size
      const size = cachingService.size();

      // Verify cache size
      expect(size).toBe(3);

      // Get cache keys
      const keys = cachingService.keys();

      // Verify cache keys
      expect(keys.sort()).toEqual(['key1', 'key2', 'key3'].sort());
    });
  });

  // Test getOrSet method
  describe('getOrSet', () => {
    it('should get cached data or fetch and cache new data', async () => {
      // Create fetch function
      const fetchFn = vi.fn().mockResolvedValue('fetched-value');

      // Get or set cache entry (should fetch)
      const value1 = await cachingService.getOrSet('test-key', fetchFn);

      // Verify fetch function was called and value was cached
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(value1).toBe('fetched-value');

      // Get or set cache entry again (should use cache)
      const value2 = await cachingService.getOrSet('test-key', fetchFn);

      // Verify fetch function was not called again and cached value was returned
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(value2).toBe('fetched-value');

      // Advance time beyond the TTL to expire the entry (1000ms + buffer)
      vi.advanceTimersByTime(1100);

      // Get or set cache entry after expiration (should fetch again)
      const value3 = await cachingService.getOrSet('test-key', fetchFn);

      // Verify fetch function was called again and value was cached
      expect(fetchFn).toHaveBeenCalledTimes(2);
      expect(value3).toBe('fetched-value');
    });
  });

  // Test invalidateByPrefix method
  describe('invalidateByPrefix', () => {
    it('should invalidate cache entries by prefix', () => {
      // Create a new instance for this test to avoid interference
      const localCachingService = new CachingService(1000);

      // Set multiple cache entries with different prefixes
      localCachingService.set('prefix1:key1', 'value1');
      localCachingService.set('prefix1:key2', 'value2');
      localCachingService.set('prefix2:key1', 'value3');
      localCachingService.set('prefix2:key2', 'value4');

      // Verify all entries exist
      expect(localCachingService.get('prefix1:key1')).toBe('value1');
      expect(localCachingService.get('prefix1:key2')).toBe('value2');
      expect(localCachingService.get('prefix2:key1')).toBe('value3');
      expect(localCachingService.get('prefix2:key2')).toBe('value4');

      // Invalidate cache entries by prefix
      localCachingService.invalidateByPrefix('prefix1:');

      // Verify prefix1 entries are invalidated and prefix2 entries still exist
      expect(localCachingService.get('prefix1:key1')).toBeNull();
      expect(localCachingService.get('prefix1:key2')).toBeNull();
      expect(localCachingService.get('prefix2:key1')).toBe('value3');
      expect(localCachingService.get('prefix2:key2')).toBe('value4');
    });
  });

  // Test invalidateByPredicate method
  describe('invalidateByPredicate', () => {
    it('should invalidate cache entries by predicate', () => {
      // Create a new instance for this test to avoid interference
      const localCachingService = new CachingService(1000);

      // Set multiple cache entries
      localCachingService.set('key1', 1);
      localCachingService.set('key2', 2);
      localCachingService.set('key3', 3);
      localCachingService.set('key4', 4);

      // Verify all entries exist
      expect(localCachingService.get('key1')).toBe(1);
      expect(localCachingService.get('key2')).toBe(2);
      expect(localCachingService.get('key3')).toBe(3);
      expect(localCachingService.get('key4')).toBe(4);

      // Invalidate cache entries by predicate (even values)
      localCachingService.invalidateByPredicate((key, entry) => entry.data % 2 === 0);

      // Verify even entries are invalidated and odd entries still exist
      expect(localCachingService.get('key1')).toBe(1);
      expect(localCachingService.get('key2')).toBeNull();
      expect(localCachingService.get('key3')).toBe(3);
      expect(localCachingService.get('key4')).toBeNull();
    });
  });
});
