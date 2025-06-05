import {
  where,
  orderBy,
  query,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  DocumentData,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FirestoreService } from './firestore.service';
import { RelationshipService } from './relationship.service';
import { EntityType } from '../models/EntityType';

/**
 * Session data interface
 */
export interface Session extends DocumentData {
  id?: string;
  number: number;
  title: string;
  datePlayed: any; // Timestamp
  summary: string;
  createdBy: string; // User ID
  createdAt?: any; // Timestamp
  updatedAt?: any; // Timestamp
  playerNotes?: string;
  gmNotes?: string;
  transcriptURL?: string;
  recordingURL?: string;
  duration?: number; // in minutes
  status: 'planned' | 'completed' | 'cancelled';
  participants?: Array<{
    id: string;
    name: string;
    userId?: string;
  }>; // Denormalized participant data
  locations?: Array<{
    id: string;
    name: string;
    type: string;
  }>; // Denormalized location data
  events?: Array<{
    id: string;
    name: string;
    type: string;
  }>; // Denormalized event data
}

/**
 * Service for session-related operations
 */
export class SessionService extends FirestoreService<Session> {
  private campaignId: string;
  private worldId: string;
  private static instances: { [key: string]: SessionService } = {};

  /**
   * Get a SessionService instance for a specific campaign
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns SessionService instance
   */
  public static getInstance(worldId: string, campaignId: string): SessionService {
    const key = `${worldId}:${campaignId}`;
    if (!this.instances[key]) {
      this.instances[key] = new SessionService(worldId, campaignId);
    }
    return this.instances[key];
  }

  /**
   * Create a new SessionService
   * @param worldId World ID
   * @param campaignId Campaign ID
   */
  private constructor(worldId: string, campaignId: string) {
    super('sessions');
    this.worldId = worldId;
    this.campaignId = campaignId;
  }

  /**
   * Override getById to add entityType
   * @param id Entity ID
   * @returns Entity or null
   */
  async getById(id: string): Promise<Session | null> {
    const session = await super.getById(id);

    if (session) {
      // Add entityType to the session and map database fields to UI fields
      return {
        ...session,
        entityType: EntityType.SESSION,
        // Map database fields to expected UI fields
        title: session.name || session.title || `Session #${session.sessionNumber || session.number}`,
        name: session.name || session.title || `Session #${session.sessionNumber || session.number}`,
        number: session.sessionNumber || session.number,
        datePlayed: session.date || session.datePlayed,
        summary: session.description || session.summary
      };
    }

    return null;
  }

  /**
   * Get sessions by status
   * @param status Session status
   * @returns Array of sessions
   */
  async getSessionsByStatus(status: 'planned' | 'completed' | 'cancelled'): Promise<Session[]> {
    const { data } = await this.query([
      where('status', '==', status),
      orderBy('number', 'desc')
    ]);

    return data;
  }

  /**
   * Get sessions by date range
   * @param startDate Start date
   * @param endDate End date
   * @returns Array of sessions
   */
  async getSessionsByDateRange(startDate: any, endDate: any): Promise<Session[]> {
    const { data } = await this.query([
      where('datePlayed', '>=', startDate),
      where('datePlayed', '<=', endDate),
      orderBy('datePlayed', 'desc')
    ]);

    return data;
  }

  /**
   * Get next session number
   * @returns Next session number
   */
  async getNextSessionNumber(): Promise<number> {
    const { data } = await this.query([
      orderBy('number', 'desc')
    ], 1);

    if (data.length === 0) {
      return 1;
    }

    return data[0].number + 1;
  }

