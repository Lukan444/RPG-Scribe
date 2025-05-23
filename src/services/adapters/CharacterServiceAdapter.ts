/**
 * Character Service Adapter
 *
 * This adapter wraps the CharacterService to implement the IEntityService interface.
 */

import { DocumentData, DocumentSnapshot, QueryConstraint, QueryDocumentSnapshot } from 'firebase/firestore';
import { Character } from '../../models/Character';
import { EntityType } from '../../models/EntityType';
import { CharacterService } from '../character.service';
import { IEntityService } from '../interfaces/EntityService.interface';
import { CountOptions } from '../enhanced-firestore.service';

/**
 * Character service adapter class
 */
export class CharacterServiceAdapter implements IEntityService<Character> {
  private characterService: CharacterService;
  private worldId: string;
  private campaignId: string;

  /**
   * Create a new CharacterServiceAdapter
   * @param worldId World ID
   * @param campaignId Campaign ID
   */
  constructor(worldId: string, campaignId: string) {
    this.characterService = CharacterService.getInstance(worldId, campaignId);
    this.worldId = worldId;
    this.campaignId = campaignId;
  }

  /**
   * Get the entity type
   * @returns Entity type
   */
  getEntityType(): EntityType {
    return EntityType.CHARACTER;
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
   * Get a character by ID
   * @param id Character ID
   * @param options Options for the operation
   * @returns Character data or null if not found
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
  ): Promise<Character | null> {
    const character = await this.characterService.getById(id, options);

    if (character) {
      // Convert from service Character to model Character
      return {
        ...character,
        entityType: EntityType.CHARACTER,
        type: character.characterType || 'Other'
      } as Character;
    }

    return null;
  }

  /**
   * Get multiple characters by their IDs
   * @param ids Array of character IDs
   * @returns Array of character data
   */
  async getByIds(ids: string[]): Promise<Character[]> {
    const characters = await this.characterService.getByIds(ids);

    // Convert from service Character to model Character
    return characters.map(character => ({
      ...character,
      entityType: EntityType.CHARACTER,
      type: character.characterType || 'Other'
    } as Character));
  }

  /**
   * Create a new character
   * @param data Character data
   * @param id Document ID (optional)
   * @param options Options for the operation
   * @returns Character ID
   */
  async create(
    data: Character,
    id?: string,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Character) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    }
  ): Promise<string> {
    // Convert from model Character to service Character
    const serviceCharacter = {
      ...data,
      characterType: data.type || 'Other',
      status: 'alive', // Default status
      worldId: this.worldId,
      campaignId: this.campaignId
    };

    // We need to use any type to bypass TypeScript's type checking
    // since the service and model types are incompatible
    return this.characterService.create(serviceCharacter as any, id, options as any);
  }

  /**
   * Update a character
   * @param id Character ID
   * @param data Character data to update
   * @param options Options for the operation
   * @returns True if successful
   */
  async update(
    id: string,
    data: Partial<Character>,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
    }
  ): Promise<boolean> {
    // Convert from model Character to service Character
    const serviceCharacterData: any = { ...data };

    // Map type to characterType if present
    if (data.type !== undefined) {
      serviceCharacterData.characterType = data.type;
      delete serviceCharacterData.type;
    }

    return this.characterService.update(id, serviceCharacterData, options);
  }

  /**
   * Delete a character
   * @param id Character ID
   * @param options Options for the operation
   * @returns True if successful
   */
  async delete(
    id: string,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
    }
  ): Promise<boolean> {
    return this.characterService.delete(id, options);
  }

  /**
   * Query characters with pagination
   * @param constraints Query constraints (where, orderBy, etc.)
   * @param pageSize Number of characters to return
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
    data: Character[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    source: 'server' | 'cache';
  }> {
    const result = await this.characterService.query(constraints, pageSize, startAfterDoc, options);

    // Convert from service Character to model Character
    const convertedData = result.data.map(character => ({
      ...character,
      entityType: EntityType.CHARACTER,
      type: character.characterType || 'Other'
    } as Character));

    return {
      ...result,
      data: convertedData
    };
  }

  /**
   * Get the count of characters matching the constraints
   * @param queryName Name of the query for caching
   * @param constraints Query constraints
   * @param options Count options
   * @returns Count of matching characters
   */
  async getCount(
    queryName: string,
    constraints?: QueryConstraint[],
    options?: CountOptions
  ): Promise<number> {
    return this.characterService.getCount(queryName, constraints, options);
  }

  /**
   * Get the relationship count for a character
   * @param entityId Character ID
   * @param options Count options
   * @returns Relationship count
   */
  async getRelationshipCount(
    entityId: string,
    options?: CountOptions
  ): Promise<number> {
    // This is a placeholder implementation
    return 0;
  }

  /**
   * List all characters (alias for query for compatibility)
   * @param options Query options
   * @returns Array of characters
   */
  async listEntities(
    options?: {
      forceServer?: boolean;
      source?: 'default' | 'server' | 'cache';
      useCache?: boolean;
      cacheTTL?: number;
      pageSize?: number;
    }
  ): Promise<Character[]> {
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
   * Create character (alias for create for compatibility)
   * @param data Character data
   * @param options Options for the operation
   * @returns Character ID
   */
  async createEntity(
    data: Character,
    options?: {
      forceServer?: boolean;
      offlineSupport?: boolean;
      maxRetries?: number;
      validateData?: (data: Character) => boolean | string;
      skipTransform?: boolean;
      skipValidation?: boolean;
      trackPerformance?: boolean;
    }
  ): Promise<string> {
    return this.create(data, undefined, options);
  }

  /**
   * Subscribe to real-time updates for a character
   * @param id Character ID
   * @param callback Function to call when character changes
   * @param options Options for the subscription
   * @returns Unsubscribe function
   */
  subscribeToEntity(
    id: string,
    callback: (data: Character | null) => void,
    options?: {
      listenerId?: string;
      onError?: (error: Error) => void;
    }
  ): () => void {
    // Create a wrapper callback that converts the service Character to model Character
    const wrappedCallback = (character: any | null) => {
      if (character) {
        const modelCharacter = {
          ...character,
          entityType: EntityType.CHARACTER,
          type: character.characterType || 'Other'
        } as Character;
        callback(modelCharacter);
      } else {
        callback(null);
      }
    };

    return this.characterService.subscribeToDocument(id, wrappedCallback, options);
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
    callback: (data: Character[]) => void,
    options?: {
      queryId?: string;
      listenerId?: string;
      onError?: (error: Error) => void;
    }
  ): () => void {
    // Create a wrapper callback that converts the service Characters to model Characters
    const wrappedCallback = (characters: any[]) => {
      const modelCharacters = characters.map(character => ({
        ...character,
        entityType: EntityType.CHARACTER,
        type: character.characterType || 'Other'
      } as Character));

      callback(modelCharacters);
    };

    return this.characterService.subscribeToQuery(constraints, wrappedCallback, options);
  }
}
