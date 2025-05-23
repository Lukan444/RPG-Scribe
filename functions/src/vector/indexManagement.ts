/**
 * Vertex AI Index Management
 * 
 * This file contains the core functionality for managing Vertex AI Vector Search indexes,
 * including creation, updating, and versioning.
 */

import * as admin from "firebase-admin";
import { Logger } from "../utils/logging";
import { AppError, ErrorType } from "../utils/error-handling";
import { 
  IndexMetadata, 
  IndexStructure, 
  getIndexStructure, 
  getIndexMetadataPath,
  getVertexAIIndexId,
  getVertexAIIndexEndpointId,
  CURRENT_SCHEMA_VERSION
} from "./indexSchema";
import { EntityType, VertexAIConfig } from "./types";
import { getConfig } from "./config";
import { IndexServiceClient, IndexEndpointServiceClient } from "@google-cloud/aiplatform";
import { ServiceAccountManager } from "../auth/service-account-manager";

/**
 * Index creation options
 */
export interface IndexCreationOptions {
  /** Whether to recreate the index if it already exists */
  recreate?: boolean;
  /** Whether to make this the active index for the entity type */
  makeActive?: boolean;
  /** Custom index structure (if not provided, will use default) */
  customStructure?: Partial<IndexStructure>;
}

/**
 * Index update options
 */
export interface IndexUpdateOptions {
  /** Whether to update the index structure */
  updateStructure?: boolean;
  /** Whether to make this the active index for the entity type */
  makeActive?: boolean;
}

/**
 * Index Manager for Vertex AI Vector Search
 */
export class IndexManager {
  private db: admin.firestore.Firestore;
  private logger: Logger;
  private config: VertexAIConfig;
  private indexClient: IndexServiceClient;
  private indexEndpointClient: IndexEndpointServiceClient;
  private serviceAccountManager: ServiceAccountManager;

  /**
   * Create a new Index Manager
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
    this.logger = logger.child("IndexManager");
    this.config = getConfig(environment);
    this.serviceAccountManager = new ServiceAccountManager(this.logger);
    
    // Initialize Vertex AI clients
    this.indexClient = new IndexServiceClient({
      projectId: this.config.projectId
    });
    
    this.indexEndpointClient = new IndexEndpointServiceClient({
      projectId: this.config.projectId
    });
    
    this.logger.info("IndexManager initialized", {
      environment: this.config.environment,
      projectId: this.config.projectId,
      location: this.config.location
    });
  }

  /**
   * Create a new index for an entity type
   * @param entityType Entity type
   * @param schemaVersion Schema version
   * @param options Index creation options
   * @returns Index metadata
   */
  async createIndex(
    entityType: EntityType,
    schemaVersion: number = CURRENT_SCHEMA_VERSION,
    options: IndexCreationOptions = {}
  ): Promise<IndexMetadata> {
    const indexLogger = this.logger.child(`createIndex:${entityType}:v${schemaVersion}`);
    indexLogger.info("Creating index", { options });
    
    try {
      // Check if index already exists
      const indexMetadataPath = getIndexMetadataPath(
        entityType,
        schemaVersion,
        this.config.environment
      );
      
      const indexMetadataDoc = await this.db.doc(indexMetadataPath).get();
      
      if (indexMetadataDoc.exists && !options.recreate) {
        indexLogger.info("Index already exists, returning existing metadata");
        return indexMetadataDoc.data() as IndexMetadata;
      }
      
      // Get index structure
      let structure = getIndexStructure(entityType, schemaVersion);
      
      // Apply custom structure if provided
      if (options.customStructure) {
        structure = {
          ...structure,
          ...options.customStructure
        };
      }
      
      // Generate index ID
      const indexId = getVertexAIIndexId(
        entityType,
        schemaVersion,
        this.config.environment
      );
      
      // Create index in Vertex AI
      indexLogger.info("Creating index in Vertex AI", { 
        indexId, 
        structure 
      });
      
      // Format the parent path for the index
      const formattedParent = this.indexClient.locationPath(
        this.config.projectId,
        this.config.location
      );
      
      // Create the index
      const [operation] = await this.indexClient.createIndex({
        parent: formattedParent,
        index: {
          displayName: structure.displayName,
          description: structure.description,
          metadata: {
            contentsDeltaUri: "", // Will be populated when vectors are added
            config: {
              dimensions: structure.dimension,
              approximateNeighborsCount: 150, // Default value, can be adjusted
              distanceMeasureType: structure.distanceMeasure.toUpperCase(),
              algorithmConfig: {
                treeAhConfig: {
                  leafNodeEmbeddingCount: 1000, // Default value, can be adjusted
                  leafNodesToSearchPercent: 10 // Default value, can be adjusted
                }
              }
            }
          }
        }
      });
      
      // Wait for the operation to complete
      const [response] = await operation.promise();
      
      if (!response.name) {
        throw new AppError(
          "Failed to create index: No index name returned",
          ErrorType.EXTERNAL_SERVICE,
          500
        );
      }
      
      // Extract the index name from the response
      const vertexIndexName = response.name;
      
      // Create index metadata
      const indexMetadata: IndexMetadata = {
        indexId,
        indexName: vertexIndexName,
        entityType,
        schemaVersion,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "READY",
        vectorCount: 0,
        structure,
        environment: this.config.environment as "development" | "staging" | "production",
        active: options.makeActive || false
      };
      
      // Save index metadata to Firestore
      await this.db.doc(indexMetadataPath).set(indexMetadata);
      
      // If makeActive is true, update all other indexes to be inactive
      if (options.makeActive) {
        await this.setActiveIndex(entityType, schemaVersion);
      }
      
      indexLogger.info("Index created successfully", { indexId });
      
      return indexMetadata;
    } catch (error) {
      indexLogger.error("Failed to create index", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to create index: ${error.message}`,
            ErrorType.EXTERNAL_SERVICE,
            500,
            error
          )
        : new AppError(
            "Failed to create index: Unknown error",
            ErrorType.EXTERNAL_SERVICE,
            500
          );
    }
  }

  /**
   * Get index metadata
   * @param entityType Entity type
   * @param schemaVersion Schema version
   * @returns Index metadata or null if not found
   */
  async getIndexMetadata(
    entityType: EntityType,
    schemaVersion: number = CURRENT_SCHEMA_VERSION
  ): Promise<IndexMetadata | null> {
    try {
      const indexMetadataPath = getIndexMetadataPath(
        entityType,
        schemaVersion,
        this.config.environment
      );
      
      const indexMetadataDoc = await this.db.doc(indexMetadataPath).get();
      
      if (!indexMetadataDoc.exists) {
        return null;
      }
      
      return indexMetadataDoc.data() as IndexMetadata;
    } catch (error) {
      this.logger.error("Failed to get index metadata", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to get index metadata: ${error.message}`,
            ErrorType.DATABASE,
            500,
            error
          )
        : new AppError(
            "Failed to get index metadata: Unknown error",
            ErrorType.DATABASE,
            500
          );
    }
  }

