/**
 * Tests for Environment Configuration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getCurrentEnvironment, 
  getEnvironmentConfig, 
  getSecureCredential, 
  setSecureCredential 
} from '../../../config/environment-config';
import { AppError } from '../../../utils/error-handling';

// Mock firebase-functions
vi.mock('firebase-functions', () => {
  return {
    config: vi.fn().mockReturnValue({
      environment: {
        name: 'test'
      },
      vertex_ai: {
        project_id: 'test-project',
        location: 'test-location',
        embedding_model: 'test-model'
      },
      security: {
        allowed_origins: 'https://test.com,https://test2.com',
        enable_rate_limiting: 'true',
        max_requests_per_minute: '42'
      },
      feature_flags: {
        enable_vertex_ai: 'true',
        enable_vector_search: 'false'
      }
    })
  };
});

// Mock firebase-admin
vi.mock('firebase-admin', () => {
  return {
    firestore: vi.fn().mockReturnValue({
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: vi.fn().mockReturnValue({
              testKey: 'testValue'
            })
          }),
          set: vi.fn().mockResolvedValue({})
        })
      })
    })
  };
});

// Mock the Logger class
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

describe('Environment Configuration', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('getCurrentEnvironment', () => {
    it('should return NODE_ENV if set', () => {
      process.env.NODE_ENV = 'production';
      expect(getCurrentEnvironment()).toBe('production');
    });

    it('should return environment from functions.config() if NODE_ENV is not set', () => {
      process.env.NODE_ENV = '';
      expect(getCurrentEnvironment()).toBe('test');
    });

    it('should return "development" as default if no environment is set', () => {
      process.env.NODE_ENV = '';
      const functionsConfig = require('firebase-functions').config;
      functionsConfig.mockReturnValueOnce({});
      expect(getCurrentEnvironment()).toBe('development');
    });
  });

  describe('getEnvironmentConfig', () => {
    it('should return config for the current environment', () => {
      process.env.NODE_ENV = 'test';
      const config = getEnvironmentConfig();
      expect(config.name).toBe('test');
      expect(config.vertexAI.projectId).toBe('test-project');
      expect(config.vertexAI.location).toBe('test-location');
      expect(config.vertexAI.embeddingModel).toBe('test-model');
    });

    it('should override default config with values from functions.config()', () => {
      process.env.NODE_ENV = 'test';
      const config = getEnvironmentConfig();
      expect(config.security.allowedOrigins).toEqual(['https://test.com', 'https://test2.com']);
      expect(config.security.enableRateLimiting).toBe(true);
      expect(config.security.maxRequestsPerMinute).toBe(42);
    });

    it('should override feature flags from functions.config()', () => {
      process.env.NODE_ENV = 'test';
      const config = getEnvironmentConfig();
      expect(config.featureFlags.enableVertexAI).toBe(true);
      expect(config.featureFlags.enableVectorSearch).toBe(false);
    });

    it('should return cached config if not expired', () => {
      process.env.NODE_ENV = 'test';
      
      // First call should get fresh config
      const config1 = getEnvironmentConfig();
      
      // Mock functions.config() to return different values
      const functionsConfig = require('firebase-functions').config;
      functionsConfig.mockReturnValueOnce({
        environment: {
          name: 'changed'
        }
      });
      
      // Second call should return cached config
      const config2 = getEnvironmentConfig();
      
      expect(config1).toEqual(config2);
      expect(config2.name).toBe('test');
    });

    it('should refresh config if forceRefresh is true', () => {
      process.env.NODE_ENV = 'test';
      
      // First call should get fresh config
      const config1 = getEnvironmentConfig();
      
      // Mock functions.config() to return different values
      const functionsConfig = require('firebase-functions').config;
      functionsConfig.mockReturnValueOnce({
        environment: {
          name: 'changed'
        },
        vertex_ai: {
          project_id: 'changed-project'
        }
      });
      
      // Second call with forceRefresh should get fresh config
      const config2 = getEnvironmentConfig(true);
      
      expect(config1).not.toEqual(config2);
      expect(config2.name).toBe('changed');
      expect(config2.vertexAI.projectId).toBe('changed-project');
    });

    it('should return default config for development if environment is not found', () => {
      process.env.NODE_ENV = 'unknown';
      const config = getEnvironmentConfig();
      expect(config.name).toBe('development');
    });

    it('should validate config and throw error if invalid', () => {
      process.env.NODE_ENV = 'test';
      
      // Mock functions.config() to return invalid values
      const functionsConfig = require('firebase-functions').config;
      functionsConfig.mockReturnValueOnce({
        environment: {
          name: 'test'
        },
        vertex_ai: {
          project_id: '', // Invalid: empty project ID
          location: 'test-location',
          embedding_model: 'test-model'
        }
      });
      
      expect(() => getEnvironmentConfig(true)).toThrow(AppError);
    });
  });

  describe('getSecureCredential', () => {
    it('should retrieve credential from Firestore', async () => {
      const credential = await getSecureCredential('testKey');
      expect(credential).toBe('testValue');
      
      // Check that Firestore was called correctly
      const admin = require('firebase-admin');
      expect(admin.firestore().collection).toHaveBeenCalledWith('secureCredentials');
      expect(admin.firestore().collection().doc).toHaveBeenCalledWith('test');
    });

    it('should throw error if credential document does not exist', async () => {
      // Mock Firestore to return non-existent document
      const admin = require('firebase-admin');
      admin.firestore().collection().doc().get.mockResolvedValueOnce({
        exists: false
      });
      
      await expect(getSecureCredential('testKey')).rejects.toThrow(AppError);
    });

    it('should throw error if credential key does not exist', async () => {
      // Mock Firestore to return document without the requested key
      const admin = require('firebase-admin');
      admin.firestore().collection().doc().get.mockResolvedValueOnce({
        exists: true,
        data: vi.fn().mockReturnValue({
          otherKey: 'otherValue'
        })
      });
      
      await expect(getSecureCredential('testKey')).rejects.toThrow(AppError);
    });
  });

  describe('setSecureCredential', () => {
    it('should set credential in Firestore', async () => {
      await setSecureCredential('testKey', 'newValue');
      
      // Check that Firestore was called correctly
      const admin = require('firebase-admin');
      expect(admin.firestore().collection).toHaveBeenCalledWith('secureCredentials');
      expect(admin.firestore().collection().doc).toHaveBeenCalledWith('test');
      expect(admin.firestore().collection().doc().set).toHaveBeenCalledWith(
        { testKey: 'newValue' },
        { merge: true }
      );
    });

    it('should throw error if Firestore operation fails', async () => {
      // Mock Firestore to throw error
      const admin = require('firebase-admin');
      admin.firestore().collection().doc().set.mockRejectedValueOnce(new Error('Firestore error'));
      
      await expect(setSecureCredential('testKey', 'newValue')).rejects.toThrow(AppError);
    });
  });
});
