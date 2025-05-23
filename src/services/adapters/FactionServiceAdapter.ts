/**
 * Faction Service Adapter
 * 
 * This adapter wraps the FactionService to implement the IEntityService interface.
 */

import { DocumentData, DocumentSnapshot, QueryConstraint, QueryDocumentSnapshot } from 'firebase/firestore';
import { Faction, FactionType } from '../../models/Faction';
import { EntityType } from '../../models/EntityType';
import { FactionService } from '../faction.service';
import { IEntityService } from '../interfaces/EntityService.interface';
import { CountOptions } from '../enhanced-firestore.service';

/**
 * Faction service adapter class
 */
export class FactionServiceAdapter implements IEntityService<Faction> {
  private factionService: FactionService;
  private worldId: string;
  private campaignId: string;

  /**
   * Create a new FactionServiceAdapter
   * @param worldId World ID
   * @param campaignId Campaign ID
   */
  constructor(worldId: string, campaignId: string) {
    this.factionService = FactionService.getInstance(worldId, campaignId);
    this.worldId = worldId;
    this.campaignId = campaignId;
  }

  /**
   * Get the entity type
   * @returns Entity type
   */
  getEntityType(): EntityType {
    return EntityType.FACTION;
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
   * Get a faction by ID
   * @param id Faction ID
   * @param options Options for the operation
   * @returns Faction data or null if not found
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
  ): Promise<Faction | null> {
    const faction = await this.factionService.getById(id, options);
    
    if (faction) {
      // Convert from service Faction to model Faction
      return {
        ...faction,
        entityType: EntityType.FACTION
      } as Faction;
    }
    
    return null;
  }

  /**
   * Get multiple factions by their IDs
   * @param ids Array of faction IDs
   * @returns Array of faction data
   */
  async getByIds(ids: string[]): Promise<Faction[]> {
    const factions = await this.factionService.getByIds(ids);
    
    // Convert from service Faction to model Faction
    return factions.map(faction => ({
      ...faction,
      entityType: EntityType.FACTION
    } as Faction));
  }

  /**
   * Create a new faction
   * @param data Faction data
   * @param id Document ID (optional)
   * @param options Options for the operation
   * @returns Faction ID
   */
  async create(
    data: Faction,
    id?: string,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Faction) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    }
  ): Promise<string> {
    // Convert from model Faction to service Faction
    const serviceFaction = {
      ...data,
      worldId: this.worldId,
      campaignId: this.campaignId
    };
    
    // We need to use any type to bypass TypeScript's type checking
    // since the service and model types are incompatible
    return this.factionService.create(serviceFaction as any, id, options as any);
  }

  /**
   * Update a faction
   * @param id Faction ID
   * @param data Faction data to update
   * @param options Options for the operation
   * @returns True if successful
   */
  async update(
    id: string,
    data: Partial<Faction>,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
    }
  ): Promise<boolean> {
    return this.factionService.update(id, data, options);
  }

  /**
   * Delete a faction
   * @param id Faction ID
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
    return this.factionService.delete(id, options);
  }

  /**
   * Query factions with pagination
   * @param constraints Query constraints (where, orderBy, etc.)
   * @param pageSize Number of factions to return
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
    data: Faction[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    source: 'server' | 'cache';
  }> {
    const result = await this.factionService.query(constraints, pageSize, startAfterDoc, options);
    
    // Convert from service Faction to model Faction
    const convertedData = result.data.map(faction => ({
      ...faction,
      entityType: EntityType.FACTION
    } as Faction));
    
    return {
      ...result,
      data: convertedData
    };
  }

  /**
   * Get the count of factions matching the constraints
   * @param queryName Name of the query for caching
   * @param constraints Query constraints
   * @param options Count options
   * @returns Count of matching factions
   */
  async getCount(
    queryName: string,
    constraints?: QueryConstraint[],
    options?: CountOptions
  ): Promise<number> {
    // Implement a fallback since factionService might not have getCount
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
   * Get the relationship count for a faction
   * @param entityId Faction ID
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
   * List all factions (alias for query for compatibility)
   * @param options Query options
   * @returns Array of factions
   */
  async listEntities(
    options?: {
      forceServer?: boolean;
      source?: 'default' | 'server' | 'cache';
      useCache?: boolean;
      cacheTTL?: number;
      pageSize?: number;
    }
  ): Promise<Faction[]> {
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
   * Create faction (alias for create for compatibility)
   * @param data Faction data
   * @param options Options for the operation
   * @returns Faction ID
   */
  async createEntity(
    data: Faction,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Faction) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    }
  ): Promise<string> {
    return this.create(data, undefined, options);
  }

  /**
   * Subscribe to real-time updates for a faction
   * @param id Faction ID
   * @param callback Function to call when faction changes
   * @param options Options for the subscription
   * @returns Unsubscribe function
   */
  subscribeToEntity(
    id: string,
    callback: (data: Faction | null) => void,
    options?: {
      listenerId?: string;
      onError?: (error: Error) => void;
    }
  ): () => void {
    // Create a wrapper callback that converts the service Faction to model Faction
    const wrappedCallback = (faction: any | null) => {
      if (faction) {
        const modelFaction = {
          ...faction,
          entityType: EntityType.FACTION
        } as Faction;
        callback(modelFaction);
      } else {
        callback(null);
      }
    };
    
    return this.factionService.subscribeToDocument(id, wrappedCallback, options);
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
    callback: (data: Faction[]) => void,
    options?: {
      queryId?: string;
      listenerId?: string;
      onError?: (error: Error) => void;
    }
  ): () => void {
    // Create a wrapper callback that converts the service Factions to model Factions
    const wrappedCallback = (factions: any[]) => {
      const modelFactions = factions.map(faction => ({
        ...faction,
        entityType: EntityType.FACTION
      } as Faction));
      
      callback(modelFactions);
    };
    
    return this.factionService.subscribeToQuery(constraints, wrappedCallback, options);
  }
}
