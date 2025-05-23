import { Node, Edge, MarkerType } from 'reactflow';
import { Relationship } from '../services/relationship.service';
import { EntityType } from '../models/EntityType';

/**
 * Interface for entity data
 */
export interface EntityData {
  id: string;
  name: string;
  type: EntityType;
  imageURL?: string;
  description?: string;
  [key: string]: any;
}

/**
 * Transform relationships into ReactFlow nodes and edges
 *
 * @param relationships - Array of relationships from Firestore
 * @param centralEntity - Optional central entity data (if visualizing from an entity's perspective)
 * @param entityDataMap - Map of entity IDs to entity data (for node labels, images, etc.)
 * @returns Object containing nodes and edges for ReactFlow
 */
export function transformRelationshipsToReactFlow(
  relationships: Relationship[],
  centralEntity?: EntityData,
  entityDataMap: Record<string, EntityData> = {}
): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeMap = new Map<string, boolean>();

  // Add central entity if provided
  if (centralEntity) {
    const nodeType = getNodeTypeFromEntityType(centralEntity.type);
    nodes.push({
      id: centralEntity.id,
      type: nodeType,
      position: { x: 0, y: 0 }, // Will be positioned by layout algorithm
      data: {
        ...centralEntity,
        label: centralEntity.name,
        isCentral: true
      }
    });
    nodeMap.set(centralEntity.id, true);
  }

  // Process relationships to create nodes and edges
  relationships.forEach((relationship) => {
    // Create source node if not already created
    if (!nodeMap.has(relationship.sourceId)) {
      const sourceType = getNodeTypeFromEntityType(relationship.sourceType);
      const sourceData = entityDataMap[relationship.sourceId] || {
        id: relationship.sourceId,
        name: 'Unknown Entity',
        type: relationship.sourceType
      };

      nodes.push({
        id: relationship.sourceId,
        type: sourceType,
        position: { x: 0, y: 0 }, // Will be positioned by layout algorithm
        data: {
          ...sourceData,
          label: sourceData.name
        }
      });
      nodeMap.set(relationship.sourceId, true);
    }

    // Create target node if not already created
    if (!nodeMap.has(relationship.targetId)) {
      const targetType = getNodeTypeFromEntityType(relationship.targetType);
      const targetData = entityDataMap[relationship.targetId] || {
        id: relationship.targetId,
        name: 'Unknown Entity',
        type: relationship.targetType
      };

      nodes.push({
        id: relationship.targetId,
        type: targetType,
        position: { x: 0, y: 0 }, // Will be positioned by layout algorithm
        data: {
          ...targetData,
          label: targetData.name
        }
      });
      nodeMap.set(relationship.targetId, true);
    }

    // Create edge
    edges.push({
      id: relationship.id || `edge-${relationship.sourceId}-${relationship.targetId}`,
      source: relationship.sourceId,
      target: relationship.targetId,
      type: 'relationship',
      data: {
        type: relationship.relationshipType,
        label: formatRelationshipType(relationship.relationshipType),
        description: relationship.description,
        strength: relationship.strength
      },
      markerEnd: {
        type: MarkerType.ArrowClosed
      }
    });
  });

  return { nodes, edges };
}

/**
 * Get node type from entity type
 *
 * @param entityType - Entity type from Firestore
 * @returns Node type for ReactFlow
 */
export function getNodeTypeFromEntityType(entityType: any): string {
  // Handle both EntityType from models/EntityType and EntityType from services/relationship.service
  const entityTypeValue = typeof entityType === 'string' ? entityType : '';

  // Convert to lowercase for consistent comparison
  const lowerCaseType = entityTypeValue.toLowerCase();

  switch (lowerCaseType) {
    case 'character':
      return 'character';
    case 'location':
      return 'location';
    case 'item':
      return 'item';
    case 'event':
      return 'event';
    case 'session':
      return 'session';
    case 'faction':
      return 'faction';
    case 'storyarc':
    case 'story_arc':
      return 'storyarc';
    case 'note':
      return 'note';
    case 'campaign':
      return 'campaign';
    case 'rpgworld':
    case 'rpg_world':
      return 'world';
    default:
      return 'default';
  }
}

/**
 * Format relationship type for display
 *
 * @param relationshipType - Relationship type from Firestore
 * @returns Formatted relationship type for display
 */
export function formatRelationshipType(relationshipType: string): string {
  return relationshipType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Get color for relationship type
 *
 * @param relationshipType - Relationship type from Firestore
 * @returns Color for the relationship
 */
export function getRelationshipColor(relationshipType: string): string {
  switch (relationshipType) {
    case 'FRIEND':
    case 'ALLY':
      return '#4caf50'; // Green
    case 'ENEMY':
    case 'RIVAL':
      return '#f44336'; // Red
    case 'FAMILY':
      return '#2196f3'; // Blue
    case 'MENTOR':
    case 'STUDENT':
      return '#9c27b0'; // Purple
    case 'LOVER':
      return '#e91e63'; // Pink
    case 'CONTAINS':
    case 'NEAR':
    case 'CONNECTED_TO':
      return '#ff9800'; // Orange
    case 'OWNS':
    case 'CREATED':
    case 'LOCATED_AT':
      return '#795548'; // Brown
    case 'PARTICIPATED_IN':
    case 'OCCURRED_AT':
    case 'CAUSED':
    case 'RESULTED_FROM':
      return '#00bcd4'; // Cyan
    case 'RELATED_TO':
    case 'PART_OF':
    case 'REFERENCES':
    default:
      return '#9e9e9e'; // Gray
  }
}
