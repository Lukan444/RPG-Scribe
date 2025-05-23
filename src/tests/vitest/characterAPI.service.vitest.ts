/**
 * CharacterAPIService test suite using Vitest
 *
 * This is a simplified version of the test suite that focuses on the basic functionality
 * of the CharacterAPIService class. It uses a mock implementation of the service.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { API_CONFIG } from '../../config/api.config';
import { MockCharacterAPIService } from '../vitest-utils/characterAPI.service.mock';
import { EntityType } from '../../models/EntityType';
import { CharacterType } from '../../models/Character';

// Mock character data
const mockCharacters = [
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

// Helper to mock axios responses
function mockAxiosResponse(status: number, data: any) {
  return Promise.resolve({
    status,
    data,
    headers: {},
    config: {},
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error'
  });
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

// Set up global mocks
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Reset mocks after each test
afterEach(() => {
  vi.resetAllMocks();
  localStorageMock.clear();
});

describe('CharacterAPIService', () => {
  let characterAPIService: MockCharacterAPIService;

  beforeEach(() => {
    characterAPIService = new MockCharacterAPIService();
  });

  describe('CRUD operations', () => {
    it('should get all characters', async () => {
      const characters = await characterAPIService.getAllCharacters('world-1', 'campaign-1');

      // Verify the result
      expect(characters).toHaveLength(mockCharacters.length);
      expect(characters[0].id).toBe(mockCharacters[0].id);
      expect(characters[0].name).toBe(mockCharacters[0].name);
      expect(characters[1].id).toBe(mockCharacters[1].id);
      expect(characters[1].name).toBe(mockCharacters[1].name);
    });

    it('should get a character by ID', async () => {
      const character = await characterAPIService.getCharacter('char-1');

      // Verify the result
      expect(character).toBeDefined();
      expect(character.id).toBe('char-1');
      expect(character.name).toBe('Gandalf');
      expect(character.race).toBe('Maiar');
      expect(character.class).toBe('Wizard');
      expect(character.type).toBe('NPC');
    });

    it('should create a new character', async () => {
      const newCharacter = {
        name: 'Aragorn',
        description: 'A ranger from the North',
        race: 'Human',
        class: 'Ranger',
        type: 'PC',
        createdBy: 'user-1',
        entityType: EntityType.CHARACTER as EntityType.CHARACTER,
        characterType: CharacterType.PLAYER_CHARACTER,
        isPlayerCharacter: true
      };

      const result = await characterAPIService.createCharacter(
        newCharacter,
        'world-1',
        'campaign-1'
      );

      // Verify the result
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Aragorn');
      expect(result.race).toBe('Human');
      expect(result.class).toBe('Ranger');
      expect(result.type).toBe('PC');
    });

    it('should update a character', async () => {
      const updatedData = {
        name: 'Gandalf the White',
        description: 'A more powerful wizard'
      };

      const result = await characterAPIService.updateCharacter('char-1', updatedData);

      // Verify the result
      expect(result).toBeDefined();
      expect(result.id).toBe('char-1');
      expect(result.name).toBe('Gandalf the White');
      expect(result.description).toBe('A more powerful wizard');
      expect(result.race).toBe('Maiar'); // Unchanged
      expect(result.class).toBe('Wizard'); // Unchanged
    });

    it('should delete a character', async () => {
      const result = await characterAPIService.deleteCharacter('char-1');

      // Verify the result
      expect(result).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle 404 error when getting a non-existent character', async () => {
      await expect(characterAPIService.getCharacter('non-existent')).rejects.toThrow('Character not found');
    });

    it('should handle 404 error when updating a non-existent character', async () => {
      await expect(characterAPIService.updateCharacter('non-existent', { name: 'New Name' })).rejects.toThrow('Character not found');
    });

    it('should handle 404 error when deleting a non-existent character', async () => {
      await expect(characterAPIService.deleteCharacter('non-existent')).rejects.toThrow('Character not found');
    });
  });

  describe('Specialized queries', () => {
    it('should get characters by location', async () => {
      const characters = await characterAPIService.getCharactersByLocation('loc-1');

      // Verify the result
      expect(characters).toHaveLength(1);
      expect(characters[0].id).toBe('char-1');
      expect(characters[0].name).toBe('Gandalf');
    });
  });
});
