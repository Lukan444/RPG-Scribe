/**
 * Entity Service Interface
 * 
 * This interface defines the contract for all entity services in the system.
 * It provides a standardized way to interact with entities regardless of their type.
 */

import { DocumentData, DocumentSnapshot, QueryConstraint, QueryDocumentSnapshot } from 'firebase/firestore';
import { CountOptions } from '../enhanced-firestore.service';
import { EntityType } from '../../models/EntityType';

/**
 * Interface for entity services
 * @template T Entity type extending DocumentData
 */
export interface IEntityService<T extends DocumentData> {
  /**
   * Get the entity type
   * @returns Entity type
   */
  getEntityType(): EntityType;

  /**
   * Get the world ID
   * @returns World ID
   */
  getWorldId(): string;

  /**
   * Get the campaign ID
   * @returns Campaign ID
   */
  getCampaignId(): string;

  /**
   * Get an entity by ID
   * @param id Entity ID
   * @param options Options for the operation
   * @returns Entity data or null if not found
   */
  getById(
    id: string,
    options?: {
      forceServer?: boolean;
      useCache?: boolean;
      cacheTTL?: number;
      skipTransform?: boolean;
      maxRetries?: number;
      trackPerformance?: boolean;
    }
  ): Promise<T | null>;

  /**
   * Get multiple entities by their IDs
   * @param ids Array of entity IDs
   * @returns Array of entity data
   */
  getByIds(ids: string[]): Promise<T[]>;

  /**
   * Create a new entity
   * @param data Entity data
   * @param id Document ID (optional)
   * @param options Options for the operation
   * @returns Entity ID
   */
  create(
    data: T,
    id?: string,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: T) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    }
  ): Promise<string>;

  /**
   * Update an entity
   * @param id Entity ID
   * @param data Entity data to update
   * @param options Options for the operation
   * @returns True if successful
   */
  update(
    id: string,
    data: Partial<T>,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
    }
  ): Promise<boolean>;

  /**
   * Delete an entity
   * @param id Entity ID
   * @param options Options for the operation
   * @returns True if successful
   */
  delete(
    id: string,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
    }
  ): Promise<boolean>;

  /**
   * Query entities with pagination
   * @param constraints Query constraints (where, orderBy, etc.)
   * @param pageSize Number of entities to return
   * @param startAfterDoc Document to start after (for pagination)
   * @param options Options for the operation
   * @returns Query results and last document for pagination
   */
  query(
    constraints?: QueryConstraint[],
    pageSize?: number,
    startAfterDoc?: DocumentSnapshot<DocumentData>,
    options?: {
      forceServer?: boolean;
      source?: 'default' | 'server' | 'cache';
      useCache?: boolean;
      cacheTTL?: number;
    }
  ): Promise<{
    data: T[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    source: 'server' | 'cache';
  }>;

  /**
   * Get the count of entities matching the constraints
   * @param queryName Name of the query for caching
   * @param constraints Query constraints
   * @param options Count options
   * @returns Count of matching entities
   */
  getCount(
    queryName: string,
    constraints?: QueryConstraint[],
    options?: CountOptions
  ): Promise<number>;

  /**
   * Get the relationship count for an entity
   * @param entityId Entity ID
   * @param options Count options
   * @returns Relationship count
   */
  getRelationshipCount(
    entityId: string,
    options?: CountOptions
  ): Promise<number>;

  /**
   * List all entities (alias for query for compatibility)
   * @param options Query options
   * @returns Array of entities
   */
  listEntities(
    options?: {
      forceServer?: boolean;
      source?: 'default' | 'server' | 'cache';
      useCache?: boolean;
      cacheTTL?: number;
      pageSize?: number;
    }
  ): Promise<T[]>;

  /**
   * Create entity (alias for create for compatibility)
   * @param data Entity data
   * @param options Options for the operation
   * @returns Entity ID
   */
  createEntity(
    data: T,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: T) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    }
  ): Promise<string>;

  /**
   * Subscribe to real-time updates for an entity
   * @param id Entity ID
   * @param callback Function to call when entity changes
   * @param options Options for the subscription
   * @returns Unsubscribe function
   */
  subscribeToEntity(
    id: string,
    callback: (data: T | null) => void,
    options?: {
      listenerId?: string;
      onError?: (error: Error) => void;
    }
  ): () => void;

  /**
   * Subscribe to real-time updates for a query
   * @param constraints Query constraints
   * @param callback Function to call when query results change
   * @param options Options for the subscription
   * @returns Unsubscribe function
   */
  subscribeToQuery(
    constraints: QueryConstraint[],
    callback: (data: T[]) => void,
    options?: {
      queryId?: string;
      listenerId?: string;
      onError?: (error: Error) => void;
    }
  ): () => void;
}
