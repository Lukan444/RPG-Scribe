/**
 * Character model
 */
import { BaseEntity, BaseEntityCreationParams, BaseEntityUpdateParams } from './BaseEntity';
import { EntityType } from './EntityType';

/**
 * Character type enum
 */
export enum CharacterType {
  PLAYER_CHARACTER = 'PLAYER_CHARACTER',
  NPC = 'NPC',
  COMPANION = 'COMPANION',
  TEMPORARY = 'TEMPORARY'
}

/**
 * Character interface
 * Extends BaseEntity with character-specific properties
 */
export interface Character extends BaseEntity {
  // Entity type identifier
  entityType: EntityType.CHARACTER;

  // Character-specific properties
  characterType: CharacterType;
  type?: string; // PC, NPC, etc. - used in UI
  isPlayerCharacter?: boolean;
  primaryControllerId?: string;
  race?: string;
  class?: string;
  level?: number;
  background?: string;
  alignment?: string;
  currentLocationId?: string;
  inventory?: Array<{
    id: string;
    quantity?: number;
    name?: string;
    type?: string;
  }>;

  // Relationships
  factionIds?: string[];
  relationshipIds?: string[];
}

/**
 * Character creation parameters
 * Extends BaseEntityCreationParams with character-specific properties
 */
export interface CharacterCreationParams extends BaseEntityCreationParams {
  characterType?: CharacterType;
  isPlayerCharacter?: boolean;
  primaryControllerId?: string;
  race?: string;
  class?: string;
  level?: number;
  background?: string;
  alignment?: string;
  currentLocationId?: string;
  factionIds?: string[];
}

/**
 * Character update parameters
 * Extends BaseEntityUpdateParams with character-specific properties
 */
export interface CharacterUpdateParams extends BaseEntityUpdateParams {
  characterType?: CharacterType;
  isPlayerCharacter?: boolean;
  primaryControllerId?: string;
  race?: string;
  class?: string;
  level?: number;
  background?: string;
  alignment?: string;
  currentLocationId?: string;
  factionIds?: string[];
}
