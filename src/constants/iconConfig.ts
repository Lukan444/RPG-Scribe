/**
 * Icon Configuration System
 *
 * This file defines standardized icon configurations for all entity types in the system.
 * It provides consistent sizing, colors, and grouping for icons used throughout the application.
 *
 * The configuration includes:
 * - Standard icon size using Mantine's rem() function
 * - Entity icons mapping for all entity types
 * - Color scheme for different entity categories
 * - Logical grouping of entity types
 */

import { rem } from '@mantine/core';
import {
  IconUser,
  IconMap,
  IconMapPin,
  IconSword,
  IconCalendarEvent,
  IconBook,
  IconUsersGroup,
  IconTimeline,
  IconWorld,
  IconNotes,
  IconNotebook,
  IconBriefcase,
  IconBookmark
} from '@tabler/icons-react';
import { EntityType } from '../models/EntityType';

// Re-export EntityType for convenience
export { EntityType };

/**
 * Standard icon size using fixed pixel values
 * This ensures consistent sizing across the application and prevents SVG calc() errors
 */
export const ICON_SIZE = 18;

/**
 * Standard icon size for larger icons
 */
export const ICON_SIZE_LARGE = 24;

/**
 * Entity category colors
 * These colors are used to visually distinguish different entity categories
 */
export const ENTITY_CATEGORY_COLORS = {
  CHARACTER_GROUP: 'blue',
  WORLD_ELEMENTS_GROUP: 'green',
  NARRATIVE_GROUP: 'violet',
  CAMPAIGN_GROUP: 'orange',
  RPG_WORLD_GROUP: 'cyan',
  DEFAULT: 'gray'
};

/**
 * Entity icons mapping
 * Maps each entity type to its corresponding icon component
 */
export const ENTITY_ICONS = {
  [EntityType.CHARACTER]: IconUser,
  [EntityType.LOCATION]: IconMapPin,
  [EntityType.ITEM]: IconSword, // Updated to IconSword for better representation of RPG items
  [EntityType.EVENT]: IconCalendarEvent,
  [EntityType.SESSION]: IconNotebook,
  [EntityType.FACTION]: IconUsersGroup,
  [EntityType.STORY_ARC]: IconTimeline, // Updated to IconTimeline for better representation of story arcs
  [EntityType.CAMPAIGN]: IconMap,
  [EntityType.RPG_WORLD]: IconWorld,
  [EntityType.NOTE]: IconBookmark // Updated to IconBookmark for better representation of notes
};

/**
 * Entity category mapping
 * Groups entity types into logical categories
 */
export const ENTITY_CATEGORIES = {
  CHARACTER_GROUP: [EntityType.CHARACTER, EntityType.FACTION],
  WORLD_ELEMENTS_GROUP: [EntityType.LOCATION, EntityType.ITEM],
  NARRATIVE_GROUP: [EntityType.EVENT, EntityType.SESSION, EntityType.STORY_ARC, EntityType.NOTE],
  CAMPAIGN_GROUP: [EntityType.CAMPAIGN],
  RPG_WORLD_GROUP: [EntityType.RPG_WORLD]
};

/**
 * Get the category for an entity type
 * @param entityType The entity type to get the category for
 * @returns The category name
 */
export function getEntityCategory(entityType: EntityType): string {
  for (const [category, types] of Object.entries(ENTITY_CATEGORIES)) {
    if (types.includes(entityType)) {
      return category;
    }
  }
  return 'DEFAULT';
}

/**
 * Get the color for an entity type based on its category
 * @param entityType The entity type to get the color for
 * @returns The color name
 */
export function getEntityColor(entityType: EntityType): string {
  const category = getEntityCategory(entityType);
  return ENTITY_CATEGORY_COLORS[category as keyof typeof ENTITY_CATEGORY_COLORS] || ENTITY_CATEGORY_COLORS.DEFAULT;
}

/**
 * Get the icon component for an entity type
 * @param entityType The entity type to get the icon for
 * @returns The icon component
 */
export function getEntityIcon(entityType: EntityType) {
  return ENTITY_ICONS[entityType] || null;
}

/**
 * Category display names
 */
export const CATEGORY_DISPLAY_NAMES = {
  CHARACTER_GROUP: 'Characters & NPCs',
  WORLD_ELEMENTS_GROUP: 'World Elements',
  NARRATIVE_GROUP: 'Narrative',
  CAMPAIGN_GROUP: 'Campaigns',
  RPG_WORLD_GROUP: 'RPG Worlds',
  DEFAULT: 'Other'
};

/**
 * Get the display name for a category
 * @param category The category to get the display name for
 * @returns The display name
 */
export function getCategoryDisplayName(category: string): string {
  return CATEGORY_DISPLAY_NAMES[category as keyof typeof CATEGORY_DISPLAY_NAMES] || CATEGORY_DISPLAY_NAMES.DEFAULT;
}
