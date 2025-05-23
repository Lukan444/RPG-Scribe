/**
 * Entity Type Enum
 *
 * This enum defines all the entity types in the system.
 * It is used for categorization, filtering, and UI display.
 */

/**
 * Entity type enum
 */
export enum EntityType {
  CHARACTER = 'CHARACTER',
  LOCATION = 'LOCATION',
  ITEM = 'ITEM',
  EVENT = 'EVENT',
  SESSION = 'SESSION',
  FACTION = 'FACTION',
  STORY_ARC = 'STORY_ARC',
  CAMPAIGN = 'CAMPAIGN',
  RPG_WORLD = 'RPG_WORLD',
  NOTE = 'NOTE'
}

/**
 * Get the display name for an entity type
 * @param type Entity type
 * @returns Display name
 */
export function getEntityTypeDisplayName(type: EntityType): string {
  switch (type) {
    case EntityType.CHARACTER:
      return 'Character';
    case EntityType.LOCATION:
      return 'Location';
    case EntityType.ITEM:
      return 'Item';
    case EntityType.EVENT:
      return 'Event';
    case EntityType.SESSION:
      return 'Session';
    case EntityType.FACTION:
      return 'Faction';
    case EntityType.STORY_ARC:
      return 'Story Arc';
    case EntityType.CAMPAIGN:
      return 'Campaign';
    case EntityType.RPG_WORLD:
      return 'RPG World';
    case EntityType.NOTE:
      return 'Note';
    default:
      return 'Unknown';
  }
}

/**
 * Get the collection path for an entity type
 * @param type Entity type
 * @param parentId Parent ID (campaign ID or world ID)
 * @returns Collection path
 */
export function getEntityCollectionPath(type: EntityType, parentId?: string): string {
  switch (type) {
    case EntityType.CHARACTER:
      return parentId ? `campaigns/${parentId}/characters` : 'characters';
    case EntityType.LOCATION:
      return parentId ? `campaigns/${parentId}/locations` : 'locations';
    case EntityType.ITEM:
      return parentId ? `campaigns/${parentId}/items` : 'items';
    case EntityType.EVENT:
      return parentId ? `campaigns/${parentId}/events` : 'events';
    case EntityType.SESSION:
      return parentId ? `campaigns/${parentId}/sessions` : 'sessions';
    case EntityType.FACTION:
      return parentId ? `campaigns/${parentId}/factions` : 'factions';
    case EntityType.STORY_ARC:
      return parentId ? `campaigns/${parentId}/storyArcs` : 'storyArcs';
    case EntityType.CAMPAIGN:
      return parentId ? `worlds/${parentId}/campaigns` : 'campaigns';
    case EntityType.RPG_WORLD:
      return 'worlds';
    case EntityType.NOTE:
      return parentId ? `campaigns/${parentId}/notes` : 'notes';
    default:
      throw new Error(`Unknown entity type: ${type}`);
  }
}

/**
 * Get the icon name for an entity type
 * This can be used with icon libraries like @tabler/icons-react
 * @param type Entity type
 * @returns Icon name
 */
export function getEntityTypeIconName(type: EntityType): string {
  switch (type) {
    case EntityType.CHARACTER:
      return 'user';
    case EntityType.LOCATION:
      return 'map-pin';
    case EntityType.ITEM:
      return 'briefcase';
    case EntityType.EVENT:
      return 'calendar-event';
    case EntityType.SESSION:
      return 'notebook';
    case EntityType.FACTION:
      return 'users-group';
    case EntityType.STORY_ARC:
      return 'book';
    case EntityType.CAMPAIGN:
      return 'map';
    case EntityType.RPG_WORLD:
      return 'world';
    case EntityType.NOTE:
      return 'note';
    default:
      return 'question-mark';
  }
}

/**
 * Check if an entity type is valid
 * @param type Entity type to check
 * @returns True if valid
 */
export function isValidEntityType(type: string): boolean {
  return Object.values(EntityType).includes(type as EntityType);
}

/**
 * Get all entity types
 * @returns Array of all entity types
 */
export function getAllEntityTypes(): EntityType[] {
  return Object.values(EntityType);
}
