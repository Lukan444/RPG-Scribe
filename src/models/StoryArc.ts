/**
 * Story Arc model
 */
import { BaseEntity, BaseEntityCreationParams, BaseEntityUpdateParams } from './BaseEntity';
import { EntityType } from './EntityType';

/**
 * Story Arc type enum
 */
export enum StoryArcType {
  MAIN_PLOT = 'MAIN_PLOT',
  SIDE_QUEST = 'SIDE_QUEST',
  CHARACTER_ARC = 'CHARACTER_ARC',
  BACKGROUND_PLOT = 'BACKGROUND_PLOT',
  FACTION_ARC = 'FACTION_ARC',
  LOCATION_ARC = 'LOCATION_ARC',
  ITEM_ARC = 'ITEM_ARC',
  OTHER = 'OTHER'
}

/**
 * Story Arc status enum
 */
export enum StoryArcStatus {
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ABANDONED = 'ABANDONED'
}

/**
 * Clue interface
 * Represents a clue or mystery in a story arc
 */
export interface Clue {
  id: string;
  description: string;
  discovered: boolean;
  sessionId?: string; // Session where it was discovered
  locationId?: string; // Location where it was discovered
  characterId?: string; // Character who discovered it
  itemId?: string; // Item related to the clue
}

/**
 * Story Arc interface
 * Extends BaseEntity with story arc-specific properties
 */
export interface StoryArc extends BaseEntity {
  // Entity type identifier
  entityType: EntityType.STORY_ARC;
  
  // Story Arc-specific properties
  arcType: StoryArcType;
  status: StoryArcStatus;
  parentArcId?: string; // Parent story arc (for sub-arcs)
  
  // Timeline
  startSessionId?: string; // Session where this arc began
  endSessionId?: string; // Session where this arc ended
  relatedSessionIds?: string[]; // All sessions that contributed to this arc
  
  // Narrative importance
  importance?: number; // 1-10 scale
  
  // Content
  clues?: Clue[]; // Clues and mysteries
  resolution?: string; // How the arc was resolved
  nextSteps?: string; // GM notes on planned next events
  
  // Relationships
  characterIds?: string[]; // Characters involved
  locationIds?: string[]; // Locations involved
  itemIds?: string[]; // Items involved
  factionIds?: string[]; // Factions involved
  childArcIds?: string[]; // Child story arcs
}

/**
 * Story Arc creation parameters
 * Extends BaseEntityCreationParams with story arc-specific properties
 */
export interface StoryArcCreationParams extends BaseEntityCreationParams {
  arcType: StoryArcType;
  status?: StoryArcStatus;
  parentArcId?: string;
  startSessionId?: string;
  endSessionId?: string;
  relatedSessionIds?: string[];
  importance?: number;
  clues?: Clue[];
  resolution?: string;
  nextSteps?: string;
  characterIds?: string[];
  locationIds?: string[];
  itemIds?: string[];
  factionIds?: string[];
}

/**
 * Story Arc update parameters
 * Extends BaseEntityUpdateParams with story arc-specific properties
 */
export interface StoryArcUpdateParams extends BaseEntityUpdateParams {
  arcType?: StoryArcType;
  status?: StoryArcStatus;
  parentArcId?: string;
  startSessionId?: string;
  endSessionId?: string;
  relatedSessionIds?: string[];
  importance?: number;
  clues?: Clue[];
  resolution?: string;
  nextSteps?: string;
  characterIds?: string[];
  locationIds?: string[];
  itemIds?: string[];
  factionIds?: string[];
}
