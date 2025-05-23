/**
 * Entity List Context
 * 
 * This context provides state management for the unified entity list component.
 * It manages view preferences, filters, sorting, and pagination.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DocumentData } from 'firebase/firestore';
import { EntityListViewType, IEntityListConfig } from '../interfaces/EntityListConfig.interface';

/**
 * Entity list context state
 */
interface EntityListContextState<T extends DocumentData> {
  // View state
  viewType: EntityListViewType;
  setViewType: (viewType: EntityListViewType) => void;
  
  // Filter state
  filters: Record<string, string>;
  setFilters: (filters: Record<string, string>) => void;
  addFilter: (key: string, value: string) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  
  // Sort state
  sortBy: string | null;
  setSortBy: (sortBy: string | null) => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
  
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Pagination state
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
  
  // Config
  config: IEntityListConfig<T>;
}

/**
 * Create the entity list context
 */
const EntityListContext = createContext<EntityListContextState<any> | null>(null);

/**
 * Entity list provider props
 */
interface EntityListProviderProps<T extends DocumentData> {
  children: ReactNode;
  config: IEntityListConfig<T>;
}

/**
 * Entity list provider component
 */
export function EntityListProvider<T extends DocumentData>({
  children,
  config
}: EntityListProviderProps<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL parameters or defaults
  const [viewType, setViewTypeState] = useState<EntityListViewType>(
    () => {
      const viewParam = searchParams.get('view');
      if (viewParam && config.availableViews.includes(viewParam as EntityListViewType)) {
        return viewParam as EntityListViewType;
      }
      return config.defaultView;
    }
  );
  
  const [filters, setFiltersState] = useState<Record<string, string>>(
    () => {
      const filterParams: Record<string, string> = {};
      
      // Extract filter parameters from URL
      if (config.persistFiltersInURL) {
        config.filterOptions.forEach(option => {
          const value = searchParams.get(`filter_${option.key}`);
          if (value) {
            filterParams[option.key] = value;
          }
        });
      }
      
      return filterParams;
    }
  );
  
  const [sortBy, setSortByState] = useState<string | null>(
    () => {
      if (config.persistSortingInURL) {
        const sortParam = searchParams.get('sort');
        if (sortParam) {
          return sortParam;
        }
      }
      
      // Use default sort option if available
      const defaultSort = config.sortOptions.find(option => option.default);
      return defaultSort ? defaultSort.key : null;
    }
  );
  
  const [sortDirection, setSortDirectionState] = useState<'asc' | 'desc'>(
    () => {
      if (config.persistSortingInURL) {
        const directionParam = searchParams.get('direction');
        if (directionParam === 'asc' || directionParam === 'desc') {
          return directionParam;
        }
      }
      
      // Use default sort direction if available
      const defaultSort = config.sortOptions.find(option => option.default);
      return defaultSort?.direction || 'asc';
    }
  );
  
  const [searchQuery, setSearchQueryState] = useState<string>(
    () => searchParams.get('search') || ''
  );
  
  const [page, setPageState] = useState<number>(
    () => {
      if (config.persistPaginationInURL) {
        const pageParam = searchParams.get('page');
        if (pageParam) {
          const parsedPage = parseInt(pageParam, 10);
          if (!isNaN(parsedPage) && parsedPage > 0) {
            return parsedPage;
          }
        }
      }
      return 1;
    }
  );
  
  const [pageSize, setPageSizeState] = useState<number>(
    () => {
      if (config.persistPaginationInURL) {
        const pageSizeParam = searchParams.get('pageSize');
        if (pageSizeParam) {
          const parsedPageSize = parseInt(pageSizeParam, 10);
          if (!isNaN(parsedPageSize) && parsedPageSize > 0) {
            return parsedPageSize;
          }
        }
      }
      return config.itemsPerPage;
    }
  );
  
  // Update URL parameters when state changes
  useEffect(() => {
    if (!config.persistViewPreferences && 
        !config.persistFiltersInURL && 
        !config.persistSortingInURL && 
        !config.persistPaginationInURL) {
      return;
    }
    
    const params = new URLSearchParams(searchParams);
    
    // Update view parameter
    if (config.persistViewPreferences) {
      params.set('view', viewType);
    }
    
    // Update filter parameters
    if (config.persistFiltersInURL) {
      // First, remove all existing filter parameters
      Array.from(params.keys())
        .filter(key => key.startsWith('filter_'))
        .forEach(key => params.delete(key));
      
      // Then, add current filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        params.set(`filter_${key}`, value);
      });
    }
    
    // Update sort parameters
    if (config.persistSortingInURL) {
      if (sortBy) {
        params.set('sort', sortBy);
        params.set('direction', sortDirection);
      } else {
        params.delete('sort');
        params.delete('direction');
      }
    }
    
    // Update search parameter
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    
    // Update pagination parameters
    if (config.persistPaginationInURL) {
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
    }
    
    // Update URL without reloading the page
    setSearchParams(params);
  }, [
    config.persistViewPreferences,
    config.persistFiltersInURL,
    config.persistSortingInURL,
    config.persistPaginationInURL,
    viewType,
    filters,
    sortBy,
    sortDirection,
    searchQuery,
    page,
    pageSize,
    searchParams,
    setSearchParams
  ]);
  
  // Wrapper functions to update state
  const setViewType = (newViewType: EntityListViewType) => {
    setViewTypeState(newViewType);
    
    // Save to local storage if enabled
    if (config.persistViewPreferences) {
      localStorage.setItem(`entityList_${config.entityType}_viewType`, newViewType);
    }
  };
  
  const setFilters = (newFilters: Record<string, string>) => {
    setFiltersState(newFilters);
    setPage(1); // Reset to first page when filters change
  };
  
  const addFilter = (key: string, value: string) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };
  
  const removeFilter = (key: string) => {
    setFiltersState(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
    setPage(1); // Reset to first page when filters change
  };
  
  const clearFilters = () => {
    setFiltersState({});
    setPage(1); // Reset to first page when filters change
  };
  
  const setSortBy = (newSortBy: string | null) => {
    setSortByState(newSortBy);
    setPage(1); // Reset to first page when sort changes
  };
  
  const setSortDirection = (newDirection: 'asc' | 'desc') => {
    setSortDirectionState(newDirection);
  };
  
  const setSearchQuery = (query: string) => {
    setSearchQueryState(query);
    setPage(1); // Reset to first page when search changes
  };
  
  const setPage = (newPage: number) => {
    setPageState(newPage);
  };
  
  const setPageSize = (newPageSize: number) => {
    setPageSizeState(newPageSize);
    setPage(1); // Reset to first page when page size changes
  };
  
  // Context value
  const value: EntityListContextState<T> = {
    viewType,
    setViewType,
    filters,
    setFilters,
    addFilter,
    removeFilter,
    clearFilters,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    pageSize,
    setPageSize,
    config
  };
  
  return (
    <EntityListContext.Provider value={value}>
      {children}
    </EntityListContext.Provider>
  );
}

/**
 * Hook to use the entity list context
 */
export function useEntityList<T extends DocumentData>() {
  const context = useContext(EntityListContext);
  
  if (!context) {
    throw new Error('useEntityList must be used within an EntityListProvider');
  }
  
  return context as EntityListContextState<T>;
}
