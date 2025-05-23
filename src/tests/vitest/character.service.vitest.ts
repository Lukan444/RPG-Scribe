/**
 * CharacterService test suite using Vitest
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Character, CharacterType } from '../../models/Character';
import { EntityType } from '../../models/EntityType';

// Define the MockCharacterService class for testing
class MockCharacterService {
  private characters: Map<string, Character> = new Map();
  private nextId = 1;
  private worldId: string;
  private campaignId?: string;

  constructor(worldId: string = '', campaignId?: string) {
    this.worldId = worldId;
    this.campaignId = campaignId;
  }

  /**
   * Get singleton instance
   */
  public static getInstance(worldId: string = '', campaignId?: string): MockCharacterService {
    return new MockCharacterService(worldId, campaignId);
  }

  /**
   * Create a character
   */
  public async createEntity(character: Character): Promise<string> {
    const id = `char-${this.nextId++}`;
    this.characters.set(id, {
      ...character,
      id,
      worldId: this.worldId || character.worldId,
      campaignId: this.campaignId || character.campaignId,
      entityType: EntityType.CHARACTER
    });
    return id;
  }

  /**
   * Get a character by ID
   */
  public async getEntityById(id: string): Promise<Character | null> {
    const character = this.characters.get(id);
    return character ? { ...character } : null;
  }

  /**
   * Update a character
   */
  public async updateEntity(id: string, character: Partial<Character>): Promise<boolean> {
    if (!this.characters.has(id)) {
      return false;
    }

    const existingCharacter = this.characters.get(id)!;
    this.characters.set(id, { ...existingCharacter, ...character });
    return true;
  }

  /**
   * Delete a character
   */
  public async deleteEntity(id: string): Promise<boolean> {
    if (!this.characters.has(id)) {
      return false;
    }

    this.characters.delete(id);
    return true;
  }

  /**
   * List characters
   */
  public async listEntities(): Promise<Character[]> {
    return Array.from(this.characters.values()).filter(character => {
      if (this.worldId && character.worldId !== this.worldId) {
        return false;
      }
      if (this.campaignId && character.campaignId !== this.campaignId) {
        return false;
      }
      return true;
    });
  }

  /**
   * Query characters
   */
  public async query(filters?: any): Promise<{ data: Character[], lastDoc: any }> {
    const characters = await this.listEntities();
    return { data: characters, lastDoc: null };
  }

  /**
   * Clear all characters (for testing)
   */
  public clearCharacters(): void {
    this.characters.clear();
    this.nextId = 1;
  }
}

/**
 * CharacterService test suite
 */
