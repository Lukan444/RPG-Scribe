/**
 * Vector Search Hook
 *
 * This hook provides a convenient way to use vector search in React components.
 */

import { useState, useCallback } from 'react';
import { EntityType } from '../models/EntityType';
import { VectorServiceFactory } from '../services/vector/VectorServiceFactory';
import { SearchResult, SearchOptions } from '../services/vector/types';
import { FirestoreService } from '../services/firestore.service';

/**
 * Vector search hook result
 */
interface UseVectorSearchResult {
  /** Search results */
  results: SearchResult[];
  /** Whether a search is in progress */
  loading: boolean;
  /** Error message if search failed */
  error: string | null;
  /** Search function */
  search: (query: string, options?: SearchOptions) => Promise<void>;
  /** Clear search results */
  clearResults: () => void;
}

/**
 * Hook for using vector search in React components
 * @param entityType Entity type to search for
 * @returns Vector search hook result
 */
export function useVectorSearch(entityType?: EntityType): UseVectorSearchResult {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Create a generic Firestore service for searching
  const firestoreService = new FirestoreService('entities');

  // Create search fallback chain
  const { searchFallbackChain } = VectorServiceFactory.createCompleteService(firestoreService);

  /**
   * Search for entities
   * @param query Search query
   * @param options Search options
   */
  const search = useCallback(async (query: string, options?: SearchOptions) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Merge options with entity type
      const mergedOptions: SearchOptions = {
        ...options,
        entityTypes: entityType ? [entityType] : options?.entityTypes
      };

      // Perform search
      const searchResults = await searchFallbackChain.search(query, mergedOptions);

      // Update state
      setResults(searchResults);
    } catch (err) {
      console.error('Vector search error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during search';
      setError(errorMessage);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [entityType, searchFallbackChain]);

  /**
   * Clear search results
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults
  };
}
