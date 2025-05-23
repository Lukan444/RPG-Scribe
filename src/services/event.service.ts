import {
  where,
  orderBy,
  query,
  collection,
  doc,
  getDoc,
  getDocs,
  DocumentData,
  serverTimestamp,
  QueryConstraint,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FirestoreService } from './firestore.service';
import { RelationshipService } from './relationship.service';
import { EntityType } from '../models/EntityType';
import { EventAPIService } from './api/eventAPI.service';
import { API_CONFIG } from '../config/api.config';

/**
 * Event data interface
 */
export interface Event extends DocumentData {
  id?: string;
  name: string;
  description: string;
  date: any; // Timestamp
  importance: number; // 1-10
  type: string; // battle, social, discovery, plot point
  createdBy: string; // User ID
  createdAt?: any; // Timestamp
  updatedAt?: any; // Timestamp
  locationId?: string; // Where the event occurred
  location?: {
    id: string;
    name: string;
    type: string;
  }; // Denormalized location data
  sessionId?: string; // Session where the event occurred
  session?: {
    id: string;
    title: string;
    number: number;
  }; // Denormalized session data
  outcome?: string;
  isSecret: boolean; // For GM-only events
  participants?: Array<{
    id: string;
    name: string;
    role: string;
  }>; // Denormalized participant data
}

/**
 * Service for event-related operations
 */
export class EventService extends FirestoreService<Event> {
  private campaignId: string;
  private worldId: string;
  private apiService: EventAPIService;
  private useAPI: boolean = false; // Flag to determine whether to use API or Firestore
  private static instances: { [key: string]: EventService } = {};

  /**
   * Get an EventService instance for a specific campaign
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns EventService instance
   */
  public static getInstance(worldId: string, campaignId: string): EventService {
    const key = `${worldId}:${campaignId}`;
    if (!this.instances[key]) {
      this.instances[key] = new EventService(worldId, campaignId);
    }
    return this.instances[key];
  }

  /**
   * Create a new EventService
   * @param worldId World ID
   * @param campaignId Campaign ID
   */
  private constructor(worldId: string, campaignId: string) {
    super(`rpgworlds/${worldId}/campaigns/${campaignId}/events`);
    this.worldId = worldId;
    this.campaignId = campaignId;

    // Initialize API service
    this.apiService = new EventAPIService();

    // Determine whether to use API or Firestore based on configuration
    this.useAPI = API_CONFIG.USE_API;
  }

  /**
   * Override getById to use API service when useAPI is true
   * @param id Entity ID
   * @param options Query options
   * @returns Entity or null
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
  ): Promise<Event | null> {
    let event: Event | null = null;

    if (this.useAPI) {
      try {
        event = await this.apiService.getEvent(id);
      } catch (error) {
        console.error(`Error fetching event ${id} from API:`, error);
        // Fall back to Firestore
      }
    }

    if (!event) {
      // Fall back to Firestore
      event = await super.getById(id, options);
    }

    if (event) {
      // Add entityType to the event
      return {
        ...event,
        entityType: EntityType.EVENT,
        eventType: event.type || 'Other',
        timelinePosition: event.timelinePosition || 0
      };
    }

    return null;
  }

  /**
   * Override query to use API service when useAPI is true
   * @param constraints Query constraints
   * @param pageSize Page size
   * @param startAfterDoc Start after document
   * @param options Query options
   * @returns Query result
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
    data: Event[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    source: 'server' | 'cache';
  }> {
    if (this.useAPI) {
      try {
        const events = await this.apiService.getAllEvents(this.worldId, this.campaignId);

        // Apply constraints manually (simplified version)
        let filteredEvents = [...events];

        // Return the result
        return {
          data: filteredEvents.slice(0, pageSize),
          lastDoc: null, // API doesn't support pagination in the same way as Firestore
          source: 'server'
        };
      } catch (error) {
        console.error(`Error fetching events from API:`, error);
        // Fall back to Firestore
        return super.query(constraints, pageSize, startAfterDoc, options);
      }
    }

    // Use Firestore
    return super.query(constraints, pageSize, startAfterDoc, options);
  }

  /**
   * Override create to use API service when useAPI is true
   * @param data Entity data
   * @param id Document ID (optional)
   * @param options Options for the operation
   * @returns Entity ID
   */
  async create(
    data: Event,
    id?: string,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Event) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<string> {
    if (this.useAPI) {
      try {
        const event = await this.apiService.createEvent(data, this.worldId, this.campaignId);
        return event.id!;
      } catch (error) {
        console.error(`Error creating event via API:`, error);
        // Fall back to Firestore
        return super.create(data, id, options);
      }
    }

    // Use Firestore
    return super.create(data, id, options);
  }

