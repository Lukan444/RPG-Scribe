/**
 * Vertex AI Vector Service
 *
 * This class implements the VectorService interface using Google's Vertex AI.
 * It handles generating and storing vector embeddings, as well as searching
 * for similar entities based on vector similarity.
 */

import { v4 as uuidv4 } from 'uuid';
import { EntityType } from '../../models/EntityType';
import { VectorService } from './VectorService';
import { VertexAIClient } from './VertexAIClient';
import { VertexAIIndexManager } from './VertexAIIndexManager';
import {
  EmbeddingOptions,
  SimilaritySearchOptions,
  SimilaritySearchResult,
  EmbeddingStorageRequest,
  ServiceStatus,
  VertexAIConfig
} from './types';
import { DEFAULT_EMBEDDING_MODEL } from './config';

/**
 * Implementation of VectorService using Vertex AI
 */
export class VertexAIVectorService implements VectorService {
  private client: VertexAIClient;
  private indexManager: VertexAIIndexManager;
  private config: VertexAIConfig;
  private lastStatus: ServiceStatus = {
    available: true,
    degraded: false,
    timestamp: Date.now()
  };
  private initialized: boolean = false;

  /**
   * Create a new Vertex AI Vector Service
   * @param config Vertex AI configuration
   */
  constructor(config: VertexAIConfig) {
    this.config = config;
    this.client = new VertexAIClient(config);
    this.indexManager = new VertexAIIndexManager(config);
  }

  /**
   * Initialize the vector service
   * Sets up indices and prepares for operations
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('Initializing Vertex AI Vector Service...');

      // Initialize the index manager
      await this.indexManager.initialize();

      // Create default indices for each entity type if they don't exist
      await this.ensureDefaultIndices();

      this.initialized = true;
      console.log('Vertex AI Vector Service initialized successfully');
    } catch (error) {
      console.error('Error initializing Vertex AI Vector Service:', error);
      throw new Error(`Failed to initialize Vector Service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ensure default indices exist for all entity types
   * @private
   */
  private async ensureDefaultIndices(): Promise<void> {
    const entityTypes = Object.values(EntityType);
    const existingIndices = this.indexManager.getAllIndices();

    // Check if we have indices for all entity types
    const coveredTypes = new Set<EntityType>();
    existingIndices.forEach(index => {
      index.entityTypes.forEach(type => coveredTypes.add(type));
    });

    // Create indices for uncovered entity types
    const uncoveredTypes = entityTypes.filter(type => !coveredTypes.has(type));

    if (uncoveredTypes.length > 0) {
      console.log(`Creating default indices for entity types: ${uncoveredTypes.join(', ')}`);

      // Group entity types for efficient indexing
      const groups = [
        { name: 'characters', types: [EntityType.CHARACTER] },
        { name: 'locations', types: [EntityType.LOCATION] },
        { name: 'factions', types: [EntityType.FACTION] },
        { name: 'items', types: [EntityType.ITEM] },
        { name: 'events', types: [EntityType.EVENT] },
        { name: 'notes', types: [EntityType.NOTE] },
        { name: 'campaigns', types: [EntityType.CAMPAIGN] },
        { name: 'sessions', types: [EntityType.SESSION] },
        { name: 'story-arcs', types: [EntityType.STORY_ARC] }
      ];

      for (const group of groups) {
        const needsIndex = group.types.some(type => uncoveredTypes.includes(type));
        if (needsIndex) {
          await this.indexManager.createIndex(
            group.name,
            group.types.filter(type => uncoveredTypes.includes(type))
          );
        }
      }
    }
  }

  /**
   * Generate an embedding vector from text
   * @param text Text to generate embedding for
   * @param options Embedding generation options
   * @returns Embedding vector as array of numbers
   */
  async generateEmbedding(text: string, options?: EmbeddingOptions): Promise<number[]> {
    try {
      const startTime = Date.now();

      const model = options?.model || this.config.embeddingModel || DEFAULT_EMBEDDING_MODEL;
      const response = await this.client.generateEmbedding(text, model);

      // Update service status
      this.updateServiceStatus(true, false, Date.now() - startTime);

      return response.embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update service status
      this.updateServiceStatus(false, true, undefined, errorMessage);

      throw new Error(`Failed to generate embedding: ${errorMessage}`);
    }
  }

  /**
   * Store an embedding vector
   * @param entityId ID of the entity
   * @param entityType Type of the entity
   * @param embedding Embedding vector
   * @param metadata Additional metadata
   * @returns ID of the stored embedding
   */
  async storeEmbedding(
    entityId: string,
    entityType: EntityType,
    embedding: number[],
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      // Ensure the service is initialized
      await this.initialize();

      // Prepare entity vector data
      const entityVectorData = [{
        entityId,
        entityType,
        embedding,
        metadata: {
          name: metadata?.name || entityId,
          description: metadata?.description,
          tags: metadata?.tags || [],
          lastUpdated: new Date()
        }
      }];

      // Store in appropriate indices using the index manager
      await this.indexManager.addEntityVectors(entityVectorData);

      console.log(`Stored embedding for entity ${entityId} of type ${entityType}`);
      return entityId; // Use entity ID as the embedding ID
    } catch (error) {
      console.error('Error storing embedding:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to store embedding: ${errorMessage}`);
    }
  }

