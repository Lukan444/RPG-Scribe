/**
 * CharacterAPIService Tests using Vitest
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CharacterAPIService } from '../../services/api/characterAPI.service';
import axios from 'axios';

// Mock axios
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn()
      }
    }
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      isAxiosError: vi.fn((error) => !!error.response)
    },
    isAxiosError: vi.fn((error) => !!error.response)
  };
});

describe('CharacterAPIService', () => {
  let characterAPIService: CharacterAPIService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a new CharacterAPIService instance
    characterAPIService = new CharacterAPIService();

    // Get the mock axios instance
    mockAxiosInstance = axios.create();
  });

  describe('CRUD operations', () => {
    it('should get all characters', async () => {
      // Setup mock response
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'char-1',
              name: 'Gandalf',
              description: 'A wise wizard',
              race: 'Maiar',
              class: 'Wizard',
              type: 'NPC',
              status: 'alive'
            },
            {
              id: 'char-2',
              name: 'Frodo',
              description: 'A brave hobbit',
              race: 'Hobbit',
              class: 'Rogue',
              type: 'PC',
              status: 'alive'
            }
          ]
        }
      };

      // Setup mock implementation
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      // Call the method
      const result = await characterAPIService.getAllCharacters('world-1', 'campaign-1');

      // Assertions
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('char-1');
      expect(result[0].name).toBe('Gandalf');
      expect(result[1].id).toBe('char-2');
      expect(result[1].name).toBe('Frodo');
    });

    it('should get a character by ID', async () => {
      // Setup mock response
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'char-1',
            name: 'Gandalf',
            description: 'A wise wizard',
            race: 'Maiar',
            class: 'Wizard',
            type: 'NPC',
            status: 'alive'
          }
        }
      };

      // Setup mock implementation
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      // Call the method
      const result = await characterAPIService.getCharacter('char-1');

      // Assertions
      expect(result).toBeDefined();
      expect(result.id).toBe('char-1');
      expect(result.name).toBe('Gandalf');
      expect(result.race).toBe('Maiar');
      expect(result.class).toBe('Wizard');
    });

    it('should create a new character', async () => {
      // Setup mock response
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'char-3',
            name: 'Aragorn',
            description: 'A ranger from the North',
            race: 'Human',
            class: 'Ranger',
            type: 'PC',
            status: 'alive'
          }
        }
      };

      // Setup mock implementation
      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      // Call the method
      const newCharacter = {
        name: 'Aragorn',
        description: 'A ranger from the North',
        race: 'Human',
        class: 'Ranger',
        characterType: 'PC',
        status: 'alive',
        createdBy: 'user-1'
      };

      const result = await characterAPIService.createCharacter(
        newCharacter,
        'world-1',
        'campaign-1'
      );

      // Assertions
      expect(result).toBeDefined();
      expect(result.id).toBe('char-3');
      expect(result.name).toBe('Aragorn');
      expect(result.race).toBe('Human');
      expect(result.class).toBe('Ranger');
    });

    it('should update a character', async () => {
      // Setup mock response
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'char-1',
            name: 'Gandalf the White',
            description: 'A more powerful wizard',
            race: 'Maiar',
            class: 'Wizard',
            type: 'NPC',
            status: 'alive'
          }
        }
      };

      // Setup mock implementation
      mockAxiosInstance.put.mockResolvedValueOnce(mockResponse);

      // Call the method
      const updatedData = {
        name: 'Gandalf the White',
        description: 'A more powerful wizard'
      };

      const result = await characterAPIService.updateCharacter('char-1', updatedData);

      // Assertions
      expect(result).toBeDefined();
      expect(result.id).toBe('char-1');
      expect(result.name).toBe('Gandalf the White');
      expect(result.description).toBe('A more powerful wizard');
    });

    it('should delete a character', async () => {
      // Setup mock response
      const mockResponse = {
        data: {
          success: true
        }
      };

      // Setup mock implementation
      mockAxiosInstance.delete.mockResolvedValueOnce(mockResponse);

      // Call the method
      const result = await characterAPIService.deleteCharacter('char-1');

      // Assertions
      expect(result).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle 404 error when getting a non-existent character', async () => {
      // Setup mock implementation
      mockAxiosInstance.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: {
            success: false,
            error: 'Character not found'
          }
        }
      });

      // Call the method and expect it to throw
      await expect(characterAPIService.getCharacter('non-existent')).rejects.toThrow('Character not found');
    });

    it('should handle network errors', async () => {
      // Setup mock implementation
      mockAxiosInstance.get.mockRejectedValueOnce({
        message: 'Network Error',
        response: undefined
      });

      // Call the method and expect it to throw
      await expect(characterAPIService.getAllCharacters('world-1', 'campaign-1')).rejects.toThrow('Failed to fetch characters');
    });
  });
});
