/**
 * Simplified CachingService test suite using Vitest
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CachingService } from '../../services/caching.service';

describe('CachingService', () => {
  let cachingService: CachingService;
  
  beforeEach(() => {
    cachingService = new CachingService(1000); // 1 second TTL for testing
  });
  
  it('should set and get a cache entry', () => {
    const key = 'test-key';
    const data = { name: 'Test Data', value: 42 };
    cachingService.set(key, data);
    
    const cachedData = cachingService.get<typeof data>(key);
    expect(cachedData).toEqual(data);
  });
  
  it('should return null for non-existent cache entry', () => {
    const cachedData = cachingService.get('non-existent-key');
    expect(cachedData).toBeNull();
  });
  
  it('should delete a cache entry', () => {
    const key = 'test-key';
    const data = { name: 'Test Data', value: 42 };
    cachingService.set(key, data);
    
    expect(cachingService.get(key)).toEqual(data);
    
    cachingService.delete(key);
    
    expect(cachingService.get(key)).toBeNull();
  });
  
  it('should clear all cache entries', () => {
    cachingService.set('key1', 'value1');
    cachingService.set('key2', 'value2');
    cachingService.set('key3', 'value3');
    
    expect(cachingService.get('key1')).toBe('value1');
    expect(cachingService.get('key2')).toBe('value2');
    expect(cachingService.get('key3')).toBe('value3');
    
    cachingService.clear();
    
    expect(cachingService.get('key1')).toBeNull();
    expect(cachingService.get('key2')).toBeNull();
    expect(cachingService.get('key3')).toBeNull();
  });
  
  it('should return cache size and keys', () => {
    cachingService.set('key1', 'value1');
    cachingService.set('key2', 'value2');
    cachingService.set('key3', 'value3');
    
    expect(cachingService.size()).toBe(3);
    
    const keys = cachingService.keys();
    expect(keys.length).toBe(3);
    expect(keys).toContain('key1');
    expect(keys).toContain('key2');
    expect(keys).toContain('key3');
  });
});
