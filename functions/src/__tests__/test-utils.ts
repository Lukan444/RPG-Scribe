/**
 * Test Utilities
 *
 * This file contains utilities for testing Cloud Functions.
 */

// Add a simple test to avoid the "Your test suite must contain at least one test" error
describe('Test Utilities', () => {
  it('should export test utilities', () => {
    expect(mockLogger).toBeDefined();
    expect(createMockFirestore).toBeDefined();
    expect(createMockVertexAIClient).toBeDefined();
  });
});

import functionsTest from 'firebase-functions-test';

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
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  child: jest.fn().mockReturnThis(),
  getOperationId: jest.fn().mockReturnValue('test-operation-id')
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
  const mockUpdate = jest.fn().mockResolvedValue({});
  const mockDoc = jest.fn().mockReturnValue({
    update: mockUpdate,
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        name: 'Test Entity',
        description: 'Test Description',
        vectorStatus: 'PENDING'
      })
    })
  });
  const mockCollection = jest.fn().mockReturnValue({
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
    generateEmbedding: jest.fn().mockResolvedValue({
      embedding: Array(768).fill(0.1),
      dimension: 768
    }),
    generateEmbeddingsBatch: jest.fn().mockResolvedValue([
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
  jest.clearAllMocks();
  mockLogger.debug.mockClear();
  mockLogger.info.mockClear();
  mockLogger.warn.mockClear();
  mockLogger.error.mockClear();
  mockLogger.child.mockClear();
}
