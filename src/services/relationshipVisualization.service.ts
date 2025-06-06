import { RelationshipQueryService } from './relationshipQuery.service';
import { EntityType } from '../models/EntityType';
import { EntityServiceFactory } from './EntityServiceFactory';

/**
 * Node data for visualization
 */
export interface VisualizationNode {
  id: string;
  type: string;
  label: string;
  data?: any;
  x?: number;
  y?: number;
  color?: string;
  size?: number;
}

/**
 * Edge data for visualization
 */
export interface VisualizationEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  subtype: string;
  label?: string;
  color?: string;
  width?: number;
  dashed?: boolean;
  data?: any;
}

/**
 * Graph data for visualization
 */
export interface VisualizationGraph {
  nodes: VisualizationNode[];
  edges: VisualizationEdge[];
}

/**
 * Service for relationship visualization
 */
export class RelationshipVisualizationService {
  private queryService: RelationshipQueryService;
  private campaignId: string;
  
  // Type-specific colors and sizes
  private nodeColors: Record<string, string> = {
    character: '#4CAF50', // Green
    location: '#2196F3',  // Blue
    item: '#FFC107',      // Amber
    event: '#F44336',     // Red
    session: '#9C27B0',   // Purple
    campaign: '#FF5722',  // Deep Orange
    rpgworld: '#795548',  // Brown
    default: '#607D8B'    // Blue Grey
  };
  
  private nodeSizes: Record<string, number> = {
    character: 10,
    location: 12,
    item: 8,
    event: 9,
    session: 11,
    campaign: 14,
    rpgworld: 16,
    default: 10
  };
  
  private edgeColors: Record<string, string> = {
    'character-character': '#4CAF50',
    'character-location': '#2196F3',
    'character-item': '#FFC107',
    'character-event': '#F44336',
    'location-location': '#2196F3',
    'event-location': '#F44336',
    'item-character': '#FFC107',
    default: '#9E9E9E' // Grey
  };

  /**
   * Create a new RelationshipVisualizationService
   * @param campaignId Campaign ID
   */
  constructor(campaignId: string) {
    this.queryService = new RelationshipQueryService(campaignId);
    this.campaignId = campaignId;
  }

  /**
   * Get visualization data for a campaign
   * @param entityIds Entity IDs to include
   * @param entityTypes Entity types to include
   * @returns Visualization graph data
   */
  async getVisualizationData(
    entityIds: string[] = [],
    entityTypes: string[] = []
  ): Promise<VisualizationGraph> {
    try {
      // Get raw graph data
      const graphData = await this.queryService.getRelationshipGraphData(
        entityIds,
        entityTypes
      );
      
      // Transform nodes with visualization properties and fetch display names
      const nodes: VisualizationNode[] = await Promise.all(
        graphData.nodes.map(async node => ({
          ...node,
          label: await this.getEntityName(node.id, node.type),
          color: this.getNodeColor(node.type),
          size: this.getNodeSize(node.type)
        }))
      );
      
      // Transform edges with visualization properties
      const edges: VisualizationEdge[] = graphData.edges.map((edge, index) => ({
        id: `e${index}`,
        ...edge,
        label: this.getEdgeLabel(edge.type, edge.subtype),
        color: this.getEdgeColor(edge.type),
        width: 1,
        dashed: edge.subtype.includes('former') || edge.subtype.includes('past')
      }));
      
      return { nodes, edges };
    } catch (error) {
      console.error('Error getting visualization data:', error);
      return { nodes: [], edges: [] };
    }
  }

  /**
   * Get visualization data for a specific entity
   * @param entityId Entity ID
   * @param entityType Entity type
   * @param depth Relationship depth
   * @returns Visualization graph data
   */
  async getEntityVisualizationData(
    entityId: string,
    entityType: string,
    depth: number = 1
  ): Promise<VisualizationGraph> {
    try {
      const nodes: VisualizationNode[] = [];
      const edges: VisualizationEdge[] = [];
      const nodeMap = new Map<string, boolean>();
      
      // Add the central entity
      nodes.push({
        id: entityId,
        type: entityType,
        label: await this.getEntityName(entityId, entityType),
        color: this.getNodeColor(entityType),
        size: this.getNodeSize(entityType) * 1.5, // Make central node larger
        x: 0,
        y: 0
      });
      
      nodeMap.set(`${entityType}:${entityId}`, true);
      
      // Process each depth level
      let currentIds = [{ id: entityId, type: entityType }];
      
      for (let i = 0; i < depth; i++) {
        const nextIds: Array<{ id: string; type: string }> = [];
        
        for (const current of currentIds) {
          // Get related entities
          const relatedEntities = await this.queryService.getRelatedEntities(
            current.id,
            current.type
          );
          
          for (const related of relatedEntities) {
            const relatedKey = `${related.entityType}:${related.entityId}`;
            
            // Add node if not already added
            if (!nodeMap.has(relatedKey)) {
              nodeMap.set(relatedKey, true);
              
              nodes.push({
                id: related.entityId,
                type: related.entityType,
                label: await this.getEntityName(
                  related.entityId,
                  related.entityType
                ),
                color: this.getNodeColor(related.entityType),
                size: this.getNodeSize(related.entityType)
              });
              
              nextIds.push({
                id: related.entityId,
                type: related.entityType
              });
            }
            
            // Add edge
            const edgeId = related.isSource
              ? `${current.id}-${related.entityId}`
              : `${related.entityId}-${current.id}`;
              
            const source = related.isSource ? current.id : related.entityId;
            const target = related.isSource ? related.entityId : current.id;
            
            edges.push({
              id: edgeId,
              source,
              target,
              type: related.relationshipType,
              subtype: related.relationshipSubtype,
              label: this.getEdgeLabel(related.relationshipType, related.relationshipSubtype),
              color: this.getEdgeColor(related.relationshipType),
              width: 1,
              dashed: related.relationshipSubtype.includes('former') || related.relationshipSubtype.includes('past')
            });
          }
        }
        
        currentIds = nextIds;
      }
      
      return { nodes, edges };
    } catch (error) {
      console.error(`Error getting visualization data for ${entityId}:`, error);
      return { nodes: [], edges: [] };
    }
  }

  /**
   * Get node color based on type
   * @param type Node type
   * @returns Color
   */
  private getNodeColor(type: string): string {
    return this.nodeColors[type] || this.nodeColors.default;
  }

  /**
   * Get node size based on type
   * @param type Node type
   * @returns Size
   */
  private getNodeSize(type: string): number {
    return this.nodeSizes[type] || this.nodeSizes.default;
  }

  /**
   * Get edge color based on type
   * @param type Edge type
   * @returns Color
   */
  private getEdgeColor(type: string): string {
    return this.edgeColors[type] || this.edgeColors.default;
  }

  /**
   * Get edge label based on type and subtype
   * @param type Edge type
   * @param subtype Edge subtype
   * @returns Label
   */
  private getEdgeLabel(type: string, subtype: string): string {
    return subtype;
  }

  /**
   * Fetch the display name for an entity
   * @param id Entity ID
   * @param type Entity type
   * @returns Display name or ID if not found
   */
  private async getEntityName(id: string, type: string): Promise<string> {
    try {
      const entityType = (type as unknown) as EntityType;
      const service = EntityServiceFactory.getInstance().getService<any>(
        entityType,
        '',
        this.campaignId
      );
      const entity = await service.getById(id);
      if (entity && (entity as any).name) {
        return (entity as any).name as string;
      }
    } catch (err) {
      console.warn(`Failed to fetch name for ${type} ${id}:`, err);
    }
    return id;
  }
}
