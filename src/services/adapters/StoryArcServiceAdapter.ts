/**
 * Story Arc Service Adapter
 * 
 * This adapter wraps the StoryArcService to implement the IEntityService interface.
 */

import { DocumentData, DocumentSnapshot, QueryConstraint, QueryDocumentSnapshot } from 'firebase/firestore';
import { StoryArc, StoryArcType, StoryArcStatus } from '../../models/StoryArc';
import { EntityType } from '../../models/EntityType';
import { StoryArcService } from '../storyArc.service';
import { IEntityService } from '../interfaces/EntityService.interface';
import { CountOptions } from '../enhanced-firestore.service';

/**
 * Story Arc service adapter class
 */
export class StoryArcServiceAdapter implements IEntityService<StoryArc> {
  private storyArcService: StoryArcService;
  private worldId: string;
  private campaignId: string;

  /**
   * Create a new StoryArcServiceAdapter
   * @param worldId World ID
   * @param campaignId Campaign ID
   */
  constructor(worldId: string, campaignId: string) {
    this.storyArcService = StoryArcService.getInstance(worldId, campaignId);
    this.worldId = worldId;
    this.campaignId = campaignId;
  }

  /**
   * Convert Firestore Timestamp to date string
   * @param timestamp Firestore Timestamp or date string
   * @returns Formatted date string
   */
  private convertTimestampToDateString(timestamp: any): string {
    try {
      // Handle Firestore Timestamp objects
      if (timestamp && typeof timestamp === 'object' && timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
      }
      // Handle regular Date objects
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      }
      // Handle date strings
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString();
      }
      // Fallback
      return 'Invalid Date';
    } catch (error) {
      console.error('Error converting timestamp:', error);
      return 'Invalid Date';
    }
  }

  /**
   * Get the entity type
   * @returns Entity type
   */
  getEntityType(): EntityType {
    return EntityType.STORY_ARC;
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
   * Get a story arc by ID
   * @param id Story Arc ID
   * @param options Options for the operation
   * @returns Story Arc data or null if not found
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
  ): Promise<StoryArc | null> {
    const storyArc = await this.storyArcService.getById(id);
    
    if (storyArc) {
      // Convert from service StoryArc to model StoryArc with proper field mapping
      return {
        ...storyArc,
        entityType: EntityType.STORY_ARC,
        // Convert Firestore Timestamps to formatted date strings for React rendering
        createdAt: storyArc.createdAt ? this.convertTimestampToDateString(storyArc.createdAt) : undefined,
        updatedAt: storyArc.updatedAt ? this.convertTimestampToDateString(storyArc.updatedAt) : undefined
      } as StoryArc;
    }
    
    return null;
  }

  /**
   * Get multiple story arcs by their IDs
   * @param ids Array of story arc IDs
   * @returns Array of story arc data
   */
  async getByIds(ids: string[]): Promise<StoryArc[]> {
    const storyArcs = await this.storyArcService.getByIds(ids);
    
    // Convert from service StoryArc to model StoryArc with proper field mapping
    return storyArcs.map(storyArc => ({
      ...storyArc,
      entityType: EntityType.STORY_ARC,
      // Convert Firestore Timestamps to formatted date strings for React rendering
      createdAt: storyArc.createdAt ? this.convertTimestampToDateString(storyArc.createdAt) : undefined,
      updatedAt: storyArc.updatedAt ? this.convertTimestampToDateString(storyArc.updatedAt) : undefined
    } as StoryArc));
  }

  /**
   * Create a new story arc
   * @param data Story Arc data
   * @param id Document ID (optional)
   * @param options Options for the operation
   * @returns Story Arc ID
   */
  async create(
    data: StoryArc,
    id?: string,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: StoryArc) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    }
  ): Promise<string> {
    // Convert from model StoryArc to service StoryArc
    const serviceStoryArc = {
      ...data,
      worldId: this.worldId,
      campaignId: this.campaignId
    };
    
    // We need to use any type to bypass TypeScript's type checking
    // since the service and model types are incompatible
    return this.storyArcService.create(serviceStoryArc as any, id, options as any);
  }

  /**
   * Update a story arc
   * @param id Story Arc ID
   * @param data Story Arc data to update
   * @param options Options for the operation
   * @returns True if successful
   */
  async update(
    id: string,
    data: Partial<StoryArc>,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
    }
  ): Promise<boolean> {
    return this.storyArcService.update(id, data, options as any);
  }

  /**
   * Delete a story arc
   * @param id Story Arc ID
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
    return this.storyArcService.delete(id, options as any);
  }

  /**
   * Query story arcs with pagination
   * @param constraints Query constraints (where, orderBy, etc.)
   * @param pageSize Number of story arcs to return
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
    data: StoryArc[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    source: 'server' | 'cache';
  }> {
    const result = await this.storyArcService.query(constraints, pageSize, startAfterDoc, options);
    
    // Convert from service StoryArc to model StoryArc with proper field mapping
    const convertedData = result.data.map(storyArc => ({
      ...storyArc,
      entityType: EntityType.STORY_ARC,
      // Convert Firestore Timestamps to formatted date strings for React rendering
      createdAt: storyArc.createdAt ? this.convertTimestampToDateString(storyArc.createdAt) : undefined,
      updatedAt: storyArc.updatedAt ? this.convertTimestampToDateString(storyArc.updatedAt) : undefined
    } as StoryArc));
    
    return {
      ...result,
      data: convertedData
    };
  }

  /**
   * Get the count of story arcs matching the constraints
   * @param queryName Name of the query for caching
   * @param constraints Query constraints
   * @param options Count options
   * @returns Count of matching story arcs
   */
  async getCount(
    queryName: string,
    constraints?: QueryConstraint[],
    options?: CountOptions
  ): Promise<number> {
    // Implement a fallback since storyArcService might not have getCount
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
   * Get the relationship count for a story arc
   * @param entityId Story Arc ID
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
   * List all story arcs (alias for query for compatibility)
   * @param options Query options
   * @returns Array of story arcs
   */
  async listEntities(
    options?: {
      forceServer?: boolean;
      source?: 'default' | 'server' | 'cache';
      useCache?: boolean;
      cacheTTL?: number;
      pageSize?: number;
    }
  ): Promise<StoryArc[]> {
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
   * Create story arc (alias for create for compatibility)
   * @param data Story Arc data
   * @param options Options for the operation
   * @returns Story Arc ID
   */
  async createEntity(
    data: StoryArc,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: StoryArc) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    }
  ): Promise<string> {
    return this.create(data, undefined, options);
  }

  /**
   * Subscribe to real-time updates for a story arc
   * @param id Story Arc ID
   * @param callback Function to call when story arc changes
   * @param options Options for the subscription
   * @returns Unsubscribe function
   */
  subscribeToEntity(
    id: string,
    callback: (data: StoryArc | null) => void,
    options?: {
      listenerId?: string;
      onError?: (error: Error) => void;
    }
  ): () => void {
    // Create a wrapper callback that converts the service StoryArc to model StoryArc
    const wrappedCallback = (storyArc: any | null) => {
      if (storyArc) {
        const modelStoryArc = {
          ...storyArc,
          entityType: EntityType.STORY_ARC,
          // Convert Firestore Timestamps to formatted date strings for React rendering
          createdAt: storyArc.createdAt ? this.convertTimestampToDateString(storyArc.createdAt) : undefined,
          updatedAt: storyArc.updatedAt ? this.convertTimestampToDateString(storyArc.updatedAt) : undefined
        } as StoryArc;
        callback(modelStoryArc);
      } else {
        callback(null);
      }
    };
    
    return this.storyArcService.subscribeToDocument(id, wrappedCallback, options);
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
    callback: (data: StoryArc[]) => void,
    options?: {
      queryId?: string;
      listenerId?: string;
      onError?: (error: Error) => void;
    }
  ): () => void {
    // Create a wrapper callback that converts the service StoryArcs to model StoryArcs
    const wrappedCallback = (storyArcs: any[]) => {
      const modelStoryArcs = storyArcs.map(storyArc => ({
        ...storyArc,
        entityType: EntityType.STORY_ARC,
        // Convert Firestore Timestamps to formatted date strings for React rendering
        createdAt: storyArc.createdAt ? this.convertTimestampToDateString(storyArc.createdAt) : undefined,
        updatedAt: storyArc.updatedAt ? this.convertTimestampToDateString(storyArc.updatedAt) : undefined
      } as StoryArc));

      callback(modelStoryArcs);
    };
    
    return this.storyArcService.subscribeToQuery(constraints, wrappedCallback, options);
  }
}
