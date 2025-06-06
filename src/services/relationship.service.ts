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
  serverTimestamp,
  QueryConstraint,
  FieldValue,
  onSnapshot,
  limit,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { EnhancedFirestoreService, CountOptions } from './enhanced-firestore.service';

import { EntityType as ModelEntityType } from '../models/EntityType';

/**
 * Entity types for relationships
 * @deprecated Use ModelEntityType from '../models/EntityType' instead
 */
export enum EntityType {
  CHARACTER = 'CHARACTER',
  LOCATION = 'LOCATION',
  ITEM = 'ITEM',
  EVENT = 'EVENT',
  SESSION = 'SESSION',
  FACTION = 'FACTION',
  STORYARC = 'STORY_ARC',
  NOTE = 'NOTE'
}

/**
 * Relationship data interface
 */
export interface Relationship extends DocumentData {
  id?: string;
  sourceId: string;
  sourceType: EntityType;
  targetId: string;
  targetType: EntityType;
  relationshipType: string;
  description: string;
  strength: 'weak' | 'moderate' | 'strong';
  status: 'active' | 'inactive' | 'potential';
  startDate?: string | null | FieldValue;
  endDate?: string | null | FieldValue;
  notes?: string;
  createdBy: string;
  createdAt: string | null | FieldValue;
  updatedAt: string | null | FieldValue;
}

/**
 * Service for relationship-related operations
 */
export class RelationshipService extends EnhancedFirestoreService<Relationship> {
  private static instances: { [key: string]: RelationshipService } = {};
  private campaignId: string;
  private worldId: string;

  /**
   * Get an instance of RelationshipService
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns RelationshipService instance
   */
  public static getInstance(worldId: string, campaignId: string): RelationshipService {
    // Validate inputs to prevent invalid Firestore paths
    if (!worldId || !campaignId) {
      console.warn('Invalid worldId or campaignId provided to RelationshipService.getInstance', { worldId, campaignId });
      // Use a special key for the default instance
      const key = 'default';
      if (!this.instances[key]) {
        // Create a default instance that will handle empty paths gracefully
        this.instances[key] = new RelationshipService('default', 'default');
      }
      return this.instances[key];
    }

    const key = `${worldId}:${campaignId}`;
    if (!this.instances[key]) {
      this.instances[key] = new RelationshipService(worldId, campaignId);
    }
    return this.instances[key];
  }

  /**
   * Create a new RelationshipService
   * @param worldId World ID
   * @param campaignId Campaign ID
   */
  private constructor(worldId: string, campaignId: string) {
    // All relationships are stored in the top-level 'relationships' collection
    // with worldId and campaignId as fields, not in nested subcollections
    super('relationships', {
      defaultCountCacheTTL: 10 * 60 * 1000, // 10 minutes
      countThreshold: 3 // Recalculate after 3 changes
    });

    this.worldId = worldId;
    this.campaignId = campaignId;
  }

  /**
   * Create a relationship
   * @param relationship Relationship data
   * @returns Relationship ID
   */
  async createRelationship(relationship: Relationship): Promise<string> {
    try {
      return await this.create(relationship);
    } catch (error) {
      console.error('Error creating relationship:', error);
      throw error;
    }
  }

  /**
   * Get relationships by relationship type
   * @param relationshipType Relationship type
   * @param options Query options
   * @returns Array of relationships
   */
  async getRelationshipsByType(
    relationshipType: string,
    options: {
      pageSize?: number;
      startAfter?: string;
    } = {}
  ): Promise<Relationship[]> {
    const constraints = [
      where('relationshipType', '==', relationshipType)
    ];

    const { data } = await this.query(constraints, options.pageSize || 10);
    return data;
  }

  /**
   * Get relationships between entities
   * @param sourceId Source entity ID
   * @param sourceType Source entity type
   * @param targetId Target entity ID
   * @param targetType Target entity type
   * @returns Array of relationships
   */
  async getRelationshipsBetween(
    sourceId: string,
    sourceType: EntityType,
    targetId: string,
    targetType: EntityType
  ): Promise<Relationship[]> {
    // Check for relationships in both directions
    const sourceToTargetConstraints = [
      where('sourceId', '==', sourceId),
      where('sourceType', '==', sourceType),
      where('targetId', '==', targetId),
      where('targetType', '==', targetType)
    ];

    const { data: sourceToTarget } = await this.query(sourceToTargetConstraints);

    const targetToSourceConstraints = [
      where('sourceId', '==', targetId),
      where('sourceType', '==', targetType),
      where('targetId', '==', sourceId),
      where('targetType', '==', sourceType)
    ];

    const { data: targetToSource } = await this.query(targetToSourceConstraints);

    return [...sourceToTarget, ...targetToSource];
  }