  /**
   * Get all indexes for an entity type
   * @param entityType Entity type
   * @returns Array of index metadata
   */
  async getAllIndexes(entityType: EntityType): Promise<IndexMetadata[]> {
    try {
      const indexesSnapshot = await this.db
        .collection("vector-indexes")
        .where("entityType", "==", entityType)
        .where("environment", "==", this.config.environment)
        .get();
      
      return indexesSnapshot.docs.map(doc => doc.data() as IndexMetadata);
    } catch (error) {
      this.logger.error("Failed to get all indexes", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to get all indexes: ${error.message}`,
            ErrorType.DATABASE,
            500,
            error
          )
        : new AppError(
            "Failed to get all indexes: Unknown error",
            ErrorType.DATABASE,
            500
          );
    }
  }

  /**
   * Get the active index for an entity type
   * @param entityType Entity type
   * @returns Active index metadata or null if not found
   */
  async getActiveIndex(entityType: EntityType): Promise<IndexMetadata | null> {
    try {
      const indexesSnapshot = await this.db
        .collection("vector-indexes")
        .where("entityType", "==", entityType)
        .where("environment", "==", this.config.environment)
        .where("active", "==", true)
        .limit(1)
        .get();
      
      if (indexesSnapshot.empty) {
        return null;
      }
      
      return indexesSnapshot.docs[0].data() as IndexMetadata;
    } catch (error) {
      this.logger.error("Failed to get active index", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to get active index: ${error.message}`,
            ErrorType.DATABASE,
            500,
            error
          )
        : new AppError(
            "Failed to get active index: Unknown error",
            ErrorType.DATABASE,
            500
          );
    }
  }

