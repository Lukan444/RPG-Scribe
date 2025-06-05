/**
 * BatchQueryManager Service
 * 
 * Manages intelligent query batching and deduplication to reduce database load
 * and improve performance for entity count operations.
 */

import { EntityType } from '../../models/EntityType';
import { CharacterService } from '../character.service';
import { LocationService } from '../location.service';
import { FactionService } from '../faction.service';
import { ItemService } from '../item.service';
import { EventService } from '../event.service';
import { SessionService } from '../session.service';
import { StoryArcService } from '../storyArc.service';
import { NoteService } from '../note.service';

// Batch request interface
interface BatchRequest {
  id: string;
  worldId: string;
  campaignId?: string;
  entityTypes: EntityType[];
  resolve: (data: BatchResult) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

// Batch result interface
export interface BatchResult {
  counts: Record<string, number>;
  recentEntities: Record<string, any[]>;
  lastUpdated: Date;
  worldId: string;
  campaignId?: string;
}

// Query deduplication key
interface DeduplicationKey {
  worldId: string;
  campaignId?: string;
  entityTypes: string;
}

/**
 * Intelligent batch query manager
 */
export class BatchQueryManagerService {
  private static instance: BatchQueryManagerService;
  private pendingRequests = new Map<string, BatchRequest>();
  private activeQueries = new Map<string, Promise<BatchResult>>();
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 50; // 50ms delay to collect requests
  private readonly MAX_BATCH_SIZE = 10;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): BatchQueryManagerService {
    if (!BatchQueryManagerService.instance) {
      BatchQueryManagerService.instance = new BatchQueryManagerService();
    }
    return BatchQueryManagerService.instance;
  }

