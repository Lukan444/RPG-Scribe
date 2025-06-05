import {
  where,
  orderBy,
  query,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  DocumentData,
  serverTimestamp,
  QueryConstraint,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FirestoreService } from './firestore.service';
import { RelationshipService } from './relationship.service';
import { EntityType } from '../models/EntityType';
import { ItemAPIService } from './api/itemAPI.service';
import { API_CONFIG } from '../config/api.config';

/**
 * Item data interface
 */
export interface Item extends DocumentData {
  id?: string;
  name: string;
  type: string; // weapon, armor, potion, scroll, wondrous item, artifact
  description: string;
  rarity: string;
  attunement: boolean;
  createdBy: string; // User ID
  createdAt?: any; // Timestamp
  updatedAt?: any; // Timestamp
  imageURL?: string;
  currentOwnerId?: string; // Character or location ID
  ownerType?: 'character' | 'location';
  currentOwner?: {
    id: string;
    name: string;
    type: string;
  }; // Denormalized owner data
  properties?: Record<string, any>; // Magical properties, damage, etc.
}

/**
 * Service for item-related operations
 */
export class ItemService extends FirestoreService<Item> {
  private campaignId: string;
  private worldId: string;
  private apiService: ItemAPIService;
  private useAPI: boolean = false; // Flag to determine whether to use API or Firestore
  private static instances: { [key: string]: ItemService } = {};

  /**
   * Get an ItemService instance for a specific campaign
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns ItemService instance
   */
  public static getInstance(worldId: string, campaignId: string): ItemService {
    const key = `${worldId}:${campaignId}`;
    if (!this.instances[key]) {
      this.instances[key] = new ItemService(worldId, campaignId);
    }
    return this.instances[key];
  }

  /**
   * Create a new ItemService
   * @param worldId World ID
   * @param campaignId Campaign ID
   */
  private constructor(worldId: string, campaignId: string) {
    super('items');
    this.worldId = worldId;
    this.campaignId = campaignId;

    // Initialize API service
    this.apiService = new ItemAPIService();

    // Determine whether to use API or Firestore based on configuration
    this.useAPI = API_CONFIG.USE_API;
  }

  /**
   * Override getById to use API service when useAPI is true
   * @param id Entity ID
   * @param options Query options
   * @returns Entity or null
   */
  async getById(
    id: string,
    options: {
      forceServer?: boolean;
      useCache?: boolean;
      cacheTTL?: number;
      skipTransform?: boolean;
      maxRetries?: number;
      trackPerformance?: boolean;
    } = {}
  ): Promise<Item | null> {
    let item: Item | null = null;

    if (this.useAPI) {
      try {
        item = await this.apiService.getItem(id);
      } catch (error) {
        console.error(`Error fetching item ${id} from API:`, error);
        // Fall back to Firestore
      }
    }

    if (!item) {
      // Fall back to Firestore
      item = await super.getById(id, options);
    }

    if (item) {
      // Add entityType to the item
      return {
        ...item,
        entityType: EntityType.ITEM,
        itemType: item.type || 'Other'
      };
    }

    return null;
  }

  /**
   * Override query to use API service when useAPI is true
   * @param constraints Query constraints
   * @param pageSize Page size
   * @param startAfterDoc Start after document
   * @param options Query options
   * @returns Query result
   */
  async query(
    constraints: QueryConstraint[] = [],
    pageSize: number = 10,
    startAfterDoc?: DocumentSnapshot<DocumentData>,
    options: {
      forceServer?: boolean;
      source?: 'default' | 'server' | 'cache';
      useCache?: boolean;
      cacheTTL?: number;
    } = {}
  ): Promise<{
    data: Item[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    source: 'server' | 'cache';
  }> {
    if (this.useAPI) {
      try {
        const items = await this.apiService.getAllItems(this.worldId, this.campaignId);

        // Apply constraints manually (simplified version)
        let filteredItems = [...items];

        // Return the result
        return {
          data: filteredItems.slice(0, pageSize),
          lastDoc: null, // API doesn't support pagination in the same way as Firestore
          source: 'server'
        };
      } catch (error) {
        console.error(`Error fetching items from API:`, error);
        // Fall back to Firestore
        return super.query(constraints, pageSize, startAfterDoc, options);
      }
    }

    // Use Firestore
    return super.query(constraints, pageSize, startAfterDoc, options);
  }

  /**
   * Override create to use API service when useAPI is true
   * @param data Entity data
   * @param id Document ID (optional)
   * @param options Options for the operation
   * @returns Entity ID
   */
  async create(
    data: Item,
    id?: string,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Item) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<string> {
    if (this.useAPI) {
      try {
        const item = await this.apiService.createItem(data, this.worldId, this.campaignId);
        return item.id!;
      } catch (error) {
        console.error(`Error creating item via API:`, error);
        // Fall back to Firestore
        return super.create(data, id, options);
      }
    }

    // Use Firestore
    return super.create(data, id, options);
  }

  /**
   * Override update to use API service when useAPI is true
   * @param id Entity ID
   * @param data Entity data
   * @param options Options for the operation
   * @returns True if successful
   */
  async update(
    id: string,
    data: Partial<Item>,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Partial<Item>) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<boolean> {
    if (this.useAPI) {
      try {
        await this.apiService.updateItem(id, data);
        return true;
      } catch (error) {
        console.error(`Error updating item ${id} via API:`, error);
        // Fall back to Firestore
        return super.update(id, data, options);
      }
    }

    // Use Firestore
    return super.update(id, data, options);
  }

  /**
   * Override delete to use API service when useAPI is true
   * @param id Entity ID
   * @param options Options for the operation
   * @returns True if successful
   */
  async delete(
    id: string,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      trackPerformance?: boolean;
    } = {}
  ): Promise<boolean> {
    if (this.useAPI) {
      try {
        return await this.apiService.deleteItem(id);
      } catch (error) {
        console.error(`Error deleting item ${id} via API:`, error);
        // Fall back to Firestore
        return super.delete(id, options);
      }
    }

    // Use Firestore
    return super.delete(id, options);
  }

