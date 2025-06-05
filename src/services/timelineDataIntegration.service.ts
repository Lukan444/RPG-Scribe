/**
 * Timeline Data Integration Service
 * Handles real data connection between Firestore and timeline components
 */

import { FirestoreService } from './firestore.service';
import { TimelineService } from './timeline.service';
import { SessionService } from './session.service';
import { EventService } from './event.service';
import { CharacterService } from './character.service';
import { CampaignService } from './campaign.service';
import { TimelineEntry } from '../models/Timeline';
import { Session } from '../models/Session';
import { Event } from '../models/Event';
import { Character } from '../models/Character';
import { Campaign } from '../models/Campaign';

export interface TimelineDataContext {
  worldId: string;
  campaignId?: string;
  entityId?: string;
  entityType?: 'character' | 'campaign' | 'session' | 'event' | 'location' | 'npc';
}

export interface TimelineEventData {
  id: string;
  title: string;
  description?: string;
  realWorldTime: Date;
  inGameTime: Date;
  timeline: 'real-world' | 'in-game';
  entityId?: string;
  entityType?: string;
  entityName?: string;
  tags?: string[];
  participants?: string[];
  locations?: string[];
  conflicts?: string[];
  metadata?: Record<string, any>;
}

/**
 * Timeline Data Integration Service
 * Provides real data integration for timeline components
 */
export class TimelineDataIntegrationService {
  private static instance: TimelineDataIntegrationService;
  private firestoreService: FirestoreService<any>;
  private timelineService: TimelineService;

  private constructor() {
    // FirestoreService is a generic class, not a singleton
    this.firestoreService = new FirestoreService('timeline_data');
    // TimelineService is instantiated with world and campaign IDs
    this.timelineService = new TimelineService();
  }

  public static getInstance(): TimelineDataIntegrationService {
    if (!TimelineDataIntegrationService.instance) {
      TimelineDataIntegrationService.instance = new TimelineDataIntegrationService();
    }
    return TimelineDataIntegrationService.instance;
  }

  /**
   * Convert any date-like value to a proper Date object
   */
  private ensureDate(dateValue: any): Date {
    if (!dateValue) {
      return new Date();
    }

    // Already a Date object
    if (dateValue instanceof Date) {
      return dateValue;
    }

    // Firestore Timestamp object
    if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
      return new Date(dateValue.seconds * 1000);
    }

    // Firestore Timestamp with toDate method
    if (dateValue && typeof dateValue.toDate === 'function') {
      return dateValue.toDate();
    }

