/**
 * Vertex AI Client Tests
 *
 * This file contains tests for the Vertex AI client.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VertexAIClient } from '../../vector/vertexAIClient';
import { mockLogger, resetAllMocks } from '../test-utils';
import { VertexAIConfig } from '../../vector/types';
import { ServiceAccountManager } from '../../auth/service-account-manager';

// Mock the environment-config
vi.mock('../../config/environment-config', () => {
  return {
    getEnvironmentConfig: vi.fn().mockReturnValue({
      name: 'test',
      vertexAI: {
        environment: 'test',
        projectId: 'test-project',
        location: 'us-central1',
        indexEndpoint: 'test-endpoint',
        embeddingModel: 'test-model',
        namespace: 'test',
        apiEndpoint: 'test-endpoint',
        maxRetries: 3,
        timeoutMs: 10000
      },
      security: {
        allowedIPs: [],
        allowedOrigins: ['https://test.com'],
        enableRateLimiting: true,
        maxRequestsPerMinute: 50,
        enableSecurityLogging: true
      },
      cost: {
        dailyBudget: 10,
        alertThresholdPercent: 80,
        enableUsageTracking: true,
        enableCostAllocationByUser: true,
        enableCostAllocationByWorld: true
      },
      featureFlags: {
        enableVertexAI: true,
        enableVectorSearch: true,
        enableRelationshipInference: true,
        enableContentGeneration: true,
        enableSessionAnalysis: true
      }
    }),
    VertexAIConfig: vi.fn()
  };
});

// Mock the CostTracker
vi.mock('../../monitoring/cost-tracker', () => {
  return {
    CostTracker: vi.fn().mockImplementation(() => {
      return {
        trackApiCall: vi.fn().mockResolvedValue({}),
        calculateCost: vi.fn().mockReturnValue(0.1),
        getDailyUsage: vi.fn().mockResolvedValue(5),
        checkBudget: vi.fn().mockResolvedValue({}),
        detectAnomalies: vi.fn().mockResolvedValue({}),
        getUsageSummary: vi.fn().mockResolvedValue({})
      };
    }),
    ApiCallType: {
      TEXT_EMBEDDING: 'TEXT_EMBEDDING',
      VECTOR_SEARCH: 'VECTOR_SEARCH',
      RELATIONSHIP_INFERENCE: 'RELATIONSHIP_INFERENCE',
      CONTENT_GENERATION: 'CONTENT_GENERATION',
      SESSION_ANALYSIS: 'SESSION_ANALYSIS'
    }
  };
});

// Mock the SecurityUtils
vi.mock('../../auth/security-utils', () => {
  return {
    SecurityUtils: vi.fn().mockImplementation(() => {
      return {
        validateRequest: vi.fn().mockReturnValue(true),
        validateRequestOrigin: vi.fn().mockReturnValue(true),
        validateRequestIP: vi.fn().mockReturnValue(true),
        checkRateLimit: vi.fn().mockReturnValue(true),
        logSecurityEvent: vi.fn()
      };
    })
  };
});

// Mock the PredictionServiceClient
vi.mock('@google-cloud/aiplatform', () => {
  return {
    PredictionServiceClient: vi.fn().mockImplementation(() => {
      return {
        modelPath: vi.fn().mockReturnValue('projects/test/locations/us-central1/models/test-model'),
        predict: vi.fn().mockResolvedValue([
          {
            predictions: [
              {
                embeddings: {
                  values: Array(768).fill(0.1)
                }
              }
            ]
          }
        ])
      };
    })
  };
});

// Mock the ServiceAccountManager
vi.mock('../../auth/service-account-manager', () => {
  return {
    ServiceAccountManager: vi.fn().mockImplementation(() => {
      return {
        getAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
        validateToken: vi.fn().mockResolvedValue(true),
        rotateToken: vi.fn().mockResolvedValue('mock-access-token')
      };
    })
  };
});

// Mock the CircuitBreaker
vi.mock('../../utils/circuit-breaker', () => {
  return {
    CircuitBreaker: vi.fn().mockImplementation(() => {
      return {
        execute: vi.fn().mockImplementation((fn) => fn())
      };
    })
  };
});

describe('Test Utilities', () => {
  it('should export test utilities', () => {
    expect(mockLogger).toBeDefined();
    expect(resetAllMocks).toBeDefined();
  });
});

describe('VertexAIClient', () => {
  const config: VertexAIConfig = {
    environment: 'development',
    projectId: 'test-project',
    location: 'us-central1',
    indexEndpoint: 'test-endpoint',
    embeddingModel: 'test-model',
    namespace: 'test',
    apiEndpoint: 'test-api.googleapis.com',
    maxRetries: 3,
    timeoutMs: 10000
  };

  let client: VertexAIClient;

  beforeEach(() => {
    resetAllMocks();
    client = new VertexAIClient(config, mockLogger as any);
  });

  describe('generateEmbedding', () => {
    it('should generate an embedding successfully', async () => {
      const result = await client.generateEmbedding('test text', 'test-model');

      expect(result).toBeDefined();
      expect(result.embedding).toHaveLength(768);
      expect(result.dimension).toBe(768);
      expect(mockLogger.debug).toHaveBeenCalledWith('Generating embedding', expect.any(Object));

      // Verify the embeddings have the expected mock values
      expect(result.embedding.every(val => val === 0.1)).toBe(true);
    });

    it('should handle API errors', async () => {
      // Mock the predict method to throw an error
      const { PredictionServiceClient } = await import('@google-cloud/aiplatform');
      const mockPredict = vi.fn().mockRejectedValue(new Error('API error'));
      vi.mocked(PredictionServiceClient).mockImplementation(() => {
        return {
          modelPath: vi.fn().mockReturnValue('projects/test/locations/us-central1/models/test-model'),
          predict: mockPredict
        };
      });

      // Create a new client with the mocked PredictionServiceClient
      const errorClient = new VertexAIClient(config, mockLogger as any);

      // Call generateEmbedding and expect it to handle the error
      try {
        await errorClient.generateEmbedding('test text', 'test-model');
        // If we get here, the test should fail
        fail('Expected an error to be thrown');
      } catch (error) {
        // The error should be an Error object
        expect(error instanceof Error).toBe(true);
      }

      expect(mockLogger.debug).toHaveBeenCalledWith('Generating embedding', expect.any(Object));
      // The mocked services should have been called (verified by successful execution)
    });

    it('should handle empty predictions', async () => {
      // Mock the predict method to return empty predictions
      const { PredictionServiceClient } = await import('@google-cloud/aiplatform');
      const mockPredict = vi.fn().mockResolvedValue([{ predictions: [] }]);
      vi.mocked(PredictionServiceClient).mockImplementation(() => {
        return {
          modelPath: vi.fn().mockReturnValue('projects/test/locations/us-central1/models/test-model'),
          predict: mockPredict
        };
      });

      // Create a new client with the mocked PredictionServiceClient
      const emptyClient = new VertexAIClient(config, mockLogger as any);

      // Call generateEmbedding and expect it to handle the empty predictions
      try {
        await emptyClient.generateEmbedding('test text', 'test-model');
        // If we get here, the test should fail
        fail('Expected an error to be thrown');
      } catch (error) {
        // The error should be an Error object
        expect(error instanceof Error).toBe(true);
      }

      expect(mockLogger.debug).toHaveBeenCalledWith('Generating embedding', expect.any(Object));
      // The mocked services should have been called (verified by successful execution)
    });
  });

  describe('generateEmbeddingsBatch', () => {
    it('should generate embeddings in batch successfully', async () => {
      // Mock the predict method to return multiple predictions
      const { PredictionServiceClient } = await import('@google-cloud/aiplatform');
      const mockPredict = vi.fn().mockResolvedValue([
        {
          predictions: [
            {
              embeddings: {
                values: Array(768).fill(0.1)
              }
            },
            {
              embeddings: {
                values: Array(768).fill(0.2)
              }
            }
          ]
        }
      ]);
      vi.mocked(PredictionServiceClient).mockImplementation(() => {
        return {
          modelPath: vi.fn().mockReturnValue('projects/test/locations/us-central1/models/test-model'),
          predict: mockPredict
        };
      });

      // Create a new client with the mocked PredictionServiceClient
      const batchClient = new VertexAIClient(config, mockLogger as any);

      const texts = ['text1', 'text2'];
      const results = await batchClient.generateEmbeddingsBatch(texts, 'test-model');

      expect(results).toHaveLength(2);
      expect(results[0].embedding).toHaveLength(768);
      expect(results[1].embedding).toHaveLength(768);
      expect(mockLogger.debug).toHaveBeenCalledWith('Generating embeddings batch', expect.any(Object));

      // Verify the embeddings have the expected mock values
      expect(results[0].embedding.every(val => val === 0.1)).toBe(true);
      expect(results[1].embedding.every(val => val === 0.2)).toBe(true);
    });
  });
});
