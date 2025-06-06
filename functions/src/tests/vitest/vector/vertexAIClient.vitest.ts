/**
 * Tests for Vertex AI Client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VertexAIClient } from '../../../vector/vertexAIClient';
import { Logger } from '../../../utils/logging';
import { ServiceAccountManager } from '../../../auth/service-account-manager';
import { SecurityUtils, SecurityConfig } from '../../../auth/security-utils.ts';
import * as functions from 'firebase-functions';
import { VertexAIConfig } from '../../../config/environment-config.ts';

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
vi.mock('../../../auth/service-account-manager', () => {
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
vi.mock('../../../utils/circuit-breaker.ts', () => {
  return {
    CircuitBreaker: vi.fn().mockImplementation(() => {
      return {
        execute: vi.fn().mockImplementation((fn) => fn())
      };
    })
  };
});

// Mock the SecurityUtils
vi.mock('../../../auth/security-utils.ts', () => {
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

// Mock firebase-functions
vi.mock('firebase-functions', () => {
  return {
    https: {
      CallableContext: class CallableContext {
        auth: any;
        rawRequest: any;
        constructor(auth: any, rawRequest: any) {
          this.auth = auth;
          this.rawRequest = rawRequest;
        }
      }
    }
  };
});

// Mock the Logger
vi.mock('../../../utils/logging', () => {
  return {
    Logger: vi.fn().mockImplementation(() => {
      return {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        child: vi.fn().mockReturnThis()
      };
    })
  };
});

// Mock the environment-config
vi.mock('../../../config/environment-config.ts', () => {
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
vi.mock('../../../monitoring/cost-tracker.ts', () => {
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

describe('VertexAIClient', () => {
  let vertexAIClient: VertexAIClient;
  let mockLogger: Logger;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger = new Logger('test');
    vertexAIClient = new VertexAIClient(undefined, mockLogger);
  });

  describe('constructor', () => {
    it('should use environment config when no config is provided', () => {
      const client = new VertexAIClient();

      // Check that getEnvironmentConfig was called
      const getEnvironmentConfig = require('../../../config/environment-config.ts').getEnvironmentConfig;
      expect(getEnvironmentConfig).toHaveBeenCalled();

      // Check that the client was initialized with the environment config
      expect(client['config'].projectId).toBe('test-project');
      expect(client['config'].location).toBe('us-central1');
      expect(client['config'].embeddingModel).toBe('test-model');
    });

    it('should use provided config when available', () => {
      const customConfig: VertexAIConfig = {
        environment: 'custom',
        projectId: 'custom-project',
        location: 'custom-location',
        indexEndpoint: 'custom-endpoint',
        embeddingModel: 'custom-model',
        namespace: 'custom',
        apiEndpoint: 'custom-endpoint',
        maxRetries: 5,
        timeoutMs: 20000
      };

      const client = new VertexAIClient(customConfig, mockLogger);

      // Check that the client was initialized with the custom config
      expect(client['config'].projectId).toBe('custom-project');
      expect(client['config'].location).toBe('custom-location');
      expect(client['config'].embeddingModel).toBe('custom-model');
    });

    it('should use environment security config when no security config is provided', () => {
      const client = new VertexAIClient();

      // Check that SecurityUtils was initialized with the environment security config
      const SecurityUtils = require('../../../auth/security-utils.ts').SecurityUtils;
      expect(SecurityUtils).toHaveBeenCalledWith(
        expect.objectContaining({
          allowedOrigins: ['https://test.com'],
          enableRateLimiting: true,
          maxRequestsPerMinute: 50
        }),
        expect.anything()
      );
    });

    it('should use provided security config when available', () => {
      const customSecurityConfig: SecurityConfig = {
        allowedIPs: ['192.168.1.1'],
        allowedOrigins: ['https://custom.com'],
        enableRateLimiting: false,
        maxRequestsPerMinute: 100,
        enableSecurityLogging: false
      };

      const client = new VertexAIClient(undefined, mockLogger, customSecurityConfig);

      // Check that SecurityUtils was initialized with the custom security config
      const SecurityUtils = require('../../../auth/security-utils.ts').SecurityUtils;
      expect(SecurityUtils).toHaveBeenCalledWith(
        customSecurityConfig,
        expect.anything()
      );
    });
  });

  describe('validateRequest', () => {
    it('should validate requests using SecurityUtils', () => {
      const mockContext = new functions.https.CallableContext(
        { uid: 'test-user' },
        {
          headers: { origin: 'https://example.com' },
          ip: '192.168.1.1'
        }
      );

      vertexAIClient.validateRequest(mockContext, 'test-user');

      // Check that SecurityUtils.validateRequest was called
      const SecurityUtils = require('../../../auth/security-utils.ts').SecurityUtils;
      expect(SecurityUtils.prototype.validateRequest).toHaveBeenCalledWith(mockContext, 'test-user');
    });
  });

  describe('generateEmbedding', () => {
    it('should generate an embedding successfully', async () => {
      const result = await vertexAIClient.generateEmbedding('test text', 'test-model');

      expect(result).toBeDefined();
      expect(result.embedding).toHaveLength(768);
      expect(result.dimension).toBe(768);
      expect(mockLogger.debug).toHaveBeenCalledWith('Generating embedding', expect.any(Object));

      // Check that the ServiceAccountManager.getAccessToken was called
      expect(ServiceAccountManager.prototype.getAccessToken).toHaveBeenCalled();

      // Check that the CircuitBreaker.execute was called
      const circuitBreakerMock = require('../../../utils/circuit-breaker.ts').CircuitBreaker;
      expect(circuitBreakerMock.prototype.execute).toHaveBeenCalled();

      // Check that the PredictionServiceClient.predict was called with the right parameters
      const PredictionServiceClient = require('@google-cloud/aiplatform').PredictionServiceClient;
      expect(PredictionServiceClient.prototype.predict).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          otherArgs: {
            headers: {
              Authorization: 'Bearer mock-access-token'
            }
          }
        })
      );
    });

    it('should validate request when context is provided', async () => {
      const mockContext = new functions.https.CallableContext(
        { uid: 'test-user' },
        {
          headers: { origin: 'https://example.com' },
          ip: '192.168.1.1'
        }
      );

      // Spy on validateRequest
      const spy = vi.spyOn(vertexAIClient, 'validateRequest');

      await vertexAIClient.generateEmbedding('test text', 'test-model', mockContext, 'test-user');

      expect(spy).toHaveBeenCalledWith(mockContext, 'test-user');
    });

    it('should throw error when request validation fails', async () => {
      const mockContext = new functions.https.CallableContext(
        { uid: 'test-user' },
        {
          headers: { origin: 'https://example.com' },
          ip: '192.168.1.1'
        }
      );

      // Mock validateRequest to return false
      vi.spyOn(vertexAIClient, 'validateRequest').mockReturnValue(false);

      try {
        await vertexAIClient.generateEmbedding('test text', 'test-model', mockContext, 'test-user');
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBe('Request validation failed');
        expect(error.code).toBe(403);
      }
    });

    it('should handle API errors', async () => {
      // Mock the predict method to throw an error
      const { PredictionServiceClient } = require('@google-cloud/aiplatform');
      const mockPredict = vi.fn().mockRejectedValue(new Error('API error'));
      PredictionServiceClient.mockImplementation(() => {
        return {
          modelPath: vi.fn().mockReturnValue('projects/test/locations/us-central1/models/test-model'),
          predict: mockPredict
        };
      });

      // Create a new client with the mocked PredictionServiceClient
      const errorClient = new VertexAIClient(undefined, mockLogger as any);

      // Call generateEmbedding and expect it to handle the error
      try {
        await errorClient.generateEmbedding('test text', 'test-model');
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        // The error should be an Error object
        expect(error instanceof Error).toBe(true);
      }

      expect(mockLogger.debug).toHaveBeenCalledWith('Generating embedding', expect.any(Object));
      expect(ServiceAccountManager.prototype.getAccessToken).toHaveBeenCalled();
      const circuitBreakerMock = require('../../../utils/circuit-breaker.ts').CircuitBreaker;
      expect(circuitBreakerMock.prototype.execute).toHaveBeenCalled();
    });
  });

  describe('cost tracking', () => {
    it('should track API call for embedding generation', async () => {
      await vertexAIClient.generateEmbedding('test text', 'test-model', undefined, 'test-user');

      // Check that the CostTracker.trackApiCall was called
      const CostTracker = require('../../../monitoring/cost-tracker.ts').CostTracker;
      const ApiCallType = require('../../../monitoring/cost-tracker.ts').ApiCallType;

      expect(CostTracker.prototype.trackApiCall).toHaveBeenCalledWith(
        ApiCallType.TEXT_EMBEDDING,
        9, // Length of 'test text'
        'test-user',
        undefined,
        expect.objectContaining({
          model: 'test-model'
        })
      );
    });

    it('should track API call for batch embedding generation', async () => {
      await vertexAIClient.generateEmbeddingsBatch(['text1', 'text2'], 'test-model', undefined, 'test-user');

      // Check that the CostTracker.trackApiCall was called
      const CostTracker = require('../../../monitoring/cost-tracker.ts').CostTracker;
      const ApiCallType = require('../../../monitoring/cost-tracker.ts').ApiCallType;

      expect(CostTracker.prototype.trackApiCall).toHaveBeenCalledWith(
        ApiCallType.TEXT_EMBEDDING,
        10, // Total length of 'text1' and 'text2'
        'test-user',
        undefined,
        expect.objectContaining({
          model: 'test-model',
          batchSize: 2
        })
      );
    });
  });

  describe('generateEmbeddingsBatch', () => {
    it('should generate embeddings in batch successfully', async () => {
      // Mock the predict method to return multiple predictions
      const { PredictionServiceClient } = require('@google-cloud/aiplatform');
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
      PredictionServiceClient.mockImplementation(() => {
        return {
          modelPath: vi.fn().mockReturnValue('projects/test/locations/us-central1/models/test-model'),
          predict: mockPredict
        };
      });

      // Create a new client with the mocked PredictionServiceClient
      const batchClient = new VertexAIClient(undefined, mockLogger as any);

      const texts = ['text1', 'text2'];
      const results = await batchClient.generateEmbeddingsBatch(texts, 'test-model');

      expect(results).toHaveLength(2);
      expect(results[0].embedding).toHaveLength(768);
      expect(results[1].embedding).toHaveLength(768);
      expect(mockLogger.debug).toHaveBeenCalledWith('Generating embeddings batch', expect.any(Object));

      // Check that the ServiceAccountManager.getAccessToken was called
      expect(ServiceAccountManager.prototype.getAccessToken).toHaveBeenCalled();

      // Check that the CircuitBreaker.execute was called
      const circuitBreakerMock = require('../../../utils/circuit-breaker.ts').CircuitBreaker;
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
          otherArgs: {
            headers: {
              Authorization: 'Bearer mock-access-token'
            }
          }
        })
      );
    });

    it('should validate request when context is provided', async () => {
      const mockContext = new functions.https.CallableContext(
        { uid: 'test-user' },
        {
          headers: { origin: 'https://example.com' },
          ip: '192.168.1.1'
        }
      );

      // Spy on validateRequest
      const spy = vi.spyOn(vertexAIClient, 'validateRequest');

      await vertexAIClient.generateEmbeddingsBatch(['text1', 'text2'], 'test-model', mockContext, 'test-user');

      expect(spy).toHaveBeenCalledWith(mockContext, 'test-user');
    });

    it('should throw error when request validation fails', async () => {
      const mockContext = new functions.https.CallableContext(
        { uid: 'test-user' },
        {
          headers: { origin: 'https://example.com' },
          ip: '192.168.1.1'
        }
      );

      // Mock validateRequest to return false
      vi.spyOn(vertexAIClient, 'validateRequest').mockReturnValue(false);

      try {
        await vertexAIClient.generateEmbeddingsBatch(['text1', 'text2'], 'test-model', mockContext, 'test-user');
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBe('Request validation failed');
        expect(error.code).toBe(403);
      }
    });
  });
});
