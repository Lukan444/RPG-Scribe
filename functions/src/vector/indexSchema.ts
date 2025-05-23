/**
 * Vertex AI Index Schema Definitions
 * 
 * This file contains the schema definitions for Vertex AI Vector Search indexes,
 * including versioning, structure, and metadata.
 */

import { EntityType } from "./types";

/**
 * Current schema version
 * Increment this when making breaking changes to the schema
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Index schema version history
 */
export interface SchemaVersionInfo {
  /** Schema version number */
  version: number;
  /** Description of the schema version */
  description: string;
  /** Date the schema version was created */
  createdAt: string;
  /** Whether this schema version is deprecated */
  deprecated: boolean;
}

/**
 * Schema version history
 */
export const SCHEMA_VERSION_HISTORY: SchemaVersionInfo[] = [
  {
    version: 1,
    description: "Initial schema version with basic entity embedding support",
    createdAt: "2023-07-01",
    deprecated: false
  }
];

/**
 * Index dimension configuration by entity type
 */
export const INDEX_DIMENSIONS: Record<EntityType, number> = {
  [EntityType.CHARACTER]: 768,
  [EntityType.LOCATION]: 768,
  [EntityType.ITEM]: 768,
  [EntityType.EVENT]: 768,
  [EntityType.SESSION]: 768,
  [EntityType.FACTION]: 768,
  [EntityType.STORY_ARC]: 768,
  [EntityType.CAMPAIGN]: 768,
  [EntityType.RPG_WORLD]: 768,
  [EntityType.NOTE]: 768
};

/**
 * Index structure definition
 */
export interface IndexStructure {
  /** Name of the index */
  name: string;
  /** Display name of the index */
  displayName: string;
  /** Description of the index */
  description: string;
  /** Metadata fields to include in the index */
  metadataFields: string[];
  /** Dimension of the embedding vectors */
  dimension: number;
  /** Approximate nearest neighbor algorithm */
  algorithm: "tree-ah" | "brute-force";
  /** Distance measure */
  distanceMeasure: "dot-product" | "cosine" | "euclidean";
  /** Shard count */
  shardCount: number;
}

/**
 * Get the index structure for an entity type
 * @param entityType Entity type
 * @param schemaVersion Schema version
 * @returns Index structure
 */
export function getIndexStructure(
  entityType: EntityType,
  schemaVersion: number = CURRENT_SCHEMA_VERSION
): IndexStructure {
  // For now, we have a single schema version
  // In the future, we can add logic to handle different schema versions
  
  const dimension = INDEX_DIMENSIONS[entityType];
  
  return {
    name: `${entityType.toLowerCase()}-index-v${schemaVersion}`,
    displayName: `${entityType} Index v${schemaVersion}`,
    description: `Vector index for ${entityType} entities (schema v${schemaVersion})`,
    metadataFields: [
      "entityId",
      "entityType",
      "worldId",
      "campaignId",
      "createdAt",
      "updatedAt",
      "schemaVersion"
    ],
    dimension,
    algorithm: "tree-ah", // More efficient for large datasets
    distanceMeasure: "cosine", // Better for semantic similarity
    shardCount: 2 // Default shard count, can be adjusted based on data size
  };
}

/**
 * Index metadata schema
 */
export interface IndexMetadata {
  /** ID of the index */
  indexId: string;
  /** Name of the index */
  indexName: string;
  /** Entity type the index is for */
  entityType: EntityType;
  /** Schema version of the index */
  schemaVersion: number;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Status of the index */
  status: "CREATING" | "READY" | "UPDATING" | "DELETING" | "ERROR";
  /** Error message if status is ERROR */
  error?: string;
  /** Number of vectors in the index */
  vectorCount: number;
  /** Index structure */
  structure: IndexStructure;
  /** Environment the index is for */
  environment: "development" | "staging" | "production";
  /** Whether this is the active index for the entity type */
  active: boolean;
}

/**
 * Get the Firestore document path for index metadata
 * @param entityType Entity type
 * @param schemaVersion Schema version
 * @param environment Environment
 * @returns Firestore document path
 */
export function getIndexMetadataPath(
  entityType: EntityType,
  schemaVersion: number = CURRENT_SCHEMA_VERSION,
  environment: string = "development"
): string {
  return `vector-indexes/${environment}-${entityType.toLowerCase()}-v${schemaVersion}`;
}

/**
 * Get the Vertex AI index ID for an entity type
 * @param entityType Entity type
 * @param schemaVersion Schema version
 * @param environment Environment
 * @returns Vertex AI index ID
 */
export function getVertexAIIndexId(
  entityType: EntityType,
  schemaVersion: number = CURRENT_SCHEMA_VERSION,
  environment: string = "development"
): string {
  return `${environment}-${entityType.toLowerCase()}-v${schemaVersion}`;
}

/**
 * Get the Vertex AI index endpoint ID for an environment
 * @param environment Environment
 * @returns Vertex AI index endpoint ID
 */
export function getVertexAIIndexEndpointId(
  environment: string = "development"
): string {
  return `${environment}-endpoint`;
}

/**
 * Get the namespace for an entity type
 * @param entityType Entity type
 * @param worldId Optional world ID for multi-tenant support
 * @returns Namespace
 */
export function getNamespace(
  entityType: EntityType,
  worldId?: string
): string {
  return worldId 
    ? `${entityType.toLowerCase()}-${worldId}`
    : entityType.toLowerCase();
}