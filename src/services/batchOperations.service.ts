import {
  writeBatch,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  DocumentData,
  DocumentReference,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Batch operation type
 */
export type BatchOperation = {
  type: 'create' | 'update' | 'delete';
  collectionPath: string;
  id?: string;
  data?: DocumentData;
};

/**
 * Service for batch operations
 */
export class BatchOperationsService {
  /**
   * Execute a batch of operations
   * @param operations Batch operations
   * @returns True if successful
   */
  async executeBatch(operations: BatchOperation[]): Promise<boolean> {
    try {
      // Firestore has a limit of 500 operations per batch
      const batchSize = 500;
      const batches = [];

      // Split operations into batches
      for (let i = 0; i < operations.length; i += batchSize) {
        const batchOperations = operations.slice(i, i + batchSize);
        batches.push(batchOperations);
      }

      // Execute each batch
      for (const batchOperations of batches) {
        const batch = writeBatch(db);

        for (const op of batchOperations) {
          const docRef = op.id
            ? doc(db, op.collectionPath, op.id)
            : doc(collection(db, op.collectionPath));

          switch (op.type) {
            case 'create':
              if (!op.data) throw new Error('Data required for create operation');
              batch.set(docRef, {
                ...op.data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              break;
            case 'update':
              if (!op.data) throw new Error('Data required for update operation');
              batch.update(docRef, {
                ...op.data,
                updatedAt: serverTimestamp()
              });
              break;
            case 'delete':
              batch.delete(docRef);
              break;
          }
        }

        await batch.commit();
      }

      return true;
    } catch (error) {
      console.error('Error executing batch operations:', error);
      return false;
    }
  }

  /**
   * Create multiple documents in a collection
   * @param collectionPath Collection path
   * @param documents Documents to create
   * @returns True if successful
   */
  async createMultiple(
    collectionPath: string,
    documents: DocumentData[]
  ): Promise<boolean> {
    try {
      const operations: BatchOperation[] = documents.map(doc => ({
        type: 'create',
        collectionPath,
        data: doc
      }));

      return this.executeBatch(operations);
    } catch (error) {
      console.error('Error creating multiple documents:', error);
      return false;
    }
  }

  /**
   * Update multiple documents in a collection
   * @param collectionPath Collection path
   * @param updates Document updates
   * @returns True if successful
   */
  async updateMultiple(
    collectionPath: string,
    updates: Array<{ id: string; data: DocumentData }>
  ): Promise<boolean> {
    try {
      const operations: BatchOperation[] = updates.map(update => ({
        type: 'update',
        collectionPath,
        id: update.id,
        data: update.data
      }));

      return this.executeBatch(operations);
    } catch (error) {
      console.error('Error updating multiple documents:', error);
      return false;
    }
  }

  /**
   * Delete multiple documents in a collection
   * @param collectionPath Collection path
   * @param ids Document IDs to delete
   * @returns True if successful
   */
  async deleteMultiple(
    collectionPath: string,
    ids: string[]
  ): Promise<boolean> {
    try {
      const operations: BatchOperation[] = ids.map(id => ({
        type: 'delete',
        collectionPath,
        id
      }));

      return this.executeBatch(operations);
    } catch (error) {
      console.error('Error deleting multiple documents:', error);
      return false;
    }
  }

  /**
   * Delete documents matching a query
   * @param collectionPath Collection path
   * @param fieldPath Field path
   * @param opStr Operation string
   * @param value Value to compare
   * @returns True if successful
   */
  async deleteWhere(
    collectionPath: string,
    fieldPath: string,
    opStr: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'array-contains' | 'in' | 'array-contains-any',
    value: any
  ): Promise<boolean> {
    try {
      // Get documents matching query
      const q = query(
        collection(db, collectionPath),
        where(fieldPath, opStr, value)
      );

      const querySnapshot = await getDocs(q);

      // Delete documents in batches
      const ids: string[] = [];
      querySnapshot.forEach(doc => {
        ids.push(doc.id);
      });

      return this.deleteMultiple(collectionPath, ids);
    } catch (error) {
      console.error('Error deleting documents by query:', error);
      return false;
    }
  }

  /**
   * Update or create multiple documents
   * @param collectionPath Collection path
   * @param documents Documents to update or create
   * @returns True if successful
   */
  async upsertMultiple(
    collectionPath: string,
    documents: Array<{ id: string; data: DocumentData }>
  ): Promise<boolean> {
    try {
      const operations: BatchOperation[] = [];

      // Check which documents exist
      for (const document of documents) {
        const docRef = document.id
          ? doc(db, collectionPath, document.id)
          : doc(collection(db, collectionPath));

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // Update existing document
          operations.push({
            type: 'update',
            collectionPath,
            id: document.id,
            data: document.data
          });
        } else {
          // Create new document
          operations.push({
            type: 'create',
            collectionPath,
            id: document.id,
            data: document.data
          });
        }
      }

      return this.executeBatch(operations);
    } catch (error) {
      console.error('Error upserting multiple documents:', error);
      return false;
    }
  }
}
