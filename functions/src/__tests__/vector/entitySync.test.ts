/**
 * Entity Synchronization Tests
 *
 * This file contains tests for the entity synchronization functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncEntity, syncEntitiesBatch, getSyncStatus } from '../../vector/entitySync';
import { EntityType } from '../../vector/types';
import { mockLogger, createMockFirestore, createMockVertexAIClient, resetAllMocks } from '../test-utils';
import { AppError } from '../../utils/error-handling';

// Mock UUID
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('test-uuid')
}));

// Mock Firebase Admin
vi.mock('firebase-admin', () => {
  return {
    firestore: {
      FieldValue: {
        serverTimestamp: vi.fn().mockReturnValue('server-timestamp')
      }
    }
  };
});

describe('Entity Synchronization', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('syncEntity', () => {
    it('should synchronize an entity successfully', async () => {
      const mockDb = createMockFirestore();
      const mockVertexClient = createMockVertexAIClient();

      const entityId = 'test-entity';
      const entityType = EntityType.CHARACTER;
      const entityData = {
        name: 'Test Character',
        description: 'Test Description',
        background: 'Test Background'
      };

      const result = await syncEntity(
        entityId,
        entityType,
        entityData,
        mockDb as any,
        mockVertexClient as any,
        mockLogger as any
      );

      expect(mockDb.mockCollection).toHaveBeenCalledWith('characters');
      expect(mockDb.mockDoc).toHaveBeenCalledWith('test-entity');
      expect(mockDb.mockUpdate).toHaveBeenCalledTimes(2);
      expect(mockVertexClient.generateEmbedding).toHaveBeenCalled();

      expect(result).toEqual({
        entityId: 'test-entity',
        entityType: EntityType.CHARACTER,
        success: true,
        embeddingId: 'test-uuid',
        timestamp: expect.any(Number)
      });
    });

    it('should handle entities with no text content', async () => {
      const mockDb = createMockFirestore();
      const mockVertexClient = createMockVertexAIClient();

      const entityId = 'test-entity';
      const entityType = EntityType.CHARACTER;
      const entityData = {
        // No text content
      };

      const result = await syncEntity(
        entityId,
        entityType,
        entityData,
        mockDb as any,
        mockVertexClient as any,
        mockLogger as any
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Entity has no text content');
      expect(mockDb.mockUpdate).toHaveBeenCalledWith({
        vectorStatus: 'FAILED',
        vectorError: 'Entity has no text content',
        vectorTimestamp: 'server-timestamp'
      });
    });

    it('should skip synchronization if already synchronized and force is false', async () => {
      const mockDb = createMockFirestore();
      const mockVertexClient = createMockVertexAIClient();

      const entityId = 'test-entity';
      const entityType = EntityType.CHARACTER;
      const entityData = {
        name: 'Test Character',
        description: 'Test Description',
        vectorStatus: 'COMPLETED',
        vectorId: 'existing-uuid',
        vectorTimestamp: { toMillis: () => Date.now() }
      };

      const result = await syncEntity(
        entityId,
        entityType,
        entityData,
        mockDb as any,
        mockVertexClient as any,
        mockLogger as any,
        false // force = false
      );

      expect(result.success).toBe(true);
      expect(result.embeddingId).toBe('existing-uuid');
      expect(mockDb.mockUpdate).not.toHaveBeenCalled();
      expect(mockVertexClient.generateEmbedding).not.toHaveBeenCalled();
    });

    it('should force synchronization if force is true', async () => {
      const mockDb = createMockFirestore();
      const mockVertexClient = createMockVertexAIClient();

      const entityId = 'test-entity';
      const entityType = EntityType.CHARACTER;
      const entityData = {
        name: 'Test Character',
        description: 'Test Description',
        vectorStatus: 'COMPLETED',
        vectorId: 'existing-uuid',
        vectorTimestamp: { toMillis: () => Date.now() }
      };

      const result = await syncEntity(
        entityId,
        entityType,
        entityData,
        mockDb as any,
        mockVertexClient as any,
        mockLogger as any,
        true // force = true
      );

      expect(result.success).toBe(true);
      expect(result.embeddingId).toBe('test-uuid'); // New UUID
      expect(mockDb.mockUpdate).toHaveBeenCalledTimes(2);
      expect(mockVertexClient.generateEmbedding).toHaveBeenCalled();
    });

    it('should handle embedding generation errors', async () => {
      const mockDb = createMockFirestore();
      const mockVertexClient = {
        generateEmbedding: vi.fn().mockRejectedValue(new Error('Embedding generation failed'))
      };

      const entityId = 'test-entity';
      const entityType = EntityType.CHARACTER;
      const entityData = {
        name: 'Test Character',
        description: 'Test Description'
      };

      const result = await syncEntity(
        entityId,
        entityType,
        entityData,
        mockDb as any,
        mockVertexClient as any,
        mockLogger as any
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Embedding generation failed');
      expect(mockDb.mockUpdate).toHaveBeenCalledWith({
        vectorStatus: 'FAILED',
        vectorError: 'Embedding generation failed',
        vectorTimestamp: 'server-timestamp'
      });
    });
  });

  describe('syncEntitiesBatch', () => {
    it('should synchronize multiple entities in batch', async () => {
      const mockDb = createMockFirestore();
      const mockVertexClient = createMockVertexAIClient();

      const entities = [
        {
          id: 'entity1',
          type: EntityType.CHARACTER,
          name: 'Character 1',
          description: 'Description 1'
        },
        {
          id: 'entity2',
          type: EntityType.LOCATION,
          name: 'Location 1',
          description: 'Description 2'
        }
      ];

      const results = await syncEntitiesBatch(
        entities as any,
        mockDb as any,
        mockVertexClient as any,
        mockLogger as any
      );

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(mockDb.mockCollection).toHaveBeenCalledTimes(2); // 2 entities x 1 call per entity
      expect(mockVertexClient.generateEmbedding).toHaveBeenCalledTimes(2);
    });

    it('should handle errors for individual entities', async () => {
      const mockDb = createMockFirestore();
      const mockVertexClient = {
        generateEmbedding: vi.fn()
          .mockResolvedValueOnce({
            embedding: Array(768).fill(0.1),
            dimension: 768
          })
          .mockRejectedValueOnce(new Error('Embedding generation failed'))
      };

      const entities = [
        {
          id: 'entity1',
          type: EntityType.CHARACTER,
          name: 'Character 1',
          description: 'Description 1'
        },
        {
          id: 'entity2',
          type: EntityType.LOCATION,
          name: 'Location 1',
          description: 'Description 2'
        }
      ];

      const results = await syncEntitiesBatch(
        entities as any,
        mockDb as any,
        mockVertexClient as any,
        mockLogger as any
      );

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Embedding generation failed');
    });
  });

  describe('getSyncStatus', () => {
    it('should get the synchronization status of an entity', async () => {
      const mockDb = createMockFirestore();

      const entityId = 'test-entity';
      const entityType = EntityType.CHARACTER;

      // Mock the document data
      mockDb.mockDoc().get = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          vectorStatus: 'COMPLETED',
          vectorId: 'test-uuid',
          vectorTimestamp: { toMillis: () => 1234567890 },
          vectorError: null
        })
      });

      const status = await getSyncStatus(
        entityId,
        entityType,
        mockDb as any,
        mockLogger as any
      );

      expect(status).toEqual({
        entityId: 'test-entity',
        entityType: EntityType.CHARACTER,
        status: 'COMPLETED',
        embeddingId: 'test-uuid',
        error: null,
        timestamp: 1234567890
      });
    });

    it('should handle non-existent entities', async () => {
      const mockDb = createMockFirestore();

      const entityId = 'non-existent';
      const entityType = EntityType.CHARACTER;

      // Mock the document data
      mockDb.mockDoc().get = vi.fn().mockResolvedValue({
        exists: false
      });

      await expect(getSyncStatus(
        entityId,
        entityType,
        mockDb as any,
        mockLogger as any
      )).rejects.toThrow(AppError);
    });
  });
});
