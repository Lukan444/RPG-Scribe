/**
 * Cloud Functions for RPG Scribe
 *
 * This file contains the Cloud Functions for RPG Scribe, including
 * functions for synchronizing entities with Vertex AI Vector Search.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { EntityType, EntityWithVectorFields, SyncOperationType } from "./vector/types";
import { VertexAIClient } from "./vector/vertexAIClient";
import { syncEntity, syncEntitiesBatch } from "./vector/entitySync";
import { Logger } from "./utils/logging";
import { getCurrentConfig } from "./vector/config";
import { IndexManager } from "./vector/indexManagement";
import { IndexOperations } from "./vector/indexOperations";
import { IndexSynchronizer } from "./vector/indexSync";
import { IndexMetadataManager } from "./vector/indexMetadata";
import { CURRENT_SCHEMA_VERSION } from "./vector/indexSchema";
import { AppError, ErrorType } from "./utils/error-handling";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Firestore
const db = admin.firestore();

// Create a logger for the Cloud Functions
const logger = new Logger("rpg-scribe-functions");

// Create a Vertex AI client
const vertexClient = new VertexAIClient(getCurrentConfig(), logger);

// Create Index Manager and related services
const indexManager = new IndexManager(db, logger);
const indexOperations = new IndexOperations(db, logger);
const indexSynchronizer = new IndexSynchronizer(db, logger, vertexClient);
const indexMetadataManager = new IndexMetadataManager(db, logger);

/**
 * Function to synchronize an entity with Vertex AI Vector Search
 */
export const syncEntityToVectorSearch = functions.firestore
  .document("{collection}/{entityId}")
  .onWrite(async (change, context) => {
    const { collection, entityId } = context.params;
    const functionLogger = logger.child(`syncEntityToVectorSearch:${collection}:${entityId}`);

    // Skip non-entity collections
    if (!isEntityCollection(collection)) {
      functionLogger.debug("Skipping non-entity collection");
      return null;
    }

    // Determine the entity type from the collection
    const entityType = getEntityTypeFromCollection(collection);
    if (!entityType) {
      functionLogger.warn("Could not determine entity type from collection");
      return null;
    }

    // Determine the operation type
    let operationType: SyncOperationType;
    let entityData: EntityWithVectorFields | null = null;

    if (!change.before.exists) {
      // Document was created
      operationType = SyncOperationType.CREATE;
      entityData = change.after.data() as EntityWithVectorFields;
    } else if (!change.after.exists) {
      // Document was deleted
      operationType = SyncOperationType.DELETE;
      entityData = change.before.data() as EntityWithVectorFields;
    } else {
      // Document was updated
      operationType = SyncOperationType.UPDATE;
      entityData = change.after.data() as EntityWithVectorFields;

      // Check if the content has changed
      const beforeData = change.before.data() as EntityWithVectorFields;
      const contentChanged = hasContentChanged(beforeData, entityData, entityType);

      if (!contentChanged) {
        functionLogger.debug("Content has not changed, skipping synchronization");
        return null;
      }
    }

    // Add ID and type to entity data
    entityData.id = entityId;
    entityData.type = entityType;

    // Handle the operation
    switch (operationType) {
      case SyncOperationType.CREATE:
      case SyncOperationType.UPDATE:
        functionLogger.info(`${operationType} operation detected, synchronizing entity`);
        return syncEntity(
          entityId,
          entityType,
          entityData,
          db,
          vertexClient,
          functionLogger
        );

      case SyncOperationType.DELETE:
        functionLogger.info("DELETE operation detected, removing entity from vector search");
        // Use the new IndexSynchronizer to delete entity vectors
        try {
          await indexSynchronizer.deleteEntityVectors(entityId, entityType);
          functionLogger.info("Entity vectors deleted successfully");
        } catch (error) {
          functionLogger.error("Error deleting entity vectors", error);
        }
        return null;

      default:
        functionLogger.warn(`Unknown operation type: ${operationType}`);
        return null;
    }
  });

/**
 * Function to synchronize all entities of a specific type
 */
