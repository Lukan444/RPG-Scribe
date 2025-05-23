/**
 * Global Vitest setup file for RPG Scribe
 *
 * This file sets up the test environment for all tests in the application.
 * It includes polyfills for browser APIs, mocks for browser objects,
 * and mocks for Firebase services.
 */

import '@testing-library/jest-dom';
import { expect } from 'vitest';

// Extend Vitest's expect with jest-dom matchers
// Note: We don't need to explicitly import matchers as they're automatically
// added to the global expect object when importing '@testing-library/jest-dom'
import { vi } from 'vitest';
import { TextEncoder, TextDecoder } from 'util';

// Set up TextEncoder and TextDecoder polyfills
if (typeof global.TextEncoder === 'undefined' || typeof global.TextDecoder === 'undefined') {
  // Use type assertion to avoid TypeScript errors
  global.TextEncoder = TextEncoder as any;
  global.TextDecoder = TextDecoder as any;
  console.log('Added TextEncoder and TextDecoder polyfills from Node.js util');
}

// Set up other browser globals that might be missing
if (typeof global.URL.createObjectURL === 'undefined') {
  Object.defineProperty(global.URL, 'createObjectURL', { value: vi.fn() });
}

// Add fetch polyfill if needed
if (typeof global.fetch === 'undefined') {
  global.fetch = vi.fn();
  global.Headers = vi.fn() as any;
  global.Request = vi.fn() as any;
  global.Response = vi.fn() as any;
}

// Mock getComputedStyle
const { getComputedStyle } = window;
window.getComputedStyle = (elt) => getComputedStyle(elt);

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Add matchMedia polyfill for Mantine components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for Mantine components
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

// Mock requestAnimationFrame for Mantine components
global.requestAnimationFrame = (callback) => {
  setTimeout(callback, 0);
  return 0;
};

// Mock cancelAnimationFrame for Mantine components
global.cancelAnimationFrame = vi.fn();

// Add crypto polyfill if needed
if (typeof global.crypto === 'undefined' || !global.crypto.subtle) {
  const crypto = require('crypto');

  // Create a minimal implementation of the Web Crypto API
  global.crypto = {
    getRandomValues: function(buffer) {
      return crypto.randomFillSync(buffer);
    },
    randomUUID: function() {
      // Generate a UUID v4 using Node.js crypto
      return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
    subtle: {
      digest: async function(algorithm: any, data: any) {
        const algorithmStr = typeof algorithm === 'string'
          ? algorithm
          : (algorithm as any).name || 'sha-256';
        const hash = crypto.createHash(algorithmStr.toLowerCase().replace('-', ''));
        hash.update(data);
        return Promise.resolve(hash.digest());
      }
    } as SubtleCrypto
  };
}

// Mock localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock the console.error to avoid cluttering the test output
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' && (
      args[0].includes('Warning:') ||
      args[0].includes('Error:') ||
      args[0].includes('Firebase:') ||
      args[0].includes('auth/') ||
      args[0].includes('firestore/')
    )
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Mock Firebase modules
vi.mock('firebase/app', () => {
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

  return {
    initializeApp: vi.fn().mockReturnValue(mockApp),
    getApp: vi.fn().mockReturnValue(mockApp),
    deleteApp: vi.fn().mockResolvedValue(undefined),
    getApps: vi.fn().mockReturnValue([mockApp]),
    onLog: vi.fn(),
    setLogLevel: vi.fn(),
    FirebaseError: class FirebaseError extends Error {
      code: string;
      customData?: any;

      constructor(code: string, message: string, customData?: any) {
        super(message);
        this.code = code;
        this.customData = customData;
        this.name = 'FirebaseError';
      }
    }
  };
});

