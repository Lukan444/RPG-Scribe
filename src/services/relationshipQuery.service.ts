import {
  where,
  orderBy,
  query,
  collection,
  getDocs,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Relationship } from './relationship.service';

/**
 * Service for advanced relationship queries
 */
export class RelationshipQueryService {
  private campaignId: string;

  /**
   * Create a new RelationshipQueryService
   * @param campaignId Campaign ID
   */
  constructor(campaignId: string) {
    this.campaignId = campaignId;
  }

  /**
   * Get all entities related to an entity
   * @param entityId Entity ID
   * @param entityType Entity type
   * @param relatedEntityType Related entity type (optional)
   * @returns Array of related entity IDs with relationship details
   */
  async getRelatedEntities(
    entityId: string,
    entityType: string,
    relatedEntityType?: string
  ): Promise<Array<{
    entityId: string;
    entityType: string;
    relationshipType: string;
    relationshipSubtype: string;
    isSource: boolean;
    properties: any;
  }>> {
    try {
      const result: Array<{
        entityId: string;
        entityType: string;
        relationshipType: string;
        relationshipSubtype: string;
        isSource: boolean;
        properties: any;
      }> = [];

      // Get relationships where entity is source
      const sourceQuery = query(
        collection(db, `campaigns/${this.campaignId}/relationships`),
        where('sourceId', '==', entityId),
        where('sourceType', '==', entityType)
      );

      // If relatedEntityType is provided, create a new query with the additional constraint
      let finalSourceQuery = sourceQuery;
      if (relatedEntityType) {
        finalSourceQuery = query(
          collection(db, `campaigns/${this.campaignId}/relationships`),
          where('sourceId', '==', entityId),
          where('sourceType', '==', entityType),
          where('targetType', '==', relatedEntityType)
        );
      }

      const sourceSnapshot = await getDocs(finalSourceQuery);

      sourceSnapshot.forEach(doc => {
        const relationship = doc.data() as Relationship;
        result.push({
          entityId: relationship.targetId,
          entityType: relationship.targetType,
          relationshipType: relationship.type,
          relationshipSubtype: relationship.subtype,
          isSource: true,
          properties: relationship.properties || {}
        });
      });

      // Get relationships where entity is target
      const targetQuery = query(
        collection(db, `campaigns/${this.campaignId}/relationships`),
        where('targetId', '==', entityId),
        where('targetType', '==', entityType)
      );

      // If relatedEntityType is provided, create a new query with the additional constraint
      let finalTargetQuery = targetQuery;
      if (relatedEntityType) {
        finalTargetQuery = query(
          collection(db, `campaigns/${this.campaignId}/relationships`),
          where('targetId', '==', entityId),
          where('targetType', '==', entityType),
          where('sourceType', '==', relatedEntityType)
        );
      }

      const targetSnapshot = await getDocs(finalTargetQuery);

      targetSnapshot.forEach(doc => {
        const relationship = doc.data() as Relationship;
        result.push({
          entityId: relationship.sourceId,
          entityType: relationship.sourceType,
          relationshipType: relationship.type,
          relationshipSubtype: relationship.subtype,
          isSource: false,
          properties: relationship.properties || {}
        });
      });

      return result;
    } catch (error) {
      console.error(`Error getting related entities for ${entityId}:`, error);
      return [];
    }
  }

