/**
 * Transaction Service
 *
 * This class provides a centralized service for handling Firestore transactions.
 * It ensures that operations that need to be atomic are executed within a transaction.
 */

import {
  Transaction,
  WriteBatch,
  collection,
  doc,
  getDoc,
  runTransaction,
  writeBatch,
  DocumentReference,
  DocumentData,
  Firestore,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FirestoreLogger } from '../logging/FirestoreLogger';

/**
 * Transaction operation type
 */
export enum TransactionOperationType {
  READ = 'READ',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

/**
 * Transaction operation interface
 */
export interface TransactionOperation {
  type: TransactionOperationType;
  ref: DocumentReference<DocumentData>;
  data?: DocumentData;
}

/**
 * Transaction result interface
 */
export interface TransactionResult {
  success: boolean;
  data?: any;
  error?: Error;
}

/**
 * Transaction service class
 */
export class TransactionService {
  private static instance: TransactionService;
  private logger: FirestoreLogger;
  private db: Firestore;

  /**
   * Get the singleton instance of TransactionService
   * @returns TransactionService instance
   */
  public static getInstance(): TransactionService {
    if (!this.instance) {
      this.instance = new TransactionService();
    }
    return this.instance;
  }

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    this.logger = new FirestoreLogger('TransactionService');
    this.db = db;
  }

  /**
   * Run a transaction with the provided operations
   * @param operations Transaction operations
   * @returns Transaction result
   */
  async runTransaction(operations: TransactionOperation[]): Promise<TransactionResult> {
    try {
      const result = await runTransaction(this.db, async (transaction) => {
        const reads: { [key: string]: DocumentData } = {};

        // First, perform all read operations
        for (const operation of operations) {
          if (operation.type === TransactionOperationType.READ) {
            const snapshot = await transaction.get(operation.ref);
            if (snapshot.exists()) {
              reads[operation.ref.path] = { id: snapshot.id, ...snapshot.data() };
            } else {
              reads[operation.ref.path] = {} as DocumentData;
            }
          }
        }

        // Then, perform all write operations
        for (const operation of operations) {
          switch (operation.type) {
            case TransactionOperationType.CREATE:
              if (operation.data) {
                // Add timestamps
                const dataWithTimestamps = {
                  ...operation.data,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                };
                transaction.set(operation.ref, dataWithTimestamps);
              }
              break;
            case TransactionOperationType.UPDATE:
              if (operation.data) {
                // Add updated timestamp
                const dataWithTimestamp = {
                  ...operation.data,
                  updatedAt: serverTimestamp()
                };
                transaction.update(operation.ref, dataWithTimestamp);
              }
              break;
            case TransactionOperationType.DELETE:
              transaction.delete(operation.ref);
              break;
          }
        }

        return reads;
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      this.logger.error('Transaction failed:', error);
      return {
        success: false,
        error: error as Error
      };
    }
  }

  /**
   * Run a batch write operation
   * @param operations Transaction operations (only CREATE, UPDATE, DELETE)
   * @returns Transaction result
   */
  async runBatch(operations: TransactionOperation[]): Promise<TransactionResult> {
    try {
      const batch = writeBatch(this.db);

      for (const operation of operations) {
        switch (operation.type) {
          case TransactionOperationType.CREATE:
            if (operation.data) {
              // Add timestamps
              const dataWithTimestamps = {
                ...operation.data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              };
              batch.set(operation.ref, dataWithTimestamps);
            }
            break;
          case TransactionOperationType.UPDATE:
            if (operation.data) {
              // Add updated timestamp
              const dataWithTimestamp = {
                ...operation.data,
                updatedAt: serverTimestamp()
              };
              batch.update(operation.ref, dataWithTimestamp);
            }
            break;
          case TransactionOperationType.DELETE:
            batch.delete(operation.ref);
            break;
          default:
            throw new Error(`Invalid operation type for batch: ${operation.type}`);
        }
      }

      await batch.commit();

      return {
        success: true
      };
    } catch (error) {
      this.logger.error('Batch operation failed:', error);
      return {
        success: false,
        error: error as Error
      };
    }
  }

  /**
   * Get a document reference
   * @param collectionPath Collection path
   * @param id Document ID
   * @returns Document reference
   */
  getDocRef(collectionPath: string, id: string): DocumentReference<DocumentData> {
    return doc(this.db, collectionPath, id);
  }

  /**
   * Create a new document reference
   * @param collectionPath Collection path
   * @returns Document reference
   */
  createDocRef(collectionPath: string): DocumentReference<DocumentData> {
    return doc(collection(this.db, collectionPath));
  }

  /**
   * Get a document by ID
   * @param collectionPath Collection path
   * @param id Document ID
   * @returns Document data or null if not found
   */
  async getDocument(collectionPath: string, id: string): Promise<DocumentData | null> {
    try {
      const docRef = this.getDocRef(collectionPath, id);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() };
      }

      return null;
    } catch (error) {
      this.logger.error(`Error getting document ${id} from ${collectionPath}:`, error);
      return null;
    }
  }
}
