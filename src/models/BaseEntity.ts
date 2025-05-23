/**
 * Base Entity Interface
 *
 * This interface defines the common properties that all entities in the system share.
 * It serves as the foundation for all specific entity types.
 */

/**
 * Base entity interface that all specific entity types will extend
 */
export interface BaseEntity {
  // Core identification
  id?: string;                 // Unique identifier (optional when creating, required after)
  name?: string;               // Display name of the entity
  description?: string;        // Detailed description of the entity

  // Ownership and context
  createdBy?: string;          // User ID of the creator
  campaignId?: string;         // Campaign this entity belongs to (if applicable)
  worldId?: string;            // World this entity belongs to (if applicable)

  // Media
  imageURL?: string;           // URL to an image representing this entity

  // Metadata
  tags?: string[];             // Descriptive tags or keywords

  // Timestamps
  createdAt?: Date;            // When the entity was created
  updatedAt?: Date;            // When the entity was last updated
}

/**
 * Base creation parameters interface
 * Contains the minimum required fields to create an entity
 */
export interface BaseEntityCreationParams {
  name?: string;               // Display name of the entity
  description?: string;        // Detailed description of the entity
  campaignId?: string;         // Campaign this entity belongs to (if applicable)
  worldId?: string;            // World this entity belongs to (if applicable)
  imageURL?: string;           // URL to an image representing this entity
  tags?: string[];             // Descriptive tags or keywords
}

/**
 * Base update parameters interface
 * Contains the fields that can be updated for an entity
 */
export interface BaseEntityUpdateParams {
  name?: string;               // Display name of the entity
  description?: string;        // Detailed description of the entity
  imageURL?: string;           // URL to an image representing this entity
  tags?: string[];             // Descriptive tags or keywords
}