  /**
   * Get relationships by source entity
   * @param sourceId Source entity ID
   * @param sourceType Source entity type
   * @param options Query options
   * @returns Array of relationships
   */
  async getRelationshipsBySource(
    sourceId: string,
    sourceType: EntityType,
    options: {
      relationshipType?: string;
      pageSize?: number;
      startAfter?: string;
    } = {}
  ): Promise<Relationship[]> {
    let constraints: QueryConstraint[] = [
      where('sourceId', '==', sourceId),
      where('sourceType', '==', sourceType)
    ];

    if (options.relationshipType) {
      constraints.push(where('relationshipType', '==', options.relationshipType));
    }

    const { data } = await this.query(constraints, options.pageSize || 10);
    return data;
  }

  /**
   * Get relationships by target entity
   * @param targetId Target entity ID
   * @param targetType Target entity type
   * @param options Query options
   * @returns Array of relationships
   */
  async getRelationshipsByTarget(
    targetId: string,
    targetType: EntityType,
    options: {
      relationshipType?: string;
      pageSize?: number;
      startAfter?: string;
    } = {}
  ): Promise<Relationship[]> {
    let constraints: QueryConstraint[] = [
      where('targetId', '==', targetId),
      where('targetType', '==', targetType)
    ];

    if (options.relationshipType) {
      constraints.push(where('relationshipType', '==', options.relationshipType));
    }

    const { data } = await this.query(constraints, options.pageSize || 10);
    return data;
  }

  /**
   * Update a relationship
   * @param relationshipId Relationship ID
   * @param data Data to update
   * @returns True if successful
   */
  async updateRelationship(
    relationshipId: string,
    data: Partial<Relationship>
  ): Promise<void> {
    await this.update(relationshipId, data);
  }

