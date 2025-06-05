import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  limit,
  startAfter,
  endBefore,
  startAt,
  endAt,
  DocumentData,
  QueryConstraint,
  DocumentReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  runTransaction,
  Transaction,
  FirestoreError,
  where,
  orderBy,
  WhereFilterOp,
  OrderByDirection,
  getCountFromServer,
  AggregateQuerySnapshot,
  count,
  sum,
  average,
  getAggregateFromServer,
  AggregateField,
  AggregateSpec,
  enableIndexedDbPersistence,
  disableNetwork,
  enableNetwork,
  waitForPendingWrites,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getApp } from 'firebase/app';

/**
 * Generic Firestore service for CRUD operations
 */
// Static variables for offline persistence
let persistenceEnabled = false;
let networkEnabled = true;
let pendingOperations: Array<() => Promise<any>> = [];

// Performance monitoring
const performanceMetrics: {
  [operation: string]: {
    count: number;
    totalTime: number;
    maxTime: number;
    minTime: number;
    errors: number;
  };
} = {};

// Add trackPerformance to window object
declare global {
  interface Window {
    trackPerformance: (operation: string, startTime: number, success: boolean) => void;
  }
}

/**
 * Track the performance of an operation
 * @param operation Operation name
 * @param startTime Start time
 * @param success Whether the operation was successful
 */
function trackPerformance(operation: string, startTime: number, success: boolean): void {
  const endTime = performance.now();
  const duration = endTime - startTime;

  if (!performanceMetrics[operation]) {
    performanceMetrics[operation] = {
      count: 0,
      totalTime: 0,
      maxTime: 0,
      minTime: Number.MAX_VALUE,
      errors: 0
    };
  }

  const metrics = performanceMetrics[operation];
  metrics.count++;
  metrics.totalTime += duration;
  metrics.maxTime = Math.max(metrics.maxTime, duration);
  metrics.minTime = Math.min(metrics.minTime, duration);

  if (!success) {
    metrics.errors++;
  }

  // Log slow operations (over 1 second)
  if (duration > 1000) {
    console.warn(`Slow operation: ${operation} took ${Math.round(duration)}ms`);
  }
}

/**
 * Get performance metrics for all operations
 * @returns Performance metrics
 */
export function getPerformanceMetrics(): {
  [operation: string]: {
    count: number;
    avgTime: number;
    maxTime: number;
    minTime: number;
    errorRate: number;
  };
} {
  const result: {
    [operation: string]: {
      count: number;
      avgTime: number;
      maxTime: number;
      minTime: number;
      errorRate: number;
    };
  } = {};

  for (const [operation, metrics] of Object.entries(performanceMetrics)) {
    result[operation] = {
      count: metrics.count,
      avgTime: metrics.count > 0 ? metrics.totalTime / metrics.count : 0,
      maxTime: metrics.maxTime,
      minTime: metrics.minTime === Number.MAX_VALUE ? 0 : metrics.minTime,
      errorRate: metrics.count > 0 ? metrics.errors / metrics.count : 0
    };
  }

  return result;
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics(): void {
  for (const key of Object.keys(performanceMetrics)) {
    delete performanceMetrics[key];
  }
}

// Assign trackPerformance to window object
window.trackPerformance = trackPerformance;

// Custom error types
export class CustomFirestoreError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'CustomFirestoreError';
    this.code = code;
  }
}

export class NetworkError extends CustomFirestoreError {
  constructor(message: string) {
    super(message, 'network-error');
    this.name = 'NetworkError';
  }
}

export class OfflineError extends CustomFirestoreError {
  constructor(message: string) {
    super(message, 'offline');
    this.name = 'OfflineError';
  }
}

export class PermissionError extends CustomFirestoreError {
  constructor(message: string) {
    super(message, 'permission-denied');
    this.name = 'PermissionError';
  }
}

