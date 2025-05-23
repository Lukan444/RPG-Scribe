import { orderBy, where, QueryConstraint } from 'firebase/firestore';
import { EntityService } from './entity.service';
import { StoryArc, StoryArcType, StoryArcStatus, Clue } from '../models/StoryArc';
import { EntityType } from '../models/EntityType';
import { API_CONFIG } from '../config/api.config';

/**
 * API Service for story arc operations (mock implementation)
 */
class StoryArcAPIService {
  async getStoryArc(id: string): Promise<StoryArc | null> {
    console.log(`API: Getting story arc ${id}`);
    return null;
  }

  async listStoryArcs(worldId: string, campaignId: string): Promise<StoryArc[]> {
    console.log(`API: Listing story arcs for world ${worldId} and campaign ${campaignId}`);
    return [];
  }

  async createStoryArc(data: StoryArc, worldId: string, campaignId: string): Promise<StoryArc> {
    console.log(`API: Creating story arc in world ${worldId} and campaign ${campaignId}`);
    return { ...data, id: 'api-generated-id' };
  }

  async updateStoryArc(id: string, data: Partial<StoryArc>): Promise<boolean> {
    console.log(`API: Updating story arc ${id}`);
    return true;
  }

  async deleteStoryArc(id: string): Promise<boolean> {
    console.log(`API: Deleting story arc ${id}`);
    return true;
  }
}

/**
 * Service for story arc-related operations
 */
export class StoryArcService extends EntityService<StoryArc> {
  private static instances: { [key: string]: StoryArcService } = {};
  private apiService: StoryArcAPIService;
  private useAPI: boolean = false; // Flag to determine whether to use API or Firestore

  /**
   * Get a StoryArcService instance for a specific campaign
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns StoryArcService instance
   */
  public static getInstance(worldId: string, campaignId: string): StoryArcService {
    const key = `${worldId}:${campaignId}`;
    if (!this.instances[key]) {
      this.instances[key] = new StoryArcService(worldId, campaignId);
    }
    return this.instances[key];
  }

  /**
   * Create a new StoryArcService
   * @param worldId World ID
   * @param campaignId Campaign ID
   */
  private constructor(worldId: string, campaignId: string) {
    super(worldId, campaignId, 'storyArcs', EntityType.STORY_ARC as any, {
      cachingEnabled: true,
      defaultCacheTTL: 5 * 60 * 1000 // 5 minutes
    });

    // Initialize API service
    this.apiService = new StoryArcAPIService();

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
  ): Promise<StoryArc | null> {
    if (this.useAPI) {
      try {
        return await this.apiService.getStoryArc(id);
      } catch (error) {
        console.error(`Error fetching story arc ${id} from API:`, error);
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
    data: StoryArc,
    id?: string,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: StoryArc) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<string> {
    if (this.useAPI) {
      try {
        const storyArc = await this.apiService.createStoryArc(data, this.worldId, this.campaignId);
        return storyArc.id!;
      } catch (error) {
        console.error(`Error creating story arc via API:`, error);
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
    data: Partial<StoryArc>,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Partial<StoryArc>) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<boolean> {
    if (this.useAPI) {
      try {
        await this.apiService.updateStoryArc(id, data);
        return true;
      } catch (error) {
        console.error(`Error updating story arc ${id} via API:`, error);
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
        return await this.apiService.deleteStoryArc(id);
      } catch (error) {
        console.error(`Error deleting story arc ${id} via API:`, error);
        // Fall back to Firestore
        return super.delete(id, options);
      }
    }

    // Use Firestore
    return super.delete(id, options);
  }

  /**
   * Get story arcs by type
   * @param type Story arc type
   * @returns Array of story arcs
   */
  async getStoryArcsByType(type: StoryArcType): Promise<StoryArc[]> {
    const { data } = await this.query([
      where('arcType', '==', type),
      orderBy('name', 'asc')
    ]);
    return data;
  }

  /**
   * Get story arcs by status
   * @param status Story arc status
   * @returns Array of story arcs
   */
  async getStoryArcsByStatus(status: StoryArcStatus): Promise<StoryArc[]> {
    const { data } = await this.query([
      where('status', '==', status),
      orderBy('name', 'asc')
    ]);
    return data;
  }

  /**
   * Get story arcs by parent arc
   * @param parentArcId Parent story arc ID
   * @returns Array of story arcs
   */
  async getStoryArcsByParent(parentArcId: string): Promise<StoryArc[]> {
    const { data } = await this.query([
      where('parentArcId', '==', parentArcId),
      orderBy('name', 'asc')
    ]);
    return data;
  }

  /**
   * Get story arcs by character
   * @param characterId Character ID
   * @returns Array of story arcs
   */
  async getStoryArcsByCharacter(characterId: string): Promise<StoryArc[]> {
    const { data } = await this.query([
      where('characterIds', 'array-contains', characterId),
      orderBy('name', 'asc')
    ]);
    return data;
  }

  /**
   * Get story arcs by session
   * @param sessionId Session ID
   * @returns Array of story arcs
   */
  async getStoryArcsBySession(sessionId: string): Promise<StoryArc[]> {
    const { data } = await this.query([
      where('relatedSessionIds', 'array-contains', sessionId),
      orderBy('name', 'asc')
    ]);
    return data;
  }

  /**
   * Add a clue to a story arc
   * @param storyArcId Story arc ID
   * @param clue Clue to add
   * @returns True if successful
   */
  async addClue(storyArcId: string, clue: Clue): Promise<boolean> {
    try {
      const storyArc = await this.getById(storyArcId);
      if (!storyArc) {
        return false;
      }

      const clues = storyArc.clues || [];
      clues.push(clue);

      return await this.update(storyArcId, { clues });
    } catch (error) {
      console.error(`Error adding clue to story arc ${storyArcId}:`, error);
      return false;
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
  ): Promise<StoryArc | null> {
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
  ): Promise<StoryArc[]> {
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
   * @returns Entity ID
   */
  async createEntity(
    data: StoryArc,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: StoryArc) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<string> {
    return this.create(data, undefined, options);
  }
}