  /**
   * Get path between two entities
   * @param startEntityId Start entity ID
   * @param startEntityType Start entity type
   * @param endEntityId End entity ID
   * @param endEntityType End entity type
   * @param maxDepth Maximum path depth
   * @returns Array of paths between entities
   */
  async getPathBetweenEntities(
    startEntityId: string,
    startEntityType: string,
    endEntityId: string,
    endEntityType: string,
    maxDepth: number = 3
  ): Promise<Array<Array<{
    sourceId: string;
    sourceType: string;
    targetId: string;
    targetType: string;
    relationshipType: string;
    relationshipSubtype: string;
  }>>> {
    // This is a complex query that would be better implemented with a graph database
    // For Firestore, we'll use a breadth-first search approach

    const visited = new Set<string>();
    const queue: Array<{
      path: Array<{
        sourceId: string;
        sourceType: string;
        targetId: string;
        targetType: string;
        relationshipType: string;
        relationshipSubtype: string;
      }>;
      currentId: string;
      currentType: string;
      depth: number;
    }> = [];

    const result: Array<Array<{
      sourceId: string;
      sourceType: string;
      targetId: string;
      targetType: string;
      relationshipType: string;
      relationshipSubtype: string;
    }>> = [];

    // Start with the start entity
    queue.push({
      path: [],
      currentId: startEntityId,
      currentType: startEntityType,
      depth: 0
    });

    visited.add(`${startEntityType}:${startEntityId}`);

    while (queue.length > 0) {
      const { path, currentId, currentType, depth } = queue.shift()!;

      // Check if we've reached the end entity
      if (currentId === endEntityId && currentType === endEntityType) {
        result.push([...path]);
        continue;
      }

      // Check if we've reached the maximum depth
      if (depth >= maxDepth) {
        continue;
      }

      // Get related entities
      const relatedEntities = await this.getRelatedEntities(currentId, currentType);

      for (const related of relatedEntities) {
        const relatedKey = `${related.entityType}:${related.entityId}`;

        if (!visited.has(relatedKey)) {
          visited.add(relatedKey);

          const newPath = [...path];

          if (related.isSource) {
            newPath.push({
              sourceId: currentId,
              sourceType: currentType,
              targetId: related.entityId,
              targetType: related.entityType,
              relationshipType: related.relationshipType,
              relationshipSubtype: related.relationshipSubtype
            });
          } else {
            newPath.push({
              sourceId: related.entityId,
              sourceType: related.entityType,
              targetId: currentId,
              targetType: currentType,
              relationshipType: related.relationshipType,
              relationshipSubtype: related.relationshipSubtype
            });
          }

          queue.push({
            path: newPath,
            currentId: related.entityId,
            currentType: related.entityType,
            depth: depth + 1
          });
        }
      }
    }

    return result;
  }

  /**
   * Get relationship graph data for visualization
   * @param entityIds Entity IDs to include
   * @param entityTypes Entity types to include
   * @returns Graph data for visualization
   */
  async getRelationshipGraphData(
    entityIds: string[] = [],
    entityTypes: string[] = []
  ): Promise<{
    nodes: Array<{
      id: string;
      type: string;
      label: string;
    }>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
      subtype: string;
    }>;
  }> {
    try {
      const nodes: Array<{
        id: string;
        type: string;
        label: string;
      }> = [];

      const edges: Array<{
        source: string;
        target: string;
        type: string;
        subtype: string;
      }> = [];

      const nodeMap = new Map<string, boolean>();

      // Build query constraints
      let relationshipsQuery = query(
        collection(db, `campaigns/${this.campaignId}/relationships`)
      );

      // Get all relationships
      const snapshot = await getDocs(relationshipsQuery);

      snapshot.forEach(doc => {
        const relationship = doc.data() as Relationship;

        // Check if we should include this relationship
        const includeSource = entityIds.length === 0 || entityIds.includes(relationship.sourceId);
        const includeTarget = entityIds.length === 0 || entityIds.includes(relationship.targetId);
        const includeSourceType = entityTypes.length === 0 || entityTypes.includes(relationship.sourceType);
        const includeTargetType = entityTypes.length === 0 || entityTypes.includes(relationship.targetType);

        if ((includeSource || includeTarget) && (includeSourceType || includeTargetType)) {
          // Add source node if not already added
          const sourceKey = `${relationship.sourceType}:${relationship.sourceId}`;
          if (!nodeMap.has(sourceKey)) {
            nodeMap.set(sourceKey, true);
            nodes.push({
              id: relationship.sourceId,
              type: relationship.sourceType,
              label: relationship.sourceId // We'll need to fetch actual names later
            });
          }

          // Add target node if not already added
          const targetKey = `${relationship.targetType}:${relationship.targetId}`;
          if (!nodeMap.has(targetKey)) {
            nodeMap.set(targetKey, true);
            nodes.push({
              id: relationship.targetId,
              type: relationship.targetType,
              label: relationship.targetId // We'll need to fetch actual names later
            });
          }

          // Add edge
          edges.push({
            source: relationship.sourceId,
            target: relationship.targetId,
            type: relationship.type,
            subtype: relationship.subtype
          });
        }
      });

      return { nodes, edges };
    } catch (error) {
      console.error('Error getting relationship graph data:', error);
      return { nodes: [], edges: [] };
    }
  }
}
