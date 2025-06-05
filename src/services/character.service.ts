import {
  where,
  orderBy,
  DocumentData,
  serverTimestamp,
  QueryConstraint,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { BaseEntity, EntityService } from './entity.service';
import { RelationshipService } from './relationship.service';
import { EntityType } from '../models/EntityType';
import { getAuth } from 'firebase/auth';
import { CharacterAPIService } from './api/characterAPI.service';
import { API_CONFIG } from '../config/api.config';

/**
 * Character data interface
 */
export interface Character extends BaseEntity {
  race: string;
  class: string;
  level?: number;
  background?: string;
  alignment?: string;
  // Use characterType instead of type to match database schema
  characterType: 'PC' | 'NPC';
  // Add isPlayerCharacter flag for easier filtering
  isPlayerCharacter: boolean;
  appearance?: string;
  personality?: string;
  goals?: string;
  secrets?: string;
  notes?: string;
  status: 'alive' | 'dead' | 'unknown';
  imageURL?: string;
  playerId?: string; // For PCs, references a user
  stats?: Record<string, any>; // Character statistics
  inventory?: Array<{
    id: string;
    name: string;
    type: string;
  }>; // Quick reference to owned items
  currentLocationId?: string; // Reference to current location
  currentLocation?: {
    id: string;
    name: string;
    type: string;
  }; // Denormalized current location data
  // Required fields for Firestore
  worldId: string;
  campaignId: string;
}

/**
 * Service for character-related operations
 */
export class CharacterService extends EntityService<Character> {
  private static instances: { [key: string]: CharacterService } = {};
  private apiService: CharacterAPIService;
  private useAPI: boolean = false; // Flag to determine whether to use API or Firestore

  /**
   * Get a CharacterService instance for a specific campaign
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns CharacterService instance
   */
  public static getInstance(worldId: string, campaignId: string): CharacterService {
    const key = `${worldId}:${campaignId}`;
    if (!this.instances[key]) {
      this.instances[key] = new CharacterService(worldId, campaignId);
    }
    return this.instances[key];
  }

  /**
   * Create a new CharacterService
   * @param worldId World ID
   * @param campaignId Campaign ID
   */
  private constructor(worldId: string, campaignId: string) {
    super(worldId, campaignId, 'characters', EntityType.CHARACTER as any, {
      cachingEnabled: true,
      defaultCacheTTL: 5 * 60 * 1000 // 5 minutes
    });

    // Initialize API service
    this.apiService = new CharacterAPIService();

    // Determine whether to use API or Firestore based on configuration
    this.useAPI = API_CONFIG.USE_API;
  }

  /**
   * Convert Firestore Timestamp to date string
   * @param timestamp Firestore Timestamp or date string
   * @returns Formatted date string
   */
  private convertTimestampToDateString(timestamp: any): string {
    try {
      // Handle Firestore Timestamp objects
      if (timestamp && typeof timestamp === 'object' && timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
      }
      // Handle regular Date objects
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      }
      // Handle date strings
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString();
      }
      // Fallback
      return 'Invalid Date';
    } catch (error) {
      console.error('Error converting timestamp:', error);
      return 'Invalid Date';
    }
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
  ): Promise<Character | null> {
    let character: Character | null = null;

    if (this.useAPI) {
      try {
        character = await this.apiService.getCharacter(id);
      } catch (error) {
        console.error(`Error fetching character ${id} from API:`, error);
        // Fall back to Firestore
      }
    }

    if (!character) {
      // Fall back to Firestore
      character = await super.getById(id, options);
    }

    if (character) {
      // Add entityType to the character and transform isPlayerCharacter to type
      return {
        ...character,
        entityType: EntityType.CHARACTER,
        characterType: character.isPlayerCharacter ? 'PC' : 'NPC',
        type: character.isPlayerCharacter ? 'PC' : 'NPC',
        // Convert dates to formatted date strings for React rendering
        createdAt: character.createdAt ? this.convertTimestampToDateString(character.createdAt) : undefined,
        updatedAt: character.updatedAt ? this.convertTimestampToDateString(character.updatedAt) : undefined
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
    data: Character[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    source: 'server' | 'cache';
  }> {
    if (this.useAPI) {
      try {
        const characters = await this.apiService.getAllCharacters(this.worldId, this.campaignId);

        // Apply constraints manually (simplified version)
        let filteredCharacters = [...characters];

        // Return the result
        return {
          data: filteredCharacters.slice(0, pageSize),
          lastDoc: null, // API doesn't support pagination in the same way as Firestore
          source: 'server'
        };
      } catch (error) {
        console.error(`Error fetching characters from API:`, error);
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
    data: Character,
    id?: string,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Character) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<string> {
    if (this.useAPI) {
      try {
        const character = await this.apiService.createCharacter(data, this.worldId, this.campaignId);
        return character.id!;
      } catch (error) {
        console.error(`Error creating character via API:`, error);
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
    data: Partial<Character>,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Partial<Character>) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<boolean> {
    if (this.useAPI) {
      try {
        await this.apiService.updateCharacter(id, data);
        return true;
      } catch (error) {
        console.error(`Error updating character ${id} via API:`, error);
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
        return await this.apiService.deleteCharacter(id);
      } catch (error) {
        console.error(`Error deleting character ${id} via API:`, error);
        // Fall back to Firestore
        return super.delete(id, options);
      }
    }

    // Use Firestore
    return super.delete(id, options);
  }

  /**
   * Get characters by type
   * @param type Character type (PC or NPC)
   * @param options Query options
   * @returns Array of characters with relationship counts
   */
  async getCharactersByType(
    type: 'PC' | 'NPC',
    options: {
      useCache?: boolean;
      forceServer?: boolean;
      pageSize?: number;
      startAfter?: string;
    } = {}
  ): Promise<Array<Character & { relationshipCount: number }>> {
    const constraints: QueryConstraint[] = [
      where('characterType', '==', type),
      orderBy('name', 'asc')
    ];

    return this.listEntitiesWithRelationships({
      constraints,
      pageSize: options.pageSize || 50,
      startAfter: options.startAfter,
      useCache: options.useCache,
      forceServer: options.forceServer
    });
  }

  /**
   * Get characters by player
   * @param playerId Player user ID
   * @param options Query options
   * @returns Array of characters with relationship counts
   */
  async getCharactersByPlayer(
    playerId: string,
    options: {
      useCache?: boolean;
      forceServer?: boolean;
      pageSize?: number;
      startAfter?: string;
    } = {}
  ): Promise<Array<Character & { relationshipCount: number }>> {
    const constraints: QueryConstraint[] = [
      where('playerId', '==', playerId),
      orderBy('name', 'asc')
    ];

    return this.listEntitiesWithRelationships({
      constraints,
      pageSize: options.pageSize || 50,
      startAfter: options.startAfter,
      useCache: options.useCache,
      forceServer: options.forceServer
    });
  }

  /**
   * Get characters by location
   * @param locationId Location ID
   * @param options Query options
   * @returns Array of characters with relationship counts
   */
  async getCharactersByLocation(
    locationId: string,
    options: {
      useCache?: boolean;
      forceServer?: boolean;
      pageSize?: number;
      startAfter?: string;
    } = {}
  ): Promise<Array<Character & { relationshipCount: number }>> {
    if (this.useAPI) {
      try {
        const characters = await this.apiService.getCharactersByLocation(locationId);

        // Get relationship counts for all characters
        const charactersWithCounts = await Promise.all(
          characters.map(async (character) => {
            const relationshipCount = await this.getRelationshipCount(
              character.id!,
              { useCache: options.useCache, forceServer: options.forceServer }
            );

            return {
              ...character,
              relationshipCount
            };
          })
        );

        return charactersWithCounts;
      } catch (error) {
        console.error(`Error fetching characters by location from API:`, error);
        // Fall back to Firestore
      }
    }

    // Use Firestore
    const constraints: QueryConstraint[] = [
      where('currentLocationId', '==', locationId),
      orderBy('name', 'asc')
    ];

    return this.listEntitiesWithRelationships({
      constraints,
      pageSize: options.pageSize || 50,
      startAfter: options.startAfter,
      useCache: options.useCache,
      forceServer: options.forceServer
    });
  }

  /**
   * Update character location
   * @param characterId Character ID
   * @param locationId Location ID
   * @param locationData Location data for denormalization
   * @param options Update options
   * @returns True if successful
   */
  async updateCharacterLocation(
    characterId: string,
    locationId: string,
    locationData: { name: string; type: string; },
    options: {
      offlineSupport?: boolean;
      maxRetries?: number;
    } = {}
  ): Promise<boolean> {
    const { offlineSupport = true, maxRetries = 3 } = options;

    try {
      // Use a transaction to ensure atomicity
      return await this.executeTransaction(async (transaction) => {
        // Get the character
        const character = await this.getInTransaction(transaction, characterId);

        if (!character) {
          throw new Error(`Character ${characterId} not found`);
        }

        // Update the character location
        this.updateInTransaction(transaction, characterId, {
          currentLocationId: locationId,
          currentLocation: {
            id: locationId,
            name: locationData.name,
            type: locationData.type
          }
        });

        // Check if the relationship already exists
        const existingRelationships = await this.relationshipService.getRelationshipsBetween(
          characterId,
          EntityType.CHARACTER as any,
          locationId,
          EntityType.LOCATION as any
        );

        if (existingRelationships.length > 0) {
          // Update existing relationship
          const existingRelationship = existingRelationships[0];
          this.relationshipService.updateInTransaction(
            transaction,
            existingRelationship.id!,
            {
              status: 'active',
              startDate: serverTimestamp()
            }
          );
        } else {
          // Create new relationship
          this.relationshipService.createInTransaction(
            transaction,
            {
              sourceId: characterId,
              sourceType: EntityType.CHARACTER as any,
              targetId: locationId,
              targetType: EntityType.LOCATION as any,
              relationshipType: 'located_in',
              description: `${character.name} is located in ${locationData.name}`,
              strength: 'strong',
              status: 'active',
              startDate: serverTimestamp(),
              createdBy: character.createdBy || 'system',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }
          );
        }

        return true;
      }, maxRetries);
    } catch (error) {
      console.error(`Error updating character location for ${characterId}:`, error);
      return false;
    }
  }

  /**
   * Update character inventory
   * @param characterId Character ID
   * @param itemId Item ID to add or remove
   * @param itemData Item data for denormalization
   * @param operation Add or remove
   * @param options Update options
   * @returns True if successful
   */
  async updateCharacterInventory(
    characterId: string,
    itemId: string,
    itemData: { name: string; type: string; },
    operation: 'add' | 'remove',
    options: {
      offlineSupport?: boolean;
      maxRetries?: number;
    } = {}
  ): Promise<boolean> {
    const { offlineSupport = true, maxRetries = 3 } = options;

    try {
      // Use a transaction to ensure atomicity
      return await this.executeTransaction(async (transaction) => {
        // Get the character
        const character = await this.getInTransaction(transaction, characterId);

        if (!character) {
          throw new Error(`Character ${characterId} not found`);
        }

        // Update inventory
        let inventory = character.inventory || [];

        if (operation === 'add') {
          // Check if item already exists in inventory
          if (!inventory.some(item => item.id === itemId)) {
            inventory.push({
              id: itemId,
              name: itemData.name,
              type: itemData.type
            });
          }
        } else {
          // Remove item from inventory
          inventory = inventory.filter(item => item.id !== itemId);
        }

        // Update the character
        this.updateInTransaction(transaction, characterId, { inventory });

        // Check if the relationship already exists
        const existingRelationships = await this.relationshipService.getRelationshipsBetween(
          characterId,
          EntityType.CHARACTER as any,
          itemId,
          EntityType.ITEM as any
        );

        if (operation === 'add') {
          if (existingRelationships.length > 0) {
            // Update existing relationship
            const existingRelationship = existingRelationships[0];
            this.relationshipService.updateInTransaction(
              transaction,
              existingRelationship.id!,
              {
                relationshipType: 'owns',
                status: 'active',
                strength: 'strong',
                endDate: null
              }
            );
          } else {
            // Create new relationship
            this.relationshipService.createInTransaction(
              transaction,
              {
                sourceId: characterId,
                sourceType: EntityType.CHARACTER as any,
                targetId: itemId,
                targetType: EntityType.ITEM as any,
                relationshipType: 'owns',
                description: `${character.name} owns ${itemData.name}`,
                strength: 'strong',
                status: 'active',
                startDate: serverTimestamp(),
                createdBy: character.createdBy || 'system',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              }
            );
          }
        } else if (existingRelationships.length > 0) {
          // Update relationship to mark item as no longer owned
          this.relationshipService.updateInTransaction(
            transaction,
            existingRelationships[0].id!,
            {
              status: 'inactive',
              endDate: serverTimestamp()
            }
          );
        }

        return true;
      }, maxRetries);
    } catch (error) {
      console.error(`Error updating character inventory for ${characterId}:`, error);
      return false;
    }
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
  ): Promise<Character | null> {
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
  ): Promise<Character[]> {
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

    // Add entityType to each character and transform isPlayerCharacter to type
    return data.map(character => ({
      ...character,
      entityType: EntityType.CHARACTER,
      characterType: character.isPlayerCharacter ? 'PC' : 'NPC',
      type: character.isPlayerCharacter ? 'PC' : 'NPC',
      // Convert dates to formatted date strings for React rendering
      createdAt: character.createdAt ? this.convertTimestampToDateString(character.createdAt) : undefined,
      updatedAt: character.updatedAt ? this.convertTimestampToDateString(character.updatedAt) : undefined
    }));
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
    data: Partial<Character>,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Partial<Character>) => boolean | string;
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
   * Create entity (alias for create for compatibility)
   * @param data Entity data
   * @param options Options for the operation
   * @returns Entity ID
   */
  async createEntity(
    data: Character,
    options: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Character) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    } = {}
  ): Promise<string> {
    return this.create(data, undefined, options);
  }
}