  /**
   * Add participant to session
   * @param sessionId Session ID
   * @param characterId Character ID
   * @param characterData Character data for denormalization
   * @param userId User ID (optional, for player characters)
   * @returns True if successful
   */
  async addParticipant(
    sessionId: string,
    characterId: string,
    characterData: { name: string; },
    userId?: string
  ): Promise<boolean> {
    try {
      const sessionRef = doc(db, this.collectionPath, sessionId);
      const session = await getDoc(sessionRef);

      if (!session.exists()) {
        return false;
      }

      const sessionData = session.data() as Session;
      const participants = sessionData.participants || [];

      // Check if character is already a participant
      const existingIndex = participants.findIndex(p => p.id === characterId);

      if (existingIndex >= 0) {
        // Update existing participant
        if (userId) {
          participants[existingIndex].userId = userId;
        }
      } else {
        // Add new participant
        participants.push({
          id: characterId,
          name: characterData.name,
          userId
        });
      }

      await this.update(sessionId, { participants });

      // Create or update relationship
      const relationshipService = RelationshipService.getInstance(this.worldId, this.campaignId);
      await relationshipService.createOrUpdateRelationship({
        type: `${EntityType.CHARACTER}-${EntityType.SESSION}`,
        subtype: 'participated',
        sourceId: characterId,
        sourceType: EntityType.CHARACTER as any,
        targetId: sessionId,
        targetType: EntityType.SESSION as any,
        properties: {
          userId
        }
      });

      // Create session participation entry
      await this.createSessionParticipationEntry(
        sessionId,
        characterId,
        userId
      );

      return true;
    } catch (error) {
      console.error(`Error adding participant to session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Remove participant from session
   * @param sessionId Session ID
   * @param characterId Character ID
   * @returns True if successful
   */
  async removeParticipant(
    sessionId: string,
    characterId: string
  ): Promise<boolean> {
    try {
      const sessionRef = doc(db, this.collectionPath, sessionId);
      const session = await getDoc(sessionRef);

      if (!session.exists()) {
        return false;
      }

      const sessionData = session.data() as Session;
      const participants = sessionData.participants || [];

      // Remove participant
      const updatedParticipants = participants.filter(p => p.id !== characterId);

      await this.update(sessionId, { participants: updatedParticipants });

      // Find and update the relationship
      const relationshipService = RelationshipService.getInstance(this.worldId, this.campaignId);
      const relationships = await relationshipService.getRelationships(
        'character-session',
        characterId,
        sessionId
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
      console.error(`Error removing participant from session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Create session participation entry
   * @param sessionId Session ID
   * @param characterId Character ID
   * @param userId User ID (optional)
   * @returns True if successful
   */
  private async createSessionParticipationEntry(
    sessionId: string,
    characterId: string,
    userId?: string
  ): Promise<boolean> {
    try {
      const participationRef = doc(collection(db, `campaigns/${this.campaignId}/sessionParticipation`));

      await setDoc(participationRef, {
        sessionId,
        characterId,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error(`Error creating session participation entry for ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Add location to session
   * @param sessionId Session ID
   * @param locationId Location ID
   * @param locationData Location data for denormalization
   * @returns True if successful
   */
  async addLocation(
    sessionId: string,
    locationId: string,
    locationData: { name: string; type: string; }
  ): Promise<boolean> {
    try {
      const sessionRef = doc(db, this.collectionPath, sessionId);
      const session = await getDoc(sessionRef);

      if (!session.exists()) {
        return false;
      }

      const sessionData = session.data() as Session;
      const locations = sessionData.locations || [];

      // Check if location is already added
      if (!locations.some(l => l.id === locationId)) {
        locations.push({
          id: locationId,
          name: locationData.name,
          type: locationData.type
        });

        await this.update(sessionId, { locations });

        // Create or update relationship
        const relationshipService = RelationshipService.getInstance(this.worldId, this.campaignId);
        await relationshipService.createOrUpdateRelationship({
          type: `${EntityType.SESSION}-${EntityType.LOCATION}`,
          subtype: 'visited',
          sourceId: sessionId,
          sourceType: EntityType.SESSION as any,
          targetId: locationId,
          targetType: EntityType.LOCATION as any,
          properties: {}
        });
      }

      return true;
    } catch (error) {
      console.error(`Error adding location to session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Remove location from session
   * @param sessionId Session ID
   * @param locationId Location ID
   * @returns True if successful
   */
  async removeLocation(
    sessionId: string,
    locationId: string
  ): Promise<boolean> {
    try {
      const sessionRef = doc(db, this.collectionPath, sessionId);
      const session = await getDoc(sessionRef);

      if (!session.exists()) {
        return false;
      }

      const sessionData = session.data() as Session;
      const locations = sessionData.locations || [];

      // Remove location
      const updatedLocations = locations.filter(l => l.id !== locationId);

      await this.update(sessionId, { locations: updatedLocations });

      return true;
    } catch (error) {
      console.error(`Error removing location from session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * List all sessions
   * @param options Query options
   * @returns Array of sessions
   */
  async listEntities(
    options: {
      forceServer?: boolean;
      source?: 'default' | 'server' | 'cache';
      useCache?: boolean;
      cacheTTL?: number;
      pageSize?: number;
    } = {}
  ): Promise<Session[]> {
    const { data } = await this.query(
      [orderBy('sessionNumber', 'desc')],
      options.pageSize || 100
    );

    // Add entityType to each session and map database fields to UI fields
    return data.map(session => ({
      ...session,
      entityType: EntityType.SESSION,
      // Map database fields to expected UI fields
      title: session.name || session.title || `Session #${session.sessionNumber || session.number}`,
      name: session.name || session.title || `Session #${session.sessionNumber || session.number}`,
      number: session.sessionNumber || session.number,
      datePlayed: session.date || session.datePlayed,
      summary: session.description || session.summary
    }));
  }

  /**
   * Create entity (alias for create for compatibility)
   * @param data Entity data
   * @returns Entity ID
   */
  async createEntity(data: Session): Promise<string> {
    return this.create(data);
  }
}
