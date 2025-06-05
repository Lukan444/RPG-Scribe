/**
 * Timeline Editor Integration Service
 * 
 * Provides Firebase integration for the React Timeline Editor system,
 * handling data persistence, real-time updates, and synchronization.
 */

import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { TimelineEditorAdapter, RPGTimelineAction, RPGTimelineEditorConfig } from '../adapters/timelineEditorAdapter';
import { RPGTimelineEvent, TimelineEventType } from '../types/timeline.types';
import { TimelineEntry } from '../models/Timeline';
import { DualTimestamp } from '../types/timeline';
import { EntityType } from '../models/EntityType';

/**
 * Timeline Editor Integration Service
 */
export class TimelineEditorIntegrationService {
  private adapter: TimelineEditorAdapter;
  private worldId: string;
  private campaignId: string;
  private unsubscribers: (() => void)[] = [];

  constructor(worldId: string, campaignId: string = 'default', config?: RPGTimelineEditorConfig) {
    this.worldId = worldId;
    this.campaignId = campaignId;
    this.adapter = new TimelineEditorAdapter({
      worldId,
      campaignId,
      ...config
    });
  }

  /**
   * Load timeline events from Firebase
   */
  async loadTimelineEvents(): Promise<RPGTimelineEvent[]> {
    try {
      const eventsRef = collection(db, 'rpg-worlds', this.worldId, 'campaigns', this.campaignId, 'timeline-events');
      const q = query(
        eventsRef,
        orderBy('startDate', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const events: RPGTimelineEvent[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        events.push({
          id: doc.id,
          title: data.title || 'Untitled Event',
          description: data.description,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate(),
          importance: data.importance || 5,
          eventType: data.eventType || 'custom',
          entityId: data.entityId,
          entityType: data.entityType,
          worldId: this.worldId,
          campaignId: this.campaignId,
          tags: data.tags || [],
          participants: data.participants || [],
          location: data.location,
          gmNotes: data.gmNotes,
          playerVisible: data.playerVisible !== false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          createdBy: data.createdBy || 'unknown'
        });
      });

      return events;
    } catch (error) {
      console.error('Error loading timeline events:', error);
      throw new Error('Failed to load timeline events');
    }
  }

  /**
   * Load timeline entries from Firebase
   */
  async loadTimelineEntries(): Promise<TimelineEntry[]> {
    try {
      const entriesRef = collection(db, 'rpg-worlds', this.worldId, 'campaigns', this.campaignId, 'timeline-entries');
      const q = query(
        entriesRef,
        orderBy('position.sequence', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const entries: TimelineEntry[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          title: data.title || 'Untitled Entry',
          summary: data.summary,
          entryType: data.entryType || 'CUSTOM',
          importance: data.importance || 5,
          position: data.position,
          dualTimestamp: {
            realWorldTime: data.dualTimestamp?.realWorldTime?.toDate(),
            inGameTime: data.dualTimestamp?.inGameTime?.toDate()
          },
          associatedEntityId: data.associatedEntityId,
          associatedEntityType: data.associatedEntityType,
          tags: data.tags || [],
          participants: data.participants || [],
          locationId: data.locationId,
          worldId: this.worldId,
          campaignId: this.campaignId,
          createdBy: data.createdBy || 'unknown',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastValidated: data.lastValidated?.toDate() || new Date(),
          validationStatus: data.validationStatus || 'valid'
        } as TimelineEntry);
      });

      return entries;
    } catch (error) {
      console.error('Error loading timeline entries:', error);
      throw new Error('Failed to load timeline entries');
    }
  }

  /**
   * Save timeline event to Firebase
   */
  async saveTimelineEvent(event: Omit<RPGTimelineEvent, 'id'>): Promise<string> {
    try {
      const eventsRef = collection(db, 'rpg-worlds', this.worldId, 'campaigns', this.campaignId, 'timeline-events');
      
      const eventData = {
        title: event.title,
        description: event.description,
        startDate: Timestamp.fromDate(event.startDate),
        endDate: event.endDate ? Timestamp.fromDate(event.endDate) : null,
        importance: event.importance,
        eventType: event.eventType,
        entityId: event.entityId,
        entityType: event.entityType,
        tags: event.tags || [],
        participants: event.participants || [],
        location: event.location,
        gmNotes: event.gmNotes,
        playerVisible: event.playerVisible,
        createdAt: Timestamp.fromDate(event.createdAt),
        updatedAt: Timestamp.fromDate(event.updatedAt),
        createdBy: event.createdBy
      };

      const docRef = await addDoc(eventsRef, eventData);
      return docRef.id;
    } catch (error) {
      console.error('Error saving timeline event:', error);
      throw new Error('Failed to save timeline event');
    }
  }

