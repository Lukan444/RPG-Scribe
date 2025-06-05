/**
 * RPG World model
 *
 * Represents a game world or setting that can contain multiple campaigns.
 * The RPG World serves as a container for shared lore and provides context
 * for campaigns set within it.
 */

/**
 * Privacy setting for RPG Worlds
 */
export enum RPGWorldPrivacy {
  PRIVATE = 'private',     // Only creator and invited GMs can view
  FRIENDS = 'friends',     // Only friends can view the world
  SHARED = 'shared',       // Players in linked campaigns can view world-level info
  PUBLIC = 'public'        // Anyone can view the world
}

/**
 * RPG World interface
 */
export interface RPGWorld {
  // Core fields
  id?: string;                   // Unique identifier
  name: string;                  // Name of the game world or setting
  createdBy: string;             // User ID of creator/owner (usually a GM)

  // Content fields
  description: string;           // Rich description of the world's setting, history, and atmosphere
  setting: string;               // Setting of the RPG world (e.g., fantasy, sci-fi)
  system: string;                // Game system used (e.g., D&D 5e, Pathfinder)
  systemVersion?: string;        // Version of the game system
  genre?: string;                // Genre of the RPG world (e.g., high fantasy, cyberpunk)

  // Media and metadata
  worldMapURL?: string;          // URL to an uploaded map image for the world
  imageURL?: string;             // URL to a cover image for the world
  tags?: string[];               // Descriptive tags or keywords for the world

  // Configuration
  sharedLore: boolean;           // Indicates if lore entries are shared across multiple campaigns
  privacySetting: RPGWorldPrivacy; // Controls access to the world

  // Statistics and tracking
  campaignCount?: number;        // Number of campaigns in this world
  characterCount?: number;       // Number of characters in this world
  locationCount?: number;        // Number of locations in this world
  factionCount?: number;         // Number of factions in this world
  itemCount?: number;            // Number of items in this world
  eventCount?: number;           // Number of events in this world
  sessionCount?: number;         // Number of sessions in this world
  storyArcCount?: number;        // Number of story arcs in this world
  noteCount?: number;            // Number of notes in this world

  // Timestamps
  createdAt?: Date;              // When the world was created
  updatedAt?: Date;              // When the world was last updated
}

/**
 * RPG World creation parameters
 */
export interface RPGWorldCreationParams {
  // Required fields
  name: string;                  // Name of the game world or setting
  description: string;           // Rich description of the world
  setting: string;               // Setting of the RPG world
  system: string;                // Game system used

  // Optional fields
  systemVersion?: string;        // Version of the game system
  genre?: string;                // Genre of the RPG world
  worldMapURL?: string;          // URL to an uploaded map image
  imageURL?: string;             // URL to a cover image
  tags?: string[];               // Descriptive tags or keywords
  sharedLore?: boolean;          // Whether lore is shared across campaigns
  privacySetting?: RPGWorldPrivacy; // Privacy setting for the world
}

/**
 * RPG World update parameters
 */
export interface RPGWorldUpdateParams {
  name?: string;                 // Name of the game world or setting
  description?: string;          // Rich description of the world
  setting?: string;              // Setting of the RPG world
  system?: string;               // Game system used
  systemVersion?: string;        // Version of the game system
  genre?: string;                // Genre of the RPG world
  worldMapURL?: string;          // URL to an uploaded map image
  imageURL?: string;             // URL to a cover image
  tags?: string[];               // Descriptive tags or keywords
  sharedLore?: boolean;          // Whether lore is shared across campaigns
  privacySetting?: RPGWorldPrivacy; // Privacy setting for the world
}