    // String or number
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      return new Date(dateValue);
    }

    // Fallback to current date
    console.warn('Unable to convert date value:', dateValue);
    return new Date();
  }

  /**
   * Load timeline events for a given context
   */
  public async loadTimelineEvents(context: TimelineDataContext): Promise<TimelineEventData[]> {
    const events: TimelineEventData[] = [];

    try {
      // Load timeline entries
      const timelineEntries = await this.timelineService.getTimelineEntries({
        sortBy: 'sequence',
        sortDirection: 'asc'
      });

      // Convert timeline entries to timeline event data
      for (const entry of timelineEntries) {
        events.push(this.convertTimelineEntryToEventData(entry));
      }

      // Load sessions if campaign context is available
      if (context.campaignId) {
        const sessionService = SessionService.getInstance(context.worldId, context.campaignId);
        const sessions = await sessionService.listEntities();
        
        for (const session of sessions) {
          events.push(this.convertSessionToEventData(session, context));
        }
      }

      // Load events if campaign context is available
      if (context.campaignId) {
        const eventService = EventService.getInstance(context.worldId, context.campaignId);
        const campaignEvents = await eventService.listEntities();
        
        for (const event of campaignEvents) {
          events.push(this.convertEventToEventData(event, context));
        }
      }

      // Filter by entity if specified
      if (context.entityId && context.entityType && context.entityId.trim()) {
        const entityId = context.entityId; // Type assertion after null check
        return events.filter(event =>
          event.entityId === entityId ||
          (event.participants && event.participants.includes(entityId)) ||
          (event.locations && event.locations.includes(entityId))
        );
      }

      return events;
    } catch (error) {
      console.error('Error loading timeline events:', error);
      return [];
    }
  }

  /**
   * Create a new timeline event
   */
  public async createTimelineEvent(
    context: TimelineDataContext,
    eventData: Partial<TimelineEventData>
  ): Promise<string | null> {
    try {
      if (!context.campaignId) {
        throw new Error('Campaign ID is required to create timeline events');
      }

      // Create timeline entry
      const timelineEntry: Partial<TimelineEntry> = {
        title: eventData.title || 'New Event',
        summary: eventData.description,
        dualTimestamp: {
          realWorldTime: eventData.realWorldTime || new Date(),
          inGameTime: eventData.inGameTime || new Date()
        },
        associatedEntityId: eventData.entityId || context.entityId || '',
        associatedEntityType: eventData.entityType || context.entityType || 'event',
        tags: eventData.tags || [],
        participants: eventData.participants,
        locationId: eventData.locations?.[0]
      };

      const entryId = await this.timelineService.createTimelineEntry(timelineEntry as any);

      return entryId;
    } catch (error) {
      console.error('Error creating timeline event:', error);
      return null;
    }
  }

  /**
   * Update an existing timeline event
   */
  public async updateTimelineEvent(
    context: TimelineDataContext,
    eventId: string,
    updates: Partial<TimelineEventData>
  ): Promise<boolean> {
    try {
      if (!context.campaignId) {
        throw new Error('Campaign ID is required to update timeline events');
      }

      const timelineUpdates: Partial<TimelineEntry> = {
        title: updates.title,
        summary: updates.description,
        dualTimestamp: {
          realWorldTime: updates.realWorldTime,
          inGameTime: updates.inGameTime
        },
        tags: updates.tags,
        participants: updates.participants,
        locationId: updates.locations?.[0]
      };

      await this.timelineService.updateTimelineEntry(eventId, timelineUpdates as any);

      return true;
    } catch (error) {
      console.error('Error updating timeline event:', error);
      return false;
    }
  }

  /**
   * Delete a timeline event
   */
  public async deleteTimelineEvent(
    context: TimelineDataContext,
    eventId: string
  ): Promise<boolean> {
    try {
      if (!context.campaignId) {
        throw new Error('Campaign ID is required to delete timeline events');
      }

      await this.timelineService.deleteTimelineEntry(eventId);

      return true;
    } catch (error) {
      console.error('Error deleting timeline event:', error);
      return false;
    }
  }

  /**
   * Get timeline statistics for a context
   */
  public async getTimelineStatistics(context: TimelineDataContext): Promise<{
    totalEvents: number;
    recentEvents: number;
    conflictsCount: number;
    completionPercentage: number;
  }> {
    try {
      const events = await this.loadTimelineEvents(context);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const recentEvents = events.filter(event => 
        event.realWorldTime >= thirtyDaysAgo
      ).length;

      const conflictsCount = events.filter(event => 
        event.conflicts && event.conflicts.length > 0
      ).length;

      // Calculate completion percentage based on timeline density
      const completionPercentage = Math.min(100, Math.max(0, 
        (events.length / 50) * 100 // Assume 50 events is "complete"
      ));

      return {
        totalEvents: events.length,
        recentEvents,
        conflictsCount,
        completionPercentage: Math.round(completionPercentage)
      };
    } catch (error) {
      console.error('Error getting timeline statistics:', error);
      return {
        totalEvents: 0,
        recentEvents: 0,
        conflictsCount: 0,
        completionPercentage: 0
      };
    }
  }

  /**
   * Convert TimelineEntry to TimelineEventData
   */
  private convertTimelineEntryToEventData(entry: TimelineEntry): TimelineEventData {
    return {
      id: entry.id || '',
      title: entry.title || 'Untitled Event',
      description: entry.summary || entry.description,
      realWorldTime: this.ensureDate(entry.dualTimestamp?.realWorldTime || entry.createdAt),
      inGameTime: this.ensureDate(entry.dualTimestamp?.inGameTime),
      timeline: 'in-game', // Timeline entries are primarily in-game
      entityId: entry.associatedEntityId,
      entityType: entry.associatedEntityType,
      entityName: entry.associatedEntityId, // TODO: Resolve entity name
      tags: entry.tags || [],
      participants: entry.participants,
      locations: entry.locationId ? [entry.locationId] : [],
      metadata: {
        entryType: entry.entryType,
        importance: entry.importance,
        outcome: entry.outcome,
        isSecret: entry.isSecret,
        validationStatus: entry.validationStatus
      }
    };
  }

  /**
   * Convert Session to TimelineEventData
   */
  private convertSessionToEventData(session: any, context: TimelineDataContext): TimelineEventData {
    // Handle both service Session type and model Session type
    const sessionData = session as any;

    return {
      id: sessionData.id || '',
      title: sessionData.title || sessionData.name || `Session #${sessionData.number || 0}`,
      description: sessionData.summary,
      realWorldTime: this.ensureDate(sessionData.datePlayed),
      inGameTime: this.ensureDate(sessionData.inGameTime || sessionData.inGameStartTime),
      timeline: 'real-world', // Sessions are primarily real-world
      entityId: sessionData.id,
      entityType: 'session',
      entityName: sessionData.title || sessionData.name,
      participants: sessionData.participantIds ||
        (sessionData.participants ? sessionData.participants.map((p: any) => p.id) : []),
      locations: sessionData.locationIds ||
        (sessionData.locations ? sessionData.locations.map((l: any) => l.id) : []),
      metadata: {
        duration: sessionData.duration,
        status: sessionData.status,
        number: sessionData.number,
        entityType: sessionData.entityType || 'session'
      }
    };
  }

  /**
   * Convert Event to TimelineEventData
   */
  private convertEventToEventData(event: any, context: TimelineDataContext): TimelineEventData {
    // Handle both service Event type and model Event type
    const eventData = event as any;

    return {
      id: eventData.id || '',
      title: eventData.name || eventData.timelineTitle || 'Untitled Event',
      description: eventData.description || eventData.timelineSummary,
      realWorldTime: this.ensureDate(eventData.createdAt || eventData.date),
      inGameTime: this.ensureDate(eventData.inGameTime || eventData.eventDate || eventData.date),
      timeline: 'in-game', // Events are primarily in-game
      entityId: eventData.id,
      entityType: 'event',
      entityName: eventData.name,
      participants: eventData.participantIds ||
        (eventData.participants ? eventData.participants.map((p: any) => p.id) : []),
      locations: eventData.locationId ? [eventData.locationId] :
        (eventData.location ? [eventData.location.id] : []),
      tags: eventData.tags || [],
      metadata: {
        eventType: eventData.eventType || eventData.type,
        importance: eventData.importance,
        consequences: eventData.consequences,
        outcome: eventData.outcome,
        entityType: eventData.entityType || 'event',
        isSecret: eventData.isSecret
      }
    };
  }
}

// Export singleton instance
export const timelineDataIntegration = TimelineDataIntegrationService.getInstance();
