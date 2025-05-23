import {
  where,
  orderBy,
  query,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  DocumentData,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FirestoreService } from './firestore.service';
import { Relationship, RelationshipService, EntityType as RelationshipEntityType } from './relationship.service';
import { CachingService } from './caching.service';
import { EntityType } from '../models/EntityType';

/**
 * Map EntityType to RelationshipEntityType
 * @param entityType EntityType
 * @returns RelationshipEntityType
 */
function mapEntityType(entityType: EntityType): RelationshipEntityType {
  switch (entityType) {
    case EntityType.CHARACTER:
      return RelationshipEntityType.CHARACTER;
    case EntityType.LOCATION:
      return RelationshipEntityType.LOCATION;
    case EntityType.ITEM:
      return RelationshipEntityType.ITEM;
    case EntityType.EVENT:
      return RelationshipEntityType.EVENT;
    case EntityType.SESSION:
      return RelationshipEntityType.SESSION;
    case EntityType.CAMPAIGN:
      return RelationshipEntityType.FACTION; // Map to closest equivalent
    case EntityType.RPG_WORLD:
      return RelationshipEntityType.STORYARC; // Map to closest equivalent
    case EntityType.NOTE:
      return RelationshipEntityType.NOTE;
    default:
      return RelationshipEntityType.CHARACTER;
  }
}

/**
 * Map RelationshipEntityType to EntityType
 * @param relationshipType RelationshipEntityType
 * @returns EntityType
 */
function mapRelationshipTypeToEntity(relationshipType: RelationshipEntityType): EntityType {
  switch (relationshipType) {
    case RelationshipEntityType.CHARACTER:
      return EntityType.CHARACTER;
    case RelationshipEntityType.LOCATION:
      return EntityType.LOCATION;
    case RelationshipEntityType.ITEM:
      return EntityType.ITEM;
    case RelationshipEntityType.EVENT:
      return EntityType.EVENT;
    case RelationshipEntityType.SESSION:
      return EntityType.SESSION;
    case RelationshipEntityType.FACTION:
      return EntityType.CAMPAIGN; // Map to closest equivalent
    case RelationshipEntityType.STORYARC:
      return EntityType.RPG_WORLD; // Map to closest equivalent
    case RelationshipEntityType.NOTE:
      return EntityType.NOTE;
    default:
      return EntityType.CHARACTER;
  }
}

/**
 * Map EntityType to RelationshipEntityType
 * @param entityType EntityType
 * @returns RelationshipEntityType
 */
function mapModelEntityType(entityType: EntityType): RelationshipEntityType {
  switch (entityType) {
    case EntityType.CHARACTER:
      return RelationshipEntityType.CHARACTER;
    case EntityType.LOCATION:
      return RelationshipEntityType.LOCATION;
    case EntityType.ITEM:
      return RelationshipEntityType.ITEM;
    case EntityType.EVENT:
      return RelationshipEntityType.EVENT;
    case EntityType.SESSION:
      return RelationshipEntityType.SESSION;
    case EntityType.FACTION:
      return RelationshipEntityType.FACTION;
    case EntityType.STORY_ARC:
      return RelationshipEntityType.STORYARC;
    case EntityType.CAMPAIGN:
      return RelationshipEntityType.FACTION; // Map to closest equivalent
    case EntityType.RPG_WORLD:
      return RelationshipEntityType.STORYARC; // Map to closest equivalent
    case EntityType.NOTE:
      return RelationshipEntityType.NOTE;
    default:
      return RelationshipEntityType.CHARACTER;
  }
}

/**
 * Entity reference interface
 */
export interface EntityReference {
  id: string;
  type: EntityType;
  name: string;
  subtype?: string;
  imageURL?: string;
}

/**
 * Entity relationship interface
 */
export interface EntityRelationship {
  id: string;
  source: EntityReference;
  target: EntityReference;
  type: string;
  subtype: string;
  properties?: Record<string, any>;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Service for entity relationships
 */
export class EntityRelationshipsService {
  private campaignId: string;
  private relationshipService: RelationshipService;
  private cachingService: CachingService;

