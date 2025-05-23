/**
 * Entity Vector Synchronizer
 *
 * This class handles the synchronization of entities with their vector embeddings.
 * It extracts text content from entities, generates embeddings, and stores them
 * in the vector database.
 */

import { serverTimestamp } from 'firebase/firestore';
import { EntityType } from '../../models/EntityType';
import { VectorService } from './VectorService';
import { SyncResult, SyncSummary, SyncStatus, SyncOptions } from './types';

/**
 * Entity Vector Synchronizer
 */
export class EntityVectorSynchronizer {
  private firestoreService: any; // Replace with actual FirestoreService type
  private vectorService: VectorService;
  private entityType: EntityType;

  /**
   * Create a new Entity Vector Synchronizer
   * @param firestoreService Firestore service for the entity type
   * @param vectorService Vector service
   * @param entityType Entity type
   */
  constructor(firestoreService: any, vectorService: VectorService, entityType: EntityType) {
    this.firestoreService = firestoreService;
    this.vectorService = vectorService;
    this.entityType = entityType;
  }

  /**
   * Synchronize an entity with its vector embedding
   * @param entityId ID of the entity to synchronize
   * @returns Synchronization result
   */
  async syncEntity(entityId: string): Promise<SyncResult> {
    try {
      // Get entity from Firestore
      const entity = await this.firestoreService.getById(entityId);
      if (!entity) {
        throw new Error(`Entity ${entityId} not found`);
      }

      // Extract text content for embedding
      const textContent = this.extractTextContent(entity);

      // Generate embedding
      const embedding = await this.vectorService.generateEmbedding(textContent);

      // Store embedding in Vertex AI
      const embeddingId = await this.vectorService.storeEmbedding(
        entityId,
        this.entityType,
        embedding,
        { lastUpdated: new Date().toISOString() }
      );

      // Update entity in Firestore with reference to embedding
      await this.firestoreService.update(entityId, {
        vectorId: embeddingId,
        vectorTimestamp: serverTimestamp(),
        vectorStatus: 'COMPLETED'
      });

      return {
        entityId,
        entityType: this.entityType,
        success: true,
        embeddingId,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`Error syncing entity ${entityId}:`, error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update entity with error status
      await this.firestoreService.update(entityId, {
        vectorStatus: 'FAILED',
        vectorError: errorMessage
      });

      return {
        entityId,
        entityType: this.entityType,
        success: false,
        error: errorMessage,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Synchronize multiple entities in batch
   * @param entityIds IDs of the entities to synchronize
   * @returns Array of synchronization results
   */
  async syncEntitiesBatch(entityIds: string[]): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const entityId of entityIds) {
      try {
        const result = await this.syncEntity(entityId);
        results.push(result);
      } catch (error) {
        console.error(`Error syncing entity ${entityId} in batch:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          entityId,
          entityType: this.entityType,
          success: false,
          error: errorMessage,
          timestamp: Date.now()
        });
      }
    }

    return results;
  }

  /**
   * Synchronize all entities of the specified type
   * @param options Synchronization options
   * @returns Synchronization summary
   */
  async syncAllEntities(options?: SyncOptions): Promise<SyncSummary> {
    const startTimestamp = Date.now();
    const batchSize = options?.batchSize || 10;
    const force = options?.force || false;

    try {
      // Get all entity IDs
      let entityIds: string[] = [];

      if (force) {
        // Get all entities
        const entities = await this.firestoreService.getAll();
        entityIds = entities.map((entity: any) => entity.id);
      } else {
        // Get only entities that need synchronization
        const entities = await this.firestoreService.query([
          { field: 'vectorStatus', operator: '!=', value: 'COMPLETED' }
        ]);
        entityIds = entities.map((entity: any) => entity.id);
      }

      console.log(`Syncing ${entityIds.length} entities of type ${this.entityType}`);

      // Synchronize entities in batches
      const results: SyncResult[] = [];
      for (let i = 0; i < entityIds.length; i += batchSize) {
        const batch = entityIds.slice(i, i + batchSize);
        const batchResults = await this.syncEntitiesBatch(batch);
        results.push(...batchResults);
      }

      // Calculate summary
      const endTimestamp = Date.now();
      const successResults = results.filter(result => result.success);
      const failedResults = results.filter(result => !result.success);

      return {
        total: results.length,
        success: successResults.length,
        failed: failedResults.length,
        failedIds: failedResults.map(result => result.entityId),
        startTimestamp,
        endTimestamp,
        durationMs: endTimestamp - startTimestamp
      };
    } catch (error) {
      console.error(`Error syncing all entities of type ${this.entityType}:`, error);

      return {
        total: 0,
        success: 0,
        failed: 0,
        failedIds: [],
        startTimestamp,
        endTimestamp: Date.now(),
        durationMs: Date.now() - startTimestamp
      };
    }
  }

  /**
   * Get the synchronization status of an entity
   * @param entityId ID of the entity
   * @returns Synchronization status
   */
  async getSyncStatus(entityId: string): Promise<SyncStatus> {
    try {
      // Get entity from Firestore
      const entity = await this.firestoreService.getById(entityId);
      if (!entity) {
        throw new Error(`Entity ${entityId} not found`);
      }

      return {
        entityId,
        entityType: this.entityType,
        status: entity.vectorStatus || 'PENDING',
        embeddingId: entity.vectorId,
        error: entity.vectorError,
        timestamp: entity.vectorTimestamp?.toMillis() || Date.now()
      };
    } catch (error) {
      console.error(`Error getting sync status for entity ${entityId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get sync status: ${errorMessage}`);
    }
  }

  /**
   * Get the last synchronization timestamp of an entity
   * @param entityId ID of the entity
   * @returns Last synchronization timestamp or null if never synchronized
   */
  async getLastSyncTimestamp(entityId: string): Promise<number | null> {
    try {
      // Get entity from Firestore
      const entity = await this.firestoreService.getById(entityId);
      if (!entity) {
        throw new Error(`Entity ${entityId} not found`);
      }

      return entity.vectorTimestamp?.toMillis() || null;
    } catch (error) {
      console.error(`Error getting last sync timestamp for entity ${entityId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get last sync timestamp: ${errorMessage}`);
    }
  }

  /**
   * Extract text content from an entity for embedding generation
   * @param entity Entity to extract text from
   * @returns Text content
   */
  private extractTextContent(entity: any): string {
    // Extract text content based on entity type
    switch (this.entityType) {
      case EntityType.CHARACTER:
        return [
          entity.name,
          entity.description,
          entity.background,
          entity.personality,
          entity.appearance,
          entity.notes
        ].filter(Boolean).join(' ');

      case EntityType.LOCATION:
        return [
          entity.name,
          entity.description,
          entity.history,
          entity.notes
        ].filter(Boolean).join(' ');

      case EntityType.ITEM:
        return [
          entity.name,
          entity.description,
          entity.history,
          entity.notes
        ].filter(Boolean).join(' ');

      case EntityType.EVENT:
        return [
          entity.name,
          entity.description,
          entity.outcome,
          entity.notes
        ].filter(Boolean).join(' ');

      case EntityType.NOTE:
        return [
          entity.title,
          entity.content
        ].filter(Boolean).join(' ');

      default:
        return [
          entity.name,
          entity.description,
          entity.notes
        ].filter(Boolean).join(' ');
    }
  }
}
