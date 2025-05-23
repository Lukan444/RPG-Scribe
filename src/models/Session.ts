/**
 * Session model
 */
import { BaseEntity, BaseEntityCreationParams, BaseEntityUpdateParams } from './BaseEntity';
import { EntityType } from './EntityType';

/**
 * Session status enum
 * Represents the current status of a session
 */
export enum SessionStatus {
  PLANNED = 'planned',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  IN_PROGRESS = 'in_progress'
}

/**
 * Key moment interface
 * Represents a significant moment or highlight from a session
 */
export interface KeyMoment {
  id: string;
  title: string;
  description: string;
  transcriptPosition?: number; // Position in the transcript
  characterIds?: string[]; // Characters involved
  locationId?: string; // Location where it happened
  itemIds?: string[]; // Items involved
}

/**
 * Session interface
 * Extends BaseEntity with session-specific properties
 */
export interface Session extends BaseEntity {
  // Entity type identifier
  entityType: EntityType.SESSION;

  // Session-specific properties
  number: number;
  name: string; // Display name, typically derived from title or session number
  date?: Date;
  datePlayed?: Date | any; // Supports Firestore Timestamp
  duration?: number; // Duration in minutes
  durationMinutes?: number;
  isCompleted?: boolean;
  status?: SessionStatus | string;
  sessionNumber?: number; // Alias for number property
  title?: string;

  // Content
  summary?: string;
  notes?: string;
  dmNotes?: string;
  transcript?: string;
  transcriptId?: string;
  recordingId?: string;
  keyMoments?: KeyMoment[];

  // Relationships
  participants?: Array<{
    id: string;
    name: string;
    userId?: string;
  }>;
  locations?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  events?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  participantIds?: string[]; // Character IDs
  locationIds?: string[]; // Location IDs
  eventIds?: string[]; // Event IDs
  itemIds?: string[]; // Item IDs
  factionIds?: string[]; // Faction IDs
  storyArcIds?: string[]; // Story Arc IDs
}

/**
 * Session creation parameters
 * Extends BaseEntityCreationParams with session-specific properties
 */
export interface SessionCreationParams extends BaseEntityCreationParams {
  number?: number;
  date?: Date;
  durationMinutes?: number;
  isCompleted?: boolean;
  summary?: string;
  notes?: string;
  dmNotes?: string;
  transcript?: string;
  transcriptId?: string;
  recordingId?: string;
  keyMoments?: KeyMoment[];
  participantIds?: string[];
  locationIds?: string[];
  eventIds?: string[];
  itemIds?: string[];
  factionIds?: string[];
  storyArcIds?: string[];
}

/**
 * Session update parameters
 * Extends BaseEntityUpdateParams with session-specific properties
 */
export interface SessionUpdateParams extends BaseEntityUpdateParams {
  number?: number;
  date?: Date;
  durationMinutes?: number;
  isCompleted?: boolean;
  summary?: string;
  notes?: string;
  dmNotes?: string;
  transcript?: string;
  transcriptId?: string;
  recordingId?: string;
  keyMoments?: KeyMoment[];
  participantIds?: string[];
  locationIds?: string[];
  eventIds?: string[];
  itemIds?: string[];
  factionIds?: string[];
  storyArcIds?: string[];
}
