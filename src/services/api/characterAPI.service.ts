import axios, { AxiosInstance } from 'axios';
import { Character } from '../character.service';
import { handleApiError } from '../../utils/error-handler';
import { API_CONFIG, API_ENDPOINTS } from '../../config/api.config';

/**
 * Character API Service
 * Handles communication with the backend API for character operations
 */
export class CharacterAPIService {
  private apiClient: AxiosInstance;

  /**
   * Create a new CharacterAPIService
   */
  constructor() {
    this.apiClient = axios.create({
      baseURL: `${API_CONFIG.BASE_URL}${API_ENDPOINTS.CHARACTERS}`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: API_CONFIG.TIMEOUT
    });

    // Add request interceptor for authentication
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Get all characters
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns Promise with array of characters
   */
  async getAllCharacters(worldId: string, campaignId: string): Promise<Character[]> {
    try {
      const response = await this.apiClient.get('/', {
        params: {
          world_id: worldId,
          campaign_id: campaignId
        }
      });
      return this.transformCharactersFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch characters');
    }
  }

  /**
   * Get character by ID
   * @param id Character ID
   * @returns Promise with character
   */
  async getCharacter(id: string): Promise<Character> {
    try {
      const response = await this.apiClient.get(`/${id}`);
      return this.transformCharacterFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch character');
    }
  }

  /**
   * Create character
   * @param character Character data
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns Promise with created character
   */
  async createCharacter(
    character: Omit<Character, 'id'>,
    worldId: string,
    campaignId: string
  ): Promise<Character> {
    try {
      const apiCharacter = this.transformCharacterToAPI(character, worldId, campaignId);
      const response = await this.apiClient.post('/', apiCharacter);
      return this.transformCharacterFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to create character');
    }
  }

  /**
   * Update character
   * @param id Character ID
   * @param character Character data
   * @returns Promise with updated character
   */
  async updateCharacter(id: string, character: Partial<Character>): Promise<Character> {
    try {
      const apiCharacter = this.transformPartialCharacterToAPI(character);
      const response = await this.apiClient.put(`/${id}`, apiCharacter);
      return this.transformCharacterFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to update character');
    }
  }

  /**
   * Delete character
   * @param id Character ID
   * @returns Promise with success status
   */
  async deleteCharacter(id: string): Promise<boolean> {
    try {
      const response = await this.apiClient.delete(`/${id}`);
      return response.data.success;
    } catch (error) {
      throw handleApiError(error, 'Failed to delete character');
    }
  }

  /**
   * Get characters by location
   * @param locationId Location ID
   * @returns Promise with array of characters
   */
  async getCharactersByLocation(locationId: string): Promise<Character[]> {
    try {
      const response = await this.apiClient.get(`/location/${locationId}`);
      return this.transformCharactersFromAPI(response.data.data);
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch characters by location');
    }
  }

  /**
   * Transform character from API format to application format
   * @param apiCharacter Character in API format
   * @returns Character in application format
   */
  private transformCharacterFromAPI(apiCharacter: any): Character {
    return {
      id: apiCharacter.id,
      name: apiCharacter.name,
      description: apiCharacter.description || '',
      race: apiCharacter.race || '',
      class: apiCharacter.class || '',
      level: apiCharacter.level || undefined,
      background: apiCharacter.background || '',
      alignment: apiCharacter.alignment || '',
      // Use characterType instead of type to match database schema
      characterType: apiCharacter.is_player_character ? 'PC' : 'NPC',
      isPlayerCharacter: apiCharacter.is_player_character || false,
      appearance: apiCharacter.appearance || '',
      personality: apiCharacter.personality || '',
      goals: apiCharacter.goals || '',
      secrets: apiCharacter.secrets || '',
      notes: apiCharacter.notes || '',
      status: apiCharacter.status || 'alive',
      imageURL: apiCharacter.image_url || '',
      playerId: apiCharacter.player_id || '',
      stats: apiCharacter.stats || {},
      inventory: apiCharacter.inventory || [],
      currentLocationId: apiCharacter.current_location_id || '',
      currentLocation: apiCharacter.current_location || undefined,
      createdAt: apiCharacter.created_at ? new Date(apiCharacter.created_at) : new Date(),
      updatedAt: apiCharacter.updated_at ? new Date(apiCharacter.updated_at) : new Date(),
      worldId: apiCharacter.world_id || '',
      campaignId: apiCharacter.campaign_id || '',
      createdBy: apiCharacter.created_by || 'system'
    };
  }

  /**
   * Transform characters from API format to application format
   * @param apiCharacters Characters in API format
   * @returns Characters in application format
   */
  private transformCharactersFromAPI(apiCharacters: any[]): Character[] {
    return apiCharacters.map(apiCharacter => this.transformCharacterFromAPI(apiCharacter));
  }

  /**
   * Transform character to API format
   * @param character Character in application format
   * @param worldId World ID
   * @param campaignId Campaign ID
   * @returns Character in API format
   */
  private transformCharacterToAPI(
    character: Omit<Character, 'id'>,
    worldId: string,
    campaignId: string
  ): any {
    return {
      name: character.name,
      description: character.description,
      race: character.race,
      class: character.class,
      level: character.level,
      background: character.background,
      alignment: character.alignment,
      // Use characterType instead of type
      is_player_character: character.characterType === 'PC' || character.isPlayerCharacter,
      appearance: character.appearance,
      personality: character.personality,
      goals: character.goals,
      secrets: character.secrets,
      notes: character.notes,
      status: character.status,
      image_url: character.imageURL,
      player_id: character.playerId,
      stats: character.stats,
      inventory: character.inventory,
      current_location_id: character.currentLocationId,
      world_id: worldId,
      campaign_id: campaignId
    };
  }

  /**
   * Transform partial character to API format
   * @param character Partial character in application format
   * @returns Partial character in API format
   */
  private transformPartialCharacterToAPI(character: Partial<Character>): any {
    const apiCharacter: any = {};

    if (character.name !== undefined) apiCharacter.name = character.name;
    if (character.description !== undefined) apiCharacter.description = character.description;
    if (character.race !== undefined) apiCharacter.race = character.race;
    if (character.class !== undefined) apiCharacter.class = character.class;
    if (character.level !== undefined) apiCharacter.level = character.level;
    if (character.background !== undefined) apiCharacter.background = character.background;
    if (character.alignment !== undefined) apiCharacter.alignment = character.alignment;
    if (character.characterType !== undefined) apiCharacter.is_player_character = character.characterType === 'PC';
    if (character.isPlayerCharacter !== undefined) apiCharacter.is_player_character = character.isPlayerCharacter;
    if (character.appearance !== undefined) apiCharacter.appearance = character.appearance;
    if (character.personality !== undefined) apiCharacter.personality = character.personality;
    if (character.goals !== undefined) apiCharacter.goals = character.goals;
    if (character.secrets !== undefined) apiCharacter.secrets = character.secrets;
    if (character.notes !== undefined) apiCharacter.notes = character.notes;
    if (character.status !== undefined) apiCharacter.status = character.status;
    if (character.imageURL !== undefined) apiCharacter.image_url = character.imageURL;
    if (character.playerId !== undefined) apiCharacter.player_id = character.playerId;
    if (character.stats !== undefined) apiCharacter.stats = character.stats;
    if (character.inventory !== undefined) apiCharacter.inventory = character.inventory;
    if (character.currentLocationId !== undefined) apiCharacter.current_location_id = character.currentLocationId;

    return apiCharacter;
  }
}
