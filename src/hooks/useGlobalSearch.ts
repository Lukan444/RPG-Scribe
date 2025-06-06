/**
 * Global Search Hook
 * 
 * Provides global search functionality with keyboard shortcuts and state management.
 * Integrates with the AI search service and provides consistent search behavior across the app.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useHotkeys, useDebouncedValue } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import { aiSearchService, AISearchResult, SearchSuggestion, AISearchOptions } from '../services/search/AISearchService';
import { EntityType } from '../models/EntityType';

/**
 * Search state interface
 */
interface SearchState {
  query: string;
  results: AISearchResult[];
  suggestions: SearchSuggestion[];
  loading: boolean;
  error: string | null;
  isOpen: boolean;
}

/**
 * Search configuration interface
 */
interface SearchConfig {
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
  searchMode?: 'semantic' | 'keyword' | 'hybrid';
  enableKeyboardShortcuts?: boolean;
  autoFocus?: boolean;
}

/**
 * Global search hook
 */
export function useGlobalSearch(config: SearchConfig = {}) {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    maxResults = 10,
    searchMode = 'hybrid',
    enableKeyboardShortcuts = true,
    autoFocus = true
  } = config;

  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search state
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    suggestions: [],
    loading: false,
    error: null,
    isOpen: false
  });

  // Debounced query for search
  const [debouncedQuery] = useDebouncedValue(state.query, debounceMs);

  // Initialize search service
  useEffect(() => {
    aiSearchService.initialize().catch((error) => {
      console.error('Failed to initialize AI search service:', error);
      setState(prev => ({ ...prev, error: 'Failed to initialize search service' }));
    });
  }, []);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= minQueryLength) {
      performSearch(debouncedQuery);
      getSuggestions(debouncedQuery);
    } else {
      setState(prev => ({
        ...prev,
        results: [],
        suggestions: [],
        loading: false,
        error: null
      }));
      
      if (debouncedQuery.length === 0) {
        getSuggestions('');
      }
    }
  }, [debouncedQuery, minQueryLength]);

  /**
   * Perform search
   */
  const performSearch = useCallback(async (query: string, options?: Partial<AISearchOptions>) => {
    if (!query.trim()) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const searchOptions: AISearchOptions = {
        searchMode,
        limit: maxResults,
        minConfidence: 0.2,
        includeRelationships: true,
        ...options
      };

      const results = await aiSearchService.search(query, searchOptions);
      
      setState(prev => ({
        ...prev,
        results,
        loading: false,
        error: null
      }));

      return results;
    } catch (error) {
      console.error('Search failed:', error);
      setState(prev => ({
        ...prev,
        results: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Search failed'
      }));
      return [];
    }
  }, [searchMode, maxResults]);

  /**
   * Get search suggestions
   */
  const getSuggestions = useCallback(async (partialQuery: string) => {
    try {
      const suggestions = await aiSearchService.getSuggestions(partialQuery);
      setState(prev => ({ ...prev, suggestions }));
      return suggestions;
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      setState(prev => ({ ...prev, suggestions: [] }));
      return [];
    }
  }, []);

  /**
   * Set search query
   */
  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
  }, []);

  /**
   * Clear search
   */
  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      query: '',
      results: [],
      suggestions: [],
      loading: false,
      error: null
    }));
  }, []);

  /**
   * Open search
   */
  const openSearch = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }));
    
    if (autoFocus && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  /**
   * Close search
   */
  const closeSearch = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  /**
   * Toggle search
   */
  const toggleSearch = useCallback(() => {
    if (state.isOpen) {
      closeSearch();
    } else {
      openSearch();
    }
  }, [state.isOpen, openSearch, closeSearch]);

  /**
   * Get navigation path for entity
   */
  const getEntityPath = useCallback((entityType: EntityType, entityId: string, result?: AISearchResult): string => {
    // For entities that require worldId, use the world-scoped route if worldId is available
    if (result?.worldId) {
      const worldScopedTypeMap: Record<EntityType, string> = {
        [EntityType.CHARACTER]: `/rpg-worlds/${result.worldId}/characters/${entityId}`,
        [EntityType.LOCATION]: `/rpg-worlds/${result.worldId}/locations/${entityId}`,
        [EntityType.ITEM]: `/rpg-worlds/${result.worldId}/items/${entityId}`,
        [EntityType.EVENT]: `/rpg-worlds/${result.worldId}/events/${entityId}`,
        [EntityType.SESSION]: `/rpg-worlds/${result.worldId}/sessions/${entityId}`,
        [EntityType.FACTION]: `/rpg-worlds/${result.worldId}/factions/${entityId}`,
        [EntityType.STORY_ARC]: `/rpg-worlds/${result.worldId}/story-arcs/${entityId}`,
        [EntityType.NOTE]: `/rpg-worlds/${result.worldId}/notes/${entityId}`,
        [EntityType.CAMPAIGN]: `/rpg-worlds/${result.worldId}/campaigns/${entityId}`,
        [EntityType.RPG_WORLD]: `/rpg-worlds/${entityId}`
      };

      if (worldScopedTypeMap[entityType]) {
        return worldScopedTypeMap[entityType];
      }
    }

    // Fallback to simple routes for entities without worldId or unsupported types
    const typeMap: Record<EntityType, string> = {
      [EntityType.CHARACTER]: `/characters/${entityId}`,
      [EntityType.LOCATION]: `/locations/${entityId}`,
      [EntityType.ITEM]: `/items/${entityId}`,
      [EntityType.EVENT]: `/events/${entityId}`,
      [EntityType.SESSION]: `/sessions/${entityId}`,
      [EntityType.FACTION]: `/factions/${entityId}`,
      [EntityType.STORY_ARC]: `/story-arcs/${entityId}`,
      [EntityType.NOTE]: `/notes/${entityId}`,
      [EntityType.CAMPAIGN]: `/campaigns/${entityId}`,
      [EntityType.RPG_WORLD]: `/rpg-worlds/${entityId}`
    };
    return typeMap[entityType] || `/entity-manager`;
  }, []);

  /**
   * Select search result
   */
  const selectResult = useCallback((result: AISearchResult) => {
    closeSearch();

    // Navigate to entity detail page using the result data for proper routing
    const entityPath = getEntityPath(result.type, result.id, result);
    if (entityPath) {
      navigate(entityPath);
    }
  }, [navigate, closeSearch, getEntityPath]);

  /**
   * Select suggestion
   */
  const selectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.query);
    performSearch(suggestion.query);
  }, [setQuery, performSearch]);

  // Keyboard shortcuts
  useHotkeys(
    enableKeyboardShortcuts
      ? [
          ['mod+K', openSearch],
          ['/', openSearch],
          ['Escape', closeSearch]
        ]
      : [],
    []
  );

  return {
    // State
    query: state.query,
    results: state.results,
    suggestions: state.suggestions,
    loading: state.loading,
    error: state.error,
    isOpen: state.isOpen,
    
    // Actions
    setQuery,
    performSearch,
    getSuggestions,
    clearSearch,
    openSearch,
    closeSearch,
    toggleSearch,
    selectResult,
    selectSuggestion,
    
    // Refs
    searchInputRef,
    
    // Utils
    getEntityPath
  };
}

export default useGlobalSearch;
