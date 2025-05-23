/**
 * Vector Database Integration Types for Cloud Functions
 * 
 * This file contains the type definitions for the Vector Database Integration
 * architecture in Cloud Functions, which enables AI-powered features in RPG Scribe
 * using Google's Vertex AI Vector Search.
 */

/**
 * Entity type enum
 */
export enum EntityType {
  CHARACTER = 'CHARACTER',
  LOCATION = 'LOCATION',
  ITEM = 'ITEM',
  EVENT = 'EVENT',
  SESSION = 'SESSION',
  FACTION = 'FACTION',
  STORY_ARC = 'STORY_ARC',
  CAMPAIGN = 'CAMPAIGN',
  RPG_WORLD = 'RPG_WORLD',
  NOTE = 'NOTE'
}

/**
 * Options for embedding generation
 */
export interface EmbeddingOptions {
  /** Model to use for embedding generation */
  model?: string;
  /** Dimension of the embedding vector */
  dimension?: number;
  /** Whether to normalize the embedding vector */
  normalize?: boolean;
  /** Timeout in milliseconds */
  timeoutMs?: number;
}

/**
 * Result of a synchronization operation
 */
export interface SyncResult {
  /** ID of the entity */
  entityId: string;
  /** Type of the entity */
  entityType: EntityType;
  /** Whether the synchronization was successful */
  success: boolean;
  /** ID of the embedding if successful */
  embeddingId?: string;
  /** Error message if unsuccessful */
  error?: string;
  /** Timestamp of the synchronization */
  timestamp: number;
}

/**
 * Status of a synchronization
 */
export interface SyncStatus {
  /** ID of the entity */
  entityId: string;
  /** Type of the entity */
  entityType: EntityType;
  /** Status of the synchronization */
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  /** ID of the embedding if completed */
  embeddingId?: string;
  /** Error message if failed */
  error?: string;
  /** Timestamp of the last synchronization */
  timestamp: number;
}

/**
 * Configuration for Vertex AI
 */
export interface VertexAIConfig {
  /** Environment (development, staging, production) */
  environment: 'development' | 'staging' | 'production';
  /** Google Cloud project ID */
  projectId: string;
  /** Google Cloud location */
  location: string;
  /** Index endpoint */
  indexEndpoint: string;
  /** Embedding model */
  embeddingModel: string;
  /** Namespace for multi-tenant support */
  namespace: string;
  /** API endpoint */
  apiEndpoint: string;
  /** Maximum number of retries */
  maxRetries: number;
  /** Timeout in milliseconds */
  timeoutMs: number;
}

/**
 * Entity data with vector fields
 */
export interface EntityWithVectorFields {
  /** ID of the entity */
  id: string;
  /** Type of the entity */
  type: EntityType;
  /** ID of the vector embedding */
  vectorId?: string;
  /** Timestamp of the vector synchronization */
  vectorTimestamp?: FirebaseFirestore.Timestamp;
  /** Status of the vector synchronization */
  vectorStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';
  /** Error message if synchronization failed */
  vectorError?: string;
  /** Schema version */
  schemaVersion?: number;
  /** Entity data */
  [key: string]: any;
}

/**
 * Embedding data for Vertex AI
 */
export interface EmbeddingData {
  /** ID of the entity */
  entityId: string;
  /** Type of the entity */
  entityType: EntityType;
  /** Embedding vector */
  embedding: number[];
  /** Additional metadata */
  metadata: Record<string, any>;
}

/**
 * Response from the Vertex AI Embedding API
 */
export interface EmbeddingResponse {
  /** Embedding vector */
  embedding: number[];
  /** Dimension of the embedding */
  dimension: number;
}

/**
 * Sync operation type
 */
export enum SyncOperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

/**
 * Sync operation data
 */
export interface SyncOperation {
  /** Type of operation */
  type: SyncOperationType;
  /** ID of the entity */
  entityId: string;
  /** Type of the entity */
  entityType: EntityType;
  /** Entity data (for CREATE and UPDATE) */
  entityData?: any;
  /** Timestamp of the operation */
  timestamp: number;
}

/**
 * Get the collection path for an entity type
 * @param type Entity type
 * @param parentId Parent ID (campaign ID or world ID)
 * @returns Collection path
 */
export function getEntityCollectionPath(type: EntityType, parentId?: string): string {
  switch (type) {
    case EntityType.CHARACTER:
      return parentId ? `campaigns/${parentId}/characters` : 'characters';
    case EntityType.LOCATION:
      return parentId ? `campaigns/${parentId}/locations` : 'locations';
    case EntityType.ITEM:
      return parentId ? `campaigns/${parentId}/items` : 'items';
    case EntityType.EVENT:
      return parentId ? `campaigns/${parentId}/events` : 'events';
    case EntityType.SESSION:
      return parentId ? `campaigns/${parentId}/sessions` : 'sessions';
    case EntityType.FACTION:
      return parentId ? `campaigns/${parentId}/factions` : 'factions';
    case EntityType.STORY_ARC:
      return parentId ? `campaigns/${parentId}/storyArcs` : 'storyArcs';
    case EntityType.CAMPAIGN:
      return parentId ? `worlds/${parentId}/campaigns` : 'campaigns';
    case EntityType.RPG_WORLD:
      return 'worlds';
    case EntityType.NOTE:
      return parentId ? `campaigns/${parentId}/notes` : 'notes';
    default:
      throw new Error(`Unknown entity type: ${type}`);
  }
}
