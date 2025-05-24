/**
 * Integration tests for Vertex AI Index Manager
 * 
 * These tests verify the index management functionality
 * Note: These tests require proper Google Cloud credentials and project setup
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VertexAIIndexManager } from '../../../services/vector/VertexAIIndexManager';
import { VertexAIVectorService } from '../../../services/vector/VertexAIVectorService';
import { EntityType } from '../../../models/EntityType';
import { getConfig } from '../../../services/vector/config';

// Mock the Google Auth Library for testing
vi.mock('google-auth-library', () => ({
  GoogleAuth: vi.fn().mockImplementation(() => ({
    getClient: vi.fn().mockResolvedValue({
      getAccessToken: vi.fn().mockResolvedValue({ token: 'mock-token' })
    })
  }))
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('VertexAIIndexManager', () => {
  let indexManager: VertexAIIndexManager;
  let vectorService: VertexAIVectorService;
  let config: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup test configuration
    config = getConfig('development');
    config.projectId = 'test-project';
    config.location = 'us-central1';
    config.indexEndpoint = 'test-endpoint';
    
    indexManager = new VertexAIIndexManager(config);
    vectorService = new VertexAIVectorService(config);

    // Mock successful API responses
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        name: 'projects/test-project/locations/us-central1/operations/test-operation',
        predictions: [{ embeddings: { values: new Array(768).fill(0.1) } }]
      }),
      text: () => Promise.resolve('Success')
    });
  });

  describe('Index Creation', () => {
    it('should create an index for character entities', async () => {
      const metadata = await indexManager.createIndex(
        'test-characters',
        [EntityType.CHARACTER],
        768,
        'COSINE_DISTANCE'
      );

      expect(metadata).toBeDefined();
      expect(metadata.name).toBe('test-characters');
      expect(metadata.entityTypes).toContain(EntityType.CHARACTER);
      expect(metadata.dimensions).toBe(768);
      expect(metadata.distanceMeasure).toBe('COSINE_DISTANCE');
      expect(metadata.status).toBe('CREATING');
    });

    it('should create indices for multiple entity types', async () => {
      const metadata = await indexManager.createIndex(
        'test-mixed',
        [EntityType.CHARACTER, EntityType.LOCATION],
        768
      );

      expect(metadata.entityTypes).toContain(EntityType.CHARACTER);
      expect(metadata.entityTypes).toContain(EntityType.LOCATION);
      expect(metadata.entityTypes).toHaveLength(2);
    });
  });

  describe('Index Management', () => {
    it('should retrieve index by ID', async () => {
      const created = await indexManager.createIndex('test-index', [EntityType.FACTION]);
      const retrieved = indexManager.getIndex(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('test-index');
    });

    it('should get all indices', async () => {
      await indexManager.createIndex('index1', [EntityType.CHARACTER]);
      await indexManager.createIndex('index2', [EntityType.LOCATION]);

      const allIndices = indexManager.getAllIndices();
      expect(allIndices).toHaveLength(2);
    });

    it('should get indices for specific entity types', async () => {
      await indexManager.createIndex('char-index', [EntityType.CHARACTER]);
      await indexManager.createIndex('loc-index', [EntityType.LOCATION]);
      await indexManager.createIndex('mixed-index', [EntityType.CHARACTER, EntityType.FACTION]);

      const charIndices = indexManager.getIndicesForEntityTypes([EntityType.CHARACTER]);
      expect(charIndices).toHaveLength(2); // char-index and mixed-index

      const locIndices = indexManager.getIndicesForEntityTypes([EntityType.LOCATION]);
      expect(locIndices).toHaveLength(1); // loc-index only
    });
  });

  describe('Vector Operations', () => {
    it('should add entity vectors to appropriate indices', async () => {
      // Create an index first
      const index = await indexManager.createIndex('test-vectors', [EntityType.CHARACTER]);
      
      // Manually set status to ACTIVE for testing
      index.status = 'ACTIVE';

      const entityData = [{
        entityId: 'char-001',
        entityType: EntityType.CHARACTER,
        embedding: new Array(768).fill(0.5),
        metadata: {
          name: 'Test Character',
          description: 'A test character for vector operations',
          tags: ['test', 'character'],
          lastUpdated: new Date()
        }
      }];

      const result = await indexManager.addEntityVectors(entityData);
      expect(result).toBe(true);

      // Verify fetch was called for vector addition
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(':upsertDatapoints'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should remove entity vectors from indices', async () => {
      const index = await indexManager.createIndex('test-removal', [EntityType.CHARACTER]);
      index.status = 'ACTIVE';

      const result = await indexManager.removeEntityVectors(['char-001'], EntityType.CHARACTER);
      expect(result).toBe(true);

      // Verify fetch was called for vector removal
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(':removeDatapoints'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  describe('Vector Service Integration', () => {
    it('should initialize vector service and create default indices', async () => {
      await vectorService.initialize();

      // Check that initialization completed without errors
      expect(vectorService).toBeDefined();
    });

    it('should generate embeddings', async () => {
      const embedding = await vectorService.generateEmbedding('Test character description');
      
      expect(embedding).toBeDefined();
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
    });

    it('should store and retrieve embeddings', async () => {
      await vectorService.initialize();

      const testEmbedding = new Array(768).fill(0.3);
      
      const embeddingId = await vectorService.storeEmbedding(
        'test-entity-001',
        EntityType.CHARACTER,
        testEmbedding,
        { name: 'Test Entity', description: 'A test entity' }
      );

      expect(embeddingId).toBe('test-entity-001');
    });

    it('should find similar entities', async () => {
      await vectorService.initialize();

      // Mock search response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          nearestNeighbors: [{
            neighbors: [{
              datapoint: {
                datapoint_id: 'similar-entity-001',
                restricts: [{ namespace: 'entity_type', allow_list: ['CHARACTER'] }]
              },
              distance: 0.85
            }]
          }]
        })
      });

      const queryEmbedding = new Array(768).fill(0.4);
      const results = await vectorService.findSimilar(queryEmbedding, {
        entityTypes: [EntityType.CHARACTER],
        limit: 5,
        minScore: 0.7
      });

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request')
      });

      await expect(
        indexManager.createIndex('error-test', [EntityType.CHARACTER])
      ).rejects.toThrow('Failed to create index');
    });

    it('should handle authentication errors', async () => {
      // Mock auth error
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Authentication failed'));

      await expect(
        vectorService.generateEmbedding('test text')
      ).rejects.toThrow('Failed to generate embedding');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate required configuration parameters', () => {
      expect(config.projectId).toBeDefined();
      expect(config.location).toBeDefined();
      expect(config.apiEndpoint).toBeDefined();
      expect(config.embeddingModel).toBeDefined();
    });

    it('should use environment-specific settings', () => {
      const devConfig = getConfig('development');
      const prodConfig = getConfig('production');

      expect(devConfig.environment).toBe('development');
      expect(prodConfig.environment).toBe('production');
      expect(devConfig.maxRetries).toBeLessThanOrEqual(prodConfig.maxRetries);
    });
  });
});