  /**
   * Get entity by ID (alias for getById for compatibility)
   * @param id Entity ID
   * @param options Query options
   * @returns Entity or null
   */
  async getEntity(
    id: string,
    options: {
      forceServer?: boolean;
      useCache?: boolean;
      cacheTTL?: number;
      skipTransform?: boolean;
      maxRetries?: number;
      trackPerformance?: boolean;
    } = {}
  ): Promise<Item | null> {
    return this.getById(id, options);
  }

  /**
   * List all entities (alias for query for compatibility)
   * @param options Query options
   * @returns Array of entities
   */
  async listEntities(
    options: {
      forceServer?: boolean;
      source?: 'default' | 'server' | 'cache';
      useCache?: boolean;
      cacheTTL?: number;
      pageSize?: number;
    } = {}
  ): Promise<Item[]> {
    const { data } = await this.query(
      [orderBy('name', 'asc')],
      options.pageSize || 100,
      undefined,
      {
        forceServer: options.forceServer,
        source: options.source,
        useCache: options.useCache,
        cacheTTL: options.cacheTTL
      }
    );

    // Add entityType to each item
    return data.map(item => ({
      ...item,
      entityType: EntityType.ITEM,
      itemType: item.type || 'Other'
    }));
  }

  /**
   * Create entity (alias for create for compatibility)
   * @param data Entity data
   * @param options Options for the operation
   * @returns Entity ID
   */
  async createEntity(
    data: Item,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Item) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<string> {
    return this.create(data, undefined, options);
  }

  /**
   * Update entity (alias for update for compatibility)
   * @param id Entity ID
   * @param data Entity data
   * @param options Options for the operation
   * @returns True if successful
   */
  async updateEntity(
    id: string,
    data: Partial<Item>,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Partial<Item>) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<boolean> {
    return this.update(id, data, options);
  }

