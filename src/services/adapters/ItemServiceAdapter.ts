/**
 * Item Service Adapter
 *
 * This adapter wraps the ItemService to implement the IEntityService interface.
 */

import { DocumentData, DocumentSnapshot, QueryConstraint, QueryDocumentSnapshot } from 'firebase/firestore';
import { Item as ModelItem } from '../../models/Item';
import { EntityType } from '../../models/EntityType';
import { ItemService, Item as ServiceItem } from '../item.service';
import { IEntityService } from '../interfaces/EntityService.interface';
import { CountOptions } from '../enhanced-firestore.service';

/**
 * Item service adapter class
 */
export class ItemServiceAdapter implements IEntityService<ModelItem> {
  private itemService: ItemService;
  private worldId: string;
  private campaignId: string;

  /**
   * Create a new ItemServiceAdapter
   * @param worldId World ID
   * @param campaignId Campaign ID
   */
  constructor(worldId: string, campaignId: string) {
    this.itemService = ItemService.getInstance(worldId, campaignId);
    this.worldId = worldId;
    this.campaignId = campaignId;
  }

  /**
   * Get the entity type
   * @returns Entity type
   */
  getEntityType(): EntityType {
    return EntityType.ITEM;
  }

  /**
   * Get the world ID
   * @returns World ID
   */
  getWorldId(): string {
    return this.worldId;
  }

  /**
   * Get the campaign ID
   * @returns Campaign ID
   */
  getCampaignId(): string {
    return this.campaignId;
  }

  /**
   * Get an item by ID
   * @param id Item ID
   * @param options Options for the operation
   * @returns Item data or null if not found
   */
  async getById(
    id: string,
    options?: {
      forceServer?: boolean;
      useCache?: boolean;
      cacheTTL?: number;
      skipTransform?: boolean;
      maxRetries?: number;
      trackPerformance?: boolean;
    }
  ): Promise<ModelItem | null> {
    const item = await this.itemService.getById(id);

    if (item) {
      // Convert from service Item to model Item with proper field mapping
      return {
        ...item,
        entityType: EntityType.ITEM,
        // Map service fields to model fields (service has 'itemType', model expects 'itemType')
        itemType: item.itemType || 'Other',
        type: item.itemType || 'Other', // Also add type for UI compatibility
        // Convert Firestore Timestamps to formatted date strings for React rendering
        createdAt: item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() :
                   item.createdAt instanceof Date ? item.createdAt.toLocaleDateString() :
                   item.createdAt ? new Date(item.createdAt).toLocaleDateString() : undefined,
        updatedAt: item.updatedAt?.toDate ? item.updatedAt.toDate().toLocaleDateString() :
                   item.updatedAt instanceof Date ? item.updatedAt.toLocaleDateString() :
                   item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : undefined
      } as ModelItem;
    }

    return null;
  }

  /**
   * Get multiple items by their IDs
   * @param ids Array of item IDs
   * @returns Array of item data
   */
  async getByIds(ids: string[]): Promise<ModelItem[]> {
    const items = await this.itemService.getByIds(ids);

    // Convert from service Item to model Item with proper field mapping
    return items.map(item => ({
      ...item,
      entityType: EntityType.ITEM,
      // Map service fields to model fields (service has 'itemType', model expects 'itemType')
      itemType: item.itemType || 'Other',
      type: item.itemType || 'Other', // Also add type for UI compatibility
      // Convert Firestore Timestamps to formatted date strings for React rendering
      createdAt: item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() :
                 item.createdAt instanceof Date ? item.createdAt.toLocaleDateString() :
                 item.createdAt ? new Date(item.createdAt).toLocaleDateString() : undefined,
      updatedAt: item.updatedAt?.toDate ? item.updatedAt.toDate().toLocaleDateString() :
                 item.updatedAt instanceof Date ? item.updatedAt.toLocaleDateString() :
                 item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : undefined
    } as ModelItem));
  }

