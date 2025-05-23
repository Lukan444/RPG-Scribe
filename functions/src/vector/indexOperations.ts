/**
 * Vertex AI Index Operations
 * 
 * This file contains the CRUD operations for Vertex AI Vector Search indexes,
 * including vector storage, retrieval, and batch operations.
 */

import * as admin from "firebase-admin";
import { Logger } from "../utils/logging";
import { AppError, ErrorType } from "../utils/error-handling";
import { 
  IndexMetadata,
  getIndexMetadataPath,
  getVertexAIIndexId,
  CURRENT_SCHEMA_VERSION
} from "./indexSchema";
import { EntityType, EmbeddingData } from "./types";
import { getConfig } from "./config";
import { IndexManager } from "./indexManagement";
import { IndexServiceClient, IndexEndpointServiceClient } from "@google-cloud/aiplatform";
import { ServiceAccountManager } from "../auth/service-account-manager";
import { v4 as uuidv4 } from "uuid";

/**
 * Vector storage options
 */
export interface VectorStorageOptions {
  /** Whether to create the index if it doesn't exist */
  createIndexIfNotExists?: boolean;
  /** Whether to update the vector count after storage */
  updateVectorCount?: boolean;
  /** Batch ID for tracking batch operations */
  batchId?: string;
}

/**
 * Vector retrieval options
 */
export interface VectorRetrievalOptions {
  /** Number of neighbors to retrieve */
  neighborCount?: number;
  /** Whether to include vector values in the response */
  includeVectors?: boolean;
  /** Whether to include metadata in the response */
  includeMetadata?: boolean;
}

/**
 * Vector search result
 */
export interface VectorSearchResult {
  /** ID of the vector */
  id: string;
  /** Distance from the query vector */
  distance: number;
  /** Vector values (if includeVectors is true) */
  vector?: number[];
  /** Metadata (if includeMetadata is true) */
  metadata?: Record<string, any>;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  /** Batch ID */
  batchId: string;
  /** Total number of operations */
  total: number;
  /** Number of successful operations */
  success: number;
  /** Number of failed operations */
  failed: number;
  /** IDs of failed operations */
  failedIds: string[];
  /** Start timestamp */
  startTimestamp: number;
  /** End timestamp */
  endTimestamp: number;
  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Index Operations for Vertex AI Vector Search
 */
export class IndexOperations {
  private db: admin.firestore.Firestore;
  private logger: Logger;
  private config: any;
  private indexClient: IndexServiceClient;
  private indexEndpointClient: IndexEndpointServiceClient;
  private serviceAccountManager: ServiceAccountManager;
  private indexManager: IndexManager;

  /**
   * Create a new Index Operations instance
   * @param db Firestore database
   * @param logger Logger instance
   * @param environment Environment name
   */
  constructor(
    db: admin.firestore.Firestore,
    logger: Logger,
    environment: string = "development"
  ) {
    this.db = db;
    this.logger = logger.child("IndexOperations");
    this.config = getConfig(environment);
    this.serviceAccountManager = new ServiceAccountManager(this.logger);
    
    // Initialize Vertex AI clients
    this.indexClient = new IndexServiceClient({
      projectId: this.config.projectId
    });
    
    this.indexEndpointClient = new IndexEndpointServiceClient({
      projectId: this.config.projectId
    });
    
    // Initialize Index Manager
    this.indexManager = new IndexManager(db, logger, environment);
    
    this.logger.info("IndexOperations initialized", {
      environment: this.config.environment,
      projectId: this.config.projectId,
      location: this.config.location
    });
  }

