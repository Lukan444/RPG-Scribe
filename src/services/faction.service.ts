import { orderBy, where, QueryConstraint } from 'firebase/firestore';
import { EntityService } from './entity.service';
import { Faction, FactionType, FactionRelationship } from '../models/Faction';
import { EntityType } from '../models/EntityType';
import { API_CONFIG } from '../config/api.config';

/**
 * API Service for faction operations (mock implementation)
 */
class FactionAPIService {
  async getFaction(id: string): Promise<Faction | null> {
    console.log(`API: Getting faction ${id}`);
    return null;
  }

  async listFactions(worldId: string, campaignId: string): Promise<Faction[]> {
    console.log(`API: Listing factions for world ${worldId} and campaign ${campaignId}`);
    return [];
  }

  async createFaction(data: Faction, worldId: string, campaignId: string): Promise<Faction> {
    console.log(`API: Creating faction in world ${worldId} and campaign ${campaignId}`);
    return { ...data, id: 'api-generated-id' };
  }

  async updateFaction(id: string, data: Partial<Faction>): Promise<boolean> {
    console.log(`API: Updating faction ${id}`);
    return true;
  }

  async deleteFaction(id: string): Promise<boolean> {
    console.log(`API: Deleting faction ${id}`);
    return true;
  }
}

/**
 * Service for faction-related operations
 */
export class FactionService extends EntityService<Faction> {
  private static instances: { [key: string]: FactionService } = {};
  private apiService: FactionAPIService;
  private useAPI: boolean = false; // Flag to determine whether to use API or Firestore

  /**
   * Get a FactionService instance for a specific campaign
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns FactionService instance
   */
  public static getInstance(worldId: string, campaignId: string): FactionService {
    const key = `${worldId}:${campaignId}`;
    if (!this.instances[key]) {
      this.instances[key] = new FactionService(worldId, campaignId);
    }
    return this.instances[key];
  }

  /**
   * Create a new FactionService
   * @param worldId World ID
   * @param campaignId Campaign ID
   */
  private constructor(worldId: string, campaignId: string) {
    super(worldId, campaignId, 'factions', EntityType.FACTION as any, {
      cachingEnabled: true,
      defaultCacheTTL: 5 * 60 * 1000 // 5 minutes
    });

    // Initialize API service
    this.apiService = new FactionAPIService();

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
  ): Promise<Faction | null> {
    if (this.useAPI) {
      try {
        return await this.apiService.getFaction(id);
      } catch (error) {
        console.error(`Error fetching faction ${id} from API:`, error);
        return null;
      }
    }

    // Fall back to Firestore
    return super.getById(id, options);
  }

  /**
   * Override create to use API service when useAPI is true
   * @param data Entity data
   * @param id Document ID (optional)
   * @param options Options for the operation
   * @returns Entity ID
   */
  async create(
    data: Faction,
    id?: string,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Faction) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<string> {
    if (this.useAPI) {
      try {
        const faction = await this.apiService.createFaction(data, this.worldId, this.campaignId);
        return faction.id!;
      } catch (error) {
        console.error(`Error creating faction via API:`, error);
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
    data: Partial<Faction>,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Partial<Faction>) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<boolean> {
    if (this.useAPI) {
      try {
        await this.apiService.updateFaction(id, data);
        return true;
      } catch (error) {
        console.error(`Error updating faction ${id} via API:`, error);
        // Fall back to Firestore
        return super.update(id, data, options);
      }
    }

    // Use Firestore
    return super.update(id, data, options);
  }

  /**
   * Override delete to use API service when useAPI is true
   * @param id Entity ID
   * @param options Options for the operation
   * @returns True if successful
   */
  async delete(
    id: string,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      trackPerformance?: boolean;
    } = {}
  ): Promise<boolean> {
    if (this.useAPI) {
      try {
        return await this.apiService.deleteFaction(id);
      } catch (error) {
        console.error(`Error deleting faction ${id} via API:`, error);
        // Fall back to Firestore
        return super.delete(id, options);
      }
    }

    // Use Firestore
    return super.delete(id, options);
  }

  /**
   * Get factions by type
   * @param type Faction type
   * @returns Array of factions
   */
  async getFactionsByType(type: FactionType): Promise<Faction[]> {
    const { data } = await this.query([
      where('factionType', '==', type),
      orderBy('name', 'asc')
    ]);
    return data;
  }

  /**
   * Get factions by leader
   * @param leaderId Character ID of the leader
   * @returns Array of factions
   */
  async getFactionsByLeader(leaderId: string): Promise<Faction[]> {
    const { data } = await this.query([
      where('leaderId', '==', leaderId),
      orderBy('name', 'asc')
    ]);
    return data;
  }

  /**
   * Get factions by member
   * @param memberId Character ID of a member
   * @returns Array of factions
   */
  async getFactionsByMember(memberId: string): Promise<Faction[]> {
    const { data } = await this.query([
      where('memberIds', 'array-contains', memberId),
      orderBy('name', 'asc')
    ]);
    return data;
  }

  /**
   * Get factions by headquarters
   * @param headquartersId Location ID of the headquarters
   * @returns Array of factions
   */
  async getFactionsByHeadquarters(headquartersId: string): Promise<Faction[]> {
    const { data } = await this.query([
      where('headquartersId', '==', headquartersId),
      orderBy('name', 'asc')
    ]);
    return data;
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
  ): Promise<Faction | null> {
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
  ): Promise<Faction[]> {
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
    return data;
  }

  /**
   * Create entity (alias for create for compatibility)
   * @param data Entity data
   * @param options Options for the operation
   * @returns Entity or null
   */
  async createEntity(
    data: Faction,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Faction) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<string> {
    return this.create(data, undefined, options);
  }
}