  /**
   * Create a new EntityRelationshipsService
   * @param campaignId Campaign ID
   */
  constructor(campaignId: string, worldId: string = '') {
    this.campaignId = campaignId;
    this.relationshipService = RelationshipService.getInstance(worldId, campaignId);
    this.cachingService = new CachingService();
  }

  /**
   * Get entity by ID and type
   * @param entityId Entity ID
   * @param entityType Entity type
   * @returns Entity data
   */
  async getEntity(entityId: string, entityType: EntityType): Promise<EntityReference | null> {
    try {
      // Check cache first
      const cacheKey = `entity:${this.campaignId}:${entityType}:${entityId}`;
      const cachedEntity = this.cachingService.get<EntityReference>(cacheKey);

      if (cachedEntity) {
        return cachedEntity;
      }

      // Determine collection path based on entity type
      let collectionPath: string;

      switch (entityType) {
        case EntityType.CHARACTER:
          collectionPath = `campaigns/${this.campaignId}/characters`;
          break;
        case EntityType.LOCATION:
          collectionPath = `campaigns/${this.campaignId}/locations`;
          break;
        case EntityType.ITEM:
          collectionPath = `campaigns/${this.campaignId}/items`;
          break;
        case EntityType.EVENT:
          collectionPath = `campaigns/${this.campaignId}/events`;
          break;
        case EntityType.SESSION:
          collectionPath = `campaigns/${this.campaignId}/sessions`;
          break;
        case EntityType.CAMPAIGN:
          collectionPath = 'campaigns';
          break;
        case EntityType.RPG_WORLD:
          collectionPath = 'rpgworlds';
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }

      // Get entity data
      const docRef = doc(db, collectionPath, entityId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();

      // Create entity reference
      const entity: EntityReference = {
        id: entityId,
        type: entityType,
        name: data.name || 'Unknown',
        subtype: data.type || data.subtype || undefined,
        imageURL: data.imageURL || undefined
      };

      // Cache entity
      this.cachingService.set(cacheKey, entity);

      return entity;
    } catch (error) {
      console.error(`Error getting entity ${entityId} of type ${entityType}:`, error);
      return null;
    }
  }

  /**
   * Get relationships for an entity
   * @param entityId Entity ID
   * @param entityType Entity type
   * @returns Array of entity relationships
   */
  async getEntityRelationships(entityId: string, entityType: EntityType): Promise<EntityRelationship[]> {
    try {
      // Get raw relationships
      const relationships = await this.relationshipService.getAllEntityRelationships(
        entityId,
        mapEntityType(entityType)
      );

      // Transform to entity relationships
      const entityRelationships: EntityRelationship[] = [];

      for (const relationship of relationships) {
        let source: EntityReference | null;
        let target: EntityReference | null;

        // Get source entity
        if (relationship.sourceId === entityId && relationship.sourceType === mapEntityType(entityType)) {
          source = {
            id: entityId,
            type: entityType,
            name: 'Current Entity' // Placeholder, will be replaced with actual name
          };
        } else {
          source = await this.getEntity(
            relationship.sourceId,
            mapRelationshipTypeToEntity(relationship.sourceType)
          );
        }

        // Get target entity
        if (relationship.targetId === entityId && relationship.targetType === mapEntityType(entityType)) {
          target = {
            id: entityId,
            type: entityType,
            name: 'Current Entity' // Placeholder, will be replaced with actual name
          };
        } else {
          target = await this.getEntity(
            relationship.targetId,
            mapRelationshipTypeToEntity(relationship.targetType)
          );
        }

        // Skip if either entity is not found
        if (!source || !target) {
          continue;
        }

        // Create entity relationship
        entityRelationships.push({
          id: relationship.id!,
          source,
          target,
          type: relationship.relationshipType,
          subtype: relationship.notes || '',
          properties: relationship.properties,
          createdAt: relationship.createdAt,
          updatedAt: relationship.updatedAt
        });
      }

      return entityRelationships;
    } catch (error) {
      console.error(`Error getting relationships for entity ${entityId} of type ${entityType}:`, error);
      return [];
    }
  }

  /**
   * Create a relationship between entities
   * @param sourceId Source entity ID
   * @param sourceType Source entity type
   * @param targetId Target entity ID
   * @param targetType Target entity type
   * @param type Relationship type
   * @param subtype Relationship subtype
   * @param properties Relationship properties
   * @returns Relationship ID
   */
  async createRelationship(
    sourceId: string,
    sourceType: EntityType,
    targetId: string,
    targetType: EntityType,
    type: string,
    subtype: string,
    properties?: Record<string, any>
  ): Promise<string> {
    try {
      // Create relationship
      const relationshipId = await this.relationshipService.createRelationship({
        sourceId,
        sourceType: mapEntityType(sourceType),
        targetId,
        targetType: mapEntityType(targetType),
        relationshipType: type,
        description: `${type} relationship between ${sourceType} and ${targetType}`,
        strength: 'strong',
        status: 'active',
        notes: subtype,
        createdBy: 'system',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return relationshipId;
    } catch (error) {
      console.error(`Error creating relationship between ${sourceId} and ${targetId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a relationship
   * @param relationshipId Relationship ID
   * @returns True if successful
   */
  async deleteRelationship(relationshipId: string): Promise<boolean> {
    try {
      await this.relationshipService.deleteRelationship(relationshipId);
      return true;
    } catch (error) {
      console.error(`Error deleting relationship ${relationshipId}:`, error);
      return false;
    }
  }

  /**
   * Get related entities of a specific type
   * @param entityId Entity ID
   * @param entityType Entity type
   * @param relatedEntityType Related entity type
   * @returns Array of related entities
   */
  async getRelatedEntitiesByType(
    entityId: string,
    entityType: EntityType,
    relatedEntityType: EntityType
  ): Promise<Array<{
    entity: EntityReference;
    relationship: {
      id: string;
      type: string;
      subtype: string;
      isSource: boolean;
      properties?: Record<string, any>;
    };
  }>> {
    try {
      // Get relationships where entity is source
      const sourceRelationships = await this.relationshipService.getRelationshipsBySource(
        entityId,
        mapEntityType(entityType),
        { relationshipType: `${entityType.toString()}-${relatedEntityType.toString()}` }
      );

      // Get relationships where entity is target
      const targetRelationships = await this.relationshipService.getRelationshipsByTarget(
        entityId,
        mapEntityType(entityType),
        { relationshipType: `${relatedEntityType.toString()}-${entityType.toString()}` }
      );

      const result: Array<{
        entity: EntityReference;
        relationship: {
          id: string;
          type: string;
          subtype: string;
          isSource: boolean;
          properties?: Record<string, any>;
        };
      }> = [];

      // Process source relationships
      for (const relationship of sourceRelationships) {
        const relatedEntity = await this.getEntity(
          relationship.targetId,
          relatedEntityType
        );

        if (relatedEntity) {
          result.push({
            entity: relatedEntity,
            relationship: {
              id: relationship.id!,
              type: relationship.relationshipType,
              subtype: relationship.notes || '',
              isSource: true,
              properties: relationship.properties
            }
          });
        }
      }

      // Process target relationships
      for (const relationship of targetRelationships) {
        const relatedEntity = await this.getEntity(
          relationship.sourceId,
          relatedEntityType
        );

        if (relatedEntity) {
          result.push({
            entity: relatedEntity,
            relationship: {
              id: relationship.id!,
              type: relationship.relationshipType,
              subtype: relationship.notes || '',
              isSource: false,
              properties: relationship.properties
            }
          });
        }
      }

      return result;
    } catch (error) {
      console.error(`Error getting related entities for ${entityId} of type ${entityType}:`, error);
      return [];
    }
  }
}
