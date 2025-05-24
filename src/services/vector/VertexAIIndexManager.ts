/**
 * Vertex AI Index Manager
 *
 * This service manages vector indices in Vertex AI, including creation,
 * updates, maintenance, and synchronization with RPG entities.
 */

import { v4 as uuidv4 } from 'uuid';
import { VertexAIClient } from './VertexAIClient';
import { VertexAIConfig } from './types';
import { EntityType } from '../../models/EntityType';
import { DEFAULT_EMBEDDING_DIMENSION } from './config';

/**
 * Index metadata for tracking and management
 */
interface IndexMetadata {
  id: string;
  name: string;
  entityTypes: EntityType[];
  dimensions: number;
  distanceMeasure: 'DOT_PRODUCT_DISTANCE' | 'COSINE_DISTANCE' | 'SQUARED_L2_DISTANCE';
  status: 'CREATING' | 'ACTIVE' | 'UPDATING' | 'ERROR';
  createdAt: Date;
  updatedAt: Date;
  vectorCount: number;
  lastSyncAt?: Date;
  error?: string;
}

/**
 * Entity vector data for index operations
 */
interface EntityVectorData {
  entityId: string;
  entityType: EntityType;
  embedding: number[];
  metadata: {
    name: string;
    description?: string;
    tags?: string[];
    lastUpdated: Date;
  };
}

/**
 * Index synchronization result
 */
interface SyncResult {
  success: boolean;
  entitiesProcessed: number;
  entitiesAdded: number;
  entitiesUpdated: number;
  entitiesRemoved: number;
  errors: string[];
  duration: number;
}

/**
 * Vertex AI Index Manager
 */
export class VertexAIIndexManager {
  private client: VertexAIClient;
  private config: VertexAIConfig;
  private indices: Map<string, IndexMetadata> = new Map();
  private syncInProgress: Set<string> = new Set();

  /**
   * Create a new Vertex AI Index Manager
   * @param config Vertex AI configuration
   */
  constructor(config: VertexAIConfig) {
    this.config = config;
    this.client = new VertexAIClient(config);
  }