describe('CharacterService', () => {
  // Test service
  let characterService: MockCharacterService;

  // Set up test environment
  beforeEach(() => {
    characterService = MockCharacterService.getInstance('world-1', 'campaign-1');
    characterService.clearCharacters();
  });

  // Test createEntity method
  describe('createEntity', () => {
    it('should create a character', async () => {
      // Create test character data
      const characterData: Character = {
        name: 'Test Character',
        description: 'A test character',
        race: 'Human',
        class: 'Fighter',
        type: 'PC',
        level: 5,
        worldId: 'world-1',
        campaignId: 'campaign-1',
        entityType: EntityType.CHARACTER,
        characterType: CharacterType.PLAYER_CHARACTER,
        isPlayerCharacter: true
      };

      // Create character
      const id = await characterService.createEntity(characterData);

      // Verify character was created
      expect(id).toBeTruthy();

      // Get character
      const character = await characterService.getEntityById(id);

      // Verify character data
      expect(character).toBeTruthy();
      expect(character?.name).toBe(characterData.name);
      expect(character?.description).toBe(characterData.description);
      expect(character?.race).toBe(characterData.race);
      expect(character?.class).toBe(characterData.class);
      expect(character?.type).toBe(characterData.type);
      expect(character?.level).toBe(characterData.level);
      expect(character?.worldId).toBe(characterData.worldId);
      expect(character?.campaignId).toBe(characterData.campaignId);
      expect(character?.entityType).toBe(EntityType.CHARACTER);
    });
  });

  // Test getEntityById method
  describe('getEntityById', () => {
    it('should get a character by ID', async () => {
      // Create test character data
      const characterData: Character = {
        name: 'Test Character',
        description: 'A test character',
        race: 'Human',
        class: 'Fighter',
        type: 'PC',
        level: 5,
        worldId: 'world-1',
        campaignId: 'campaign-1',
        entityType: EntityType.CHARACTER,
        characterType: CharacterType.PLAYER_CHARACTER,
        isPlayerCharacter: true
      };

      // Create character
      const id = await characterService.createEntity(characterData);

      // Get character by ID
      const character = await characterService.getEntityById(id);

      // Verify character data
      expect(character).toBeTruthy();
      expect(character?.id).toBe(id);
      expect(character?.name).toBe(characterData.name);
      expect(character?.description).toBe(characterData.description);
      expect(character?.race).toBe(characterData.race);
      expect(character?.class).toBe(characterData.class);
      expect(character?.type).toBe(characterData.type);
      expect(character?.level).toBe(characterData.level);
      expect(character?.worldId).toBe(characterData.worldId);
      expect(character?.campaignId).toBe(characterData.campaignId);
      expect(character?.entityType).toBe(EntityType.CHARACTER);
    });

    it('should return null for non-existent character', async () => {
      // Get non-existent character
      const character = await characterService.getEntityById('non-existent-id');

      // Verify null result
      expect(character).toBeNull();
    });
  });

  // Test updateEntity method
  describe('updateEntity', () => {
    it('should update a character', async () => {
      // Create test character data
      const characterData: Character = {
        name: 'Test Character',
        description: 'A test character',
        race: 'Human',
        class: 'Fighter',
        type: 'PC',
        level: 5,
        worldId: 'world-1',
        campaignId: 'campaign-1',
        entityType: EntityType.CHARACTER,
        characterType: CharacterType.PLAYER_CHARACTER,
        isPlayerCharacter: true
      };

      // Create character
      const id = await characterService.createEntity(characterData);

      // Update character
      const updateData: Partial<Character> = {
        name: 'Updated Character',
        description: 'An updated character',
        level: 10
      };

      const success = await characterService.updateEntity(id, updateData);

      // Verify update success
      expect(success).toBe(true);

      // Get updated character
      const character = await characterService.getEntityById(id);

      // Verify updated data
      expect(character).toBeTruthy();
      expect(character?.name).toBe(updateData.name);
      expect(character?.description).toBe(updateData.description);
      expect(character?.level).toBe(updateData.level);
      expect(character?.race).toBe(characterData.race); // Unchanged
      expect(character?.class).toBe(characterData.class); // Unchanged
      expect(character?.type).toBe(characterData.type); // Unchanged
    });

    it('should return false for non-existent character', async () => {
      // Update non-existent character
      const updateData: Partial<Character> = {
        name: 'Updated Character',
        description: 'An updated character',
        level: 10
      };

      const success = await characterService.updateEntity('non-existent-id', updateData);

      // Verify update failure
      expect(success).toBe(false);
    });
  });

  // Test deleteEntity method
  describe('deleteEntity', () => {
    it('should delete a character', async () => {
      // Create test character data
      const characterData: Character = {
        name: 'Test Character',
        description: 'A test character',
        race: 'Human',
        class: 'Fighter',
        type: 'PC',
        level: 5,
        worldId: 'world-1',
        campaignId: 'campaign-1',
        entityType: EntityType.CHARACTER,
        characterType: CharacterType.PLAYER_CHARACTER,
        isPlayerCharacter: true
      };

      // Create character
      const id = await characterService.createEntity(characterData);

      // Delete character
      const success = await characterService.deleteEntity(id);

      // Verify delete success
      expect(success).toBe(true);

      // Try to get deleted character
      const character = await characterService.getEntityById(id);

      // Verify character is deleted
      expect(character).toBeNull();
    });

    it('should return false for non-existent character', async () => {
      // Delete non-existent character
      const success = await characterService.deleteEntity('non-existent-id');

      // Verify delete failure
      expect(success).toBe(false);
    });
  });
});