  /**
   * Request entity counts with intelligent batching
   */
  async requestEntityCounts(
    worldId: string,
    campaignId?: string,
    entityTypes: EntityType[] = Object.values(EntityType)
  ): Promise<BatchResult> {
    const requestId = this.generateRequestId(worldId, entityTypes, campaignId);
    const deduplicationKey = this.generateDeduplicationKey(worldId, entityTypes, campaignId);

    // Check if identical query is already in progress
    const activeQuery = this.activeQueries.get(deduplicationKey);
    if (activeQuery) {
      console.debug(`Deduplicating query: ${deduplicationKey}`);
      return activeQuery;
    }

    // Create new batch request
    return new Promise<BatchResult>((resolve, reject) => {
      const request: BatchRequest = {
        id: requestId,
        worldId,
        campaignId,
        entityTypes,
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.pendingRequests.set(requestId, request);

      // Schedule batch processing
      this.scheduleBatchProcessing();
    });
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(worldId: string, entityTypes: EntityType[], campaignId?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${worldId}-${campaignId || 'world'}-${timestamp}-${random}`;
  }

  /**
   * Generate deduplication key
   */
  private generateDeduplicationKey(worldId: string, entityTypes: EntityType[], campaignId?: string): string {
    const sortedTypes = [...entityTypes].sort().join(',');
    return `${worldId}-${campaignId || 'world'}-${sortedTypes}`;
  }

  /**
   * Schedule batch processing with debouncing
   */
  private scheduleBatchProcessing(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.BATCH_DELAY);
  }

  /**
   * Process pending requests in batches
   */
  private async processBatch(): Promise<void> {
    if (this.pendingRequests.size === 0) return;

    // Group requests by world/campaign
    const requestGroups = this.groupRequestsByContext();

    // Process each group
    for (const [contextKey, requests] of requestGroups.entries()) {
      this.processRequestGroup(contextKey, requests);
    }

    // Clear pending requests
    this.pendingRequests.clear();
  }

  /**
   * Group requests by world/campaign context
   */
  private groupRequestsByContext(): Map<string, BatchRequest[]> {
    const groups = new Map<string, BatchRequest[]>();

    for (const request of this.pendingRequests.values()) {
      const contextKey = `${request.worldId}-${request.campaignId || 'world'}`;
      
      if (!groups.has(contextKey)) {
        groups.set(contextKey, []);
      }
      
      groups.get(contextKey)!.push(request);
    }

    return groups;
  }

  /**
   * Process a group of requests for the same context
   */
  private async processRequestGroup(contextKey: string, requests: BatchRequest[]): Promise<void> {
    try {
      // Merge all requested entity types
      const allEntityTypes = new Set<EntityType>();
      requests.forEach(request => {
        request.entityTypes.forEach(type => allEntityTypes.add(type));
      });

      const entityTypesArray = Array.from(allEntityTypes);
      const [worldId, campaignContext] = contextKey.split('-');
      const campaignId = campaignContext === 'world' ? undefined : campaignContext;

      // Create deduplication key for this batch
      const deduplicationKey = this.generateDeduplicationKey(worldId, entityTypesArray, campaignId);

      // Execute the batch query
      const batchPromise = this.executeBatchQuery(worldId, campaignId, entityTypesArray);
      this.activeQueries.set(deduplicationKey, batchPromise);

      try {
        const result = await batchPromise;

        // Resolve all requests in this group
        requests.forEach(request => {
          // Filter result to only include requested entity types
          const filteredResult: BatchResult = {
            counts: this.filterCounts(result.counts, request.entityTypes),
            recentEntities: this.filterRecentEntities(result.recentEntities, request.entityTypes),
            lastUpdated: result.lastUpdated,
            worldId: result.worldId,
            campaignId: result.campaignId
          };

          request.resolve(filteredResult);
        });
      } catch (error) {
        // Reject all requests in this group
        requests.forEach(request => {
          request.reject(error as Error);
        });
      } finally {
        // Clean up active query
        this.activeQueries.delete(deduplicationKey);
      }
    } catch (error) {
      console.error('Error processing request group:', error);
      
      // Reject all requests in this group
      requests.forEach(request => {
        request.reject(error as Error);
      });
    }
  }

  /**
   * Execute batch query for all entity types
   */
  private async executeBatchQuery(
    worldId: string,
    campaignId: string | undefined,
    entityTypes: EntityType[]
  ): Promise<BatchResult> {
    const startTime = performance.now();
    
    try {
      // Create service instances
      const services = this.createServiceInstances(worldId, campaignId || '');

      // Execute all queries in parallel
      const results = await Promise.all(
        entityTypes.map(async (entityType) => {
          const service = services[entityType];
          if (!service) {
            console.warn(`No service available for entity type: ${entityType}`);
            return { entityType, entities: [] };
          }

          try {
            const entities = await service.listEntities();
            return { entityType, entities };
          } catch (error) {
            console.error(`Error fetching ${entityType}:`, error);
            return { entityType, entities: [] };
          }
        })
      );

      // Process results
      const counts: Record<string, number> = {};
      const recentEntities: Record<string, any[]> = {};

      results.forEach(({ entityType, entities }) => {
        counts[entityType.toLowerCase()] = entities.length;
        recentEntities[entityType.toLowerCase()] = this.getRecentEntities(entities);
      });

      const queryTime = performance.now() - startTime;
      console.debug(`Batch query completed in ${queryTime.toFixed(2)}ms for ${entityTypes.length} entity types`);

      return {
        counts,
        recentEntities,
        lastUpdated: new Date(),
        worldId,
        campaignId
      };
    } catch (error) {
      console.error('Error executing batch query:', error);
      throw error;
    }
  }

  /**
   * Create service instances for entity types
   */
  private createServiceInstances(worldId: string, campaignId: string) {
    const services: Record<string, any> = {
      [EntityType.CHARACTER]: CharacterService.getInstance(worldId, campaignId),
      [EntityType.LOCATION]: LocationService.getInstance(worldId, campaignId),
      [EntityType.FACTION]: FactionService.getInstance(worldId, campaignId),
      [EntityType.ITEM]: ItemService.getInstance(worldId, campaignId),
      [EntityType.EVENT]: EventService.getInstance(worldId, campaignId),
      [EntityType.SESSION]: SessionService.getInstance(worldId, campaignId),
      [EntityType.STORY_ARC]: StoryArcService.getInstance(worldId, campaignId),
      [EntityType.NOTE]: NoteService.getInstance(worldId, campaignId)
    };

    return services;
  }

  /**
   * Get recent entities from entity list
   */
  private getRecentEntities(entities: any[]): any[] {
    return [...entities]
      .sort((a: any, b: any) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, 5)
      .map((entity: any) => ({
        id: entity.id,
        name: entity.name || entity.title || 'Unnamed',
        createdAt: entity.createdAt,
        type: entity.characterType || entity.locationType || entity.type || undefined
      }));
  }

  /**
   * Filter counts to only include requested entity types
   */
  private filterCounts(counts: Record<string, number>, requestedTypes: EntityType[]): Record<string, number> {
    const filtered: Record<string, number> = {};
    requestedTypes.forEach(type => {
      const key = type.toLowerCase();
      filtered[key] = counts[key] || 0;
    });
    return filtered;
  }

  /**
   * Filter recent entities to only include requested entity types
   */
  private filterRecentEntities(recentEntities: Record<string, any[]>, requestedTypes: EntityType[]): Record<string, any[]> {
    const filtered: Record<string, any[]> = {};
    requestedTypes.forEach(type => {
      const key = type.toLowerCase();
      filtered[key] = recentEntities[key] || [];
    });
    return filtered;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      pendingRequests: this.pendingRequests.size,
      activeQueries: this.activeQueries.size,
      batchingEnabled: this.batchTimeout !== null
    };
  }

  /**
   * Clear all pending requests and active queries
   */
  clearAll(): void {
    // Reject all pending requests
    this.pendingRequests.forEach(request => {
      request.reject(new Error('Batch query manager cleared'));
    });

    this.pendingRequests.clear();
    this.activeQueries.clear();

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}

// Export singleton instance
export const batchQueryManager = BatchQueryManagerService.getInstance();
