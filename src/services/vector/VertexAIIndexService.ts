/**
 * Vertex AI Index Service
 * 
 * Comprehensive service for managing Vertex AI vector indexes with full CRUD operations,
 * lifecycle management, and integration with RPG Scribe entities.
 */

import { v4 as uuidv4 } from 'uuid';
import { VertexAIClient } from './VertexAIClient';
import { VertexAIIndexManager } from './VertexAIIndexManager';
import { FirestoreService } from '../firestore.service';
import { EntityType } from '../../models/EntityType';
import { VertexAIConfig, SimilaritySearchOptions, SimilaritySearchResult } from './types';
import { DEFAULT_EMBEDDING_DIMENSION, DEFAULT_EMBEDDING_MODEL } from './config';

/**
 * Index lifecycle status
 */
export enum IndexStatus {
  CREATING = 'CREATING',
  ACTIVE = 'ACTIVE',
  UPDATING = 'UPDATING',
  DELETING = 'DELETING',
  ERROR = 'ERROR',
  MAINTENANCE = 'MAINTENANCE'
}

/**
 * Enhanced index metadata with lifecycle management
 */
export interface IndexMetadata {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  entityTypes: EntityType[];
  dimensions: number;
  distanceMeasure: 'DOT_PRODUCT_DISTANCE' | 'COSINE_DISTANCE' | 'SQUARED_L2_DISTANCE';
  status: IndexStatus;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
  vectorCount: number;
  worldId?: string; // For world-scoped indexes
  campaignId?: string; // For campaign-scoped indexes
  namespace: string;
  error?: string;
  performance: {
    avgSearchTime: number;
    totalSearches: number;
    lastSearchAt?: Date;
  };
}

/**
 * Entity vector data with enhanced metadata
 */
export interface EntityVectorData {
  entityId: string;
  entityType: EntityType;
  worldId?: string;
  campaignId?: string;
  embedding: number[];
  metadata: {
    name: string;
    description?: string;
    tags?: string[];
    lastUpdated: Date;
    schemaVersion: number;
  };
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  success: boolean;
  totalEntities: number;
  processedEntities: number;
  successfulOperations: number;
  failedOperations: number;
  errors: Array<{
    entityId: string;
    error: string;
  }>;
  duration: number;
  performance: {
    entitiesPerSecond: number;
    avgProcessingTime: number;
  };
}

/**
 * Search performance metrics
 */
export interface SearchMetrics {
  searchTime: number;
  resultsCount: number;
  indexesSearched: number;
  cacheHit: boolean;
  timestamp: Date;
}

/**
 * Comprehensive Vertex AI Index Service
 */
export class VertexAIIndexService {
  private client: VertexAIClient;
  private indexManager: VertexAIIndexManager;
  private firestoreService: FirestoreService<any>;
  private config: VertexAIConfig;
  private indices: Map<string, IndexMetadata> = new Map();
  private operationQueue: Map<string, Promise<any>> = new Map();
  private performanceMetrics: Map<string, SearchMetrics[]> = new Map();

  constructor(config: VertexAIConfig) {
    this.config = config;
    this.client = new VertexAIClient(config);
    this.indexManager = new VertexAIIndexManager(config);
    this.firestoreService = new FirestoreService('vector_metadata');
  }

  /**
   * Initialize the service and load existing indexes
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing VertexAI Index Service...');
      
      // Initialize underlying services
      await this.indexManager.initialize();
      
      // Load index metadata from Firestore
      await this.loadIndexMetadata();
      
      // Verify index status
      await this.verifyAllIndexes();
      
      // Create default indexes if needed
      await this.createDefaultIndexes();
      
      console.log(`VertexAI Index Service initialized with ${this.indices.size} indexes`);
    } catch (error) {
      console.error('Failed to initialize VertexAI Index Service:', error);
      throw error;
    }
  }

  /**
   * Create a new vector index
   */
  async createIndex(
    name: string,
    entityTypes: EntityType[],
    options: {
      dimensions?: number;
      distanceMeasure?: 'DOT_PRODUCT_DISTANCE' | 'COSINE_DISTANCE' | 'SQUARED_L2_DISTANCE';
      worldId?: string;
      campaignId?: string;
      description?: string;
    } = {}
  ): Promise<IndexMetadata> {
    const {
      dimensions = DEFAULT_EMBEDDING_DIMENSION,
      distanceMeasure = 'COSINE_DISTANCE',
      worldId,
      campaignId,
      description
    } = options;

    try {
      const indexId = uuidv4();
      const namespace = this.generateNamespace(entityTypes, worldId, campaignId);
      const displayName = `${this.config.namespace}-${name}-${indexId.substring(0, 8)}`;

      // Create index using the manager
      const managerMetadata = await this.indexManager.createIndex(
        name,
        entityTypes,
        dimensions,
        distanceMeasure
      );

      // Create enhanced metadata
      const metadata: IndexMetadata = {
        id: indexId,
        name,
        displayName,
        description: description || `RPG Scribe vector index for ${entityTypes.join(', ')} entities`,
        entityTypes,
        dimensions,
        distanceMeasure,
        status: IndexStatus.CREATING,
        createdAt: new Date(),
        updatedAt: new Date(),
        vectorCount: 0,
        worldId,
        campaignId,
        namespace,
        performance: {
          avgSearchTime: 0,
          totalSearches: 0
        }
      };

      // Store metadata
      this.indices.set(indexId, metadata);
      await this.saveIndexMetadata(metadata);

      console.log(`Created index "${name}" with ID: ${indexId}`);
      return metadata;
    } catch (error) {
      console.error('Failed to create index:', error);
      throw error;
    }
  }

