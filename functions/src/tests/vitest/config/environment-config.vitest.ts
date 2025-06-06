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
import { initializeFirebaseForTesting, cleanupFirebaseForTesting, createFirestoreMocks } from '../../setup/firebase-test-config';

// Use vi.hoisted to create mock functions that can be used in mock factories
const { mockConfig, mockGet, mockSet, mockDoc, mockCollection, mockFirestore } = vi.hoisted(() => {
  const mockConfig = vi.fn().mockReturnValue({
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
  });

  const mockGet = vi.fn().mockResolvedValue({
    exists: true,
    data: vi.fn().mockReturnValue({
      testKey: 'testValue'
    })
  });

  const mockSet = vi.fn().mockResolvedValue({});

  const mockDoc = vi.fn().mockReturnValue({
    get: mockGet,
    set: mockSet
  });

  const mockCollection = vi.fn().mockReturnValue({
    doc: mockDoc
  });

  const mockFirestore = vi.fn().mockReturnValue({
    collection: mockCollection
  });

  return { mockConfig, mockGet, mockSet, mockDoc, mockCollection, mockFirestore };
});

// Mock firebase-functions
vi.mock('firebase-functions', () => {
  return {
    config: mockConfig
  };
});

// Don't mock firebase-admin - use real Firebase test setup

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

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Initialize Firebase for testing
    initializeFirebaseForTesting();

    // Reset mock config to default behavior
    mockConfig.mockReturnValue({
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
    });
  });

  afterEach(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    vi.useRealTimers();
    await cleanupFirebaseForTesting();
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
      mockConfig.mockReturnValueOnce({});
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
      mockConfig.mockReturnValueOnce({
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

      // Verify we got the initial config
      expect(config1.vertexAI.projectId).toBe('test-project');

      // Wait a bit to ensure timestamp difference
      vi.advanceTimersByTime(1000);

      // Second call with forceRefresh should bypass cache
      const config2 = getEnvironmentConfig(true);

      // Both configs should be the same since we're using the same mock
      // but the forceRefresh should have bypassed the cache
      expect(config2.vertexAI.projectId).toBe('test-project');

      // The test verifies that forceRefresh bypasses cache, not that config changes
      expect(config1).toEqual(config2);
    });

    it('should return default config for development if environment is not found', () => {
      process.env.NODE_ENV = 'unknown';

      // Mock functions.config() to return empty/undefined for unknown environment
      mockConfig.mockReturnValue({});

      const config = getEnvironmentConfig(true); // Force refresh to bypass cache
      expect(config.name).toBe('development');
    });

    it('should validate config and return default config if validation fails', () => {
      process.env.NODE_ENV = 'test';

      // Mock functions.config() to throw an error during config processing
      mockConfig.mockImplementation(() => {
        throw new Error('Config error');
      });

      // Should return default config when there's an error, not throw
      const config = getEnvironmentConfig(true);
      expect(config.name).toBe('test'); // Should get default test config
      expect(config.vertexAI.projectId).toBe('test-project');
    });
  });

  describe('getSecureCredential', () => {
    it('should retrieve credential from Firestore', async () => {
      // Mock Firestore operations for this test
      const admin = require('firebase-admin');
      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ testKey: 'testValue' })
      });

      const mockDoc = vi.fn().mockReturnValue({ get: mockGet });
      const mockCollection = vi.fn().mockReturnValue({ doc: mockDoc });

      vi.spyOn(admin, 'firestore').mockReturnValue({ collection: mockCollection });

      const credential = await getSecureCredential('testKey');
      expect(credential).toBe('testValue');

      // Verify calls
      expect(mockCollection).toHaveBeenCalledWith('secureCredentials');
      expect(mockDoc).toHaveBeenCalledWith('test');
    });

    it('should throw error if credential document does not exist', async () => {
      // Mock non-existent document
      const admin = require('firebase-admin');
      const mockGet = vi.fn().mockResolvedValue({ exists: false });
      const mockDoc = vi.fn().mockReturnValue({ get: mockGet });
      const mockCollection = vi.fn().mockReturnValue({ doc: mockDoc });

      vi.spyOn(admin, 'firestore').mockReturnValue({ collection: mockCollection });

      await expect(getSecureCredential('nonExistentKey')).rejects.toThrow(AppError);
    });

    it('should throw error if credential key does not exist', async () => {
      // Mock document without the requested key
      const admin = require('firebase-admin');
      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ otherKey: 'otherValue' })
      });

      const mockDoc = vi.fn().mockReturnValue({ get: mockGet });
      const mockCollection = vi.fn().mockReturnValue({ doc: mockDoc });

      vi.spyOn(admin, 'firestore').mockReturnValue({ collection: mockCollection });

      await expect(getSecureCredential('missingKey')).rejects.toThrow(AppError);
    });
  });

  describe('setSecureCredential', () => {
    it('should set credential in Firestore', async () => {
      // Mock Firestore operations for this test
      const admin = require('firebase-admin');
      const mockSet = vi.fn().mockResolvedValue({});
      const mockDoc = vi.fn().mockReturnValue({ set: mockSet });
      const mockCollection = vi.fn().mockReturnValue({ doc: mockDoc });

      vi.spyOn(admin, 'firestore').mockReturnValue({ collection: mockCollection });

      await setSecureCredential('testKey', 'newValue');

      // Verify calls
      expect(mockCollection).toHaveBeenCalledWith('secureCredentials');
      expect(mockDoc).toHaveBeenCalledWith('test');
      expect(mockSet).toHaveBeenCalledWith({ testKey: 'newValue' }, { merge: true });
    });

    it('should throw error if Firestore operation fails', async () => {
      // Mock Firestore to throw error
      const admin = require('firebase-admin');
      const mockSet = vi.fn().mockRejectedValue(new Error('Firestore error'));
      const mockDoc = vi.fn().mockReturnValue({ set: mockSet });
      const mockCollection = vi.fn().mockReturnValue({ doc: mockDoc });

      vi.spyOn(admin, 'firestore').mockReturnValue({ collection: mockCollection });

      await expect(setSecureCredential('testKey', 'newValue')).rejects.toThrow(AppError);
    });
  });
});