  /**
   * Delete entity (alias for delete for compatibility)
   * @param id Entity ID
   * @param options Options for the operation
   * @returns True if successful
   */
  async deleteEntity(
    id: string,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      trackPerformance?: boolean;
    } = {}
  ): Promise<boolean> {
    return this.delete(id, options);
  }

  /**
   * Get items by type
   * @param type Item type
   * @returns Array of items
   */
  async getItemsByType(type: string): Promise<Item[]> {
    if (this.useAPI) {
      try {
        return await this.apiService.getItemsByType(type, this.worldId, this.campaignId);
      } catch (error) {
        console.error(`Error fetching items by type from API:`, error);
        // Fall back to Firestore
      }
    }

    // Use Firestore
    const { data } = await this.query([
      where('type', '==', type),
      orderBy('name', 'asc')
    ]);

    return data;
  }

  /**
   * Get items by rarity
   * @param rarity Item rarity
   * @returns Array of items
   */
  async getItemsByRarity(rarity: string): Promise<Item[]> {
    if (this.useAPI) {
      try {
        return await this.apiService.getItemsByRarity(rarity, this.worldId, this.campaignId);
      } catch (error) {
        console.error(`Error fetching items by rarity from API:`, error);
        // Fall back to Firestore
      }
    }

    // Use Firestore
    const { data } = await this.query([
      where('rarity', '==', rarity),
      orderBy('name', 'asc')
    ]);

    return data;
  }

  /**
   * Get items by owner
   * @param ownerId Owner ID (character or location)
   * @param ownerType Owner type
   * @returns Array of items
   */
  async getItemsByOwner(
    ownerId: string,
    ownerType: 'character' | 'location'
  ): Promise<Item[]> {
    const { data } = await this.query([
      where('currentOwnerId', '==', ownerId),
      where('ownerType', '==', ownerType),
      orderBy('name', 'asc')
    ]);

    return data;
  }

  /**
   * Get unowned items
   * @returns Array of unowned items
   */
  async getUnownedItems(): Promise<Item[]> {
    const { data } = await this.query([
      where('currentOwnerId', '==', null),
      orderBy('name', 'asc')
    ]);

    return data;
  }

  /**
   * Get entity with relationships
   * @param entityId Entity ID
   * @returns Entity with relationship count
   */
  async getEntityWithRelationships(entityId: string): Promise<Item & { relationshipCount?: number }> {
    try {
      // Get the entity
      const entity = await this.getById(entityId);

      if (!entity) {
        throw new Error(`Entity not found: ${entityId}`);
      }

      // Get relationship count
      const relationshipService = RelationshipService.getInstance(this.worldId, this.campaignId);
      const count = await relationshipService.getRelationshipCount(
        entityId,
        EntityType.ITEM as any
      );

      return {
        ...entity,
        relationshipCount: count
      };
    } catch (error) {
      console.error(`Error getting entity with relationships: ${entityId}`, error);
      throw error;
    }
  }

  /**
   * Update item owner
   * @param itemId Item ID
   * @param ownerId Owner ID (character or location)
   * @param ownerType Owner type
   * @param ownerData Owner data for denormalization
   * @returns True if successful
   */
  async updateItemOwner(
    itemId: string,
    ownerId: string | null,
    ownerType: EntityType.CHARACTER | EntityType.LOCATION | null,
    ownerData?: { name: string; type: string; }
  ): Promise<boolean> {
    try {
      if (ownerId === null || ownerType === null) {
        // Remove owner
        await this.update(itemId, {
          currentOwnerId: undefined,
          ownerType: undefined,
          currentOwner: undefined
        });
      } else {
        // Set owner
        await this.update(itemId, {
          currentOwnerId: ownerId,
          ownerType: ownerType === EntityType.CHARACTER ? 'character' : 'location',
          currentOwner: {
            id: ownerId,
            name: ownerData!.name,
            type: ownerData!.type
          }
        });

        // Create or update relationship
        const relationshipService = RelationshipService.getInstance(this.worldId, this.campaignId);
        await relationshipService.createOrUpdateRelationship({
          type: `${ownerType}-item`,
          subtype: 'owns',
          sourceId: ownerId,
          sourceType: ownerType as any,
          targetId: itemId,
          targetType: EntityType.ITEM as any,
          properties: {
            acquiredDate: serverTimestamp()
          }
        });

        // Create item ownership history entry
        await this.createOwnershipHistoryEntry(
          itemId,
          ownerId,
          ownerType
        );
      }

      return true;
    } catch (error) {
      console.error(`Error updating item owner for ${itemId}:`, error);
      return false;
    }
  }

  /**
   * Create item ownership history entry
   * @param itemId Item ID
   * @param ownerId Owner ID
   * @param ownerType Owner type
   * @returns True if successful
   */
  private async createOwnershipHistoryEntry(
    itemId: string,
    ownerId: string,
    ownerType: EntityType.CHARACTER | EntityType.LOCATION
  ): Promise<boolean> {
    try {
      const historyRef = doc(collection(db, `campaigns/${this.campaignId}/itemOwnershipHistory`));

      await setDoc(historyRef, {
        itemId,
        ownerId,
        ownerType,
        acquiredDate: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error(`Error creating ownership history entry for ${itemId}:`, error);
      return false;
    }
  }

  /**
   * Get item ownership history
   * @param itemId Item ID
   * @returns Array of ownership history entries
   */
  async getItemOwnershipHistory(itemId: string): Promise<any[]> {
    try {
      const historyQuery = query(
        collection(db, `campaigns/${this.campaignId}/itemOwnershipHistory`),
        where('itemId', '==', itemId),
        orderBy('acquiredDate', 'desc')
      );

      const snapshot = await getDocs(historyQuery);
      const history: any[] = [];

      snapshot.forEach(doc => {
        history.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return history;
    } catch (error) {
      console.error(`Error getting ownership history for ${itemId}:`, error);
      return [];
    }
  }
}
