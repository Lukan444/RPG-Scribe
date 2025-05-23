/**
 * Location Service Adapter
 *
 * This adapter wraps the LocationService to implement the IEntityService interface.
 */

import { DocumentData, DocumentSnapshot, QueryConstraint, QueryDocumentSnapshot } from 'firebase/firestore';
import { Location } from '../../models/Location';
import { EntityType } from '../../models/EntityType';
import { LocationService } from '../location.service';
import { IEntityService } from '../interfaces/EntityService.interface';
import { CountOptions } from '../enhanced-firestore.service';

/**
 * Location service adapter class
 */
export class LocationServiceAdapter implements IEntityService<Location> {
  private locationService: LocationService;
  private worldId: string;
  private campaignId: string;

  /**
   * Create a new LocationServiceAdapter
   * @param worldId World ID
   * @param campaignId Campaign ID
   */
  constructor(worldId: string, campaignId: string) {
    this.locationService = LocationService.getInstance(worldId, campaignId);
    this.worldId = worldId;
    this.campaignId = campaignId;
  }

  /**
   * Get the entity type
   * @returns Entity type
   */
  getEntityType(): EntityType {
    return EntityType.LOCATION;
  }

  /**
   * Get the world ID
   * @returns World ID
   */
  getWorldId(): string {
    return this.worldId;
  }

  /**
   * Get the campaign ID
   * @returns Campaign ID
   */
  getCampaignId(): string {
    return this.campaignId;
  }

  /**
   * Get a location by ID
   * @param id Location ID
   * @param options Options for the operation
   * @returns Location data or null if not found
   */
  async getById(
    id: string,
    options?: {
      forceServer?: boolean;
      useCache?: boolean;
      cacheTTL?: number;
      skipTransform?: boolean;
      maxRetries?: number;
      trackPerformance?: boolean;
    }
  ): Promise<Location | null> {
    const location = await this.locationService.getById(id, options);

    if (location) {
      // Convert from service Location to model Location
      return {
        ...location,
        entityType: EntityType.LOCATION
      } as Location;
    }

    return null;
  }

  /**
   * Get multiple locations by their IDs
   * @param ids Array of location IDs
   * @returns Array of location data
   */
  async getByIds(ids: string[]): Promise<Location[]> {
    const locations = await this.locationService.getByIds(ids);

    // Convert from service Location to model Location
    return locations.map(location => ({
      ...location,
      entityType: EntityType.LOCATION
    } as Location));
  }

  /**
   * Create a new location
   * @param data Location data
   * @param id Document ID (optional)
   * @param options Options for the operation
   * @returns Location ID
   */
  async create(
    data: Location,
    id?: string,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Location) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    }
  ): Promise<string> {
    // Convert from model Location to service Location
    const serviceLocation = {
      ...data,
      worldId: this.worldId,
      campaignId: this.campaignId
    };

    // We need to use any type to bypass TypeScript's type checking
    // since the service and model types are incompatible
    return this.locationService.create(serviceLocation as any, id, options as any);
  }

  /**
   * Update a location
   * @param id Location ID
   * @param data Location data to update
   * @param options Options for the operation
   * @returns True if successful
   */
  async update(
    id: string,
    data: Partial<Location>,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
    }
  ): Promise<boolean> {
    return this.locationService.update(id, data, options);
  }

  /**
   * Delete a location
   * @param id Location ID
   * @param options Options for the operation
   * @returns True if successful
   */
  async delete(
    id: string,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
    }
  ): Promise<boolean> {
    return this.locationService.delete(id, options);
  }

  /**
   * Query locations with pagination
   * @param constraints Query constraints (where, orderBy, etc.)
   * @param pageSize Number of locations to return
   * @param startAfterDoc Document to start after (for pagination)
   * @param options Options for the operation
   * @returns Query results and last document for pagination
   */
  async query(
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
    data: Location[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    source: 'server' | 'cache';
  }> {
    const result = await this.locationService.query(constraints, pageSize, startAfterDoc, options);

    // Convert from service Location to model Location
    const convertedData = result.data.map(location => ({
      ...location,
      entityType: EntityType.LOCATION
    } as Location));

    return {
      ...result,
      data: convertedData
    };
  }

  /**
   * Get the count of locations matching the constraints
   * @param queryName Name of the query for caching
   * @param constraints Query constraints
   * @param options Count options
   * @returns Count of matching locations
   */
  async getCount(
    queryName: string,
    constraints?: QueryConstraint[],
    options?: CountOptions
  ): Promise<number> {
    // Implement a fallback since locationService might not have getCount
    try {
      // Always use the fallback implementation
      const { data } = await this.query(constraints);
      return data.length;
    } catch (error) {
      console.error(`Error getting count for ${queryName}:`, error);
      return 0;
    }
  }

  /**
   * Get the relationship count for a location
   * @param entityId Location ID
   * @param options Count options
   * @returns Relationship count
   */
  async getRelationshipCount(
    entityId: string,
    options?: CountOptions
  ): Promise<number> {
    // This is a placeholder implementation
    return 0;
  }

  /**
   * List all locations (alias for query for compatibility)
   * @param options Query options
   * @returns Array of locations
   */
  async listEntities(
    options?: {
      forceServer?: boolean;
      source?: 'default' | 'server' | 'cache';
      useCache?: boolean;
      cacheTTL?: number;
      pageSize?: number;
    }
  ): Promise<Location[]> {
    const { data } = await this.query(
      undefined,
      options?.pageSize,
      undefined,
      {
        forceServer: options?.forceServer,
        source: options?.source,
        useCache: options?.useCache,
        cacheTTL: options?.cacheTTL
      }
    );
    // Data is already converted in the query method
    return data;
  }

  /**
   * Create location (alias for create for compatibility)
   * @param data Location data
   * @param options Options for the operation
   * @returns Location ID
   */
  async createEntity(
    data: Location,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Location) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    }
  ): Promise<string> {
    return this.create(data, undefined, options);
  }

  /**
   * Subscribe to real-time updates for a location
   * @param id Location ID
   * @param callback Function to call when location changes
   * @param options Options for the subscription
   * @returns Unsubscribe function
   */
  subscribeToEntity(
    id: string,
    callback: (data: Location | null) => void,
    options?: {
      listenerId?: string;
      onError?: (error: Error) => void;
    }
  ): () => void {
    // Create a wrapper callback that converts the service Location to model Location
    const wrappedCallback = (location: any | null) => {
      if (location) {
        const modelLocation = {
          ...location,
          entityType: EntityType.LOCATION
        } as Location;
        callback(modelLocation);
      } else {
        callback(null);
      }
    };

    return this.locationService.subscribeToDocument(id, wrappedCallback, options);
  }

  /**
   * Subscribe to real-time updates for a query
   * @param constraints Query constraints
   * @param callback Function to call when query results change
   * @param options Options for the subscription
   * @returns Unsubscribe function
   */
  subscribeToQuery(
    constraints: QueryConstraint[],
    callback: (data: Location[]) => void,
    options?: {
      queryId?: string;
      listenerId?: string;
      onError?: (error: Error) => void;
    }
  ): () => void {
    // Create a wrapper callback that converts the service Locations to model Locations
    const wrappedCallback = (locations: any[]) => {
      const modelLocations = locations.map(location => ({
        ...location,
        entityType: EntityType.LOCATION
      } as Location));

      callback(modelLocations);
    };

    return this.locationService.subscribeToQuery(constraints, wrappedCallback, options);
  }
}