  /**
   * Store a vector in the index
   * @param entityId ID of the entity
   * @param entityType Type of the entity
   * @param embedding Embedding vector
   * @param metadata Additional metadata
   * @param options Vector storage options
   * @returns ID of the stored vector
   */
  async storeVector(
    entityId: string,
    entityType: EntityType,
    embedding: number[],
    metadata: Record<string, any> = {},
    options: VectorStorageOptions = {}
  ): Promise<string> {
    const storeLogger = this.logger.child(`storeVector:${entityType}:${entityId}`);
    storeLogger.info("Storing vector", { 
      embeddingLength: embedding.length,
      options 
    });
    
    try {
      // Get active index for the entity type
      let indexMetadata = await this.indexManager.getActiveIndex(entityType);
      
      // Create index if it doesn't exist and createIndexIfNotExists is true
      if (!indexMetadata && options.createIndexIfNotExists) {
        storeLogger.info("Active index not found, creating new index");
        indexMetadata = await this.indexManager.createIndex(
          entityType,
          CURRENT_SCHEMA_VERSION,
          { makeActive: true }
        );
        
        // Deploy the index to the endpoint
        await this.indexManager.deployIndexToEndpoint(
          entityType,
          CURRENT_SCHEMA_VERSION
        );
      }
      
      if (!indexMetadata) {
        throw new AppError(
          `No active index found for entity type ${entityType}`,
          ErrorType.NOT_FOUND,
          404
        );
      }
      
      // Generate a unique ID for the vector
      const vectorId = uuidv4();
      
      // Prepare metadata
      const fullMetadata = {
        ...metadata,
        entityId,
        entityType,
        vectorId,
        schemaVersion: indexMetadata.schemaVersion,
        createdAt: new Date().toISOString()
      };
      
      // Store the vector in Vertex AI
      const formattedIndexName = this.indexClient.indexPath(
        this.config.projectId,
        this.config.location,
        getVertexAIIndexId(
          entityType,
          indexMetadata.schemaVersion,
          this.config.environment
        )
      );
      
      // Create the upsert request
      const [response] = await this.indexClient.upsertDatapoints({
        index: formattedIndexName,
        datapoints: [
          {
            datapoint_id: vectorId,
            feature_vector: embedding,
            restricts: Object.entries(fullMetadata).map(([key, value]) => ({
              namespace: "metadata",
              allow_list: [`${key}=${value}`]
            }))
          }
        ]
      });
      
      if (!response.success) {
        throw new AppError(
          "Failed to store vector in Vertex AI",
          ErrorType.EXTERNAL_SERVICE,
          500
        );
      }
      
      // Update vector count if requested
      if (options.updateVectorCount) {
        await this.indexManager.updateVectorCount(
          entityType,
          indexMetadata.schemaVersion,
          indexMetadata.vectorCount + 1
        );
      }
      
      storeLogger.info("Vector stored successfully", { vectorId });
      
      return vectorId;
    } catch (error) {
      storeLogger.error("Failed to store vector", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to store vector: ${error.message}`,
            ErrorType.EXTERNAL_SERVICE,
            500,
            error
          )
        : new AppError(
            "Failed to store vector: Unknown error",
            ErrorType.EXTERNAL_SERVICE,
            500
          );
    }
  }

  /**
   * Store multiple vectors in batch
   * @param embeddings Array of embedding data
   * @param options Vector storage options
   * @returns Batch operation result
   */
  async storeVectorsBatch(
    embeddings: EmbeddingData[],
    options: VectorStorageOptions = {}
  ): Promise<BatchOperationResult> {
    const batchLogger = this.logger.child("storeVectorsBatch");
    const batchId = options.batchId || uuidv4();
    const startTimestamp = Date.now();
    
    batchLogger.info("Storing vectors batch", { 
      count: embeddings.length,
      batchId
    });
    
    // Group embeddings by entity type
    const embeddingsByType = embeddings.reduce((acc, embedding) => {
      const { entityType } = embedding;
      if (!acc[entityType]) {
        acc[entityType] = [];
      }
      acc[entityType].push(embedding);
      return acc;
    }, {} as Record<string, EmbeddingData[]>);
    
    const results: {
      success: boolean;
      entityId: string;
      vectorId?: string;
      error?: string;
    }[] = [];
    
    // Process each entity type separately
    for (const [entityType, typeEmbeddings] of Object.entries(embeddingsByType)) {
      try {
        // Get active index for the entity type
        let indexMetadata = await this.indexManager.getActiveIndex(entityType as EntityType);
        
        // Create index if it doesn't exist and createIndexIfNotExists is true
        if (!indexMetadata && options.createIndexIfNotExists) {
          batchLogger.info(`Active index not found for ${entityType}, creating new index`);
          indexMetadata = await this.indexManager.createIndex(
            entityType as EntityType,
            CURRENT_SCHEMA_VERSION,
            { makeActive: true }
          );
          
          // Deploy the index to the endpoint
          await this.indexManager.deployIndexToEndpoint(
            entityType as EntityType,
            CURRENT_SCHEMA_VERSION
          );
        }
        
        if (!indexMetadata) {
          throw new AppError(
            `No active index found for entity type ${entityType}`,
            ErrorType.NOT_FOUND,
            404
          );
        }
        
        // Prepare datapoints for batch upsert
        const datapoints = typeEmbeddings.map(embedding => {
          const vectorId = uuidv4();
          
          // Prepare metadata
          const fullMetadata = {
            ...embedding.metadata,
            entityId: embedding.entityId,
            entityType: embedding.entityType,
            vectorId,
            schemaVersion: indexMetadata!.schemaVersion,
            createdAt: new Date().toISOString()
          };
          
          // Add result
          results.push({
            success: true,
            entityId: embedding.entityId,
            vectorId
          });
          
          return {
            datapoint_id: vectorId,
            feature_vector: embedding.embedding,
            restricts: Object.entries(fullMetadata).map(([key, value]) => ({
              namespace: "metadata",
              allow_list: [`${key}=${value}`]
            }))
          };
        });
        
        // Store vectors in Vertex AI
        const formattedIndexName = this.indexClient.indexPath(
          this.config.projectId,
          this.config.location,
          getVertexAIIndexId(
            entityType as EntityType,
            indexMetadata.schemaVersion,
            this.config.environment
          )
        );
        
        // Create the upsert request
        const [response] = await this.indexClient.upsertDatapoints({
          index: formattedIndexName,
          datapoints
        });
        
        if (!response.success) {
          throw new AppError(
            `Failed to store vectors batch for entity type ${entityType}`,
            ErrorType.EXTERNAL_SERVICE,
            500
          );
        }
        
        // Update vector count if requested
        if (options.updateVectorCount) {
          await this.indexManager.updateVectorCount(
            entityType as EntityType,
            indexMetadata.schemaVersion,
            indexMetadata.vectorCount + datapoints.length
          );
        }
      } catch (error) {
        batchLogger.error(`Failed to store vectors batch for entity type ${entityType}`, error as Error);
        
        // Mark all embeddings of this type as failed
        typeEmbeddings.forEach(embedding => {
          const existingResult = results.find(r => r.entityId === embedding.entityId);
          
          if (existingResult) {
            existingResult.success = false;
            existingResult.error = error instanceof Error ? error.message : "Unknown error";
          } else {
            results.push({
              success: false,
              entityId: embedding.entityId,
              error: error instanceof Error ? error.message : "Unknown error"
            });
          }
        });
      }
    }
    
    const endTimestamp = Date.now();
    const successResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    
    const batchResult: BatchOperationResult = {
      batchId,
      total: results.length,
      success: successResults.length,
      failed: failedResults.length,
      failedIds: failedResults.map(r => r.entityId),
      startTimestamp,
      endTimestamp,
      durationMs: endTimestamp - startTimestamp
    };
    
    batchLogger.info("Vectors batch storage completed", batchResult);
    
    return batchResult;
  }

  /**
   * Delete a vector from the index
   * @param vectorId ID of the vector to delete
   * @param entityType Type of the entity
   * @param schemaVersion Schema version
   * @returns True if successful
   */
  async deleteVector(
    vectorId: string,
    entityType: EntityType,
    schemaVersion: number = CURRENT_SCHEMA_VERSION
  ): Promise<boolean> {
    const deleteLogger = this.logger.child(`deleteVector:${vectorId}`);
    deleteLogger.info("Deleting vector");
    
    try {
      // Get index metadata
      const indexMetadata = await this.indexManager.getIndexMetadata(entityType, schemaVersion);
      
      if (!indexMetadata) {
        throw new AppError(
          `Index not found for entity type ${entityType} and schema version ${schemaVersion}`,
          ErrorType.NOT_FOUND,
          404
        );
      }
      
      // Delete the vector from Vertex AI
      const formattedIndexName = this.indexClient.indexPath(
        this.config.projectId,
        this.config.location,
        getVertexAIIndexId(
          entityType,
          schemaVersion,
          this.config.environment
        )
      );
      
      // Create the delete request
      const [response] = await this.indexClient.removeDatapoints({
        index: formattedIndexName,
        datapointIds: [vectorId]
      });
      
      if (!response.success) {
        throw new AppError(
          "Failed to delete vector from Vertex AI",
          ErrorType.EXTERNAL_SERVICE,
          500
        );
      }
      
      // Update vector count
      await this.indexManager.updateVectorCount(
        entityType,
        schemaVersion,
        Math.max(0, indexMetadata.vectorCount - 1)
      );
      
      deleteLogger.info("Vector deleted successfully");
      
      return true;
    } catch (error) {
      deleteLogger.error("Failed to delete vector", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to delete vector: ${error.message}`,
            ErrorType.EXTERNAL_SERVICE,
            500,
            error
          )
        : new AppError(
            "Failed to delete vector: Unknown error",
            ErrorType.EXTERNAL_SERVICE,
            500
          );
    }
  }

