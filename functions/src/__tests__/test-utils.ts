/**
 * Test Utilities
 *
 * This file contains utilities for testing Cloud Functions.
 */

import { describe, it, expect, vi } from 'vitest';
import functionsTest from 'firebase-functions-test';

// Mock Firebase admin initialization
vi.mock('firebase-admin', () => {
  return {
    initializeApp: vi.fn(),
    firestore: vi.fn().mockReturnValue({
      collection: vi.fn().mockReturnThis(),
      doc: vi.fn().mockReturnThis(),
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn()
    })
  };
});

// Add a simple test to avoid the "Your test suite must contain at least one test" error
describe('Test Utilities', () => {
  it('should export test utilities', () => {
    expect(mockLogger).toBeDefined();
    expect(createMockFirestore).toBeDefined();
    expect(createMockVertexAIClient).toBeDefined();
  });
});

// Initialize the firebase-functions-test SDK
export const testEnv = functionsTest();

/**
 * Create a Firestore document snapshot for testing
 * @param id Document ID
 * @param data Document data
 * @returns Document snapshot
 */
export function createDocumentSnapshot(id: string, data: any) {
  return {
    id,
    data: () => data,
    exists: true,
    ref: {
      id,
      parent: {
        id: 'collection'
      }
    }
  };
}

/**
 * Create a mock logger
 */
export const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn().mockReturnThis(),
  getOperationId: vi.fn().mockReturnValue('test-operation-id')
};

/**
 * Clean up after tests
 */
export function cleanup() {
  testEnv.cleanup();
}

/**
 * Create a mock Firestore database
 */
export function createMockFirestore() {
  const mockUpdate = vi.fn().mockResolvedValue({});
  const mockDoc = vi.fn().mockReturnValue({
    update: mockUpdate,
    get: vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        name: 'Test Entity',
        description: 'Test Description',
        vectorStatus: 'PENDING'
      })
    })
  });
  const mockCollection = vi.fn().mockReturnValue({
    doc: mockDoc
  });

  return {
    collection: mockCollection,
    mockCollection,
    mockDoc,
    mockUpdate
  };
}

/**
 * Create a mock Vertex AI client
 */
export function createMockVertexAIClient() {
  return {
    generateEmbedding: vi.fn().mockResolvedValue({
      embedding: Array(768).fill(0.1),
      dimension: 768
    }),
    generateEmbeddingsBatch: vi.fn().mockResolvedValue([
      {
        embedding: Array(768).fill(0.1),
        dimension: 768
      },
      {
        embedding: Array(768).fill(0.2),
        dimension: 768
      }
    ])
  };
}

/**
 * Reset all mocks
 */
export function resetAllMocks() {
  vi.clearAllMocks();
  mockLogger.debug.mockClear();
  mockLogger.info.mockClear();
  mockLogger.warn.mockClear();
  mockLogger.error.mockClear();
  mockLogger.child.mockClear();
}
