/**
 * Event model
 */
import { BaseEntity, BaseEntityCreationParams, BaseEntityUpdateParams } from './BaseEntity';
import { EntityType } from './EntityType';

/**
 * Import EventType enum from separate file
 */
import { EventType } from './EventType';

/**
 * Event importance enum
 */
export enum EventImportance {
  TRIVIAL = 1,
  MINOR = 3,
  MODERATE = 5,
  MAJOR = 7,
  CRITICAL = 10
}

/**
 * Event interface
 * Extends BaseEntity with event-specific properties
 */
export interface Event extends BaseEntity {
  // Entity type identifier
  entityType: EntityType.EVENT;

  // Event-specific properties
  eventType: EventType;
  eventDate?: Date; // In-game date
  date?: Date | any; // Alias for eventDate, supports Firestore Timestamp
  timelinePosition: number; // For ordering events
  importance?: number; // 1-10 scale

  // Relationships
  sessionId?: string;
  locationId?: string;
  participantIds?: string[]; // Character IDs
  itemIds?: string[]; // Item IDs involved in the event
  factionIds?: string[]; // Faction IDs involved in the event
  storyArcId?: string; // Story arc this event is part of

  // Outcome
  outcome?: string; // Description of what happened
  consequences?: string[]; // List of consequences from this event
}

/**
 * Event creation parameters
 * Extends BaseEntityCreationParams with event-specific properties
 */
export interface EventCreationParams extends BaseEntityCreationParams {
  eventType: EventType;
  eventDate?: Date;
  timelinePosition?: number;
  importance?: number;
  sessionId?: string;
  locationId?: string;
  participantIds?: string[];
  itemIds?: string[];
  factionIds?: string[];
  storyArcId?: string;
  outcome?: string;
  consequences?: string[];
}

/**
 * Event update parameters
 * Extends BaseEntityUpdateParams with event-specific properties
 */
export interface EventUpdateParams extends BaseEntityUpdateParams {
  eventType?: EventType;
  eventDate?: Date;
  timelinePosition?: number;
  importance?: number;
  sessionId?: string;
  locationId?: string;
  participantIds?: string[];
  itemIds?: string[];
  factionIds?: string[];
  storyArcId?: string;
  outcome?: string;
  consequences?: string[];
}