// Mock Firebase Auth
vi.mock('firebase/auth', () => {
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

  return {
    getAuth: vi.fn().mockReturnValue(mockAuth),
    onAuthStateChanged: mockAuth.onAuthStateChanged,
    signInWithEmailAndPassword: mockAuth.signInWithEmailAndPassword,
    createUserWithEmailAndPassword: mockAuth.createUserWithEmailAndPassword,
    signInWithPopup: mockAuth.signInWithPopup,
    signOut: mockAuth.signOut,
    sendPasswordResetEmail: mockAuth.sendPasswordResetEmail,
    confirmPasswordReset: mockAuth.confirmPasswordReset,
    setPersistence: mockAuth.setPersistence,
    browserLocalPersistence: 'local',
    GoogleAuthProvider: vi.fn(() => ({ addScope: vi.fn() })),
    FacebookAuthProvider: vi.fn(() => ({})),
    TwitterAuthProvider: vi.fn(() => ({})),
    GithubAuthProvider: vi.fn(() => ({})),
    User: class User {}
  };
});

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => {
  // Mock document snapshot
  class MockDocumentSnapshot {
    id: string;
    private _data: Record<string, any>;
    private _exists: boolean;

    constructor(id: string, data: Record<string, any> | null) {
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

  // Mock query snapshot
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

  // Mock document reference
  class MockDocumentReference {
    id: string;
    path: string;
    private _data: Record<string, any> | null;

    constructor(id: string, data: Record<string, any> | null, path?: string) {
      this.id = id;
      this._data = data || {};
      this.path = path || `mocks/${id}`;
    }

    get() {
      return Promise.resolve(new MockDocumentSnapshot(this.id, this._data));
    }

    set(data: Record<string, any>) {
      this._data = { ...this._data as Record<string, any>, ...data };
      return Promise.resolve();
    }

    update(data: Record<string, any>) {
      this._data = { ...this._data as Record<string, any>, ...data };
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

  // Mock collection reference
  class MockCollectionReference {
    id: string;
    private _docs: Record<string, MockDocumentReference>;

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

    add(data: Record<string, any>) {
      const id = 'auto-id-' + Math.random().toString(36).substring(2, 15);
      const docRef = this.doc(id);
      docRef.set(data);
      return Promise.resolve(docRef);
    }

    get() {
      const docs = Object.values(this._docs).map(
        (docRef: MockDocumentReference) => new MockDocumentSnapshot(docRef.id, docRef['_data'] as Record<string, any>)
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
        (docRef: MockDocumentReference) => new MockDocumentSnapshot(docRef.id, docRef['_data'] as Record<string, any>)
      );
      callback(new MockQuerySnapshot(docs));
      return vi.fn(); // Unsubscribe function
    }
  }

  // Mock Firestore
  const firestoreMock = {
    collection: vi.fn(path => new MockCollectionReference(path)),
    doc: vi.fn(path => {
      // Add type checking before splitting the path
      if (typeof path !== 'string') {
        console.warn(`Firestore doc() called with non-string path: ${path}`);
        // Return a mock document reference with a default ID
        return new MockDocumentReference('mock-id', {}, 'mock-path');
      }

      const parts = path.split('/');
      const id = parts[parts.length - 1] || 'mock-id';
      return new MockDocumentReference(id, {}, path);
    }),
    batch: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(null)
    })),
    runTransaction: vi.fn(updateFunction => {
      return Promise.resolve(updateFunction({
        get: vi.fn().mockImplementation(docRef => {
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

  return {
    getFirestore: vi.fn().mockReturnValue(firestoreMock),
    collection: firestoreMock.collection,
    doc: firestoreMock.doc,
    getDoc: vi.fn().mockImplementation(docRef => docRef.get()),
    getDocs: vi.fn().mockImplementation(query => query.get()),
    setDoc: vi.fn().mockImplementation((docRef, data) => docRef.set(data)),
    updateDoc: vi.fn().mockImplementation((docRef, data) => docRef.update(data)),
    deleteDoc: vi.fn().mockImplementation(docRef => docRef.delete()),
    query: vi.fn().mockImplementation((collectionRef, ...constraints) => collectionRef),
    where: vi.fn().mockReturnValue({}),
    orderBy: vi.fn().mockReturnValue({}),
    limit: vi.fn().mockReturnValue({}),
    startAfter: vi.fn().mockReturnValue({}),
    serverTimestamp: vi.fn().mockReturnValue(new Date().toISOString()),
    Timestamp: {
      now: vi.fn().mockReturnValue({
        toDate: vi.fn().mockReturnValue(new Date()),
        toMillis: vi.fn().mockReturnValue(Date.now())
      }),
      fromDate: vi.fn(date => ({
        toDate: vi.fn().mockReturnValue(date),
        toMillis: vi.fn().mockReturnValue(date.getTime())
      }))
    },
    FieldValue: {
      serverTimestamp: vi.fn().mockReturnValue(new Date().toISOString()),
      increment: vi.fn(n => n),
      arrayUnion: vi.fn((...elements) => elements),
      arrayRemove: vi.fn((...elements) => elements),
      delete: vi.fn()
    },
    enableIndexedDbPersistence: vi.fn().mockResolvedValue({}),
    disableNetwork: vi.fn().mockResolvedValue({}),
    enableNetwork: vi.fn().mockResolvedValue({}),
    clearPersistence: vi.fn().mockResolvedValue({}),
    terminate: vi.fn().mockResolvedValue({}),
    waitForPendingWrites: vi.fn().mockResolvedValue({}),
    onSnapshotsInSync: vi.fn(() => vi.fn()),
    writeBatch: vi.fn(() => firestoreMock.batch()),
    runTransaction: firestoreMock.runTransaction,
    getCountFromServer: vi.fn().mockResolvedValue({ data: () => ({ count: 0 }) })
  };
});

// Mock Firebase Storage
vi.mock('firebase/storage', () => {
  return {
    getStorage: vi.fn(),
    ref: vi.fn(),
    uploadBytes: vi.fn(),
    getDownloadURL: vi.fn(),
    deleteObject: vi.fn(),
  };
});

// Mock the firebase/config.ts file
vi.mock('../firebase/config', () => {
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

  // Mock Firestore
  const mockDb = {
    collection: vi.fn(path => ({
      doc: vi.fn(id => ({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: vi.fn().mockReturnValue({ id, path }),
          id
        }),
        set: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({})
      })),
      add: vi.fn().mockResolvedValue({
        id: 'mock-doc-id',
        path: `${path}/mock-doc-id`
      }),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        docs: [],
        empty: true,
        size: 0,
        forEach: vi.fn()
      })
    })),
    doc: vi.fn(path => ({
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: vi.fn().mockReturnValue({ path }),
        id: path.split('/').pop()
      }),
      set: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({})
    })),
    batch: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue({})
    })),
    runTransaction: vi.fn(fn => Promise.resolve(fn({
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: vi.fn().mockReturnValue({}),
        id: 'mock-doc-id'
      }),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    })))
  };

  return {
    app: mockApp,
    auth: mockAuth,
    db: mockDb
  };
});

