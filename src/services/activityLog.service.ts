import {
  where,
  orderBy,
  query,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  DocumentData,
  serverTimestamp,
  Timestamp,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FirestoreService } from './firestore.service';
import { ActivityLog, ActivityAction } from '../models/ActivityLog';

/**
 * Service for activity log operations
 */
export class ActivityLogService extends FirestoreService<ActivityLog> {
  private static instance: ActivityLogService;

  /**
   * Get ActivityLogService instance (singleton)
   * @returns ActivityLogService instance
   */
  public static getInstance(): ActivityLogService {
    if (!ActivityLogService.instance) {
      ActivityLogService.instance = new ActivityLogService();
    }
    return ActivityLogService.instance;
  }

  /**
   * Create a new ActivityLogService
   */
  private constructor() {
    super('activityLogs', {
      cachingEnabled: true,
      defaultCacheTTL: 5 * 60 * 1000 // 5 minutes
    });
  }

  /**
   * Log an activity
   * @param userId User ID
   * @param userName User name
   * @param userEmail User email
   * @param action Activity action
   * @param details Activity details
   * @param ipAddress IP address (optional)
   * @param userAgent User agent (optional)
   * @returns Activity log ID
   */
  async logActivity(
    userId: string,
    userName: string | null,
    userEmail: string | null,
    action: ActivityAction,
    details: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const activityLog: ActivityLog = {
      id: '', // Will be set by Firestore
      userId,
      userName,
      userEmail,
      action,
      details,
      timestamp: new Date(),
      ipAddress,
      userAgent
    };

    return this.create(activityLog);
  }

  /**
   * Get activity logs for a user
   * @param userId User ID
   * @param pageSize Page size
   * @param startAfterDoc Start after document
   * @returns Activity logs
   */
  async getUserLogs(
    userId: string,
    pageSize: number = 10,
    startAfterDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{
    data: ActivityLog[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }> {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    ];

    return this.query(constraints, pageSize, startAfterDoc);
  }

  /**
   * Get activity logs by action
   * @param action Activity action
   * @param pageSize Page size
   * @param startAfterDoc Start after document
   * @returns Activity logs
   */
  async getLogsByAction(
    action: ActivityAction,
    pageSize: number = 10,
    startAfterDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{
    data: ActivityLog[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }> {
    const constraints: QueryConstraint[] = [
      where('action', '==', action),
      orderBy('timestamp', 'desc')
    ];

    return this.query(constraints, pageSize, startAfterDoc);
  }

  /**
   * Get recent activity logs
   * @param pageSize Page size
   * @param startAfterDoc Start after document
   * @returns Activity logs
   */
  async getRecentLogs(
    pageSize: number = 10,
    startAfterDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{
    data: ActivityLog[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }> {
    const constraints: QueryConstraint[] = [
      orderBy('timestamp', 'desc')
    ];

    return this.query(constraints, pageSize, startAfterDoc);
  }

  /**
   * Search activity logs
   * @param searchTerm Search term
   * @param pageSize Page size
   * @param startAfterDoc Start after document
   * @returns Activity logs
   */
  async searchLogs(
    searchTerm: string,
    pageSize: number = 10,
    startAfterDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{
    data: ActivityLog[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }> {
    // Firestore doesn't support full-text search, so we'll need to search multiple fields
    // This is a simplified implementation - in a real app, you might use Algolia or similar
    const constraints: QueryConstraint[] = [
      orderBy('timestamp', 'desc')
    ];

    const { data, lastDoc } = await this.query(constraints, 100, startAfterDoc);

    // Filter results client-side
    const filteredData = data.filter(log =>
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
      data: filteredData.slice(0, pageSize),
      lastDoc
    };
  }

  /**
   * Get an activity log by ID
   * @param id Activity log ID
   * @returns Activity log or null if not found
   */
  async get(id: string): Promise<ActivityLog> {
    try {
      const docRef = doc(db, this.collectionPath, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ActivityLog;
      } else {
        throw new Error(`Activity log with ID ${id} not found`);
      }
    } catch (error) {
      console.error(`Error getting activity log ${id}:`, error);
      throw error;
    }
  }
}
