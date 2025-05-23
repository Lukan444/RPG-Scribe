/**
 * Vertex AI Index Metadata
 * 
 * This file contains the metadata schema and management for Vertex AI Vector Search indexes,
 * providing a way to track and query index information.
 */

import * as admin from "firebase-admin";
import { Logger } from "../utils/logging";
import { AppError, ErrorType } from "../utils/error-handling";
import { 
  IndexMetadata,
  getIndexMetadataPath,
  CURRENT_SCHEMA_VERSION
} from "./indexSchema";
import { EntityType } from "./types";
import { getConfig } from "./config";

/**
 * Index metadata query options
 */
export interface IndexMetadataQueryOptions {
  /** Filter by entity type */
  entityType?: EntityType;
  /** Filter by schema version */
  schemaVersion?: number;
  /** Filter by active status */
  active?: boolean;
  /** Filter by status */
  status?: "CREATING" | "READY" | "UPDATING" | "DELETING" | "ERROR";
  /** Limit the number of results */
  limit?: number;
}

/**
 * Index Metadata Manager for Vertex AI Vector Search
 */
export class IndexMetadataManager {
  private db: admin.firestore.Firestore;
  private logger: Logger;
  private environment: string;

  /**
   * Create a new Index Metadata Manager
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
    this.logger = logger.child("IndexMetadataManager");
    this.environment = environment;
    
    this.logger.info("IndexMetadataManager initialized", {
      environment
    });
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
        this.environment
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
   * Get all indexes matching query options
   * @param options Query options
   * @returns Array of index metadata
   */
  async queryIndexes(options: IndexMetadataQueryOptions = {}): Promise<IndexMetadata[]> {
    try {
      let query = this.db.collection("vector-indexes")
        .where("environment", "==", this.environment);
      
      // Apply filters
      if (options.entityType) {
        query = query.where("entityType", "==", options.entityType);
      }
      
      if (options.schemaVersion) {
        query = query.where("schemaVersion", "==", options.schemaVersion);
      }
      
      if (options.active !== undefined) {
        query = query.where("active", "==", options.active);
      }
      
      if (options.status) {
        query = query.where("status", "==", options.status);
      }
      
      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const indexesSnapshot = await query.get();
      
      return indexesSnapshot.docs.map(doc => doc.data() as IndexMetadata);
    } catch (error) {
      this.logger.error("Failed to query indexes", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to query indexes: ${error.message}`,
            ErrorType.DATABASE,
            500,
            error
          )
        : new AppError(
            "Failed to query indexes: Unknown error",
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
      const indexes = await this.queryIndexes({
        entityType,
        active: true,
        limit: 1
      });
      
      return indexes.length > 0 ? indexes[0] : null;
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
   * Create or update index metadata
   * @param metadata Index metadata
   * @returns Created or updated index metadata
   */
  async saveIndexMetadata(metadata: IndexMetadata): Promise<IndexMetadata> {
    try {
      const indexMetadataPath = getIndexMetadataPath(
        metadata.entityType,
        metadata.schemaVersion,
        this.environment
      );
      
      // Update timestamp
      metadata.updatedAt = new Date().toISOString();
      
      await this.db.doc(indexMetadataPath).set(metadata, { merge: true });
      
      return metadata;
    } catch (error) {
      this.logger.error("Failed to save index metadata", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to save index metadata: ${error.message}`,
            ErrorType.DATABASE,
            500,
            error
          )
        : new AppError(
            "Failed to save index metadata: Unknown error",
            ErrorType.DATABASE,
            500
          );
    }
  }

