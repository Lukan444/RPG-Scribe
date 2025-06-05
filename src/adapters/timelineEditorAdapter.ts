/**
 * Timeline Editor Adapter
 * 
 * Converts RPG Scribe timeline data to React Timeline Editor format
 * and provides integration utilities for the new timeline system.
 */

import { TimelineRow, TimelineAction, TimelineEffect } from '@xzdarcy/react-timeline-editor';
import { RPGTimelineEvent, TimelineEventType } from '../types/timeline.types';
import { TimelineEntry } from '../models/Timeline';
import { DualTimestamp } from '../types/timeline';
import { EntityType } from '../models/EntityType';

/**
 * Extended Timeline Action for RPG Scribe
 */
export interface RPGTimelineAction extends TimelineAction {
  rpgEventId: string;
  eventType: TimelineEventType;
  importance: number;
  description?: string;
  participants?: string[];
  location?: string;
  playerVisible: boolean;
  gmNotes?: string;
  tags?: string[];
  entityId?: string;
  entityType?: EntityType;
}

/**
 * Entity Row Configuration
 */
export interface EntityRowConfig {
  id: string;
  title: string;
  entityType: EntityType;
  entityId?: string;
  groupId?: string;
  isGroup?: boolean;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  icon?: string;
  color?: string;
  visible?: boolean;
  order?: number;
}

/**
 * Extended Timeline Effect for RPG Scribe
 */
export interface RPGTimelineEffect extends TimelineEffect {
  eventType: TimelineEventType;
  color: string;
  icon?: string;
  description?: string;
}

/**
 * Timeline Editor Configuration for RPG Scribe
 */
export interface RPGTimelineEditorConfig {
  worldId?: string;
  campaignId?: string;
  entityId?: string;
  entityType?: string;
  height?: number;
  enableEditing?: boolean;
  showRealWorldTime?: boolean;
  showInGameTime?: boolean;
  dualTimelineMode?: boolean;
  enableEntityRows?: boolean;
  enableHierarchicalGrouping?: boolean;
  enableCrossRowSynchronization?: boolean;
  enableEntityFiltering?: boolean;
  enableVisualRelationships?: boolean;
  collapsedGroups?: string[];
  hiddenEntityTypes?: EntityType[];
  hiddenEntities?: string[];
}

/**
 * Timeline Editor Adapter Class
 */
export class TimelineEditorAdapter {
  private config: RPGTimelineEditorConfig;

  constructor(config: RPGTimelineEditorConfig = {}) {
    this.config = {
      height: 400,
      enableEditing: true,
      showRealWorldTime: true,
      showInGameTime: true,
      dualTimelineMode: true,
      enableEntityRows: true,
      enableHierarchicalGrouping: true,
      enableCrossRowSynchronization: true,
      enableEntityFiltering: true,
      enableVisualRelationships: true,
      collapsedGroups: [],
      hiddenEntityTypes: [],
      hiddenEntities: [],
      ...config
    };
  }

  /**
   * Convert RPG Timeline Events to Timeline Editor format
   */
  convertEventsToTimelineData(events: RPGTimelineEvent[]): {
    rows: TimelineRow[];
    effects: Record<string, RPGTimelineEffect>;
  } {
    const effects: Record<string, RPGTimelineEffect> = {};
    const realWorldRow: TimelineRow = {
      id: 'real-world',
      actions: []
    };
    const inGameRow: TimelineRow = {
      id: 'in-game',
      actions: []
    };

    // Create effects for each event type
    this.createEventTypeEffects(effects);

    // Convert events to actions
    events.forEach(event => {
      const effectId = `effect-${event.eventType}`;
      
      // Create action for real-world timeline
      if (this.config.showRealWorldTime) {
        const realWorldAction: RPGTimelineAction = {
          id: `${event.id}-real`,
          start: this.dateToTimelineTime(event.createdAt),
          end: this.dateToTimelineTime(event.updatedAt || event.createdAt),
          effectId,
          rpgEventId: event.id,
          eventType: event.eventType,
          importance: event.importance,
          description: event.description,
          participants: event.participants,
          location: event.location,
          playerVisible: event.playerVisible,
          gmNotes: event.gmNotes,
          tags: event.tags
        };
        realWorldRow.actions.push(realWorldAction);
      }

      // Create action for in-game timeline
      if (this.config.showInGameTime) {
        const inGameAction: RPGTimelineAction = {
          id: `${event.id}-game`,
          start: this.dateToTimelineTime(event.startDate),
          end: this.dateToTimelineTime(event.endDate || event.startDate),
          effectId,
          rpgEventId: event.id,
          eventType: event.eventType,
          importance: event.importance,
          description: event.description,
          participants: event.participants,
          location: event.location,
          playerVisible: event.playerVisible,
          gmNotes: event.gmNotes,
          tags: event.tags
        };
        inGameRow.actions.push(inGameAction);
      }
    });

    const rows: TimelineRow[] = [];
    if (this.config.showRealWorldTime) rows.push(realWorldRow);
    if (this.config.showInGameTime) rows.push(inGameRow);

    return { rows, effects };
  }

