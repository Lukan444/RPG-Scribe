import {
  query,
  collection,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  DocumentSnapshot,
  DocumentData,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Service for query optimization
 */
export class QueryOptimizationService {
  /**
   * Execute a paginated query with optimized constraints
   * @param collectionPath Collection path
   * @param constraints Query constraints
   * @param pageSize Page size
   * @param startAfterDoc Document to start after
   * @returns Query results and last document
   */
  async executeQuery<T extends DocumentData>(
    collectionPath: string,
    constraints: QueryConstraint[] = [],
    pageSize: number = 10,
    startAfterDoc?: DocumentSnapshot<DocumentData>
  ): Promise<{
    data: T[];
    lastDoc: DocumentSnapshot<DocumentData> | null;
  }> {
    try {
      // Build query with constraints
      let q = query(
        collection(db, collectionPath),
        ...constraints,
        limit(pageSize)
      );

      // Add startAfter for pagination if provided
      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }

      // Execute query
      const querySnapshot = await getDocs(q);

      // Process results
      const data: T[] = [];
      let lastDoc: DocumentSnapshot<DocumentData> | null = null;

      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as unknown as T);
        lastDoc = doc;
      });

      return { data, lastDoc };
    } catch (error) {
      console.error('Error executing query:', error);
      return { data: [], lastDoc: null };
    }
  }

  /**
   * Execute a count query
   * @param collectionPath Collection path
   * @param constraints Query constraints
   * @returns Count of documents
   */
  async executeCountQuery(
    collectionPath: string,
    constraints: QueryConstraint[] = []
  ): Promise<number> {
    try {
      // Build query with constraints
      const q = query(
        collection(db, collectionPath),
        ...constraints
      );

      // Execute query
      const querySnapshot = await getDocs(q);

      return querySnapshot.size;
    } catch (error) {
      console.error('Error executing count query:', error);
      return 0;
    }
  }

  /**
   * Execute a batch query for multiple IDs
   * @param collectionPath Collection path
   * @param idField ID field name
   * @param ids IDs to query
   * @param additionalConstraints Additional query constraints
   * @returns Query results
   */
  async executeBatchQuery<T extends DocumentData>(
    collectionPath: string,
    idField: string,
    ids: string[],
    additionalConstraints: QueryConstraint[] = []
  ): Promise<T[]> {
    try {
      // Firestore has a limit of 10 items in an 'in' query
      const batchSize = 10;
      const results: T[] = [];

      // Split IDs into batches
      for (let i = 0; i < ids.length; i += batchSize) {
        const batchIds = ids.slice(i, i + batchSize);

        // Build query with constraints
        const q = query(
          collection(db, collectionPath),
          where(idField, 'in', batchIds),
          ...additionalConstraints
        );

        // Execute query
        const querySnapshot = await getDocs(q);

        // Process results
        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() } as unknown as T);
        });
      }

      return results;
    } catch (error) {
      console.error('Error executing batch query:', error);
      return [];
    }
  }

  /**
   * Optimize query constraints
   * @param constraints Query constraints
   * @returns Optimized constraints
   */
  optimizeConstraints(constraints: QueryConstraint[]): QueryConstraint[] {
    // This is a placeholder for more complex optimization logic
    // In a real implementation, you would analyze the constraints and reorder them
    // based on the available indexes and query performance characteristics

    // For now, we'll just return the constraints as-is
    return constraints;
  }

  /**
   * Create a composite query for multiple conditions
   * @param collectionPath Collection path
   * @param conditions Query conditions
   * @returns Query results
   */
  async executeCompositeQuery<T extends DocumentData>(
    collectionPath: string,
    conditions: Array<{
      field: string;
      operator: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'array-contains' | 'in' | 'array-contains-any';
      value: any;
    }>,
    orderByField?: string,
    orderDirection?: 'asc' | 'desc',
    pageSize: number = 10
  ): Promise<T[]> {
    try {
      // Build constraints
      const constraints: QueryConstraint[] = conditions.map(condition =>
        where(condition.field, condition.operator, condition.value)
      );

      // Add orderBy if provided
      if (orderByField) {
        constraints.push(orderBy(orderByField, orderDirection || 'asc'));
      }

      // Add limit
      constraints.push(limit(pageSize));

      // Build query
      const q = query(
        collection(db, collectionPath),
        ...constraints
      );

      // Execute query
      const querySnapshot = await getDocs(q);

      // Process results
      const results: T[] = [];

      querySnapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() } as unknown as T);
      });

      return results;
    } catch (error) {
      console.error('Error executing composite query:', error);
      return [];
    }
  }
}
