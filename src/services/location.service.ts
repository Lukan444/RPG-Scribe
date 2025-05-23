import {
  where,
  orderBy,
  query,
  collection,
  doc,
  getDoc,
  getDocs,
  DocumentData,
  serverTimestamp,
  increment,
  QueryConstraint,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FirestoreService } from './firestore.service';
import { EntityRelationshipsService } from './entityRelationshipsExport';
import { EntityType } from '../models/EntityType';
import { CampaignService } from './campaign.service';
import { RPGWorldService } from './rpgWorld.service';
import { LocationAPIService } from './api/locationAPI.service';
import { API_CONFIG } from '../config/api.config';

/**
 * Location data interface
 */
export interface Location extends DocumentData {
  id?: string;
  worldId: string;
  campaignId: string;
  name: string;
  locationType: string; // Settlement, Dungeon, Wilderness, Building, Landmark
  description: string;
  createdBy: string; // User ID
  createdAt?: any; // Timestamp
  updatedAt?: any; // Timestamp
  imageURL?: string;
  characterCount?: number; // Number of characters at this location
  itemCount?: number; // Number of items at this location
  relationshipCount?: number; // Number of relationships
}

/**
 * Service for location-related operations
 */
export class LocationService extends FirestoreService<Location> {
  private campaignService: CampaignService;
  private rpgWorldService: RPGWorldService;
  private apiService: LocationAPIService;
  private useAPI: boolean = false; // Flag to determine whether to use API or Firestore
  private worldId: string;
  private campaignId: string;
  private static instances: { [key: string]: LocationService } = {};

  /**
   * Get a LocationService instance for a specific campaign
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns LocationService instance
   */
  public static getInstance(worldId: string, campaignId: string): LocationService {
    const key = `${worldId}:${campaignId}`;
    if (!this.instances[key]) {
      this.instances[key] = new LocationService(worldId, campaignId);
    }
    return this.instances[key];
  }

  /**
   * Create a new LocationService
   * @param worldId World ID
   * @param campaignId Campaign ID
   */
  private constructor(worldId: string, campaignId: string) {
    super('locations');
    this.worldId = worldId;
    this.campaignId = campaignId;
    this.campaignService = new CampaignService();
    this.rpgWorldService = new RPGWorldService();

    // Initialize API service
    this.apiService = new LocationAPIService();

    // Determine whether to use API or Firestore based on configuration
    this.useAPI = API_CONFIG.USE_API;
  }

  /**
   * Override getById to use API service when useAPI is true
   * @param id Entity ID
   * @param options Query options
   * @returns Entity or null
   */
  async getById(
    id: string,
    options: {
      forceServer?: boolean;
      useCache?: boolean;
      cacheTTL?: number;
      skipTransform?: boolean;
      maxRetries?: number;
      trackPerformance?: boolean;
    } = {}
  ): Promise<Location | null> {
    let location: Location | null = null;

    if (this.useAPI) {
      try {
        location = await this.apiService.getLocation(id);
      } catch (error) {
        console.error(`Error fetching location ${id} from API:`, error);
        // Fall back to Firestore
      }
    }

    if (!location) {
      // Fall back to Firestore
      location = await super.getById(id, options);
    }

    if (location) {
      // Add entityType to the location
      return {
        ...location,
        entityType: EntityType.LOCATION,
        locationType: location.locationType || location.type || 'Other'
      };
    }

    return null;
  }

