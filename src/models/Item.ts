/**
 * Item model
 */
import { BaseEntity, BaseEntityCreationParams, BaseEntityUpdateParams } from './BaseEntity';
import { EntityType } from './EntityType';

/**
 * Import ItemType enum from separate file
 */
import { ItemType } from './ItemType';

/**
 * Item rarity enum
 */
export enum ItemRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  VERY_RARE = 'VERY_RARE',
  LEGENDARY = 'LEGENDARY',
  ARTIFACT = 'ARTIFACT'
}

/**
 * Item interface
 * Extends BaseEntity with item-specific properties
 */
export interface Item extends BaseEntity {
  // Entity type identifier
  entityType: EntityType.ITEM;

  // Item-specific properties
  itemType: ItemType | string;
  rarity?: ItemRarity | string;
  value?: number;
  weight?: number;
  properties?: string | Record<string, any>;
  requiresAttunement?: boolean;

  // Ownership and location
  currentOwnerId?: string;
  currentLocationId?: string;

  // History
  previousOwnerIds?: string[];

  // Magical properties
  magicalProperties?: {
    description: string;
    charges?: number;
    maxCharges?: number;
    rechargeable?: boolean;
  };
}

/**
 * Item creation parameters
 * Extends BaseEntityCreationParams with item-specific properties
 */
export interface ItemCreationParams extends BaseEntityCreationParams {
  itemType: ItemType | string;
  rarity?: ItemRarity | string;
  value?: number;
  weight?: number;
  properties?: string | Record<string, any>;
  requiresAttunement?: boolean;
  currentOwnerId?: string;
  currentLocationId?: string;
  magicalProperties?: {
    description: string;
    charges?: number;
    maxCharges?: number;
    rechargeable?: boolean;
  };
}

/**
 * Item update parameters
 * Extends BaseEntityUpdateParams with item-specific properties
 */
export interface ItemUpdateParams extends BaseEntityUpdateParams {
  itemType?: ItemType | string;
  rarity?: ItemRarity | string;
  value?: number;
  weight?: number;
  properties?: string | Record<string, any>;
  requiresAttunement?: boolean;
  currentOwnerId?: string;
  currentLocationId?: string;
  magicalProperties?: {
    description: string;
    charges?: number;
    maxCharges?: number;
    rechargeable?: boolean;
  };
}