export const syncAllEntitiesOfType = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Check if the user is an admin
  // In a real implementation, we would check the user's role
  // For now, we'll just allow all authenticated users

  const { entityType, force = false, batchSize = 10 } = data;
  const functionLogger = logger.child(`syncAllEntitiesOfType:${entityType}`);

  // Validate entity type
  if (!Object.values(EntityType).includes(entityType)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Invalid entity type: ${entityType}`
    );
  }

  try {
    // Use the new IndexSynchronizer to synchronize all entities
    const summary = await indexSynchronizer.syncAllEntities(entityType as EntityType, {
      force,
      batchSize
    });

    functionLogger.info("Synchronization completed", summary);

    return {
      total: summary.total,
      success: summary.success,
      failed: summary.failed,
      failedIds: summary.failedIds,
      durationMs: summary.durationMs
    };
  } catch (error) {
    functionLogger.error("Error synchronizing entities", error);

    throw new functions.https.HttpsError(
      "internal",
      `Error synchronizing entities: ${error instanceof Error ? error.message : "Unknown error"}`,
      error instanceof Error ? error : undefined
    );
  }
});

/**
 * Function to create an index for an entity type
 */
export const createIndex = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Check if the user is an admin
  // In a real implementation, we would check the user's role
  // For now, we'll just allow all authenticated users

  const { 
    entityType, 
    schemaVersion = CURRENT_SCHEMA_VERSION, 
    recreate = false,
    makeActive = false,
    customStructure = {}
  } = data;
  
  const functionLogger = logger.child(`createIndex:${entityType}:v${schemaVersion}`);

  // Validate entity type
  if (!Object.values(EntityType).includes(entityType)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Invalid entity type: ${entityType}`
    );
  }

  try {
    // Create the index
    const indexMetadata = await indexManager.createIndex(
      entityType as EntityType,
      schemaVersion,
      {
        recreate,
        makeActive,
        customStructure
      }
    );

    functionLogger.info("Index created successfully", {
      indexId: indexMetadata.indexId,
      indexName: indexMetadata.indexName
    });

    return {
      success: true,
      indexId: indexMetadata.indexId,
      indexName: indexMetadata.indexName,
      entityType: indexMetadata.entityType,
      schemaVersion: indexMetadata.schemaVersion,
      active: indexMetadata.active
    };
  } catch (error) {
    functionLogger.error("Error creating index", error);

    throw new functions.https.HttpsError(
      "internal",
      `Error creating index: ${error instanceof Error ? error.message : "Unknown error"}`,
      error instanceof Error ? error : undefined
    );
  }
});

/**
 * Function to deploy an index to an endpoint
 */
export const deployIndex = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Check if the user is an admin
  // In a real implementation, we would check the user's role
  // For now, we'll just allow all authenticated users

  const { 
    entityType, 
    schemaVersion = CURRENT_SCHEMA_VERSION
  } = data;
  
  const functionLogger = logger.child(`deployIndex:${entityType}:v${schemaVersion}`);

  // Validate entity type
  if (!Object.values(EntityType).includes(entityType)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Invalid entity type: ${entityType}`
    );
  }

  try {
    // Deploy the index
    const success = await indexManager.deployIndexToEndpoint(
      entityType as EntityType,
      schemaVersion
    );

    functionLogger.info("Index deployed successfully");

    return {
      success
    };
  } catch (error) {
    functionLogger.error("Error deploying index", error);

    throw new functions.https.HttpsError(
      "internal",
      `Error deploying index: ${error instanceof Error ? error.message : "Unknown error"}`,
      error instanceof Error ? error : undefined
    );
  }
});

/**
 * Function to set the active index for an entity type
 */
export const setActiveIndex = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Check if the user is an admin
  // In a real implementation, we would check the user's role
  // For now, we'll just allow all authenticated users

  const { 
    entityType, 
    schemaVersion = CURRENT_SCHEMA_VERSION
  } = data;
  
  const functionLogger = logger.child(`setActiveIndex:${entityType}:v${schemaVersion}`);

  // Validate entity type
  if (!Object.values(EntityType).includes(entityType)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Invalid entity type: ${entityType}`
    );
  }

  try {
    // Set the active index
    const indexMetadata = await indexManager.setActiveIndex(
      entityType as EntityType,
      schemaVersion
    );

    functionLogger.info("Active index set successfully", {
      indexId: indexMetadata.indexId,
      indexName: indexMetadata.indexName
    });

    return {
      success: true,
      indexId: indexMetadata.indexId,
      indexName: indexMetadata.indexName,
      entityType: indexMetadata.entityType,
      schemaVersion: indexMetadata.schemaVersion,
      active: indexMetadata.active
    };
  } catch (error) {
    functionLogger.error("Error setting active index", error);

    throw new functions.https.HttpsError(
      "internal",
      `Error setting active index: ${error instanceof Error ? error.message : "Unknown error"}`,
      error instanceof Error ? error : undefined
    );
  }
});