  /**
   * Override query to use API service when useAPI is true
   * @param constraints Query constraints
   * @param pageSize Page size
   * @param startAfterDoc Start after document
   * @param options Query options
   * @returns Query result
   */
  async query(
    constraints: QueryConstraint[] = [],
    pageSize: number = 10,
    startAfterDoc?: DocumentSnapshot<DocumentData>,
    options: {
      forceServer?: boolean;
      source?: 'default' | 'server' | 'cache';
      useCache?: boolean;
      cacheTTL?: number;
    } = {}
  ): Promise<{
    data: Location[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    source: 'server' | 'cache';
  }> {
    if (this.useAPI) {
      try {
        const locations = await this.apiService.getAllLocations(this.worldId, this.campaignId);

        // Apply constraints manually (simplified version)
        let filteredLocations = [...locations];

        // Return the result
        return {
          data: filteredLocations.slice(0, pageSize),
          lastDoc: null, // API doesn't support pagination in the same way as Firestore
          source: 'server'
        };
      } catch (error) {
        console.error(`Error fetching locations from API:`, error);
        // Fall back to Firestore
        return super.query(constraints, pageSize, startAfterDoc, options);
      }
    }

    // Use Firestore
    return super.query(constraints, pageSize, startAfterDoc, options);
  }

  /**
   * Override create to use API service when useAPI is true
   * @param data Entity data
   * @param id Document ID (optional)
   * @param options Options for the operation
   * @returns Entity ID
   */
  async create(
    data: Location,
    id?: string,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Location) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<string> {
    if (this.useAPI) {
      try {
        const location = await this.apiService.createLocation(data, this.worldId, this.campaignId);
        return location.id!;
      } catch (error) {
        console.error(`Error creating location via API:`, error);
        // Fall back to Firestore
        return super.create(data, id, options);
      }
    }

    // Use Firestore
    return super.create(data, id, options);
  }

  /**
   * Override update to use API service when useAPI is true
   * @param id Entity ID
   * @param data Entity data
   * @param options Options for the operation
   * @returns True if successful
   */
  async update(
    id: string,
    data: Partial<Location>,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Partial<Location>) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<boolean> {
    if (this.useAPI) {
      try {
        await this.apiService.updateLocation(id, data);
        return true;
      } catch (error) {
        console.error(`Error updating location ${id} via API:`, error);
        // Fall back to Firestore
        return super.update(id, data, options);
      }
    }

    // Use Firestore
    return super.update(id, data, options);
  }

  /**
   * Get locations by type
   * @param type Location type
   * @returns Array of locations
   */
  async getLocationsByType(type: string): Promise<Location[]> {
    if (this.useAPI) {
      try {
        const locations = await this.apiService.getAllLocations(this.worldId, this.campaignId);
        return locations.filter(location => location.locationType === type);
      } catch (error) {
        console.error(`Error fetching locations by type from API:`, error);
        // Fall back to Firestore
      }
    }

    // Use Firestore
    const { data } = await this.query([
      where('locationType', '==', type),
      orderBy('name', 'asc')
    ]);

    return data;
  }

  /**
   * Get entity with relationships
   * @param entityId Entity ID
   * @returns Entity with relationship count
   */
  async getEntityWithRelationships(entityId: string): Promise<Location & { relationshipCount?: number }> {
    try {
      // Get the entity
      const entity = await this.getById(entityId);

      if (!entity) {
        throw new Error(`Entity not found: ${entityId}`);
      }

      // Get relationship count
      const entityRelationshipsService = new EntityRelationshipsService(entity.campaignId, entity.worldId);
      const relationships = await entityRelationshipsService.getEntityRelationships(
        entityId,
        EntityType.LOCATION
      );

      return {
        ...entity,
        relationshipCount: relationships.length
      };
    } catch (error) {
      console.error(`Error getting entity with relationships: ${entityId}`, error);
      throw error;
    }
  }

  /**
   * Create a new location
   * @param location Location data
   * @returns Created location ID
   */
  async createLocation(location: Location): Promise<string> {
    try {
      // Create the location
      const locationId = await this.create(location);

      // Update location counts
      await this.updateLocationCounts(locationId, 1);

      return locationId;
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  }

  /**
   * Delete a location
   * @param locationId Location ID
   * @param options Options for the operation
   * @returns True if successful
   */
  async delete(
    locationId: string,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      trackPerformance?: boolean;
    } = {}
  ): Promise<boolean> {
    try {
      if (this.useAPI) {
        try {
          // Use API service to delete the location
          const success = await this.apiService.deleteLocation(locationId);

          if (success) {
            // Update campaign and world location counts
            await this.updateLocationCounts(locationId, -1);
          }

          return success;
        } catch (error) {
          console.error(`Error deleting location ${locationId} via API:`, error);
          // Fall back to Firestore
        }
      }

      // Get the location to get campaign and world IDs
      const location = await this.getById(locationId);
      if (!location) {
        throw new Error(`Location with ID ${locationId} not found`);
      }

      // Delete the location
      await super.delete(locationId, options);

      // Update campaign location count
      if (location.campaignId) {
        const campaign = await this.campaignService.getById(location.campaignId);
        if (campaign && campaign.locationCount && campaign.locationCount > 0) {
          await this.campaignService.update(location.campaignId, {
            locationCount: campaign.locationCount - 1
          });
        }
      }

      // Update world location count
      if (location.worldId) {
        const world = await this.rpgWorldService.getById(location.worldId);
        if (world && world.locationCount && world.locationCount > 0) {
          await this.rpgWorldService.update(location.worldId, {
            locationCount: world.locationCount - 1
          });
        }
      }

      return true;
    } catch (error) {
      console.error(`Error deleting location ${locationId}:`, error);
      throw error;
    }
  }

  /**
   * Get entity by ID (alias for getById for compatibility)
   * @param id Entity ID
   * @param options Query options
   * @returns Entity or null
   */
  async getEntity(
    id: string,
    options: {
      forceServer?: boolean;
      useCache?: boolean;
      cacheTTL?: number;
      skipTransform?: boolean;
      maxRetries?: number;
      trackPerformance?: boolean;
    } = {}
  ): Promise<Location | null> {
    return this.getById(id, options);
  }

  /**
   * List all entities (alias for query for compatibility)
   * @param options Query options
   * @returns Array of entities
   */
  async listEntities(
    options: {
      forceServer?: boolean;
      source?: 'default' | 'server' | 'cache';
      useCache?: boolean;
      cacheTTL?: number;
      pageSize?: number;
    } = {}
  ): Promise<Location[]> {
    const { data } = await this.query(
      [orderBy('name', 'asc')],
      options.pageSize || 100,
      undefined,
      {
        forceServer: options.forceServer,
        source: options.source,
        useCache: options.useCache,
        cacheTTL: options.cacheTTL
      }
    );

    // Add entityType to each location
    return data.map(location => ({
      ...location,
      entityType: EntityType.LOCATION,
      locationType: location.locationType || location.type || 'Other'
    }));
  }

  /**
   * Create entity (alias for create for compatibility)
   * @param data Entity data
   * @param options Options for the operation
   * @returns Entity ID
   */
  async createEntity(
    data: Location,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Location) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<string> {
    return this.create(data, undefined, options);
  }

  /**
   * Update entity (alias for update for compatibility)
   * @param id Entity ID
   * @param data Entity data
   * @param options Options for the operation
   * @returns True if successful
   */
  async updateEntity(
    id: string,
    data: Partial<Location>,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Partial<Location>) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<boolean> {
    return this.update(id, data, options);
  }

  /**
   * Delete entity (alias for delete for compatibility)
   * @param id Entity ID
   * @param options Options for the operation
   * @returns True if successful
   */
  async deleteEntity(
    id: string,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      trackPerformance?: boolean;
    } = {}
  ): Promise<boolean> {
    return this.delete(id, options);
  }

  /**
   * Update location counts in campaign and world
   * @param locationId Location ID
   * @param change Change amount (1 for increment, -1 for decrement)
   */
  private async updateLocationCounts(locationId: string, change: number): Promise<void> {
    try {
      // Get the location to get campaign and world IDs
      const location = await this.getById(locationId);
      if (!location) {
        return;
      }

      // Update campaign location count
      if (location.campaignId) {
        const campaign = await this.campaignService.getById(location.campaignId);
        if (campaign) {
          await this.campaignService.update(location.campaignId, {
            locationCount: Math.max(0, (campaign.locationCount || 0) + change)
          });
        }
      }

      // Update world location count
      if (location.worldId) {
        const world = await this.rpgWorldService.getById(location.worldId);
        if (world) {
          await this.rpgWorldService.update(location.worldId, {
            locationCount: Math.max(0, (world.locationCount || 0) + change)
          });
        }
      }
    } catch (error) {
      console.error(`Error updating location counts for ${locationId}:`, error);
    }
  }
}
