/**
 * Mock CharacterAPIService for testing
 */
import { Character } from '../../models/Character';
import { CharacterType } from '../../models/Character';
import { EntityType } from '../../models/EntityType';
import { API_CONFIG } from '../../config/api.config';

/**
 * Mock CharacterAPIService for testing
 */
export class MockCharacterAPIService {
  /**
   * Get all characters
   */
  async getAllCharacters(worldId?: string, campaignId?: string): Promise<Character[]> {
    return [
      {
        id: 'char-1',
        name: 'Gandalf',
        description: 'A wizard',
        race: 'Maiar',
        class: 'Wizard',
        type: 'NPC',
        worldId: 'world-1',
        campaignId: 'campaign-1',
        createdBy: 'user-1',
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date('2023-01-01T00:00:00.000Z'),
        entityType: EntityType.CHARACTER,
        characterType: CharacterType.NPC,
        isPlayerCharacter: false
      },
      {
        id: 'char-2',
        name: 'Frodo',
        description: 'A hobbit',
        race: 'Hobbit',
        class: 'Rogue',
        type: 'PC',
        worldId: 'world-1',
        campaignId: 'campaign-1',
        createdBy: 'user-1',
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date('2023-01-01T00:00:00.000Z'),
        entityType: EntityType.CHARACTER,
        characterType: CharacterType.PLAYER_CHARACTER,
        isPlayerCharacter: true
      }
    ];
  }

  /**
   * Get a character by ID
   */
  async getCharacter(id: string): Promise<Character> {
    if (id === 'non-existent') {
      throw new Error('Character not found');
    }

    return {
      id: 'char-1',
      name: 'Gandalf',
      description: 'A wizard',
      race: 'Maiar',
      class: 'Wizard',
      type: 'NPC',
      worldId: 'world-1',
      campaignId: 'campaign-1',
      createdBy: 'user-1',
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      updatedAt: new Date('2023-01-01T00:00:00.000Z'),
      entityType: EntityType.CHARACTER,
      characterType: CharacterType.NPC,
      isPlayerCharacter: false
    };
  }

  /**
   * Create a new character
   */
  async createCharacter(
    character: Partial<Character>,
    worldId: string,
    campaignId: string
  ): Promise<Character> {
    return {
      id: 'char-3',
      ...character,
      worldId,
      campaignId,
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      entityType: EntityType.CHARACTER,
      characterType: character.characterType || CharacterType.NPC,
      isPlayerCharacter: character.isPlayerCharacter !== undefined ? character.isPlayerCharacter : false
    } as Character;
  }

  /**
   * Update a character
   */
  async updateCharacter(id: string, character: Partial<Character>): Promise<Character> {
    if (id === 'non-existent') {
      throw new Error('Character not found');
    }

    return {
      id,
      name: character.name || 'Gandalf',
      description: character.description || 'A wizard',
      race: 'Maiar',
      class: 'Wizard',
      type: 'NPC',
      worldId: 'world-1',
      campaignId: 'campaign-1',
      createdBy: 'user-1',
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      updatedAt: new Date(),
      entityType: EntityType.CHARACTER,
      characterType: character.characterType || CharacterType.NPC,
      isPlayerCharacter: character.isPlayerCharacter !== undefined ? character.isPlayerCharacter : false
    };
  }

  /**
   * Delete a character
   */
  async deleteCharacter(id: string): Promise<boolean> {
    if (id === 'non-existent') {
      throw new Error('Character not found');
    }

    return true;
  }

  /**
   * Get characters by location
   */
  async getCharactersByLocation(locationId: string): Promise<Character[]> {
    return [
      {
        id: 'char-1',
        name: 'Gandalf',
        description: 'A wizard',
        race: 'Maiar',
        class: 'Wizard',
        type: 'NPC',
        worldId: 'world-1',
        campaignId: 'campaign-1',
        createdBy: 'user-1',
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date('2023-01-01T00:00:00.000Z'),
        entityType: EntityType.CHARACTER,
        characterType: CharacterType.NPC,
        isPlayerCharacter: false
      }
    ];
  }
}
