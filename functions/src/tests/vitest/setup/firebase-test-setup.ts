/**
 * Firebase Test Setup
 * Provides real Firebase initialization for testing
 */

import * as admin from 'firebase-admin';

/**
 * Initialize Firebase Admin for testing
 * Uses the Firebase emulator or test project
 */
export function initializeFirebaseForTesting(): void {
  // Check if Firebase is already initialized
  if (admin.apps.length > 0) {
    return;
  }

  // Initialize Firebase Admin with test configuration
  admin.initializeApp({
    projectId: 'demo-test-project',
    // Use Firebase emulator settings
    databaseURL: 'http://localhost:8080',
  });

  // Set Firestore to use emulator if available
  const db = admin.firestore();
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    // Emulator is running, use it
    console.log('Using Firestore emulator for tests');
  } else {
    // No emulator, use test settings
    db.settings({
      host: 'localhost:8080',
      ssl: false
    });
  }
}

/**
 * Clean up Firebase for testing
 */
export function cleanupFirebaseForTesting(): void {
  // Delete all Firebase apps
  const deletePromises = admin.apps.map(app => app?.delete());
  return Promise.all(deletePromises);
}
