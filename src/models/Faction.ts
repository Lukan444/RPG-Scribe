/**
 * Faction model
 */
import { BaseEntity, BaseEntityCreationParams, BaseEntityUpdateParams } from './BaseEntity';
import { EntityType } from './EntityType';

/**
 * Faction type enum
 */
export enum FactionType {
  GUILD = 'GUILD',
  KINGDOM = 'KINGDOM',
  CULT = 'CULT',
  MILITARY = 'MILITARY',
  CRIMINAL = 'CRIMINAL',
  RELIGIOUS = 'RELIGIOUS',
  POLITICAL = 'POLITICAL',
  MERCANTILE = 'MERCANTILE',
  ARCANE = 'ARCANE',
  TRIBAL = 'TRIBAL',
  GOVERNMENT = 'GOVERNMENT',
  MERCENARY = 'MERCENARY',
  MERCHANT = 'MERCHANT',
  NOBLE = 'NOBLE',
  OTHER = 'OTHER'
}

/**
 * Faction relationship type enum
 */
export enum FactionRelationshipType {
  ALLY = 'ALLY',
  ENEMY = 'ENEMY',
  NEUTRAL = 'NEUTRAL',
  VASSAL = 'VASSAL',
  OVERLORD = 'OVERLORD',
  TRADE = 'TRADE',
  RIVALRY = 'RIVALRY',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Faction relationship interface
 */
export interface FactionRelationship {
  factionId: string;
  type: FactionRelationshipType;
  description?: string;
}

/**
 * Faction interface
 * Extends BaseEntity with faction-specific properties
 */
export interface Faction extends BaseEntity {
  // Entity type identifier
  entityType: EntityType.FACTION;

  // Faction-specific properties
  factionType: FactionType;
  motto?: string;
  goals?: string[];
  resources?: string;
  scope?: string; // Local, regional, global, etc.

  // Leadership and membership
  leaderId?: string; // Character ID of the leader
  leaderTitle?: string; // Title of the leader (e.g., "King", "Guildmaster")
  memberIds?: string[]; // Character IDs of members

  // Location
  headquartersId?: string; // Location ID of the headquarters
  territoryIds?: string[]; // Location IDs of territories

  // Relationships
  allies?: FactionRelationship[]; // Allied factions
  enemies?: FactionRelationship[]; // Enemy factions

  // Assets
  itemIds?: string[]; // Item IDs owned by the faction

  // Secret information (GM only)
  secretNotes?: string;
  hiddenGoals?: string[];
}

/**
 * Faction creation parameters
 * Extends BaseEntityCreationParams with faction-specific properties
 */
export interface FactionCreationParams extends BaseEntityCreationParams {
  factionType: FactionType;
  motto?: string;
  goals?: string[];
  resources?: string;
  scope?: string;
  leaderId?: string;
  leaderTitle?: string;
  memberIds?: string[];
  headquartersId?: string;
  territoryIds?: string[];
  allies?: FactionRelationship[];
  enemies?: FactionRelationship[];
  itemIds?: string[];
  secretNotes?: string;
  hiddenGoals?: string[];
}

/**
 * Faction update parameters
 * Extends BaseEntityUpdateParams with faction-specific properties
 */
export interface FactionUpdateParams extends BaseEntityUpdateParams {
  factionType?: FactionType;
  motto?: string;
  goals?: string[];
  resources?: string;
  scope?: string;
  leaderId?: string;
  leaderTitle?: string;
  memberIds?: string[];
  headquartersId?: string;
  territoryIds?: string[];
  allies?: FactionRelationship[];
  enemies?: FactionRelationship[];
  itemIds?: string[];
  secretNotes?: string;
  hiddenGoals?: string[];
}