/**
 * Function to get index metadata
 */
export const getIndexMetadata = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { 
    entityType, 
    schemaVersion = CURRENT_SCHEMA_VERSION
  } = data;
  
  const functionLogger = logger.child(`getIndexMetadata:${entityType}:v${schemaVersion}`);

  // Validate entity type
  if (!Object.values(EntityType).includes(entityType)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Invalid entity type: ${entityType}`
    );
  }

  try {
    // Get the index metadata
    const indexMetadata = await indexMetadataManager.getIndexMetadata(
      entityType as EntityType,
      schemaVersion
    );

    if (!indexMetadata) {
      throw new functions.https.HttpsError(
        "not-found",
        `Index not found for entity type ${entityType} and schema version ${schemaVersion}`
      );
    }

    return indexMetadata;
  } catch (error) {
    functionLogger.error("Error getting index metadata", error);

    throw new functions.https.HttpsError(
      "internal",
      `Error getting index metadata: ${error instanceof Error ? error.message : "Unknown error"}`,
      error instanceof Error ? error : undefined
    );
  }
});

/**
 * Function to get all indexes
 */
export const getAllIndexes = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { 
    entityType,
    active,
    status,
    limit
  } = data;
  
  const functionLogger = logger.child("getAllIndexes");

  try {
    // Query indexes
    const indexes = await indexMetadataManager.queryIndexes({
      entityType: entityType as EntityType | undefined,
      active,
      status,
      limit
    });

    return {
      indexes
    };
  } catch (error) {
    functionLogger.error("Error getting all indexes", error);

    throw new functions.https.HttpsError(
      "internal",
      `Error getting all indexes: ${error instanceof Error ? error.message : "Unknown error"}`,
      error instanceof Error ? error : undefined
    );
  }
});

/**
 * Function to get index statistics
 */
export const getIndexStatistics = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const functionLogger = logger.child("getIndexStatistics");

  try {
    // Get index statistics
    const statistics = await indexMetadataManager.getIndexStatistics();

    return statistics;
  } catch (error) {
    functionLogger.error("Error getting index statistics", error);

    throw new functions.https.HttpsError(
      "internal",
      `Error getting index statistics: ${error instanceof Error ? error.message : "Unknown error"}`,
      error instanceof Error ? error : undefined
    );
  }
});

/**
 * Function to delete an index
 */
export const deleteIndex = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Check if the user is an admin
  // In a real implementation, we would check the user's role
  // For now, we'll just allow all authenticated users

  const { 
    entityType, 
    schemaVersion = CURRENT_SCHEMA_VERSION
  } = data;
  
  const functionLogger = logger.child(`deleteIndex:${entityType}:v${schemaVersion}`);

  // Validate entity type
  if (!Object.values(EntityType).includes(entityType)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Invalid entity type: ${entityType}`
    );
  }

  try {
    // Delete the index
    const success = await indexManager.deleteIndex(
      entityType as EntityType,
      schemaVersion
    );

    functionLogger.info("Index deleted successfully");

    return {
      success
    };
  } catch (error) {
    functionLogger.error("Error deleting index", error);

    throw new functions.https.HttpsError(
      "internal",
      `Error deleting index: ${error instanceof Error ? error.message : "Unknown error"}`,
      error instanceof Error ? error : undefined
    );
  }
});

