/**
 * Vertex AI Index Synchronization
 * 
 * This file contains the synchronization logic between Firestore and Vertex AI Vector Search,
 * ensuring consistency between entity data and vector embeddings.
 */

import * as admin from "firebase-admin";
import { Logger } from "../utils/logging";
import { AppError, ErrorType } from "../utils/error-handling";
import { 
  EntityType, 
  EntityWithVectorFields,
  getEntityCollectionPath
} from "./types";
import { IndexManager } from "./indexManagement";
import { IndexOperations, BatchOperationResult } from "./indexOperations";
import { VertexAIClient } from "./vertexAIClient";
import { CURRENT_SCHEMA_VERSION } from "./indexSchema";

/**
 * Synchronization options
 */
export interface SyncOptions {
  /** Whether to force synchronization even if already synchronized */
  force?: boolean;
  /** Batch size for batch operations */
  batchSize?: number;
  /** Whether to update vector counts after synchronization */
  updateVectorCounts?: boolean;
}

/**
 * Synchronization status
 */
export enum SyncStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}

/**
 * Synchronization result
 */
export interface SyncResult {
  /** ID of the entity */
  entityId: string;
  /** Type of the entity */
  entityType: EntityType;
  /** Whether the synchronization was successful */
  success: boolean;
  /** ID of the vector if successful */
  vectorId?: string;
  /** Error message if unsuccessful */
  error?: string;
  /** Timestamp of the synchronization */
  timestamp: number;
}

/**
 * Synchronization summary
 */
export interface SyncSummary {
  /** Total number of entities processed */
  total: number;
  /** Number of successful synchronizations */
  success: number;
  /** Number of failed synchronizations */
  failed: number;
  /** IDs of failed entities */
  failedIds: string[];
  /** Start timestamp */
  startTimestamp: number;
  /** End timestamp */
  endTimestamp: number;
  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Index Synchronizer for Vertex AI Vector Search
 */
export class IndexSynchronizer {
  private db: admin.firestore.Firestore;
  private logger: Logger;
  private indexManager: IndexManager;
  private indexOperations: IndexOperations;
  private vertexClient: VertexAIClient;

  /**
   * Create a new Index Synchronizer
   * @param db Firestore database
   * @param logger Logger instance
   * @param vertexClient Vertex AI client
   * @param environment Environment name
   */
  constructor(
    db: admin.firestore.Firestore,
    logger: Logger,
    vertexClient: VertexAIClient,
    environment: string = "development"
  ) {
    this.db = db;
    this.logger = logger.child("IndexSynchronizer");
    this.vertexClient = vertexClient;
    
    // Initialize Index Manager and Operations
    this.indexManager = new IndexManager(db, logger, environment);
    this.indexOperations = new IndexOperations(db, logger, environment);
    
    this.logger.info("IndexSynchronizer initialized");
  }

  /**
   * Extract text content from an entity for embedding
   * @param entity Entity data
   * @param entityType Entity type
   * @returns Text content for embedding
   */
  private extractTextContent(entity: any, entityType: EntityType): string {
    // Extract text content based on entity type
    let textContent = "";
    
    switch (entityType) {
      case EntityType.CHARACTER:
        textContent = [
          entity.name,
          entity.description,
          entity.background,
          entity.personality,
          entity.appearance,
          entity.notes
        ].filter(Boolean).join("\n\n");
        break;
        
      case EntityType.LOCATION:
        textContent = [
          entity.name,
          entity.description,
          entity.history,
          entity.environment,
          entity.notes
        ].filter(Boolean).join("\n\n");
        break;
        
      case EntityType.ITEM:
        textContent = [
          entity.name,
          entity.description,
          entity.history,
          entity.properties,
          entity.notes
        ].filter(Boolean).join("\n\n");
        break;
        
      case EntityType.EVENT:
        textContent = [
          entity.name,
          entity.description,
          entity.outcome,
          entity.significance,
          entity.notes
        ].filter(Boolean).join("\n\n");
        break;
        
      case EntityType.SESSION:
        textContent = [
          entity.title,
          entity.summary,
          entity.notes,
          entity.highlights
        ].filter(Boolean).join("\n\n");
        break;
        
      case EntityType.FACTION:
        textContent = [
          entity.name,
          entity.description,
          entity.goals,
          entity.structure,
          entity.notes
        ].filter(Boolean).join("\n\n");
        break;
        
      case EntityType.STORY_ARC:
        textContent = [
          entity.title,
          entity.description,
          entity.plotPoints,
          entity.resolution,
          entity.notes
        ].filter(Boolean).join("\n\n");
        break;
        
      case EntityType.CAMPAIGN:
        textContent = [
          entity.name,
          entity.description,
          entity.setting,
          entity.theme,
          entity.notes
        ].filter(Boolean).join("\n\n");
        break;
        
      case EntityType.RPG_WORLD:
        textContent = [
          entity.name,
          entity.description,
          entity.setting,
          entity.history,
          entity.notes
        ].filter(Boolean).join("\n\n");
        break;
        
      case EntityType.NOTE:
        textContent = [
          entity.title,
          entity.content
        ].filter(Boolean).join("\n\n");
        break;
        
      default:
        // For unknown entity types, concatenate all string values
        textContent = Object.entries(entity)
          .filter(([_, value]) => typeof value === "string")
          .map(([_, value]) => value)
          .join("\n\n");
    }
    
    return textContent;
  }

