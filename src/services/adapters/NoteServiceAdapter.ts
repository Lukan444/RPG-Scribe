/**
 * Note Service Adapter
 * 
 * This adapter wraps the NoteService to implement the IEntityService interface.
 */

import { DocumentData, DocumentSnapshot, QueryConstraint, QueryDocumentSnapshot } from 'firebase/firestore';
import { Note, NoteType } from '../../models/Note';
import { EntityType } from '../../models/EntityType';
import { NoteService } from '../note.service';
import { IEntityService } from '../interfaces/EntityService.interface';
import { CountOptions } from '../enhanced-firestore.service';

/**
 * Note service adapter class
 */
export class NoteServiceAdapter implements IEntityService<Note> {
  private noteService: NoteService;
  private worldId: string;
  private campaignId: string;

  /**
   * Create a new NoteServiceAdapter
   * @param worldId World ID
   * @param campaignId Campaign ID
   */
  constructor(worldId: string, campaignId: string) {
    this.noteService = NoteService.getInstance(worldId, campaignId);
    this.worldId = worldId;
    this.campaignId = campaignId;
  }

  /**
   * Get the entity type
   * @returns Entity type
   */
  getEntityType(): EntityType {
    return EntityType.NOTE;
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
   * Get a note by ID
   * @param id Note ID
   * @param options Options for the operation
   * @returns Note data or null if not found
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
  ): Promise<Note | null> {
    const note = await this.noteService.getById(id);
    
    if (note) {
      // Convert from service Note to model Note
      return {
        ...note,
        entityType: EntityType.NOTE
      } as Note;
    }
    
    return null;
  }

  /**
   * Get multiple notes by their IDs
   * @param ids Array of note IDs
   * @returns Array of note data
   */
  async getByIds(ids: string[]): Promise<Note[]> {
    const notes: Note[] = [];
    
    for (const id of ids) {
      const note = await this.noteService.getById(id);
      if (note) {
        notes.push({
          ...note,
          entityType: EntityType.NOTE
        } as Note);
      }
    }
    
    return notes;
  }

  /**
   * Create a new note
   * @param data Note data
   * @param id Document ID (optional)
   * @param options Options for the operation
   * @returns Note ID
   */
  async create(
    data: Note,
    id?: string,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Note) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    }
  ): Promise<string> {
    // Convert from model Note to service Note
    const serviceNote = {
      ...data,
      worldId: this.worldId,
      campaignId: this.campaignId
    };
    
    // We need to use any type to bypass TypeScript's type checking
    // since the service and model types are incompatible
    return this.noteService.create(serviceNote as any, id, options as any);
  }

  /**
   * Update a note
   * @param id Note ID
   * @param data Note data to update
   * @param options Options for the operation
   * @returns True if successful
   */
  async update(
    id: string,
    data: Partial<Note>,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
    }
  ): Promise<boolean> {
    return this.noteService.update(id, data, options as any);
  }

  /**
   * Delete a note
   * @param id Note ID
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
    return this.noteService.delete(id, options as any);
  }

  /**
   * Query notes with pagination
   * @param constraints Query constraints (where, orderBy, etc.)
   * @param pageSize Number of notes to return
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
    data: Note[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    source: 'server' | 'cache';
  }> {
    const result = await this.noteService.query(constraints, pageSize, startAfterDoc, options);
    
    // Convert from service Note to model Note
    const convertedData = result.data.map(note => ({
      ...note,
      entityType: EntityType.NOTE
    } as Note));
    
    return {
      ...result,
      data: convertedData
    };
  }

  /**
   * Get the count of notes matching the constraints
   * @param queryName Name of the query for caching
   * @param constraints Query constraints
   * @param options Count options
   * @returns Count of matching notes
   */
  async getCount(
    queryName: string,
    constraints?: QueryConstraint[],
    options?: CountOptions
  ): Promise<number> {
    // Implement a fallback since noteService might not have getCount
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
   * Get the relationship count for a note
   * @param entityId Note ID
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
   * List all notes (alias for query for compatibility)
   * @param options Query options
   * @returns Array of notes
   */
  async listEntities(
    options?: {
      forceServer?: boolean;
      source?: 'default' | 'server' | 'cache';
      useCache?: boolean;
      cacheTTL?: number;
      pageSize?: number;
    }
  ): Promise<Note[]> {
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
   * Create note (alias for create for compatibility)
   * @param data Note data
   * @param options Options for the operation
   * @returns Note ID
   */
  async createEntity(
    data: Note,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Note) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    }
  ): Promise<string> {
    return this.create(data, undefined, options);
  }

  /**
   * Subscribe to real-time updates for a note
   * @param id Note ID
   * @param callback Function to call when note changes
   * @param options Options for the subscription
   * @returns Unsubscribe function
   */
  subscribeToEntity(
    id: string,
    callback: (data: Note | null) => void,
    options?: {
      listenerId?: string;
      onError?: (error: Error) => void;
    }
  ): () => void {
    // Create a wrapper callback that converts the service Note to model Note
    const wrappedCallback = (note: any | null) => {
      if (note) {
        const modelNote = {
          ...note,
          entityType: EntityType.NOTE
        } as Note;
        callback(modelNote);
      } else {
        callback(null);
      }
    };
    
    return this.noteService.subscribeToDocument(id, wrappedCallback, options);
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
    callback: (data: Note[]) => void,
    options?: {
      queryId?: string;
      listenerId?: string;
      onError?: (error: Error) => void;
    }
  ): () => void {
    // Create a wrapper callback that converts the service Notes to model Notes
    const wrappedCallback = (notes: any[]) => {
      const modelNotes = notes.map(note => ({
        ...note,
        entityType: EntityType.NOTE
      } as Note));
      
      callback(modelNotes);
    };
    
    return this.noteService.subscribeToQuery(constraints, wrappedCallback, options);
  }
}