  /**
   * Override update to use API service when useAPI is true
   * @param id Entity ID
   * @param data Entity data
   * @param options Options for the operation
   * @returns True if successful
   */
  async update(
    id: string,
    data: Partial<Event>,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Partial<Event>) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<boolean> {
    if (this.useAPI) {
      try {
        await this.apiService.updateEvent(id, data);
        return true;
      } catch (error) {
        console.error(`Error updating event ${id} via API:`, error);
        // Fall back to Firestore
        return super.update(id, data, options);
      }
    }

    // Use Firestore
    return super.update(id, data, options);
  }

  /**
   * Override delete to use API service when useAPI is true
   * @param id Entity ID
   * @param options Options for the operation
   * @returns True if successful
   */
  async delete(
    id: string,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      trackPerformance?: boolean;
    } = {}
  ): Promise<boolean> {
    if (this.useAPI) {
      try {
        return await this.apiService.deleteEvent(id);
      } catch (error) {
        console.error(`Error deleting event ${id} via API:`, error);
        // Fall back to Firestore
        return super.delete(id, options);
      }
    }

    // Use Firestore
    return super.delete(id, options);
  }

  /**
   * Get entity by ID (alias for getById for compatibility)
   * @param id Entity ID
   * @param options Query options
   * @returns Entity or null
   */
  async getEntity(
    id: string,
    options: {
      forceServer?: boolean;
      useCache?: boolean;
      cacheTTL?: number;
      skipTransform?: boolean;
      maxRetries?: number;
      trackPerformance?: boolean;
    } = {}
  ): Promise<Event | null> {
    return this.getById(id, options);
  }

  /**
   * List all entities (alias for query for compatibility)
   * @param options Query options
   * @returns Array of entities
   */
  async listEntities(
    options: {
      forceServer?: boolean;
      source?: 'default' | 'server' | 'cache';
      useCache?: boolean;
      cacheTTL?: number;
      pageSize?: number;
    } = {}
  ): Promise<Event[]> {
    const { data } = await this.query(
      [orderBy('date', 'desc')],
      options.pageSize || 100,
      undefined,
      {
        forceServer: options.forceServer,
        source: options.source,
        useCache: options.useCache,
        cacheTTL: options.cacheTTL
      }
    );

    // Add entityType to each event
    return data.map(event => ({
      ...event,
      entityType: EntityType.EVENT,
      eventType: event.type || 'Other',
      timelinePosition: event.timelinePosition || 0
    }));
  }

  /**
   * Create entity (alias for create for compatibility)
   * @param data Entity data
   * @param options Options for the operation
   * @returns Entity ID
   */
  async createEntity(
    data: Event,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Event) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<string> {
    return this.create(data, undefined, options);
  }

  /**
   * Update entity (alias for update for compatibility)
   * @param id Entity ID
   * @param data Entity data
   * @param options Options for the operation
   * @returns True if successful
   */
  async updateEntity(
    id: string,
    data: Partial<Event>,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Partial<Event>) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<boolean> {
    return this.update(id, data, options);
  }

  /**
   * Delete entity (alias for delete for compatibility)
   * @param id Entity ID
   * @param options Options for the operation
   * @returns True if successful
   */
  async deleteEntity(
    id: string,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      trackPerformance?: boolean;
    } = {}
  ): Promise<boolean> {
    return this.delete(id, options);
  }

  /**
   * Get events by type
   * @param type Event type
   * @returns Array of events
   */
  async getEventsByType(type: string): Promise<Event[]> {
    if (this.useAPI) {
      try {
        return await this.apiService.getEventsByType(type, this.worldId, this.campaignId);
      } catch (error) {
        console.error(`Error fetching events by type from API:`, error);
        // Fall back to Firestore
      }
    }

    // Use Firestore
    const { data } = await this.query([
      where('type', '==', type),
      orderBy('date', 'desc')
    ]);

    return data;
  }

  /**
   * Get events by importance
   * @param minImportance Minimum importance (1-10)
   * @returns Array of events
   */
  async getEventsByImportance(minImportance: number): Promise<Event[]> {
    const { data } = await this.query([
      where('importance', '>=', minImportance),
      orderBy('importance', 'desc'),
      orderBy('date', 'desc')
    ]);

    return data;
  }

  /**
   * Get events by location
   * @param locationId Location ID
   * @returns Array of events
   */
  async getEventsByLocation(locationId: string): Promise<Event[]> {
    const { data } = await this.query([
      where('locationId', '==', locationId),
      orderBy('date', 'desc')
    ]);

    return data;
  }

  /**
   * Get events by session
   * @param sessionId Session ID
   * @returns Array of events
   */
  async getEventsBySession(sessionId: string): Promise<Event[]> {
    if (this.useAPI) {
      try {
        return await this.apiService.getEventsBySession(sessionId, this.worldId, this.campaignId);
      } catch (error) {
        console.error(`Error fetching events by session from API:`, error);
        // Fall back to Firestore
      }
    }

    // Use Firestore
    const { data } = await this.query([
      where('sessionId', '==', sessionId),
      orderBy('date', 'desc')
    ]);

    return data;
  }

  /**
   * Get events by date range
   * @param startDate Start date
   * @param endDate End date
   * @returns Array of events
   */
  async getEventsByDateRange(startDate: any, endDate: any): Promise<Event[]> {
    const { data } = await this.query([
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    ]);

    return data;
  }

  /**
   * Get entity with relationships
   * @param entityId Entity ID
   * @returns Entity with relationship count
   */
  async getEntityWithRelationships(entityId: string): Promise<Event & { relationshipCount?: number }> {
    try {
      // Get the entity
      const entity = await this.getById(entityId);

      if (!entity) {
        throw new Error(`Entity not found: ${entityId}`);
      }

      // Get relationship count
      const relationshipService = RelationshipService.getInstance(this.worldId, this.campaignId);
      const count = await relationshipService.getRelationshipCount(
        entityId,
        EntityType.EVENT as any
      );

      return {
        ...entity,
        relationshipCount: count
      };
    } catch (error) {
      console.error(`Error getting entity with relationships: ${entityId}`, error);
      throw error;
    }
  }

  /**
   * Update event location
   * @param eventId Event ID
   * @param locationId Location ID
   * @param locationData Location data for denormalization
   * @returns True if successful
   */
  async updateEventLocation(
    eventId: string,
    locationId: string | null,
    locationData?: { name: string; type: string; }
  ): Promise<boolean> {
    try {
      if (locationId === null) {
        // Remove location
        await this.update(eventId, {
          locationId: undefined,
          location: undefined
        });
      } else {
        // Set location
        await this.update(eventId, {
          locationId,
          location: {
            id: locationId,
            name: locationData!.name,
            type: locationData!.type
          }
        });

        // Create or update relationship
        const relationshipService = RelationshipService.getInstance(this.worldId, this.campaignId);
        await relationshipService.createOrUpdateRelationship({
          type: `${EntityType.EVENT}-${EntityType.LOCATION}`,
          subtype: 'occurred-at',
          sourceId: eventId,
          sourceType: EntityType.EVENT as any,
          targetId: locationId,
          targetType: EntityType.LOCATION as any,
          properties: {}
        });
      }

      return true;
    } catch (error) {
      console.error(`Error updating event location for ${eventId}:`, error);
      return false;
    }
  }

  /**
   * Update event session
   * @param eventId Event ID
   * @param sessionId Session ID
   * @param sessionData Session data for denormalization
   * @returns True if successful
   */
  async updateEventSession(
    eventId: string,
    sessionId: string | null,
    sessionData?: { title: string; number: number; }
  ): Promise<boolean> {
    try {
      if (sessionId === null) {
        // Remove session
        await this.update(eventId, {
          sessionId: undefined,
          session: undefined
        });
      } else {
        // Set session
        await this.update(eventId, {
          sessionId,
          session: {
            id: sessionId,
            title: sessionData!.title,
            number: sessionData!.number
          }
        });

        // Create or update relationship
        const relationshipService = RelationshipService.getInstance(this.worldId, this.campaignId);
        await relationshipService.createOrUpdateRelationship({
          type: `${EntityType.EVENT}-${EntityType.SESSION}`,
          subtype: 'happened-during',
          sourceId: eventId,
          sourceType: EntityType.EVENT as any,
          targetId: sessionId,
          targetType: EntityType.SESSION as any,
          properties: {}
        });
      }

      return true;
    } catch (error) {
      console.error(`Error updating event session for ${eventId}:`, error);
      return false;
    }
  }

  /**
   * Add participant to event
   * @param eventId Event ID
   * @param characterId Character ID
   * @param characterData Character data for denormalization
   * @param role Character's role in the event
   * @returns True if successful
   */
  async addParticipant(
    eventId: string,
    characterId: string,
    characterData: { name: string; },
    role: string
  ): Promise<boolean> {
    try {
      const eventRef = doc(db, this.collectionPath, eventId);
      const event = await getDoc(eventRef);

      if (!event.exists()) {
        return false;
      }

      const eventData = event.data() as Event;
      const participants = eventData.participants || [];

      // Check if character is already a participant
      const existingIndex = participants.findIndex(p => p.id === characterId);

      if (existingIndex >= 0) {
        // Update existing participant
        participants[existingIndex].role = role;
      } else {
        // Add new participant
        participants.push({
          id: characterId,
          name: characterData.name,
          role
        });
      }

      await this.update(eventId, { participants });

      // Create or update relationship
      const relationshipService = RelationshipService.getInstance(this.worldId, this.campaignId);
      await relationshipService.createOrUpdateRelationship({
        type: `${EntityType.CHARACTER}-${EntityType.EVENT}`,
        subtype: 'participated',
        sourceId: characterId,
        sourceType: EntityType.CHARACTER as any,
        targetId: eventId,
        targetType: EntityType.EVENT as any,
        properties: {
          role
        }
      });

      return true;
    } catch (error) {
      console.error(`Error adding participant to event ${eventId}:`, error);
      return false;
    }
  }

  /**
   * Remove participant from event
   * @param eventId Event ID
   * @param characterId Character ID
   * @returns True if successful
   */
  async removeParticipant(
    eventId: string,
    characterId: string
  ): Promise<boolean> {
    try {
      const eventRef = doc(db, this.collectionPath, eventId);
      const event = await getDoc(eventRef);

      if (!event.exists()) {
        return false;
      }

      const eventData = event.data() as Event;
      const participants = eventData.participants || [];

      // Remove participant
      const updatedParticipants = participants.filter(p => p.id !== characterId);

      await this.update(eventId, { participants: updatedParticipants });

      // Find and update the relationship
      const relationshipService = RelationshipService.getInstance(this.worldId, this.campaignId);
      const relationships = await relationshipService.getRelationships(
        `${EntityType.CHARACTER}-${EntityType.EVENT}`,
        characterId,
        eventId
      );

      if (relationships.length > 0) {
        await relationshipService.updateRelationship(
          relationships[0].id!,
          {
            properties: {
              ...relationships[0].properties,
              removed: true,
              removedAt: serverTimestamp()
            }
          }
        );
      }

      return true;
    } catch (error) {
      console.error(`Error removing participant from event ${eventId}:`, error);
      return false;
    }
  }
}
