/**
 * Firestore mock test suite using Vitest
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { setupFirestoreMocks, createMockDatabase } from '../vitest-utils/firestore-test-utils';

// Set up Firestore mocks with initial test data
const mockDb = createMockDatabase('test-user-id');
const mockFirestore = setupFirestoreMocks(mockDb);

describe('Firestore Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a document with setDoc', async () => {
    // Use type assertion to avoid type errors with mock implementation
    const docRef = doc(mockFirestore.collection('users') as any, 'user1');
    await setDoc(docRef, { name: 'User 1', email: 'user1@example.com' });

    const snapshot = await getDoc(docRef);
    expect(snapshot.exists()).toBe(true);
    expect(snapshot.data()).toEqual({ name: 'User 1', email: 'user1@example.com' });
  });

  it('should update a document', async () => {
    // Create a document
    // Use type assertion to avoid type errors with mock implementation
    const docRef = doc(mockFirestore.collection('users') as any, 'user3');
    await setDoc(docRef, { name: 'User 3', email: 'user3@example.com' });

    // Update the document
    await updateDoc(docRef, { name: 'Updated User 3' });

    // Verify the update
    const snapshot = await getDoc(docRef);
    expect(snapshot.exists()).toBe(true);
    expect(snapshot.data()).toEqual({ name: 'Updated User 3', email: 'user3@example.com' });
  });

  it('should delete a document', async () => {
    // Create a document
    // Use type assertion to avoid type errors with mock implementation
    const docRef = doc(mockFirestore.collection('users') as any, 'user4');
    await setDoc(docRef, { name: 'User 4', email: 'user4@example.com' });

    // Verify the document exists
    let snapshot = await getDoc(docRef);
    expect(snapshot.exists()).toBe(true);

    // Delete the document
    await deleteDoc(docRef);

    // Verify the document no longer exists
    snapshot = await getDoc(docRef);
    expect(snapshot.exists()).toBe(false);
  });
});