  /**
   * Update timeline event in Firebase
   */
  async updateTimelineEvent(eventId: string, updates: Partial<RPGTimelineEvent>): Promise<void> {
    try {
      const eventRef = doc(db, 'rpg-worlds', this.worldId, 'campaigns', this.campaignId, 'timeline-events', eventId);
      
      const updateData: any = {
        updatedAt: Timestamp.now()
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.startDate !== undefined) updateData.startDate = Timestamp.fromDate(updates.startDate);
      if (updates.endDate !== undefined) updateData.endDate = updates.endDate ? Timestamp.fromDate(updates.endDate) : null;
      if (updates.importance !== undefined) updateData.importance = updates.importance;
      if (updates.eventType !== undefined) updateData.eventType = updates.eventType;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.participants !== undefined) updateData.participants = updates.participants;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.gmNotes !== undefined) updateData.gmNotes = updates.gmNotes;
      if (updates.playerVisible !== undefined) updateData.playerVisible = updates.playerVisible;

      await updateDoc(eventRef, updateData);
    } catch (error) {
      console.error('Error updating timeline event:', error);
      throw new Error('Failed to update timeline event');
    }
  }

  /**
   * Delete timeline event from Firebase
   */
  async deleteTimelineEvent(eventId: string): Promise<void> {
    try {
      const eventRef = doc(db, 'rpg-worlds', this.worldId, 'campaigns', this.campaignId, 'timeline-events', eventId);
      await deleteDoc(eventRef);
    } catch (error) {
      console.error('Error deleting timeline event:', error);
      throw new Error('Failed to delete timeline event');
    }
  }

  /**
   * Convert timeline action back to event and save
   */
  async saveActionAsEvent(action: RPGTimelineAction, timelineType: 'real-world' | 'in-game'): Promise<string> {
    const eventData = this.adapter.convertActionToEvent(action, timelineType);
    
    const completeEvent: Omit<RPGTimelineEvent, 'id'> = {
      title: eventData.title || 'New Event',
      description: eventData.description,
      startDate: eventData.startDate || new Date(),
      endDate: eventData.endDate,
      importance: eventData.importance || 5,
      eventType: eventData.eventType || 'custom',
      entityId: eventData.entityId,
      entityType: eventData.entityType,
      worldId: this.worldId,
      campaignId: this.campaignId,
      tags: eventData.tags || [],
      participants: eventData.participants || [],
      location: eventData.location,
      gmNotes: eventData.gmNotes,
      playerVisible: eventData.playerVisible !== false,
      createdAt: eventData.createdAt || new Date(),
      updatedAt: eventData.updatedAt || new Date(),
      createdBy: eventData.createdBy || 'current-user'
    };

    return this.saveTimelineEvent(completeEvent);
  }

  /**
   * Subscribe to real-time timeline updates
   */
  subscribeToTimelineUpdates(callback: (events: RPGTimelineEvent[]) => void): () => void {
    const eventsRef = collection(db, 'rpg-worlds', this.worldId, 'campaigns', this.campaignId, 'timeline-events');
    const q = query(eventsRef, orderBy('startDate', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events: RPGTimelineEvent[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        events.push({
          id: doc.id,
          title: data.title || 'Untitled Event',
          description: data.description,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate(),
          importance: data.importance || 5,
          eventType: data.eventType || 'custom',
          entityId: data.entityId,
          entityType: data.entityType,
          worldId: this.worldId,
          campaignId: this.campaignId,
          tags: data.tags || [],
          participants: data.participants || [],
          location: data.location,
          gmNotes: data.gmNotes,
          playerVisible: data.playerVisible !== false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          createdBy: data.createdBy || 'unknown'
        });
      });

      callback(events);
    }, (error) => {
      console.error('Error in timeline subscription:', error);
    });

    this.unsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Get timeline data in React Timeline Editor format
   */
  async getTimelineEditorData() {
    const events = await this.loadTimelineEvents();
    return this.adapter.convertEventsToTimelineData(events);
  }

  /**
   * Get timeline entries data in React Timeline Editor format
   */
  async getTimelineEntriesEditorData() {
    const entries = await this.loadTimelineEntries();
    return this.adapter.convertTimelineEntriesToTimelineData(entries);
  }

  /**
   * Batch update multiple events
   */
  async batchUpdateEvents(updates: Array<{ id: string; data: Partial<RPGTimelineEvent> }>): Promise<void> {
    try {
      const batch = writeBatch(db);

      updates.forEach(({ id, data }) => {
        const eventRef = doc(db, 'rpg-worlds', this.worldId, 'campaigns', this.campaignId, 'timeline-events', id);
        const updateData: any = {
          ...data,
          updatedAt: Timestamp.now()
        };

        // Convert dates to Timestamps
        if (data.startDate) updateData.startDate = Timestamp.fromDate(data.startDate);
        if (data.endDate) updateData.endDate = Timestamp.fromDate(data.endDate);
        if (data.createdAt) updateData.createdAt = Timestamp.fromDate(data.createdAt);

        batch.update(eventRef, updateData);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error batch updating events:', error);
      throw new Error('Failed to batch update events');
    }
  }

  /**
   * Clean up subscriptions
   */
  cleanup(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }

  /**
   * Load entities for timeline rows
   */
  async loadEntitiesForTimeline(): Promise<{ [entityType: string]: any[] }> {
    const entities: { [entityType: string]: any[] } = {};

    try {
      // Load Characters
      const charactersRef = collection(db, 'rpg-worlds', this.worldId, 'campaigns', this.campaignId, 'characters');
      const charactersSnapshot = await getDocs(charactersRef);
      entities[EntityType.CHARACTER] = charactersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Load Locations
      const locationsRef = collection(db, 'rpg-worlds', this.worldId, 'campaigns', this.campaignId, 'locations');
      const locationsSnapshot = await getDocs(locationsRef);
      entities[EntityType.LOCATION] = locationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Load Items
      const itemsRef = collection(db, 'rpg-worlds', this.worldId, 'campaigns', this.campaignId, 'items');
      const itemsSnapshot = await getDocs(itemsRef);
      entities[EntityType.ITEM] = itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Load Sessions
      const sessionsRef = collection(db, 'rpg-worlds', this.worldId, 'campaigns', this.campaignId, 'sessions');
      const sessionsSnapshot = await getDocs(sessionsRef);
      entities[EntityType.SESSION] = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Load Factions
      const factionsRef = collection(db, 'rpg-worlds', this.worldId, 'campaigns', this.campaignId, 'factions');
      const factionsSnapshot = await getDocs(factionsRef);
      entities[EntityType.FACTION] = factionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Load Story Arcs
      const storyArcsRef = collection(db, 'rpg-worlds', this.worldId, 'campaigns', this.campaignId, 'story-arcs');
      const storyArcsSnapshot = await getDocs(storyArcsRef);
      entities[EntityType.STORY_ARC] = storyArcsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Load Events
      const eventsRef = collection(db, 'rpg-worlds', this.worldId, 'campaigns', this.campaignId, 'events');
      const eventsSnapshot = await getDocs(eventsRef);
      entities[EntityType.EVENT] = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Load Notes
      const notesRef = collection(db, 'rpg-worlds', this.worldId, 'campaigns', this.campaignId, 'notes');
      const notesSnapshot = await getDocs(notesRef);
      entities[EntityType.NOTE] = notesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return entities;
    } catch (error) {
      console.error('Error loading entities for timeline:', error);
      return {};
    }
  }

  /**
   * Get entity-based timeline data
   */
  async getEntityBasedTimelineData() {
    const [events, entities] = await Promise.all([
      this.loadTimelineEvents(),
      this.loadEntitiesForTimeline()
    ]);

    return this.adapter.convertEventsToEntityBasedTimelineData(events, entities);
  }

  /**
   * Subscribe to entity changes for real-time timeline updates
   */
  subscribeToEntityChanges(callback: (entities: { [entityType: string]: any[] }) => void): () => void {
    const unsubscribers: (() => void)[] = [];

    // Subscribe to each entity type
    const entityTypes = [
      EntityType.CHARACTER,
      EntityType.LOCATION,
      EntityType.ITEM,
      EntityType.SESSION,
      EntityType.FACTION,
      EntityType.STORY_ARC,
      EntityType.EVENT,
      EntityType.NOTE
    ];

    const entities: { [entityType: string]: any[] } = {};

    entityTypes.forEach(entityType => {
      const collectionName = this.getCollectionName(entityType);
      const entityRef = collection(db, 'rpg-worlds', this.worldId, 'campaigns', this.campaignId, collectionName);

      const unsubscribe = onSnapshot(entityRef, (snapshot) => {
        entities[entityType] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        callback({ ...entities });
      }, (error) => {
        console.error(`Error in ${entityType} subscription:`, error);
      });

      unsubscribers.push(unsubscribe);
    });

    this.unsubscribers.push(...unsubscribers);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * Get collection name for entity type
   */
  private getCollectionName(entityType: EntityType): string {
    switch (entityType) {
      case EntityType.CHARACTER: return 'characters';
      case EntityType.LOCATION: return 'locations';
      case EntityType.ITEM: return 'items';
      case EntityType.SESSION: return 'sessions';
      case EntityType.FACTION: return 'factions';
      case EntityType.STORY_ARC: return 'story-arcs';
      case EntityType.EVENT: return 'events';
      case EntityType.NOTE: return 'notes';
      case EntityType.CAMPAIGN: return 'campaigns';
      case EntityType.RPG_WORLD: return 'rpg-worlds';
      default: return 'unknown';
    }
  }

  /**
   * Get adapter instance
   */
  getAdapter(): TimelineEditorAdapter {
    return this.adapter;
  }
}

export default TimelineEditorIntegrationService;