  /**
   * Initialize the index manager
   * Loads existing indices and verifies their status
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing Vertex AI Index Manager...');
      
      // Load existing indices from configuration or storage
      await this.loadExistingIndices();
      
      // Verify status of all indices
      await this.verifyIndicesStatus();
      
      console.log(`Index Manager initialized with ${this.indices.size} indices`);
    } catch (error) {
      console.error('Error initializing Index Manager:', error);
      throw new Error(`Failed to initialize Index Manager: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new vector index for specific entity types
   * @param name Index name
   * @param entityTypes Entity types to include in this index
   * @param dimensions Vector dimensions (default: 768)
   * @param distanceMeasure Distance measure type
   * @returns Index metadata
   */
  async createIndex(
    name: string,
    entityTypes: EntityType[],
    dimensions: number = DEFAULT_EMBEDDING_DIMENSION,
    distanceMeasure: 'DOT_PRODUCT_DISTANCE' | 'COSINE_DISTANCE' | 'SQUARED_L2_DISTANCE' = 'COSINE_DISTANCE'
  ): Promise<IndexMetadata> {
    try {
      console.log(`Creating index "${name}" for entity types:`, entityTypes);

      const indexId = uuidv4();
      const displayName = `${this.config.namespace}-${name}-${indexId.substring(0, 8)}`;

      // Create index configuration
      const indexConfig = {
        displayName,
        description: `RPG Scribe vector index for ${entityTypes.join(', ')} entities`,
        metadata: {
          config: {
            dimensions,
            approximateNeighborsCount: 150,
            distanceMeasureType: distanceMeasure,
            algorithmConfig: {
              treeAhConfig: {
                leafNodeEmbeddingCount: 500,
                leafNodesToSearchPercent: 7
              }
            }
          }
        }
      };

      // Create the index in Vertex AI
      const vertexIndexId = await this.client.createIndex(indexConfig);

      // Create index metadata
      const metadata: IndexMetadata = {
        id: indexId,
        name,
        entityTypes,
        dimensions,
        distanceMeasure,
        status: 'CREATING',
        createdAt: new Date(),
        updatedAt: new Date(),
        vectorCount: 0
      };

      // Store metadata
      this.indices.set(indexId, metadata);

      console.log(`Index "${name}" created with ID: ${indexId}`);
      return metadata;
    } catch (error) {
      console.error('Error creating index:', error);
      throw new Error(`Failed to create index: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get index by ID
   * @param indexId Index ID
   * @returns Index metadata or undefined
   */
  getIndex(indexId: string): IndexMetadata | undefined {
    return this.indices.get(indexId);
  }

  /**
   * Get all indices
   * @returns Array of index metadata
   */
  getAllIndices(): IndexMetadata[] {
    return Array.from(this.indices.values());
  }

  /**
   * Get indices for specific entity types
   * @param entityTypes Entity types to filter by
   * @returns Array of matching index metadata
   */
  getIndicesForEntityTypes(entityTypes: EntityType[]): IndexMetadata[] {
    return Array.from(this.indices.values()).filter(index =>
      entityTypes.some(type => index.entityTypes.includes(type))
    );
  }

  /**
   * Add or update entity vectors in appropriate indices
   * @param entityData Entity vector data
   * @returns Success status
   */
  async addEntityVectors(entityData: EntityVectorData[]): Promise<boolean> {
    try {
      console.log(`Adding ${entityData.length} entity vectors to indices`);

      // Group entities by their target indices
      const indexGroups = new Map<string, EntityVectorData[]>();
      
      for (const entity of entityData) {
        const targetIndices = this.getIndicesForEntityTypes([entity.entityType]);
        
        for (const index of targetIndices) {
          if (index.status === 'ACTIVE') {
            if (!indexGroups.has(index.id)) {
              indexGroups.set(index.id, []);
            }
            indexGroups.get(index.id)!.push(entity);
          }
        }
      }

      // Add vectors to each index
      for (const [indexId, entities] of indexGroups) {
        await this.addVectorsToIndex(indexId, entities);
      }

      console.log(`Successfully added vectors to ${indexGroups.size} indices`);
      return true;
    } catch (error) {
      console.error('Error adding entity vectors:', error);
      throw new Error(`Failed to add entity vectors: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove entity vectors from indices
   * @param entityIds Entity IDs to remove
   * @param entityType Entity type
   * @returns Success status
   */
  async removeEntityVectors(entityIds: string[], entityType: EntityType): Promise<boolean> {
    try {
      console.log(`Removing ${entityIds.length} entity vectors of type ${entityType}`);

      const targetIndices = this.getIndicesForEntityTypes([entityType]);
      
      for (const index of targetIndices) {
        if (index.status === 'ACTIVE') {
          await this.removeVectorsFromIndex(index.id, entityIds);
        }
      }

      console.log(`Successfully removed vectors from ${targetIndices.length} indices`);
      return true;
    } catch (error) {
      console.error('Error removing entity vectors:', error);
      throw new Error(`Failed to remove entity vectors: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for similar entities across relevant indices
   * @param queryVector Query vector
   * @param entityTypes Entity types to search within
   * @param limit Maximum number of results
   * @returns Search results
   */
  async searchSimilarEntities(
    queryVector: number[],
    entityTypes: EntityType[],
    limit: number = 10
  ): Promise<any[]> {
    try {
      const targetIndices = this.getIndicesForEntityTypes(entityTypes);
      const allResults: any[] = [];

      for (const index of targetIndices) {
        if (index.status === 'ACTIVE') {
          const results = await this.searchIndex(index.id, queryVector, limit);
          allResults.push(...results);
        }
      }

      // Sort by similarity score and limit results
      allResults.sort((a, b) => b.score - a.score);
      return allResults.slice(0, limit);
    } catch (error) {
      console.error('Error searching similar entities:', error);
      throw new Error(`Failed to search similar entities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load existing indices from storage or configuration
   * @private
   */
  private async loadExistingIndices(): Promise<void> {
    // In a real implementation, this would load from persistent storage
    // For now, we'll start with an empty set
    console.log('Loading existing indices...');
  }

  /**
   * Verify the status of all indices
   * @private
   */
  private async verifyIndicesStatus(): Promise<void> {
    console.log('Verifying indices status...');
    
    for (const [indexId, metadata] of this.indices) {
      try {
        // Check index status in Vertex AI
        // This would use the actual Vertex AI API
        console.log(`Verifying index ${indexId}...`);
        
        // Update metadata based on actual status
        metadata.updatedAt = new Date();
      } catch (error) {
        console.error(`Error verifying index ${indexId}:`, error);
        metadata.status = 'ERROR';
        metadata.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }
  }

  /**
   * Add vectors to a specific index
   * @param indexId Index ID
   * @param entities Entity data to add
   * @private
   */
  private async addVectorsToIndex(indexId: string, entities: EntityVectorData[]): Promise<void> {
    const index = this.indices.get(indexId);
    if (!index) {
      throw new Error(`Index ${indexId} not found`);
    }

    // Convert entities to vector data points
    const datapoints = entities.map(entity => ({
      datapoint_id: entity.entityId,
      feature_vector: entity.embedding,
      restricts: [{
        namespace: 'entity_type',
        allow_list: [entity.entityType]
      }]
    }));

    // Add to Vertex AI index
    await this.client.addVectorsToIndex(indexId, datapoints);

    // Update metadata
    index.vectorCount += entities.length;
    index.updatedAt = new Date();
    index.lastSyncAt = new Date();
  }

  /**
   * Remove vectors from a specific index
   * @param indexId Index ID
   * @param entityIds Entity IDs to remove
   * @private
   */
  private async removeVectorsFromIndex(indexId: string, entityIds: string[]): Promise<void> {
    const index = this.indices.get(indexId);
    if (!index) {
      throw new Error(`Index ${indexId} not found`);
    }

    // Remove from Vertex AI index
    await this.client.removeVectorsFromIndex(indexId, entityIds);

    // Update metadata
    index.vectorCount = Math.max(0, index.vectorCount - entityIds.length);
    index.updatedAt = new Date();
  }

  /**
   * Search within a specific index
   * @param indexId Index ID
   * @param queryVector Query vector
   * @param limit Result limit
   * @returns Search results
   * @private
   */
  private async searchIndex(indexId: string, queryVector: number[], limit: number): Promise<any[]> {
    const results = await this.client.searchVectors(indexId, queryVector, limit);
    
    // Process and format results
    return results.nearestNeighbors?.[0]?.neighbors?.map((neighbor: any) => ({
      entityId: neighbor.datapoint.datapoint_id,
      score: neighbor.distance,
      metadata: neighbor.datapoint.restricts
    })) || [];
  }
}