  /**
   * Synchronize an entity with Vertex AI Vector Search
   * @param entityId ID of the entity
   * @param entityType Type of the entity
   * @param options Synchronization options
   * @returns Synchronization result
   */
  async syncEntity(
    entityId: string,
    entityType: EntityType,
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    const syncLogger = this.logger.child(`syncEntity:${entityType}:${entityId}`);
    syncLogger.info("Synchronizing entity", { options });
    
    try {
      // Get entity from Firestore
      const entityRef = this.db.collection(getEntityCollectionPath(entityType)).doc(entityId);
      const entityDoc = await entityRef.get();
      
      if (!entityDoc.exists) {
        throw new AppError(
          `Entity ${entityId} not found`,
          ErrorType.NOT_FOUND,
          404
        );
      }
      
      const entity = entityDoc.data() as EntityWithVectorFields;
      
      // Check if entity needs synchronization
      if (!options.force &&
          entity.vectorStatus === "COMPLETED" &&
          entity.vectorId &&
          entity.vectorTimestamp) {
        syncLogger.info("Entity already synchronized, skipping");
        return {
          entityId,
          entityType,
          success: true,
          vectorId: entity.vectorId,
          timestamp: Date.now()
        };
      }
      
      // Update entity status to PENDING
      await entityRef.update({
        vectorStatus: SyncStatus.PENDING,
        vectorTimestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Extract text content for embedding
      const textContent = this.extractTextContent(entity, entityType);
      
      if (!textContent || textContent.trim().length === 0) {
        syncLogger.warn("Entity has no text content, skipping");
        await entityRef.update({
          vectorStatus: SyncStatus.FAILED,
          vectorError: "Entity has no text content",
          vectorTimestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return {
          entityId,
          entityType,
          success: false,
          error: "Entity has no text content",
          timestamp: Date.now()
        };
      }
      
      // Generate embedding
      const embeddingResponse = await this.vertexClient.generateEmbedding(
        textContent,
        this.vertexClient.config.embeddingModel
      );
      
      // Prepare metadata
      const metadata = {
        entityId,
        entityType,
        worldId: entity.worldId || "",
        campaignId: entity.campaignId || "",
        createdAt: entity.createdAt || new Date().toISOString(),
        updatedAt: entity.updatedAt || new Date().toISOString(),
        schemaVersion: CURRENT_SCHEMA_VERSION
      };
      
      // Store embedding in Vertex AI
      const vectorId = await this.indexOperations.storeVector(
        entityId,
        entityType,
        embeddingResponse.embedding,
        metadata,
        {
          createIndexIfNotExists: true,
          updateVectorCount: options.updateVectorCounts
        }
      );
      
      // Update entity with reference to embedding
      await entityRef.update({
        vectorId,
        vectorTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        vectorStatus: SyncStatus.COMPLETED,
        schemaVersion: CURRENT_SCHEMA_VERSION
      });
      
      syncLogger.info("Entity synchronized successfully", { vectorId });
      
      return {
        entityId,
        entityType,
        success: true,
        vectorId,
        timestamp: Date.now()
      };
    } catch (error) {
      syncLogger.error("Failed to synchronize entity", error as Error);
      
      // Update entity with error status
      const entityRef = this.db.collection(getEntityCollectionPath(entityType)).doc(entityId);
      await entityRef.update({
        vectorStatus: SyncStatus.FAILED,
        vectorError: error instanceof Error ? error.message : "Unknown error",
        vectorTimestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        entityId,
        entityType,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: Date.now()
      };
    }
  }

  /**
   * Synchronize multiple entities in batch
   * @param entityIds IDs of the entities
   * @param entityType Type of the entities
   * @param options Synchronization options
   * @returns Array of synchronization results
   */
  async syncEntitiesBatch(
    entityIds: string[],
    entityType: EntityType,
    options: SyncOptions = {}
  ): Promise<SyncResult[]> {
    const batchLogger = this.logger.child(`syncEntitiesBatch:${entityType}`);
    batchLogger.info("Synchronizing entities batch", { 
      count: entityIds.length,
      options 
    });
    
    const results: SyncResult[] = [];
    
    // Process entities in batch
    for (const entityId of entityIds) {
      try {
        const result = await this.syncEntity(entityId, entityType, options);
        results.push(result);
      } catch (error) {
        batchLogger.error(`Error synchronizing entity ${entityId}`, error as Error);
        
        results.push({
          entityId,
          entityType,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now()
        });
      }
    }
    
    batchLogger.info("Entities batch synchronization completed", {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
    
    return results;
  }

  /**
   * Synchronize all entities of a specific type
   * @param entityType Type of the entities
   * @param options Synchronization options
   * @returns Synchronization summary
   */
  async syncAllEntities(
    entityType: EntityType,
    options: SyncOptions = {}
  ): Promise<SyncSummary> {
    const syncLogger = this.logger.child(`syncAllEntities:${entityType}`);
    const startTimestamp = Date.now();
    const batchSize = options.batchSize || 10;
    
    syncLogger.info("Synchronizing all entities", { 
      entityType,
      options 
    });
    
    try {
      // Get all entity IDs
      let entityIds: string[] = [];
      
      if (options.force) {
        // Get all entities
        const entitiesSnapshot = await this.db
          .collection(getEntityCollectionPath(entityType))
          .get();
        
        entityIds = entitiesSnapshot.docs.map(doc => doc.id);
      } else {
        // Get only entities that need synchronization
        const entitiesSnapshot = await this.db
          .collection(getEntityCollectionPath(entityType))
          .where("vectorStatus", "!=", SyncStatus.COMPLETED)
          .get();
        
        entityIds = entitiesSnapshot.docs.map(doc => doc.id);
      }
      
      syncLogger.info(`Found ${entityIds.length} entities to synchronize`);
      
      // Synchronize entities in batches
      const results: SyncResult[] = [];
      
      for (let i = 0; i < entityIds.length; i += batchSize) {
        const batch = entityIds.slice(i, i + batchSize);
        const batchResults = await this.syncEntitiesBatch(batch, entityType, options);
        results.push(...batchResults);
      }
      
      // Calculate summary
      const endTimestamp = Date.now();
      const successResults = results.filter(result => result.success);
      const failedResults = results.filter(result => !result.success);
      
      const summary: SyncSummary = {
        total: results.length,
        success: successResults.length,
        failed: failedResults.length,
        failedIds: failedResults.map(result => result.entityId),
        startTimestamp,
        endTimestamp,
        durationMs: endTimestamp - startTimestamp
      };
      
      syncLogger.info("All entities synchronization completed", summary);
      
      return summary;
    } catch (error) {
      syncLogger.error("Failed to synchronize all entities", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to synchronize all entities: ${error.message}`,
            ErrorType.EXTERNAL_SERVICE,
            500,
            error
          )
        : new AppError(
            "Failed to synchronize all entities: Unknown error",
            ErrorType.EXTERNAL_SERVICE,
            500
          );
    }
  }

  /**
   * Delete entity vectors
   * @param entityId ID of the entity
   * @param entityType Type of the entity
   * @returns True if successful
   */
  async deleteEntityVectors(
    entityId: string,
    entityType: EntityType
  ): Promise<boolean> {
    const deleteLogger = this.logger.child(`deleteEntityVectors:${entityType}:${entityId}`);
    deleteLogger.info("Deleting entity vectors");
    
    try {
      // Get entity from Firestore
      const entityRef = this.db.collection(getEntityCollectionPath(entityType)).doc(entityId);
      const entityDoc = await entityRef.get();
      
      if (!entityDoc.exists) {
        deleteLogger.warn("Entity not found, nothing to delete");
        return false;
      }
      
      const entity = entityDoc.data() as EntityWithVectorFields;
      
      // Check if entity has a vector
      if (!entity.vectorId) {
        deleteLogger.warn("Entity has no vector, nothing to delete");
        return false;
      }
      
      // Delete vector from Vertex AI
      await this.indexOperations.deleteVector(
        entity.vectorId,
        entityType,
        entity.schemaVersion || CURRENT_SCHEMA_VERSION
      );
      
      // Update entity
      await entityRef.update({
        vectorId: admin.firestore.FieldValue.delete(),
        vectorStatus: admin.firestore.FieldValue.delete(),
        vectorTimestamp: admin.firestore.FieldValue.delete(),
        vectorError: admin.firestore.FieldValue.delete()
      });
      
      deleteLogger.info("Entity vectors deleted successfully");
      
      return true;
    } catch (error) {
      deleteLogger.error("Failed to delete entity vectors", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to delete entity vectors: ${error.message}`,
            ErrorType.EXTERNAL_SERVICE,
            500,
            error
          )
        : new AppError(
            "Failed to delete entity vectors: Unknown error",
            ErrorType.EXTERNAL_SERVICE,
            500
          );
    }
  }

  /**
   * Reconcile Firestore entities with Vertex AI vectors
   * @param entityType Type of the entities
   * @returns Reconciliation summary
   */
  async reconcileEntities(entityType: EntityType): Promise<{
    missingInVertexAI: string[];
    missingInFirestore: string[];
    reconciled: number;
  }> {
    const reconcileLogger = this.logger.child(`reconcileEntities:${entityType}`);
    reconcileLogger.info("Reconciling entities");
    
    try {
      // Get all entities from Firestore
      const entitiesSnapshot = await this.db
        .collection(getEntityCollectionPath(entityType))
        .get();
      
      const firestoreEntities = entitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EntityWithVectorFields[];
      
      // Get active index for the entity type
      const indexMetadata = await this.indexManager.getActiveIndex(entityType);
      
      if (!indexMetadata) {
        throw new AppError(
          `No active index found for entity type ${entityType}`,
          ErrorType.NOT_FOUND,
          404
        );
      }
      
      // TODO: Implement retrieval of all vectors from Vertex AI
      // This is a placeholder for now
      const vertexAIVectors: { id: string; entityId: string }[] = [];
      
      // Find entities missing in Vertex AI
      const missingInVertexAI = firestoreEntities
        .filter(entity => 
          entity.vectorStatus === SyncStatus.COMPLETED && 
          entity.vectorId && 
          !vertexAIVectors.some(v => v.id === entity.vectorId)
        )
        .map(entity => entity.id);
      
      // Find vectors missing in Firestore
      const missingInFirestore = vertexAIVectors
        .filter(vector => 
          !firestoreEntities.some(e => e.vectorId === vector.id)
        )
        .map(vector => vector.entityId);
      
      reconcileLogger.info("Reconciliation completed", {
        firestoreEntitiesCount: firestoreEntities.length,
        vertexAIVectorsCount: vertexAIVectors.length,
        missingInVertexAICount: missingInVertexAI.length,
        missingInFirestoreCount: missingInFirestore.length
      });
      
      return {
        missingInVertexAI,
        missingInFirestore,
        reconciled: Math.min(firestoreEntities.length, vertexAIVectors.length) - 
          missingInVertexAI.length - missingInFirestore.length
      };
    } catch (error) {
      reconcileLogger.error("Failed to reconcile entities", error as Error);
      throw error instanceof Error
        ? new AppError(
            `Failed to reconcile entities: ${error.message}`,
            ErrorType.EXTERNAL_SERVICE,
            500,
            error
          )
        : new AppError(
            "Failed to reconcile entities: Unknown error",
            ErrorType.EXTERNAL_SERVICE,
            500
          );
    }
  }
}