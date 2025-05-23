/**
 * Mock Firebase configuration for testing
 *
 * This file provides mock implementations of Firebase services
 * for testing purposes, avoiding the need to import the actual modules
 * which can cause issues with TextEncoder in the test environment.
 */
import { vi } from 'vitest';

// Mock Firebase app
const mockApp = {
  name: 'test-app',
  options: {
    apiKey: 'test-api-key',
    authDomain: 'test-auth-domain',
    projectId: 'test-project-id',
    storageBucket: 'test-storage-bucket',
    messagingSenderId: 'test-messaging-sender-id',
    appId: 'test-app-id'
  },
  automaticDataCollectionEnabled: false
};

// Mock user object
const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  emailVerified: true,
  phoneNumber: null,
  isAnonymous: false,
  metadata: {
    creationTime: '2023-01-01T00:00:00Z',
    lastSignInTime: '2023-01-01T00:00:00Z'
  },
  providerData: [
    {
      providerId: 'password',
      uid: 'test@example.com',
      displayName: 'Test User',
      email: 'test@example.com',
      phoneNumber: null,
      photoURL: 'https://example.com/photo.jpg'
    }
  ],
  getIdToken: vi.fn().mockResolvedValue('mock-id-token'),
  getIdTokenResult: vi.fn().mockResolvedValue({
    token: 'mock-id-token',
    claims: {
      role: 'user'
    },
    expirationTime: '2023-12-31T00:00:00Z',
    issuedAtTime: '2023-01-01T00:00:00Z',
    signInProvider: 'password',
    signInSecondFactor: null
  }),
  reload: vi.fn().mockResolvedValue(null),
  delete: vi.fn().mockResolvedValue(null),
  updateProfile: vi.fn().mockResolvedValue(null),
  updateEmail: vi.fn().mockResolvedValue(null),
  updatePassword: vi.fn().mockResolvedValue(null),
  sendEmailVerification: vi.fn().mockResolvedValue(null)
};

// Mock auth object
const mockAuth = {
  currentUser: mockUser,
  onAuthStateChanged: vi.fn(callback => {
    callback(mockUser);
    return vi.fn(); // Unsubscribe function
  }),
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({
    user: mockUser
  }),
  createUserWithEmailAndPassword: vi.fn().mockResolvedValue({
    user: mockUser
  }),
  signInWithPopup: vi.fn().mockResolvedValue({
    user: mockUser,
    credential: {
      accessToken: 'mock-access-token',
      idToken: 'mock-id-token',
      providerId: 'google.com'
    }
  }),
  signOut: vi.fn().mockResolvedValue(null),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(null),
  confirmPasswordReset: vi.fn().mockResolvedValue(null),
  setPersistence: vi.fn().mockResolvedValue(null)
};

/**
 * Mock document snapshot
 */
class MockDocumentSnapshot {
  id: string;
  _data: any;
  _exists: boolean;

  constructor(id: string, data: any) {
    this.id = id;
    this._data = data || {};
    this._exists = !!data;
  }

  data() {
    return this._data;
  }

  exists() {
    return this._exists;
  }

  get(field: string) {
    return this._data[field];
  }
}

/**
 * Mock query snapshot
 */
class MockQuerySnapshot {
  docs: any[];
  size: number;
  empty: boolean;

  constructor(docs: any[]) {
    this.docs = docs || [];
    this.size = this.docs.length;
    this.empty = this.size === 0;
  }

  forEach(callback: (doc: any) => void) {
    this.docs.forEach(callback);
  }
}

/**
 * Mock document reference
 */
class MockDocumentReference {
  id: string;
  _data: any;
  path: string;

  constructor(id: string, data: any, path: string) {
    this.id = id;
    this._data = data || {};
    this.path = path || `mocks/${id}`;
  }

  get() {
    return Promise.resolve(new MockDocumentSnapshot(this.id, this._data));
  }

  set(data: any) {
    this._data = { ...this._data, ...data };
    return Promise.resolve();
  }

  update(data: any) {
    this._data = { ...this._data, ...data };
    return Promise.resolve();
  }

  delete() {
    this._data = null;
    return Promise.resolve();
  }

  onSnapshot(callback: (snapshot: any) => void) {
    callback(new MockDocumentSnapshot(this.id, this._data));
    return vi.fn(); // Unsubscribe function
  }
}

/**
 * Mock collection reference
 */
class MockCollectionReference {
  id: string;
  _docs: Record<string, MockDocumentReference>;

  constructor(id: string) {
    this.id = id;
    this._docs = {};
  }

  doc(id?: string) {
    if (!id) {
      id = 'auto-id-' + Math.random().toString(36).substring(2, 15);
    }

    if (!this._docs[id]) {
      this._docs[id] = new MockDocumentReference(id, {}, `${this.id}/${id}`);
    }

    return this._docs[id];
  }

  add(data: any) {
    const id = 'auto-id-' + Math.random().toString(36).substring(2, 15);
    const docRef = this.doc(id);
    docRef.set(data);
    return Promise.resolve(docRef);
  }

  get() {
    const docs = Object.values(this._docs).map(
      docRef => new MockDocumentSnapshot(docRef.id, docRef._data)
    );
    return Promise.resolve(new MockQuerySnapshot(docs));
  }

  where() {
    // Return this to allow chaining
    return this;
  }

  orderBy() {
    // Return this to allow chaining
    return this;
  }

  limit() {
    // Return this to allow chaining
    return this;
  }

  startAfter() {
    // Return this to allow chaining
    return this;
  }

  onSnapshot(callback: (snapshot: any) => void) {
    const docs = Object.values(this._docs).map(
      docRef => new MockDocumentSnapshot(docRef.id, docRef._data)
    );
    callback(new MockQuerySnapshot(docs));
    return vi.fn(); // Unsubscribe function
  }
}

/**
 * Mock Firestore
 */
const mockDb = {
  collection: vi.fn((path: string) => new MockCollectionReference(path)),
  doc: vi.fn((path: string) => {
    const parts = path.split('/');
    const id = parts[parts.length - 1];
    return new MockDocumentReference(id, {}, path);
  }),
  batch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(null)
  })),
  runTransaction: vi.fn((updateFunction: any) => {
    return Promise.resolve(updateFunction({
      get: vi.fn().mockImplementation((docRef: any) => {
        return Promise.resolve(new MockDocumentSnapshot(docRef.id, docRef._data));
      }),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }));
  }),
  enablePersistence: vi.fn().mockResolvedValue(null),
  disableNetwork: vi.fn().mockResolvedValue(null),
  enableNetwork: vi.fn().mockResolvedValue(null),
  clearPersistence: vi.fn().mockResolvedValue(null),
  terminate: vi.fn().mockResolvedValue(null),
  waitForPendingWrites: vi.fn().mockResolvedValue(null),
  onSnapshotsInSync: vi.fn(() => vi.fn())
};

// Export the mock Firebase services
export const app = mockApp;
export const auth = mockAuth;
export const db = mockDb;
