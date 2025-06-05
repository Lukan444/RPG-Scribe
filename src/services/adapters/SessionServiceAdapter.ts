/**
 * Session Service Adapter
 *
 * This adapter wraps the SessionService to implement the IEntityService interface.
 */

import { DocumentData, DocumentSnapshot, QueryConstraint, QueryDocumentSnapshot } from 'firebase/firestore';
import { Session } from '../../models/Session';
import { EntityType } from '../../models/EntityType';
import { SessionService } from '../session.service';
import { IEntityService } from '../interfaces/EntityService.interface';
import { CountOptions } from '../enhanced-firestore.service';

/**
 * Session service adapter class
 */
export class SessionServiceAdapter implements IEntityService<Session> {
  private sessionService: SessionService;
  private worldId: string;
  private campaignId: string;

  /**
   * Create a new SessionServiceAdapter
   * @param worldId World ID
   * @param campaignId Campaign ID
   */
  constructor(worldId: string, campaignId: string) {
    this.sessionService = SessionService.getInstance(worldId, campaignId);
    this.worldId = worldId;
    this.campaignId = campaignId;
  }

  /**
   * Get the entity type
   * @returns Entity type
   */
  getEntityType(): EntityType {
    return EntityType.SESSION;
  }

  /**
   * Get the world ID
   * @returns World ID
   */
  getWorldId(): string {
    return this.worldId;
  }

  /**
   * Get the campaign ID
   * @returns Campaign ID
   */
  getCampaignId(): string {
    return this.campaignId;
  }