  /**
   * Find similar entities using an embedding vector
   * @param embedding Embedding vector to compare against
   * @param options Search options
   * @returns Array of similarity search results
   */
  async findSimilar(
    embedding: number[],
    options?: SimilaritySearchOptions
  ): Promise<SimilaritySearchResult[]> {
    try {
      // Ensure the service is initialized
      await this.initialize();

      const entityTypes = options?.entityTypes || Object.values(EntityType);
      const limit = options?.limit || 10;
      const minScore = options?.minScore || 0.0;

      // Search using the index manager
      const results = await this.indexManager.searchSimilarEntities(
        embedding,
        entityTypes,
        limit
      );

      // Convert to SimilaritySearchResult format and filter by minimum score
      return results
        .filter(result => result.score >= minScore)
        .map(result => ({
          embeddingId: result.entityId, // Use entityId as embeddingId
          entityId: result.entityId,
          entityType: result.metadata?.entity_type?.[0] as EntityType || EntityType.CHARACTER,
          score: result.score,
          metadata: result.metadata
        }));
    } catch (error) {
      console.error('Error finding similar entities:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find similar entities: ${errorMessage}`);
    }
  }

  /**
   * Find similar entities using text
   * @param text Text to find similar entities for
   * @param options Search options
   * @returns Array of similarity search results
   */
  async findSimilarByText(
    text: string,
    options?: SimilaritySearchOptions
  ): Promise<SimilaritySearchResult[]> {
    try {
      // Generate embedding for the text
      const embedding = await this.generateEmbedding(text, {
        model: options?.entityTypes?.length === 1
          ? this.getModelForEntityType(options.entityTypes[0])
          : undefined
      });

      // Find similar entities using the embedding
      return this.findSimilar(embedding, options);
    } catch (error) {
      console.error('Error finding similar entities by text:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find similar entities by text: ${errorMessage}`);
    }
  }

  /**
   * Delete an embedding
   * @param embeddingId ID of the embedding to delete (entity ID)
   * @param entityType Type of the entity (required for targeting correct indices)
   * @returns True if successful
   */
  async deleteEmbedding(embeddingId: string, entityType?: EntityType): Promise<boolean> {
    try {
      // Ensure the service is initialized
      await this.initialize();

      if (!entityType) {
        // If no entity type provided, we can't efficiently target indices
        console.warn(`No entity type provided for embedding deletion: ${embeddingId}`);
        return false;
      }

      // Remove from indices using the index manager
      await this.indexManager.removeEntityVectors([embeddingId], entityType);

      console.log(`Deleted embedding ${embeddingId} of type ${entityType}`);
      return true;
    } catch (error) {
      console.error('Error deleting embedding:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete embedding: ${errorMessage}`);
    }
  }

  /**
   * Generate multiple embeddings in batch
   * @param texts Array of texts to generate embeddings for
   * @param options Embedding generation options
   * @returns Array of embedding vectors
   */
  async generateEmbeddingsBatch(
    texts: string[],
    options?: EmbeddingOptions
  ): Promise<number[][]> {
    try {
      const startTime = Date.now();

      const model = options?.model || this.config.embeddingModel || DEFAULT_EMBEDDING_MODEL;
      const responses = await this.client.generateEmbeddingsBatch(texts, model);

      // Update service status
      this.updateServiceStatus(true, false, Date.now() - startTime);

      return responses.map(response => response.embedding);
    } catch (error) {
      console.error('Error generating embeddings batch:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update service status
      this.updateServiceStatus(false, true, undefined, errorMessage);

      throw new Error(`Failed to generate embeddings batch: ${errorMessage}`);
    }
  }

  /**
   * Store multiple embeddings in batch
   * @param embeddings Array of embedding storage requests
   * @returns Array of stored embedding IDs
   */
  async storeEmbeddingsBatch(
    embeddings: EmbeddingStorageRequest[]
  ): Promise<string[]> {
    try {
      // Store each embedding individually
      // In a real implementation, this would be optimized to use batch operations
      const embeddingIds = await Promise.all(
        embeddings.map(request =>
          this.storeEmbedding(
            request.entityId,
            request.entityType,
            request.embedding,
            request.metadata
          )
        )
      );

      return embeddingIds;
    } catch (error) {
      console.error('Error storing embeddings batch:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to store embeddings batch: ${errorMessage}`);
    }
  }

  /**
   * Get the status of the vector service
   * @returns Service status
   */
  async getServiceStatus(): Promise<ServiceStatus> {
    try {
      // Perform a simple operation to check if the service is available
      await this.generateEmbedding('test', { model: this.config.embeddingModel });

      return {
        available: true,
        degraded: false,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error checking service status:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        available: false,
        degraded: true,
        error: errorMessage,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Update the service status
   * @param available Whether the service is available
   * @param degraded Whether the service is in degraded mode
   * @param latencyMs Latency in milliseconds
   * @param error Error message if any
   */
  private updateServiceStatus(
    available: boolean,
    degraded: boolean,
    latencyMs?: number,
    error?: string
  ): void {
    this.lastStatus = {
      available,
      degraded,
      latencyMs,
      error,
      timestamp: Date.now()
    };
  }

  /**
   * Get the embedding model for a specific entity type
   * @param entityType Entity type
   * @returns Embedding model
   */
  private getModelForEntityType(entityType: EntityType): string {
    // In a real implementation, this might return different models for different entity types
    // For now, we'll just return the default model
    return this.config.embeddingModel || DEFAULT_EMBEDDING_MODEL;
  }
}