  /**
   * Convert Timeline Entries to Timeline Editor format
   */
  convertTimelineEntriesToTimelineData(entries: TimelineEntry[]): {
    rows: TimelineRow[];
    effects: Record<string, RPGTimelineEffect>;
  } {
    const effects: Record<string, RPGTimelineEffect> = {};
    const realWorldRow: TimelineRow = {
      id: 'real-world',
      actions: []
    };
    const inGameRow: TimelineRow = {
      id: 'in-game',
      actions: []
    };

    // Create effects for each entry type
    this.createEntryTypeEffects(effects);

    // Convert entries to actions
    entries.forEach(entry => {
      const effectId = `effect-${entry.entryType}`;
      
      // Create action for real-world timeline
      if (this.config.showRealWorldTime && entry.dualTimestamp?.realWorldTime) {
        const realWorldAction: RPGTimelineAction = {
          id: `${entry.id}-real`,
          start: this.dateToTimelineTime(entry.dualTimestamp.realWorldTime),
          end: this.dateToTimelineTime(entry.dualTimestamp.realWorldTime),
          effectId,
          rpgEventId: entry.id || '',
          eventType: this.mapEntryTypeToEventType(entry.entryType),
          importance: entry.importance || 5,
          description: entry.summary,
          participants: entry.participants,
          location: entry.locationId,
          playerVisible: true,
          tags: entry.tags
        };
        realWorldRow.actions.push(realWorldAction);
      }

      // Create action for in-game timeline
      if (this.config.showInGameTime && entry.dualTimestamp?.inGameTime) {
        const inGameAction: RPGTimelineAction = {
          id: `${entry.id}-game`,
          start: this.dateToTimelineTime(entry.dualTimestamp.inGameTime),
          end: this.dateToTimelineTime(entry.dualTimestamp.inGameTime),
          effectId,
          rpgEventId: entry.id || '',
          eventType: this.mapEntryTypeToEventType(entry.entryType),
          importance: entry.importance || 5,
          description: entry.summary,
          participants: entry.participants,
          location: entry.locationId,
          playerVisible: true,
          tags: entry.tags
        };
        inGameRow.actions.push(inGameAction);
      }
    });

    const rows: TimelineRow[] = [];
    if (this.config.showRealWorldTime) rows.push(realWorldRow);
    if (this.config.showInGameTime) rows.push(inGameRow);

    return { rows, effects };
  }

  /**
   * Convert Timeline Editor action back to RPG Timeline Event
   */
  convertActionToEvent(action: RPGTimelineAction, timelineType: 'real-world' | 'in-game'): Partial<RPGTimelineEvent> {
    const baseEvent: Partial<RPGTimelineEvent> = {
      id: action.rpgEventId,
      title: action.effectId.replace('effect-', '').replace('-', ' '),
      description: action.description,
      importance: action.importance,
      eventType: action.eventType,
      participants: action.participants,
      location: action.location,
      playerVisible: action.playerVisible,
      gmNotes: action.gmNotes,
      tags: action.tags,
      worldId: this.config.worldId || '',
      campaignId: this.config.campaignId || ''
    };

    if (timelineType === 'real-world') {
      baseEvent.createdAt = this.timelineTimeToDate(action.start);
      baseEvent.updatedAt = this.timelineTimeToDate(action.end);
    } else {
      baseEvent.startDate = this.timelineTimeToDate(action.start);
      baseEvent.endDate = this.timelineTimeToDate(action.end);
    }

    return baseEvent;
  }

  /**
   * Create effects for event types
   */
  private createEventTypeEffects(effects: Record<string, RPGTimelineEffect>): void {
    const eventTypeColors: Record<TimelineEventType, string> = {
      'session': '#4CAF50',
      'quest': '#2196F3',
      'milestone': '#FF9800',
      'character-event': '#9C27B0',
      'world-event': '#F44336',
      'combat': '#795548',
      'social': '#E91E63',
      'exploration': '#009688',
      'custom': '#607D8B'
    };

    Object.entries(eventTypeColors).forEach(([eventType, color]) => {
      effects[`effect-${eventType}`] = {
        id: `effect-${eventType}`,
        name: eventType.replace('-', ' ').toUpperCase(),
        eventType: eventType as TimelineEventType,
        color,
        description: `${eventType} events`
      };
    });
  }

