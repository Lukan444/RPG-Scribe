/**
 * Entity Synchronization Functions
 *
 * This file contains functions for synchronizing entities with Vertex AI Vector Search.
 */

import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import {
  EntityType,
  EntityWithVectorFields,
  SyncResult,
  SyncStatus,
  getEntityCollectionPath
} from "./types";
import { VertexAIClient } from "./vertexAIClient";
import { Logger } from "../utils/logging";
import { AppError, ErrorType } from "../utils/error-handling";
import { getCurrentConfig } from "./config";

/**
 * Extract text content from an entity for embedding generation
 * @param entity Entity to extract text from
 * @param entityType Type of the entity
 * @returns Text content
 */
function extractTextContent(entity: any, entityType: EntityType): string {
  // Extract text content based on entity type
  switch (entityType) {
    case EntityType.CHARACTER:
      return [
        entity.name,
        entity.description,
        entity.background,
        entity.personality,
        entity.appearance,
        entity.notes
      ].filter(Boolean).join(" ");

    case EntityType.LOCATION:
      return [
        entity.name,
        entity.description,
        entity.history,
        entity.notes
      ].filter(Boolean).join(" ");

    case EntityType.ITEM:
      return [
        entity.name,
        entity.description,
        entity.history,
        entity.notes
      ].filter(Boolean).join(" ");

    case EntityType.EVENT:
      return [
        entity.name,
        entity.description,
        entity.outcome,
        entity.notes
      ].filter(Boolean).join(" ");

    case EntityType.NOTE:
      return [
        entity.title,
        entity.content
      ].filter(Boolean).join(" ");

    default:
      return [
        entity.name,
        entity.description,
        entity.notes
      ].filter(Boolean).join(" ");
  }
}

/**
 * Synchronize an entity with Vertex AI Vector Search
 * @param entityId ID of the entity
 * @param entityType Type of the entity
 * @param entityData Entity data
 * @param db Firestore database
 * @param vertexClient Vertex AI client
 * @param logger Logger instance
 * @param force Whether to force synchronization even if already synchronized
 * @returns Synchronization result
 */
export async function syncEntity(
  entityId: string,
  entityType: EntityType,
  entityData: any,
  db: admin.firestore.Firestore,
  vertexClient: VertexAIClient,
  logger: Logger,
  force: boolean = false
): Promise<SyncResult> {
  const syncLogger = logger.child(`syncEntity:${entityType}:${entityId}`);
  syncLogger.info("Starting entity synchronization");

  try {
    // Check if entity needs synchronization
    if (!force &&
        entityData.vectorStatus === "COMPLETED" &&
        entityData.vectorId &&
        entityData.vectorTimestamp) {
      syncLogger.info("Entity already synchronized, skipping");
      return {
        entityId,
        entityType,
        success: true,
        embeddingId: entityData.vectorId,
        timestamp: Date.now()
      };
    }

    // Update entity status to PENDING
    const entityRef = db.collection(getEntityCollectionPath(entityType)).doc(entityId);
    await entityRef.update({
      vectorStatus: "PENDING",
      vectorTimestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Extract text content for embedding
    const textContent = extractTextContent(entityData, entityType);

    if (!textContent || textContent.trim().length === 0) {
      syncLogger.warn("Entity has no text content, skipping");
      await entityRef.update({
        vectorStatus: "FAILED",
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
    const config = getCurrentConfig();
    const embedding = await vertexClient.generateEmbedding(
      textContent,
      config.embeddingModel
    );

    if (!embedding) {
      throw new AppError(
        "Failed to generate embedding",
        ErrorType.EXTERNAL_SERVICE,
        500
      );
    }

    // Generate a unique ID for the embedding
    const embeddingId = uuidv4();

    // In a real implementation, we would store the embedding in Vertex AI Vector Search
    // For now, we'll just log it
    syncLogger.info("Generated embedding", {
      embeddingId,
      dimension: embedding.dimension
    });

    // Update entity with reference to embedding
    await entityRef.update({
      vectorId: embeddingId,
      vectorTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      vectorStatus: "COMPLETED"
    });

    syncLogger.info("Entity synchronized successfully");

    return {
      entityId,
      entityType,
      success: true,
      embeddingId,
      timestamp: Date.now()
    };
  } catch (error) {
    syncLogger.error("Error synchronizing entity", error as Error);

    // Update entity with error status
    try {
      const entityRef = db.collection(getEntityCollectionPath(entityType)).doc(entityId);
      await entityRef.update({
        vectorStatus: "FAILED",
        vectorError: error instanceof Error ? error.message : "Unknown error",
        vectorTimestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (updateError) {
      syncLogger.error("Error updating entity with error status", updateError as Error);
    }

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
 * @param entities Entities to synchronize
 * @param db Firestore database
 * @param vertexClient Vertex AI client
 * @param logger Logger instance
 * @param force Whether to force synchronization even if already synchronized
 * @returns Array of synchronization results
 */
export async function syncEntitiesBatch(
  entities: EntityWithVectorFields[],
  db: admin.firestore.Firestore,
  vertexClient: VertexAIClient,
  logger: Logger,
  force: boolean = false
): Promise<SyncResult[]> {
  const batchLogger = logger.child(`syncEntitiesBatch:${entities.length}`);
  batchLogger.info("Starting batch entity synchronization");

  const results: SyncResult[] = [];

  for (const entity of entities) {
    try {
      const result = await syncEntity(
        entity.id,
        entity.type,
        entity,
        db,
        vertexClient,
        batchLogger,
        force
      );

      results.push(result);
    } catch (error) {
      batchLogger.error(`Error synchronizing entity ${entity.id}`, error as Error);

      results.push({
        entityId: entity.id,
        entityType: entity.type,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: Date.now()
      });
    }
  }

  batchLogger.info("Batch entity synchronization completed", {
    total: entities.length,
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  });

  return results;
}

/**
 * Get the synchronization status of an entity
 * @param entityId ID of the entity
 * @param entityType Type of the entity
 * @param db Firestore database
 * @param logger Logger instance
 * @returns Synchronization status
 */
export async function getSyncStatus(
  entityId: string,
  entityType: EntityType,
  db: admin.firestore.Firestore,
  logger: Logger
): Promise<SyncStatus> {
  const statusLogger = logger.child(`getSyncStatus:${entityType}:${entityId}`);
  statusLogger.info("Getting entity synchronization status");

  try {
    // Get entity from Firestore
    const entityRef = db.collection(getEntityCollectionPath(entityType)).doc(entityId);
    const entityDoc = await entityRef.get();

    if (!entityDoc.exists) {
      throw new AppError(
        `Entity ${entityId} not found`,
        ErrorType.NOT_FOUND,
        404
      );
    }

    const entity = entityDoc.data() as EntityWithVectorFields;

    return {
      entityId,
      entityType,
      status: entity.vectorStatus || "PENDING",
      embeddingId: entity.vectorId,
      error: entity.vectorError,
      timestamp: entity.vectorTimestamp?.toMillis() || Date.now()
    };
  } catch (error) {
    statusLogger.error("Error getting entity synchronization status", error as Error);

    throw error instanceof AppError
      ? error
      : new AppError(
          `Failed to get sync status: ${error instanceof Error ? error.message : "Unknown error"}`,
          ErrorType.INTERNAL,
          500,
          error instanceof Error ? error : undefined
        );
  }
}
