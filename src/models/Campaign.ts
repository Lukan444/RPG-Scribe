/**
 * Campaign model
 *
 * Represents a campaign within an RPG World. A campaign is a series of connected
 * adventures or sessions that form a coherent narrative. It contains characters,
 * locations, items, events, and other entities.
 */

/**
 * Campaign status enum
 */
export enum CampaignStatus {
  PLANNING = 'planning',   // Campaign is in planning stage
  ACTIVE = 'active',       // Campaign is currently active
  PAUSED = 'paused',       // Campaign is temporarily paused
  COMPLETED = 'completed', // Campaign has been completed
  ABANDONED = 'abandoned', // Campaign has been abandoned
  ARCHIVED = 'archived'    // Campaign is archived
}

/**
 * Campaign privacy setting enum
 */
export enum CampaignPrivacy {
  PRIVATE = 'private',     // Only GM and invited players can view
  PUBLIC = 'public'        // Anyone can view the campaign
}

/**
 * Campaign interface
 */
export interface Campaign {
  // Core fields
  id?: string;                   // Unique identifier
  worldId: string;               // ID of the parent RPG World
  name: string;                  // Name of the campaign
  createdBy: string;             // User ID of creator/GM

  // Content fields
  description: string;           // Rich description of the campaign
  setting: string;               // Setting of the campaign (may inherit from world)
  system: string;                // Game system used (may inherit from world)
  systemVersion?: string;        // Version of the game system

  // Status and timeline
  status: CampaignStatus;        // Current status of the campaign
  startDate?: Date;              // When the campaign started
  endDate?: Date;                // When the campaign ended (if completed)

  // Media and metadata
  imageURL?: string;             // URL to a cover image for the campaign
  bannerURL?: string;            // URL to a banner image for the campaign
  tags?: string[];               // Descriptive tags or keywords

  // Configuration
  privacySetting: CampaignPrivacy; // Controls access to the campaign
  isPublic?: boolean;            // Whether the campaign is public (legacy)

  // Player management
  playerIds: string[];           // Array of player user IDs
  gmIds: string[];               // Array of GM user IDs (can be multiple)

  // Statistics and tracking
  sessionCount?: number;         // Number of sessions in this campaign
  characterCount?: number;       // Number of characters in this campaign
  locationCount?: number;        // Number of locations in this campaign
  factionCount?: number;         // Number of factions in this campaign
  itemCount?: number;            // Number of items in this campaign
  eventCount?: number;           // Number of events in this campaign
  storyArcCount?: number;        // Number of story arcs in this campaign

  // Timestamps
  createdAt?: Date;              // When the campaign was created
  updatedAt?: Date;              // When the campaign was last updated
  lastSessionAt?: Date;          // When the last session was held
  nextSessionAt?: Date;          // When the next session is scheduled
}

/**
 * Campaign creation parameters
 */
export interface CampaignCreationParams {
  // Required fields
  worldId: string;               // ID of the parent RPG World
  name: string;                  // Name of the campaign
  description: string;           // Rich description of the campaign
  createdBy: string;             // User ID of creator/GM

  // Optional fields
  setting?: string;              // Setting of the campaign
  system?: string;               // Game system used
  systemVersion?: string;        // Version of the game system
  status?: CampaignStatus;       // Current status of the campaign
  startDate?: Date | null;       // When the campaign started
  endDate?: Date | null;         // When the campaign ended
  imageURL?: string;             // URL to a cover image
  bannerURL?: string;            // URL to a banner image
  tags?: string[];               // Descriptive tags or keywords
  privacySetting?: CampaignPrivacy; // Privacy setting
  isPublic?: boolean;            // Whether the campaign is public (legacy)
  playerIds?: string[];          // Array of player user IDs
  gmIds?: string[];              // Array of GM user IDs
}

/**
 * Campaign update parameters
 */
export interface CampaignUpdateParams {
  name?: string;                 // Name of the campaign
  description?: string;          // Rich description of the campaign
  setting?: string;              // Setting of the campaign
  system?: string;               // Game system used
  systemVersion?: string;        // Version of the game system
  status?: CampaignStatus;       // Current status of the campaign
  startDate?: Date | null;       // When the campaign started
  endDate?: Date | null;         // When the campaign ended
  imageURL?: string;             // URL to a cover image
  bannerURL?: string;            // URL to a banner image
  tags?: string[];               // Descriptive tags or keywords
  privacySetting?: CampaignPrivacy; // Privacy setting
  isPublic?: boolean;            // Whether the campaign is public (legacy)
  playerIds?: string[];          // Array of player user IDs
  gmIds?: string[];              // Array of GM user IDs
  nextSessionAt?: Date | null;   // When the next session is scheduled
}