  /**
   * Delete index metadata
   * @param entityType Entity type
   * @param schemaVersion Schema version
   * @returns True if successful
   */
  async deleteIndexMetadata(
    entityType: EntityType,
    schemaVersion: number = CURRENT_SCHEMA_VERSION
  ): Promise<boolean> {
    try {
      const indexMetadataPath = getIndexMetadataPath(
        entityType,
        schemaVersion,
        this.environment
      );
      
      await this.db.doc(indexMetadataPath).delete();
      
      return true;
    } catch (error) {
      this.logger.error("Failed to delete index metadata", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to delete index metadata: ${error.message}`,
            ErrorType.DATABASE,
            500,
            error
          )
        : new AppError(
            "Failed to delete index metadata: Unknown error",
            ErrorType.DATABASE,
            500
          );
    }
  }

  /**
   * Update index status
   * @param entityType Entity type
   * @param schemaVersion Schema version
   * @param status New status
   * @param error Optional error message
   * @returns Updated index metadata
   */
  async updateIndexStatus(
    entityType: EntityType,
    schemaVersion: number,
    status: "CREATING" | "READY" | "UPDATING" | "DELETING" | "ERROR",
    error?: string
  ): Promise<IndexMetadata | null> {
    try {
      const indexMetadata = await this.getIndexMetadata(entityType, schemaVersion);
      
      if (!indexMetadata) {
        return null;
      }
      
      // Update status
      indexMetadata.status = status;
      indexMetadata.updatedAt = new Date().toISOString();
      
      // Add error if provided
      if (error && status === "ERROR") {
        indexMetadata.error = error;
      } else {
        // Clear error if status is not ERROR
        delete indexMetadata.error;
      }
      
      await this.saveIndexMetadata(indexMetadata);
      
      return indexMetadata;
    } catch (error) {
      this.logger.error("Failed to update index status", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to update index status: ${error.message}`,
            ErrorType.DATABASE,
            500,
            error
          )
        : new AppError(
            "Failed to update index status: Unknown error",
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
  ): Promise<IndexMetadata | null> {
    try {
      const indexMetadata = await this.getIndexMetadata(entityType, schemaVersion);
      
      if (!indexMetadata) {
        return null;
      }
      
      // Update vector count
      indexMetadata.vectorCount = count;
      indexMetadata.updatedAt = new Date().toISOString();
      
      await this.saveIndexMetadata(indexMetadata);
      
      return indexMetadata;
    } catch (error) {
      this.logger.error("Failed to update vector count", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to update vector count: ${error.message}`,
            ErrorType.DATABASE,
            500,
            error
          )
        : new AppError(
            "Failed to update vector count: Unknown error",
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
  ): Promise<IndexMetadata | null> {
    try {
      // Get all indexes for the entity type
      const indexes = await this.queryIndexes({ entityType });
      
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
          this.environment
        ));
        
        batch.update(indexRef, { 
          active: index.schemaVersion === schemaVersion,
          updatedAt: new Date().toISOString()
        });
      }
      
      await batch.commit();
      
      // Get the updated index metadata
      return await this.getIndexMetadata(entityType, schemaVersion);
    } catch (error) {
      this.logger.error("Failed to set active index", error as Error);
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
   * Get index statistics
   * @returns Index statistics
   */
  async getIndexStatistics(): Promise<{
    totalIndexes: number;
    indexesByEntityType: Record<string, number>;
    indexesByStatus: Record<string, number>;
    totalVectors: number;
    vectorsByEntityType: Record<string, number>;
  }> {
    try {
      // Get all indexes
      const indexes = await this.queryIndexes();
      
      // Calculate statistics
      const indexesByEntityType: Record<string, number> = {};
      const indexesByStatus: Record<string, number> = {};
      const vectorsByEntityType: Record<string, number> = {};
      let totalVectors = 0;
      
      for (const index of indexes) {
        // Count indexes by entity type
        indexesByEntityType[index.entityType] = (indexesByEntityType[index.entityType] || 0) + 1;
        
        // Count indexes by status
        indexesByStatus[index.status] = (indexesByStatus[index.status] || 0) + 1;
        
        // Count vectors by entity type
        vectorsByEntityType[index.entityType] = (vectorsByEntityType[index.entityType] || 0) + index.vectorCount;
        
        // Count total vectors
        totalVectors += index.vectorCount;
      }
      
      return {
        totalIndexes: indexes.length,
        indexesByEntityType,
        indexesByStatus,
        totalVectors,
        vectorsByEntityType
      };
    } catch (error) {
      this.logger.error("Failed to get index statistics", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to get index statistics: ${error.message}`,
            ErrorType.DATABASE,
            500,
            error
          )
        : new AppError(
            "Failed to get index statistics: Unknown error",
            ErrorType.DATABASE,
            500
          );
    }
  }
}