/**
 * Test for LocalStorageCacheTier TTL functionality
 *
 * This test validates that the TTL parameter bug has been fixed
 */

/// <reference types="vitest" />

import { Logger } from '../../../utils/logger';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
})();

// Replace global localStorage with mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Import the class after mocking localStorage
import { MultiTierCacheManager } from '../MultiTierCacheManager';
import { CacheConfig } from '../types';

describe('LocalStorageCacheTier TTL Bug Fix', () => {
  let cacheManager: MultiTierCacheManager<string>;
  let logger: Logger;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    
    logger = new Logger('test');
    
    const config: CacheConfig = {
      memory: { maxEntries: 10, ttlMs: 1000, storageType: 'memory' },
      localStorage: { maxEntries: 10, ttlMs: 5000, storageType: 'localStorage' },
      indexedDB: { maxEntries: 10, ttlMs: 10000, storageType: 'indexedDB' },
      firestore: { maxEntries: 10, ttlMs: 20000, storageType: 'firestore' }
    };
    
    cacheManager = new MultiTierCacheManager(config, logger);
  });

  test('should use custom TTL when provided', async () => {
    const key = 'test-key';
    const value = 'test-value';
    const customTtl = 2000; // 2 seconds
    
    // Set with custom TTL
    await cacheManager.set(key, value, customTtl);
    
    // Verify the entry exists
    const result = await cacheManager.get(key);
    expect(result).toBe(value);
    
    // Check that the TTL is stored correctly in localStorage
    const storedEntry = JSON.parse(localStorageMock.getItem('rpg-scribe-cache-' + key) || '{}');
    expect(storedEntry.ttl).toBe(customTtl);
    expect(storedEntry.data).toBe(value);
  });

  test('should use default TTL when not provided', async () => {
    const key = 'test-key-default';
    const value = 'test-value-default';
    
    // Set without custom TTL
    await cacheManager.set(key, value);
    
    // Verify the entry exists
    const result = await cacheManager.get(key);
    expect(result).toBe(value);
    
    // Check that the default TTL is used
    const storedEntry = JSON.parse(localStorageMock.getItem('rpg-scribe-cache-' + key) || '{}');
    expect(storedEntry.ttl).toBe(5000); // Default localStorage TTL from config
    expect(storedEntry.data).toBe(value);
  });

  test('should expire entries based on their individual TTL', async () => {
    const key1 = 'short-ttl-key';
    const key2 = 'long-ttl-key';
    const value1 = 'short-value';
    const value2 = 'long-value';
    
    // Set entries with different TTLs
    await cacheManager.set(key1, value1, 100); // 100ms
    await cacheManager.set(key2, value2, 10000); // 10 seconds
    
    // Both should be available immediately
    expect(await cacheManager.get(key1)).toBe(value1);
    expect(await cacheManager.get(key2)).toBe(value2);
    
    // Wait for the short TTL to expire
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Short TTL entry should be expired, long TTL should still be available
    expect(await cacheManager.get(key1)).toBeNull();
    expect(await cacheManager.get(key2)).toBe(value2);
  });

  test('should handle TTL correctly in error recovery path', async () => {
    const key = 'error-recovery-key';
    const value = 'error-recovery-value';
    const customTtl = 3000;
    
    // Mock QuotaExceededError scenario
    const originalSetItem = localStorageMock.setItem;
    let callCount = 0;
    
    localStorageMock.setItem = (key: string, value: string) => {
      callCount++;
      if (callCount === 1) {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      }
      return originalSetItem(key, value);
    };
    
    // This should trigger the error recovery path
    await cacheManager.set(key, value, customTtl);
    
    // Verify the entry was stored with correct TTL in recovery path
    const storedEntry = JSON.parse(localStorageMock.getItem('rpg-scribe-cache-' + key) || '{}');
    expect(storedEntry.ttl).toBe(customTtl);
    expect(storedEntry.data).toBe(value);
    
    // Restore original setItem
    localStorageMock.setItem = originalSetItem;
  });
});
