/**
 * Note model
 */
import { BaseEntity } from './BaseEntity';
import { EntityType } from './EntityType';

/**
 * Note type enum
 */
export enum NoteType {
  GENERAL = 'GENERAL',
  LORE = 'LORE',
  QUEST = 'QUEST',
  PLAYER = 'PLAYER',
  DM = 'DM',
  SESSION = 'SESSION'
}

/**
 * Note interface
 */
export interface Note extends BaseEntity {
  worldId?: string;
  campaignId?: string;
  title?: string;
  content: string;
  noteType: NoteType;
  relatedEntityId?: string;
  relatedEntityType?: string;
  isPrivate: boolean;
  entityType: EntityType.NOTE;

  // Relationship fields
  characterIds?: string[];
  locationIds?: string[];
  itemIds?: string[];
  factionIds?: string[];
  sessionIds?: string[];
  storyArcIds?: string[];

  // Denormalized relationship data
  relatedEntities?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

/**
 * Note creation parameters
 */
export interface NoteCreationParams {
  campaignId: string;
  title: string;
  content: string;
  noteType: NoteType;
  tags?: string[];
  relatedEntityId?: string;
  relatedEntityType?: string;
  isPrivate?: boolean;
}

/**
 * Note update parameters
 */
export interface NoteUpdateParams {
  title?: string;
  content?: string;
  noteType?: NoteType;
  tags?: string[];
  relatedEntityId?: string;
  relatedEntityType?: string;
  isPrivate?: boolean;
}