/**
 * Function to create indexes for all entity types
 */
export const createAllIndexes = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Check if the user is an admin
  // In a real implementation, we would check the user's role
  // For now, we'll just allow all authenticated users

  const { 
    schemaVersion = CURRENT_SCHEMA_VERSION, 
    recreate = false,
    makeActive = false
  } = data;
  
  const functionLogger = logger.child(`createAllIndexes:v${schemaVersion}`);

  try {
    // Create indexes for all entity types
    const results = await indexManager.createAllIndexes(
      schemaVersion,
      {
        recreate,
        makeActive
      }
    );

    functionLogger.info("All indexes created successfully", {
      count: results.length
    });

    return {
      success: true,
      count: results.length,
      indexes: results.map(index => ({
        indexId: index.indexId,
        indexName: index.indexName,
        entityType: index.entityType,
        schemaVersion: index.schemaVersion,
        active: index.active
      }))
    };
  } catch (error) {
    functionLogger.error("Error creating all indexes", error);

    throw new functions.https.HttpsError(
      "internal",
      `Error creating all indexes: ${error instanceof Error ? error.message : "Unknown error"}`,
      error instanceof Error ? error : undefined
    );
  }
});

/**
 * Check if an entity's content has changed
 * @param before Entity data before the change
 * @param after Entity data after the change
 * @param entityType Type of the entity
 * @returns True if the content has changed
 */
function hasContentChanged(
  before: EntityWithVectorFields,
  after: EntityWithVectorFields,
  entityType: EntityType
): boolean {
  // Extract text content from both versions
  const beforeContent = extractTextContent(before, entityType);
  const afterContent = extractTextContent(after, entityType);

  // Compare the content
  return beforeContent !== afterContent;
}

/**
 * Extract text content from an entity for comparison
 * @param entity Entity data
 * @param entityType Type of the entity
 * @returns Text content
 */
function extractTextContent(entity: any, entityType: EntityType): string {
  // This is a simplified version of the function in entitySync.ts
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
 * Check if a collection is an entity collection
 * @param collection Collection name
 * @returns True if the collection is an entity collection
 */
function isEntityCollection(collection: string): boolean {
  return [
    "characters",
    "locations",
    "items",
    "events",
    "sessions",
    "factions",
    "storyArcs",
    "campaigns",
    "worlds",
    "notes"
  ].includes(collection);
}

/**
 * Get the entity type from a collection name
 * @param collection Collection name
 * @returns Entity type or null if not found
 */
function getEntityTypeFromCollection(collection: string): EntityType | null {
  switch (collection) {
    case "characters":
      return EntityType.CHARACTER;
    case "locations":
      return EntityType.LOCATION;
    case "items":
      return EntityType.ITEM;
    case "events":
      return EntityType.EVENT;
    case "sessions":
      return EntityType.SESSION;
    case "factions":
      return EntityType.FACTION;
    case "storyArcs":
      return EntityType.STORY_ARC;
    case "campaigns":
      return EntityType.CAMPAIGN;
    case "worlds":
      return EntityType.RPG_WORLD;
    case "notes":
      return EntityType.NOTE;
    default:
      return null;
  }
}

/**
 * Get the collection path from an entity type
 * @param entityType Entity type
 * @returns Collection path
 */
function getCollectionPathFromEntityType(entityType: EntityType): string {
  switch (entityType) {
    case EntityType.CHARACTER:
      return "characters";
    case EntityType.LOCATION:
      return "locations";
    case EntityType.ITEM:
      return "items";
    case EntityType.EVENT:
      return "events";
    case EntityType.SESSION:
      return "sessions";
    case EntityType.FACTION:
      return "factions";
    case EntityType.STORY_ARC:
      return "storyArcs";
    case EntityType.CAMPAIGN:
      return "campaigns";
    case EntityType.RPG_WORLD:
      return "worlds";
    case EntityType.NOTE:
      return "notes";
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}