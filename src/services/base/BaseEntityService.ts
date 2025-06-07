/**
 * Base Entity Service
 * 
 * This class provides a standardized implementation of the EntityService interface
 * for all entity types in the system. It extends the EnhancedFirestoreService
 * and adds entity-specific functionality.
 */

import { DocumentData, DocumentSnapshot, QueryConstraint, QueryDocumentSnapshot, Unsubscribe, orderBy, where } from 'firebase/firestore';
import { EnhancedFirestoreService, CountOptions } from '../enhanced-firestore.service';
import { IEntityService } from '../interfaces/EntityService.interface';
import { EntityType } from '../../models/EntityType';
import { RelationshipService } from '../relationship.service';
import { DEFAULT_WORLD_ID, DEFAULT_CAMPAIGN_ID } from '../../constants/appConstants';
import { BaseEntity } from '../../models/BaseEntity';
import { systemLogger, SystemModule } from '../systemLogger.service';
import { LiveTranscriptionLogLevel, LogCategory } from '../../utils/liveTranscriptionLogger';

/**
 * Base entity service for all entity types
 * @template T Entity type extending BaseEntity
 */
export abstract class BaseEntityService<T extends BaseEntity & DocumentData> 
  extends EnhancedFirestoreService<T> 
  implements IEntityService<T> {
  
  protected worldId: string;
  protected campaignId: string;
  protected entityType: EntityType;
  protected relationshipService: RelationshipService;

  /**
   * Create a new BaseEntityService
   * @param worldId World ID (use empty string or DEFAULT_WORLD_ID for global entities)
   * @param campaignId Campaign ID (use empty string or DEFAULT_CAMPAIGN_ID for global entities)
   * @param collectionName Collection name
   * @param entityType Entity type
   * @param options Service options
   */
  constructor(
    worldId: string,
    campaignId: string,
    collectionName: string,
    entityType: EntityType,
    options: {
      cachingEnabled?: boolean;
      defaultCacheTTL?: number;
      transformer?: any;
      validator?: any;
      loggerEnabled?: boolean;
    } = {}
  ) {
    // Use default IDs if empty strings are provided
    const effectiveWorldId = worldId || DEFAULT_WORLD_ID;
    const effectiveCampaignId = campaignId || DEFAULT_CAMPAIGN_ID;

    // Use the collection name directly since our Firestore structure has root collections
    // This matches the actual database structure we observed
    const collectionPath = collectionName;

    super(collectionPath, options);

    this.worldId = effectiveWorldId;
    this.campaignId = effectiveCampaignId;
    this.entityType = entityType;
    this.relationshipService = RelationshipService.getInstance(effectiveWorldId, effectiveCampaignId);
  }

  /**
   * Get the entity type
   * @returns Entity type
   */
  getEntityType(): EntityType {
    return this.entityType;
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
   * Get the relationship count for an entity
   * @param entityId Entity ID
   * @param options Count options
   * @returns Relationship count
   */
  async getRelationshipCount(
    entityId: string,
    options: CountOptions = {}
  ): Promise<number> {
    try {
      return await this.relationshipService.getRelationshipCount(
        entityId,
        this.entityType as any, // Cast to any to handle the enum type difference
        options
      );
    } catch (error) {
      systemLogger.log(
        SystemModule.DATABASE,
        LiveTranscriptionLogLevel.ERROR,
        LogCategory.DATABASE,
        `Error getting relationship count for entity ${entityId}`,
        { entityId, entityType: this.entityType, worldId: this.worldId, campaignId: this.campaignId },
        error as Error
      );
      return 0;
    }
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
  ): Promise<T[]> {
    try {
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
    } catch (error) {
      systemLogger.log(
        SystemModule.DATABASE,
        LiveTranscriptionLogLevel.ERROR,
        LogCategory.DATABASE,
        'Error listing entities',
        { entityType: this.entityType, worldId: this.worldId, campaignId: this.campaignId },
        error as Error
      );
      return [];
    }
  }

  /**
   * Create entity (alias for create for compatibility)
   * @param data Entity data
   * @param options Options for the operation
   * @returns Entity ID
   */
  async createEntity(
    data: T,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: T) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<string> {
    return this.create(data, undefined, options);
  }

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
    options: {
      listenerId?: string;
      onError?: (error: Error) => void;
    } = {}
  ): () => void {
    return this.subscribeToDocument(id, callback, options);
  }

  /**
   * Get entities by world ID
   * @param worldId World ID
   * @param options Query options
   * @returns Array of entities
   */
  async getEntitiesByWorldId(
    worldId: string,
    options: {
      pageSize?: number;
      startAfter?: DocumentSnapshot<DocumentData>;
      forceServer?: boolean;
    } = {}
  ): Promise<T[]> {
    try {
      const constraints = [where('worldId', '==', worldId)];
      const { data } = await this.query(
        constraints,
        options.pageSize || 100,
        options.startAfter,
        { forceServer: options.forceServer }
      );
      return data;
    } catch (error) {
      systemLogger.log(
        SystemModule.DATABASE,
        LiveTranscriptionLogLevel.ERROR,
        LogCategory.DATABASE,
        `Error getting entities by world ID ${worldId}`,
        { worldId, entityType: this.entityType, campaignId: this.campaignId },
        error as Error
      );
      return [];
    }
  }

  /**
   * Get entities by campaign ID
   * @param campaignId Campaign ID
   * @param options Query options
   * @returns Array of entities
   */
  async getEntitiesByCampaignId(
    campaignId: string,
    options: {
      pageSize?: number;
      startAfter?: DocumentSnapshot<DocumentData>;
      forceServer?: boolean;
    } = {}
  ): Promise<T[]> {
    try {
      const constraints = [where('campaignId', '==', campaignId)];
      const { data } = await this.query(
        constraints,
        options.pageSize || 100,
        options.startAfter,
        { forceServer: options.forceServer }
      );
      return data;
    } catch (error) {
      systemLogger.log(
        SystemModule.DATABASE,
        LiveTranscriptionLogLevel.ERROR,
        LogCategory.DATABASE,
        `Error getting entities by campaign ID ${campaignId}`,
        { campaignId, entityType: this.entityType, worldId: this.worldId },
        error as Error
      );
      return [];
    }
  }
}
