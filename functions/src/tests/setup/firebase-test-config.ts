/**
 * Firebase Test Configuration
 * Provides proper Firebase initialization for test environment
 */

import * as admin from 'firebase-admin';
import { vi } from 'vitest';

/**
 * Initialize Firebase Admin for testing with proper configuration
 */
export function initializeFirebaseForTesting(): void {
  // Check if Firebase is already initialized
  if (admin.apps.length > 0) {
    return;
  }

  try {
    // Initialize Firebase Admin with test configuration (no credentials needed for tests)
    admin.initializeApp({
      projectId: 'demo-test-project',
    });

    console.log('Firebase Admin initialized for testing');
  } catch (error) {
    console.log('Firebase Admin already initialized or failed to initialize');
  }
}

/**
 * Clean up Firebase for testing
 */
export async function cleanupFirebaseForTesting(): Promise<void> {
  const deletePromises = admin.apps.map(app => app?.delete());
  await Promise.all(deletePromises);
}

/**
 * Get or create a test Firestore instance
 */
export function getTestFirestore() {
  if (admin.apps.length === 0) {
    initializeFirebaseForTesting();
  }
  
  return admin.firestore();
}

/**
 * Create mock Firestore functions for testing
 */
export function createFirestoreMocks() {
  const mockGet = vi.fn().mockResolvedValue({
    exists: true,
    data: vi.fn().mockReturnValue({
      testKey: 'testValue'
    })
  });

  const mockSet = vi.fn().mockResolvedValue({});
  const mockAdd = vi.fn().mockResolvedValue({ id: 'mock-doc-id' });
  const mockUpdate = vi.fn().mockResolvedValue({});
  const mockDelete = vi.fn().mockResolvedValue({});

  const mockDoc = vi.fn().mockReturnValue({
    get: mockGet,
    set: mockSet,
    update: mockUpdate,
    delete: mockDelete
  });

  const mockCollection = vi.fn().mockReturnValue({
    doc: mockDoc,
    add: mockAdd,
    get: vi.fn().mockResolvedValue({
      docs: [],
      size: 0,
      empty: true
    })
  });

  return {
    mockGet,
    mockSet,
    mockAdd,
    mockUpdate,
    mockDelete,
    mockDoc,
    mockCollection
  };
}