  /**
   * Set the active index for an entity type
   * @param entityType Entity type
   * @param schemaVersion Schema version to set as active
   * @returns Updated index metadata
   */
  async setActiveIndex(
    entityType: EntityType,
    schemaVersion: number = CURRENT_SCHEMA_VERSION
  ): Promise<IndexMetadata> {
    const indexLogger = this.logger.child(`setActiveIndex:${entityType}:v${schemaVersion}`);
    indexLogger.info("Setting active index");
    
    try {
      // Get all indexes for the entity type
      const indexes = await this.getAllIndexes(entityType);
      
      // Find the index to make active
      const targetIndex = indexes.find(index => 
        index.entityType === entityType && 
        index.schemaVersion === schemaVersion
      );
      
      if (!targetIndex) {
        throw new AppError(
          `Index not found for entity type ${entityType} and schema version ${schemaVersion}`,
          ErrorType.NOT_FOUND,
          404
        );
      }
      
      // Update all indexes in a batch
      const batch = this.db.batch();
      
      for (const index of indexes) {
        const indexRef = this.db.doc(getIndexMetadataPath(
          index.entityType,
          index.schemaVersion,
          this.config.environment
        ));
        
        batch.update(indexRef, { 
          active: index.schemaVersion === schemaVersion,
          updatedAt: new Date().toISOString()
        });
      }
      
      await batch.commit();
      
      // Get the updated index metadata
      const updatedIndex = await this.getIndexMetadata(entityType, schemaVersion);
      
      if (!updatedIndex) {
        throw new AppError(
          `Failed to get updated index metadata after setting active index`,
          ErrorType.DATABASE,
          500
        );
      }
      
      indexLogger.info("Active index set successfully");
      
      return updatedIndex;
    } catch (error) {
      indexLogger.error("Failed to set active index", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to set active index: ${error.message}`,
            ErrorType.DATABASE,
            500,
            error
          )
        : new AppError(
            "Failed to set active index: Unknown error",
            ErrorType.DATABASE,
            500
          );
    }
  }

  /**
   * Delete an index
   * @param entityType Entity type
   * @param schemaVersion Schema version
   * @returns True if successful
   */
  async deleteIndex(
    entityType: EntityType,
    schemaVersion: number = CURRENT_SCHEMA_VERSION
  ): Promise<boolean> {
    const indexLogger = this.logger.child(`deleteIndex:${entityType}:v${schemaVersion}`);
    indexLogger.info("Deleting index");
    
    try {
      // Get index metadata
      const indexMetadata = await this.getIndexMetadata(entityType, schemaVersion);
      
      if (!indexMetadata) {
        indexLogger.warn("Index not found, nothing to delete");
        return false;
      }
      
      // Check if this is the active index
      if (indexMetadata.active) {
        throw new AppError(
          "Cannot delete the active index. Set another index as active first.",
          ErrorType.INVALID_OPERATION,
          400
        );
      }
      
      // Update index status to DELETING
      await this.db.doc(getIndexMetadataPath(
        entityType,
        schemaVersion,
        this.config.environment
      )).update({
        status: "DELETING",
        updatedAt: new Date().toISOString()
      });
      
      // Delete the index in Vertex AI
      const [operation] = await this.indexClient.deleteIndex({
        name: indexMetadata.indexName
      });
      
      // Wait for the operation to complete
      await operation.promise();
      
      // Delete the index metadata from Firestore
      await this.db.doc(getIndexMetadataPath(
        entityType,
        schemaVersion,
        this.config.environment
      )).delete();
      
      indexLogger.info("Index deleted successfully");
      
      return true;
    } catch (error) {
      indexLogger.error("Failed to delete index", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to delete index: ${error.message}`,
            ErrorType.EXTERNAL_SERVICE,
            500,
            error
          )
        : new AppError(
            "Failed to delete index: Unknown error",
            ErrorType.EXTERNAL_SERVICE,
            500
          );
    }
  }