export class NotFoundError extends CustomFirestoreError {
  constructor(message: string) {
    super(message, 'not-found');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends CustomFirestoreError {
  constructor(message: string) {
    super(message, 'validation-error');
    this.name = 'ValidationError';
  }
}

/**
 * Convert a Firebase error to a custom error
 * @param error Firebase error
 * @returns Custom error
 */
export function convertFirebaseError(error: any): Error {
  if (!error) {
    return new Error('Unknown error');
  }

  // If it's already a custom error, return it
  if (error instanceof CustomFirestoreError) {
    return error;
  }

  // Check if it's a Firebase error with a code
  if (error.code) {
    switch (error.code) {
      case 'permission-denied':
        return new PermissionError(error.message || 'Permission denied');
      case 'not-found':
        return new NotFoundError(error.message || 'Document not found');
      case 'unavailable':
        return new NetworkError(error.message || 'Service unavailable');
      case 'failed-precondition':
        return new CustomFirestoreError(error.message || 'Operation failed', 'failed-precondition');
      case 'invalid-argument':
        return new ValidationError(error.message || 'Invalid argument');
      default:
        return new CustomFirestoreError(error.message || 'Firestore error', error.code);
    }
  }

  // If it's a network error
  if (error.message && (
    error.message.includes('network') ||
    error.message.includes('connection') ||
    error.message.includes('offline')
  )) {
    return new NetworkError(error.message);
  }

  // Default to the original error
  return error;
}

/**
 * Execute a function with retry logic
 * @param operation Function to execute
 * @param maxAttempts Maximum number of retry attempts
 * @param shouldRetry Function to determine if retry should be attempted
 * @returns Result of the operation
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  shouldRetry: (error: any) => boolean = (error) => {
    // Default retry on network errors
    if (error instanceof NetworkError) {
      return true;
    }

    // Retry on Firebase unavailable errors
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
      return true;
    }

    return false;
  }
): Promise<T> {
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      return await operation();
    } catch (error) {
      lastError = convertFirebaseError(error);

      // Check if we should retry
      if (shouldRetry(lastError) && attempts < maxAttempts) {
        // Calculate exponential backoff with jitter
        const backoffMs = Math.min(
          1000 * Math.pow(2, attempts - 1) + Math.random() * 1000,
          60000 // Max 60 seconds
        );

        console.warn(
          `Operation failed (attempt ${attempts}/${maxAttempts}), retrying in ${Math.round(backoffMs / 1000)}s:`,
          lastError
        );

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      } else {
        // No more retries, throw the error
        throw lastError;
      }
    }
  }

  // This should never happen, but TypeScript requires it
  throw lastError || new Error('Unknown error');
}

/**
 * Initialize offline persistence for Firestore
 * @returns Promise that resolves when persistence is enabled
 * @deprecated Persistence is now handled automatically by the modern cache API in firebase/config.ts
 */
export async function initializeFirestorePersistence(): Promise<void> {
  if (persistenceEnabled) {
    console.log('Firestore persistence already enabled via modern cache API');
    return;
  }

  // Persistence is now handled automatically by initializeFirestore with persistentLocalCache
  persistenceEnabled = true;
  console.log('Firestore persistence handled by modern cache API');
}

/**
 * Check if the app is online
 * @returns True if online
 */
export function isOnline(): boolean {
  return navigator.onLine && networkEnabled;
}

/**
 * Disable network access for Firestore
 * This forces the SDK to use only cached data
 * @returns Promise that resolves when network is disabled
 */
export async function disableFirestoreNetwork(): Promise<void> {
  if (!networkEnabled) {
    return;
  }

  try {
    await disableNetwork(db);
    networkEnabled = false;
    console.log('Firestore network disabled');
  } catch (error) {
    console.error('Error disabling Firestore network:', error);
    throw error;
  }
}

/**
 * Enable network access for Firestore
 * @returns Promise that resolves when network is enabled
 */
export async function enableFirestoreNetwork(): Promise<void> {
  if (networkEnabled) {
    return;
  }

  try {
    await enableNetwork(db);
    networkEnabled = true;
    console.log('Firestore network enabled');

    // Process any pending operations
    for (const operation of pendingOperations) {
      try {
        await operation();
      } catch (error) {
        console.error('Error processing pending operation:', error);
      }
    }

    // Clear pending operations
    pendingOperations = [];
  } catch (error) {
    console.error('Error enabling Firestore network:', error);
    throw error;
  }
}

/**
 * Wait for all pending writes to be acknowledged by the server
 * @returns Promise that resolves when all pending writes are acknowledged
 */
export async function waitForPendingFirestoreWrites(): Promise<void> {
  try {
    await waitForPendingWrites(db);
    console.log('All pending Firestore writes acknowledged');
  } catch (error) {
    console.error('Error waiting for pending Firestore writes:', error);
    throw error;
  }
}

// Simple in-memory cache
const memoryCache: Map<string, {
  data: any;
  timestamp: number;
  ttl: number;
}> = new Map();

/**
 * Data transformer interface
 * Used to transform data before writing to Firestore and after reading from Firestore
 */
export interface DataTransformer<T> {
  /**
   * Transform data before writing to Firestore
   * @param data Data to transform
   * @returns Transformed data
   */
  toFirestore(data: T): DocumentData;

  /**
   * Transform data after reading from Firestore
   * @param data Data from Firestore
   * @returns Transformed data
   */
  fromFirestore(data: DocumentData): T;
}

/**
 * Default data transformer that doesn't transform anything
 */
export class DefaultDataTransformer<T extends DocumentData> implements DataTransformer<T> {
  toFirestore(data: T): DocumentData {
    return data;
  }

  fromFirestore(data: DocumentData): T {
    return data as T;
  }
}

/**
 * Date transformer that converts Date objects to Firestore timestamps and vice versa
 */
export class DateTransformer<T extends DocumentData> implements DataTransformer<T> {
  private dateFields: string[];

  constructor(dateFields: string[]) {
    this.dateFields = dateFields;
  }

  toFirestore(data: T): DocumentData {
    const result = { ...data } as any;

    for (const field of this.dateFields) {
      if (result[field] instanceof Date) {
        result[field] = serverTimestamp();
      }
    }

    return result;
  }

  fromFirestore(data: DocumentData): T {
    const result = { ...data } as any;

    for (const field of this.dateFields) {
      if (result[field] && typeof result[field].toDate === 'function') {
        result[field] = result[field].toDate();
      }
    }

    return result as T;
  }
}

/**
 * Validator interface
 * Used to validate data before writing to Firestore
 */
export interface Validator<T> {
  /**
   * Validate data before writing to Firestore
   * @param data Data to validate
   * @returns True if valid, error message if invalid
   */
  validate(data: T): boolean | string;
}

export class FirestoreService<T extends DocumentData> {
  protected collectionPath: string;

  // Registry to track active listeners
  private listeners: Map<string, {
    unsubscribe: Unsubscribe;
    type: 'document' | 'query';
    path: string;
    queryId?: string;
  }> = new Map();

  // Queue for offline operations
  private offlineQueue: Array<{
    operation: 'create' | 'update' | 'delete';
    id?: string;
    data?: Partial<T>;
    timestamp: number;
  }> = [];

  // Cache settings
  private cachingEnabled: boolean = true;
  private defaultCacheTTL: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Data transformation and validation
  private transformer: DataTransformer<T>;
  private validator?: Validator<T>;

  /**
   * Create a new FirestoreService
   * @param collectionPath Path to the collection
   * @param options Service options
   */
  constructor(
    collectionPath: string,
    options: {
      cachingEnabled?: boolean;
      defaultCacheTTL?: number;
      transformer?: DataTransformer<T>;
      validator?: Validator<T>;
    } = {}
  ) {
    this.collectionPath = collectionPath;

    // Set options
    if (options.cachingEnabled !== undefined) {
      this.cachingEnabled = options.cachingEnabled;
    }

    if (options.defaultCacheTTL !== undefined) {
      this.defaultCacheTTL = options.defaultCacheTTL;
    }

    // Set transformer and validator
    this.transformer = options.transformer || new DefaultDataTransformer<T>();
    this.validator = options.validator;

    // Add online/offline event listeners
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  /**
   * Set the data transformer
   * @param transformer Data transformer
   */
  setTransformer(transformer: DataTransformer<T>): void {
    this.transformer = transformer;
  }

  /**
   * Set the data validator
   * @param validator Data validator
   */
  setValidator(validator: Validator<T>): void {
    this.validator = validator;
  }

  /**
   * Enable or disable caching
   * @param enabled Whether caching is enabled
   */
  setCachingEnabled(enabled: boolean): void {
    this.cachingEnabled = enabled;
  }

  /**
   * Set the default cache TTL
   * @param ttl Time to live in milliseconds
   */
  setDefaultCacheTTL(ttl: number): void {
    this.defaultCacheTTL = ttl;
  }

  /**
   * Get a cached item
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   */
  private getCachedItem<D>(key: string): D | null {
    if (!this.cachingEnabled) {
      return null;
    }

    const item = memoryCache.get(key);

    if (!item) {
      return null;
    }

    // Check if the item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      memoryCache.delete(key);
      return null;
    }

    return item.data as D;
  }

  /**
   * Set a cached item
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (optional, uses default if not provided)
   */
  private setCachedItem<D>(key: string, data: D, ttl?: number): void {
    if (!this.cachingEnabled) {
      return;
    }

    memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultCacheTTL
    });
  }

