// Mock implementation for testing without actual Firebase
// This avoids the need for @firebase/rules-unit-testing which has compatibility issues

/**
 * Mock test environment
 */
class MockRulesTestEnvironment {
  private projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  withSecurityRulesDisabled() {
    return {
      firestore: () => ({
        // Mock Firestore methods
      })
    };
  }

  unauthenticatedContext() {
    return {
      firestore: () => ({
        // Mock Firestore methods
      })
    };
  }

  authenticatedContext(uid: string) {
    return {
      firestore: () => ({
        // Mock Firestore methods
      })
    };
  }

  cleanup() {
    return Promise.resolve();
  }

  clearFirestore() {
    return Promise.resolve();
  }
}

/**
 * Global test environment
 */
let testEnv: MockRulesTestEnvironment;

/**
 * Initialize test environment
 */
export const setupTestEnvironment = async () => {
  testEnv = new MockRulesTestEnvironment('rpg-archivist-test');
  return testEnv;
};

/**
 * Clean up test environment
 */
export const cleanupTestEnvironment = async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
};

/**
 * Clear Firestore data
 */
export const clearFirestoreData = async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
};

/**
 * Get test environment
 */
export const getTestEnvironment = () => {
  return testEnv;
};
