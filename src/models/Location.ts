/**
 * Location model
 */
import { BaseEntity, BaseEntityCreationParams, BaseEntityUpdateParams } from './BaseEntity';
import { EntityType } from './EntityType';

/**
 * Location type enum
 */
export enum LocationType {
  CITY = 'CITY',
  DUNGEON = 'DUNGEON',
  WILDERNESS = 'WILDERNESS',
  BUILDING = 'BUILDING',
  PLANE = 'PLANE',
  REGION = 'REGION',
  LANDMARK = 'LANDMARK',
  OTHER = 'OTHER'
}

/**
 * Climate type enum
 */
export enum ClimateType {
  ARCTIC = 'ARCTIC',
  TEMPERATE = 'TEMPERATE',
  TROPICAL = 'TROPICAL',
  DESERT = 'DESERT',
  MOUNTAIN = 'MOUNTAIN',
  COASTAL = 'COASTAL',
  UNDERWATER = 'UNDERWATER',
  SUBTERRANEAN = 'SUBTERRANEAN',
  MAGICAL = 'MAGICAL',
  OTHER = 'OTHER'
}

/**
 * Location interface
 * Extends BaseEntity with location-specific properties
 */
export interface Location extends BaseEntity {
  // Entity type identifier
  entityType: EntityType.LOCATION;

  // Location-specific properties
  locationType: LocationType;
  region?: string; // Region name - used in UI
  population?: number; // Population count - used in UI
  parentLocationId?: string;
  geography?: string;
  climate?: ClimateType;
  mapCoordinates?: {
    x: number;
    y: number;
  };

  // Relationships
  childLocationIds?: string[];
  characterIds?: string[];
  itemIds?: string[];
  factionIds?: string[];
}

/**
 * Location creation parameters
 * Extends BaseEntityCreationParams with location-specific properties
 */
export interface LocationCreationParams extends BaseEntityCreationParams {
  locationType?: LocationType;
  parentLocationId?: string;
  geography?: string;
  climate?: ClimateType;
  mapCoordinates?: {
    x: number;
    y: number;
  };
}

/**
 * Location update parameters
 * Extends BaseEntityUpdateParams with location-specific properties
 */
export interface LocationUpdateParams extends BaseEntityUpdateParams {
  locationType?: LocationType;
  parentLocationId?: string;
  geography?: string;
  climate?: ClimateType;
  mapCoordinates?: {
    x: number;
    y: number;
  };
}