  /**
   * Delete a cached item
   * @param key Cache key
   */
  private deleteCachedItem(key: string): void {
    memoryCache.delete(key);
  }

  /**
   * Clear all cached items for this collection
   */
  clearCache(): void {
    // Delete all cache entries that start with this collection path
    const prefix = `${this.collectionPath}:`;

    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryCache.delete(key);
      }
    }
  }

  /**
   * Generate a cache key for a document
   * @param id Document ID
   * @returns Cache key
   */
  private generateDocumentCacheKey(id: string): string {
    return `${this.collectionPath}:doc:${id}`;
  }

  /**
   * Generate a cache key for a query
   * @param constraints Query constraints
   * @param pageSize Page size
   * @param startAfterId Start after document ID (for pagination)
   * @returns Cache key
   */
  private generateQueryCacheKey(
    constraints: QueryConstraint[],
    pageSize: number,
    startAfterId?: string
  ): string {
    const constraintsStr = JSON.stringify(constraints);
    const paginationStr = startAfterId ? `:after:${startAfterId}` : '';
    return `${this.collectionPath}:query:${constraintsStr}:size:${pageSize}${paginationStr}`;
  }

  /**
   * Handle online event
   */
  private async handleOnline(): Promise<void> {
    console.log('App is online, processing offline queue');
    await this.processOfflineQueue();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('App is offline, operations will be queued');
  }

  /**
   * Process the offline operation queue
   * @returns Promise that resolves when all operations are processed
   */
  private async processOfflineQueue(): Promise<void> {
    if (!isOnline() || this.offlineQueue.length === 0) {
      return;
    }

    console.log(`Processing ${this.offlineQueue.length} offline operations`);

    // Sort by timestamp to maintain order
    const sortedQueue = [...this.offlineQueue].sort((a, b) => a.timestamp - b.timestamp);

    // Group operations by type for batch processing
    const creates: Array<{ id?: string; data?: Partial<T> }> = [];
    const updates: Array<{ id: string; data: Partial<T> }> = [];
    const deletes: string[] = [];

    for (const op of sortedQueue) {
      switch (op.operation) {
        case 'create':
          if (op.data) {
            creates.push({ id: op.id, data: op.data });
          }
          break;
        case 'update':
          if (op.id && op.data) {
            updates.push({ id: op.id, data: op.data });
          }
          break;
        case 'delete':
          if (op.id) {
            deletes.push(op.id);
          }
          break;
      }
    }

    try {
      // Process creates
      if (creates.length > 0) {
        const createOperations = creates.map(item => ({
          type: 'create' as const,
          id: item.id,
          data: item.data
        }));
        await this.batchWrite(createOperations);
      }

      // Process updates
      if (updates.length > 0) {
        const updateOperations = updates.map(item => ({
          type: 'update' as const,
          id: item.id,
          data: item.data
        }));
        await this.batchWrite(updateOperations);
      }

      // Process deletes
      if (deletes.length > 0) {
        const deleteOperations = deletes.map(id => ({
          type: 'delete' as const,
          id
        }));
        await this.batchWrite(deleteOperations);
      }

      // Clear the queue
      this.offlineQueue = [];
      console.log('Offline queue processed successfully');
    } catch (error) {
      console.error('Error processing offline queue:', error);
      // Keep failed operations in the queue
      // We could implement more sophisticated retry logic here
    }
  }

  /**
   * Generate a unique listener ID
   * @param type Listener type
   * @param path Document path or collection path
   * @param queryId Optional query identifier for query listeners
   * @returns Unique listener ID
   */
  private generateListenerId(type: 'document' | 'query', path: string, queryId?: string): string {
    return `${type}:${path}${queryId ? `:${queryId}` : ''}`;
  }

  /**
   * Get a document reference
   * @param id Document ID
   * @returns Document reference
   */
  protected getDocRef(id: string): DocumentReference<DocumentData> {
    return doc(db, this.collectionPath, id);
  }

  /**
   * Create a new document
   * @param data Document data
   * @param id Document ID (optional, will be generated if not provided)
   * @param options Options for the operation
   * @returns Document ID
   */
  async create(
    data: T,
    id?: string,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: T) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<string> {
    const {
      forceServer = false,
      offlineSupport = true,
      maxRetries = 3,
      validateData,
      skipTransform = false,
      skipValidation = false,
      trackPerformance = true
    } = options;

    // Start performance tracking
    const startTime = trackPerformance ? performance.now() : 0;
    let success = false;

    try {
      // Validate data using the provided function or the service validator
      if (!skipValidation) {
        // Use the provided validation function if available
        if (validateData) {
          const validationResult = validateData(data);
          if (validationResult !== true) {
            const errorMessage = typeof validationResult === 'string'
              ? validationResult
              : 'Data validation failed';
            throw new ValidationError(errorMessage);
          }
        }

        // Use the service validator if available
        if (this.validator) {
          const validationResult = this.validator.validate(data);
          if (validationResult !== true) {
            const errorMessage = typeof validationResult === 'string'
              ? validationResult
              : 'Data validation failed';
            throw new ValidationError(errorMessage);
          }
        }
      }

      const docRef = id
        ? this.getDocRef(id)
        : doc(collection(db, this.collectionPath));

      const docId = docRef.id;

      // Transform data if not skipped
      let transformedData: DocumentData = data;
      if (!skipTransform) {
        transformedData = this.transformer.toFirestore(data);
      }

      // Add timestamps
      const dataWithTimestamps = {
        ...transformedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Check if we're offline and offline support is enabled
      if (!isOnline() && offlineSupport) {
        console.log(`Queuing create operation for document ${docId} (offline)`);
        this.offlineQueue.push({
          operation: 'create',
          id: docId,
          data: dataWithTimestamps as unknown as Partial<T>,
          timestamp: Date.now()
        });

        success = true;

        // Track performance if enabled
        if (trackPerformance) {
          window.trackPerformance('create:offline', startTime, success);
        }

        return docId;
      }

      // If we need to force server operation but we're offline
      if (forceServer && !isOnline()) {
        throw new OfflineError('Cannot create document: Force server option enabled but device is offline');
      }

      // Execute with retry logic
      await executeWithRetry(
        async () => {
          await setDoc(docRef, dataWithTimestamps);
        },
        maxRetries
      );

      // Invalidate cache for this document
      this.deleteCachedItem(this.generateDocumentCacheKey(docId));

      // Invalidate query cache for this collection
      this.clearCache();

      success = true;

      return docId;
    } catch (error) {
      const convertedError = convertFirebaseError(error);
      console.error('Error creating document:', convertedError);
      throw convertedError;
    } finally {
      // Track performance if enabled
      if (trackPerformance) {
        window.trackPerformance('create', startTime, success);
      }
    }
  }

  /**
   * Get a document by ID
   * @param id Document ID
   * @param options Options for the operation
   * @returns Document data or null if not found
   */
  async getById(
    id: string,
    options: {
      forceServer?: boolean;
      useCache?: boolean;
      cacheTTL?: number;
      skipTransform?: boolean;
      maxRetries?: number;
      trackPerformance?: boolean;
    } = {}
  ): Promise<T | null> {
    const {
      forceServer = false,
      useCache = true,
      cacheTTL,
      skipTransform = false,
      maxRetries = 3,
      trackPerformance = true
    } = options;

    // Start performance tracking
    const startTime = trackPerformance ? performance.now() : 0;
    let success = false;
    let fromCache = false;

    try {
      // Generate cache key
      const cacheKey = this.generateDocumentCacheKey(id);

      // Try to get from cache if enabled and not forcing server
      if (useCache && !forceServer && this.cachingEnabled) {
        const cachedData = this.getCachedItem<T>(cacheKey);
        if (cachedData) {
          success = true;
          fromCache = true;

          // Track performance if enabled
          if (trackPerformance) {
            window.trackPerformance('getById:cache', startTime, success);
          }

          return cachedData;
        }
      }

      // If we need to force server operation but we're offline
      if (forceServer && !isOnline()) {
        throw new OfflineError('Cannot get document: Force server option enabled but device is offline');
      }

      // Execute with retry logic
      const docSnap = await executeWithRetry(
        async () => getDoc(this.getDocRef(id)),
        maxRetries
      );

      if (docSnap.exists()) {
        // Get the raw data
        const rawData = { id: docSnap.id, ...docSnap.data() };

        // Transform the data if not skipped
        let data: T;
        if (skipTransform) {
          data = rawData as unknown as T;
        } else {
          data = this.transformer.fromFirestore(rawData);
        }

        // Cache the result if caching is enabled
        if (useCache && this.cachingEnabled) {
          this.setCachedItem(cacheKey, data, cacheTTL);
        }

        success = true;
        return data;
      }

      success = true;
      return null;
    } catch (error) {
      const convertedError = convertFirebaseError(error);
      console.error(`Error getting document ${id}:`, convertedError);
      throw convertedError;
    } finally {
      // Track performance if enabled and not already tracked (for cache hit)
      if (trackPerformance && !fromCache) {
        window.trackPerformance('getById', startTime, success);
      }
    }
  }

  /**
   * Get multiple documents by their IDs
   * @param ids Array of document IDs
   * @returns Array of document data
   */
  async getByIds(ids: string[]): Promise<T[]> {
    if (!ids.length) return [];

    const results: T[] = [];

    // Process in batches of 10 (Firestore 'in' query limit)
    const batchSize = 10;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize);

      const q = query(
        collection(db, this.collectionPath),
        where('__name__', 'in', batchIds)
      );

      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() } as unknown as T);
      });
    }

    return results;
  }

  /**
   * Update a document
   * @param id Document ID
   * @param data Document data to update
   * @param options Options for the operation
   * @returns True if successful
   */
  async update(
    id: string,
    data: Partial<T>,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
    } = {}
  ): Promise<boolean> {
    const { forceServer = false, offlineSupport = true } = options;

    try {
      // Add updated timestamp
      const dataWithTimestamp = {
        ...data,
        updatedAt: serverTimestamp()
      };

      // Check if we're offline and offline support is enabled
      if (!isOnline() && offlineSupport) {
        console.log(`Queuing update operation for document ${id} (offline)`);
        this.offlineQueue.push({
          operation: 'update',
          id,
          data: dataWithTimestamp,
          timestamp: Date.now()
        });
        return true;
      }

      // If we need to force server operation but we're offline
      if (forceServer && !isOnline()) {
        throw new Error('Cannot update document: Force server option enabled but device is offline');
      }

      await updateDoc(this.getDocRef(id), dataWithTimestamp);
      return true;
    } catch (error) {
      console.error(`Error updating document ${id}:`, error);
      return false;
    }
  }

  /**
   * Delete a document
   * @param id Document ID
   * @param options Options for the operation
   * @returns True if successful
   */
  async delete(
    id: string,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
    } = {}
  ): Promise<boolean> {
    const { forceServer = false, offlineSupport = true } = options;

    try {
      // Check if we're offline and offline support is enabled
      if (!isOnline() && offlineSupport) {
        console.log(`Queuing delete operation for document ${id} (offline)`);
        this.offlineQueue.push({
          operation: 'delete',
          id,
          timestamp: Date.now()
        });
        return true;
      }

      // If we need to force server operation but we're offline
      if (forceServer && !isOnline()) {
        throw new Error('Cannot delete document: Force server option enabled but device is offline');
      }

      await deleteDoc(this.getDocRef(id));
      return true;
    } catch (error) {
      console.error(`Error deleting document ${id}:`, error);
      return false;
    }
  }

  /**
   * Query documents with pagination
   * @param constraints Query constraints (where, orderBy, etc.)
   * @param pageSize Number of documents to return
   * @param startAfterDoc Document to start after (for pagination)
   * @param options Options for the operation
   * @returns Query results and last document for pagination
   */
  async query(
    constraints: QueryConstraint[] = [],
    pageSize: number = 10,
    startAfterDoc?: DocumentSnapshot<DocumentData>,
    options: {
      forceServer?: boolean;
      source?: 'default' | 'server' | 'cache';
      useCache?: boolean;
      cacheTTL?: number;
    } = {}
  ): Promise<{
    data: T[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    source: 'server' | 'cache';
  }> {
    const {
      forceServer = false,
      source = 'default',
      useCache = true,
      cacheTTL
    } = options;

    // Generate cache key if using cache
    const startAfterId = startAfterDoc ? startAfterDoc.id : undefined;
    const cacheKey = this.generateQueryCacheKey(constraints, pageSize, startAfterId);

    // Try to get from cache if enabled and not forcing server
    if (useCache && !forceServer && this.cachingEnabled) {
      const cachedResult = this.getCachedItem<{
        data: T[];
        lastDocId: string | null;
        source: 'server' | 'cache';
      }>(cacheKey);

      if (cachedResult) {
        // If we have a lastDocId, we need to convert it back to a DocumentSnapshot
        let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;

        if (cachedResult.lastDocId) {
          // We don't actually need the full document snapshot for pagination,
          // just the ID is enough for most cases
          lastDoc = {
            id: cachedResult.lastDocId,
            exists: () => true,
            data: () => ({}),
            ref: this.getDocRef(cachedResult.lastDocId)
          } as unknown as QueryDocumentSnapshot<DocumentData>;
        }

        return {
          data: cachedResult.data,
          lastDoc,
          source: cachedResult.source
        };
      }
    }

    try {
      // Build query with constraints
      let q = query(
        collection(db, this.collectionPath),
        ...constraints,
        limit(pageSize)
      );

      // Add startAfter for pagination if provided
      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }

      // If we need to force server operation but we're offline
      if (forceServer && !isOnline()) {
        throw new Error('Cannot query documents: Force server option enabled but device is offline');
      }

      // Determine the source based on options and network state
      let effectiveSource: 'default' | 'server' | 'cache' = source;
      if (source === 'default' && !isOnline()) {
        effectiveSource = 'cache';
      } else if (source === 'server' && !isOnline()) {
        throw new Error('Cannot query from server: Device is offline');
      }

      // Execute query with the appropriate source
      const querySnapshot = await getDocs(q);

      // Process results
      const data: T[] = [];
      let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;

      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as unknown as T);
        lastDoc = doc;
      });

      // Determine if the data came from cache or server
      const fromCache = querySnapshot.metadata.fromCache;
      const resultSource = fromCache ? 'cache' : 'server';

      // Cache the result if caching is enabled
      if (useCache && this.cachingEnabled) {
        this.setCachedItem(
          cacheKey,
          {
            data,
            lastDocId: lastDoc ? (lastDoc as DocumentSnapshot<DocumentData>).id : null,
            source: resultSource
          },
          cacheTTL
        );
      }

      return {
        data,
        lastDoc,
        source: resultSource
      };
    } catch (error) {
      console.error('Error querying documents:', error);
      return {
        data: [],
        lastDoc: null,
        source: 'cache' // Default to cache on error
      };
    }
  }

  /**
   * Query documents with advanced pagination options
   * @param options Query options
   * @returns Query results and pagination cursors
   */
  async queryAdvanced(options: {
    constraints?: QueryConstraint[];
    pageSize?: number;
    startAfterDoc?: DocumentSnapshot<DocumentData>;
    startAtDoc?: DocumentSnapshot<DocumentData>;
    endBeforeDoc?: DocumentSnapshot<DocumentData>;
    endAtDoc?: DocumentSnapshot<DocumentData>;
  } = {}): Promise<{
    data: T[];
    firstDoc: QueryDocumentSnapshot<DocumentData> | null;
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }> {
    try {
      const {
        constraints = [],
        pageSize = 10,
        startAfterDoc,
        startAtDoc,
        endBeforeDoc,
        endAtDoc
      } = options;

      // Build base query with constraints
      let q = query(
        collection(db, this.collectionPath),
        ...constraints,
        limit(pageSize)
      );

      // Add cursor constraints
      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      } else if (startAtDoc) {
        q = query(q, startAt(startAtDoc));
      }

      if (endBeforeDoc) {
        q = query(q, endBefore(endBeforeDoc));
      } else if (endAtDoc) {
        q = query(q, endAt(endAtDoc));
      }

      // Execute query
      const querySnapshot = await getDocs(q);

      // Process results
      const data: T[] = [];
      let firstDoc: QueryDocumentSnapshot<DocumentData> | null = null;
      let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;

      if (!querySnapshot.empty) {
        firstDoc = querySnapshot.docs[0];
        lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      }

      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as unknown as T);
      });

      return { data, firstDoc, lastDoc };
    } catch (error) {
      console.error('Error executing advanced query:', error);
      return { data: [], firstDoc: null, lastDoc: null };
    }
  }

  /**
   * Query documents with compound conditions
   * @param conditions Array of query conditions
   * @param orderByField Field to order by
   * @param orderDirection Order direction
   * @param pageSize Number of documents to return
   * @param startAfterDoc Document to start after (for pagination)
   * @returns Query results and last document for pagination
   */
  async queryCompound(
    conditions: Array<{
      field: string;
      operator: WhereFilterOp;
      value: any;
    }>,
    orderByField?: string,
    orderDirection?: OrderByDirection,
    pageSize: number = 10,
    startAfterDoc?: DocumentSnapshot<DocumentData>
  ): Promise<{
    data: T[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }> {
    try {
      // Build constraints from conditions
      const constraints: QueryConstraint[] = conditions.map(condition =>
        where(condition.field, condition.operator, condition.value)
      );

      // Add orderBy if provided
      if (orderByField) {
        constraints.push(orderBy(orderByField, orderDirection || 'asc'));
      }

      // Use the existing query method
      return this.query(constraints, pageSize, startAfterDoc);
    } catch (error) {
      console.error('Error executing compound query:', error);
      return { data: [], lastDoc: null };
    }
  }

  /**
   * Count documents matching query constraints
   * @param constraints Query constraints
   * @returns Count of matching documents
   */
  async count(constraints: QueryConstraint[] = []): Promise<number> {
    try {
      const q = query(collection(db, this.collectionPath), ...constraints);
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      console.error('Error counting documents:', error);
      return 0;
    }
  }

  /**
   * Perform aggregation query
   * @param aggregateSpecs Aggregation specifications
   * @param constraints Query constraints
   * @returns Aggregation results
   */
  async aggregate(
    aggregateSpecs: Record<string, AggregateField<any>>,
    constraints: QueryConstraint[] = []
  ): Promise<Record<string, any>> {
    try {
      const q = query(collection(db, this.collectionPath), ...constraints);
      const snapshot = await getAggregateFromServer(q, aggregateSpecs);
      return snapshot.data();
    } catch (error) {
      console.error('Error performing aggregation query:', error);
      return {};
    }
  }

  /**
   * Sum values of a numeric field
   * @param field Field to sum
   * @param constraints Query constraints
   * @returns Sum of field values
   */
  async sum(field: string, constraints: QueryConstraint[] = []): Promise<number> {
    try {
      const result = await this.aggregate({ sum: sum(field) }, constraints);
      return result.sum || 0;
    } catch (error) {
      console.error(`Error calculating sum for field ${field}:`, error);
      return 0;
    }
  }

  /**
   * Calculate average of a numeric field
   * @param field Field to average
   * @param constraints Query constraints
   * @returns Average of field values
   */
  async average(field: string, constraints: QueryConstraint[] = []): Promise<number> {
    try {
      const result = await this.aggregate({ average: average(field) }, constraints);
      return result.average || 0;
    } catch (error) {
      console.error(`Error calculating average for field ${field}:`, error);
      return 0;
    }
  }

  /**
   * Subscribe to real-time updates for a document
   * @param id Document ID
   * @param callback Function to call when document changes
   * @param options Options for the subscription
   * @returns Unsubscribe function
   */
  subscribeToDocument(
    id: string,
    callback: (data: T | null) => void,
    options: {
      listenerId?: string;
      onError?: (error: Error) => void;
    } = {}
  ): Unsubscribe {
    const docRef = this.getDocRef(id);
    const path = docRef.path;
    const listenerId = options.listenerId || this.generateListenerId('document', path);

    // Check if we already have an active listener for this document
    if (this.listeners.has(listenerId)) {
      console.warn(`Listener already exists for document ${path}. Returning existing listener.`);
      return this.listeners.get(listenerId)!.unsubscribe;
    }

    // Create the listener
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback({ id: docSnap.id, ...docSnap.data() } as unknown as T);
        } else {
          callback(null);
        }
      },
      options.onError || ((error) => console.error(`Error in document listener for ${path}:`, error))
    );

    // Register the listener
    this.listeners.set(listenerId, {
      unsubscribe,
      type: 'document',
      path
    });

    // Return a wrapped unsubscribe function that also removes from our registry
    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  /**
   * Subscribe to real-time updates for a query
   * @param constraints Query constraints
   * @param callback Function to call when query results change
   * @param options Options for the subscription
   * @returns Unsubscribe function
   */
  subscribeToQuery(
    constraints: QueryConstraint[] = [],
    callback: (data: T[]) => void,
    options: {
      queryId?: string;
      listenerId?: string;
      onError?: (error: Error) => void;
    } = {}
  ): Unsubscribe {
    const q = query(collection(db, this.collectionPath), ...constraints);
    const queryId = options.queryId || JSON.stringify(constraints);
    const listenerId = options.listenerId || this.generateListenerId('query', this.collectionPath, queryId);

    // Check if we already have an active listener for this query
    if (this.listeners.has(listenerId)) {
      console.warn(`Listener already exists for query ${queryId}. Returning existing listener.`);
      return this.listeners.get(listenerId)!.unsubscribe;
    }

    // Create the listener
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data: T[] = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as unknown as T);
        });
        callback(data);
      },
      options.onError || ((error) => console.error(`Error in query listener for ${queryId}:`, error))
    );

    // Register the listener
    this.listeners.set(listenerId, {
      unsubscribe,
      type: 'query',
      path: this.collectionPath,
      queryId
    });

    // Return a wrapped unsubscribe function that also removes from our registry
    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  /**
   * Get all active listeners
   * @returns Array of listener information
   */
  getActiveListeners(): Array<{
    id: string;
    type: 'document' | 'query';
    path: string;
    queryId?: string;
  }> {
    return Array.from(this.listeners.entries()).map(([id, info]) => ({
      id,
      type: info.type,
      path: info.path,
      queryId: info.queryId
    }));
  }

  /**
   * Unsubscribe from a specific listener
   * @param listenerId Listener ID
   * @returns True if successfully unsubscribed
   */
  unsubscribeListener(listenerId: string): boolean {
    const listener = this.listeners.get(listenerId);
    if (listener) {
      listener.unsubscribe();
      this.listeners.delete(listenerId);
      return true;
    }
    return false;
  }

  /**
   * Unsubscribe from all document listeners
   * @returns Number of listeners unsubscribed
   */
  unsubscribeAllDocumentListeners(): number {
    let count = 0;
    for (const [id, listener] of this.listeners.entries()) {
      if (listener.type === 'document') {
        listener.unsubscribe();
        this.listeners.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Unsubscribe from all query listeners
   * @returns Number of listeners unsubscribed
   */
  unsubscribeAllQueryListeners(): number {
    let count = 0;
    for (const [id, listener] of this.listeners.entries()) {
      if (listener.type === 'query') {
        listener.unsubscribe();
        this.listeners.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Unsubscribe from all listeners
   * @returns Number of listeners unsubscribed
   */
  unsubscribeAll(): number {
    let count = 0;
    for (const listener of this.listeners.values()) {
      listener.unsubscribe();
      count++;
    }
    this.listeners.clear();
    return count;
  }

  /**
   * Perform a batch write operation with automatic chunking
   * @param operations Array of operations to perform
   * @returns Object with success status and results
   */
  async batchWrite(
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      id?: string;
      data?: Partial<T>;
    }>
  ): Promise<{
    success: boolean;
    results: {
      successful: number;
      failed: number;
      errors: Array<{ operation: number; error: Error }>;
    };
  }> {
    // Firestore has a limit of 500 operations per batch
    const BATCH_LIMIT = 500;
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ operation: number; error: Error }>
    };

    try {
      // Split operations into batches
      const batches: Array<Array<{
        type: 'create' | 'update' | 'delete';
        id?: string;
        data?: Partial<T>;
        docRef: DocumentReference<DocumentData>;
      }>> = [];

      // Prepare operations and assign document references
      const preparedOperations = operations.map(op => {
        const docRef = op.id
          ? this.getDocRef(op.id)
          : doc(collection(db, this.collectionPath));

        return { ...op, docRef };
      });

      // Split into batches of BATCH_LIMIT
      for (let i = 0; i < preparedOperations.length; i += BATCH_LIMIT) {
        batches.push(preparedOperations.slice(i, i + BATCH_LIMIT));
      }

      // Process each batch
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batchOperations = batches[batchIndex];
        const batch = writeBatch(db);

        for (let opIndex = 0; opIndex < batchOperations.length; opIndex++) {
          const op = batchOperations[opIndex];
          const globalOpIndex = batchIndex * BATCH_LIMIT + opIndex;

          try {
            switch (op.type) {
              case 'create':
                if (!op.data) throw new Error('Data required for create operation');
                batch.set(op.docRef, {
                  ...op.data,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
                break;
              case 'update':
                if (!op.id) throw new Error('ID required for update operation');
                if (!op.data) throw new Error('Data required for update operation');
                batch.update(op.docRef, {
                  ...op.data,
                  updatedAt: serverTimestamp()
                });
                break;
              case 'delete':
                if (!op.id) throw new Error('ID required for delete operation');
                batch.delete(op.docRef);
                break;
            }
          } catch (error) {
            results.failed++;
            results.errors.push({
              operation: globalOpIndex,
              error: error as Error
            });
          }
        }

        // Commit the batch
        try {
          await batch.commit();
          results.successful += batchOperations.length - results.failed;
        } catch (error) {
          // If the batch fails, mark all operations in this batch as failed
          // that weren't already marked as failed
          const failedInThisBatch = results.errors.filter(
            e => Math.floor(e.operation / BATCH_LIMIT) === batchIndex
          ).length;

          const newlyFailed = batchOperations.length - failedInThisBatch;
          results.failed += newlyFailed;

          // Add a generic error for the batch
          results.errors.push({
            operation: batchIndex * BATCH_LIMIT,
            error: new Error(`Batch ${batchIndex} failed: ${(error as Error).message}`)
          });
        }
      }

      return {
        success: results.failed === 0,
        results
      };
    } catch (error) {
      console.error('Error performing batch operations:', error);
      return {
        success: false,
        results: {
          successful: 0,
          failed: operations.length,
          errors: [{
            operation: -1,
            error: error as Error
          }]
        }
      };
    }
  }

  /**
   * Create multiple documents in a batch
   * @param documents Array of documents to create
   * @returns Result of the batch operation
   */
  async createMultiple(documents: Array<T>): Promise<{
    success: boolean;
    ids: string[];
    results: {
      successful: number;
      failed: number;
      errors: Array<{ operation: number; error: Error }>;
    };
  }> {
    try {
      // Generate IDs for each document
      const operations = documents.map(doc => {
        const id = doc.id || this.generateId();
        return {
          type: 'create' as const,
          id,
          data: doc
        };
      });

      // Execute batch write
      const result = await this.batchWrite(operations);

      // Extract IDs of successfully created documents
      const ids = operations
        .filter((_, index) => !result.results.errors.some(e => e.operation === index))
        .map(op => op.id as string);

      return {
        success: result.success,
        ids,
        results: result.results
      };
    } catch (error) {
      console.error('Error creating multiple documents:', error);
      return {
        success: false,
        ids: [],
        results: {
          successful: 0,
          failed: documents.length,
          errors: [{
            operation: -1,
            error: error as Error
          }]
        }
      };
    }
  }

  /**
   * Update multiple documents in a batch
   * @param updates Array of document updates
   * @returns Result of the batch operation
   */
  async updateMultiple(updates: Array<{ id: string; data: Partial<T> }>): Promise<{
    success: boolean;
    results: {
      successful: number;
      failed: number;
      errors: Array<{ operation: number; error: Error }>;
    };
  }> {
    try {
      // Convert updates to batch operations
      const operations = updates.map(update => ({
        type: 'update' as const,
        id: update.id,
        data: update.data
      }));

      // Execute batch write
      return await this.batchWrite(operations);
    } catch (error) {
      console.error('Error updating multiple documents:', error);
      return {
        success: false,
        results: {
          successful: 0,
          failed: updates.length,
          errors: [{
            operation: -1,
            error: error as Error
          }]
        }
      };
    }
  }

  /**
   * Delete multiple documents in a batch
   * @param ids Array of document IDs to delete
   * @returns Result of the batch operation
   */
  async deleteMultiple(ids: string[]): Promise<{
    success: boolean;
    results: {
      successful: number;
      failed: number;
      errors: Array<{ operation: number; error: Error }>;
    };
  }> {
    try {
      // Convert IDs to batch operations
      const operations = ids.map(id => ({
        type: 'delete' as const,
        id
      }));

      // Execute batch write
      return await this.batchWrite(operations);
    } catch (error) {
      console.error('Error deleting multiple documents:', error);
      return {
        success: false,
        results: {
          successful: 0,
          failed: ids.length,
          errors: [{
            operation: -1,
            error: error as Error
          }]
        }
      };
    }
  }

  /**
   * Generate a unique ID for a document
   * @returns Unique ID
   */
  private generateId(): string {
    return doc(collection(db, this.collectionPath)).id;
  }

  /**
   * Execute a transaction with retry logic
   * @param updateFunction Function to execute within the transaction
   * @param maxAttempts Maximum number of retry attempts (default: 5)
   * @returns Result of the transaction
   */
  async executeTransaction<R>(
    updateFunction: (transaction: Transaction) => Promise<R>,
    maxAttempts: number = 5
  ): Promise<R> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        // Execute the transaction
        const result = await runTransaction(db, updateFunction);
        return result;
      } catch (error) {
        lastError = error as Error;

        // Check if the error is due to contention and we should retry
        if (this.shouldRetryTransaction(error as FirestoreError)) {
          // Calculate exponential backoff with jitter
          const backoffMs = Math.min(
            1000 * Math.pow(2, attempts - 1) + Math.random() * 1000,
            60000 // Max 60 seconds
          );

          console.warn(
            `Transaction failed (attempt ${attempts}/${maxAttempts}), retrying in ${Math.round(backoffMs / 1000)}s:`,
            error
          );

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        } else {
          // Non-retryable error, break out of the loop
          break;
        }
      }
    }

    // If we've exhausted all attempts, throw the last error
    console.error(`Transaction failed after ${attempts} attempts:`, lastError);
    throw lastError;
  }

  /**
   * Determine if a transaction should be retried based on the error
   * @param error Firestore error
   * @returns True if the transaction should be retried
   */
  private shouldRetryTransaction(error: FirestoreError): boolean {
    // Retry on contention errors (when a document was modified during the transaction)
    if (error.code === 'failed-precondition' || error.code === 'aborted') {
      return true;
    }

    // Retry on network errors
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
      return true;
    }

    return false;
  }

  /**
   * Create a document within a transaction
   * @param transaction Transaction object
   * @param id Document ID (optional)
   * @param data Document data
   * @returns Document reference
   */
  createInTransaction(
    transaction: Transaction,
    data: T,
    id?: string
  ): DocumentReference<DocumentData> {
    const docRef = id
      ? this.getDocRef(id)
      : doc(collection(db, this.collectionPath));

    // Add timestamps
    const dataWithTimestamps = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    transaction.set(docRef, dataWithTimestamps);
    return docRef;
  }

  /**
   * Update a document within a transaction
   * @param transaction Transaction object
   * @param id Document ID
   * @param data Document data to update
   */
  updateInTransaction(
    transaction: Transaction,
    id: string,
    data: Partial<T>
  ): void {
    const docRef = this.getDocRef(id);

    // Add updated timestamp
    const dataWithTimestamp = {
      ...data,
      updatedAt: serverTimestamp()
    };

    transaction.update(docRef, dataWithTimestamp);
  }

  /**
   * Delete a document within a transaction
   * @param transaction Transaction object
   * @param id Document ID
   */
  deleteInTransaction(
    transaction: Transaction,
    id: string
  ): void {
    const docRef = this.getDocRef(id);
    transaction.delete(docRef);
  }

  /**
   * Get a document within a transaction
   * @param transaction Transaction object
   * @param id Document ID
   * @returns Promise resolving to document data or null
   */
  async getInTransaction(
    transaction: Transaction,
    id: string
  ): Promise<T | null> {
    const docRef = this.getDocRef(id);
    const docSnap = await transaction.get(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as unknown as T;
    }

    return null;
  }
}