// Mock the EntityType enum from models
vi.mock('../models/EntityType', () => {
  return {
    EntityType: {
      CHARACTER: 'CHARACTER',
      LOCATION: 'LOCATION',
      ITEM: 'ITEM',
      EVENT: 'EVENT',
      SESSION: 'SESSION',
      FACTION: 'FACTION',
      STORY_ARC: 'STORY_ARC',
      CAMPAIGN: 'CAMPAIGN',
      RPG_WORLD: 'RPG_WORLD',
      NOTE: 'NOTE'
    },
    getEntityTypeDisplayName: vi.fn((type) => {
      switch (type) {
        case 'CHARACTER': return 'Character';
        case 'LOCATION': return 'Location';
        case 'ITEM': return 'Item';
        case 'EVENT': return 'Event';
        case 'SESSION': return 'Session';
        case 'FACTION': return 'Faction';
        case 'STORY_ARC': return 'Story Arc';
        case 'CAMPAIGN': return 'Campaign';
        case 'RPG_WORLD': return 'RPG World';
        case 'NOTE': return 'Note';
        default: return 'Unknown';
      }
    }),
    getEntityCollectionPath: vi.fn((type, parentId) => {
      switch (type) {
        case 'CHARACTER': return parentId ? `campaigns/${parentId}/characters` : 'characters';
        case 'LOCATION': return parentId ? `campaigns/${parentId}/locations` : 'locations';
        case 'ITEM': return parentId ? `campaigns/${parentId}/items` : 'items';
        case 'EVENT': return parentId ? `campaigns/${parentId}/events` : 'events';
        case 'SESSION': return parentId ? `campaigns/${parentId}/sessions` : 'sessions';
        case 'FACTION': return parentId ? `campaigns/${parentId}/factions` : 'factions';
        case 'STORY_ARC': return parentId ? `campaigns/${parentId}/storyArcs` : 'storyArcs';
        case 'CAMPAIGN': return parentId ? `worlds/${parentId}/campaigns` : 'campaigns';
        case 'RPG_WORLD': return 'worlds';
        case 'NOTE': return parentId ? `campaigns/${parentId}/notes` : 'notes';
        default: return 'unknown';
      }
    }),
    isValidEntityType: vi.fn((type) => {
      const validTypes = [
        'CHARACTER', 'LOCATION', 'ITEM', 'EVENT', 'SESSION',
        'FACTION', 'STORY_ARC', 'CAMPAIGN', 'RPG_WORLD', 'NOTE'
      ];
      return validTypes.includes(type);
    }),
    getAllEntityTypes: vi.fn(() => [
      'CHARACTER', 'LOCATION', 'ITEM', 'EVENT', 'SESSION',
      'FACTION', 'STORY_ARC', 'CAMPAIGN', 'RPG_WORLD', 'NOTE'
    ])
  };
});

// Mock the EntityType enum from relationship.service.ts
vi.mock('../services/relationship.service', () => {
  const originalModule = vi.importActual('../services/relationship.service');

  return {
    ...originalModule,
    EntityType: {
      CHARACTER: 'CHARACTER',
      LOCATION: 'LOCATION',
      ITEM: 'ITEM',
      EVENT: 'EVENT',
      SESSION: 'SESSION',
      FACTION: 'FACTION',
      STORYARC: 'STORY_ARC',
      NOTE: 'NOTE'
    }
  };
});

// Mock the EntityType enum from models/Relationship.ts
vi.mock('../models/Relationship', () => {
  const originalModule = vi.importActual('../models/Relationship');

  return {
    ...originalModule,
    EntityType: {
      CHARACTER: 'character',
      LOCATION: 'location',
      ITEM: 'item',
      EVENT: 'event',
      SESSION: 'session',
      CAMPAIGN: 'campaign',
      RPGWORLD: 'rpgworld',
      NOTE: 'note'
    }
  };
});

// Mock the EntityType enum from entityRelationships.service.ts
vi.mock('../services/entityRelationships.service', () => {
  const originalModule = vi.importActual('../services/entityRelationships.service');

  return {
    ...originalModule,
    EntityType: {
      CHARACTER: 'character',
      LOCATION: 'location',
      ITEM: 'item',
      EVENT: 'event',
      SESSION: 'session',
      CAMPAIGN: 'campaign',
      RPGWORLD: 'rpgworld',
      NOTE: 'note'
    }
  };
});