  /**
   * Create a new item
   * @param data Item data
   * @param id Document ID (optional)
   * @param options Options for the operation
   * @returns Item ID
   */
  async create(
    data: ModelItem,
    id?: string,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: ModelItem) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    }
  ): Promise<string> {
    // Convert from model Item to service Item
    const serviceItem = {
      ...data,
      type: data.itemType || 'Other',
      worldId: this.worldId,
      campaignId: this.campaignId
    };

    return this.itemService.create(serviceItem as any, id, options as any);
  }

  /**
   * Update an existing item
   * @param id Item ID
   * @param data Updated item data
   * @param options Options for the operation
   * @returns Success status
   */
  async update(
    id: string,
    data: Partial<ModelItem>,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Partial<ModelItem>) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    }
  ): Promise<boolean> {
    // Convert from model Item to service Item
    const serviceItem = {
      ...data,
      type: data.itemType
    };

    await this.itemService.update(id, serviceItem as any, options as any);
    return true;
  }

  /**
   * Delete an item
   * @param id Item ID
   * @param options Options for the operation
   * @returns Success status
   */
  async delete(
    id: string,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      trackPerformance?: boolean;
    }
  ): Promise<boolean> {
    await this.itemService.delete(id, options as any);
    return true;
  }

  /**
   * Query items with pagination
   * @param constraints Query constraints (where, orderBy, etc.)
   * @param pageSize Number of items to return
   * @param startAfterDoc Document to start after (for pagination)
   * @param options Options for the operation
   * @returns Query results and last document for pagination
   */
  async query(
    constraints?: QueryConstraint[],
    pageSize?: number,
    startAfterDoc?: DocumentSnapshot<DocumentData>,
    options?: {
      forceServer?: boolean;
      source?: 'default' | 'server' | 'cache';
      useCache?: boolean;
      cacheTTL?: number;
    }
  ): Promise<{
    data: ModelItem[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    source: 'server' | 'cache';
  }> {
    const result = await this.itemService.query(constraints, pageSize, startAfterDoc, options);

    // Convert from service Item to model Item with proper field mapping
    const convertedData = result.data.map(item => ({
      ...item,
      entityType: EntityType.ITEM,
      // Map service fields to model fields (service has 'itemType', model expects 'itemType')
      itemType: item.itemType || 'Other',
      type: item.itemType || 'Other', // Also add type for UI compatibility
      // Convert Firestore Timestamps to formatted date strings for React rendering
      createdAt: item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() :
                 item.createdAt instanceof Date ? item.createdAt.toLocaleDateString() :
                 item.createdAt ? new Date(item.createdAt).toLocaleDateString() : undefined,
      updatedAt: item.updatedAt?.toDate ? item.updatedAt.toDate().toLocaleDateString() :
                 item.updatedAt instanceof Date ? item.updatedAt.toLocaleDateString() :
                 item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : undefined
    } as ModelItem));

    return {
      ...result,
      data: convertedData
    };
  }

  /**
   * Get the count of items matching the constraints
   * @param queryName Name of the query for caching
   * @param constraints Query constraints
   * @param options Count options
   * @returns Count of matching items
   */
  async getCount(
    queryName: string,
    constraints?: QueryConstraint[],
    options?: CountOptions
  ): Promise<number> {
    // Implement a fallback since itemService might not have getCount
    try {
      // Always use the fallback implementation
      const { data } = await this.query(constraints);
      return data.length;
    } catch (error) {
      console.error(`Error getting count for ${queryName}:`, error);
      return 0;
    }
  }

  /**
   * List all items (alias for query for compatibility)
   * @param options Query options
   * @returns Array of items
   */
  async listEntities(
    options?: {
      forceServer?: boolean;
      source?: 'default' | 'server' | 'cache';
      useCache?: boolean;
      cacheTTL?: number;
      pageSize?: number;
    }
  ): Promise<ModelItem[]> {
    const { data } = await this.query(
      undefined,
      options?.pageSize,
      undefined,
      {
        forceServer: options?.forceServer,
        source: options?.source,
        useCache: options?.useCache,
        cacheTTL: options?.cacheTTL
      }
    );
    // Data is already converted in the query method
    return data;
  }

  /**
   * Create item (alias for create for compatibility)
   * @param data Item data
   * @param options Options for the operation
   * @returns Item ID
   */
  async createEntity(
    data: ModelItem,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: ModelItem) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    }
  ): Promise<string> {
    return this.create(data, undefined, options);
  }

  /**
   * Subscribe to real-time updates for an item
   * @param id Item ID
   * @param callback Function to call when item changes
   * @param options Options for the subscription
   * @returns Unsubscribe function
   */
  subscribeToEntity(
    id: string,
    callback: (data: ModelItem | null) => void,
    options?: {
      listenerId?: string;
      onError?: (error: Error) => void;
    }
  ): () => void {
    // Create a wrapper callback that converts the service Item to model Item
    const wrappedCallback = (item: any | null) => {
      if (item) {
        const modelItem = {
          ...item,
          entityType: EntityType.ITEM,
          // Map service fields to model fields (service has 'itemType', model expects 'itemType')
          itemType: item.itemType || 'Other',
          type: item.itemType || 'Other' // Also add type for UI compatibility
        } as ModelItem;
        callback(modelItem);
      } else {
        callback(null);
      }
    };

    return this.itemService.subscribeToDocument(id, wrappedCallback, options);
  }

  /**
   * Subscribe to real-time updates for a query
   * @param constraints Query constraints
   * @param callback Function to call when query results change
   * @param options Options for the subscription
   * @returns Unsubscribe function
   */
  subscribeToQuery(
    constraints: QueryConstraint[],
    callback: (data: ModelItem[]) => void,
    options?: {
      queryId?: string;
      listenerId?: string;
      onError?: (error: Error) => void;
    }
  ): () => void {
    // Create a wrapper callback that converts the service Items to model Items
    const wrappedCallback = (items: any[]) => {
      const modelItems = items.map(item => ({
        ...item,
        entityType: EntityType.ITEM,
        // Map service fields to model fields (service has 'itemType', model expects 'itemType')
        itemType: item.itemType || 'Other',
        type: item.itemType || 'Other' // Also add type for UI compatibility
      } as ModelItem));

      callback(modelItems);
    };

    return this.itemService.subscribeToQuery(constraints, wrappedCallback, options);
  }

  /**
   * Get relationship count for an item
   * @param id Item ID
   * @param options Options for the operation
   * @returns Relationship count
   */
  async getRelationshipCount(
    id: string,
    options?: {
      forceServer?: boolean;
      useCache?: boolean;
      cacheTTL?: number;
    }
  ): Promise<number> {
    // Implement relationship count logic or return 0 as fallback
    return 0;
  }
}

export default ItemServiceAdapter;
