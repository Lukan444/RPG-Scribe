/**
 * Optimized Entity Counts Hook
 * 
 * High-performance React hook for entity counts with intelligent caching,
 * batching, and stale-while-revalidate patterns.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { EntityType } from '../models/EntityType';
import { entityCountCache, EntityCountData } from '../services/cache/EntityCountCache.service';
import { batchQueryManager, BatchResult } from '../services/cache/BatchQueryManager.service';

// Hook options interface
interface UseOptimizedEntityCountsOptions {
  worldId?: string;
  campaignId?: string;
  entityTypes?: EntityType[];
  enableStaleWhileRevalidate?: boolean;
  enableBackgroundRefresh?: boolean;
  refreshInterval?: number;
  onCacheHit?: () => void;
  onCacheMiss?: () => void;
  onError?: (error: Error) => void;
}

// Hook return interface
interface UseOptimizedEntityCountsReturn {
  entityCounts: Record<string, number>;
  recentEntities: Record<string, any[]>;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  clearCache: () => void;
  performanceMetrics: {
    cacheHit: boolean;
    loadTime: number;
    source: 'cache' | 'network' | 'stale';
  };
}

// Default entity types to fetch
const DEFAULT_ENTITY_TYPES = [
  EntityType.CHARACTER,
  EntityType.LOCATION,
  EntityType.FACTION,
  EntityType.ITEM,
  EntityType.EVENT,
  EntityType.SESSION,
  EntityType.STORY_ARC,
  EntityType.NOTE
];

/**
 * Optimized hook for entity counts with caching and performance optimizations
 */
export function useOptimizedEntityCounts(
  options: UseOptimizedEntityCountsOptions = {}
): UseOptimizedEntityCountsReturn {
  const {
    worldId,
    campaignId,
    entityTypes = DEFAULT_ENTITY_TYPES,
    enableStaleWhileRevalidate = true,
    enableBackgroundRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    onCacheHit,
    onCacheMiss,
    onError
  } = options;

  // State
  const [entityCounts, setEntityCounts] = useState<Record<string, number>>({});
  const [recentEntities, setRecentEntities] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    cacheHit: false,
    loadTime: 0,
    source: 'cache' as 'cache' | 'network' | 'stale'
  });

  // Refs for cleanup and background refresh
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Memoized cache key
  const cacheType = useMemo(() => campaignId ? 'campaign' : 'world', [campaignId]);
  const cacheId = useMemo(() => campaignId || worldId || '', [campaignId, worldId]);

  // Memoized entity types array for stable dependency
  const stableEntityTypes = useMemo(() => [...entityTypes].sort(), [entityTypes]);

  /**
   * Fetch entity counts from cache or network
   */
  const fetchEntityCounts = useCallback(async (
    useStaleData = false
  ): Promise<EntityCountData | null> => {
    if (!worldId) return null;

    const startTime = performance.now();
    let cacheHit = false;
    let source: 'cache' | 'network' | 'stale' = 'network';

    try {
      // Abort previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Try to get from cache first
      const cachedData = await entityCountCache.getCachedEntityCounts(
        cacheType,
        cacheId
      );

      if (cachedData) {
        cacheHit = true;
        source = useStaleData ? 'stale' : 'cache';
        onCacheHit?.();

        // If we have cached data and not using stale-while-revalidate, return immediately
        if (!enableStaleWhileRevalidate || useStaleData) {
          const loadTime = performance.now() - startTime;
          setPerformanceMetrics({ cacheHit, loadTime, source });
          return cachedData;
        }

        // For stale-while-revalidate, set the cached data immediately
        if (mountedRef.current) {
          setEntityCounts(cachedData.counts);
          setRecentEntities(cachedData.recentEntities);
          setLastUpdated(cachedData.lastUpdated);
          setLoading(false);
          setError(null);
        }
      }

      // Fetch fresh data from network (either no cache or stale-while-revalidate)
      if (!cachedData || enableStaleWhileRevalidate) {
        onCacheMiss?.();
        
        const batchResult = await batchQueryManager.requestEntityCounts(
          worldId,
          campaignId,
          stableEntityTypes
        );

        if (abortControllerRef.current?.signal.aborted) {
          return null;
        }

        const freshData: EntityCountData = {
          counts: batchResult.counts,
          recentEntities: batchResult.recentEntities,
          lastUpdated: batchResult.lastUpdated,
          worldId: batchResult.worldId,
          campaignId: batchResult.campaignId
        };

        // Cache the fresh data
        entityCountCache.setCachedEntityCounts(
          cacheType,
          cacheId,
          freshData
        );

        if (!cachedData) {
          source = 'network';
        }

        const loadTime = performance.now() - startTime;
        setPerformanceMetrics({ cacheHit, loadTime, source });

        return freshData;
      }

      return cachedData;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null;
      }

      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('Error fetching entity counts:', error);
      onError?.(error);

      const loadTime = performance.now() - startTime;
      setPerformanceMetrics({ cacheHit, loadTime, source });

      throw error;
    }
  }, [
    worldId,
    campaignId,
    cacheType,
    cacheId,
    stableEntityTypes,
    enableStaleWhileRevalidate,
    onCacheHit,
    onCacheMiss,
    onError
  ]);

  /**
   * Update state with entity count data
   */
  const updateState = useCallback((data: EntityCountData | null) => {
    if (!mountedRef.current) return;

    if (data) {
      setEntityCounts(data.counts);
      setRecentEntities(data.recentEntities);
      setLastUpdated(data.lastUpdated);
      setError(null);
    }
    setLoading(false);
  }, []);

  /**
   * Refresh entity counts
   */
  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchEntityCounts(false);
      updateState(data);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLoading(false);
      }
    }
  }, [fetchEntityCounts, updateState]);

  /**
   * Clear cache for current context
   */
  const clearCache = useCallback(() => {
    entityCountCache.invalidateEntityType(
      EntityType.CHARACTER, // This will invalidate all entity types
      worldId,
      campaignId
    );
  }, [worldId, campaignId]);

  /**
   * Schedule background refresh
   */
  const scheduleBackgroundRefresh = useCallback(() => {
    if (!enableBackgroundRefresh || !refreshInterval) return;

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        fetchEntityCounts(true).then(updateState).catch(console.error);
        scheduleBackgroundRefresh(); // Schedule next refresh
      }
    }, refreshInterval);
  }, [enableBackgroundRefresh, refreshInterval, fetchEntityCounts, updateState]);

  // Initial load effect
  useEffect(() => {
    if (!worldId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const data = await fetchEntityCounts(false);
        if (isMounted) {
          updateState(data);
          scheduleBackgroundRefresh();
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [worldId, campaignId, fetchEntityCounts, updateState, scheduleBackgroundRefresh]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoized return value
  return useMemo(() => ({
    entityCounts,
    recentEntities,
    loading,
    error,
    lastUpdated,
    refresh,
    clearCache,
    performanceMetrics
  }), [
    entityCounts,
    recentEntities,
    loading,
    error,
    lastUpdated,
    refresh,
    clearCache,
    performanceMetrics
  ]);
}

export default useOptimizedEntityCounts;
