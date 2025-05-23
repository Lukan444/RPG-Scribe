import { orderBy, where, QueryConstraint } from 'firebase/firestore';
import { EntityService } from './entity.service';
import { Note, NoteType } from '../models/Note';
import { EntityType } from '../models/EntityType';
import { API_CONFIG } from '../config/api.config';

/**
 * API Service for note operations (mock implementation)
 */
class NoteAPIService {
  async getNote(id: string): Promise<Note | null> {
    console.log(`API: Getting note ${id}`);
    return null;
  }

  async listNotes(worldId: string, campaignId: string): Promise<Note[]> {
    console.log(`API: Listing notes for world ${worldId} and campaign ${campaignId}`);
    return [];
  }

  async createNote(data: Note, worldId: string, campaignId: string): Promise<Note> {
    console.log(`API: Creating note in world ${worldId} and campaign ${campaignId}`);
    return { ...data, id: 'api-generated-id' };
  }

  async updateNote(id: string, data: Partial<Note>): Promise<boolean> {
    console.log(`API: Updating note ${id}`);
    return true;
  }

  async deleteNote(id: string): Promise<boolean> {
    console.log(`API: Deleting note ${id}`);
    return true;
  }
}

/**
 * Service for note-related operations
 */
export class NoteService extends EntityService<Note> {
  private static instances: { [key: string]: NoteService } = {};
  private apiService: NoteAPIService;
  private useAPI: boolean = false; // Flag to determine whether to use API or Firestore

  /**
   * Get a NoteService instance for a specific campaign
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns NoteService instance
   */
  public static getInstance(worldId: string, campaignId: string): NoteService {
    const key = `${worldId}:${campaignId}`;
    if (!this.instances[key]) {
      this.instances[key] = new NoteService(worldId, campaignId);
    }
    return this.instances[key];
  }

  /**
   * Create a new NoteService
   * @param worldId World ID
   * @param campaignId Campaign ID
   */
  private constructor(worldId: string, campaignId: string) {
    super(worldId, campaignId, 'notes', EntityType.NOTE as any, {
      cachingEnabled: true,
      defaultCacheTTL: 5 * 60 * 1000 // 5 minutes
    });

    // Initialize API service
    this.apiService = new NoteAPIService();

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
  ): Promise<Note | null> {
    if (this.useAPI) {
      try {
        return await this.apiService.getNote(id);
      } catch (error) {
        console.error(`Error fetching note ${id} from API:`, error);
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
    data: Note,
    id?: string,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Note) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<string> {
    if (this.useAPI) {
      try {
        const note = await this.apiService.createNote(data, this.worldId, this.campaignId);
        return note.id!;
      } catch (error) {
        console.error(`Error creating note via API:`, error);
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
    data: Partial<Note>,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Partial<Note>) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<boolean> {
    if (this.useAPI) {
      try {
        await this.apiService.updateNote(id, data);
        return true;
      } catch (error) {
        console.error(`Error updating note ${id} via API:`, error);
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
        return await this.apiService.deleteNote(id);
      } catch (error) {
        console.error(`Error deleting note ${id} via API:`, error);
        // Fall back to Firestore
        return super.delete(id, options);
      }
    }

    // Use Firestore
    return super.delete(id, options);
  }

  /**
   * Get notes by type
   * @param type Note type
   * @returns Array of notes
   */
  async getNotesByType(type: NoteType): Promise<Note[]> {
    const { data } = await this.query([
      where('noteType', '==', type),
      orderBy('updatedAt', 'desc')
    ]);
    return data;
  }

  /**
   * Get notes by related entity
   * @param entityId Related entity ID
   * @param entityType Related entity type
   * @returns Array of notes
   */
  async getNotesByRelatedEntity(entityId: string, entityType: string): Promise<Note[]> {
    const { data } = await this.query([
      where('relatedEntityId', '==', entityId),
      where('relatedEntityType', '==', entityType),
      orderBy('updatedAt', 'desc')
    ]);
    return data;
  }

  /**
   * Get public notes
   * @returns Array of public notes
   */
  async getPublicNotes(): Promise<Note[]> {
    const { data } = await this.query([
      where('isPrivate', '==', false),
      orderBy('updatedAt', 'desc')
    ]);
    return data;
  }

  /**
   * Get private notes
   * @param userId User ID
   * @returns Array of private notes
   */
  async getPrivateNotes(userId: string): Promise<Note[]> {
    const { data } = await this.query([
      where('isPrivate', '==', true),
      where('createdBy', '==', userId),
      orderBy('updatedAt', 'desc')
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
  ): Promise<Note | null> {
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
  ): Promise<Note[]> {
    const { data } = await this.query(
      [orderBy('updatedAt', 'desc')],
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
    data: Note,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Note) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<string> {
    return this.create(data, undefined, options);
  }
}
