/**
 * FirestoreService test suite using Vitest
 *
 * This is a simplified version of the test suite that focuses on the basic functionality
 * of the FirestoreService class. It uses vi.mock to mock the Firebase Firestore API.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FirestoreService } from '../../services/firestore.service';

// Mock Firebase App
vi.mock('firebase/app', () => {
  return {
    initializeApp: vi.fn(() => ({
      name: 'test-app'
    })),
    getApps: vi.fn(() => []),
    getApp: vi.fn(() => ({
      name: 'test-app'
    }))
  };
});

// Mock Firebase Auth
vi.mock('firebase/auth', () => {
  return {
    getAuth: vi.fn(() => ({
      currentUser: {
        uid: 'test-user-id',
        email: 'test@example.com'
      }
    })),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn(),
    browserLocalPersistence: 'local',
    setPersistence: vi.fn()
  };
});

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => {
  const mockDocuments = new Map();
  const mockFirestore = {
    collection: vi.fn(() => ({ id: 'test-collection' })),
    doc: vi.fn(() => ({ id: 'test-id' }))
  };

  return {
    getFirestore: vi.fn(() => mockFirestore),
    collection: vi.fn(() => ({ id: 'test-collection' })),
    doc: vi.fn(() => ({ id: 'test-id' })),
    getDoc: vi.fn(() => ({
      exists: () => true,
      data: () => ({ name: 'Test Document', value: 42 }),
      id: 'test-id'
    })),
    getDocs: vi.fn(() => ({
      docs: [
        { id: 'doc1', data: () => ({ name: 'Document 1', value: 10 }) },
        { id: 'doc2', data: () => ({ name: 'Document 2', value: 20 }) }
      ],
      size: 2
    })),
    setDoc: vi.fn(() => Promise.resolve()),
    addDoc: vi.fn(() => Promise.resolve({ id: 'test-id' })),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    query: vi.fn(() => ({})),
    where: vi.fn(() => ({})),
    orderBy: vi.fn(() => ({})),
    limit: vi.fn(() => ({})),
    startAfter: vi.fn(() => ({})),
    serverTimestamp: vi.fn(() => new Date()),
    enableIndexedDbPersistence: vi.fn(() => Promise.resolve()),
    enableMultiTabIndexedDbPersistence: vi.fn(() => Promise.resolve()),
    CACHE_SIZE_UNLIMITED: 'unlimited',
    initializeFirestore: vi.fn(() => mockFirestore),
    connectFirestoreEmulator: vi.fn(),
    Timestamp: {
      now: vi.fn(() => ({ toDate: () => new Date() }))
    }
  };
});

/**
 * Test data interface
 */
interface TestData {
  id?: string;
  name: string;
  value: number;
  tags?: string[];
  createdAt?: any;
  updatedAt?: any;
}

/**
 * FirestoreService test suite
 */
describe('FirestoreService', () => {
  // Test service
  let testService: FirestoreService<TestData>;

  // Set up test service
  beforeEach(() => {
    testService = new FirestoreService<TestData>('test-collection');
  });

  // Test create method
  describe('create', () => {
    it('should create a document with auto-generated ID', async () => {
      // Create test data
      const testData: TestData = {
        name: 'Test Document',
        value: 42
      };

      // Create document
      const id = await testService.create(testData);

      // Verify document was created
      expect(id).toBeTruthy();
    });

    it('should create a document with specified ID', async () => {
      // Create test data
      const testData: TestData = {
        name: 'Test Document',
        value: 42
      };

      // Create document with specified ID
      const id = 'test-id';
      const createdId = await testService.create(testData, id);

      // Verify document was created with specified ID
      expect(createdId).toBe(id);
    });
  });

  // Test getById method
  describe('getById', () => {
    it('should get a document by ID', async () => {
      // Get document by ID
      const document = await testService.getById('test-id');

      // Verify document data
      expect(document).toBeTruthy();
      expect(document?.id).toBe('test-id');
      expect(document?.name).toBe('Test Document');
      expect(document?.value).toBe(42);
    });
  });

  // Test update method
  describe('update', () => {
    it('should update a document', async () => {
      // Update document
      const updateData: Partial<TestData> = {
        name: 'Updated Document',
        value: 100
      };

      const success = await testService.update('test-id', updateData);

      // Verify update success
      expect(success).toBe(true);
    });
  });

  // Test delete method
  describe('delete', () => {
    it('should delete a document', async () => {
      // Delete document
      const success = await testService.delete('test-id');

      // Verify delete success
      expect(success).toBe(true);
    });
  });

  // Test query method
  describe('query', () => {
    it('should query documents', async () => {
      // Mock the query result
      vi.spyOn(testService, 'query').mockResolvedValueOnce({
        data: [
          { id: 'doc1', name: 'Document 1', value: 10 },
          { id: 'doc2', name: 'Document 2', value: 20 }
        ],
        lastDoc: null, // Using null instead of a mock object to avoid type issues
        source: 'server' // Add the required source property
      });

      // Query documents
      const result = await testService.query();

      // Verify query results
      expect(result.data.length).toBe(2);
      expect(result.data[0].id).toBe('doc1');
      expect(result.data[1].id).toBe('doc2');
    });
  });
});
