/**
 * Firestore Mock Factory for Vitest
 *
 * This file provides a standardized way to create Firestore mocks for testing with Vitest.
 * It allows for dynamic creation of mock data and proper simulation of Firestore behavior.
 */

import { vi } from 'vitest';
import {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  QuerySnapshot,
  CollectionReference,
  Query,
  Timestamp,
  FieldValue,
  WriteBatch,
  Transaction
} from 'firebase/firestore';

/**
 * Mock document data store
 */
interface MockDataStore {
  [collectionPath: string]: {
    [documentId: string]: DocumentData;
  };
}

/**
 * Create a mock document
 * @param collectionPath Collection path
 * @param id Document ID
 * @param data Document data
 * @returns Mock document
 */
export function createMockDocument(collectionPath: string, id: string, data: DocumentData = {}) {
  const docRef = {
    id,
    path: `${collectionPath}/${id}`,
    parent: {
      id: collectionPath,
      path: collectionPath
    }
  };

  const docSnapshot = {
    id,
    ref: docRef,
    data: () => ({ ...data }),
    exists: () => true,
    get: (field: string) => data[field]
  };

  return {
    ref: docRef,
    snapshot: docSnapshot,
    data
  };
}

/**
 * Create a mock collection
 * @param collectionPath Collection path
 * @param documents Array of documents
 * @returns Mock collection
 */
export function createMockCollection(collectionPath: string, documents: Array<{ id: string, data: DocumentData }> = []) {
  const docsMap: { [id: string]: DocumentData } = {};
  const docSnapshots: any[] = [];

  documents.forEach(doc => {
    docsMap[doc.id] = doc.data;
    docSnapshots.push({
      id: doc.id,
      ref: {
        id: doc.id,
        path: `${collectionPath}/${doc.id}`,
        parent: {
          id: collectionPath,
          path: collectionPath
        }
      },
      data: () => ({ ...doc.data }),
      exists: () => true,
      get: (field: string) => doc.data[field]
    });
  });

  const querySnapshot = {
    docs: docSnapshots,
    size: docSnapshots.length,
    empty: docSnapshots.length === 0,
    forEach: (callback: (doc: any) => void) => docSnapshots.forEach(callback)
  };

  return {
    [collectionPath]: docsMap,
    querySnapshot
  };
}

/**
 * Create a mock Firestore instance
 * @param initialData Initial data to populate the mock Firestore
 * @returns Mock Firestore instance
 */
export function createFirestoreMock(initialData: MockDataStore = {}) {
  // Create a copy of the initial data to avoid modifying the original
  const mockData: MockDataStore = JSON.parse(JSON.stringify(initialData));

  // Mock document function
  const mockDoc = vi.fn((collectionRef: any, docId: string) => {
    const collectionPath = typeof collectionRef === 'string'
      ? collectionRef
      : collectionRef.path;

    // Create collection if it doesn't exist
    if (!mockData[collectionPath]) {
      mockData[collectionPath] = {};
    }

    const docRef = {
      id: docId,
      path: `${collectionPath}/${docId}`,
      parent: {
        id: collectionPath,
        path: collectionPath
      },
      collection: (subCollectionPath: string) =>
        mockCollection(`${collectionPath}/${docId}/${subCollectionPath}`),

      // Document operations
      get: vi.fn().mockImplementation(() => {
        const data = mockData[collectionPath]?.[docId];
        return Promise.resolve({
          id: docId,
          ref: docRef,
          data: () => data ? { ...data } : undefined,
          exists: () => !!data,
          get: (field: string) => data?.[field]
        });
      }),

      set: vi.fn().mockImplementation((data: DocumentData) => {
        mockData[collectionPath][docId] = { ...data };
        return Promise.resolve();
      }),

      update: vi.fn().mockImplementation((data: DocumentData) => {
        if (!mockData[collectionPath][docId]) {
          mockData[collectionPath][docId] = {};
        }
        mockData[collectionPath][docId] = {
          ...mockData[collectionPath][docId],
          ...data
        };
        return Promise.resolve();
      }),

      delete: vi.fn().mockImplementation(() => {
        if (mockData[collectionPath]?.[docId]) {
          delete mockData[collectionPath][docId];
        }
        return Promise.resolve();
      })
    };

    return docRef;
  });

  // Mock collection function
  const mockCollection = vi.fn((path: string) => {
    // Create collection if it doesn't exist
    if (!mockData[path]) {
      mockData[path] = {};
    }

    const collectionRef = {
      id: path.split('/').pop(),
      path,

      // Collection operations
      doc: (docId: string) => mockDoc(path, docId),

      add: vi.fn().mockImplementation((data: DocumentData) => {
        const docId = `mock-doc-${Date.now()}`;
        mockData[path][docId] = { ...data };
        return Promise.resolve(mockDoc(path, docId));
      }),

      get: vi.fn().mockImplementation(() => {
        const docs = Object.entries(mockData[path] || {}).map(([id, data]) => ({
          id,
          ref: mockDoc(path, id),
          data: () => ({ ...data }),
          exists: () => true,
          get: (field: string) => data[field]
        }));

        return Promise.resolve({
          docs,
          size: docs.length,
          empty: docs.length === 0,
          forEach: (callback: (doc: any) => void) => docs.forEach(callback)
        });
      })
    };

    return collectionRef;
  });

  // Mock query function
  const mockQuery = vi.fn(() => ({
    get: vi.fn().mockImplementation(() => {
      // This is a simplified implementation
      // In a real implementation, we would filter based on the query constraints
      return Promise.resolve({
        docs: [],
        size: 0,
        empty: true,
        forEach: vi.fn()
      });
    })
  }));

  // Mock batch function
  const mockBatch = vi.fn(() => {
    const operations: Array<{
      type: 'set' | 'update' | 'delete';
      ref: any;
      data?: DocumentData;
    }> = [];

    return {
      set: vi.fn(function(this: any, ref: any, data: DocumentData) {
        operations.push({ type: 'set', ref, data });
        return this;
      }),

      update: vi.fn(function(this: any, ref: any, data: DocumentData) {
        operations.push({ type: 'update', ref, data });
        return this;
      }),

      delete: vi.fn(function(this: any, ref: any) {
        operations.push({ type: 'delete', ref });
        return this;
      }),

      commit: vi.fn().mockImplementation(() => {
        // Process all operations
        operations.forEach(op => {
          const collectionPath = op.ref.parent.path;
          const docId = op.ref.id;

          switch (op.type) {
            case 'set':
              mockData[collectionPath][docId] = { ...op.data };
              break;
            case 'update':
              if (!mockData[collectionPath][docId]) {
                mockData[collectionPath][docId] = {};
              }
              mockData[collectionPath][docId] = {
                ...mockData[collectionPath][docId],
                ...op.data
              };
              break;
            case 'delete':
              if (mockData[collectionPath]?.[docId]) {
                delete mockData[collectionPath][docId];
              }
              break;
          }
        });

        return Promise.resolve();
      })
    };
  });

  // Return the mock Firestore instance
  return {
    collection: mockCollection,
    doc: mockDoc,
    query: mockQuery,
    batch: mockBatch,
    runTransaction: vi.fn().mockImplementation((callback: (transaction: any) => Promise<any>) => {
      const transaction = {
        get: vi.fn().mockImplementation((docRef: any) => docRef.get()),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      };

      return callback(transaction).then(result => result);
    }),

    // Access to the mock data for testing
    _mockData: mockData
  };
}