  /**
   * Create effects for timeline entry types
   */
  private createEntryTypeEffects(effects: Record<string, RPGTimelineEffect>): void {
    // This would map timeline entry types to effects
    // For now, using a default effect
    effects['effect-timeline-entry'] = {
      id: 'effect-timeline-entry',
      name: 'Timeline Entry',
      eventType: 'custom',
      color: '#607D8B',
      description: 'Timeline entry events'
    };
  }

  /**
   * Map timeline entry type to event type
   */
  private mapEntryTypeToEventType(entryType: string): TimelineEventType {
    const mapping: Record<string, TimelineEventType> = {
      'SESSION_START': 'session',
      'SESSION_END': 'session',
      'QUEST_START': 'quest',
      'QUEST_COMPLETE': 'quest',
      'MILESTONE': 'milestone',
      'CHARACTER_INTRODUCTION': 'character-event',
      'WORLD_EVENT': 'world-event',
      'COMBAT': 'combat',
      'SOCIAL_ENCOUNTER': 'social',
      'EXPLORATION': 'exploration'
    };

    return mapping[entryType] || 'custom';
  }

  /**
   * Convert Date to timeline time (seconds)
   */
  private dateToTimelineTime(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  /**
   * Convert timeline time (seconds) to Date
   */
  private timelineTimeToDate(time: number): Date {
    return new Date(time * 1000);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RPGTimelineEditorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): RPGTimelineEditorConfig {
    return { ...this.config };
  }

  /**
   * Convert events to hierarchical entity-based timeline data
   */
  convertEventsToEntityBasedTimelineData(
    events: RPGTimelineEvent[],
    entities: { [entityType: string]: any[] } = {}
  ): {
    rows: TimelineRow[];
    effects: Record<string, RPGTimelineEffect>;
    entityRows: EntityRowConfig[];
  } {
    const effects: Record<string, RPGTimelineEffect> = {};
    const rows: TimelineRow[] = [];
    const entityRows: EntityRowConfig[] = [];

    // Create effects for each event type
    this.createEventTypeEffects(effects);

    // Create meta timeline rows (Real World and In-Game)
    if (this.config.showRealWorldTime) {
      const realWorldRow: TimelineRow = {
        id: 'real-world',
        actions: []
      };
      rows.push(realWorldRow);
      entityRows.push({
        id: 'real-world',
        title: '🌍 Real World Timeline',
        entityType: EntityType.EVENT,
        isGroup: false,
        visible: true,
        order: 0,
        color: '#2196F3'
      });
    }

    if (this.config.showInGameTime) {
      const inGameRow: TimelineRow = {
        id: 'in-game',
        actions: []
      };
      rows.push(inGameRow);
      entityRows.push({
        id: 'in-game',
        title: '⚔️ In-Game Timeline',
        entityType: EntityType.EVENT,
        isGroup: false,
        visible: true,
        order: 1,
        color: '#4CAF50'
      });
    }

    // Create entity-based rows if enabled
    if (this.config.enableEntityRows) {
      this.createEntityBasedRows(events, entities, rows, entityRows, effects);
    }

    // Populate rows with events
    this.populateRowsWithEvents(events, rows, effects);

    return { rows, effects, entityRows };
  }

  /**
   * Create entity-based timeline rows
   */
  private createEntityBasedRows(
    events: RPGTimelineEvent[],
    entities: { [entityType: string]: any[] },
    rows: TimelineRow[],
    entityRows: EntityRowConfig[],
    effects: Record<string, RPGTimelineEffect>
  ): void {
    const entityTypeOrder = [
      EntityType.CHARACTER,
      EntityType.LOCATION,
      EntityType.ITEM,
      EntityType.SESSION,
      EntityType.FACTION,
      EntityType.STORY_ARC,
      EntityType.EVENT,
      EntityType.NOTE
    ];

    let currentOrder = 10; // Start after meta rows

    entityTypeOrder.forEach(entityType => {
      if (this.config.hiddenEntityTypes?.includes(entityType)) return;

      const entityList = entities[entityType] || [];
      const relevantEvents = events.filter(event =>
        event.entityType === entityType ||
        this.isEventRelevantToEntityType(event, entityType)
      );

      if (entityList.length === 0 && relevantEvents.length === 0) return;

      // Create group header
      if (this.config.enableHierarchicalGrouping) {
        const groupId = `group-${entityType.toLowerCase()}`;
        entityRows.push({
          id: groupId,
          title: this.getEntityTypeGroupTitle(entityType),
          entityType,
          isGroup: true,
          isCollapsible: true,
          isCollapsed: this.config.collapsedGroups?.includes(groupId) || false,
          visible: true,
          order: currentOrder++,
          color: this.getEntityTypeColor(entityType)
        });
      }

      // Create individual entity rows
      entityList.forEach(entity => {
        if (this.config.hiddenEntities?.includes(entity.id)) return;

        const entityRowId = `${entityType.toLowerCase()}-${entity.id}`;
        const entityRow: TimelineRow = {
          id: entityRowId,
          actions: []
        };
        rows.push(entityRow);

        entityRows.push({
          id: entityRowId,
          title: entity.name || entity.title || `${entityType} ${entity.id}`,
          entityType,
          entityId: entity.id,
          groupId: this.config.enableHierarchicalGrouping ? `group-${entityType.toLowerCase()}` : undefined,
          visible: true,
          order: currentOrder++,
          color: this.getEntityTypeColor(entityType),
          icon: this.getEntityTypeIcon(entityType)
        });
      });

      // Create a general row for events of this type without specific entity
      if (relevantEvents.some(event => !event.entityId)) {
        const generalRowId = `${entityType.toLowerCase()}-general`;
        const generalRow: TimelineRow = {
          id: generalRowId,
          actions: []
        };
        rows.push(generalRow);

        entityRows.push({
          id: generalRowId,
          title: `${this.getEntityTypeDisplayName(entityType)} Events`,
          entityType,
          groupId: this.config.enableHierarchicalGrouping ? `group-${entityType.toLowerCase()}` : undefined,
          visible: true,
          order: currentOrder++,
          color: this.getEntityTypeColor(entityType),
          icon: this.getEntityTypeIcon(entityType)
        });
      }
    });
  }

  /**
   * Check if event is relevant to entity type
   */
  private isEventRelevantToEntityType(event: RPGTimelineEvent, entityType: EntityType): boolean {
    switch (entityType) {
      case EntityType.CHARACTER:
        return !!(event.participants && event.participants.length > 0);
      case EntityType.LOCATION:
        return !!event.location;
      case EntityType.SESSION:
        return event.eventType === 'session';
      case EntityType.FACTION:
        return event.eventType === 'world-event' || Boolean(event.tags?.includes('faction'));
      case EntityType.STORY_ARC:
        return event.eventType === 'quest' || event.eventType === 'milestone';
      default:
        return false;
    }
  }

  /**
   * Populate timeline rows with events
   */
  private populateRowsWithEvents(
    events: RPGTimelineEvent[],
    rows: TimelineRow[],
    effects: Record<string, RPGTimelineEffect>
  ): void {
    events.forEach(event => {
      const effectId = `effect-${event.eventType}`;

      // Add to real-world timeline
      if (this.config.showRealWorldTime) {
        const realWorldAction: RPGTimelineAction = {
          id: `${event.id}-real`,
          start: this.dateToTimelineTime(event.createdAt),
          end: this.dateToTimelineTime(event.updatedAt || event.createdAt),
          effectId,
          rpgEventId: event.id,
          eventType: event.eventType,
          importance: event.importance,
          description: event.description,
          participants: event.participants,
          location: event.location,
          playerVisible: event.playerVisible,
          gmNotes: event.gmNotes,
          tags: event.tags,
          entityId: event.entityId,
          entityType: event.entityType
        };

        const realWorldRow = rows.find(row => row.id === 'real-world');
        if (realWorldRow) {
          realWorldRow.actions.push(realWorldAction);
        }
      }

      // Add to in-game timeline
      if (this.config.showInGameTime) {
        const inGameAction: RPGTimelineAction = {
          id: `${event.id}-game`,
          start: this.dateToTimelineTime(event.startDate),
          end: this.dateToTimelineTime(event.endDate || event.startDate),
          effectId,
          rpgEventId: event.id,
          eventType: event.eventType,
          importance: event.importance,
          description: event.description,
          participants: event.participants,
          location: event.location,
          playerVisible: event.playerVisible,
          gmNotes: event.gmNotes,
          tags: event.tags,
          entityId: event.entityId,
          entityType: event.entityType
        };

        const inGameRow = rows.find(row => row.id === 'in-game');
        if (inGameRow) {
          inGameRow.actions.push(inGameAction);
        }
      }

      // Add to entity-specific rows if enabled
      if (this.config.enableEntityRows && this.config.enableCrossRowSynchronization) {
        this.addEventToEntityRows(event, rows, effectId);
      }
    });
  }

  /**
   * Add event to relevant entity rows
   */
  private addEventToEntityRows(
    event: RPGTimelineEvent,
    rows: TimelineRow[],
    effectId: string
  ): void {
    const relevantRowIds = this.getRelevantRowIds(event);

    relevantRowIds.forEach(rowId => {
      const row = rows.find(r => r.id === rowId);
      if (row) {
        const entityAction: RPGTimelineAction = {
          id: `${event.id}-${rowId}`,
          start: this.dateToTimelineTime(event.startDate),
          end: this.dateToTimelineTime(event.endDate || event.startDate),
          effectId,
          rpgEventId: event.id,
          eventType: event.eventType,
          importance: event.importance,
          description: event.description,
          participants: event.participants,
          location: event.location,
          playerVisible: event.playerVisible,
          gmNotes: event.gmNotes,
          tags: event.tags,
          entityId: event.entityId,
          entityType: event.entityType
        };

        row.actions.push(entityAction);
      }
    });
  }

  /**
   * Get relevant row IDs for an event
   */
  private getRelevantRowIds(event: RPGTimelineEvent): string[] {
    const rowIds: string[] = [];

    // Add primary entity row
    if (event.entityId && event.entityType) {
      rowIds.push(`${event.entityType.toLowerCase()}-${event.entityId}`);
    } else if (event.entityType) {
      rowIds.push(`${event.entityType.toLowerCase()}-general`);
    }

    // Add participant rows
    if (event.participants) {
      event.participants.forEach(participantId => {
        rowIds.push(`character-${participantId}`);
      });
    }

    // Add location row
    if (event.location) {
      rowIds.push(`location-${event.location}`);
    }

    return rowIds;
  }

  /**
   * Get entity type group title
   */
  private getEntityTypeGroupTitle(entityType: EntityType): string {
    const icons = {
      [EntityType.CHARACTER]: '👥',
      [EntityType.LOCATION]: '🗺️',
      [EntityType.ITEM]: '📦',
      [EntityType.SESSION]: '🎲',
      [EntityType.FACTION]: '⚔️',
      [EntityType.STORY_ARC]: '📜',
      [EntityType.EVENT]: '📅',
      [EntityType.NOTE]: '📝',
      [EntityType.CAMPAIGN]: '🏛️',
      [EntityType.RPG_WORLD]: '🌍'
    };

    return `${icons[entityType]} ${this.getEntityTypeDisplayName(entityType)}s`;
  }

  /**
   * Get entity type display name
   */
  private getEntityTypeDisplayName(entityType: EntityType): string {
    switch (entityType) {
      case EntityType.CHARACTER: return 'Character';
      case EntityType.LOCATION: return 'Location';
      case EntityType.ITEM: return 'Item';
      case EntityType.SESSION: return 'Session';
      case EntityType.FACTION: return 'Faction';
      case EntityType.STORY_ARC: return 'Story Arc';
      case EntityType.EVENT: return 'Event';
      case EntityType.NOTE: return 'Note';
      case EntityType.CAMPAIGN: return 'Campaign';
      case EntityType.RPG_WORLD: return 'RPG World';
      default: return 'Unknown';
    }
  }

  /**
   * Get entity type color
   */
  private getEntityTypeColor(entityType: EntityType): string {
    const colors = {
      [EntityType.CHARACTER]: '#9C27B0',
      [EntityType.LOCATION]: '#009688',
      [EntityType.ITEM]: '#FF9800',
      [EntityType.SESSION]: '#4CAF50',
      [EntityType.FACTION]: '#F44336',
      [EntityType.STORY_ARC]: '#2196F3',
      [EntityType.EVENT]: '#607D8B',
      [EntityType.NOTE]: '#795548',
      [EntityType.CAMPAIGN]: '#3F51B5',
      [EntityType.RPG_WORLD]: '#E91E63'
    };

    return colors[entityType] || '#607D8B';
  }

  /**
   * Get entity type icon
   */
  private getEntityTypeIcon(entityType: EntityType): string {
    const icons = {
      [EntityType.CHARACTER]: '👤',
      [EntityType.LOCATION]: '📍',
      [EntityType.ITEM]: '📦',
      [EntityType.SESSION]: '🎲',
      [EntityType.FACTION]: '⚔️',
      [EntityType.STORY_ARC]: '📜',
      [EntityType.EVENT]: '📅',
      [EntityType.NOTE]: '📝',
      [EntityType.CAMPAIGN]: '🏛️',
      [EntityType.RPG_WORLD]: '🌍'
    };

    return icons[entityType] || '❓';
  }
}

/**
 * Default adapter instance
 */
export const timelineEditorAdapter = new TimelineEditorAdapter();
