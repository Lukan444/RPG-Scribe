/**
 * Utility functions for converting between different EntityType implementations
 */

import { EntityType as ModelEntityType } from '../models/EntityType';
import { EntityType as ServiceEntityType } from '../services/relationship.service';

/**
 * Convert a model EntityType to a service EntityType
 * @param modelType The EntityType from the model layer
 * @returns The corresponding EntityType from the service layer
 */
export function convertToServiceEntityType(modelType: ModelEntityType): ServiceEntityType {
  switch (modelType) {
    case ModelEntityType.CHARACTER:
      return ServiceEntityType.CHARACTER;
    case ModelEntityType.LOCATION:
      return ServiceEntityType.LOCATION;
    case ModelEntityType.ITEM:
      return ServiceEntityType.ITEM;
    case ModelEntityType.EVENT:
      return ServiceEntityType.EVENT;
    case ModelEntityType.SESSION:
      return ServiceEntityType.SESSION;
    case ModelEntityType.FACTION:
      return ServiceEntityType.FACTION;
    case ModelEntityType.STORY_ARC:
      return ServiceEntityType.STORYARC;
    case ModelEntityType.NOTE:
      return ServiceEntityType.NOTE;
    default:
      console.warn(`Unknown model EntityType: ${modelType}, defaulting to CHARACTER`);
      return ServiceEntityType.CHARACTER;
  }
}

/**
 * Convert a service EntityType to a model EntityType
 * @param serviceType The EntityType from the service layer
 * @returns The corresponding EntityType from the model layer
 */
export function convertToModelEntityType(serviceType: ServiceEntityType): ModelEntityType {
  switch (serviceType) {
    case ServiceEntityType.CHARACTER:
      return ModelEntityType.CHARACTER;
    case ServiceEntityType.LOCATION:
      return ModelEntityType.LOCATION;
    case ServiceEntityType.ITEM:
      return ModelEntityType.ITEM;
    case ServiceEntityType.EVENT:
      return ModelEntityType.EVENT;
    case ServiceEntityType.SESSION:
      return ModelEntityType.SESSION;
    case ServiceEntityType.FACTION:
      return ModelEntityType.FACTION;
    case ServiceEntityType.STORYARC:
      return ModelEntityType.STORY_ARC;
    case ServiceEntityType.NOTE:
      return ModelEntityType.NOTE;
    default:
      console.warn(`Unknown service EntityType: ${serviceType}, defaulting to CHARACTER`);
      return ModelEntityType.CHARACTER;
  }
}

/**
 * Get the entity type name as a string
 * @param entityType The EntityType (from either model or service layer)
 * @returns The entity type name as a string
 */
export function getEntityTypeName(entityType: ModelEntityType | ServiceEntityType): string {
  const entityTypeStr = entityType.toString().toUpperCase();

  if (entityTypeStr.includes('CHARACTER')) return 'Character';
  if (entityTypeStr.includes('LOCATION')) return 'Location';
  if (entityTypeStr.includes('ITEM')) return 'Item';
  if (entityTypeStr.includes('EVENT')) return 'Event';
  if (entityTypeStr.includes('SESSION')) return 'Session';
  if (entityTypeStr.includes('CAMPAIGN')) return 'Campaign';
  if (entityTypeStr.includes('RPGWORLD') || entityTypeStr.includes('RPG_WORLD')) return 'RPG World';
  if (entityTypeStr.includes('NOTE')) return 'Note';

  return 'Unknown';
}

/**
 * Get the entity type color
 * @param entityType The EntityType (from either model or service layer)
 * @returns The color associated with the entity type
 */
export function getEntityTypeColor(entityType: ModelEntityType | ServiceEntityType): string {
  const entityTypeStr = entityType.toString().toUpperCase();

  if (entityTypeStr.includes('CHARACTER')) return 'teal';
  if (entityTypeStr.includes('LOCATION')) return 'blue';
  if (entityTypeStr.includes('ITEM')) return 'yellow';
  if (entityTypeStr.includes('EVENT')) return 'violet';
  if (entityTypeStr.includes('SESSION')) return 'orange';
  if (entityTypeStr.includes('CAMPAIGN')) return 'red';
  if (entityTypeStr.includes('RPGWORLD') || entityTypeStr.includes('RPG_WORLD')) return 'indigo';
  if (entityTypeStr.includes('NOTE')) return 'cyan';

  return 'gray';
}
