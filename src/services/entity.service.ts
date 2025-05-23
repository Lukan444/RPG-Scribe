import { DocumentData, QueryConstraint, where } from 'firebase/firestore';
import { EnhancedFirestoreService, CountOptions } from './enhanced-firestore.service';
import { EntityType, RelationshipService } from './relationship.service';
import { DEFAULT_WORLD_ID, DEFAULT_CAMPAIGN_ID } from '../constants/appConstants';

/**
 * Base entity interface
 */
export interface BaseEntity extends DocumentData {
  id?: string;
  name?: string;
  description?: string;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Base entity service for all entity types
 */
export abstract class EntityService<T extends BaseEntity> extends EnhancedFirestoreService<T> {
  protected worldId: string;
  protected campaignId: string;
  protected entityType: EntityType;
  protected relationshipService: RelationshipService;

  /**
   * Create a new EntityService
   * @param worldId World ID (use empty string or DEFAULT_WORLD_ID for global entities)
   * @param campaignId Campaign ID (use empty string or DEFAULT_CAMPAIGN_ID for global entities)
   * @param collectionName Collection name
   * @param entityType Entity type
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
   * Get the relationship count for an entity
   * @param entityId Entity ID
   * @param options Count options
   * @returns Relationship count
   */
  async getRelationshipCount(
    entityId: string,
    options: CountOptions = {}
  ): Promise<number> {
    return this.relationshipService.getRelationshipCount(
      entityId,
      this.entityType,
      options
    );
  }

  /**
   * Get the relationship count between this entity and another entity
   * @param entityId Entity ID
   * @param targetId Target entity ID
   * @param targetType Target entity type
   * @param options Count options
   * @returns Relationship count
   */
  async getRelationshipCountWith(
    entityId: string,
    targetId: string,
    targetType: EntityType,
    options: CountOptions = {}
  ): Promise<number> {
    return this.relationshipService.getRelationshipCountBetween(
      entityId,
      this.entityType,
      targetId,
      targetType,
      options
    );
  }

  /**
   * Get the relationship count by type
   * @param entityId Entity ID
   * @param relationshipType Relationship type
   * @param options Count options
   * @returns Relationship count
   */
  async getRelationshipCountByType(
    entityId: string,
    relationshipType: string,
    options: CountOptions = {}
  ): Promise<number> {
    return this.relationshipService.getRelationshipCountByType(
      entityId,
      this.entityType,
      relationshipType,
      options
    );
  }

  /**
   * Get all relationships for an entity
   * @param entityId Entity ID
   * @param options Query options
   * @returns Array of relationships
   */
  async getRelationships(
    entityId: string,
    options: {
      pageSize?: number;
      startAfter?: string;
    } = {}
  ) {
    return this.relationshipService.getAllEntityRelationships(
      entityId,
      this.entityType,
      options
    );
  }

  /**
   * Create an entity with relationship count
   * @param entity Entity data
   * @returns Entity ID
   */
  async createEntity(entity: T): Promise<string> {
    // Create the entity without a relationship count field
    const entityData = { ...entity };
    return this.create(entityData);
  }

  /**
   * Get an entity with relationship count
   * @param id Entity ID
   * @param options Query options
   * @returns Entity with relationship count
   */
  async getEntityWithRelationships(
    id: string,
    options: {
      useCache?: boolean;
      forceServer?: boolean;
    } = {}
  ): Promise<T & { relationshipCount: number } | null> {
    const entity = await this.getById(id, options);

    if (!entity) {
      return null;
    }

    // Get relationship count
    const relationshipCount = await this.getRelationshipCount(id, options);

    // Return entity with relationship count
    return {
      ...entity,
      relationshipCount
    };
  }

  /**
   * List entities with relationship counts
   * @param options Query options
   * @returns Array of entities with relationship counts
   */
  async listEntitiesWithRelationships(
    options: {
      constraints?: QueryConstraint[];
      pageSize?: number;
      startAfter?: string;
      useCache?: boolean;
      forceServer?: boolean;
    } = {}
  ): Promise<Array<T & { relationshipCount: number }>> {
    const { data: entities } = await this.query(
      options.constraints || [],
      options.pageSize || 10,
      options.startAfter ? await this.getDocumentSnapshot(options.startAfter) : undefined
    );

    // Get relationship counts for all entities
    const entitiesWithCounts = await Promise.all(
      entities.map(async (entity) => {
        const relationshipCount = await this.getRelationshipCount(
          entity.id!,
          { useCache: options.useCache, forceServer: options.forceServer }
        );

        return {
          ...entity,
          relationshipCount
        };
      })
    );

    return entitiesWithCounts;
  }
}