  /**
   * Delete multiple vectors in batch
   * @param vectorIds Array of vector IDs to delete
   * @param entityType Type of the entity
   * @param schemaVersion Schema version
   * @returns Batch operation result
   */
  async deleteVectorsBatch(
    vectorIds: string[],
    entityType: EntityType,
    schemaVersion: number = CURRENT_SCHEMA_VERSION
  ): Promise<BatchOperationResult> {
    const batchLogger = this.logger.child("deleteVectorsBatch");
    const batchId = uuidv4();
    const startTimestamp = Date.now();
    
    batchLogger.info("Deleting vectors batch", { 
      count: vectorIds.length,
      entityType,
      schemaVersion,
      batchId
    });
    
    try {
      // Get index metadata
      const indexMetadata = await this.indexManager.getIndexMetadata(entityType, schemaVersion);
      
      if (!indexMetadata) {
        throw new AppError(
          `Index not found for entity type ${entityType} and schema version ${schemaVersion}`,
          ErrorType.NOT_FOUND,
          404
        );
      }
      
      // Delete the vectors from Vertex AI
      const formattedIndexName = this.indexClient.indexPath(
        this.config.projectId,
        this.config.location,
        getVertexAIIndexId(
          entityType,
          schemaVersion,
          this.config.environment
        )
      );
      
      // Create the delete request
      const [response] = await this.indexClient.removeDatapoints({
        index: formattedIndexName,
        datapointIds: vectorIds
      });
      
      if (!response.success) {
        throw new AppError(
          "Failed to delete vectors batch from Vertex AI",
          ErrorType.EXTERNAL_SERVICE,
          500
        );
      }
      
      // Update vector count
      await this.indexManager.updateVectorCount(
        entityType,
        schemaVersion,
        Math.max(0, indexMetadata.vectorCount - vectorIds.length)
      );
      
      const endTimestamp = Date.now();
      
      const batchResult: BatchOperationResult = {
        batchId,
        total: vectorIds.length,
        success: vectorIds.length,
        failed: 0,
        failedIds: [],
        startTimestamp,
        endTimestamp,
        durationMs: endTimestamp - startTimestamp
      };
      
      batchLogger.info("Vectors batch deletion completed", batchResult);
      
      return batchResult;
    } catch (error) {
      batchLogger.error("Failed to delete vectors batch", error as Error);
      
      const endTimestamp = Date.now();
      
      const batchResult: BatchOperationResult = {
        batchId,
        total: vectorIds.length,
        success: 0,
        failed: vectorIds.length,
        failedIds: vectorIds,
        startTimestamp,
        endTimestamp,
        durationMs: endTimestamp - startTimestamp
      };
      
      return batchResult;
    }
  }

