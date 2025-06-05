/**
 * Entity Service Factory
 *
 * This class provides a centralized factory for creating entity services.
 * It ensures that only one instance of each service is created per world/campaign.
 */

import { DocumentData } from 'firebase/firestore';
import { EntityType } from '../models/EntityType';
import { IEntityService } from './interfaces/EntityService.interface';
import { CharacterService } from './character.service';
import { LocationService } from './location.service';
import { ItemService } from './item.service';
import { EventService } from './event.service';
import { SessionService } from './session.service';
import { FactionService } from './faction.service';
import { StoryArcService } from './storyArc.service';
import { NoteService } from './note.service';
import { ItemServiceAdapter } from './adapters/ItemServiceAdapter';
import { DEFAULT_WORLD_ID, DEFAULT_CAMPAIGN_ID } from '../constants/appConstants';

/**
 * Entity service factory class
 */
export class EntityServiceFactory {
  private static instance: EntityServiceFactory;
  private serviceInstances: Map<string, IEntityService<any>> = new Map();

  /**
   * Get the singleton instance of EntityServiceFactory
   * @returns EntityServiceFactory instance
   */
  public static getInstance(): EntityServiceFactory {
    if (!this.instance) {
      this.instance = new EntityServiceFactory();
    }
    return this.instance;
  }

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {}

  /**
   * Generate a unique key for a service instance
   * @param entityType Entity type
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns Unique key
   */
  private generateServiceKey(
    entityType: EntityType,
    worldId: string,
    campaignId: string
  ): string {
    return `${entityType}:${worldId || DEFAULT_WORLD_ID}:${campaignId || DEFAULT_CAMPAIGN_ID}`;
  }

  /**
   * Get an entity service for a specific entity type
   * @param entityType Entity type
   * @param worldId World ID (optional, defaults to DEFAULT_WORLD_ID)
   * @param campaignId Campaign ID (optional, defaults to DEFAULT_CAMPAIGN_ID)
   * @returns Entity service instance
   */
  public getService<T extends DocumentData>(
    entityType: EntityType,
    worldId: string = DEFAULT_WORLD_ID,
    campaignId: string = DEFAULT_CAMPAIGN_ID
  ): IEntityService<T> {
    const key = this.generateServiceKey(entityType, worldId, campaignId);

    // Check if we already have an instance for this key
    if (this.serviceInstances.has(key)) {
      return this.serviceInstances.get(key) as IEntityService<T>;
    }

    // Create a new instance based on entity type
    let service: IEntityService<T>;

    switch (entityType) {
      case EntityType.CHARACTER:
        service = CharacterService.getInstance(worldId, campaignId) as unknown as IEntityService<T>;
        break;
      case EntityType.LOCATION:
        service = LocationService.getInstance(worldId, campaignId) as unknown as IEntityService<T>;
        break;
      case EntityType.ITEM:
        service = new ItemServiceAdapter(worldId, campaignId) as unknown as IEntityService<T>;
        break;
      case EntityType.EVENT:
        service = EventService.getInstance(worldId, campaignId) as unknown as IEntityService<T>;
        break;
      case EntityType.SESSION:
        service = SessionService.getInstance(worldId, campaignId) as unknown as IEntityService<T>;
        break;
      case EntityType.FACTION:
        service = FactionService.getInstance(worldId, campaignId) as unknown as IEntityService<T>;
        break;
      case EntityType.STORY_ARC:
        service = StoryArcService.getInstance(worldId, campaignId) as unknown as IEntityService<T>;
        break;
      case EntityType.NOTE:
        service = NoteService.getInstance(worldId, campaignId) as unknown as IEntityService<T>;
        break;
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    // Cache the instance
    this.serviceInstances.set(key, service);

    return service;
  }

  /**
   * Clear all cached service instances
   */
  public clearCache(): void {
    this.serviceInstances.clear();
  }

  /**
   * Clear cached service instances for a specific entity type
   * @param entityType Entity type
   */
  public clearCacheForEntityType(entityType: EntityType): void {
    for (const [key, service] of this.serviceInstances.entries()) {
      if (service.getEntityType() === entityType) {
        this.serviceInstances.delete(key);
      }
    }
  }

  /**
   * Clear cached service instances for a specific world
   * @param worldId World ID
   */
  public clearCacheForWorld(worldId: string): void {
    for (const [key, service] of this.serviceInstances.entries()) {
      if (service.getWorldId() === worldId) {
        this.serviceInstances.delete(key);
      }
    }
  }

  /**
   * Clear cached service instances for a specific campaign
   * @param campaignId Campaign ID
   */
  public clearCacheForCampaign(campaignId: string): void {
    for (const [key, service] of this.serviceInstances.entries()) {
      if (service.getCampaignId() === campaignId) {
        this.serviceInstances.delete(key);
      }
    }
  }
}