  /**
   * Create or update a relationship
   * @param relationship Relationship data
   * @returns Relationship ID
   */
  async createOrUpdateRelationship(relationship: Partial<Relationship>): Promise<string> {
    try {
      // Check if relationship already exists
      const constraints = [
        where('sourceId', '==', relationship.sourceId),
        where('sourceType', '==', relationship.sourceType),
        where('targetId', '==', relationship.targetId),
        where('targetType', '==', relationship.targetType),
        where('relationshipType', '==', relationship.relationshipType)
      ];

      const { data } = await this.query(constraints);

      if (data.length > 0) {
        // Update existing relationship
        const existingRelationship = data[0];
        await this.update(existingRelationship.id!, {
          ...relationship,
          updatedAt: serverTimestamp()
        });
        return existingRelationship.id!;
      } else {
        // Create new relationship
        return await this.create({
          ...relationship as Relationship,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error creating or updating relationship:', error);
      throw error;
    }
  }

  /**
   * Get relationships between entities
   * @param relationshipType Relationship type
   * @param sourceId Source entity ID
   * @param targetId Target entity ID
   * @returns Array of relationships
   */
  async getRelationships(
    relationshipType: string,
    sourceId: string,
    targetId: string
  ): Promise<Relationship[]> {
    const constraints = [
      where('relationshipType', '==', relationshipType),
      where('sourceId', '==', sourceId),
      where('targetId', '==', targetId)
    ];

    const { data } = await this.query(constraints);
    return data;
  }

  /**
   * Delete a relationship
   * @param relationshipId Relationship ID
   */
  async deleteRelationship(relationshipId: string): Promise<void> {
    await this.delete(relationshipId);
  }

  /**
   * Get all relationships for an entity
   * @param entityId Entity ID
   * @param entityType Entity type
   * @param options Query options
   * @returns Array of relationships
   */
  async getAllEntityRelationships(
    entityId: string,
    entityType: EntityType,
    options: {
      pageSize?: number;
      startAfter?: string;
    } = {}
  ): Promise<Relationship[]> {
    // Validate inputs to prevent errors
    if (!entityId || !this.worldId || !this.campaignId || this.worldId === 'default' || this.campaignId === 'default') {
      console.warn('Invalid parameters for getAllEntityRelationships', {
        entityId,
        entityType,
        worldId: this.worldId,
        campaignId: this.campaignId
      });
      return [];
    }

    try {
      // Get relationships where entity is source
      const sourceConstraints: QueryConstraint[] = [
        where('worldId', '==', this.worldId),
        where('campaignId', '==', this.campaignId),
        where('sourceId', '==', entityId),
        where('sourceType', '==', entityType)
      ];

      const { data: sourceRelationships } = await this.query(
        sourceConstraints,
        options.pageSize || 10
      );

      // Get relationships where entity is target
      const targetConstraints: QueryConstraint[] = [
        where('worldId', '==', this.worldId),
        where('campaignId', '==', this.campaignId),
        where('targetId', '==', entityId),
        where('targetType', '==', entityType)
      ];

      const { data: targetRelationships } = await this.query(
        targetConstraints,
        options.pageSize || 10
      );

      // Combine and return
      return [...sourceRelationships, ...targetRelationships];
    } catch (error) {
      console.error('Error in getAllEntityRelationships:', error);
      return [];
    }
  }

  /**
   * Get the count of relationships for an entity
   * @param entityId Entity ID
   * @param entityType Entity type
   * @param options Count options
   * @returns Count of relationships
   */
  async getRelationshipCount(
    entityId: string,
    entityType: EntityType,
    options: CountOptions = {}
  ): Promise<number> {
    // Validate inputs to prevent errors
    if (!entityId || !this.worldId || !this.campaignId || this.worldId === 'default' || this.campaignId === 'default') {
      console.warn('Invalid parameters for getRelationshipCount', {
        entityId,
        entityType,
        worldId: this.worldId,
        campaignId: this.campaignId
      });
      return 0;
    }

    try {
      const sourceConstraints: QueryConstraint[] = [
        where('worldId', '==', this.worldId),
        where('campaignId', '==', this.campaignId),
        where('sourceId', '==', entityId),
        where('sourceType', '==', entityType)
      ];

      const sourceCount = await this.getCount(
        `entity_${entityId}_${entityType}_source`,
        sourceConstraints,
        options
      );

      const targetConstraints: QueryConstraint[] = [
        where('worldId', '==', this.worldId),
        where('campaignId', '==', this.campaignId),
        where('targetId', '==', entityId),
        where('targetType', '==', entityType)
      ];

      const targetCount = await this.getCount(
        `entity_${entityId}_${entityType}_target`,
        targetConstraints,
        options
      );

      return sourceCount + targetCount;
    } catch (error) {
      console.error('Error in getRelationshipCount:', error);
      return 0;
    }
  }

  /**
   * Subscribe to entity relationships with real-time updates
   * @param entityId Entity ID
   * @param entityType Entity type
   * @param onUpdate Callback function when relationships are updated
   * @param onError Callback function when an error occurs
   * @returns Unsubscribe function
   */
  subscribeToEntityRelationships(
    entityId: string,
    entityType: EntityType,
    onUpdate: (relationships: Relationship[]) => void,
    onError: (error: Error) => void
  ): () => void {
    try {
      // Create constraints for relationships where the entity is the source
      const sourceConstraints = [
        where('sourceId', '==', entityId),
        where('sourceType', '==', entityType)
      ];

      // Subscribe to source relationships
      const sourceUnsubscribe = this.subscribeToQuery(
        sourceConstraints,
        (sourceRelationships) => {
          // Get target relationships and combine them
          this.query([
            where('targetId', '==', entityId),
            where('targetType', '==', entityType)
          ]).then(({ data: targetRelationships }) => {
            // Combine and deduplicate relationships
            const allRelationships = [...sourceRelationships];

            // Add target relationships that aren't already in the source relationships
            for (const targetRel of targetRelationships) {
              if (!allRelationships.some(rel => rel.id === targetRel.id)) {
                allRelationships.push(targetRel);
              }
            }

            onUpdate(allRelationships);
          }).catch(onError);
        },
        {
          queryId: `entity_${entityId}_${entityType}_source`,
          onError
        }
      );

      // Return a function to unsubscribe from both queries
      return () => {
        sourceUnsubscribe();
      };
    } catch (error) {
      onError(error as Error);
      return () => {}; // Return empty function if subscription fails
    }
  }

  /**
   * Subscribe to all relationships in the campaign with real-time updates
   * @param onUpdate Callback function when relationships are updated
   * @param onError Callback function when an error occurs
   * @returns Unsubscribe function
   */
  subscribeToAllRelationships(
    onUpdate: (relationships: Relationship[]) => void,
    onError: (error: Error) => void
  ): () => void {
    try {
      // Create constraints for all relationships in the campaign
      const constraints = [
        orderBy('createdAt', 'desc'),
        limit(100) // Limit to prevent loading too many relationships
      ];

      // Subscribe to the query
      return this.subscribeToQuery(
        constraints,
        onUpdate,
        {
          queryId: 'all_relationships',
          onError
        }
      );
    } catch (error) {
      onError(error as Error);
      return () => {}; // Return empty function if subscription fails
    }
  }



  /**
   * Get the count of relationships between two entities
   * @param entityId1 First entity ID
   * @param entityType1 First entity type
   * @param entityId2 Second entity ID
   * @param entityType2 Second entity type
   * @param options Count options
   * @returns Count of relationships
   */
  async getRelationshipCountBetween(
    entityId1: string,
    entityType1: EntityType,
    entityId2: string,
    entityType2: EntityType,
    options: CountOptions = {}
  ): Promise<number> {
    const constraints1: QueryConstraint[] = [
      where('sourceId', '==', entityId1),
      where('sourceType', '==', entityType1),
      where('targetId', '==', entityId2),
      where('targetType', '==', entityType2)
    ];

    const count1 = await this.getCount(
      `between_${entityId1}_${entityType1}_${entityId2}_${entityType2}`,
      constraints1,
      options
    );

    const constraints2: QueryConstraint[] = [
      where('sourceId', '==', entityId2),
      where('sourceType', '==', entityType2),
      where('targetId', '==', entityId1),
      where('targetType', '==', entityType1)
    ];

    const count2 = await this.getCount(
      `between_${entityId2}_${entityType2}_${entityId1}_${entityType1}`,
      constraints2,
      options
    );

    return count1 + count2;
  }

  /**
   * Get the count of relationships by type
   * @param entityId Entity ID
   * @param entityType Entity type
   * @param relationshipType Relationship type
   * @param options Count options
   * @returns Count of relationships
   */
  async getRelationshipCountByType(
    entityId: string,
    entityType: EntityType,
    relationshipType: string,
    options: CountOptions = {}
  ): Promise<number> {
    const sourceConstraints: QueryConstraint[] = [
      where('sourceId', '==', entityId),
      where('sourceType', '==', entityType),
      where('relationshipType', '==', relationshipType)
    ];

    const sourceCount = await this.getCount(
      `entity_${entityId}_${entityType}_${relationshipType}_source`,
      sourceConstraints,
      options
    );

    const targetConstraints: QueryConstraint[] = [
      where('targetId', '==', entityId),
      where('targetType', '==', entityType),
      where('relationshipType', '==', relationshipType)
    ];

    const targetCount = await this.getCount(
      `entity_${entityId}_${entityType}_${relationshipType}_target`,
      targetConstraints,
      options
    );

    return sourceCount + targetCount;
  }

  /**
   * Convert ModelEntityType to EntityType
   * @param modelEntityType ModelEntityType
   * @returns EntityType
   */
  private convertModelEntityType(modelEntityType: ModelEntityType): EntityType {
    switch (modelEntityType) {
      case ModelEntityType.CHARACTER:
        return EntityType.CHARACTER;
      case ModelEntityType.LOCATION:
        return EntityType.LOCATION;
      case ModelEntityType.ITEM:
        return EntityType.ITEM;
      case ModelEntityType.EVENT:
        return EntityType.EVENT;
      case ModelEntityType.SESSION:
        return EntityType.SESSION;
      case ModelEntityType.FACTION:
        return EntityType.FACTION;
      case ModelEntityType.STORY_ARC:
        return EntityType.STORYARC;
      case ModelEntityType.NOTE:
        return EntityType.NOTE;
      default:
        throw new Error(`Unknown entity type: ${modelEntityType}`);
    }
  }

  /**
   * Get relationships by entity (alias for getAllEntityRelationships for compatibility)
   * @param entityId Entity ID
   * @param entityType Entity type
   * @param options Query options
   * @returns Array of relationships
   */
  async getRelationshipsByEntity(
    entityId: string,
    entityType: EntityType | ModelEntityType,
    options: {
      pageSize?: number;
      startAfter?: string;
    } = {}
  ): Promise<Relationship[]> {
    // Convert ModelEntityType to EntityType if needed
    const convertedEntityType = typeof entityType === 'string'
      ? this.convertModelEntityType(entityType as ModelEntityType)
      : entityType;

    return this.getAllEntityRelationships(entityId, convertedEntityType, options);
  }
}