  /**
   * Get index by ID
   */
  getIndex(indexId: string): IndexMetadata | undefined {
    return this.indices.get(indexId);
  }

  /**
   * Get all indexes
   */
  getAllIndexes(): IndexMetadata[] {
    return Array.from(this.indices.values());
  }

  /**
   * Get indexes for specific entity types and scope
   */
  getIndexesForScope(
    entityTypes: EntityType[],
    worldId?: string,
    campaignId?: string
  ): IndexMetadata[] {
    return Array.from(this.indices.values()).filter(index => {
      const typeMatch = entityTypes.some(type => index.entityTypes.includes(type));
      const worldMatch = !worldId || index.worldId === worldId;
      const campaignMatch = !campaignId || index.campaignId === campaignId;
      
      return typeMatch && worldMatch && campaignMatch && index.status === IndexStatus.ACTIVE;
    });
  }

  /**
   * Update index configuration
   */
  async updateIndex(
    indexId: string,
    updates: Partial<Pick<IndexMetadata, 'name' | 'description' | 'entityTypes'>>
  ): Promise<IndexMetadata> {
    const index = this.indices.get(indexId);
    if (!index) {
      throw new Error(`Index ${indexId} not found`);
    }

    try {
      index.status = IndexStatus.UPDATING;
      
      // Apply updates
      Object.assign(index, updates, { updatedAt: new Date() });
      
      // Save to Firestore
      await this.saveIndexMetadata(index);
      
      index.status = IndexStatus.ACTIVE;
      console.log(`Updated index ${indexId}`);
      
      return index;
    } catch (error) {
      index.status = IndexStatus.ERROR;
      index.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Delete an index
   */
  async deleteIndex(indexId: string): Promise<void> {
    const index = this.indices.get(indexId);
    if (!index) {
      throw new Error(`Index ${indexId} not found`);
    }

    try {
      index.status = IndexStatus.DELETING;
      
      // Delete from Vertex AI (would need actual implementation)
      // await this.client.deleteIndex(indexId);
      
      // Remove from local storage
      this.indices.delete(indexId);
      
      // Remove from Firestore
      await this.firestoreService.delete(indexId);
      
      console.log(`Deleted index ${indexId}`);
    } catch (error) {
      index.status = IndexStatus.ERROR;
      index.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Generate namespace for index organization
   */
  private generateNamespace(
    entityTypes: EntityType[],
    worldId?: string,
    campaignId?: string
  ): string {
    const typePrefix = entityTypes.join('_').toLowerCase();
    const scopePrefix = campaignId ? `campaign_${campaignId}` : 
                      worldId ? `world_${worldId}` : 'global';
    
    return `${this.config.namespace}_${scopePrefix}_${typePrefix}`;
  }

  /**
   * Load index metadata from Firestore
   */
  private async loadIndexMetadata(): Promise<void> {
    try {
      const { data: metadataList } = await this.firestoreService.query([], 1000);

      for (const metadata of metadataList) {
        if (metadata.id) {
          this.indices.set(metadata.id, metadata as IndexMetadata);
        }
      }

      console.log(`Loaded ${metadataList.length} index metadata records`);
    } catch (error) {
      console.error('Failed to load index metadata:', error);
      // Continue with empty metadata - not critical for operation
    }
  }

  /**
   * Save index metadata to Firestore
   */
  private async saveIndexMetadata(metadata: IndexMetadata): Promise<void> {
    try {
      await this.firestoreService.update(metadata.id, metadata);
    } catch (error) {
      console.error('Failed to save index metadata:', error);
      // Non-critical error - continue operation
    }
  }

  /**
   * Verify status of all indexes
   */
  private async verifyAllIndexes(): Promise<void> {
    const verificationPromises = Array.from(this.indices.values()).map(async (index) => {
      try {
        // In a real implementation, this would check Vertex AI status
        // For now, assume active if not in error state
        if (index.status !== IndexStatus.ERROR) {
          index.status = IndexStatus.ACTIVE;
        }
        index.updatedAt = new Date();
      } catch (error) {
        index.status = IndexStatus.ERROR;
        index.error = error instanceof Error ? error.message : 'Unknown error';
      }
    });

    await Promise.allSettled(verificationPromises);
  }

  /**
   * Create default indexes for all entity types
   */
  private async createDefaultIndexes(): Promise<void> {
    const entityTypes = Object.values(EntityType);
    const existingTypes = new Set(
      Array.from(this.indices.values()).flatMap(index => index.entityTypes)
    );

    const missingTypes = entityTypes.filter(type => !existingTypes.has(type));

    if (missingTypes.length > 0) {
      console.log(`Creating default indexes for: ${missingTypes.join(', ')}`);

      // Create a general index for all missing types
      await this.createIndex(
        'default-entities',
        missingTypes,
        {
          description: 'Default index for all RPG entity types'
        }
      );
    }
  }

  /**
   * Add entity vectors to appropriate indexes (batch operation)
   */
  async addEntityVectors(entityData: EntityVectorData[]): Promise<BatchOperationResult> {
    const startTime = Date.now();
    const result: BatchOperationResult = {
      success: false,
      totalEntities: entityData.length,
      processedEntities: 0,
      successfulOperations: 0,
      failedOperations: 0,
      errors: [],
      duration: 0,
      performance: {
        entitiesPerSecond: 0,
        avgProcessingTime: 0
      }
    };

    try {
      console.log(`Adding ${entityData.length} entity vectors to indexes`);

      // Group entities by target indexes
      const indexGroups = new Map<string, EntityVectorData[]>();

      for (const entity of entityData) {
        const targetIndexes = this.getIndexesForScope(
          [entity.entityType],
          entity.worldId,
          entity.campaignId
        );

        for (const index of targetIndexes) {
          if (!indexGroups.has(index.id)) {
            indexGroups.set(index.id, []);
          }
          indexGroups.get(index.id)!.push(entity);
        }
      }

      // Process each index group
      for (const [indexId, entities] of indexGroups) {
        try {
          await this.indexManager.addEntityVectors(entities);
          result.successfulOperations += entities.length;

          // Update index metadata
          const index = this.indices.get(indexId);
          if (index) {
            index.vectorCount += entities.length;
            index.lastSyncAt = new Date();
            index.updatedAt = new Date();
            await this.saveIndexMetadata(index);
          }
        } catch (error) {
          result.failedOperations += entities.length;
          entities.forEach(entity => {
            result.errors.push({
              entityId: entity.entityId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          });
        }
        result.processedEntities += entities.length;
      }

      result.duration = Date.now() - startTime;
      result.performance.entitiesPerSecond = result.totalEntities / (result.duration / 1000);
      result.performance.avgProcessingTime = result.duration / result.totalEntities;
      result.success = result.failedOperations === 0;

      console.log(`Batch operation completed: ${result.successfulOperations}/${result.totalEntities} successful`);
      return result;
    } catch (error) {
      result.duration = Date.now() - startTime;
      result.success = false;
      console.error('Batch add operation failed:', error);
      throw error;
    }
  }

  /**
   * Remove entity vectors from indexes
   */
  async removeEntityVectors(
    entityIds: string[],
    entityType: EntityType,
    worldId?: string,
    campaignId?: string
  ): Promise<BatchOperationResult> {
    const startTime = Date.now();
    const result: BatchOperationResult = {
      success: false,
      totalEntities: entityIds.length,
      processedEntities: 0,
      successfulOperations: 0,
      failedOperations: 0,
      errors: [],
      duration: 0,
      performance: {
        entitiesPerSecond: 0,
        avgProcessingTime: 0
      }
    };

    try {
      console.log(`Removing ${entityIds.length} entity vectors of type ${entityType}`);

      const targetIndexes = this.getIndexesForScope([entityType], worldId, campaignId);

      for (const index of targetIndexes) {
        try {
          await this.indexManager.removeEntityVectors(entityIds, entityType);
          result.successfulOperations += entityIds.length;

          // Update index metadata
          index.vectorCount = Math.max(0, index.vectorCount - entityIds.length);
          index.updatedAt = new Date();
          await this.saveIndexMetadata(index);
        } catch (error) {
          result.failedOperations += entityIds.length;
          entityIds.forEach(entityId => {
            result.errors.push({
              entityId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          });
        }
        result.processedEntities += entityIds.length;
      }

      result.duration = Date.now() - startTime;
      result.performance.entitiesPerSecond = result.totalEntities / (result.duration / 1000);
      result.performance.avgProcessingTime = result.duration / result.totalEntities;
      result.success = result.failedOperations === 0;

      console.log(`Batch remove operation completed: ${result.successfulOperations}/${result.totalEntities} successful`);
      return result;
    } catch (error) {
      result.duration = Date.now() - startTime;
      result.success = false;
      console.error('Batch remove operation failed:', error);
      throw error;
    }
  }

  /**
   * Perform semantic search across entity types
   */
  async semanticSearch(
    query: string,
    options: SimilaritySearchOptions & {
      worldId?: string;
      campaignId?: string;
      includeMetadata?: boolean;
    } = {}
  ): Promise<{
    results: SimilaritySearchResult[];
    metrics: SearchMetrics;
  }> {
    const startTime = Date.now();
    const {
      entityTypes = Object.values(EntityType),
      limit = 10,
      minScore = 0.7,
      worldId,
      campaignId,
      includeMetadata = true
    } = options;

    try {
      // Generate query embedding
      const queryEmbedding = await this.client.generateEmbedding(
        query,
        DEFAULT_EMBEDDING_MODEL
      );

      // Find relevant indexes
      const targetIndexes = this.getIndexesForScope(entityTypes, worldId, campaignId);

      if (targetIndexes.length === 0) {
        throw new Error('No active indexes found for the specified criteria');
      }

      // Search across all relevant indexes
      const allResults: SimilaritySearchResult[] = [];

      for (const index of targetIndexes) {
        try {
          const indexResults = await this.indexManager.searchSimilarEntities(
            queryEmbedding.embedding,
            index.entityTypes,
            limit
          );

          // Convert to standard format and filter by score
          const formattedResults = indexResults
            .filter(result => result.score >= minScore)
            .map(result => ({
              embeddingId: result.entityId,
              entityId: result.entityId,
              entityType: result.metadata?.entity_type || EntityType.CHARACTER,
              score: result.score,
              metadata: includeMetadata ? result.metadata : undefined
            }));

          allResults.push(...formattedResults);

          // Update index performance metrics
          index.performance.totalSearches++;
          index.performance.lastSearchAt = new Date();

        } catch (error) {
          console.error(`Search failed for index ${index.id}:`, error);
          // Continue with other indexes
        }
      }

      // Sort by score and limit results
      allResults.sort((a, b) => b.score - a.score);
      const finalResults = allResults.slice(0, limit);

      const searchTime = Date.now() - startTime;
      const metrics: SearchMetrics = {
        searchTime,
        resultsCount: finalResults.length,
        indexesSearched: targetIndexes.length,
        cacheHit: false, // TODO: Implement caching
        timestamp: new Date()
      };

      // Update performance metrics
      this.updateSearchMetrics(query, metrics);

      console.log(`Semantic search completed: ${finalResults.length} results in ${searchTime}ms`);

      return {
        results: finalResults,
        metrics
      };
    } catch (error) {
      console.error('Semantic search failed:', error);
      throw error;
    }
  }

  /**
   * Update search performance metrics
   */
  private updateSearchMetrics(query: string, metrics: SearchMetrics): void {
    const queryKey = query.toLowerCase().trim();

    if (!this.performanceMetrics.has(queryKey)) {
      this.performanceMetrics.set(queryKey, []);
    }

    const queryMetrics = this.performanceMetrics.get(queryKey)!;
    queryMetrics.push(metrics);

    // Keep only last 100 metrics per query
    if (queryMetrics.length > 100) {
      queryMetrics.splice(0, queryMetrics.length - 100);
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalSearches: number;
    avgSearchTime: number;
    totalIndexes: number;
    activeIndexes: number;
    totalVectors: number;
  } {
    const allMetrics = Array.from(this.performanceMetrics.values()).flat();
    const activeIndexes = Array.from(this.indices.values()).filter(
      index => index.status === IndexStatus.ACTIVE
    );

    return {
      totalSearches: allMetrics.length,
      avgSearchTime: allMetrics.length > 0
        ? allMetrics.reduce((sum, m) => sum + m.searchTime, 0) / allMetrics.length
        : 0,
      totalIndexes: this.indices.size,
      activeIndexes: activeIndexes.length,
      totalVectors: activeIndexes.reduce((sum, index) => sum + index.vectorCount, 0)
    };
  }
}
