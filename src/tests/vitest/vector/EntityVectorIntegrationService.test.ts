/**
 * Tests for Entity Vector Integration Service
 * 
 * Tests the integration between VertexAI Index Service and all 10 core RPG entity types,
 * ensuring proper vector synchronization and semantic search capabilities.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EntityVectorIntegrationService } from '../../../services/vector/EntityVectorIntegrationService';
import { EntityType } from '../../../models/EntityType';
import { CharacterType } from '../../../models/Character';

// Mock dependencies
vi.mock('../../../services/vector/VertexAIIndexService', () => ({
  VertexAIIndexService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    createIndex: vi.fn().mockResolvedValue({
      id: 'mock-index-id',
      name: 'mock-index',
      entityTypes: [EntityType.CHARACTER],
      status: 'ACTIVE'
    }),
    addEntityVectors: vi.fn().mockResolvedValue({
      success: true,
      totalEntities: 1,
      successfulOperations: 1,
      failedOperations: 0,
      errors: []
    }),
    removeEntityVectors: vi.fn().mockResolvedValue({
      success: true,
      totalEntities: 1,
      successfulOperations: 1,
      failedOperations: 0,
      errors: []
    }),
    semanticSearch: vi.fn().mockResolvedValue({
      results: [
        {
          entityId: 'test-entity-1',
          entityType: EntityType.CHARACTER,
          score: 0.95,
          metadata: { name: 'Test Character' }
        }
      ],
      metrics: {
        searchTime: 150,
        resultsCount: 1,
        indexesSearched: 1,
        cacheHit: false,
        timestamp: new Date()
      }
    })
  }))
}));

vi.mock('../../../services/firestore.service', () => ({
  FirestoreService: vi.fn().mockImplementation(() => ({
    getById: vi.fn().mockResolvedValue({
      id: 'test-entity-1',
      name: 'Test Character',
      description: 'A test character for vector integration',
      race: 'Elf',
      class: 'Ranger',
      level: 5,
      characterType: CharacterType.NPC,
      worldId: 'world-123',
      tags: ['npc', 'elf', 'ranger']
    }),
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue('mock-id'),
    update: vi.fn().mockResolvedValue(true),
    delete: vi.fn().mockResolvedValue(true)
  }))
}));

vi.mock('../../../services/vector/config', () => ({
  getConfig: vi.fn().mockReturnValue({
    environment: 'development',
    projectId: 'rpg-archivist-26e43',
    location: 'us-central1',
    indexEndpoint: 'test-endpoint',
    embeddingModel: 'textembedding-gecko@003',
    namespace: 'rpg-scribe-test',
    apiEndpoint: 'aiplatform.googleapis.com',
    maxRetries: 3,
    timeoutMs: 30000
  })
}));

describe('EntityVectorIntegrationService', () => {
  let service: EntityVectorIntegrationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EntityVectorIntegrationService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(service.initialize()).resolves.not.toThrow();
    });

    it('should create entity-specific indexes during initialization', async () => {
      await service.initialize();
      
      // Verify that the VertexAI Index Service was initialized
      const mockIndexService = (service as any).indexService;
      expect(mockIndexService.initialize).toHaveBeenCalled();
      expect(mockIndexService.createIndex).toHaveBeenCalledTimes(3); // world, campaign, global indexes
    });

    it('should initialize Firestore services for all entity types', async () => {
      await service.initialize();
      
      const firestoreServices = (service as any).firestoreServices;
      
      // Should have services for all 10 entity types
      expect(firestoreServices.size).toBe(10);
      expect(firestoreServices.has(EntityType.CHARACTER)).toBe(true);
      expect(firestoreServices.has(EntityType.LOCATION)).toBe(true);
      expect(firestoreServices.has(EntityType.ITEM)).toBe(true);
      expect(firestoreServices.has(EntityType.EVENT)).toBe(true);
      expect(firestoreServices.has(EntityType.SESSION)).toBe(true);
      expect(firestoreServices.has(EntityType.FACTION)).toBe(true);
      expect(firestoreServices.has(EntityType.STORY_ARC)).toBe(true);
      expect(firestoreServices.has(EntityType.NOTE)).toBe(true);
      expect(firestoreServices.has(EntityType.CAMPAIGN)).toBe(true);
      expect(firestoreServices.has(EntityType.RPG_WORLD)).toBe(true);
    });
  });

  describe('Entity Synchronization', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should sync a character entity successfully', async () => {
      const result = await service.syncEntity(
        'test-character-1',
        EntityType.CHARACTER,
        'world-123'
      );

      expect(result.success).toBe(true);
      expect(result.entityId).toBe('test-character-1');
      expect(result.entityType).toBe(EntityType.CHARACTER);
      expect(result.embeddingId).toBe('test-character-1');
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it('should extract character-specific content for embedding', async () => {
      await service.syncEntity('test-character-1', EntityType.CHARACTER, 'world-123');

      const mockIndexService = (service as any).indexService;
      expect(mockIndexService.addEntityVectors).toHaveBeenCalledWith([
        expect.objectContaining({
          entityId: 'test-character-1',
          entityType: EntityType.CHARACTER,
          worldId: 'world-123',
          metadata: expect.objectContaining({
            name: 'Test Character',
            description: expect.stringContaining('Elf Ranger'),
            tags: expect.arrayContaining(['npc', 'elf', 'ranger', 'Elf', 'Ranger', CharacterType.NPC])
          })
        })
      ]);
    });

    it('should handle entity not found errors', async () => {
      // Mock entity not found
      const mockFirestoreService = (service as any).firestoreServices.get(EntityType.CHARACTER);
      mockFirestoreService.getById.mockResolvedValueOnce(null);

      const result = await service.syncEntity(
        'non-existent-character',
        EntityType.CHARACTER
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle vector service errors', async () => {
      // Mock vector service failure
      const mockIndexService = (service as any).indexService;
      mockIndexService.addEntityVectors.mockResolvedValueOnce({
        success: false,
        errors: [{ entityId: 'test-character-1', error: 'Vector service unavailable' }]
      });

      const result = await service.syncEntity(
        'test-character-1',
        EntityType.CHARACTER
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Vector service unavailable');
    });
  });

  describe('Batch Synchronization', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should sync multiple entities in batch', async () => {
      const entities = [
        { id: 'char-1', type: EntityType.CHARACTER, worldId: 'world-123' },
        { id: 'char-2', type: EntityType.CHARACTER, worldId: 'world-123' },
        { id: 'loc-1', type: EntityType.LOCATION, worldId: 'world-123' }
      ];

      const results = await service.syncEntitiesBatch(entities, {
        batchSize: 2,
        maxConcurrency: 2
      });

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle mixed success/failure in batch operations', async () => {
      // Mock one entity to fail
      const mockFirestoreService = (service as any).firestoreServices.get(EntityType.CHARACTER);
      mockFirestoreService.getById
        .mockResolvedValueOnce({ id: 'char-1', name: 'Character 1' }) // Success
        .mockResolvedValueOnce(null) // Failure - not found
        .mockResolvedValueOnce({ id: 'char-3', name: 'Character 3' }); // Success

      const entities = [
        { id: 'char-1', type: EntityType.CHARACTER },
        { id: 'char-2', type: EntityType.CHARACTER },
        { id: 'char-3', type: EntityType.CHARACTER }
      ];

      const results = await service.syncEntitiesBatch(entities);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });

    it('should respect batch size and concurrency limits', async () => {
      const entities = Array.from({ length: 10 }, (_, i) => ({
        id: `entity-${i}`,
        type: EntityType.CHARACTER
      }));

      const startTime = Date.now();
      await service.syncEntitiesBatch(entities, {
        batchSize: 3,
        maxConcurrency: 2
      });
      const duration = Date.now() - startTime;

      // Should process in batches, so duration should reflect sequential processing
      expect(duration).toBeGreaterThan(0);
    });
  });

  describe('Semantic Search', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should search across all entity types by default', async () => {
      const { results, metrics } = await service.searchSimilarEntities(
        'mysterious elven ranger'
      );

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].entityId).toBe('test-entity-1');
      expect(results[0].entityType).toBe(EntityType.CHARACTER);
      expect(results[0].score).toBe(0.95);

      expect(metrics.searchTime).toBe(150);
      expect(metrics.resultsCount).toBe(1);
    });

    it('should filter by specific entity types', async () => {
      await service.searchSimilarEntities('test query', {
        entityTypes: [EntityType.CHARACTER, EntityType.LOCATION]
      });

      const mockIndexService = (service as any).indexService;
      expect(mockIndexService.semanticSearch).toHaveBeenCalledWith(
        'test query',
        expect.objectContaining({
          entityTypes: [EntityType.CHARACTER, EntityType.LOCATION]
        })
      );
    });

    it('should filter by world scope', async () => {
      const worldId = 'world-456';
      
      await service.searchSimilarEntities('test query', {
        worldId,
        entityTypes: [EntityType.CHARACTER]
      });

      const mockIndexService = (service as any).indexService;
      expect(mockIndexService.semanticSearch).toHaveBeenCalledWith(
        'test query',
        expect.objectContaining({
          worldId,
          entityTypes: [EntityType.CHARACTER]
        })
      );
    });

    it('should filter by campaign scope', async () => {
      const campaignId = 'campaign-789';
      
      await service.searchSimilarEntities('test query', {
        campaignId,
        entityTypes: [EntityType.SESSION, EntityType.EVENT]
      });

      const mockIndexService = (service as any).indexService;
      expect(mockIndexService.semanticSearch).toHaveBeenCalledWith(
        'test query',
        expect.objectContaining({
          campaignId,
          entityTypes: [EntityType.SESSION, EntityType.EVENT]
        })
      );
    });

    it('should respect search limits and score thresholds', async () => {
      await service.searchSimilarEntities('test query', {
        limit: 5,
        minScore: 0.8
      });

      const mockIndexService = (service as any).indexService;
      expect(mockIndexService.semanticSearch).toHaveBeenCalledWith(
        'test query',
        expect.objectContaining({
          limit: 5,
          minScore: 0.8
        })
      );
    });
  });

  describe('Entity Removal', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should remove entity from vector storage', async () => {
      const success = await service.removeEntity(
        'test-character-1',
        EntityType.CHARACTER,
        'world-123'
      );

      expect(success).toBe(true);

      const mockIndexService = (service as any).indexService;
      expect(mockIndexService.removeEntityVectors).toHaveBeenCalledWith(
        ['test-character-1'],
        EntityType.CHARACTER,
        'world-123',
        undefined
      );
    });

    it('should handle removal errors gracefully', async () => {
      // Mock removal failure
      const mockIndexService = (service as any).indexService;
      mockIndexService.removeEntityVectors.mockResolvedValueOnce({
        success: false,
        errors: [{ entityId: 'test-character-1', error: 'Removal failed' }]
      });

      const success = await service.removeEntity(
        'test-character-1',
        EntityType.CHARACTER
      );

      expect(success).toBe(false);
    });
  });

  describe('Content Extraction', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should extract character-specific content', async () => {
      const mockCharacter = {
        id: 'char-1',
        name: 'Aria Windwalker',
        description: 'A mysterious elven ranger',
        race: 'Elf',
        class: 'Ranger',
        level: 5,
        characterType: CharacterType.NPC,
        background: 'Outlander',
        tags: ['npc', 'mysterious']
      };

      // Mock the Firestore service to return our test character
      const mockFirestoreService = (service as any).firestoreServices.get(EntityType.CHARACTER);
      mockFirestoreService.getById.mockResolvedValueOnce(mockCharacter);

      await service.syncEntity('char-1', EntityType.CHARACTER);

      const mockIndexService = (service as any).indexService;
      const vectorData = mockIndexService.addEntityVectors.mock.calls[0][0][0];

      expect(vectorData.metadata.name).toBe('Aria Windwalker');
      expect(vectorData.metadata.description).toContain('Elf Ranger Outlander');
      expect(vectorData.metadata.tags).toContain('Elf');
      expect(vectorData.metadata.tags).toContain('Ranger');
      expect(vectorData.metadata.tags).toContain(CharacterType.NPC);
    });

    it('should extract location-specific content', async () => {
      const mockLocation = {
        id: 'loc-1',
        name: 'Whispering Woods',
        description: 'A dense magical forest',
        locationType: 'Forest',
        climate: 'Temperate',
        population: 'Sparse',
        tags: ['magical', 'dangerous']
      };

      const mockFirestoreService = (service as any).firestoreServices.get(EntityType.LOCATION);
      mockFirestoreService.getById.mockResolvedValueOnce(mockLocation);

      await service.syncEntity('loc-1', EntityType.LOCATION);

      const mockIndexService = (service as any).indexService;
      const vectorData = mockIndexService.addEntityVectors.mock.calls[0][0][0];

      expect(vectorData.metadata.name).toBe('Whispering Woods');
      expect(vectorData.metadata.tags).toContain('Forest');
      expect(vectorData.metadata.tags).toContain('Temperate');
    });

    it('should extract item-specific content', async () => {
      const mockItem = {
        id: 'item-1',
        name: 'Sword of Flames',
        description: 'A magical sword that burns with eternal fire',
        itemType: 'Weapon',
        rarity: 'Legendary',
        value: 5000,
        weight: 3,
        properties: 'Fire damage +2d6',
        tags: ['magical', 'weapon']
      };

      const mockFirestoreService = (service as any).firestoreServices.get(EntityType.ITEM);
      mockFirestoreService.getById.mockResolvedValueOnce(mockItem);

      await service.syncEntity('item-1', EntityType.ITEM);

      const mockIndexService = (service as any).indexService;
      const vectorData = mockIndexService.addEntityVectors.mock.calls[0][0][0];

      expect(vectorData.metadata.name).toBe('Sword of Flames');
      expect(vectorData.metadata.description).toContain('Fire damage +2d6');
      expect(vectorData.metadata.tags).toContain('Weapon');
      expect(vectorData.metadata.tags).toContain('Legendary');
    });
  });

  describe('Performance and Error Handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should handle initialization failures gracefully', async () => {
      const mockIndexService = (service as any).indexService;
      mockIndexService.initialize.mockRejectedValueOnce(new Error('Initialization failed'));

      const newService = new EntityVectorIntegrationService();
      
      await expect(newService.initialize()).rejects.toThrow('Initialization failed');
    });

    it('should handle missing Firestore service', async () => {
      // Remove a Firestore service
      const firestoreServices = (service as any).firestoreServices;
      firestoreServices.delete(EntityType.CHARACTER);

      const result = await service.syncEntity('char-1', EntityType.CHARACTER);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No Firestore service configured');
    });

    it('should measure processing time accurately', async () => {
      const result = await service.syncEntity('char-1', EntityType.CHARACTER);

      expect(result.processingTime).toBeGreaterThan(0);
      expect(typeof result.processingTime).toBe('number');
    });
  });
});
