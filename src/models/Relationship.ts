/**
 * Relationship model
 */

/**
 * Entity type enum
 */
export enum EntityType {
  CHARACTER = 'CHARACTER',
  LOCATION = 'LOCATION',
  EVENT = 'EVENT',
  ITEM = 'ITEM',
  SESSION = 'SESSION',
  CAMPAIGN = 'CAMPAIGN',
  RPGWORLD = 'RPGWORLD',
  NOTE = 'NOTE'
}

/**
 * Relationship type enum
 */
export enum RelationshipType {
  // Character relationships
  FRIEND = 'FRIEND',
  ALLY = 'ALLY',
  ENEMY = 'ENEMY',
  FAMILY = 'FAMILY',
  MENTOR = 'MENTOR',
  STUDENT = 'STUDENT',
  RIVAL = 'RIVAL',
  LOVER = 'LOVER',
  
  // Location relationships
  CONTAINS = 'CONTAINS',
  NEAR = 'NEAR',
  CONNECTED_TO = 'CONNECTED_TO',
  
  // Item relationships
  OWNS = 'OWNS',
  CREATED = 'CREATED',
  LOCATED_AT = 'LOCATED_AT',
  
  // Event relationships
  PARTICIPATED_IN = 'PARTICIPATED_IN',
  OCCURRED_AT = 'OCCURRED_AT',
  CAUSED = 'CAUSED',
  RESULTED_FROM = 'RESULTED_FROM',
  
  // Generic relationships
  RELATED_TO = 'RELATED_TO',
  PART_OF = 'PART_OF',
  REFERENCES = 'REFERENCES'
}

/**
 * Relationship interface
 */
export interface Relationship {
  id: string;
  campaignId: string;
  sourceEntityId: string;
  sourceEntityType: EntityType;
  targetEntityId: string;
  targetEntityType: EntityType;
  relationshipType: RelationshipType;
  description?: string;
  strength?: number; // 1-10 scale
  isDirectional: boolean;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
}

/**
 * Relationship creation parameters
 */
export interface RelationshipCreationParams {
  campaignId: string;
  sourceEntityId: string;
  sourceEntityType: EntityType;
  targetEntityId: string;
  targetEntityType: EntityType;
  relationshipType: RelationshipType;
  description?: string;
  strength?: number;
  isDirectional?: boolean;
}

/**
 * Relationship update parameters
 */
export interface RelationshipUpdateParams {
  relationshipType?: RelationshipType;
  description?: string;
  strength?: number;
  isDirectional?: boolean;
}