  /**
   * Find similar vectors
   * @param queryVector Query vector
   * @param entityType Type of the entity
   * @param options Vector retrieval options
   * @returns Array of vector search results
   */
  async findSimilarVectors(
    queryVector: number[],
    entityType: EntityType,
    options: VectorRetrievalOptions = {}
  ): Promise<VectorSearchResult[]> {
    const searchLogger = this.logger.child(`findSimilarVectors:${entityType}`);
    searchLogger.info("Finding similar vectors", { 
      queryVectorLength: queryVector.length,
      options 
    });
    
    try {
      // Get active index for the entity type
      const indexMetadata = await this.indexManager.getActiveIndex(entityType);
      
      if (!indexMetadata) {
        throw new AppError(
          `No active index found for entity type ${entityType}`,
          ErrorType.NOT_FOUND,
          404
        );
      }
      
      // Get the index endpoint
      const endpointId = getVertexAIIndexEndpointId(this.config.environment);
      const formattedEndpointName = this.indexEndpointClient.indexEndpointPath(
        this.config.projectId,
        this.config.location,
        endpointId
      );
      
      // Create the search request
      const [response] = await this.indexEndpointClient.findNeighbors({
        indexEndpoint: formattedEndpointName,
        queries: [
          {
            datapoint: {
              feature_vector: queryVector
            },
            neighbor_count: options.neighborCount || 10
          }
        ]
      });
      
      if (!response.nearestNeighbors || response.nearestNeighbors.length === 0) {
        return [];
      }
      
      // Extract results
      const neighbors = response.nearestNeighbors[0].neighbors || [];
      
      const results: VectorSearchResult[] = neighbors.map(neighbor => {
        const result: VectorSearchResult = {
          id: neighbor.datapoint?.datapointId || "",
          distance: neighbor.distance || 0
        };
        
        // Include vector if requested
        if (options.includeVectors && neighbor.datapoint?.featureVector) {
          result.vector = Array.from(neighbor.datapoint.featureVector);
        }
        
        // Include metadata if requested
        if (options.includeMetadata && neighbor.datapoint?.restricts) {
          result.metadata = {};
          
          for (const restrict of neighbor.datapoint.restricts) {
            if (restrict.namespace === "metadata" && restrict.allowList) {
              for (const item of restrict.allowList) {
                const [key, value] = item.split("=");
                if (key && value) {
                  result.metadata[key] = value;
                }
              }
            }
          }
        }
        
        return result;
      });
      
      searchLogger.info("Similar vectors found", { count: results.length });
      
      return results;
    } catch (error) {
      searchLogger.error("Failed to find similar vectors", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to find similar vectors: ${error.message}`,
            ErrorType.EXTERNAL_SERVICE,
            500,
            error
          )
        : new AppError(
            "Failed to find similar vectors: Unknown error",
            ErrorType.EXTERNAL_SERVICE,
            500
          );
    }
  }
}