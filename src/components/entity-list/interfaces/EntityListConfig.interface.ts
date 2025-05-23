/**
 * Entity List Configuration Interface
 *
 * This interface defines the configuration options for the unified entity list component.
 * It provides a standardized way to configure entity lists regardless of entity type.
 */

import { ReactNode } from 'react';
import { EntityType } from '../../../models/EntityType';
import { DocumentData } from 'firebase/firestore';

/**
 * Column definition for entity tables
 */
export interface EntityListColumn<T> {
  key: string;
  title: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  hidden?: boolean;
}

/**
 * Filter option for entity lists
 */
export interface EntityListFilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}

/**
 * Sort option for entity lists
 */
export interface EntityListSortOption {
  key: string;
  label: string;
  direction?: 'asc' | 'desc';
  default?: boolean;
}

/**
 * View type for entity lists
 */
export type EntityListViewType = 'table' | 'grid' | 'article' | 'organize';

/**
 * Entity list configuration interface
 */
export interface IEntityListConfig<T extends DocumentData> {
  /**
   * Entity type
   */
  entityType: EntityType;

  /**
   * Display name for the entity type
   */
  displayName: string;

  /**
   * Icon for the entity type
   */
  icon?: ReactNode;

  /**
   * Color for the entity type
   */
  color: string;

  /**
   * Default view type
   */
  defaultView: EntityListViewType;

  /**
   * Available view types
   */
  availableViews: EntityListViewType[];

  /**
   * Table columns
   */
  columns: EntityListColumn<T>[];

  /**
   * Filter options
   */
  filterOptions: EntityListFilterOption[];

  /**
   * Sort options
   */
  sortOptions: EntityListSortOption[];

  /**
   * ID field name
   */
  idField: string;

  /**
   * Name field name
   */
  nameField: string;

  /**
   * Description field name
   */
  descriptionField: string;

  /**
   * Image field name
   */
  imageField: string | null;

  /**
   * Function to render a badge for an entity
   */
  renderBadge?: ((item: T) => ReactNode) | null;

  /**
   * Function to render an item in the organize view
   */
  renderOrganizeItem?: (item: T) => ReactNode;

  /**
   * Function to get a placeholder image for an entity
   */
  getPlaceholderImage?: () => string;

  /**
   * Function to get the route for viewing an entity
   */
  getViewRoute: (id: string, worldId?: string, campaignId?: string) => string;

  /**
   * Function to get the route for editing an entity
   */
  getEditRoute: (id: string, worldId?: string, campaignId?: string) => string;

  /**
   * Function to get the route for creating a new entity
   */
  getCreateRoute: (worldId?: string, campaignId?: string) => string;

  /**
   * Whether to show relationship counts
   */
  showRelationshipCounts: boolean;

  /**
   * Empty state message
   */
  emptyStateMessage: string;

  /**
   * Empty state action text
   */
  emptyStateActionText: string;

  /**
   * Items per page for pagination
   */
  itemsPerPage: number;

  /**
   * Whether to show the add button
   */
  showAddButton: boolean;

  /**
   * Whether to show the filter panel
   */
  showFilterPanel: boolean;

  /**
   * Whether to show the sort panel
   */
  showSortPanel: boolean;

  /**
   * Whether to show the search box
   */
  showSearchBox: boolean;

  /**
   * Whether to show the pagination
   */
  showPagination: boolean;

  /**
   * Whether to use virtual scrolling
   */
  useVirtualScrolling: boolean;

  /**
   * Whether to persist view preferences in local storage
   */
  persistViewPreferences: boolean;

  /**
   * Whether to persist filters in URL parameters
   */
  persistFiltersInURL: boolean;

  /**
   * Whether to persist sorting in URL parameters
   */
  persistSortingInURL: boolean;

  /**
   * Whether to persist pagination in URL parameters
   */
  persistPaginationInURL: boolean;

  /**
   * Whether to use animations
   */
  useAnimations: boolean;

  /**
   * Whether to use server-side sorting
   */
  useServerSideSorting: boolean;

  /**
   * Whether to use server-side filtering
   */
  useServerSideFiltering: boolean;

  /**
   * Whether to use server-side pagination
   */
  useServerSidePagination: boolean;

  /**
   * Whether to use server-side search
   */
  useServerSideSearch: boolean;
}