  /**
   * Create an index endpoint
   * @returns Index endpoint name
   */
  async createIndexEndpoint(): Promise<string> {
    const endpointLogger = this.logger.child("createIndexEndpoint");
    endpointLogger.info("Creating index endpoint");
    
    try {
      // Format the parent path for the index endpoint
      const formattedParent = this.indexEndpointClient.locationPath(
        this.config.projectId,
        this.config.location
      );
      
      // Generate endpoint ID
      const endpointId = getVertexAIIndexEndpointId(this.config.environment);
      
      // Create the index endpoint
      const [operation] = await this.indexEndpointClient.createIndexEndpoint({
        parent: formattedParent,
        indexEndpoint: {
          displayName: `${this.config.environment}-endpoint`,
          description: `Index endpoint for ${this.config.environment} environment`
        },
        indexEndpointId: endpointId
      });
      
      // Wait for the operation to complete
      const [response] = await operation.promise();
      
      if (!response.name) {
        throw new AppError(
          "Failed to create index endpoint: No endpoint name returned",
          ErrorType.EXTERNAL_SERVICE,
          500
        );
      }
      
      endpointLogger.info("Index endpoint created successfully", {
        endpointName: response.name
      });
      
      return response.name;
    } catch (error) {
      endpointLogger.error("Failed to create index endpoint", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to create index endpoint: ${error.message}`,
            ErrorType.EXTERNAL_SERVICE,
            500,
            error
          )
        : new AppError(
            "Failed to create index endpoint: Unknown error",
            ErrorType.EXTERNAL_SERVICE,
            500
          );
    }
  }

  /**
   * Deploy an index to an endpoint
   * @param entityType Entity type
   * @param schemaVersion Schema version
   * @returns True if successful
   */
  async deployIndexToEndpoint(
    entityType: EntityType,
    schemaVersion: number = CURRENT_SCHEMA_VERSION
  ): Promise<boolean> {
    const deployLogger = this.logger.child(`deployIndexToEndpoint:${entityType}:v${schemaVersion}`);
    deployLogger.info("Deploying index to endpoint");
    
    try {
      // Get index metadata
      const indexMetadata = await this.getIndexMetadata(entityType, schemaVersion);
      
      if (!indexMetadata) {
        throw new AppError(
          `Index not found for entity type ${entityType} and schema version ${schemaVersion}`,
          ErrorType.NOT_FOUND,
          404
        );
      }
      
      // Get or create index endpoint
      let endpointName: string;
      
      try {
        // Try to get existing endpoint
        const formattedEndpointName = this.indexEndpointClient.indexEndpointPath(
          this.config.projectId,
          this.config.location,
          getVertexAIIndexEndpointId(this.config.environment)
        );
        
        const [endpoint] = await this.indexEndpointClient.getIndexEndpoint({
          name: formattedEndpointName
        });
        
        endpointName = endpoint.name;
      } catch (error) {
        // Endpoint doesn't exist, create it
        deployLogger.info("Index endpoint not found, creating new endpoint");
        endpointName = await this.createIndexEndpoint();
      }
      
      // Deploy the index to the endpoint
      const [operation] = await this.indexEndpointClient.deployIndex({
        indexEndpoint: endpointName,
        deployedIndex: {
          index: indexMetadata.indexName,
          displayName: indexMetadata.structure.displayName,
          machineType: "e2-standard-2" // Default machine type, can be adjusted
        }
      });
      
      // Wait for the operation to complete
      await operation.promise();
      
      deployLogger.info("Index deployed to endpoint successfully");
      
      return true;
    } catch (error) {
      deployLogger.error("Failed to deploy index to endpoint", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to deploy index to endpoint: ${error.message}`,
            ErrorType.EXTERNAL_SERVICE,
            500,
            error
          )
        : new AppError(
            "Failed to deploy index to endpoint: Unknown error",
            ErrorType.EXTERNAL_SERVICE,
            500
          );
    }
  }

  /**
   * Update index metadata
   * @param entityType Entity type
   * @param schemaVersion Schema version
   * @param updates Partial index metadata updates
   * @returns Updated index metadata
   */
  async updateIndexMetadata(
    entityType: EntityType,
    schemaVersion: number,
    updates: Partial<IndexMetadata>
  ): Promise<IndexMetadata> {
    try {
      const indexMetadataPath = getIndexMetadataPath(
        entityType,
        schemaVersion,
        this.config.environment
      );
      
      // Add updatedAt to updates
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await this.db.doc(indexMetadataPath).update(updatesWithTimestamp);
      
      // Get the updated index metadata
      const updatedIndex = await this.getIndexMetadata(entityType, schemaVersion);
      
      if (!updatedIndex) {
        throw new AppError(
          `Failed to get updated index metadata after update`,
          ErrorType.DATABASE,
          500
        );
      }
      
      return updatedIndex;
    } catch (error) {
      this.logger.error("Failed to update index metadata", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to update index metadata: ${error.message}`,
            ErrorType.DATABASE,
            500,
            error
          )
        : new AppError(
            "Failed to update index metadata: Unknown error",
            ErrorType.DATABASE,
            500
          );
    }
  }

  /**
   * Update vector count for an index
   * @param entityType Entity type
   * @param schemaVersion Schema version
   * @param count Vector count
   * @returns Updated index metadata
   */
  async updateVectorCount(
    entityType: EntityType,
    schemaVersion: number,
    count: number
  ): Promise<IndexMetadata> {
    return this.updateIndexMetadata(entityType, schemaVersion, {
      vectorCount: count
    });
  }

  /**
   * Create indexes for all entity types
   * @param schemaVersion Schema version
   * @param options Index creation options
   * @returns Array of created index metadata
   */
  async createAllIndexes(
    schemaVersion: number = CURRENT_SCHEMA_VERSION,
    options: IndexCreationOptions = {}
  ): Promise<IndexMetadata[]> {
    const results: IndexMetadata[] = [];
    
    // Create indexes for all entity types
    for (const entityType of Object.values(EntityType)) {
      try {
        const indexMetadata = await this.createIndex(
          entityType as EntityType,
          schemaVersion,
          options
        );
        
        results.push(indexMetadata);
      } catch (error) {
        this.logger.error(`Failed to create index for ${entityType}`, error as Error);
        // Continue with other entity types
      }
    }
    
    return results;
  }
}