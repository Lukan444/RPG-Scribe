/**
 * Vertex AI Client Tests
 *
 * This file contains tests for the Vertex AI client.
 */

import { VertexAIClient } from '../../vector/vertexAIClient';
import { mockLogger, resetAllMocks } from '../test-utils';
import { VertexAIConfig } from '../../vector/types';
import { ServiceAccountManager } from '../../auth/service-account-manager';

// Mock the PredictionServiceClient
jest.mock('@google-cloud/aiplatform', () => {
  return {
    PredictionServiceClient: jest.fn().mockImplementation(() => {
      return {
        modelPath: jest.fn().mockReturnValue('projects/test/locations/us-central1/models/test-model'),
        predict: jest.fn().mockResolvedValue([
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
jest.mock('../../auth/service-account-manager', () => {
  return {
    ServiceAccountManager: jest.fn().mockImplementation(() => {
      return {
        getAccessToken: jest.fn().mockResolvedValue('mock-access-token'),
        validateToken: jest.fn().mockResolvedValue(true),
        rotateToken: jest.fn().mockResolvedValue('mock-access-token')
      };
    })
  };
});

// Mock the CircuitBreaker
jest.mock('../../utils/circuit-breaker', () => {
  return {
    CircuitBreaker: jest.fn().mockImplementation(() => {
      return {
        execute: jest.fn().mockImplementation((fn) => fn())
      };
    })
  };
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

      // Check that the ServiceAccountManager.getAccessToken was called
      expect(ServiceAccountManager.prototype.getAccessToken).toHaveBeenCalled();

      // Check that the execute method was called
      const circuitBreakerMock = require('../../utils/circuit-breaker').CircuitBreaker;
      expect(circuitBreakerMock.prototype.execute).toHaveBeenCalled();

      // Check that the PredictionServiceClient.predict was called with the right parameters
      const PredictionServiceClient = require('@google-cloud/aiplatform').PredictionServiceClient;
      expect(PredictionServiceClient.prototype.predict).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer mock-access-token'
          }
        })
      );
    });

    it('should handle API errors', async () => {
      // Mock the predict method to throw an error
      const { PredictionServiceClient } = require('@google-cloud/aiplatform');
      const mockPredict = jest.fn().mockRejectedValue(new Error('API error'));
      PredictionServiceClient.mockImplementation(() => {
        return {
          modelPath: jest.fn().mockReturnValue('projects/test/locations/us-central1/models/test-model'),
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
      expect(ServiceAccountManager.prototype.getAccessToken).toHaveBeenCalled();
      const circuitBreakerMock = require('../../utils/circuit-breaker').CircuitBreaker;
      expect(circuitBreakerMock.prototype.execute).toHaveBeenCalled();
    });

    it('should handle empty predictions', async () => {
      // Mock the predict method to return empty predictions
      const { PredictionServiceClient } = require('@google-cloud/aiplatform');
      const mockPredict = jest.fn().mockResolvedValue([{ predictions: [] }]);
      PredictionServiceClient.mockImplementation(() => {
        return {
          modelPath: jest.fn().mockReturnValue('projects/test/locations/us-central1/models/test-model'),
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
      expect(ServiceAccountManager.prototype.getAccessToken).toHaveBeenCalled();
      const circuitBreakerMock = require('../../utils/circuit-breaker').CircuitBreaker;
      expect(circuitBreakerMock.prototype.execute).toHaveBeenCalled();
    });
  });

  describe('generateEmbeddingsBatch', () => {
    it('should generate embeddings in batch successfully', async () => {
      // Mock the predict method to return multiple predictions
      const { PredictionServiceClient } = require('@google-cloud/aiplatform');
      const mockPredict = jest.fn().mockResolvedValue([
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
      PredictionServiceClient.mockImplementation(() => {
        return {
          modelPath: jest.fn().mockReturnValue('projects/test/locations/us-central1/models/test-model'),
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

      // Check that the ServiceAccountManager.getAccessToken was called
      expect(ServiceAccountManager.prototype.getAccessToken).toHaveBeenCalled();

      // Check that the execute method was called
      const circuitBreakerMock = require('../../utils/circuit-breaker').CircuitBreaker;
      expect(circuitBreakerMock.prototype.execute).toHaveBeenCalled();

      // Check that the PredictionServiceClient.predict was called with the right parameters
      expect(mockPredict).toHaveBeenCalledWith(
        expect.objectContaining({
          instances: expect.arrayContaining([
            { content: 'text1' },
            { content: 'text2' }
          ])
        }),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer mock-access-token'
          }
        })
      );
    });
  });
});