  /**
   * Convert Firestore Timestamp to date string
   * @param timestamp Firestore Timestamp or date string
   * @returns Formatted date string
   */
  private convertTimestampToDateString(timestamp: any): string {
    try {
      // Handle Firestore Timestamp objects
      if (timestamp && typeof timestamp === 'object' && timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
      }
      // Handle regular Date objects
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      }
      // Handle date strings
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString();
      }
      // Fallback
      return 'Invalid Date';
    } catch (error) {
      console.error('Error converting timestamp:', error);
      return 'Invalid Date';
    }
  }

  /**
   * Get a session by ID
   * @param id Session ID
   * @param options Options for the operation
   * @returns Session data or null if not found
   */
  async getById(
    id: string,
    options?: {
      forceServer?: boolean;
      useCache?: boolean;
      cacheTTL?: number;
      skipTransform?: boolean;
      maxRetries?: number;
      trackPerformance?: boolean;
    }
  ): Promise<Session | null> {
    const session = await this.sessionService.getById(id);

    if (session) {
      // Convert from service Session to model Session with proper field mapping
      return {
        ...session,
        entityType: EntityType.SESSION,
        // Map database fields to expected UI fields
        title: session.name || session.title || `Session #${session.sessionNumber || session.number}`,
        name: session.name || session.title || `Session #${session.sessionNumber || session.number}`,
        number: session.sessionNumber || session.number,
        sessionNumber: session.sessionNumber || session.number,
        date: session.date ? this.convertTimestampToDateString(session.date) : undefined,
        datePlayed: session.date ? this.convertTimestampToDateString(session.date) : undefined,
        summary: session.description || session.summary,
        // Convert Firestore Timestamps to formatted date strings for React rendering
        createdAt: session.createdAt ? this.convertTimestampToDateString(session.createdAt) : undefined,
        updatedAt: session.updatedAt ? this.convertTimestampToDateString(session.updatedAt) : undefined
      } as Session;
    }

    return null;
  }

  /**
   * Get multiple sessions by their IDs
   * @param ids Array of session IDs
   * @returns Array of session data
   */
  async getByIds(ids: string[]): Promise<Session[]> {
    const sessions = await this.sessionService.getByIds(ids);

    // Convert from service Session to model Session
    return sessions.map(session => ({
      ...session,
      entityType: EntityType.SESSION,
      // Add sessionNumber as an alias for number
      sessionNumber: session.number
    } as Session));
  }

  /**
   * Create a new session
   * @param data Session data
   * @param id Document ID (optional)
   * @param options Options for the operation
   * @returns Session ID
   */
  async create(
    data: Session,
    id?: string,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Session) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    }
  ): Promise<string> {
    // Define the valid session status values
    type ValidSessionStatus = 'planned' | 'completed' | 'cancelled';

    // Extract status and other properties
    const { status, ...restData } = data;

    // Create the base service session object
    const serviceSession: {
      worldId: string;
      campaignId: string;
      status?: ValidSessionStatus;
      [key: string]: any;
    } = {
      ...restData,
      worldId: this.worldId,
      campaignId: this.campaignId
    };

    // Handle the status property if it exists
    if (status !== undefined) {
      const statusStr = String(status).toLowerCase();

      // Map the status to a valid value
      if (statusStr === 'in_progress') {
        serviceSession.status = 'planned';
      } else if (statusStr === 'planned' || statusStr === 'completed' || statusStr === 'cancelled') {
        serviceSession.status = statusStr as ValidSessionStatus;
      } else {
        // Default to 'planned' for any other values
        serviceSession.status = 'planned';
      }
    } else {
      // Default status if not provided
      serviceSession.status = 'planned';
    }

    // Cast to the service Session type to satisfy TypeScript
    // The service Session interface requires number, title, datePlayed, summary, and createdBy
    return this.sessionService.create(serviceSession as any, id, options as any);
  }

  /**
   * Update a session
   * @param id Session ID
   * @param data Session data to update
   * @param options Options for the operation
   * @returns True if successful
   */
  async update(
    id: string,
    data: Partial<Session>,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
    }
  ): Promise<boolean> {
    // Define the valid session status values
    type ValidSessionStatus = 'planned' | 'completed' | 'cancelled';

    // Create a new object without the status property
    const { status, ...restData } = data;

    // Create the service data object with the correct type structure
    const serviceData: Partial<{
      status: ValidSessionStatus | undefined;
      [key: string]: any;
    }> = {
      ...restData
    };

    // Handle the status property if it exists
    if (status !== undefined) {
      const statusStr = String(status).toLowerCase();

      // Map the status to a valid value
      if (statusStr === 'in_progress') {
        serviceData.status = 'planned';
      } else if (statusStr === 'planned' || statusStr === 'completed' || statusStr === 'cancelled') {
        serviceData.status = statusStr as ValidSessionStatus;
      } else {
        // Default to 'planned' for any other values
        serviceData.status = 'planned';
      }
    }

    // Now serviceData.status is either undefined or one of the valid literal types
    return this.sessionService.update(id, serviceData, options);
  }

  /**
   * Delete a session
   * @param id Session ID
   * @param options Options for the operation
   * @returns True if successful
   */
  async delete(
    id: string,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
    }
  ): Promise<boolean> {
    return this.sessionService.delete(id, options);
  }

  /**
   * Query sessions with pagination
   * @param constraints Query constraints (where, orderBy, etc.)
   * @param pageSize Number of sessions to return
   * @param startAfterDoc Document to start after (for pagination)
   * @param options Options for the operation
   * @returns Query results and last document for pagination
   */
  async query(
    constraints?: QueryConstraint[],
    pageSize?: number,
    startAfterDoc?: DocumentSnapshot<DocumentData>,
    options?: {
      forceServer?: boolean;
      source?: 'default' | 'server' | 'cache';
      useCache?: boolean;
      cacheTTL?: number;
    }
  ): Promise<{
    data: Session[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    source: 'server' | 'cache';
  }> {
    const result = await this.sessionService.query(constraints, pageSize, startAfterDoc, options);

    // Convert from service Session to model Session with proper field mapping
    const convertedData = result.data.map(session => ({
      ...session,
      entityType: EntityType.SESSION,
      // Map database fields to expected UI fields
      title: session.name || session.title || `Session #${session.sessionNumber || session.number}`,
      name: session.name || session.title || `Session #${session.sessionNumber || session.number}`,
      number: session.sessionNumber || session.number,
      sessionNumber: session.sessionNumber || session.number,
      date: session.date ? this.convertTimestampToDateString(session.date) : undefined,
      datePlayed: session.date ? this.convertTimestampToDateString(session.date) : undefined,
      summary: session.description || session.summary,
      // Convert Firestore Timestamps to formatted date strings for React rendering
      createdAt: session.createdAt ? this.convertTimestampToDateString(session.createdAt) : undefined,
      updatedAt: session.updatedAt ? this.convertTimestampToDateString(session.updatedAt) : undefined
    } as Session));

    return {
      ...result,
      data: convertedData
    };
  }

  /**
   * Get the count of sessions matching the constraints
   * @param queryName Name of the query for caching
   * @param constraints Query constraints
   * @param options Count options
   * @returns Count of matching sessions
   */
  async getCount(
    queryName: string,
    constraints?: QueryConstraint[],
    options?: CountOptions
  ): Promise<number> {
    // Implement a fallback since sessionService might not have getCount
    try {
      // Always use the fallback implementation
      const { data } = await this.query(constraints);
      return data.length;
    } catch (error) {
      console.error(`Error getting count for ${queryName}:`, error);
      return 0;
    }
  }

  /**
   * Get the relationship count for a session
   * @param entityId Session ID
   * @param options Count options
   * @returns Relationship count
   */
  async getRelationshipCount(
    entityId: string,
    options?: CountOptions
  ): Promise<number> {
    // This is a placeholder implementation
    return 0;
  }

  /**
   * List all sessions (alias for query for compatibility)
   * @param options Query options
   * @returns Array of sessions
   */
  async listEntities(
    options?: {
      forceServer?: boolean;
      source?: 'default' | 'server' | 'cache';
      useCache?: boolean;
      cacheTTL?: number;
      pageSize?: number;
    }
  ): Promise<Session[]> {
    const { data } = await this.query(
      undefined,
      options?.pageSize,
      undefined,
      {
        forceServer: options?.forceServer,
        source: options?.source,
        useCache: options?.useCache,
        cacheTTL: options?.cacheTTL
      }
    );
    // Data is already converted in the query method
    return data;
  }

  /**
   * Create session (alias for create for compatibility)
   * @param data Session data
   * @param options Options for the operation
   * @returns Session ID
   */
  async createEntity(
    data: Session,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Session) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    }
  ): Promise<string> {
    return this.create(data, undefined, options);
  }

  /**
   * Subscribe to real-time updates for a session
   * @param id Session ID
   * @param callback Function to call when session changes
   * @param options Options for the subscription
   * @returns Unsubscribe function
   */
  subscribeToEntity(
    id: string,
    callback: (data: Session | null) => void,
    options?: {
      listenerId?: string;
      onError?: (error: Error) => void;
    }
  ): () => void {
    // Create a wrapper callback that converts the service Session to model Session
    const wrappedCallback = (session: any | null) => {
      if (session) {
        const modelSession = {
          ...session,
          entityType: EntityType.SESSION,
          // Add sessionNumber as an alias for number
          sessionNumber: session.number
        } as Session;
        callback(modelSession);
      } else {
        callback(null);
      }
    };

    return this.sessionService.subscribeToDocument(id, wrappedCallback, options);
  }

  /**
   * Subscribe to real-time updates for a query
   * @param constraints Query constraints
   * @param callback Function to call when query results change
   * @param options Options for the subscription
   * @returns Unsubscribe function
   */
  subscribeToQuery(
    constraints: QueryConstraint[],
    callback: (data: Session[]) => void,
    options?: {
      queryId?: string;
      listenerId?: string;
      onError?: (error: Error) => void;
    }
  ): () => void {
    // Create a wrapper callback that converts the service Sessions to model Sessions
    const wrappedCallback = (sessions: any[]) => {
      const modelSessions = sessions.map(session => ({
        ...session,
        entityType: EntityType.SESSION,
        // Add sessionNumber as an alias for number
        sessionNumber: session.number
      } as Session));

      callback(modelSessions);
    };

    return this.sessionService.subscribeToQuery(constraints, wrappedCallback, options);
  }
}
